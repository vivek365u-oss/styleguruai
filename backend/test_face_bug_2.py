import sys
sys.path.append('.')
import cv2
from image_processor import ImageProcessor
from face_shape_detector import FaceShapeDetector
import urllib.request
import traceback
import json

print("Downloading test image...")
req = urllib.request.Request(
    'https://upload.wikimedia.org/wikipedia/commons/8/85/Elon_Musk_Royal_Society_%28crop1%29.jpg',
    data=None, 
    headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.47 Safari/537.36'
    }
)
with urllib.request.urlopen(req) as response, open("test_face.jpg", 'wb') as out_file:
    out_file.write(response.read())
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
    
    # avoid printing emojis inside the whole dict
    if isinstance(res, dict):
        print("Shape result:", res["shape"], "Conf:", res["confidence"], "Fallback:", res.get("fallback", False))
        print("Measurements:", res.get("ratios"))
    else:
        print("Shape result:", res)
        
except Exception as e:
    print("Exception!")
    traceback.print_exc()
