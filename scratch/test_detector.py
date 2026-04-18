import math
from typing import Dict, Tuple, List

# Mock indices for testing
class MockDetector:
    def _dist(self, p1, p2):
        return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)

    def _classify(
        self,
        face_ratio: float,
        forehead_ratio: float,
        jaw_ratio: float,
        width_variance: float,
    ) -> Tuple[str, float]:
        scores = {}

        # ── OBLONG ─────────────────────────────────────
        if face_ratio > 1.45:
            oblong_score = min(1.0, (face_ratio - 1.45) / 0.35)
            scores["oblong"] = 0.75 + oblong_score * 0.25
        elif face_ratio > 1.3:
            scores["oblong"] = 0.45

        # ── ROUND ──────────────────────────────────────
        if face_ratio < 1.18:
            round_score = min(1.0, (1.18 - face_ratio) / 0.18)
            if forehead_ratio > 0.72 and jaw_ratio > 0.72 and width_variance < 0.15:
                scores["round"] = 0.65 + round_score * 0.35
            else:
                scores["round"] = 0.35

        # ── SQUARE ─────────────────────────────────────
        if face_ratio < 1.25 and forehead_ratio > 0.78 and jaw_ratio > 0.78 and width_variance < 0.10:
            square_score = min(1.0, (1.25 - face_ratio) / 0.2 + (1 - width_variance / 0.10) * 0.5)
            scores["square"] = 0.7 + square_score * 0.3

        # ── HEART ──────────────────────────────────────
        if forehead_ratio > 0.78 and jaw_ratio < 0.72 and width_variance > 0.10:
            heart_score = min(1.0, (forehead_ratio - jaw_ratio) / 0.3)
            scores["heart"] = 0.65 + heart_score * 0.35

        # ── DIAMOND ────────────────────────────────────
        if forehead_ratio < 0.78 and jaw_ratio < 0.78 and width_variance < 0.18:
            diamond_score = min(1.0, (0.78 - max(forehead_ratio, jaw_ratio)) / 0.2)
            scores["diamond"] = 0.6 + diamond_score * 0.4

        # ── OVAL ───────────────────────────────────────
        if (1.2 <= face_ratio <= 1.5 and
            forehead_ratio >= jaw_ratio - 0.05 and
            forehead_ratio < 0.95 and
            jaw_ratio < 0.9):
            oval_score = 1 - abs(face_ratio - 1.35) / 0.4
            scores["oval"] = 0.6 + oval_score * 0.4

        if not scores:
            return "oval", 0.52

        best = max(scores, key=scores.get)
        return best, scores[best]

detector = MockDetector()

print(f"{'FaceRatio':<10} | {'ForeRatio':<10} | {'JawRatio':<10} | {'Shape':<10} | {'Conf'}")
print("-" * 60)

# Test cases
test_cases = [
    (1.1, 0.8, 0.8), # Expect Round
    (1.1, 0.9, 0.9), # Expect Square
    (1.6, 0.8, 0.8), # Expect Oblong
    (1.3, 0.9, 0.6), # Expect Heart
    (1.3, 0.6, 0.6), # Expect Diamond
    (1.35, 0.85, 0.75), # Expect Oval
]

for fr, forer, jr in test_cases:
    wv = abs(forer - jr)
    shape, conf = detector._classify(fr, forer, jr, wv)
    print(f"{fr:<10.2f} | {forer:<10.2f} | {jr:<10.2f} | {shape:<10} | {conf:.2f}")

# Sweep test for Face Ratio
print("\nSweep Face Ratio (Forehead=0.8, Jaw=0.75):")
for r in [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6]:
    shape, conf = detector._classify(r, 0.8, 0.75, 0.05)
    print(f"FR={r:.1f} -> {shape} ({conf:.2f})")
