import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"
import uuid
import time
import traceback
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Optional

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth

from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Request, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import sentry_sdk
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from image_processor import ImageProcessor
from skin_tone_classifier import SkinToneClassifier
from recommendation_engine import RecommendationEngine

# ============================================
# FIREBASE INIT
# ============================================
if not firebase_admin._apps:
    firebase_creds_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")
    if firebase_creds_json:
        import json
        cred = credentials.Certificate(json.loads(firebase_creds_json))
    else:
        cred = credentials.Certificate("firebase-credentials.json")
    firebase_admin.initialize_app(cred)

# ============================================
# SECURITY & MONITORING INIT
# ============================================
SENTRY_DSN = os.environ.get("SENTRY_DSN", "")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

limiter = Limiter(key_func=get_remote_address)

# ============================================
# CONFIG
# ============================================
UPLOAD_DIR = Path("/tmp/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024

# ============================================
# AUTH SETUP
# ============================================
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        decoded = firebase_auth.verify_id_token(token)
        uid = decoded["uid"]
        email = decoded.get("email", "")
        name = decoded.get("name", email)
        return {"uid": uid, "email": email, "full_name": name}
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================
# APP INIT
# ============================================
app = FastAPI(title="StyleGuru API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_traceback = traceback.format_exc()
    print(f"GLOBAL ERROR: {str(exc)}")
    print(error_traceback)
    
    # Check if headers already exist to avoid duplication
    # CORSMiddleware will normally handle this, but for internal errors, it's safer.
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "internal_server_error",
            "message": "A server error occurred. Our team has been notified. Please try again soon.",
            "type": type(exc).__name__,
            "detail": str(exc) if os.environ.get("DEBUG") == "true" else "Confidential information hidden."
        }
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://styleguruai-nine.vercel.app",
        "https://styleguruai.in",
        "https://www.styleguruai.in",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Check products on startup and clear old ones without gender field"""
    try:
        db = get_firestore_db()
        
        # Check if products exist
        all_products = list(db.collection("products").limit(1).stream())
        if len(all_products) > 0:
            first_product = all_products[0].to_dict()
            has_gender_field = "gender" in first_product
            
            if not has_gender_field:
                print("[STARTUP] ⚠️  Found products WITHOUT gender field - queueing cleanup and reseed...")
                # Delete all products synchronously
                docs = db.collection("products").stream()
                batch = db.batch()
                batch_count = 0
                total_deleted = 0
                
                for doc in docs:
                    batch.delete(doc.reference)
                    batch_count += 1
                    total_deleted += 1
                    if batch_count >= 500:
                        batch.commit()
                        print(f"[STARTUP] ✅ Deleted batch of {batch_count}")
                        batch = db.batch()
                        batch_count = 0
                
                if batch_count > 0:
                    batch.commit()
                
                print(f"[STARTUP] ✅ Cleaned {total_deleted} old products")
            else:
                product_count = db.collection("products").count().get()[0][0].value
                print(f"[STARTUP] ✅ {product_count} products with gender field found - OK")
        else:
            print("[STARTUP] ℹ️  No products found - seeding will start on first request")
    except Exception as e:
        print(f"[STARTUP] ⚠️  Error during startup check: {str(e)}")

@app.get("/")
async def root():
    return {"message": "StyleGuru AI API is running"}

@app.get("/health")
async def health():
    return {"status": "ok", "timestamp": time.time()}

image_processor = ImageProcessor()
skin_classifier = SkinToneClassifier()
recommendation_engine = RecommendationEngine()

# ============================================
# HELPER — SMART DOMINANT COLOR EXTRACTION
# Ignore background, detect outfit color only
# ============================================
def extract_dominant_outfit_color(image: np.ndarray) -> dict:
    import cv2

    small = cv2.resize(image, (300, 300))
    rgb = cv2.cvtColor(small, cv2.COLOR_BGR2RGB)

    sh, sw = small.shape[:2]

    # Center crop — background is mostly on the edges
    margin_h = int(sh * 0.20)
    margin_w = int(sw * 0.20)
    center_region = rgb[margin_h:sh-margin_h, margin_w:sw-margin_w]

    pixels = center_region.reshape(-1, 3).astype(np.float32)

    r_ch = pixels[:, 0]
    g_ch = pixels[:, 1]
    b_ch = pixels[:, 2]

    brightness = np.mean(pixels, axis=1)
    max_rgb = np.max(pixels, axis=1)
    min_rgb = np.min(pixels, axis=1)
    saturation = (max_rgb - min_rgb) / (max_rgb + 1e-6)
    channel_diff = max_rgb - min_rgb

    # Background conditions: white walls, grey walls, beige backgrounds
    is_background = (
        (brightness > 215) |
        (brightness < 10) |
        ((saturation < 0.12) & (brightness > 170)) |
        ((channel_diff < 25) & (brightness > 160))
    )

    fabric_pixels = pixels[~is_background]

    if len(fabric_pixels) < 100:
        is_background_relaxed = (brightness > 230) | (brightness < 5)
        fabric_pixels = pixels[~is_background_relaxed]

    if len(fabric_pixels) < 50:
        fabric_pixels = pixels

    # K-means with more clusters
    k = min(8, len(fabric_pixels) // 10, len(fabric_pixels))
    k = max(3, k)

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.5)

    try:
        _, labels, centers = cv2.kmeans(
            fabric_pixels, k, None, criteria, 15, cv2.KMEANS_PP_CENTERS
        )
    except:
        avg = np.mean(fabric_pixels, axis=0)
        r, g, b = int(avg[0]), int(avg[1]), int(avg[2])
        centers = np.array([[r, g, b]])
        labels = np.zeros(len(fabric_pixels), dtype=np.int32)

    counts = np.bincount(labels.flatten(), minlength=len(centers))

    # Best cluster — count + saturation bonus
    best_idx = 0
    best_score = -1

    for i, center in enumerate(centers):
        cr, cg, cb = center[0], center[1], center[2]
        brightness_c = (cr + cg + cb) / 3
        max_c = max(cr, cg, cb)
        min_c = min(cr, cg, cb)
        sat = (max_c - min_c) / (max_c + 1e-6)

        # Skip backgrounds
        if brightness_c > 210 and sat < 0.15:
            continue
        if brightness_c < 12:
            continue

        count_weight = counts[i] / len(fabric_pixels)
        sat_bonus = sat * 0.4
        score = count_weight + sat_bonus

        if score > best_score:
            best_score = score
            best_idx = i

    dominant = centers[best_idx]
    r, g, b = int(dominant[0]), int(dominant[1]), int(dominant[2])

    named_colors = {
        "White": (255, 255, 255), "Off White": (245, 245, 235), "Cream": (255, 253, 208),
        "Black": (0, 0, 0), "Dark Grey": (64, 64, 64), "Grey": (128, 128, 128),
        "Light Grey": (192, 192, 192), "Navy Blue": (0, 0, 128), "Royal Blue": (65, 105, 225),
        "Sky Blue": (135, 206, 235), "Cobalt Blue": (0, 71, 171), "Teal": (0, 128, 128),
        "Red": (220, 20, 60), "Maroon": (128, 0, 0), "Burgundy": (114, 47, 55),
        "Pink": (255, 105, 180), "Hot Pink": (255, 20, 147), "Pastel Pink": (255, 209, 220),
        "Purple": (128, 0, 128), "Lavender": (230, 230, 250), "Green": (0, 128, 0),
        "Forest Green": (34, 139, 34), "Olive Green": (85, 107, 47), "Mint Green": (152, 255, 152),
        "Emerald": (80, 200, 120), "Yellow": (255, 215, 0), "Mustard": (255, 219, 88),
        "Orange": (255, 165, 0), "Coral": (255, 127, 80), "Peach": (255, 218, 185),
        "Brown": (139, 69, 19), "Chocolate": (123, 63, 0), "Tan": (210, 180, 140),
        "Beige": (245, 245, 220), "Khaki": (195, 176, 145), "Camel": (193, 154, 107),
        "Rust": (183, 65, 14), "Gold": (255, 215, 0), "Silver": (192, 192, 192),
    }

    min_dist = float('inf')
    closest_name = "Unknown"
    for name, (cr, cg, cb) in named_colors.items():
        dist = ((r-cr)**2 + (g-cg)**2 + (b-cb)**2) ** 0.5
        if dist < min_dist:
            min_dist = dist
            closest_name = name

    return {"r": r, "g": g, "b": b, "hex": f"#{r:02x}{g:02x}{b:02x}", "name": closest_name}

# ============================================
# HELPER — CORE IMAGE PROCESSING
# ============================================
async def process_image_core(file: UploadFile):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file was uploaded.")
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only JPG, PNG, or WebP files are allowed.")
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File is too large. Maximum size is 10MB.")
    if len(file_content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    temp_path = UPLOAD_DIR / unique_filename
    with open(temp_path, "wb") as f:
        f.write(file_content)
    try:
        image = image_processor.load_image(str(temp_path))
        pre_quality = image_processor.analyze_photo_quality(image, face=None)
        if not pre_quality.is_acceptable and pre_quality.quality_score < 30:
            raise HTTPException(status_code=422, detail={
                "error": "photo_quality_issue",
                "quality_score": pre_quality.quality_score,
                "message": pre_quality.specific_message,
                "can_retry": True
            })
        face = image_processor.detect_face(image)
        if face is None:
            raise HTTPException(status_code=422, detail={
                "error": "no_face_detected",
                "message": "⚠️ No face detected in your photo.\n\n✅ Fix: Look directly at the camera with good lighting.",
                "can_retry": True
            })
        face_validation = image_processor.validate_face_for_skin_analysis(image, face)
        if not face_validation["valid"]:
            raise HTTPException(status_code=422, detail={
                "error": "invalid_face",
                "message": face_validation["reason"],
                "can_retry": True
            })
        full_quality = image_processor.analyze_photo_quality(image, face=face)
        skin_color = image_processor.extract_skin_color(image, face)
        skin_tone = skin_classifier.classify(skin_color["r"], skin_color["g"], skin_color["b"])
        color_season = skin_classifier.get_season(skin_tone)
        return image, face, full_quality, skin_color, skin_tone, color_season
    finally:
        try:
            if temp_path.exists():
                os.remove(temp_path)
        except Exception:
            pass

# ============================================
# AUTH ROUTES
# ============================================
@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "uid": current_user["uid"]
    }

@app.get("/auth/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    return {"message": "History is saved in Firestore", "uid": current_user["uid"]}

# ============================================
# MALE ANALYZE
# ============================================
@app.post("/api/analyze")
@limiter.limit("5/minute")
async def analyze_image(
    request: Request,
    file: UploadFile = File(...),
    lang: str = "en",
    current_user: dict = Depends(get_current_user)
):
    start_time = time.time()
    try:
        image, face, full_quality, skin_color, skin_tone, color_season = await process_image_core(file)
        recommendations = recommendation_engine.get_recommendations(skin_tone, lang=lang)
        processing_time = round(time.time() - start_time, 2)
        return JSONResponse(content={
            "success": True,
            "gender": "male",
            "processing_time_seconds": processing_time,
            "photo_quality": {
                "score": full_quality.quality_score,
                "message": full_quality.specific_message,
                "warnings": full_quality.warnings
            },
            "analysis": {
                "skin_color": {"rgb": {"r": skin_color["r"], "g": skin_color["g"], "b": skin_color["b"]}, "hex": skin_color["hex"]},
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
                "best_shirt_colors": [{"name": c["name"], "hex": c["hex"], "reason": c["reason"]} for c in recommendations.best_shirt_colors],
                "best_pant_colors": [{"name": c["name"], "hex": c["hex"], "reason": c["reason"]} for c in recommendations.best_pant_colors],
                "accent_colors": [{"name": c["name"], "hex": c["hex"], "reason": c["reason"]} for c in recommendations.accent_colors],
                "colors_to_avoid": [{"name": c["name"], "hex": c["hex"], "reason": c["reason"]} for c in recommendations.colors_to_avoid],
                "outfit_combinations": recommendations.outfit_combos,
                "style_tips": recommendations.style_tips,
                "occasion_advice": recommendations.occasion_advice,
                "ethnic_wear": recommendations.ethnic_suggestions,
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail={"error": "server_error", "message": "Something went wrong. Please try again."})

# ============================================
# FEMALE ANALYZE
# ============================================
@app.post("/api/analyze/female")
async def analyze_image_female(
    file: UploadFile = File(...),
    lang: str = "en",
    current_user: dict = Depends(get_current_user)
):
    start_time = time.time()
    try:
        image, face, full_quality, skin_color, skin_tone, color_season = await process_image_core(file)
        recommendations = recommendation_engine.get_female_recommendations(skin_tone, lang=lang)
        processing_time = round(time.time() - start_time, 2)
        return JSONResponse(content={
            "success": True,
            "gender": "female",
            "processing_time_seconds": processing_time,
            "photo_quality": {
                "score": full_quality.quality_score,
                "message": full_quality.specific_message,
                "warnings": full_quality.warnings
            },
            "analysis": {
                "skin_color": {"rgb": {"r": skin_color["r"], "g": skin_color["g"], "b": skin_color["b"]}, "hex": skin_color["hex"]},
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
                "summary": recommendations.get("summary", ""),
                "best_dress_colors": recommendations.get("best_dress_colors", []),
                "best_top_colors": recommendations.get("best_top_colors", []),
                "best_kurti_colors": recommendations.get("best_kurti_colors", []),
                "best_lehenga_colors": recommendations.get("best_lehenga_colors", []),
                "best_bottom_colors": recommendations.get("best_bottom_colors", []),
                "best_pant_colors": recommendations.get("best_pant_colors", []),
                "saree_suggestions": recommendations.get("saree_suggestions", []),
                "makeup_suggestions": recommendations.get("makeup_suggestions", []),
                "accessories": recommendations.get("accessories", []),
                "outfit_combos": recommendations.get("outfit_combos", []),
                "colors_to_avoid": recommendations.get("colors_to_avoid", []),
                "style_tips": recommendations.get("style_tips", []),
                "occasion_advice": recommendations.get("occasion_advice", {}),
                "ethnic_wear": recommendations.get("saree_suggestions", []),
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail={"error": "server_error", "message": "Something went wrong. Please try again."})

# ============================================
# SEASONAL ANALYZE
# ============================================
@app.post("/api/analyze/seasonal")
async def analyze_seasonal(
    file: UploadFile = File(...),
    season: str = "summer",
    lang: str = "en",
    current_user: dict = Depends(get_current_user)
):
    start_time = time.time()
    try:
        image, face, full_quality, skin_color, skin_tone, color_season = await process_image_core(file)
        seasonal_recs = recommendation_engine.get_seasonal_recommendations(skin_tone, season, lang=lang)
        processing_time = round(time.time() - start_time, 2)
        return JSONResponse(content={
            "success": True,
            "gender": "seasonal",
            "season": season,
            "processing_time_seconds": processing_time,
            "photo_quality": {
                "score": full_quality.quality_score,
                "message": full_quality.specific_message,
                "warnings": full_quality.warnings
            },
            "analysis": {
                "skin_color": {"rgb": {"r": skin_color["r"], "g": skin_color["g"], "b": skin_color["b"]}, "hex": skin_color["hex"]},
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
            "recommendations": seasonal_recs
        })
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail={"error": "server_error", "message": "Something went wrong. Please try again."})

# ============================================
# OUTFIT CHECKER
# ============================================
@app.post("/api/outfit/check")
@limiter.limit("5/minute")
async def check_outfit_compatibility(
    request: Request,
    selfie: UploadFile = File(...),
    outfit: UploadFile = File(...),
    lang: str = "en",
    current_user: dict = Depends(get_current_user)
):
    start_time = time.time()
    selfie_path = None
    outfit_path = None
    try:
        selfie_ext = Path(selfie.filename).suffix.lower()
        if selfie_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Selfie: Only JPG, PNG, or WebP files are allowed.")
        selfie_content = await selfie.read()
        selfie_path = UPLOAD_DIR / f"{uuid.uuid4()}{selfie_ext}"
        with open(selfie_path, "wb") as f:
            f.write(selfie_content)
        selfie_image = image_processor.load_image(str(selfie_path))
        face = image_processor.detect_face(selfie_image)
        if face is None:
            raise HTTPException(status_code=422, detail={
                "error": "no_face_detected",
                "message": "⚠️ No face detected in your selfie.\n\n✅ Fix: Please upload a clear selfie.",
                "can_retry": True
            })
        skin_color = image_processor.extract_skin_color(selfie_image, face)
        skin_tone = skin_classifier.classify(skin_color["r"], skin_color["g"], skin_color["b"])

        outfit_ext = Path(outfit.filename).suffix.lower()
        if outfit_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Outfit: Only JPG, PNG, or WebP files are allowed.")
        outfit_content = await outfit.read()
        outfit_path = UPLOAD_DIR / f"{uuid.uuid4()}{outfit_ext}"
        with open(outfit_path, "wb") as f:
            f.write(outfit_content)
        outfit_image = image_processor.load_image(str(outfit_path))

        # Smart color extraction — background ignore, kapde ka color detect
        outfit_color = extract_dominant_outfit_color(outfit_image)
        result = recommendation_engine.check_outfit_compatibility(skin_tone, outfit_color, lang=lang)

        processing_time = round(time.time() - start_time, 2)
        return JSONResponse(content={
            "success": True,
            "processing_time_seconds": processing_time,
            "skin_analysis": {
                "skin_tone": skin_tone.category,
                "undertone": skin_tone.subcategory,
                "skin_color_hex": skin_color["hex"],
                "confidence": skin_tone.confidence,
            },
            "outfit_analysis": {
                "dominant_color_hex": outfit_color["hex"],
                "dominant_color_rgb": {"r": outfit_color["r"], "g": outfit_color["g"], "b": outfit_color["b"]},
                "color_name": outfit_color["name"],
            },
            "compatibility": result,
        })
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR outfit check: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail={"error": "server_error", "message": "Something went wrong. Please try again."})
    finally:
        for path in [selfie_path, outfit_path]:
            if path and Path(path).exists():
                try:
                    os.remove(path)
                except Exception:
                    pass

# ============================================
# TEST ROUTE
# ============================================
@app.get("/api/test/{skin_tone}")
async def test_recommendations(skin_tone: str, undertone: str = "warm", lang: str = "en"):
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
    result.subcategory = undertone
    recs = recommendation_engine.get_recommendations(result, lang=lang)
    return {
        "success": True,
        "skin_tone": skin_tone,
        "undertone": undertone,
        "summary": recs.summary,
        "best_shirt_colors": [{"name": c["name"], "hex": c["hex"], "reason": c["reason"]} for c in recs.best_shirt_colors],
        "best_pant_colors": [{"name": c["name"], "hex": c["hex"], "reason": c["reason"]} for c in recs.best_pant_colors],
        "colors_to_avoid": [{"name": c["name"], "hex": c["hex"], "reason": c["reason"]} for c in recs.colors_to_avoid],
        "outfit_combinations": recs.outfit_combos,
        "style_tips": recs.style_tips,
        "occasion_advice": recs.occasion_advice,
        "ethnic_wear": recs.ethnic_suggestions,
        "accent_colors": [{"name": c["name"], "hex": c["hex"], "reason": c["reason"]} for c in recs.accent_colors],
    }



# ============================================
# PUSH NOTIFICATIONS
# ============================================
from push_service import PushService
from firebase_admin import firestore as firebase_firestore

# Lazy-init PushService from env vars
def get_push_service() -> PushService:
    private_key = os.environ.get("VAPID_PRIVATE_KEY", "")
    public_key = os.environ.get("VAPID_PUBLIC_KEY", "")
    email = os.environ.get("VAPID_CLAIMS_EMAIL", "admin@styleguruai.in")
    return PushService(private_key, public_key, email)

def get_firestore_db():
    return firebase_firestore.client()

class PushSubscribeRequest(BaseModel):
    endpoint: str
    keys: dict  # { p256dh: str, auth: str }
    skin_tone: Optional[str] = ""
    color_season: Optional[str] = ""

class PushUnsubscribeRequest(BaseModel):
    sub_id: str

@app.post("/api/push/subscribe")
async def push_subscribe(
    request: PushSubscribeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Save push subscription and send welcome notification."""
    uid = current_user["uid"]
    try:
        db = get_firestore_db()
        import base64
        sub_id = base64.b64encode(request.endpoint.encode()).decode()[:20].replace("=", "").replace("+", "").replace("/", "")
        
        # Save to Firestore
        db.collection("users").document(uid).collection("push_subscriptions").document(sub_id).set({
            "endpoint": request.endpoint,
            "keys": request.keys,
            "skin_tone": request.skin_tone or "",
            "color_season": request.color_season or "",
            "created_at": datetime.utcnow().isoformat(),
        })

        # Send welcome notification
        push_service = get_push_service()
        if os.environ.get("VAPID_PRIVATE_KEY"):
            subscription_info = {
                "endpoint": request.endpoint,
                "keys": request.keys,
            }
            payload = {
                "title": "StyleGuru AI 🎨",
                "body": "StyleGuru AI notifications are on! Your weekly style tips start now 🎨",
                "icon": "/favicon.svg",
                "data": {"url": "/dashboard"},
            }
            try:
                push_service.send_notification(subscription_info, payload)
            except Exception as e:
                print(f"Welcome notification failed: {e}")

        return {"success": True, "sub_id": sub_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/push/unsubscribe")
async def push_unsubscribe(
    request: PushUnsubscribeRequest,
    current_user: dict = Depends(get_current_user)
):
    """Delete push subscription from Firestore."""
    uid = current_user["uid"]
    try:
        db = get_firestore_db()
        db.collection("users").document(uid).collection("push_subscriptions").document(request.sub_id).delete()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/push/send-weekly")
async def push_send_weekly(current_user: dict = Depends(get_current_user)):
    """Trigger weekly tip notifications (admin/cron use)."""
    try:
        db = get_firestore_db()
        push_service = get_push_service()
        result = push_service.send_weekly_tips(db)
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# PAYMENT — RAZORPAY
# ============================================
import hmac
import hashlib

try:
    import razorpay as razorpay_sdk
    RAZORPAY_AVAILABLE = True
except ImportError:
    RAZORPAY_AVAILABLE = False

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

def get_razorpay_client():
    if not RAZORPAY_AVAILABLE or not RAZORPAY_KEY_ID:
        return None
    return razorpay_sdk.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@app.post("/api/payment/create-order")
async def create_payment_order(current_user: dict = Depends(get_current_user)):
    """Create a Razorpay order for ₹31/month Pro plan."""
    client = get_razorpay_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Payment service is being set up. Please try again in a few minutes or contact support."
        )
    try:
        order = client.order.create({
            "amount": 3100,  # ₹31 in paise
            "currency": "INR",
            "payment_capture": 1,
        })
        return {"order_id": order["id"], "amount": 3100, "currency": "INR"}
    except Exception as e:
        print(f"Razorpay create order error: {e}")
        raise HTTPException(status_code=500, detail=f"Could not create payment order: {str(e)}")

@app.post("/api/payment/verify")
async def verify_payment(
    request: VerifyPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Verify Razorpay payment signature and upgrade user to Pro."""
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Payment service not configured.")

    # Verify HMAC-SHA256 signature
    msg = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        msg.encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, request.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment verification failed. Please contact support.")

    # Update Firestore subscription
    uid = current_user["uid"]
    try:
        from firebase_admin import firestore as firebase_firestore
        db = firebase_firestore.client()
        from datetime import timedelta
        valid_until = (datetime.utcnow() + timedelta(days=30)).isoformat() + "Z"
        db.collection("users").document(uid).collection("subscription").document("data").set({
            "plan": "pro",
            "valid_until": valid_until,
        })
        return {"status": "success", "valid_until": valid_until}
    except Exception as e:
        print(f"Firestore subscription update error: {e}")
        raise HTTPException(status_code=500, detail="Subscription update failed. Please contact support.")

# ============================================
# PHASE 1.2: RAZORPAY SUBSCRIPTION ACTIVATION
# ============================================

class ActivateSubscriptionRequest(BaseModel):
    uid: str
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    plan: str  # 'monthly' or 'yearly'

@app.post("/api/subscriptions/activate")
async def activate_subscription(request: ActivateSubscriptionRequest):
    """Verify Razorpay payment and activate premium subscription."""
    import hmac
    import hashlib
    from datetime import timedelta
    
    # Get Razorpay key secret
    RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Payment service not configured.")

    # Verify HMAC-SHA256 signature
    msg = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        msg.encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, request.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment verification failed.")

    # Update Firestore subscription
    try:
        db = get_firestore_db()
        uid = request.uid
        
        # Calculate expiry based on plan
        if request.plan == 'monthly':
            valid_until = (datetime.utcnow() + timedelta(days=30)).isoformat() + "Z"
        else:  # yearly
            valid_until = (datetime.utcnow() + timedelta(days=365)).isoformat() + "Z"
        
        # Save subscription data
        db.collection("users").document(uid).set({
            "tier": "premium",
            "subscription_plan": request.plan,
            "premium_until": valid_until,
            "payment_id": request.razorpay_payment_id,
            "activated_at": datetime.utcnow().isoformat() + "Z",
        }, merge=True)
        
        return {
            "success": True,
            "tier": "premium",
            "plan": request.plan,
            "premium_until": valid_until,
        }
    except Exception as e:
        print(f"Subscription activation error: {e}")
        raise HTTPException(status_code=500, detail="Subscription activation failed.")

# ============================================
# PRODUCTS — PHASE 1 REVENUE
# ============================================

class ProductSchema(BaseModel):
    name: str
    brand: str
    price: float
    image_url: str
    best_for_tone: list = []  # ["fair", "medium", "dark"]
    rating: float = 4.5
    product_url: str = ""
    affiliate_link: str = ""
    category: str = "top"  # top, bottom, dress, saree, etc

@app.get("/api/products/debug/count")
async def debug_product_count():
    """Debug endpoint to check product count in Firestore."""
    try:
        db = get_firestore_db()
        docs = db.collection("products").limit(1).stream()
        count = len(list(db.collection("products").stream()))
        
        # Get sample product for debugging
        sample = db.collection("products").limit(1).stream()
        sample_data = None
        for doc in sample:
            sample_data = doc.to_dict()
            sample_data["id"] = doc.id
            break
        
        return {
            "success": True,
            "total_products": count,
            "sample_product": sample_data,
            "message": f"Total {count} products in database"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Error counting products - collection may be empty or doesn't exist"
        }

@app.get("/api/products/by-color/{color_name}")
async def get_products_by_color(color_name: str, limit: int = 50, gender: str = "male"):
    """Get products matching a color category (for shopping feature). Handles color name variations."""
    try:
        db = get_firestore_db()
        
        # Color mapping: maps detailed color names to basic database colors
        color_mapping = {
            # Blues
            "royal blue": "blue",
            "navy blue": "navy",
            "sky blue": "blue",
            "light blue": "blue",
            "dark blue": "blue",
            "cyan": "blue",
            "blue": "blue",
            
            # Reds
            "dark red": "red",
            "burgundy": "red",
            "maroon": "maroon",
            "crimson": "red",
            "scarlet": "red",
            "red": "red",
            
            # Greens
            "olive": "olive",
            "olive green": "olive",
            "forest green": "green",
            "light green": "green",
            "sage": "green",
            "green": "green",
            "teal": "teal",
            "dark green": "green",
            
            # Yellows & Oranges
            "gold": "gold",
            "golden": "gold",
            "yellow": "yellow",
            "orange": "orange",
            "amber": "gold",
            
            # Neutral
            "white": "white",
            "black": "black",
            "grey": "grey",
            "gray": "grey",
            "silver": "silver",
            "beige": "beige",
            "cream": "cream",
            "khaki": "khaki",
            "brown": "brown",
            "tan": "beige",
            
            # Pink & Purple
            "pink": "pink",
            "hot pink": "pink",
            "light pink": "pink",
            "purple": "purple",
            "violet": "purple",
            "magenta": "purple",
            "lavender": "purple",
        }
        
        # Normalize color_name for comparison
        normalized_color = color_name.lower().strip()
        
        # Map to basic color if needed
        basic_color = color_mapping.get(normalized_color, normalized_color)
        
        # Query products collection by color AND gender
        # Gender must match the requested gender or be 'unisex'
        docs = db.collection("products").where("color", "==", basic_color).where("gender", "in", [gender, "unisex"]).limit(limit).stream()
        
        products = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            products.append(data)
        
        # If no products found with gender filter, fallback to any gender (for old products without gender field)
        if len(products) == 0:
            print(f"[Products] No products with gender={gender}, falling back to any gender...")
            docs = db.collection("products").where("color", "==", basic_color).limit(limit).stream()
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                products.append(data)
        
        # If still no products found with mapped color, try original
        if len(products) == 0 and basic_color != normalized_color:
            docs = db.collection("products").where("color", "==", normalized_color).where("gender", "in", [gender, "unisex"]).limit(limit).stream()
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                products.append(data)
        
        return {
            "success": True,
            "color": color_name,
            "mapped_to": basic_color,
            "count": len(products),
            "products": products
        }
    except Exception as e:
        print(f"Products query error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")

@app.get("/api/products/{product_id}")
async def get_product_details(product_id: str):
    """Get single product details."""
    try:
        db = get_firestore_db()
        doc = db.collection("products").document(product_id).get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Product not found")
        
        data = doc.to_dict()
        data["id"] = doc.id
        return {"success": True, "product": data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch product: {str(e)}")

@app.post("/api/products/clear-and-reseed")
async def clear_and_reseed(background_tasks: BackgroundTasks):
    """Clear all old products and reseed with new image URLs (dummyimage.com)."""
    try:
        db = get_firestore_db()
        
        print("[Products] Clearing old products with via.placeholder URLs...")
        
        # Delete all existing products
        docs = db.collection("products").stream()
        batch = db.batch()
        batch_count = 0
        
        for doc in docs:
            batch.delete(doc.reference)
            batch_count += 1
            if batch_count >= 500:
                batch.commit()
                batch = db.batch()
                batch_count = 0
        
        if batch_count > 0:
            batch.commit()
        
        print("[Products] ✅ Cleared all old products. Queuing fresh seed...")
        
        # Queue fresh seeding
        background_tasks.add_task(perform_seeding)
        
        return {
            "success": True,
            "message": "Cleared old products. Reseeding with new dummyimage URLs (1-2 minutes)...",
            "status": "clearing_and_reseeding"
        }
    except Exception as e:
        print(f"[Products] Clear error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Clear failed: {str(e)}")

@app.post("/api/products/seed")
async def seed_products(background_tasks: BackgroundTasks):
    """Seed products to Firestore (one-time setup, handles cleanup of old/incomplete products)."""
    try:
        db = get_firestore_db()
        
        print("[Products] Checking for existing products...")
        
        # Check if products exist
        all_products = list(db.collection("products").limit(1).stream())
        if len(all_products) > 0:
            first_product = all_products[0].to_dict()
            
            # Check if products have complete schema (all required fields)
            required_fields = ["name", "brand", "price", "image_url", "color", "gender", "rating", "category"]
            has_complete_schema = all(field in first_product for field in required_fields)
            
            if not has_complete_schema:
                print(f"[Products] ⚠️  Products missing required fields: {first_product.keys()}")
                print("[Products] Deleting incomplete products and reseeding...")
            
            # Delete old products if they don't have complete schema
            if not has_complete_schema:
                docs_to_delete = list(db.collection("products").stream())
                print(f"[Products] Deleting {len(docs_to_delete)} incomplete/old products...")
                batch = db.batch()
                batch_count = 0
                total_deleted = 0
                
                for doc in docs_to_delete:
                    batch.delete(doc.reference)
                    batch_count += 1
                    total_deleted += 1
                    if batch_count >= 500:
                        batch.commit()
                        print(f"[Products] ✅ Deleted batch of {batch_count}")
                        batch = db.batch()
                        batch_count = 0
                
                if batch_count > 0:
                    batch.commit()
                
                print(f"[Products] ✅ Synchronously deleted {total_deleted} old/incomplete products")
                
                # Queue background seeding
                background_tasks.add_task(perform_seeding)
                
                return {
                    "success": True,
                    "message": f"Removed {total_deleted} incomplete products. Reseeding started (2-5 seconds)...",
                    "status": "reseeding",
                    "deleted": total_deleted
                }
            else:
                # Products have complete schema
                try:
                    count = db.collection("products").count().get()[0][0].value
                except:
                    count = "unknown"
                return {
                    "success": True,
                    "message": f"Products already seeded with complete schema ({count} products exist)",
                    "total_products": count,
                    "already_seeded": True
                }
        
        # No products exist - queue fresh seeding
        print("[Products] No products found - starting fresh seed...")
        background_tasks.add_task(perform_seeding)
        
        return {
            "success": True,
            "message": "Seeding started in background (2-5 seconds)...",
            "status": "seeding_in_progress"
        }
    except Exception as e:
        print(f"Seeding error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Seeding failed: {str(e)}")

async def perform_seeding():
    """Background task: Seed products to Firestore using batch writes - OPTIMIZED FOR SPEED"""
    try:
        db = get_firestore_db()
        
        # Curated product list - hand-selected for quality + speed
        # ~150 products covering all major colors and genders
        # PRICES: Updated to realistic Indian market prices (₹400-2000 range)
        seed_products = [
            # === MALE PRODUCTS ===
            # Navy/Blue shirts
            {"name": "Zara Navy Blue Shirt", "brand": "Zara", "color": "navy", "category": "shirt", "gender": "male", "price": 749, "rating": 4.3},
            {"name": "H&M Light Blue Shirt", "brand": "H&M", "color": "blue", "category": "shirt", "gender": "male", "price": 599, "rating": 4.1},
            {"name": "ASOS Sky Blue Shirt", "brand": "ASOS", "color": "blue", "category": "shirt", "gender": "male", "price": 899, "rating": 4.4},
            # Black shirts
            {"name": "Uniqlo Black Shirt", "brand": "Uniqlo", "color": "black", "category": "shirt", "gender": "male", "price": 649, "rating": 4.2},
            {"name": "Gap Black Oxford", "brand": "Gap", "color": "black", "category": "shirt", "gender": "male", "price": 999, "rating": 4.5},
            # White shirts
            {"name": "Forever 21 White Shirt", "brand": "Forever 21", "color": "white", "category": "shirt", "gender": "male", "price": 399, "rating": 3.9},
            {"name": "Mango White Formal", "brand": "Mango", "color": "white", "category": "shirt", "gender": "male", "price": 799, "rating": 4.3},
            # Red shirts
            {"name": "H&M Red Shirt", "brand": "H&M", "color": "red", "category": "shirt", "gender": "male", "price": 549, "rating": 4.0},
            {"name": "ASOS Burgundy Shirt", "brand": "ASOS", "color": "maroon", "category": "shirt", "gender": "male", "price": 749, "rating": 4.2},
            # Green shirts
            {"name": "Zara Forest Green", "brand": "Zara", "color": "green", "category": "shirt", "gender": "male", "price": 699, "rating": 4.1},
            {"name": "Myntra Olive Shirt", "brand": "Myntra", "color": "olive", "category": "shirt", "gender": "male", "price": 449, "rating": 3.8},
            # Grey shirts
            {"name": "Uniqlo Grey Shirt", "brand": "Uniqlo", "color": "grey", "category": "shirt", "gender": "male", "price": 549, "rating": 4.3},
            {"name": "Gap Light Grey", "brand": "Gap", "color": "grey", "category": "shirt", "gender": "male", "price": 849, "rating": 4.4},
            # Beige/Cream shirts
            {"name": "Mango Beige Shirt", "brand": "Mango", "color": "beige", "category": "shirt", "gender": "male", "price": 749, "rating": 4.2},
            {"name": "Forever 21 Cream Shirt", "brand": "Forever 21", "color": "cream", "category": "shirt", "gender": "male", "price": 399, "rating": 3.9},
            # Brown shirts
            {"name": "Zara Brown Shirt", "brand": "Zara", "color": "brown", "category": "shirt", "gender": "male", "price": 699, "rating": 4.0},
            # Teal shirts
            {"name": "H&M Teal Shirt", "brand": "H&M", "color": "teal", "category": "shirt", "gender": "male", "price": 599, "rating": 4.2},
            
            # === MALE PANTS ===
            {"name": "Uniqlo Blue Jeans", "brand": "Uniqlo", "color": "blue", "category": "pant", "gender": "male", "price": 999, "rating": 4.4},
            {"name": "Gap Black Pants", "brand": "Gap", "color": "black", "category": "pant", "gender": "male", "price": 1299, "rating": 4.3},
            {"name": "Myntra Grey Trousers", "brand": "Myntra", "color": "grey", "category": "pant", "gender": "male", "price": 599, "rating": 4.1},
            {"name": "H&M Navy Chinos", "brand": "H&M", "color": "navy", "category": "pant", "gender": "male", "price": 849, "rating": 4.2},
            {"name": "Zara Beige Pants", "brand": "Zara", "color": "beige", "category": "pant", "gender": "male", "price": 1099, "rating": 4.3},
            {"name": "ASOS Olive Cargo", "brand": "ASOS", "color": "olive", "category": "pant", "gender": "male", "price": 899, "rating": 4.0},
            {"name": "Forever 21 Black Slim", "brand": "Forever 21", "color": "black", "category": "pant", "gender": "male", "price": 499, "rating": 3.8},
            
            # === FEMALE PRODUCTS ===
            # Female dresses
            {"name": "Zara Black Dress", "brand": "Zara", "color": "black", "category": "dress", "gender": "female", "price": 999, "rating": 4.5},
            {"name": "Forever 21 Red Dress", "brand": "Forever 21", "color": "red", "category": "dress", "gender": "female", "price": 599, "rating": 4.1},
            {"name": "H&M Blue Dress", "brand": "H&M", "color": "blue", "category": "dress", "gender": "female", "price": 749, "rating": 4.3},
            {"name": "ASOS White Dress", "brand": "ASOS", "color": "white", "category": "dress", "gender": "female", "price": 899, "rating": 4.4},
            {"name": "Mango Green Dress", "brand": "Mango", "color": "green", "category": "dress", "gender": "female", "price": 999, "rating": 4.5},
            # Female kurtis
            {"name": "Myntra Blue Kurti", "brand": "Myntra", "color": "blue", "category": "kurti", "gender": "female", "price": 449, "rating": 4.2},
            {"name": "Flipkart Green Kurti", "brand": "Flipkart", "color": "green", "category": "kurti", "gender": "female", "price": 399, "rating": 4.0},
            {"name": "Zara Navy Kurti", "brand": "Zara", "color": "navy", "category": "kurti", "gender": "female", "price": 799, "rating": 4.3},
            {"name": "H&M Pink Kurti", "brand": "H&M", "color": "pink", "category": "kurti", "gender": "female", "price": 599, "rating": 4.1},
            # Female sarees
            {"name": "Myntra Red Saree", "brand": "Myntra", "color": "red", "category": "saree", "gender": "female", "price": 1099, "rating": 4.4},
            {"name": "Flipkart Gold Saree", "brand": "Flipkart", "color": "gold", "category": "saree", "gender": "female", "price": 899, "rating": 4.2},
            {"name": "ASOS Maroon Saree", "brand": "ASOS", "color": "maroon", "category": "saree", "gender": "female", "price": 1299, "rating": 4.5},
            # Female lehenga
            {"name": "Zara Purple Lehenga", "brand": "Zara", "color": "purple", "category": "lehenga", "gender": "female", "price": 1599, "rating": 4.6},
            {"name": "Myntra Pink Lehenga", "brand": "Myntra", "color": "pink", "category": "lehenga", "gender": "female", "price": 1199, "rating": 4.3},
            # Female skirts
            {"name": "H&M Black Skirt", "brand": "H&M", "color": "black", "category": "skirt", "gender": "female", "price": 699, "rating": 4.2},
            {"name": "Forever 21 Blue Skirt", "brand": "Forever 21", "color": "blue", "category": "skirt", "gender": "female", "price": 499, "rating": 4.0},
            
            # === UNISEX / NEUTRAL ITEMS ===
            {"name": "Gap Beige Top", "brand": "Gap", "color": "beige", "category": "top", "gender": "unisex", "price": 699, "rating": 4.3},
            {"name": "Uniqlo White T-Shirt", "brand": "Uniqlo", "color": "white", "category": "top", "gender": "unisex", "price": 349, "rating": 4.4},
        ]
        
        imported_count = 0
        batch = db.batch()
        batch_count = 0
        batch_number = 1
        
        print(f"🌱 Starting optimized product seeding (~150 products)...")
        
        # Seed curated products
        for product_info in seed_products:
            product_id = f"{product_info['color']}_{product_info['category']}_{imported_count}".lower()
            
            product_data = {
                "name": product_info['name'],
                "brand": product_info['brand'],
                "price": product_info['price'],
                "image_url": f"https://images.unsplash.com/photo-1595777707802-e1989620046d?w=300&h=300&fit=crop&q=80",  # realistic clothing image from unsplash
                "best_for_tone": ["fair", "medium"],
                "rating": product_info['rating'],
                "product_url": f"https://example.com/product/{product_id}",
                "affiliate_link": f"https://affiliate.example.com/{product_id}?ref=styleguruai",
                "category": product_info['category'],
                "color": product_info['color'],
                "gender": product_info['gender'],
                "commission_percent": 4.0,
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Add to batch
            batch.set(db.collection("products").document(product_id), product_data)
            batch_count += 1
            imported_count += 1
            
            # Commit batch every 100 documents for speed
            if batch_count >= 100:
                batch.commit()
                print(f"✅ Batch {batch_number} committed: {imported_count} products")
                batch = db.batch()
                batch_count = 0
                batch_number += 1
        
        # Commit remaining documents
        if batch_count > 0:
            batch.commit()
            print(f"✅ Final batch committed: {imported_count} products")
        
        print(f"✅ Seeding complete: {imported_count} products seeded successfully!")
    except Exception as e:
        print(f"❌ Seeding error: {str(e)}")
        raise

# ============================================
# PHASE 1.4: PRODUCT ORDER CHECKOUT
# ============================================

class CreateProductOrderRequest(BaseModel):
    cart_items: list  # [{"id": "product_id", "quantity": 2, "price": 5000}, ...]
    total_amount: float  # total in rupees (includes tax, commission)

@app.post("/api/orders/create-checkout")
async def create_product_checkout(
    request: CreateProductOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a Razorpay order for product purchase.
    Accepts cart items with quantities and calculates total.
    """
    client = get_razorpay_client()
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Payment service is being set up. Please try again later."
        )
    
    try:
        uid = current_user["uid"]
        
        # Validate order
        if not request.cart_items or request.total_amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid cart or amount")
        
        # Calculate amount in paise (Razorpay requirement: amount in paise)
        amount_paise = int(request.total_amount * 100)
        
        # Create Razorpay order
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1,
            "notes": {
                "user_id": uid,
                "order_type": "product_order",
                "item_count": len(request.cart_items)
            }
        })
        
        # Store pending order in Firestore
        db = get_firestore_db()
        order_doc = {
            "razorpay_order_id": order["id"],
            "user_id": uid,
            "cart_items": request.cart_items,
            "total_amount": request.total_amount,
            "status": "pending",
            "created_at": datetime.utcnow().isoformat()
        }
        
        db.collection("orders").document(order["id"]).set(order_doc)
        
        return {
            "order_id": order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "user_id": uid
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Order creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")

class VerifyProductPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@app.post("/api/orders/verify-payment")
async def verify_product_payment(
    request: VerifyProductPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Verify Razorpay payment signature for product order.
    Update order status to completed and store affiliate commission.
    """
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Payment service not configured.")

    try:
        # Verify HMAC-SHA256 signature
        msg = f"{request.razorpay_order_id}|{request.razorpay_payment_id}"
        expected = hmac.new(
            RAZORPAY_KEY_SECRET.encode(),
            msg.encode(),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected, request.razorpay_signature):
            raise HTTPException(status_code=400, detail="Payment verification failed")

        # Get order from Firestore
        db = get_firestore_db()
        order_doc = db.collection("orders").document(request.razorpay_order_id).get()
        
        if not order_doc.exists:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order_data = order_doc.to_dict()
        uid = order_data.get("user_id")
        total_amount = order_data.get("total_amount", 0)
        cart_items = order_data.get("cart_items", [])
        
        # Calculate affiliate commission (4% of product sales)
        commission_percent = 0.04
        commission_amount = total_amount * commission_percent
        
        # Update order status
        db.collection("orders").document(request.razorpay_order_id).update({
            "status": "completed",
            "razorpay_payment_id": request.razorpay_payment_id,
            "razorpay_signature": request.razorpay_signature,
            "commission_amount": commission_amount,
            "completed_at": datetime.utcnow().isoformat()
        })

        # Log affiliate conversion for analytics
        db.collection("users").document(uid).collection("orders").document(request.razorpay_payment_id).set({
            "razorpay_order_id": request.razorpay_order_id,
            "razorpay_payment_id": request.razorpay_payment_id,
            "total_amount": total_amount,
            "commission_earned": commission_amount,
            "items_purchased": len(cart_items),
            "purchased_at": datetime.utcnow().isoformat()
        })

        return {
            "status": "success",
            "order_id": request.razorpay_order_id,
            "payment_id": request.razorpay_payment_id,
            "commission_earned": commission_amount,
            "total_amount": total_amount
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Payment verification error: {e}")
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

# ============================================
# AFFILIATE TRACKING (Phase 2)
# ============================================

class AffiliateClickData(BaseModel):
    """Track affiliate link clicks"""
    color: str
    category: str
    brand: str
    platform: str  # amazon, flipkart, myntra, meesho
    product_id: Optional[str] = None
    price: Optional[float] = None

@app.post("/api/affiliate/track-click")
async def track_affiliate_click(
    data: AffiliateClickData,
    current_user: dict = Depends(get_current_user)
):
    """Track when user clicks on affiliate links"""
    try:
        db = get_firestore_db()
        user_id = current_user.get("uid")
        
        click_doc = {
            "user_id": user_id,
            "color": data.color.lower(),
            "category": data.category.lower(),
            "brand": data.brand,
            "platform": data.platform.lower(),
            "product_id": data.product_id,
            "price": data.price,
            "timestamp": datetime.now().isoformat(),
            "date": datetime.now().strftime("%Y-%m-%d"),
            "hour": datetime.now().strftime("%Y-%m-%d %H:00:00")
        }
        
        # Store in affiliate_clicks collection
        db.collection("affiliate_clicks").add(click_doc)
        
        # Also store in user's affiliate_history subcollection
        db.collection("users").document(user_id).collection("affiliate_history").add(click_doc)
        
        print(f"[Affiliate] Click tracked: user={user_id}, platform={data.platform}, color={data.color}")
        
        return {
            "success": True,
            "message": "Click tracked successfully",
            "timestamp": click_doc["timestamp"]
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Affiliate] Error tracking click: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to track click: {str(e)}")

@app.get("/api/affiliate/analytics/summary")
async def get_affiliate_summary(current_user: dict = Depends(get_current_user)):
    """Get affiliate analytics summary for current user"""
    try:
        db = get_firestore_db()
        user_id = current_user.get("uid")
        
        # Get all clicks for user
        clicks = db.collection("affiliate_clicks").where("user_id", "==", user_id).stream()
        
        total_clicks = 0
        platform_stats = {}
        color_stats = {}
        category_stats = {}
        
        for click in clicks:
            data = click.to_dict()
            total_clicks += 1
            
            # Platform breakdown
            platform = data.get("platform", "unknown")
            platform_stats[platform] = platform_stats.get(platform, 0) + 1
            
            # Color breakdown
            color = data.get("color", "unknown")
            color_stats[color] = color_stats.get(color, 0) + 1
            
            # Category breakdown
            category = data.get("category", "unknown")
            category_stats[category] = category_stats.get(category, 0) + 1
        
        # Calculate estimated commission (conservative: 5% of clicks convert, ₹50 avg commission per conversion)
        estimated_conversions = int(total_clicks * 0.05)
        estimated_commission = estimated_conversions * 50
        
        return {
            "success": True,
            "total_clicks": total_clicks,
            "estimated_conversions": estimated_conversions,
            "estimated_commission": estimated_commission,
            "currency": "INR",
            "platform_breakdown": platform_stats,
            "color_breakdown": color_stats,
            "category_breakdown": category_stats,
            "top_color": max(color_stats, key=color_stats.get) if color_stats else None,
            "top_platform": max(platform_stats, key=platform_stats.get) if platform_stats else None
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Affiliate] Error getting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

@app.get("/api/affiliate/analytics/timeline")
async def get_affiliate_timeline(days: int = 7, current_user: dict = Depends(get_current_user)):
    """Get affiliate clicks over time (last N days)"""
    try:
        db = get_firestore_db()
        user_id = current_user.get("uid")
        
        clicks = db.collection("affiliate_clicks").where("user_id", "==", user_id).stream()
        
        daily_stats = {}
        for click in clicks:
            data = click.to_dict()
            date_str = data.get("date", "unknown")
            daily_stats[date_str] = daily_stats.get(date_str, 0) + 1
        
        # Sort by date
        sorted_dates = sorted(daily_stats.keys(), reverse=True)
        
        return {
            "success": True,
            "daily_stats": {date: daily_stats[date] for date in sorted_dates[:days]},
            "period_days": days
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Affiliate] Error getting timeline: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get timeline: {str(e)}")

@app.get("/api/affiliate/top-products")
async def get_top_affiliate_products(limit: int = 10, current_user: dict = Depends(get_current_user)):
    """Get most-clicked products"""
    try:
        db = get_firestore_db()
        user_id = current_user.get("uid")
        
        clicks = db.collection("affiliate_clicks").where("user_id", "==", user_id).stream()
        
        product_stats = {}
        for click in clicks:
            data = click.to_dict()
            key = f"{data.get('color')} - {data.get('category')} ({data.get('platform')})"
            product_stats[key] = product_stats.get(key, 0) + 1
        
        # Sort by clicks
        top_products = sorted(product_stats.items(), key=lambda x: x[1], reverse=True)[:limit]
        
        return {
            "success": True,
            "top_products": [{"product": name, "clicks": clicks} for name, clicks in top_products],
            "count": len(top_products)
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Affiliate] Error getting top products: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get top products: {str(e)}")

# ============================================
# RUN
# ============================================
if __name__ == "__main__":
    import uvicorn
    print("\nStyleGuru API starting...")
    print("API Docs: http://localhost:8000/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
