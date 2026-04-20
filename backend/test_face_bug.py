import sys
sys.path.append('.')
import cv2
from image_processor import ImageProcessor
from face_shape_detector import FaceShapeDetector
import urllib.request
import traceback

print("Downloading test image...")
urllib.request.urlretrieve("https://thispersondoesnotexist.com", "test_face.jpg")
print("Image downloaded. Running processor...")

try:
    img = cv2.imread("test_face.jpg")
    p = ImageProcessor()
    
    face = p.detect_face(img)
    print("Face detected:", face)
    
    lms = p._get_face_landmarks(img, face)
    if not lms:
        print("LMS: EMPTY!")
    else:
        print("LMS found:", len(lms))
        
    d = FaceShapeDetector()
    res = d.detect_shape(lms) if lms else "NO LMS"
    
    if isinstance(res, dict):
        print("Shape result:", res["shape"])
    else:
        print("Shape result:", res)
        
except Exception as e:
    print("Exception!")
    traceback.print_exc()
