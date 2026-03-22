import os
import uuid
import time
import traceback
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from image_processor import ImageProcessor
from skin_tone_classifier import SkinToneClassifier
from recommendation_engine import RecommendationEngine

# ============================================
# CONFIG
# ============================================
SECRET_KEY = "styleguru-secret-key-change-in-production-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

UPLOAD_DIR = Path("/tmp/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# ============================================
# FAKE DATABASE (for MVP — replace with real DB later)
# ============================================
fake_users_db = {
    "demo@styleguru.com": {
        "email": "demo@styleguru.com",
        "full_name": "Demo User",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        "analysis_history": []
    }
}

# ============================================
# MODELS
# ============================================
class UserRegister(BaseModel):
    email: str
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_name: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ============================================
# AUTH SETUP
# ============================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_user(email: str):
    return fake_users_db.get(email)

def authenticate_user(email: str, password: str):
    user = get_user(email)
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Login expired ya invalid hai. Dobara login karo.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = get_user(token_data.email)
    if user is None:
        raise credentials_exception
    return user

# ============================================
# APP INIT
# ============================================
app = FastAPI(
    title="StyleGuru API",
    description="AI-powered fashion recommendation based on skin tone",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

image_processor = ImageProcessor()
skin_classifier = SkinToneClassifier()
recommendation_engine = RecommendationEngine()

# ============================================
# ROUTES — AUTH
# ============================================

@app.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    """Register a new user"""

    # Check if email already exists
    if user_data.email in fake_users_db:
        raise HTTPException(
            status_code=400,
            detail="Yeh email already registered hai. Login karo ya doosra email use karo."
        )

    # Validate email format
    if "@" not in user_data.email or "." not in user_data.email:
        raise HTTPException(status_code=400, detail="Valid email address dalo.")

    # Validate password length
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password kam se kam 6 characters ka hona chahiye.")

    # Validate name
    if len(user_data.full_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Apna poora naam dalo.")

    # Save user
    hashed_password = get_password_hash(user_data.password)
    fake_users_db[user_data.email] = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": hashed_password,
        "analysis_history": []
    }

    # Create token
    access_token = create_access_token(
        data={"sub": user_data.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_name": user_data.full_name,
        "email": user_data.email
    }


@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    """Login with email and password"""
    user = authenticate_user(user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email ya password galat hai. Dobara try karo."
        )

    access_token = create_access_token(
        data={"sub": user_data.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_name": user["full_name"],
        "email": user_data.email
    }


@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current logged in user info"""
    return {
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "total_analyses": len(current_user.get("analysis_history", []))
    }


@app.get("/auth/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    """Get user's past analysis history"""
    history = current_user.get("analysis_history", [])
    return {
        "total": len(history),
        "history": history[-10:]  # Last 10 analyses
    }


# ============================================
# ROUTES — HEALTH CHECK
# ============================================

@app.get("/")
async def root():
    return {
        "status": "running",
        "app": "StyleGuru API",
        "version": "1.0.0",
        "message": "Welcome to StyleGuru!"
    }


# ============================================
# ROUTES — MAIN ANALYSIS
# ============================================

@app.post("/api/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)  # LOGIN REQUIRED
):
    """
    Main endpoint: Upload selfie → get fashion recommendations
    Requires login token in header.
    """
    start_time = time.time()
    temp_path = None

    try:
        # === VALIDATE FILE ===
        if not file.filename:
            raise HTTPException(status_code=400, detail="Koi file upload nahi hui.")

        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Sirf JPG, PNG, ya WebP file upload karo. Tumne upload kiya: {file_ext}"
            )

        file_content = await file.read()

        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="File bahut badi hai. Maximum 10MB ki photo upload karo."
            )

        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file upload hui hai.")

        # === SAVE TEMPORARILY ===
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        temp_path = UPLOAD_DIR / unique_filename
        with open(temp_path, "wb") as f:
            f.write(file_content)

        # === LOAD IMAGE ===
        image = image_processor.load_image(str(temp_path))

        # === STEP 1: QUICK QUALITY CHECK (before face detection) ===
        pre_quality = image_processor.analyze_photo_quality(image, face=None)

        # If image has serious issues even before face detection, stop early
        if not pre_quality.is_acceptable and pre_quality.quality_score < 30:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "photo_quality_issue",
                    "quality_score": pre_quality.quality_score,
                    "message": pre_quality.specific_message,
                    "problems": pre_quality.problems,
                    "can_retry": True
                }
            )

        # === STEP 2: DETECT FACE ===
        face = image_processor.detect_face(image)

        if face is None:
            # Do quality check to give specific reason why face wasn't found
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "no_face_detected",
                    "quality_score": pre_quality.quality_score,
                    "message": "⚠️ Tumhare photo mein chehra detect nahi hua.\n\n" +
                               (pre_quality.specific_message if pre_quality.problems or pre_quality.warnings
                                else "✅ Fix: Seedha camera ko dekho, acha lighting rakho, aur chehra clearly visible ho."),
                    "can_retry": True
                }
            )

        # === STEP 3: FULL QUALITY CHECK (with face info) ===
        full_quality = image_processor.analyze_photo_quality(image, face=face)

        # If quality is too bad even with face found, ask to retry
        if not full_quality.is_acceptable and full_quality.quality_score < 40:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "photo_quality_issue",
                    "quality_score": full_quality.quality_score,
                    "message": full_quality.specific_message,
                    "problems": full_quality.problems,
                    "warnings": full_quality.warnings,
                    "can_retry": True
                }
            )

        # === STEP 4: EXTRACT SKIN COLOR ===
        skin_color = image_processor.extract_skin_color(image, face)

        # === STEP 5: CLASSIFY SKIN TONE ===
        skin_tone = skin_classifier.classify(
            skin_color["r"], skin_color["g"], skin_color["b"]
        )
        color_season = skin_classifier.get_season(skin_tone)

        # === STEP 6: GENERATE RECOMMENDATIONS ===
        recommendations = recommendation_engine.get_recommendations(skin_tone)

        processing_time = round(time.time() - start_time, 2)

        # === STEP 7: SAVE TO HISTORY ===
        history_entry = {
            "date": datetime.utcnow().isoformat(),
            "skin_tone": skin_tone.category,
            "undertone": skin_tone.subcategory,
            "color_season": color_season,
            "quality_score": full_quality.quality_score
        }
        current_user["analysis_history"].append(history_entry)

        # === BUILD RESPONSE ===
        response = {
            "success": True,
            "processing_time_seconds": processing_time,
            "photo_quality": {
                "score": full_quality.quality_score,
                "message": full_quality.specific_message,
                "warnings": full_quality.warnings
            },
            "analysis": {
                "skin_color": {
                    "rgb": {"r": skin_color["r"], "g": skin_color["g"], "b": skin_color["b"]},
                    "hex": skin_color["hex"]
                },
                "skin_tone": {
                    "category": skin_tone.category,
                    "undertone": skin_tone.subcategory,
                    "description": skin_tone.description,
                    "brightness_score": skin_tone.brightness_score,
                    "color_season": color_season,
                    "confidence": skin_tone.confidence
                },
                "face_detected": face
            },
            "recommendations": {
                "summary": recommendations.summary,
                "best_shirt_colors": [
                    {"name": c["name"], "hex": c["hex"], "reason": c["reason"]}
                    for c in recommendations.best_shirt_colors
                ],
                "best_pant_colors": [
                    {"name": c["name"], "hex": c["hex"], "reason": c["reason"]}
                    for c in recommendations.best_pant_colors
                ],
                "accent_colors": [
                    {"name": c["name"], "hex": c["hex"], "reason": c["reason"]}
                    for c in recommendations.accent_colors
                ],
                "colors_to_avoid": [
                    {"name": c["name"], "hex": c["hex"], "reason": c["reason"]}
                    for c in recommendations.colors_to_avoid
                ],
                "outfit_combinations": recommendations.outfit_combos,
                "style_tips": recommendations.style_tips,
                "occasion_advice": recommendations.occasion_advice,
                "ethnic_wear": recommendations.ethnic_suggestions
            }
        }

        return JSONResponse(content=response)

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={
                "error": "server_error",
                "message": "Kuch galat ho gaya. Dobara try karo.",
                "can_retry": True
            }
        )
    finally:
        if temp_path and temp_path.exists():
            try:
                os.remove(temp_path)
            except:
                pass


# ============================================
# TEST ROUTE (no login needed)
# ============================================

@app.get("/api/test/{skin_tone}")
async def test_recommendations(skin_tone: str):
    """Test endpoint — no login needed"""
    valid_tones = ["fair", "light", "medium", "olive", "brown", "dark"]
    if skin_tone not in valid_tones:
        raise HTTPException(status_code=400, detail=f"Valid options: {', '.join(valid_tones)}")

    test_rgb = {
        "fair": (220, 190, 160), "light": (195, 155, 120),
        "medium": (175, 140, 105), "olive": (155, 120, 85),
        "brown": (120, 85, 60), "dark": (80, 55, 40),
    }
    r, g, b = test_rgb[skin_tone]
    result = skin_classifier.classify(r, g, b)
    recs = recommendation_engine.get_recommendations(result)

    return {
        "success": True,
        "skin_tone": skin_tone,
        "undertone": result.subcategory,
        "summary": recs.summary,
        "best_shirt_colors": [
            {"name": c["name"], "hex": c["hex"]} for c in recs.best_shirt_colors[:5]
        ]
    }


# ============================================
# RUN
# ============================================
if __name__ == "__main__":
    import uvicorn
    print("\n🚀 StyleGuru API starting...")
    print("📖 API Docs: http://localhost:8000/docs")
    print("🔗 Test: http://localhost:8000/api/test/medium\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)