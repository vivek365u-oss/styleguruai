import os
os.environ["PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION"] = "python"
import uuid
import time
import traceback
import numpy as np
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore as firebase_firestore
import razorpay

from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Request, Depends, Form, HTTPException, status
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
# FIREBASE INIT (Graceful handling)
# ============================================
FIREBASE_INITIALIZED = False
if not firebase_admin._apps:
    try:
        firebase_creds_json = os.environ.get("FIREBASE_CREDENTIALS_JSON")
        if firebase_creds_json:
            import json
            cred = credentials.Certificate(json.loads(firebase_creds_json))
            firebase_admin.initialize_app(cred)
            FIREBASE_INITIALIZED = True
            print("✅ Firebase initialized from environment variable")
        else:
            # Try local file if env var not set
            cred_path = Path("firebase-credentials.json")
            if cred_path.exists():
                cred = credentials.Certificate(str(cred_path))
                firebase_admin.initialize_app(cred)
                FIREBASE_INITIALIZED = True
                print("✅ Firebase initialized from local file")
            else:
                print("⚠️  FIREBASE NOT INITIALIZED - Set FIREBASE_CREDENTIALS_JSON env var or add firebase-credentials.json")
                print("⚠️  App will start but Firebase auth features will be disabled")
    except Exception as e:
        print(f"❌ Firebase initialization failed: {str(e)}")
        print("⚠️  Continuing without Firebase - some features may not work")

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
    if not FIREBASE_INITIALIZED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase authentication not configured. Please set FIREBASE_CREDENTIALS_JSON environment variable.",
        )
    try:
        decoded = firebase_auth.verify_id_token(token)
        uid = decoded["uid"]
        email = decoded.get("email", "")
        name = decoded.get("name", email)
        return {"uid": uid, "email": email, "full_name": name}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid. Please login again.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ============================================
# APP INIT
# ============================================
app = FastAPI(title="StyleGuru API", version="1.2.1")  # Payment Safety System: Idempotency + Logs (Force Deploy)
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

def perform_db_startup_checks():
    """Background task to avoid blocking the event loop on server startup"""
    try:
        from firebase_admin import firestore as _fs
        db = _fs.client()
        
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

@app.on_event("startup")
async def startup_event():
    """Check products on startup and clear old ones without gender field"""
    # Skip if Firebase not initialized - the startup check can run on first request instead
    if not FIREBASE_INITIALIZED:
        print("[STARTUP] ℹ️  Firebase not initialized - skipping product check (will run on first request)")
        return
    
    # CRITICAL RENDER FIX: We push this to a background thread so Uvicorn's event loop is not blocked.
    # Otherwise, Render's port scan timeout kills the application during slow synchronous DB initialization.
    import asyncio
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.get_event_loop()
    loop.run_in_executor(None, perform_db_startup_checks)

@app.get("/")
async def root():
    return {"message": "StyleGuru AI API is running"}

@app.get("/health")
async def health():
    """Fast health check endpoint - returns immediately without DB calls"""
    return {"status": "ok", "timestamp": time.time(), "service": "styleguruai"}

image_processor = ImageProcessor()
skin_classifier = SkinToneClassifier()
recommendation_engine = RecommendationEngine()

# ============================================
# MASTER COLOR LOOKUP TABLE — 200+ Fashion Colors
# ALL major fabric colors, shades, gradients
# ============================================
FASHION_COLOR_MAP = {
    # ─── WHITES & NEAR-WHITES ───
    "Pure White":       (255, 255, 255),
    "Off White":        (245, 245, 240),
    "Ivory":            (255, 255, 230),
    "Snow White":       (250, 250, 255),
    "Pearl":            (234, 230, 220),
    "Cream":            (253, 245, 210),
    "Bone":             (227, 218, 201),
    "Eggshell":         (240, 234, 214),
    "Linen":            (240, 230, 210),
    "Antique White":    (250, 235, 215),
    "Milk White":       (248, 244, 235),
    "Chalk White":      (242, 240, 236),

    # ─── GREYS ───
    "Platinum":         (229, 228, 226),
    "Light Grey":       (211, 211, 211),
    "Silver":           (192, 192, 192),
    "Ash Grey":         (178, 190, 181),
    "Grey":             (145, 145, 145),
    "Medium Grey":      (160, 160, 160),
    "Stone Grey":       (130, 128, 122),
    "Slate Grey":       (112, 128, 144),
    "Dark Grey":        (85,  85,  85),
    "Charcoal":         (54,  69,  79),
    "Space Grey":       (70,  70,  75),
    "Gunmetal":         (42,  52,  57),
    "Graphite":         (55,  56,  58),
    "Steel Grey":       (94, 130, 141),

    # ─── BLACKS ───
    "Soft Black":       (45,  45,  45),
    "Black":            (28,  28,  28),
    "Jet Black":        (12,  12,  12),
    "Midnight Black":   (18,  18,  22),
    "Obsidian":         (14,  20,  24),

    # ─── BROWNS & WARMTH ───
    "Beige":            (235, 225, 200),
    "Sand":             (225, 210, 175),
    "Tan":              (210, 180, 140),
    "Camel":            (193, 154, 107),
    "Khaki":            (195, 176, 145),
    "Wheat":            (220, 195, 150),
    "Taupe":            (180, 165, 145),
    "Light Brown":      (181, 101,  29),
    "Brown":            (150,  80,  20),
    "Medium Brown":     (120,  60,  15),
    "Walnut":           (119,  63,  26),
    "Coffee":           (111,  78,  55),
    "Dark Brown":       (92,   64,  51),
    "Chocolate":        (65,   40,  20),
    "Mocha":            (78,   60,  45),
    "Espresso":         (53,   31,  20),
    "Mahogany":         (192,  64,   0),
    "Cinnamon":         (180,  95,  45),
    "Rust":             (183,  65,  14),
    "Burnt Sienna":     (193,  90,  38),
    "Copper":           (184, 115,  51),
    "Bronze":           (205, 127,  50),
    "Caramel":          (200, 130,  60),
    "Amber":            (210, 150,  40),
    "Sepia":            (112,  66,  20),

    # ─── REDS ───
    "Light Red":        (255, 140, 140),
    "Salmon":           (250, 128, 114),
    "Coral Red":        (255,  80,  60),
    "Tomato Red":       (230,  60,  40),
    "Red":              (210,  25,  25),
    "Bright Red":       (255,   0,   0),
    "Crimson":          (220,  20,  60),
    "Fire Red":         (210,  30,  30),
    "Dark Red":         (139,   0,   0),
    "Ruby":             (155,  17,  30),
    "Scarlet":          (200,  30,  30),
    "Burgundy":         (128,  20,  35),
    "Maroon":           (110,  15,  15),
    "Wine":             (114,  38,  42),
    "Oxblood":          (100,  25,  30),
    "Brick Red":        (178,  34,  34),
    "Cherry Red":       (220,  20,  60),

    # ─── PINKS (Retail-Accurate — mall/brand names) ───
    "Flush Pink":       (255, 235, 235),   # barely-there hint of pink
    "Baby Pink":        (248, 200, 210),   # very pale, pastel pink
    "Blush Pink":       (245, 185, 195),   # soft blush, bridal range
    "Blush":            (240, 175, 185),   # makeup/blush shade
    "Light Pink":       (255, 180, 200),   # standard light pink
    "Soft Pink":        (250, 165, 182),   # slightly deeper pastel
    "Pastel Pink":      (255, 175, 195),   # pastel range
    "Dusty Rose":       (210, 145, 150),   # muted, earthy rose (Zara/H&M label)
    "Mauve":            (195, 145, 160),   # grey-pink, muted
    "Rose":             (230, 130, 145),   # true rose — like rose flower, muted warm pink
    "Coral Pink":       (248, 131, 121),   # orange-tinted pink
    "Peach Pink":       (255, 185, 155),   # peachy pink
    "Pink":             (255, 105, 155),   # standard retail "Pink" label
    "Dark Pink":        (230,  75, 130),   # deeper saturated pink
    "Hot Pink":         (245,  70, 145),   # ← #f55897 maps HERE (vivid electric pink)
    "Bright Pink":      (250,  20, 130),   # brighter electric pink
    "Neon Pink":        (255,   5, 110),   # neon/fluorescent pink
    "Deep Pink":        (215,  20, 110),   # darkest vivid pink
    "Fuchsia":          (200,   0, 130),   # blue-tinted vivid pink (H&M Fuchsia)
    "Magenta":          (255,   0, 200),   # true magenta — red+blue equal
    "Hot Magenta":      (240,   0, 180),   # hot magenta
    "Rose Pink":        (255,  90, 170),   # rose-tinted vivid pink
    "Berry Pink":       (175,  50, 110),   # deep berry pink

    # ─── BLUES ───
    "Ice Blue":         (210, 245, 255),
    "Alice Blue":       (240, 248, 255),
    "Baby Blue":        (190, 230, 250),
    "Light Blue":       (173, 216, 230),
    "Powder Blue":      (176, 224, 230),
    "Sky Blue":         (135, 206, 235),
    "Pale Blue":        (155, 200, 220),
    "Cerulean":         (100, 180, 225),
    "Steel Blue":       (70,  130, 180),
    "Cornflower Blue":  (100, 149, 237),
    "Azure":            (30,  144, 255),
    "Dodger Blue":      (30,  110, 250),
    "Blue":             (35,   75, 190),
    "Royal Blue":       (65,  105, 225),
    "Cobalt Blue":      (10,   80, 175),
    "Denim Blue":       (21,   96, 189),
    "Sapphire":         (18,   87, 190),
    "Standard Blue":    (0,    60, 200),
    "Deep Blue":        (0,    42, 140),
    "Navy Blue":        (25,   35,  80),
    "Dark Navy":        (15,   20,  50),
    "Midnight Blue":    (20,   22, 105),
    "Prussian Blue":    (0,    49,  83),
    "Indigo":           (75,    0, 130),
    "Turquoise":        (64,  224, 208),
    "Teal":             (0,   128, 128),
    "Peacock Blue":     (50,  100, 160),
    "Cyan":             (0,   210, 230),

    # ─── GREENS ───
    "Mint Green":       (152, 255, 152),
    "Honeydew":         (220, 255, 220),
    "Pale Green":       (180, 235, 180),
    "Light Green":      (145, 230, 145),
    "Pistachio":        (147, 197, 114),
    "Lime Green":       (50,  205,  50),
    "Neon Green":       (57,  255,  20),
    "Spring Green":     (0,   210, 100),
    "Sea Green":        (46,  139,  87),
    "Medium Green":     (60,  170,  60),
    "Green":            (20,  140,  20),
    "Kelly Green":      (76,  187,  23),
    "Emerald":          (50,  165,  90),
    "Fern Green":       (79,  121,  66),
    "Sage Green":       (140, 155, 140),
    "Moss Green":       (100, 120,  70),
    "Olive Green":      (85,  107,  47),
    "Army Green":       (75,   83,  32),
    "Light Olive":      (145, 155, 100),
    "Forest Green":     (34,  139,  34),
    "Dark Green":       (1,    60,  30),
    "Hunter Green":     (53,   94,  59),
    "Teal Green":       (0,   130, 100),
    "Bottle Green":     (0,   106,  78),
    "Jungle Green":     (41,  130,  80),

    # ─── YELLOWS & GOLDS ───
    "Cream Yellow":     (255, 255, 210),
    "Light Yellow":     (255, 255, 180),
    "Lemon":            (253, 235,  20),
    "Canary Yellow":    (255, 240,  50),
    "Yellow":           (255, 220,  15),
    "Bright Yellow":    (255, 240,   0),
    "Banana":           (255, 225,  53),
    "Amber":            (255, 174,   0),
    "Mustard":          (220, 185,  50),
    "Dark Mustard":     (195, 155,  30),
    "Saffron":          (250, 167,  11),
    "Gold":             (215, 175,  55),
    "Antique Gold":     (205, 160,  50),
    "Dark Gold":        (180, 140,  30),
    "Peach":            (255, 215, 185),
    "Apricot":          (251, 200, 170),
    "Pale Peach":       (255, 230, 210),

    # ─── ORANGES ───
    "Light Orange":     (255, 200, 130),
    "Tangerine":        (245, 145,  10),
    "Orange":           (255, 160,   0),
    "Bright Orange":    (255, 110,   0),
    "Burnt Orange":     (200,  90,   0),
    "Dark Orange":      (200,  80,   0),
    "Pumpkin":          (210, 100,  20),
    "Terracotta":       (196,  98,  55),
    "Rust Orange":      (185,  80,  25),
    "Coral":            (255, 127,  80),

    # ─── PURPLES & VIOLETS ───
    "Lavender":         (230, 230, 250),
    "Pale Lavender":    (215, 210, 245),
    "Lilac":            (200, 162, 200),
    "Pale Purple":      (210, 185, 220),
    "Light Purple":     (200, 175, 215),
    "Wisteria":         (201, 160, 220),
    "Periwinkle":       (195, 195, 250),
    "Medium Purple":    (150, 100, 200),
    "Orchid":           (218, 112, 214),
    "Violet":           (180, 100, 220),
    "Purple":           (130,   0, 135),
    "Amethyst":         (150, 100, 210),
    "Plum":             (142,  69, 133),
    "Grape":            (111,  40, 170),
    "Dark Purple":      (90,    0, 100),
    "Deep Purple":      (58,    8,  68),
    "Eggplant":         (97,   64,  81),
    "Mulberry":         (130,  50,  85),
}


def _redmean_color_name(r: int, g: int, b: int) -> str:
    """Perceptual Redmean color distance formula — best for human vision."""
    min_dist = float('inf')
    closest_name = "Unknown"
    for name, (cr, cg, cb) in FASHION_COLOR_MAP.items():
        rmean = (r + cr) / 2
        dr, dg, db = r - cr, g - cg, b - cb
        dist = (((512 + rmean) * dr * dr) / 256
                + 4 * dg * dg
                + ((767 - rmean) * db * db) / 256) ** 0.5
        if dist < min_dist:
            min_dist = dist
            closest_name = name
    return closest_name


def _grabcut_segment_clothing(image: np.ndarray) -> np.ndarray:
    """
    Use OpenCV GrabCut to isolate clothing from background.
    Returns a binary mask (255 = clothing, 0 = background).
    Falls back gracefully if GrabCut fails.
    """
    import cv2
    h, w = image.shape[:2]

    # Define rect — generous center region where clothing lives
    # 10% from top/bottom/sides covers most outfit photos
    margin_x = int(w * 0.10)
    margin_y = int(h * 0.08)
    rect = (margin_x, margin_y, w - 2 * margin_x, h - 2 * margin_y)

    try:
        mask = np.zeros(image.shape[:2], np.uint8)
        bgd_model = np.zeros((1, 65), np.float64)
        fgd_model = np.zeros((1, 65), np.float64)

        # Run GrabCut (5 iterations is sufficient)
        cv2.grabCut(image, mask, rect, bgd_model, fgd_model, 5, cv2.GC_INIT_WITH_RECT)

        # Create final binary mask — keep FG and probable FG
        grab_mask = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

        # Safety: if GrabCut returns almost nothing, fall back to center crop mask
        fg_coverage = np.sum(grab_mask > 0) / (h * w)
        if fg_coverage < 0.10:
            # Build a safe center-crop mask instead
            grab_mask = np.zeros((h, w), np.uint8)
            cy1 = int(h * 0.15)
            cy2 = int(h * 0.85)
            cx1 = int(w * 0.15)
            cx2 = int(w * 0.85)
            grab_mask[cy1:cy2, cx1:cx2] = 255

        return grab_mask

    except Exception:
        # Pure fallback: center rectangle mask
        mask = np.zeros((h, w), np.uint8)
        mask[int(h*0.12):int(h*0.88), int(w*0.12):int(w*0.88)] = 255
        return mask


def _kmeans_on_masked_pixels(image_rgb: np.ndarray, mask: np.ndarray) -> tuple:
    """
    Extract dominant color from pixels inside the mask using K-Means.
    Returns (r, g, b).
    """
    import cv2

    pixels = image_rgb[mask > 0].reshape(-1, 3).astype(np.float32)

    if len(pixels) < 50:
        # Too few pixels — take mean
        mean = np.mean(image_rgb.reshape(-1, 3), axis=0)
        return int(mean[0]), int(mean[1]), int(mean[2])

    k = min(10, len(pixels) // 20)
    k = max(4, k)

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.2)
    try:
        _, labels, centers = cv2.kmeans(
            pixels, k, None, criteria, 20, cv2.KMEANS_PP_CENTERS
        )
    except Exception:
        mean = np.mean(pixels, axis=0)
        return int(mean[0]), int(mean[1]), int(mean[2])

    counts = np.bincount(labels.flatten(), minlength=len(centers))

    # Score each cluster: count weight + saturation bonus + dark-penalty
    best_idx = 0
    best_score = -1
    for i, center in enumerate(centers):
        r_c, g_c, b_c = float(center[0]), float(center[1]), float(center[2])
        brightness = (r_c + g_c + b_c) / 3.0

        # Skip near-pure-black shadow artifacts
        if brightness < 12:
            continue

        max_c = max(r_c, g_c, b_c)
        min_c = min(r_c, g_c, b_c)
        sat = (max_c - min_c) / (max_c + 1e-6)

        count_w = counts[i] / len(pixels)
        # Saturation bonus: vivid colors get slight preference
        sat_bonus = sat * 0.20
        # Brightest cluster slight preference, but not dominating
        bright_bonus = (brightness / 255.0) * 0.05
        score = count_w + sat_bonus + bright_bonus

        if score > best_score:
            best_score = score
            best_idx = i

    dominant = centers[best_idx]
    return int(dominant[0]), int(dominant[1]), int(dominant[2])


# ============================================
# MAIN — SMART DOMINANT COLOR EXTRACTION
# Multi-stage: GrabCut → API → Local K-Means
# ============================================
def extract_dominant_outfit_color(image: np.ndarray) -> dict:
    """
    Production-grade outfit color detection.
    Pipeline:
      1. Resize image to standard working size
      2. Run GrabCut to segment clothing from background
      3a. If Clarifai API is enabled: send GrabCut-masked image to Clarifai
      3b. If local: run K-Means on GrabCut masked pixels only
      4. Map RGB → fashion color name via Redmean perceptual distance
    """
    import cv2
    import os
    import base64
    import requests

    # ── Step 1: Resize to working resolution (800px max) ──
    h, w = image.shape[:2]
    max_dim = 800
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        image = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    # ── Step 2: GrabCut foreground segmentation ──
    clothing_mask = _grabcut_segment_clothing(image)

    # ── Step 3a: Clarifai API path ──
    engine = os.environ.get("OUTFIT_COLOR_ENGINE", "local").lower()
    if engine == "clarifai":
        pat = os.environ.get("CLARIFAI_PAT", "")
        if pat:
            try:
                # Build a masked image: zero out background before sending to Clarifai
                masked_image = image.copy()
                # Set background pixels to neutral grey so Clarifai ignores them
                masked_image[clothing_mask == 0] = [128, 128, 128]

                _, buffer = cv2.imencode('.jpg', masked_image, [cv2.IMWRITE_JPEG_QUALITY, 90])
                base64_image = base64.b64encode(buffer).decode('utf-8')

                url = "https://api.clarifai.com/v2/models/color-recognition/outputs"
                headers = {"Authorization": f"Key {pat}", "Content-Type": "application/json"}
                payload = {"inputs": [{"data": {"image": {"base64": base64_image}}}]}

                resp = requests.post(url, headers=headers, json=payload, timeout=6)
                if resp.status_code == 200:
                    data = resp.json()
                    color_list = data.get('outputs', [{}])[0].get('data', {}).get('colors', [])

                    best_val = -1
                    best_rgb = None
                    for c in color_list:
                        val = c.get('value', 0)
                        # Use raw_hex for actual color (w3c hex is too generic/simplified)
                        raw_hex = c.get('raw_hex', c.get('w3c', {}).get('hex', '#808080'))
                        raw_hex = raw_hex.lstrip('#')

                        if len(raw_hex) != 6:
                            continue

                        cr = int(raw_hex[0:2], 16)
                        cg = int(raw_hex[2:4], 16)
                        cb = int(raw_hex[4:6], 16)

                        # Skip neutral grey (our background fill) colors
                        if abs(cr - 128) < 10 and abs(cg - 128) < 10 and abs(cb - 128) < 10:
                            continue

                        # Skip near-black artifacts
                        if (cr + cg + cb) / 3 < 15:
                            continue

                        if val > best_val:
                            best_val = val
                            best_rgb = (cr, cg, cb)

                    if best_rgb:
                        r, g, b = best_rgb
                        print(f"[CLARIFAI] Detected RGB=({r},{g},{b})")
                        color_name = _redmean_color_name(r, g, b)
                        return {
                            "r": r, "g": g, "b": b,
                            "hex": f"#{r:02x}{g:02x}{b:02x}",
                            "name": color_name
                        }
            except Exception as e:
                print(f"[CLARIFAI ERROR] {e}. Falling back to local K-Means.")

    elif engine == "google":
        api_key = os.environ.get("GOOGLE_VISION_API_KEY", "")
        if api_key:
            try:
                # Send GrabCut-masked image to Google Vision
                masked_image = image.copy()
                masked_image[clothing_mask == 0] = [128, 128, 128]
                _, buffer = cv2.imencode('.jpg', masked_image, [cv2.IMWRITE_JPEG_QUALITY, 90])
                base64_image = base64.b64encode(buffer).decode('utf-8')
                url = f"https://vision.googleapis.com/v1/images:annotate?key={api_key}"
                payload = {"requests": [{"image": {"content": base64_image}, "features": [{"type": "IMAGE_PROPERTIES"}]}]}
                resp = requests.post(url, json=payload, timeout=6)
                if resp.status_code == 200:
                    data = resp.json()
                    colors = data['responses'][0]['imagePropertiesAnnotation']['dominantColors']['colors']
                    best_color = None
                    best_score = -1
                    for c in colors:
                        rgb = c['color']
                        cr = int(rgb.get('red', 0))
                        cg = int(rgb.get('green', 0))
                        cb = int(rgb.get('blue', 0))
                        brightness = (cr + cg + cb) / 3
                        # Skip both very dark and our neutral grey background fill
                        if brightness < 15:
                            continue
                        if abs(cr - 128) < 10 and abs(cg - 128) < 10 and abs(cb - 128) < 10:
                            continue
                        if c.get('score', 0) > best_score:
                            best_score = c.get('score', 0)
                            best_color = (cr, cg, cb)
                    if best_color:
                        r, g, b = best_color
                        print(f"[GOOGLE VISION] Detected RGB=({r},{g},{b})")
                        color_name = _redmean_color_name(r, g, b)
                        return {"r": r, "g": g, "b": b, "hex": f"#{r:02x}{g:02x}{b:02x}", "name": color_name}
            except Exception as e:
                print(f"[GOOGLE VISION ERROR] {e}. Falling back to local K-Means.")

    # ── Step 3b: Local K-Means fallback (GrabCut masked pixels) ──
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    r, g, b = _kmeans_on_masked_pixels(image_rgb, clothing_mask)
    print(f"[LOCAL KMEANS] Detected RGB=({r},{g},{b})")
    color_name = _redmean_color_name(r, g, b)
    return {"r": r, "g": g, "b": b, "hex": f"#{r:02x}{g:02x}{b:02x}", "name": color_name}



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
        
        # Compress image for faster analysis (doesn't affect skin tone accuracy)
        compressed_image, orig_size, comp_size = image_processor.compress_image_for_analysis(image, output_path=str(temp_path), quality=85)
        print(f"[COMPRESS] Original: {orig_size:.2f}MB -> Compressed: {comp_size:.2f}MB")
        image = compressed_image  # Use compressed image for all analysis
        
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
                "best_tshirt_colors": [{"name": c["name"], "hex": c["hex"], "reason": c["reason"]} for c in recommendations.best_tshirt_colors],
                "best_kurta_colors": [{"name": c["name"], "hex": c["hex"], "reason": c["reason"]} for c in recommendations.best_kurta_colors],
                "best_blazer_colors": [{"name": c["name"], "hex": c["hex"], "reason": c["reason"]} for c in recommendations.best_blazer_colors],
                "best_hoodie_colors": [{"name": c["name"], "hex": c["hex"], "reason": c["reason"]} for c in recommendations.best_hoodie_colors],
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
                "best_saree_colors": recommendations.get("best_saree_colors", []),
                "best_female_blazer_colors": recommendations.get("best_female_blazer_colors", []),
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
    gender: str = "male",
    current_user: dict = Depends(get_current_user)
):
    start_time = time.time()
    try:
        image, face, full_quality, skin_color, skin_tone, color_season = await process_image_core(file)
        seasonal_recs = recommendation_engine.get_seasonal_recommendations(skin_tone, season, lang=lang, gender=gender)
        processing_time = round(time.time() - start_time, 2)
        return JSONResponse(content={
            "success": True,
            "gender": gender,
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
    gender: str = Form(default="male"),
    clothing_type: str = Form(default="top"),
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
        result = recommendation_engine.check_outfit_compatibility(skin_tone, outfit_color, gender=gender, clothing_type=clothing_type, lang=lang)

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
# PHASE 1.3: MONETIZATION & LIMITS (RAZORPAY)
# ============================================
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_placeholder999x")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "secret_placeholder999x")
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def init_user_limits_if_needed(uid: str, db):
    doc_ref = db.collection("users").document(uid)
    doc = doc_ref.get()
    if not doc.exists:
        doc_ref.set({
            "is_pro": False,
            "coins": 0,
            "adFreeAnalysesLeft": 3,
            "analysisHistoryCount": 0,
            "adFreeOutfitChecks": 3,
            "planName": "free",
            "created_at": datetime.utcnow().isoformat()
        })
        return doc_ref.get().to_dict()
    return doc.to_dict()

@app.get("/api/users/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Fetch user's actual profile status and limits from Firebase."""
    uid = current_user["uid"]
    db = get_firestore_db()
    data = init_user_limits_if_needed(uid, db)
    return {"success": True, "data": data}

class ConsumeActionRequest(BaseModel):
    action: str  # e.g., 'analysis', 'outfit_check', 'history_save'

@app.post("/api/users/consume-action")
async def consume_limit(request: ConsumeActionRequest, current_user: dict = Depends(get_current_user)):
    """Safely decrement user limits based on the action performed."""
    uid = current_user["uid"]
    db = get_firestore_db()
    doc_ref = db.collection("users").document(uid)
    doc = doc_ref.get()
    
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    data = doc.to_dict()
    is_pro = data.get("is_pro", False)
    
    if is_pro:
        return {"success": True, "message": "Pro user, unlimited access granted"}

    # Implement limit tracking logic
    if request.action == 'analysis':
        current = data.get("adFreeAnalysesLeft", 0)
        coins = data.get("coins", 0)
        if current > 0:
            doc_ref.update({"adFreeAnalysesLeft": current - 1})
            return {"success": True, "adFreeAnalysesLeft": current - 1}
        elif coins > 0:
            # Consume 1 coin for Analysis
            doc_ref.update({"coins": coins - 1})
            return {"success": True, "coins": coins - 1, "message": "1 Coin consumed"}
        return {"success": False, "requires_ad": True}
        
    elif request.action == 'outfit_check':
        current = data.get("adFreeOutfitChecks", 0)
        coins = data.get("coins", 0)
        if current > 0:
            doc_ref.update({"adFreeOutfitChecks": current - 1})
            return {"success": True, "adFreeOutfitChecks": current - 1}
        elif coins > 0:
            # Consume 1 coin for Outfit Check
            doc_ref.update({"coins": coins - 1})
            return {"success": True, "coins": coins - 1, "message": "1 Coin consumed"}
        return {"success": False, "requires_ad": True}
        
    elif request.action == 'history_save':
        current = data.get("analysisHistoryCount", 0)
        if current < 5:
            doc_ref.update({"analysisHistoryCount": current + 1})
            return {"success": True, "analysisHistoryCount": current + 1}
        return {"success": False, "limit_reached": True}

    raise HTTPException(status_code=400, detail="Invalid action")

class CreateOrderRequest(BaseModel):
    tier: str # 'monthly', 'yearly', 'coins'

@app.post("/api/payment/create-order")
async def create_order(request: CreateOrderRequest, current_user: dict = Depends(get_current_user)):
    amount_in_inr = 0
    if request.tier == 'monthly':
        amount_in_inr = 499
    elif request.tier == 'yearly':
        amount_in_inr = 2499
    elif request.tier == 'coins':
        amount_in_inr = 199
    else:
        raise HTTPException(status_code=400, detail="Invalid tier")

    data = {
        "amount": amount_in_inr * 100,  # Razorpay expects paise
        "currency": "INR",
        "receipt": f"receipt_{current_user['uid'][:10]}",
        "notes": {
            "tier": request.tier,
            "uid": current_user["uid"]
        }
    }
    try:
        order = razorpay_client.order.create(data=data)
        return {"success": True, "order": order, "key": RAZORPAY_KEY_ID}
    except Exception as e:
        print(f"Razorpay Order Creation Failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    tier: str

@app.post("/api/payment/verify")
async def verify_payment(request: VerifyPaymentRequest, current_user: dict = Depends(get_current_user)):
    try:
        result = razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': request.razorpay_order_id,
            'razorpay_payment_id': request.razorpay_payment_id,
            'razorpay_signature': request.razorpay_signature
        })
        # If signature is valid, result is None or True
        uid = current_user["uid"]
        db = get_firestore_db()
        doc_ref = db.collection("users").document(uid)
        doc = doc_ref.get().to_dict() or {}
        
        updates = {}
        if request.tier in ['monthly', 'yearly']:
            updates['is_pro'] = True
            updates['planName'] = request.tier
        elif request.tier == 'coins':
            updates['coins'] = doc.get('coins', 0) + 50
            
        doc_ref.set(updates, merge=True)
        return {"success": True, "message": "Payment verified and tier upgraded successfully"}
    except Exception as e:
        print(f"Razorpay Verification Failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid Payment Signature")

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
                "image_url": f"https://dummyimage.com/400x500/f3e8ff/9333ea.jpg&text={product_info['category']}",  # reliable placeholder
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
# PHASE 1.4: PRODUCT ORDER CHECKOUT (REMOVED)
# ============================================
# Product ordering and payments have been disabled as the platform is now fully free.

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
# STYLE NAVIGATOR API (Core Engagement)
# ============================================

class NavigatorInsightsRequest(BaseModel):
    skin_tone: str
    undertone: str
    wardrobe_items: List[Dict]
    lang: Optional[str] = "en"

@app.post("/api/v1/style/navigator/insights")
async def get_navigator_insights(
    data: NavigatorInsightsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Provides deep style insights, harmony scoring, and OOTD suggestions"""
    try:
        from skin_tone_classifier import SkinToneResult
        engine = RecommendationEngine()
        
        # Convert raw strings to SkinToneResult object for the engine
        st_obj = SkinToneResult(
            category=data.skin_tone.lower(),
            subcategory=data.undertone.lower(),
            confidence="high" # Derived from profile
        )
        
        insights = engine.get_smart_wardrobe_insights(
            skin_tone=st_obj,
            wardrobe_items=data.wardrobe_items,
            lang=data.lang
        )
        
        return {
            "success": True,
            "insights": insights,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"❌ Style Navigator Error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Insights failure: {str(e)}")

# ============================================
# RUN
# ============================================
# SELFIE → STYLE RECOMMENDATION
# ============================================
from face_shape_detector import face_shape_detector

class SelfieStyleRequest(BaseModel):
    gender: str = "male"  # male | female

@app.post("/api/analyze/selfie-style")
@limiter.limit("5/minute")
async def analyze_selfie_style(
    request: Request,
    file: UploadFile = File(...),
    gender: str = "male",
    lang: str = "en",
    current_user: dict = Depends(get_current_user)
):
    """
    Full selfie analysis:
      1. Image quality gate (existing pipeline)
      2. Face detection (existing MediaPipe)
      3. Skin tone extraction (existing classifier)
      4. Face shape detection (new geometric landmark analysis)
      5. Hairstyle recommendations (new rule-based engine)
    Returns all data needed by the frontend SelfieStyleAdvisor component.
    """
    start_time = time.time()
    try:
        # ── Step 1-3: Existing Pipeline ──────────────────
        image, face, full_quality, skin_color, skin_tone, color_season = await process_image_core(file)

        # ── Step 4: Face Shape Detection ─────────────────
        face_shape_result = {"shape": "oval", "confidence": 0.5, "ratios": {}, "data": {}, "fallback": True}

        try:
            # Re-run MediaPipe to get landmarks (image_processor returns dict face, not landmarks)
            import mediapipe as mp
            import cv2

            mp_face_mesh = mp.solutions.face_mesh
            with mp_face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5
            ) as face_mesh:
                rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                results = face_mesh.process(rgb_image)

                if results.multi_face_landmarks:
                    h, w = image.shape[:2]
                    landmarks_raw = results.multi_face_landmarks[0].landmark
                    landmarks = {
                        i: (int(lm.x * w), int(lm.y * h))
                        for i, lm in enumerate(landmarks_raw)
                    }
                    face_shape_result = face_shape_detector.detect_shape(landmarks)
                    print(f"[SELFIE] Face shape: {face_shape_result['shape']} ({face_shape_result['confidence']:.0%} confidence)")
        except Exception as e:
            print(f"[SELFIE] Face shape detection skipped: {e}")

        # ── Step 5: Hairstyle Recommendations ────────────
        shape_key = face_shape_result.get("shape", "oval")
        hairstyle_recs = face_shape_detector.get_hairstyle_recommendations(
            shape=shape_key,
            gender=gender,
            skin_tone=skin_tone.category,
            limit=5
        )

        # ── Compose final response ────────────────────────
        processing_time = round(time.time() - start_time, 2)
        return JSONResponse(content={
            "success": True,
            "gender": gender,
            "processing_time_seconds": processing_time,
            "photo_quality": {
                "score": full_quality.quality_score,
                "message": full_quality.specific_message,
                "warnings": full_quality.warnings,
            },
            "skin_analysis": {
                "skin_color": {"hex": skin_color["hex"], "rgb": {"r": skin_color["r"], "g": skin_color["g"], "b": skin_color["b"]}},
                "skin_tone": skin_tone.category,
                "undertone": skin_tone.subcategory,
                "brightness_score": skin_tone.brightness_score,
                "color_season": color_season,
                "confidence": skin_tone.confidence,
                "description": skin_tone.description,
            },
            "face_shape": {
                "shape": face_shape_result.get("shape", "oval"),
                "confidence": face_shape_result.get("confidence", 0.5),
                "display": face_shape_result.get("data", {}).get("display", "Oval"),
                "description": face_shape_result.get("data", {}).get("description", ""),
                "icon": face_shape_result.get("data", {}).get("icon", "🥚"),
                "characteristics": face_shape_result.get("data", {}).get("characteristics", []),
                "celebrity_examples": face_shape_result.get("data", {}).get("celebrity_examples", []),
                "ratios": face_shape_result.get("ratios", {}),
                "is_fallback": face_shape_result.get("fallback", False),
            },
            "hairstyle_recommendations": hairstyle_recs,
            "style_tips": {
                "primary": f"Your {face_shape_result.get('data', {}).get('display','oval')} face shape pairs beautifully with tailored hairstyles that enhance your natural bone structure.",
                "skin_tone_tip": f"With your {skin_tone.category} skin tone and {skin_tone.subcategory} undertone, warm-toned hair colors will complement you best.",
                "color_season": color_season,
            }
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR selfie-style: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail={"error": "server_error", "message": "Something went wrong. Please try again."})


# ============================================
if __name__ == "__main__":
    import uvicorn
    print("\nStyleGuru API starting...")
    print("API Docs: http://localhost:8000/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
