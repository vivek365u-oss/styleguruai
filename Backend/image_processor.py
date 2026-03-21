import cv2
import numpy as np
from pathlib import Path


class PhotoQualityResult:
    def __init__(self):
        self.is_acceptable = True
        self.problems = []
        self.warnings = []
        self.quality_score = 100
        self.specific_message = ""


class ImageProcessor:
    def __init__(self):
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        if self.face_cascade.empty():
            raise Exception("Could not load face detector.")

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
            result.specific_message = "Photo quality is excellent! Analyzing your skin tone..."
        return result

    def _check_brightness(self, image: np.ndarray, result: PhotoQualityResult):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        avg_brightness = np.mean(gray)
        if avg_brightness < 60:
            result.problems.append({
                "type": "too_dark",
                "severity": "high",
                "message": "Tumhari photo bahut dark hai",
                "fix": "Kisi window ke paas jaao ya light on karo, phir selfie lo"
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
                "type": "overexposed",
                "severity": "high",
                "message": "Photo bahut zyada bright hai — skin color wash out ho raha hai",
                "fix": "Direct sunlight se door raho, shade mein selfie lo"
            })
            result.quality_score -= 35
        elif avg_brightness > 200:
            result.warnings.append({
                "type": "slightly_bright",
                "message": "Photo thodi zyada bright hai",
                "fix": "Shade mein jaoge toh skin tone aur accurate aayega"
            })
            result.quality_score -= 10

    def _check_blur(self, image: np.ndarray, result: PhotoQualityResult):
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 50:
            result.problems.append({
                "type": "very_blurry",
                "severity": "high",
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
        img_height, img_width = image.shape[:2]
        img_area = img_height * img_width
        face_area = face["width"] * face["height"]
        face_ratio = face_area / img_area
        if face_ratio < 0.04:
            result.problems.append({
                "type": "face_too_small",
                "severity": "high",
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
        brightness_diff = abs(left_brightness - right_brightness)
        if brightness_diff > 60:
            darker_side = "left" if left_brightness < right_brightness else "right"
            result.problems.append({
                "type": "heavy_shadow",
                "severity": "high",
                "message": f"Tumhare chehere ke {darker_side} taraf bahut zyada shadow hai",
                "fix": "Light seedha saamne se aani chahiye"
            })
            result.quality_score -= 30
        elif brightness_diff > 35:
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
                "type": "face_angled",
                "severity": "medium",
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
                "type": "low_skin_visibility",
                "severity": "medium",
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
        else:
            msg = f"⚠️ {len(problems)} problems mili hain:\n\n"
            for i, p in enumerate(problems, 1):
                msg += f"{i}. {p['message']}\n   → Fix: {p['fix']}\n\n"
            return msg.strip()

    def _build_warning_message(self, warnings: list) -> str:
        if len(warnings) == 1:
            w = warnings[0]
            return f"💡 {w['message']}. {w['fix']}"
        else:
            msg = "💡 Kuch minor issues hain:\n\n"
            for w in warnings:
                msg += f"• {w['message']} → {w['fix']}\n"
            return msg.strip()

    def detect_face(self, image: np.ndarray) -> dict:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5,
            minSize=(80, 80), flags=cv2.CASCADE_SCALE_IMAGE
        )
        if len(faces) == 0:
            faces = self.face_cascade.detectMultiScale(
                gray, scaleFactor=1.05, minNeighbors=3,
                minSize=(60, 60), flags=cv2.CASCADE_SCALE_IMAGE
            )
        if len(faces) == 0:
            resized = cv2.resize(image, (800, int(image.shape[0] * 800 / image.shape[1])))
            gray_resized = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(
                gray_resized, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60)
            )
            if len(faces) > 0:
                ratio = image.shape[1] / 800
                largest = max(faces, key=lambda f: f[2] * f[3])
                x, y, w, h = largest
                return {
                    "x": int(x * ratio), "y": int(y * ratio),
                    "width": int(w * ratio), "height": int(h * ratio)
                }
        if len(faces) == 0:
            return None
        largest_face = max(faces, key=lambda f: f[2] * f[3])
        x, y, w, h = largest_face
        return {"x": int(x), "y": int(y), "width": int(w), "height": int(h)}

    def extract_skin_color(self, image: np.ndarray, face: dict) -> dict:
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
            hsv_region = cv2.cvtColor(region, cv2.COLOR_BGR2HSV)
            lower_skin = np.array([0, 20, 50], dtype=np.uint8)
            upper_skin = np.array([25, 180, 255], dtype=np.uint8)
            mask = cv2.inRange(hsv_region, lower_skin, upper_skin)
            lower_skin2 = np.array([165, 20, 50], dtype=np.uint8)
            upper_skin2 = np.array([180, 180, 255], dtype=np.uint8)
            mask2 = cv2.inRange(hsv_region, lower_skin2, upper_skin2)
            combined_mask = cv2.bitwise_or(mask, mask2)
            skin_pixels = region[combined_mask > 0]
            if len(skin_pixels) > 0:
                all_skin_pixels.extend(skin_pixels.tolist())
        if len(all_skin_pixels) == 0:
            forehead = image[
                y + int(h*0.15):y + int(h*0.35),
                x + int(w*0.30):x + int(w*0.70)
            ]
            if forehead.size > 0:
                avg = np.mean(forehead.reshape(-1, 3), axis=0)
                b, g, r = avg
            else:
                return {"r": 180, "g": 140, "b": 110, "hex": "#B48C6E"}
        else:
            skin_array = np.array(all_skin_pixels)
            avg = np.median(skin_array, axis=0)
            b, g, r = avg
        r, g, b = int(r), int(g), int(b)
        return {"r": r, "g": g, "b": b, "hex": f"#{r:02x}{g:02x}{b:02x}"}