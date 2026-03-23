import cv2
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PhotoQualityResult:
    def __init__(self):
        self.is_acceptable = True
        self.problems = []
        self.warnings = []
        self.quality_score = 100
        self.specific_message = ""


class ImageProcessor:

    def __init__(self):
        try:
            import mediapipe as mp
            self.mp_face_detection = mp.solutions.face_detection
            self.mp_face_mesh = mp.solutions.face_mesh
            self.face_detector = self.mp_face_detection.FaceDetection(
                model_selection=1,
                min_detection_confidence=0.5
            )
            self.face_mesh_detector = self.mp_face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5
            )
            self.mediapipe_available = True
            logger.info("MediaPipe loaded successfully")
        except Exception as e:
            logger.warning(f"MediaPipe not available: {e}")
            self.mediapipe_available = False
            self.face_detector = None
            self.face_mesh_detector = None

        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.haar_cascade = cv2.CascadeClassifier(cascade_path)
        logger.info("ImageProcessor initialized")

    def load_image(self, image_path: str) -> np.ndarray:
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Cannot read image at: {image_path}")
        return image

    def load_image_from_bytes(self, image_bytes: bytes) -> np.ndarray:
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Cannot decode the uploaded image")
        return image

    def detect_face(self, image: np.ndarray) -> dict:
        processed_image = self._resize_for_processing(image)
        scale_x = image.shape[1] / processed_image.shape[1]
        scale_y = image.shape[0] / processed_image.shape[0]

        if self.mediapipe_available:
            face = self._detect_mediapipe(processed_image, scale_x, scale_y)
            if face:
                return face

        face = self._detect_haar(image)
        if face:
            return face

        enhanced = self._enhance_low_light(image)
        if self.mediapipe_available:
            face = self._detect_mediapipe(enhanced, 1.0, 1.0)
            if face:
                return face

        return self._detect_haar(enhanced)

    def _detect_mediapipe(self, image: np.ndarray, scale_x: float = 1.0, scale_y: float = 1.0) -> dict:
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = self.face_detector.process(rgb_image)

        if not results.detections:
            return None

        best_detection = max(results.detections, key=lambda d: d.score[0])

        if best_detection.score[0] < 0.5:
            return None

        bbox = best_detection.location_data.relative_bounding_box
        h, w = image.shape[:2]

        x = max(0, int(bbox.xmin * w * scale_x))
        y = max(0, int(bbox.ymin * h * scale_y))
        width = int(bbox.width * w * scale_x)
        height = int(bbox.height * h * scale_y)

        img_h = int(image.shape[0] * scale_y)
        img_w = int(image.shape[1] * scale_x)
        x = min(x, img_w - 1)
        y = min(y, img_h - 1)
        width = min(width, img_w - x)
        height = min(height, img_h - y)

        if width <= 0 or height <= 0:
            return None

        return {
            "x": x, "y": y,
            "width": width, "height": height,
            "confidence": round(float(best_detection.score[0]), 3),
            "method": "mediapipe"
        }

    def _detect_haar(self, image: np.ndarray) -> dict:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        for (scale, neighbors, min_size) in [
            (1.1, 5, (80, 80)),
            (1.05, 3, (60, 60)),
            (1.1, 3, (50, 50)),
        ]:
            faces = self.haar_cascade.detectMultiScale(
                gray, scaleFactor=scale,
                minNeighbors=neighbors,
                minSize=min_size,
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            if len(faces) > 0:
                largest = max(faces, key=lambda f: f[2] * f[3])
                x, y, w, h = largest
                return {
                    "x": int(x), "y": int(y),
                    "width": int(w), "height": int(h),
                    "confidence": 0.7,
                    "method": "haar_cascade"
                }
        return None

    def _get_face_landmarks(self, image: np.ndarray, face: dict) -> dict:
        if not self.mediapipe_available or self.face_mesh_detector is None:
            return None
        try:
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = self.face_mesh_detector.process(rgb_image)
            if not results.multi_face_landmarks:
                return None
            landmarks = results.multi_face_landmarks[0]
            h, w = image.shape[:2]
            points = {}
            for idx, lm in enumerate(landmarks.landmark):
                points[idx] = (int(lm.x * w), int(lm.y * h))
            return points
        except Exception:
            return None

    def validate_face_for_skin_analysis(self, image: np.ndarray, face: dict) -> dict:
        x, y, w, h = face["x"], face["y"], face["width"], face["height"]
        img_height, img_width = image.shape[:2]
        img_area = img_height * img_width
        face_area = w * h

        face_ratio = face_area / img_area
        if face_ratio < 0.02:
            return {
                "valid": False,
                "reason": "⚠️ Yeh koi face nahi hai ya bahut chota hai.\n\n✅ Fix: Apni selfie upload karo — charts ya documents nahi."
            }

        aspect_ratio = w / h
        if aspect_ratio < 0.4 or aspect_ratio > 2.5:
            return {
                "valid": False,
                "reason": "⚠️ Detected region human face nahi lagta.\n\n✅ Fix: Seedha apni selfie upload karo."
            }

        face_region = image[y:y+h, x:x+w]
        if face_region.size == 0:
            return {"valid": False, "reason": "⚠️ Face region empty hai."}

        hsv = cv2.cvtColor(face_region, cv2.COLOR_BGR2HSV)
        lower_skin1 = np.array([0, 20, 50], dtype=np.uint8)
        upper_skin1 = np.array([25, 180, 255], dtype=np.uint8)
        lower_skin2 = np.array([165, 20, 50], dtype=np.uint8)
        upper_skin2 = np.array([180, 180, 255], dtype=np.uint8)
        mask1 = cv2.inRange(hsv, lower_skin1, upper_skin1)
        mask2 = cv2.inRange(hsv, lower_skin2, upper_skin2)
        combined = cv2.bitwise_or(mask1, mask2)

        total_pixels = face_region.shape[0] * face_region.shape[1]
        skin_pixels = np.sum(combined > 0)
        skin_ratio = skin_pixels / total_pixels

        if skin_ratio < 0.12:
            return {
                "valid": False,
                "reason": "⚠️ Yeh photo kisi insaan ki nahi lagti.\n\n✅ Fix: Apni clear selfie upload karo. Charts, documents ya objects upload mat karo."
            }

        face_bgr = face_region.reshape(-1, 3).astype(np.float32)
        mean_color = np.mean(face_bgr, axis=0)
        b_mean, g_mean, r_mean = mean_color

        if r_mean < b_mean:
            return {
                "valid": False,
                "reason": "⚠️ Yeh insaan ka chehra nahi lagta.\n\n✅ Fix: Apni selfie upload karo."
            }

        gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        brightness_std = np.std(gray)
        if brightness_std > 90:
            return {
                "valid": False,
                "reason": "⚠️ Yeh photo chart ya document lagta hai.\n\n✅ Fix: Apni natural selfie upload karo."
            }

        return {
            "valid": True,
            "reason": "Face validated successfully",
            "skin_ratio": round(skin_ratio, 3),
            "face_ratio": round(face_ratio, 3)
        }

    def analyze_photo_quality(self, image: np.ndarray, face: dict = None) -> PhotoQualityResult:
        result = PhotoQualityResult()
        self._check_brightness(image, result)
        self._check_blur(image, result)
        if face:
            self._check_face_size(image, face, result)
            self._check_shadow(image, face, result)
            self._check_face_angle(image, face, result)
            self._check_skin_pixels(image, face, result)
        if result.problems:
            result.is_acceptable = False
            result.specific_message = self._build_problem_message(result.problems)
        elif result.warnings:
            result.specific_message = self._build_warning_message(result.warnings)
        else:
            result.specific_message = "Photo quality is excellent!"
        return result

    def _check_brightness(self, image: np.ndarray, result: PhotoQualityResult):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        avg_brightness = np.mean(gray)
        if avg_brightness < 60:
            result.problems.append({
                "type": "too_dark", "severity": "high",
                "message": "Tumhari photo bahut dark hai",
                "fix": "Kisi window ke paas jaao ya light on karo"
            })
            result.quality_score -= 40
        elif avg_brightness < 90:
            result.warnings.append({
                "type": "slightly_dark",
                "message": "Photo thodi dark hai",
                "fix": "Thodi aur light mein jaoge toh better results milenge"
            })
            result.quality_score -= 15
        elif avg_brightness > 230:
            result.problems.append({
                "type": "overexposed", "severity": "high",
                "message": "Photo bahut zyada bright hai",
                "fix": "Direct sunlight se door raho, shade mein selfie lo"
            })
            result.quality_score -= 35
        elif avg_brightness > 200:
            result.warnings.append({
                "type": "slightly_bright",
                "message": "Photo thodi zyada bright hai",
                "fix": "Shade mein jaoge toh better results milenge"
            })
            result.quality_score -= 10

    def _check_blur(self, image: np.ndarray, result: PhotoQualityResult):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 50:
            result.problems.append({
                "type": "very_blurry", "severity": "high",
                "message": "Photo bahut blurry hai",
                "fix": "Phone ko stable rakh aur clearly focus karke selfie lo"
            })
            result.quality_score -= 45
        elif laplacian_var < 100:
            result.warnings.append({
                "type": "slightly_blurry",
                "message": "Photo thodi blurry hai",
                "fix": "Phone ko thoda still rakh ke selfie lo"
            })
            result.quality_score -= 15

    def _check_face_size(self, image: np.ndarray, face: dict, result: PhotoQualityResult):
        img_area = image.shape[0] * image.shape[1]
        face_area = face["width"] * face["height"]
        face_ratio = face_area / img_area
        if face_ratio < 0.04:
            result.problems.append({
                "type": "face_too_small", "severity": "high",
                "message": "Tumhara chehra photo mein bahut chota dikh raha hai",
                "fix": "Phone ko apne chehere ke paas laao"
            })
            result.quality_score -= 35
        elif face_ratio < 0.08:
            result.warnings.append({
                "type": "face_small",
                "message": "Chehra thoda chota hai",
                "fix": "Thoda aur paas se selfie loge toh better hoga"
            })
            result.quality_score -= 10

    def _check_shadow(self, image: np.ndarray, face: dict, result: PhotoQualityResult):
        x, y, w, h = face["x"], face["y"], face["width"], face["height"]
        mid_x = x + w // 2
        left_face = image[y:y+h, x:mid_x]
        right_face = image[y:y+h, mid_x:x+w]
        if left_face.size == 0 or right_face.size == 0:
            return
        left_brightness = np.mean(cv2.cvtColor(left_face, cv2.COLOR_BGR2GRAY))
        right_brightness = np.mean(cv2.cvtColor(right_face, cv2.COLOR_BGR2GRAY))
        diff = abs(left_brightness - right_brightness)
        if diff > 60:
            darker_side = "left" if left_brightness < right_brightness else "right"
            result.problems.append({
                "type": "heavy_shadow", "severity": "high",
                "message": f"Chehere ke {darker_side} taraf bahut shadow hai",
                "fix": "Light seedha saamne se aani chahiye"
            })
            result.quality_score -= 30
        elif diff > 35:
            result.warnings.append({
                "type": "mild_shadow",
                "message": "Ek taraf thoda shadow hai",
                "fix": "Light source ko seedha apne saamne rakhoge toh better results milenge"
            })
            result.quality_score -= 12

    def _check_face_angle(self, image: np.ndarray, face: dict, result: PhotoQualityResult):
        x, y, w, h = face["x"], face["y"], face["width"], face["height"]
        aspect_ratio = w / h
        if aspect_ratio < 0.6:
            result.problems.append({
                "type": "face_angled", "severity": "medium",
                "message": "Tumhara chehra side se dikh raha hai",
                "fix": "Camera ko seedha apne saamne rakho"
            })
            result.quality_score -= 25
        elif aspect_ratio < 0.7:
            result.warnings.append({
                "type": "slight_angle",
                "message": "Chehra thoda side mein hai",
                "fix": "Camera ko directly dekho"
            })
            result.quality_score -= 10

    def _check_skin_pixels(self, image: np.ndarray, face: dict, result: PhotoQualityResult):
        x, y, w, h = face["x"], face["y"], face["width"], face["height"]
        face_region = image[y:y+h, x:x+w]
        if face_region.size == 0:
            return
        hsv = cv2.cvtColor(face_region, cv2.COLOR_BGR2HSV)
        lower_skin = np.array([0, 20, 50], dtype=np.uint8)
        upper_skin = np.array([25, 180, 255], dtype=np.uint8)
        mask1 = cv2.inRange(hsv, lower_skin, upper_skin)
        lower_skin2 = np.array([165, 20, 50], dtype=np.uint8)
        upper_skin2 = np.array([180, 180, 255], dtype=np.uint8)
        mask2 = cv2.inRange(hsv, lower_skin2, upper_skin2)
        combined = cv2.bitwise_or(mask1, mask2)
        total_pixels = face_region.shape[0] * face_region.shape[1]
        skin_pixels = np.sum(combined > 0)
        skin_ratio = skin_pixels / total_pixels
        if skin_ratio < 0.25:
            result.problems.append({
                "type": "low_skin_visibility", "severity": "medium",
                "message": "Chehra kuch cheez se dhaka hua lag raha hai",
                "fix": "Sunglasses ya mask hata do"
            })
            result.quality_score -= 30
        elif skin_ratio < 0.40:
            result.warnings.append({
                "type": "partial_coverage",
                "message": "Chehra poori tarah visible nahi hai",
                "fix": "Baalon ko side mein kar lo"
            })
            result.quality_score -= 10

    def _build_problem_message(self, problems: list) -> str:
        if len(problems) == 1:
            p = problems[0]
            return f"⚠️ {p['message']}.\n\n✅ Fix: {p['fix']}"
        msg = f"⚠️ {len(problems)} problems mili hain:\n\n"
        for i, p in enumerate(problems, 1):
            msg += f"{i}. {p['message']}\n   → Fix: {p['fix']}\n\n"
        return msg.strip()

    def _build_warning_message(self, warnings: list) -> str:
        if len(warnings) == 1:
            w = warnings[0]
            return f"💡 {w['message']}. {w['fix']}"
        msg = "💡 Kuch minor issues hain:\n\n"
        for w in warnings:
            msg += f"• {w['message']} → {w['fix']}\n"
        return msg.strip()

    def extract_skin_color(self, image: np.ndarray, face: dict) -> dict:
        landmarks = self._get_face_landmarks(image, face)
        if landmarks:
            return self._extract_skin_with_landmarks(image, face, landmarks)
        return self._extract_skin_geometric(image, face)

    def _extract_skin_with_landmarks(self, image: np.ndarray, face: dict, landmarks: dict) -> dict:
        all_skin_pixels = []
        forehead_indices = [10, 67, 69, 104, 108, 151, 337, 338, 297, 299]
        left_cheek_indices = [116, 117, 118, 119, 120, 121, 126, 142]
        right_cheek_indices = [345, 346, 347, 348, 349, 350, 355, 371]
        nose_indices = [1, 2, 4, 5, 6, 94, 97, 98, 99]
        chin_indices = [152, 148, 176, 149, 150, 136, 172]

        for region_indices in [forehead_indices, left_cheek_indices, right_cheek_indices, nose_indices, chin_indices]:
            valid_points = [landmarks[idx] for idx in region_indices if idx in landmarks]
            if len(valid_points) < 3:
                continue
            pixels = self._sample_region_pixels(image, valid_points)
            if pixels:
                all_skin_pixels.extend(pixels)

        if not all_skin_pixels:
            return self._extract_skin_geometric(image, face)
        return self._calculate_skin_color(all_skin_pixels)

    def _sample_region_pixels(self, image: np.ndarray, points: list) -> list:
        if not points:
            return []
        xs = [p[0] for p in points]
        ys = [p[1] for p in points]
        x1, x2 = max(0, min(xs)), min(image.shape[1]-1, max(xs))
        y1, y2 = max(0, min(ys)), min(image.shape[0]-1, max(ys))
        if x2 <= x1 or y2 <= y1:
            return []
        region = image[y1:y2, x1:x2]
        if region.size == 0:
            return []
        return self._filter_skin_pixels(region)

    def _extract_skin_geometric(self, image: np.ndarray, face: dict) -> dict:
        x, y, w, h = face["x"], face["y"], face["width"], face["height"]
        regions_coords = [
            (y + int(h*0.15), y + int(h*0.30), x + int(w*0.30), x + int(w*0.70)),
            (y + int(h*0.50), y + int(h*0.72), x + int(w*0.05), x + int(w*0.28)),
            (y + int(h*0.50), y + int(h*0.72), x + int(w*0.72), x + int(w*0.95)),
            (y + int(h*0.35), y + int(h*0.55), x + int(w*0.40), x + int(w*0.60)),
            (y + int(h*0.75), y + int(h*0.90), x + int(w*0.35), x + int(w*0.65)),
        ]
        all_skin_pixels = []
        for (y1, y2, x1, x2) in regions_coords:
            region = image[y1:y2, x1:x2]
            if region.size == 0:
                continue
            pixels = self._filter_skin_pixels(region)
            all_skin_pixels.extend(pixels)

        if not all_skin_pixels:
            forehead = image[y + int(h*0.15):y + int(h*0.35), x + int(w*0.30):x + int(w*0.70)]
            if forehead.size > 0:
                avg = np.mean(forehead.reshape(-1, 3), axis=0)
                b, g, r = avg
                r, g, b = int(r), int(g), int(b)
                return {"r": r, "g": g, "b": b, "hex": f"#{r:02x}{g:02x}{b:02x}"}
            return {"r": 180, "g": 140, "b": 110, "hex": "#B48C6E"}

        return self._calculate_skin_color(all_skin_pixels)

    def _filter_skin_pixels(self, region: np.ndarray) -> list:
        if region.size == 0:
            return []
        hsv_region = cv2.cvtColor(region, cv2.COLOR_BGR2HSV)
        lower_skin = np.array([0, 20, 50], dtype=np.uint8)
        upper_skin = np.array([25, 180, 255], dtype=np.uint8)
        mask = cv2.inRange(hsv_region, lower_skin, upper_skin)
        lower_skin2 = np.array([165, 20, 50], dtype=np.uint8)
        upper_skin2 = np.array([180, 180, 255], dtype=np.uint8)
        mask2 = cv2.inRange(hsv_region, lower_skin2, upper_skin2)
        combined_mask = cv2.bitwise_or(mask, mask2)
        skin_pixels = region[combined_mask > 0]
        return skin_pixels.tolist() if len(skin_pixels) > 0 else []

    def _calculate_skin_color(self, skin_pixels: list) -> dict:
        skin_array = np.array(skin_pixels)
        avg = np.median(skin_array, axis=0)
        b, g, r = avg
        r, g, b = int(r), int(g), int(b)
        return {"r": r, "g": g, "b": b, "hex": f"#{r:02x}{g:02x}{b:02x}"}

    def _resize_for_processing(self, image: np.ndarray, max_dim: int = 1280) -> np.ndarray:
        h, w = image.shape[:2]
        if max(h, w) <= max_dim:
            return image
        if w > h:
            new_w, new_h = max_dim, int(h * max_dim / w)
        else:
            new_h, new_w = max_dim, int(w * max_dim / h)
        return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)

    def _enhance_low_light(self, image: np.ndarray) -> np.ndarray:
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        lab = cv2.merge([l, a, b])
        return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)