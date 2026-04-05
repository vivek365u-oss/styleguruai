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
# RUN
# ============================================
if __name__ == "__main__":
    import uvicorn
    print("\nStyleGuru API starting...")
    print("API Docs: http://localhost:8000/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
