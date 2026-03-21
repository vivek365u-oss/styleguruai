import colorsys
from dataclasses import dataclass
from typing import Tuple

@dataclass
class SkinToneResult:
    category: str
    subcategory: str
    brightness_score: float
    warmth_score: float
    description: str
    confidence: str

class SkinToneClassifier:
    TONE_RANGES = [
        {"name": "fair", "min_brightness": 200, "max_brightness": 255, "description": "Fair skin tone"},
        {"name": "light", "min_brightness": 170, "max_brightness": 200, "description": "Light/wheatish skin tone"},
        {"name": "medium", "min_brightness": 140, "max_brightness": 170, "description": "Medium/wheatish skin tone"},
        {"name": "olive", "min_brightness": 115, "max_brightness": 140, "description": "Olive/dusky skin tone"},
        {"name": "brown", "min_brightness": 85, "max_brightness": 115, "description": "Brown/dusky skin tone"},
        {"name": "dark", "min_brightness": 0, "max_brightness": 85, "description": "Dark skin tone"},
    ]

    def classify(self, r: int, g: int, b: int) -> SkinToneResult:
        brightness = (0.299 * r) + (0.587 * g) + (0.114 * b)
        warmth_score = self._calculate_warmth(r, g, b)

        if warmth_score > 15:
            undertone = "warm"
        elif warmth_score < -10:
            undertone = "cool"
        else:
            undertone = "neutral"

        category = "medium"
        description = "Medium skin tone"
        for tone in self.TONE_RANGES:
            if tone["min_brightness"] <= brightness < tone["max_brightness"]:
                category = tone["name"]
                description = tone["description"]
                break

        confidence = self._estimate_confidence(r, g, b, brightness)
        full_description = f"{description} with {undertone} undertone"

        return SkinToneResult(
            category=category,
            subcategory=undertone,
            brightness_score=round(brightness, 2),
            warmth_score=round(warmth_score, 2),
            description=full_description,
            confidence=confidence
        )

    def _calculate_warmth(self, r: int, g: int, b: int) -> float:
        h, s, v = colorsys.rgb_to_hsv(r/255.0, g/255.0, b/255.0)
        hue_degrees = h * 360
        gb_diff = g - b
        rg_diff = r - g

        warmth = 0.0
        if 15 <= hue_degrees <= 50:
            warmth += 20
        elif 10 <= hue_degrees <= 60:
            warmth += 10
        if gb_diff > 30:
            warmth += 15
        elif gb_diff > 15:
            warmth += 8
        if b > g * 0.7:
            warmth -= 15
        if rg_diff > 40:
            warmth -= 10
        if s < 0.2 and v > 0.7:
            warmth -= 5
        return warmth

    def _estimate_confidence(self, r: int, g: int, b: int, brightness: float) -> str:
        if not (r >= g >= b * 0.7):
            return "low"
        max_c = max(r, g, b)
        min_c = min(r, g, b)
        if max_c - min_c < 10:
            return "low"
        if r < g or r < b:
            return "low"
        borderline_zones = [83, 84, 85, 86, 113, 114, 115, 116,
                            138, 139, 140, 141, 168, 169, 170, 171,
                            198, 199, 200, 201]
        if int(brightness) in borderline_zones:
            return "medium"
        return "high"

    def get_season(self, skin_tone: SkinToneResult) -> str:
        category = skin_tone.category
        undertone = skin_tone.subcategory
        season_map = {
            ("fair", "warm"): "Light Spring",
            ("fair", "cool"): "Light Summer",
            ("fair", "neutral"): "Light Spring",
            ("light", "warm"): "Warm Spring",
            ("light", "cool"): "Cool Summer",
            ("light", "neutral"): "Light Summer",
            ("medium", "warm"): "Warm Autumn",
            ("medium", "cool"): "Cool Summer",
            ("medium", "neutral"): "Soft Autumn",
            ("olive", "warm"): "Deep Autumn",
            ("olive", "cool"): "Deep Winter",
            ("olive", "neutral"): "Soft Autumn",
            ("brown", "warm"): "Deep Autumn",
            ("brown", "cool"): "Deep Winter",
            ("brown", "neutral"): "Deep Autumn",
            ("dark", "warm"): "Deep Autumn",
            ("dark", "cool"): "Deep Winter",
            ("dark", "neutral"): "Deep Winter",
        }
        return season_map.get((category, undertone), "Soft Autumn")