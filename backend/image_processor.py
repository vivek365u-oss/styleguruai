"""
image_processor.py — StyleGuru AI
====================================
Core image processing pipeline for face detection, quality analysis,
and skin color extraction.

Components:
  - PhotoQualityResult : Data class for photo quality check results
  - ImageProcessor     : Main class handling all CV2 / MediaPipe operations

Face detection uses a cascade:
  1. MediaPipe FaceDetection (primary — fastest, most accurate)
  2. OpenCV Haar Cascade fallback (for bad lighting / obscured faces)
  3. CLAHE-enhanced retry on the enhanced low-light image

Skin color extraction uses:
  - MediaPipe FaceMesh 468-point landmarks for precise region sampling
  - Geometric fallback (forehead, cheeks, nose, chin) when landmarks fail
  - HSV-based skin pixel filtering to exclude non-skin areas
"""
import cv2
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PhotoQualityResult:
    """Container for photo quality check results.

    Attributes:
        is_acceptable (bool): True if photo passes all hard-failure checks.
        problems (list): List of dicts describing hard failures (severity HIGH).
        warnings (list): List of dicts describing soft warnings (degraded accuracy).
        quality_score (int): 0–100 score. Starts at 100; deductions applied per issue.
        specific_message (str): Human-readable summary of the most important issue.
    """
    def __init__(self):
        self.is_acceptable = True
        self.problems = []
        self.warnings = []
        self.quality_score = 100
        self.specific_message = ""


class ImageProcessor:
    """Full image processing pipeline for StyleGuru AI.

    Handles face detection, quality validation, and skin color extraction.
    Automatically falls back from MediaPipe → Haar Cascade when needed.
    """

    def __init__(self):
        """Initialize MediaPipe and OpenCV detectors.

        Gracefully degrades if MediaPipe is not installed — falls back to
        Haar Cascade for face detection and geometric sampling for skin color.
        """
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
                min_detection_confidence=0.3,
                min_tracking_confidence=0.3
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
        """Load an image from disk into a BGR numpy array.

        Args:
            image_path: Absolute or relative path to the image file.

        Returns:
            BGR numpy array (H, W, 3).

        Raises:
            ValueError: If the file cannot be read or does not exist.
        """
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Cannot read image at: {image_path}")
        return image

    def load_image_from_bytes(self, image_bytes: bytes) -> np.ndarray:
        """Decode an image from raw bytes into a BGR numpy array.

        Args:
            image_bytes: Raw bytes of a JPEG, PNG, or WebP image.

        Returns:
            BGR numpy array (H, W, 3).

        Raises:
            ValueError: If the bytes cannot be decoded as a valid image.
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Cannot decode the uploaded image")
        return image

    def compress_image_for_analysis(self, image: np.ndarray, output_path: str = None, quality: int = 85) -> tuple:
        """
        Compress image for faster analysis without affecting skin tone accuracy.
        Skin analysis only needs ~1000x1000 px for accurate results.
        
        Args:
            image: Input image (numpy array)
            output_path: Optional path to save compressed image
            quality: JPEG quality (1-100, default 85)
            
        Returns:
            (compressed_image, original_size_mb, compressed_size_mb)
        """
        original_height, original_width = image.shape[:2]
        original_size_bytes = image.nbytes
        
        # Only compress if image is larger than 2000px in any dimension
        if original_height > 2000 or original_width > 2000:
            # Calculate scale factor to keep aspect ratio
            max_dimension = 2000
            scale = max_dimension / max(original_height, original_width)
            new_height = int(original_height * scale)
            new_width = int(original_width * scale)
            
            # Resize image
            compressed_image = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
            logger.info(f"Image resized from {original_width}x{original_height} to {new_width}x{new_height}")
        else:
            compressed_image = image
        
        # Save compressed image if output path provided
        if output_path:
            # Use JPEG compression for smaller file size
            cv2.imwrite(output_path, compressed_image, [cv2.IMWRITE_JPEG_QUALITY, quality])
            import os
            compressed_size_bytes = os.path.getsize(output_path)
        else:
            compressed_size_bytes = compressed_image.nbytes
        
        original_size_mb = original_size_bytes / (1024 * 1024)
        compressed_size_mb = compressed_size_bytes / (1024 * 1024)
        
        logger.info(f"Image compression: {original_size_mb:.2f}MB -> {compressed_size_mb:.2f}MB (saved {original_size_mb - compressed_size_mb:.2f}MB)")
        
        return compressed_image, original_size_mb, compressed_size_mb

    def detect_face(self, image: np.ndarray) -> dict:
        """Detect the largest face in the image using a cascade strategy.

        Detection order:
          1. MediaPipe FaceDetection (if available)
          2. OpenCV Haar Cascade fallback
          3. CLAHE low-light enhancement + retry both detectors

        Args:
            image: BGR numpy array.

        Returns:
            Dict with keys {x, y, width, height, confidence, method},
            or None if no face is found.
        """
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
        """Run MediaPipe FaceDetection on the image.

        Args:
            image: BGR numpy array (already resized for processing).
            scale_x: X-axis scale factor to map back to original resolution.
            scale_y: Y-axis scale factor to map back to original resolution.

        Returns:
            Face dict or None if no face detected with confidence >= 0.5.
        """
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
        """Run OpenCV Haar Cascade face detection with progressive relaxation.

        Tries three parameter sets (strict → relaxed) to maximise recall
        while keeping false positives low.

        Args:
            image: BGR numpy array.

        Returns:
            Largest face dict or None if no face found.
        """
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
        """Extract 468 MediaPipe FaceMesh landmarks from the image.

        Args:
            image: BGR numpy array.
            face: Face bounding box dict (unused directly; kept for API consistency).

        Returns:
            Dict mapping landmark index (int) → (x, y) pixel coordinates,
            or None if MediaPipe is unavailable or detection fails.
        """
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
        """Run heuristic checks to confirm a detected region is a human face.

        Validates: face size ratio, aspect ratio, HSV skin coverage,
        RGB channel ordering, and contrast (to reject charts/documents).

        Args:
            image: BGR numpy array (full resolution).
            face: Face bounding box dict from detect_face().

        Returns:
            Dict with keys:
              - valid (bool): True if all checks pass.
              - reason (str): Human-readable explanation.
              - skin_ratio (float): Fraction of face pixels classified as skin.
              - face_ratio (float): Fraction of image area occupied by face.
        """
        x, y, w, h = face["x"], face["y"], face["width"], face["height"]
        img_height, img_width = image.shape[:2]
        img_area = img_height * img_width
        face_area = w * h

        face_ratio = face_area / img_area
        if face_ratio < 0.02:
            return {
                "valid": False,
                "reason": "⚠️ No face detected or face is too small.\n\n✅ Fix: Please upload a selfie — not charts or documents."
            }

        aspect_ratio = w / h
        if aspect_ratio < 0.4 or aspect_ratio > 2.5:
            return {
                "valid": False,
                "reason": "⚠️ The detected region does not look like a human face.\n\n✅ Fix: Please upload a clear selfie."
            }

        face_region = image[y:y+h, x:x+w]
        if face_region.size == 0:
            return {"valid": False, "reason": "⚠️ Face region is empty."}

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
                "reason": "⚠️ This photo does not appear to be a person.\n\n✅ Fix: Please upload a clear selfie. Do not upload charts, documents, or objects."
            }

        face_bgr = face_region.reshape(-1, 3).astype(np.float32)
        mean_color = np.mean(face_bgr, axis=0)
        b_mean, g_mean, r_mean = mean_color

        if r_mean < b_mean:
            return {
                "valid": False,
                "reason": "⚠️ This does not appear to be a human face.\n\n✅ Fix: Please upload your selfie."
            }

        gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        brightness_std = np.std(gray)
        if brightness_std > 90:
            return {
                "valid": False,
                "reason": "⚠️ This photo looks like a chart or document.\n\n✅ Fix: Please upload a natural selfie."
            }

        return {
            "valid": True,
            "reason": "Face validated successfully",
            "skin_ratio": round(skin_ratio, 3),
            "face_ratio": round(face_ratio, 3)
        }

    def analyze_photo_quality(self, image: np.ndarray, face: dict = None) -> PhotoQualityResult:
        """Run comprehensive photo quality checks and return a scored result.

        Checks (always): brightness, blur.
        Checks (if face provided): face size, shadow imbalance, face angle, skin coverage.

        Args:
            image: BGR numpy array.
            face: Optional face bounding box dict for face-specific checks.

        Returns:
            PhotoQualityResult with is_acceptable, quality_score, and specific_message.
        """
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
        """Check average image brightness and append issues to result.

        Thresholds: <60 → too dark (HIGH), 60-90 → slightly dark (WARNING),
        >230 → overexposed (HIGH), 200-230 → slightly bright (WARNING).

        Args:
            image: BGR numpy array.
            result: PhotoQualityResult to mutate with detected issues.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        avg_brightness = np.mean(gray)
        if avg_brightness < 60:
            result.problems.append({
                "type": "too_dark", "severity": "high",
                "message": "Your photo is too dark",
                "fix": "Move near a window or turn on a light"
            })
            result.quality_score -= 40
        elif avg_brightness < 90:
            result.warnings.append({
                "type": "slightly_dark",
                "message": "Photo is slightly dark",
                "fix": "Better lighting will improve results"
            })
            result.quality_score -= 15
        elif avg_brightness > 230:
            result.problems.append({
                "type": "overexposed", "severity": "high",
                "message": "Photo is too bright / overexposed",
                "fix": "Avoid direct sunlight, take selfie in shade"
            })
            result.quality_score -= 35
        elif avg_brightness > 200:
            result.warnings.append({
                "type": "slightly_bright",
                "message": "Photo is slightly too bright",
                "fix": "Moving to shade will improve results"
            })
            result.quality_score -= 10

    def _check_blur(self, image: np.ndarray, result: PhotoQualityResult):
        """Check image sharpness using Laplacian variance.

        Thresholds: <50 → very blurry (HIGH), 50-100 → slightly blurry (WARNING).

        Args:
            image: BGR numpy array.
            result: PhotoQualityResult to mutate with detected issues.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        if laplacian_var < 50:
            result.problems.append({
                "type": "very_blurry", "severity": "high",
                "message": "Photo is very blurry",
                "fix": "Keep your phone steady and focus clearly before taking the selfie"
            })
            result.quality_score -= 45
        elif laplacian_var < 100:
            result.warnings.append({
                "type": "slightly_blurry",
                "message": "Photo is slightly blurry",
                "fix": "Hold your phone still while taking the selfie"
            })
            result.quality_score -= 15

    def _check_face_size(self, image: np.ndarray, face: dict, result: PhotoQualityResult):
        """Check that the face occupies a sufficient fraction of the image.

        Thresholds: <4% of image area → too small (HIGH), 4-8% → small (WARNING).

        Args:
            image: BGR numpy array.
            face: Face bounding box dict.
            result: PhotoQualityResult to mutate.
        """
        img_area = image.shape[0] * image.shape[1]
        face_area = face["width"] * face["height"]
        face_ratio = face_area / img_area
        if face_ratio < 0.04:
            result.problems.append({
                "type": "face_too_small", "severity": "high",
                "message": "Your face appears too small in the photo",
                "fix": "Move your phone closer to your face"
            })
            result.quality_score -= 35
        elif face_ratio < 0.08:
            result.warnings.append({
                "type": "face_small",
                "message": "Face is a bit small",
                "fix": "A closer selfie will give better results"
            })
            result.quality_score -= 10

    def _check_shadow(self, image: np.ndarray, face: dict, result: PhotoQualityResult):
        """Detect strong lateral shadows by comparing left/right face brightness.

        Thresholds: >60 brightness difference → heavy shadow (HIGH),
        35-60 → mild shadow (WARNING).

        Args:
            image: BGR numpy array.
            face: Face bounding box dict.
            result: PhotoQualityResult to mutate.
        """
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
                "message": f"Heavy shadow on the {darker_side} side of your face",
                "fix": "Light should come from directly in front of you"
            })
            result.quality_score -= 30
        elif diff > 35:
            result.warnings.append({
                "type": "mild_shadow",
                "message": "Slight shadow on one side of your face",
                "fix": "Position your light source directly in front for better results"
            })
            result.quality_score -= 12

    def _check_face_angle(self, image: np.ndarray, face: dict, result: PhotoQualityResult):
        """Detect side-turned faces using bounding box aspect ratio.

        A very narrow bounding box (w/h < 0.6) suggests a 45°+ head turn.

        Args:
            image: BGR numpy array (unused; kept for API consistency).
            face: Face bounding box dict.
            result: PhotoQualityResult to mutate.
        """
        x, y, w, h = face["x"], face["y"], face["width"], face["height"]
        aspect_ratio = w / h
        if aspect_ratio < 0.6:
            result.problems.append({
                "type": "face_angled", "severity": "medium",
                "message": "Your face is turned to the side",
                "fix": "Face the camera directly"
            })
            result.quality_score -= 25
        elif aspect_ratio < 0.7:
            result.warnings.append({
                "type": "slight_angle",
                "message": "Face is slightly turned",
                "fix": "Look directly at the camera"
            })
            result.quality_score -= 10

    def _check_skin_pixels(self, image: np.ndarray, face: dict, result: PhotoQualityResult):
        """Verify that enough skin-coloured pixels are visible in the face region.

        Low skin ratio usually means sunglasses, a mask, or heavy hair coverage.
        Thresholds: <25% → partially covered (MEDIUM), 25-40% → partial (WARNING).

        Args:
            image: BGR numpy array.
            face: Face bounding box dict.
            result: PhotoQualityResult to mutate.
        """
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
                "message": "Your face appears to be partially covered",
                "fix": "Remove sunglasses or mask"
            })
            result.quality_score -= 30
        elif skin_ratio < 0.40:
            result.warnings.append({
                "type": "partial_coverage",
                "message": "Face is not fully visible",
                "fix": "Move your hair away from your face"
            })
            result.quality_score -= 10

    def _build_problem_message(self, problems: list) -> str:
        """Format a user-facing string from one or more hard-failure problems.

        Args:
            problems: List of problem dicts with 'message' and 'fix' keys.

        Returns:
            Formatted string with emoji indicators and fix instructions.
        """
        if len(problems) == 1:
            p = problems[0]
            return f"⚠️ {p['message']}.\n\n✅ Fix: {p['fix']}"
        msg = f"⚠️ {len(problems)} issues found:\n\n"
        for i, p in enumerate(problems, 1):
            msg += f"{i}. {p['message']}\n   → Fix: {p['fix']}\n\n"
        return msg.strip()

    def _build_warning_message(self, warnings: list) -> str:
        """Format a user-facing string from one or more soft warnings.

        Args:
            warnings: List of warning dicts with 'message' and 'fix' keys.

        Returns:
            Formatted string with lightbulb emoji and actionable suggestions.
        """
        if len(warnings) == 1:
            w = warnings[0]
            return f"💡 {w['message']}. {w['fix']}"
        msg = "💡 Some minor issues:\n\n"
        for w in warnings:
            msg += f"• {w['message']} → {w['fix']}\n"
        return msg.strip()

    def extract_skin_color(self, image: np.ndarray, face: dict) -> dict:
        """Extract the dominant skin colour from the face region.

        Uses MediaPipe landmark-based sampling when available;
        falls back to a geometric 5-region approach when not.

        Args:
            image: BGR numpy array.
            face: Face bounding box dict from detect_face().

        Returns:
            Dict with keys {r, g, b, hex} (median skin pixel colour).
        """
        landmarks = self._get_face_landmarks(image, face)
        if landmarks:
            return self._extract_skin_with_landmarks(image, face, landmarks)
        return self._extract_skin_geometric(image, face)

    def _extract_skin_with_landmarks(self, image: np.ndarray, face: dict, landmarks: dict) -> dict:
        """Sample skin pixels from 5 landmark-defined regions (forehead, cheeks, nose, chin).

        Args:
            image: BGR numpy array.
            face: Face bounding box dict (unused; kept for API consistency).
            landmarks: Dict of MediaPipe landmark index → (x, y) pixel coords.

        Returns:
            Dict with keys {r, g, b, hex}, or falls back to geometric method.
        """
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
        """Collect HSV-filtered skin pixels from the bounding box of a set of landmark points.

        Args:
            image: BGR numpy array.
            points: List of (x, y) pixel coordinates defining the region.

        Returns:
            List of [B, G, R] pixel values that pass the skin colour filter.
        """
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
        """Extract skin colour using fixed geometric proportions of the face bounding box.

        Samples from: upper forehead, left cheek, right cheek, nose bridge, chin.
        Used when MediaPipe landmarks are unavailable.

        Args:
            image: BGR numpy array.
            face: Face bounding box dict.

        Returns:
            Dict with keys {r, g, b, hex}.
        """
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
        """Return pixels within the HSV skin colour range from an image region.

        Uses two HSV ranges to cover the full spectrum of human skin tones:
          Range 1: H 0-25 (warm reds/oranges)
          Range 2: H 165-180 (wrap-around reds)

        Args:
            region: BGR numpy sub-array (face sub-region).

        Returns:
            List of [B, G, R] values for pixels matching skin hue.
        """
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
        """Compute the median skin colour from a list of pixel values.

        Uses the median (not mean) to be robust against outlier pixels
        caused by facial hair, shadows, or makeup.

        Args:
            skin_pixels: List of [B, G, R] float values.

        Returns:
            Dict with keys {r, g, b, hex}.
        """
        skin_array = np.array(skin_pixels)
        avg = np.median(skin_array, axis=0)
        b, g, r = avg
        r, g, b = int(r), int(g), int(b)
        return {"r": r, "g": g, "b": b, "hex": f"#{r:02x}{g:02x}{b:02x}"}

    def _resize_for_processing(self, image: np.ndarray, max_dim: int = 1280) -> np.ndarray:
        """Resize an image so its longest dimension does not exceed max_dim.

        Preserves aspect ratio. Returns the original array unchanged if already
        within limits (no unnecessary copy).

        Args:
            image: BGR numpy array.
            max_dim: Maximum allowed dimension in pixels (default 1280).

        Returns:
            Possibly-resized BGR numpy array.
        """
        h, w = image.shape[:2]
        if max(h, w) <= max_dim:
            return image
        if w > h:
            new_w, new_h = max_dim, int(h * max_dim / w)
        else:
            new_h, new_w = max_dim, int(w * max_dim / h)
        return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)

    def _enhance_low_light(self, image: np.ndarray) -> np.ndarray:
        """Apply CLAHE contrast enhancement to improve face detection in dark images.

        Converts to LAB colour space, applies CLAHE on the L* (lightness)
        channel only, then converts back to BGR. Chroma is unaffected.

        Args:
            image: BGR numpy array.

        Returns:
            Contrast-enhanced BGR numpy array.
        """
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        lab = cv2.merge([l, a, b])
        return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)