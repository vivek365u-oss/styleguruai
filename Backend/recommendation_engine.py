from dataclasses import dataclass
from typing import List, Dict
from skin_tone_classifier import SkinToneResult

@dataclass
class OutfitRecommendation:
    skin_tone: str
    undertone: str
    confidence: str
    best_shirt_colors: List[Dict[str, str]]
    best_pant_colors: List[Dict[str, str]]
    accent_colors: List[Dict[str, str]]
    colors_to_avoid: List[Dict[str, str]]
    outfit_combos: List[Dict[str, str]]
    style_tips: List[str]
    occasion_advice: Dict[str, str]
    ethnic_suggestions: List[str]
    summary: str


class RecommendationEngine:
    COLORS = {
        "navy_blue": {"hex": "#000080", "name": "Navy Blue"},
        "royal_blue": {"hex": "#4169E1", "name": "Royal Blue"},
        "sky_blue": {"hex": "#87CEEB", "name": "Sky Blue"},
        "teal": {"hex": "#008080", "name": "Teal"},
        "cobalt_blue": {"hex": "#0047AB", "name": "Cobalt Blue"},
        "powder_blue": {"hex": "#B0E0E6", "name": "Powder Blue"},
        "olive_green": {"hex": "#556B2F", "name": "Olive Green"},
        "forest_green": {"hex": "#228B22", "name": "Forest Green"},
        "sage_green": {"hex": "#BCB88A", "name": "Sage Green"},
        "emerald": {"hex": "#50C878", "name": "Emerald Green"},
        "mint_green": {"hex": "#98FF98", "name": "Mint Green"},
        "maroon": {"hex": "#800000", "name": "Maroon"},
        "burgundy": {"hex": "#722F37", "name": "Burgundy"},
        "coral": {"hex": "#FF7F50", "name": "Coral"},
        "dusty_rose": {"hex": "#DCAE96", "name": "Dusty Rose"},
        "wine_red": {"hex": "#722F37", "name": "Wine Red"},
        "white": {"hex": "#FFFFFF", "name": "White"},
        "off_white": {"hex": "#FAF0E6", "name": "Off White"},
        "cream": {"hex": "#FFFDD0", "name": "Cream"},
        "beige": {"hex": "#F5F5DC", "name": "Beige"},
        "khaki": {"hex": "#C3B091", "name": "Khaki"},
        "charcoal": {"hex": "#36454F", "name": "Charcoal"},
        "black": {"hex": "#000000", "name": "Black"},
        "gray": {"hex": "#808080", "name": "Gray"},
        "rust": {"hex": "#B7410E", "name": "Rust"},
        "mustard": {"hex": "#FFDB58", "name": "Mustard"},
        "camel": {"hex": "#C19A6B", "name": "Camel"},
        "chocolate": {"hex": "#7B3F00", "name": "Chocolate Brown"},
        "tan": {"hex": "#D2B48C", "name": "Tan"},
        "pastel_pink": {"hex": "#FFD1DC", "name": "Pastel Pink"},
        "pastel_blue": {"hex": "#AEC6CF", "name": "Pastel Blue"},
        "lavender": {"hex": "#E6E6FA", "name": "Lavender"},
        "peach": {"hex": "#FFDAB9", "name": "Peach"},
        "bright_yellow": {"hex": "#FFD700", "name": "Bright Yellow"},
        "neon_green": {"hex": "#39FF14", "name": "Neon Green"},
        "hot_pink": {"hex": "#FF69B4", "name": "Hot Pink"},
        "orange": {"hex": "#FFA500", "name": "Orange"},
    }

    def get_recommendations(self, skin_tone: SkinToneResult) -> OutfitRecommendation:
        category = skin_tone.category
        undertone = skin_tone.subcategory
        return OutfitRecommendation(
            skin_tone=category,
            undertone=undertone,
            confidence=skin_tone.confidence,
            best_shirt_colors=self._get_shirt_colors(category, undertone),
            best_pant_colors=self._get_pant_colors(category, undertone),
            accent_colors=self._get_accent_colors(category, undertone),
            colors_to_avoid=self._get_avoid_colors(category, undertone),
            outfit_combos=self._get_outfit_combos(category, undertone),
            style_tips=self._get_style_tips(category, undertone),
            occasion_advice=self._get_occasion_advice(category, undertone),
            ethnic_suggestions=self._get_ethnic_suggestions(category, undertone),
            summary=self._generate_summary(category, undertone)
        )

    def _get_shirt_colors(self, category, undertone):
        recommendations = {
            ("fair", "warm"): [
                {**self.COLORS["navy_blue"], "reason": "Creates strong contrast with fair skin"},
                {**self.COLORS["forest_green"], "reason": "Brings out warmth in your complexion"},
                {**self.COLORS["burgundy"], "reason": "Rich color that complements fair warm skin"},
                {**self.COLORS["coral"], "reason": "Enhances your natural warm glow"},
                {**self.COLORS["mustard"], "reason": "Warm tone that harmonizes with your skin"},
                {**self.COLORS["teal"], "reason": "Beautiful contrast without being too harsh"},
            ],
            ("fair", "cool"): [
                {**self.COLORS["royal_blue"], "reason": "Cool tone that matches your undertone"},
                {**self.COLORS["emerald"], "reason": "Rich cool green complements cool fair skin"},
                {**self.COLORS["lavender"], "reason": "Soft cool color that looks elegant"},
                {**self.COLORS["dusty_rose"], "reason": "Subtle pink that enhances cool undertones"},
                {**self.COLORS["charcoal"], "reason": "Sophisticated and flattering"},
                {**self.COLORS["cobalt_blue"], "reason": "Vivid blue that makes fair cool skin glow"},
            ],
            ("light", "warm"): [
                {**self.COLORS["olive_green"], "reason": "Earth tone that suits wheatish warm skin perfectly"},
                {**self.COLORS["rust"], "reason": "Warm earth tone that enhances your complexion"},
                {**self.COLORS["navy_blue"], "reason": "Classic choice that always works"},
                {**self.COLORS["maroon"], "reason": "Deep warm red that complements golden undertones"},
                {**self.COLORS["teal"], "reason": "Rich blue-green that pops against wheatish skin"},
                {**self.COLORS["mustard"], "reason": "Warm and trendy choice for your skin tone"},
            ],
            ("light", "cool"): [
                {**self.COLORS["royal_blue"], "reason": "Cool blue enhances your natural undertone"},
                {**self.COLORS["sage_green"], "reason": "Muted green that harmonizes with cool skin"},
                {**self.COLORS["wine_red"], "reason": "Deep cool red that looks sophisticated"},
                {**self.COLORS["pastel_blue"], "reason": "Soft cool color that flatters naturally"},
                {**self.COLORS["charcoal"], "reason": "Cool neutral that always looks polished"},
                {**self.COLORS["lavender"], "reason": "Light purple that brings out cool tones beautifully"},
            ],
            ("medium", "warm"): [
                {**self.COLORS["navy_blue"], "reason": "Perfect contrast — the #1 choice for medium warm skin"},
                {**self.COLORS["white"], "reason": "Bright white creates a fresh, clean contrast"},
                {**self.COLORS["maroon"], "reason": "Deep red brings out golden undertones beautifully"},
                {**self.COLORS["olive_green"], "reason": "Earth tone that was MADE for your skin tone"},
                {**self.COLORS["rust"], "reason": "Trendy earth tone that makes medium skin glow"},
                {**self.COLORS["sky_blue"], "reason": "Light blue provides a pleasant, airy contrast"},
                {**self.COLORS["coral"], "reason": "Warm pop of color that energizes your look"},
            ],
            ("medium", "cool"): [
                {**self.COLORS["cobalt_blue"], "reason": "Strong cool blue creates stunning contrast"},
                {**self.COLORS["emerald"], "reason": "Rich green that enhances cool undertones"},
                {**self.COLORS["white"], "reason": "Crisp white always works for medium cool skin"},
                {**self.COLORS["burgundy"], "reason": "Deep cool-red that looks rich and polished"},
                {**self.COLORS["teal"], "reason": "Cool blue-green is your best friend"},
                {**self.COLORS["pastel_blue"], "reason": "Soft and sophisticated cool choice"},
            ],
            ("olive", "warm"): [
                {**self.COLORS["white"], "reason": "Creates the best contrast against olive skin"},
                {**self.COLORS["cream"], "reason": "Soft neutral that glows against olive warm skin"},
                {**self.COLORS["coral"], "reason": "Vibrant warm color that pops beautifully"},
                {**self.COLORS["sky_blue"], "reason": "Light blue looks fresh and striking"},
                {**self.COLORS["mustard"], "reason": "Bold warm tone that complements your golden undertone"},
                {**self.COLORS["forest_green"], "reason": "Rich green that harmonizes with olive skin"},
            ],
            ("olive", "cool"): [
                {**self.COLORS["royal_blue"], "reason": "Vivid blue creates beautiful contrast"},
                {**self.COLORS["white"], "reason": "Always flattering on olive cool skin"},
                {**self.COLORS["emerald"], "reason": "Bold green that looks stunning"},
                {**self.COLORS["lavender"], "reason": "Unexpected but beautiful pairing"},
                {**self.COLORS["powder_blue"], "reason": "Soft blue that looks elegant"},
                {**self.COLORS["wine_red"], "reason": "Cool deep red for sophisticated look"},
            ],
            ("brown", "warm"): [
                {**self.COLORS["white"], "reason": "Maximum contrast — looks amazing on brown skin"},
                {**self.COLORS["sky_blue"], "reason": "Light blue is incredibly flattering"},
                {**self.COLORS["coral"], "reason": "Warm bright color that makes you stand out"},
                {**self.COLORS["cream"], "reason": "Soft neutral that creates a warm, rich look"},
                {**self.COLORS["bright_yellow"], "reason": "Bold choice that looks FANTASTIC on brown skin"},
                {**self.COLORS["mint_green"], "reason": "Fresh color that pops beautifully"},
            ],
            ("brown", "cool"): [
                {**self.COLORS["white"], "reason": "Crisp contrast that always works"},
                {**self.COLORS["royal_blue"], "reason": "Vivid blue is your power color"},
                {**self.COLORS["emerald"], "reason": "Bold green creates a regal look"},
                {**self.COLORS["cobalt_blue"], "reason": "Deep blue looks rich and polished"},
                {**self.COLORS["lavender"], "reason": "Soft purple provides elegant contrast"},
                {**self.COLORS["pastel_pink"], "reason": "Light pink looks surprisingly amazing"},
            ],
            ("dark", "warm"): [
                {**self.COLORS["white"], "reason": "THE best color for dark skin — maximum impact"},
                {**self.COLORS["bright_yellow"], "reason": "Bold and beautiful — dark skin makes yellow shine"},
                {**self.COLORS["orange"], "reason": "Vibrant warm color that looks incredible"},
                {**self.COLORS["cream"], "reason": "Soft contrast that looks elegant"},
                {**self.COLORS["coral"], "reason": "Warm bright tone that glows against dark skin"},
                {**self.COLORS["mint_green"], "reason": "Cool pop of color that stands out"},
            ],
            ("dark", "cool"): [
                {**self.COLORS["white"], "reason": "Classic, clean, always stunning"},
                {**self.COLORS["royal_blue"], "reason": "Rich blue creates a powerful look"},
                {**self.COLORS["emerald"], "reason": "Deep green looks absolutely regal"},
                {**self.COLORS["cobalt_blue"], "reason": "Intense blue for an intense look"},
                {**self.COLORS["lavender"], "reason": "Soft purple creates beautiful contrast"},
                {**self.COLORS["powder_blue"], "reason": "Soft blue for a refined, elegant look"},
            ],
        }
        key = (category, undertone)
        if key not in recommendations:
            warm = recommendations.get((category, "warm"), [])
            cool = recommendations.get((category, "cool"), [])
            return warm[:3] + cool[:3]
        return recommendations[key]

    def _get_pant_colors(self, category, undertone):
        universal = [
            {**self.COLORS["navy_blue"], "reason": "Versatile — goes with almost everything"},
            {**self.COLORS["charcoal"], "reason": "Professional and pairs with any shirt"},
            {**self.COLORS["black"], "reason": "Classic staple for any wardrobe"},
        ]
        if category in ["fair", "light"]:
            specific = [
                {**self.COLORS["khaki"], "reason": "Casual and flattering for lighter skin"},
                {**self.COLORS["beige"], "reason": "Light neutral that pairs beautifully"},
                {**self.COLORS["olive_green"], "reason": "Earth tone pants are trendy and versatile"},
                {**self.COLORS["gray"], "reason": "Cool neutral for a polished look"},
            ]
        elif category in ["medium", "olive"]:
            specific = [
                {**self.COLORS["beige"], "reason": "Great contrast with medium skin"},
                {**self.COLORS["khaki"], "reason": "Casual and always works"},
                {**self.COLORS["olive_green"], "reason": "Perfect earth tone for your skin"},
                {**self.COLORS["chocolate"], "reason": "Rich brown creates a cohesive warm look"},
            ]
        else:
            specific = [
                {**self.COLORS["beige"], "reason": "Creates a nice contrast"},
                {**self.COLORS["cream"], "reason": "Light pants look amazing with dark skin"},
                {**self.COLORS["tan"], "reason": "Warm neutral that complements beautifully"},
                {**self.COLORS["khaki"], "reason": "Classic casual choice"},
            ]
        return universal + specific

    def _get_accent_colors(self, category, undertone):
        if undertone == "warm":
            return [
                {**self.COLORS["rust"], "reason": "Warm metallic tone for accessories"},
                {**self.COLORS["camel"], "reason": "Classic warm neutral for shoes/bags"},
                {**self.COLORS["chocolate"], "reason": "Rich brown leather looks great"},
                {**self.COLORS["mustard"], "reason": "Bold accent for bags or scarves"},
            ]
        else:
            return [
                {**self.COLORS["charcoal"], "reason": "Cool neutral for accessories"},
                {**self.COLORS["black"], "reason": "Classic cool accent"},
                {**self.COLORS["navy_blue"], "reason": "Rich blue for bags or belts"},
                {**self.COLORS["burgundy"], "reason": "Deep red accent adds sophistication"},
            ]

    def _get_avoid_colors(self, category, undertone):
        avoid = {
            "fair": [
                {**self.COLORS["beige"], "reason": "Too close to your skin tone — makes you look washed out"},
                {**self.COLORS["pastel_pink"], "reason": "Can make fair skin look too flushed"},
                {**self.COLORS["neon_green"], "reason": "Overwhelms fair complexion"},
                {**self.COLORS["orange"], "reason": "Can clash with fair skin"},
            ],
            "light": [
                {**self.COLORS["tan"], "reason": "Too similar to skin tone — no contrast"},
                {**self.COLORS["camel"], "reason": "Makes you blend in, not stand out"},
                {**self.COLORS["neon_green"], "reason": "Too harsh and unflattering"},
                {**self.COLORS["hot_pink"], "reason": "Clashes with warm undertones"},
            ],
            "medium": [
                {**self.COLORS["tan"], "reason": "Too close to your skin — creates no contrast"},
                {**self.COLORS["khaki"], "reason": "As a shirt, it can look dull on medium skin"},
                {**self.COLORS["neon_green"], "reason": "Unflattering harsh color"},
                {**self.COLORS["hot_pink"], "reason": "Generally unflattering on medium Indian skin"},
            ],
            "olive": [
                {**self.COLORS["chocolate"], "reason": "Too close to skin tone — no visual interest"},
                {**self.COLORS["gray"], "reason": "Can make olive skin look ashy and dull"},
                {**self.COLORS["neon_green"], "reason": "Harsh and unflattering"},
                {**self.COLORS["hot_pink"], "reason": "Clashes with most olive undertones"},
            ],
            "brown": [
                {**self.COLORS["chocolate"], "reason": "Blends with skin — zero contrast"},
                {**self.COLORS["gray"], "reason": "Can make brown skin look dull and ashy"},
                {**self.COLORS["neon_green"], "reason": "Too garish and unflattering"},
                {**self.COLORS["rust"], "reason": "Can look muddy against brown skin"},
            ],
            "dark": [
                {**self.COLORS["black"], "reason": "Dark-on-dark lacks contrast"},
                {**self.COLORS["gray"], "reason": "Can wash out dark skin tones"},
                {**self.COLORS["neon_green"], "reason": "Looks harsh and cheap"},
                {**self.COLORS["chocolate"], "reason": "Too similar — creates no visual pop"},
            ],
        }
        return avoid.get(category, avoid["medium"])

    def _get_outfit_combos(self, category, undertone):
        if category in ["fair", "light"]:
            return [
                {"shirt": "Navy blue polo", "pant": "Beige chinos", "shoes": "White sneakers", "occasion": "College / Casual", "vibe": "Clean and preppy"},
                {"shirt": "Burgundy henley", "pant": "Dark blue jeans", "shoes": "Brown loafers", "occasion": "Casual date", "vibe": "Stylish and relaxed"},
                {"shirt": "White Oxford shirt", "pant": "Charcoal trousers", "shoes": "Black formal shoes", "occasion": "Interview / Formal", "vibe": "Professional and polished"},
                {"shirt": "Olive green t-shirt", "pant": "Black joggers", "shoes": "White sneakers", "occasion": "Weekend", "vibe": "Chill and trendy"},
                {"shirt": "Forest green shirt", "pant": "Khaki pants", "shoes": "Tan shoes", "occasion": "Semi-formal", "vibe": "Smart casual"},
            ]
        elif category in ["medium", "olive"]:
            return [
                {"shirt": "Crisp white shirt", "pant": "Navy blue chinos", "shoes": "Brown leather shoes", "occasion": "Office / Interview", "vibe": "Classic and confident"},
                {"shirt": "Maroon round-neck t-shirt", "pant": "Dark blue jeans", "shoes": "White sneakers", "occasion": "College / Friends", "vibe": "Bold and stylish"},
                {"shirt": "Sky blue linen shirt", "pant": "Beige chinos", "shoes": "Tan loafers", "occasion": "Brunch / Outing", "vibe": "Fresh and breezy"},
                {"shirt": "Olive green polo", "pant": "Black jeans", "shoes": "Brown boots", "occasion": "Evening / Date", "vibe": "Rugged and cool"},
                {"shirt": "Navy blazer + white tee", "pant": "Khaki chinos", "shoes": "Brown Oxford", "occasion": "Semi-formal", "vibe": "Smart and put-together"},
            ]
        else:
            return [
                {"shirt": "White crew-neck t-shirt", "pant": "Dark blue jeans", "shoes": "White sneakers", "occasion": "Everyday casual", "vibe": "Clean and striking"},
                {"shirt": "Royal blue formal shirt", "pant": "Beige trousers", "shoes": "Brown leather shoes", "occasion": "Office / Interview", "vibe": "Powerful and professional"},
                {"shirt": "Yellow/Mustard t-shirt", "pant": "Navy blue chinos", "shoes": "White sneakers", "occasion": "Weekend / Festival", "vibe": "Bold and fun"},
                {"shirt": "Coral/Salmon shirt", "pant": "Cream pants", "shoes": "Tan loafers", "occasion": "Date / Special outing", "vibe": "Stylish and unique"},
                {"shirt": "Emerald green polo", "pant": "Charcoal chinos", "shoes": "Black sneakers", "occasion": "College / Casual", "vibe": "Rich and confident"},
            ]

    def _get_style_tips(self, category, undertone):
        common = [
            "Always ensure your clothes fit well — fit matters more than color!",
            "Iron/steam your clothes — wrinkled clothes ruin any outfit",
            "Invest in a good pair of dark blue jeans — they go with everything",
            "Get a white and navy blue shirt first — they work for every occasion",
        ]
        if category in ["fair", "light"]:
            specific = [
                "You can pull off both pastels and bold colors — experiment!",
                "Jewel tones (emerald, sapphire, ruby) look especially rich on you",
                "Avoid head-to-toe light colors — add one dark/bold piece for contrast",
            ]
        elif category in ["medium", "olive"]:
            specific = [
                "You have the most versatile skin tone — most colors work for you!",
                "Earth tones (olive, rust, mustard) are your secret weapon",
                "Contrast is your friend — pair light shirts with dark pants or vice versa",
            ]
        else:
            specific = [
                "Bold, bright colors look AMAZING on you — don't be afraid of them!",
                "White is your power color — always have multiple white shirts/tees",
                "Metallics and rich fabrics look stunning against your skin",
            ]
        return specific + common

    def _get_occasion_advice(self, category, undertone):
        base = "navy" if category in ["fair", "light", "medium"] else "royal blue or white"
        return {
            "College Daily": f"Well-fitted t-shirt in your best color + dark jeans + clean sneakers. Best bet: {base} tones.",
            "Job Interview": "White or light blue formal shirt + charcoal/navy trousers + leather shoes. Stick to classics.",
            "First Date": "Smart casual: A well-fitted shirt in a flattering color + chinos. Shows effort without trying too hard.",
            "Wedding/Festival": "Go ethnic! Rich fabrics in your best colors. See ethnic suggestions.",
            "Friend's Party": "Your boldest flattering color + dark jeans + stylish shoes. Time to stand out!",
        }

    def _get_ethnic_suggestions(self, category, undertone):
        if category in ["fair", "light"]:
            return [
                "Kurta colors: Deep maroon, navy, forest green, or royal blue",
                "Wedding outfit: Dark sherwani with gold/silver embroidery",
                "Festival wear: Rich jewel-toned kurta with white/cream pajama",
                "Nehru jacket in emerald or navy adds instant sophistication",
            ]
        elif category in ["medium", "olive"]:
            return [
                "Kurta colors: White, cream, sky blue, maroon, or olive green",
                "Wedding outfit: Ivory/cream sherwani with golden work — stunning!",
                "Festival wear: Bright colored kurta (coral, turquoise) with contrast pajama",
                "Nehru jacket in maroon or mustard over a white kurta is a winner",
            ]
        else:
            return [
                "Kurta colors: White, golden, bright blue, or cream — you will shine!",
                "Wedding outfit: White or cream sherwani with rich embroidery — regal!",
                "Festival wear: Vibrant kurta in yellow, coral, or turquoise — be bold!",
                "Nehru jacket in beige or gold over a white kurta is absolutely royal",
            ]

    def _generate_summary(self, category, undertone):
        summaries = {
            "fair": f"You have a fair complexion with {undertone} undertones. Rich, deep colors create beautiful contrast. Think jewel tones and earth tones!",
            "light": f"You have a light/wheatish complexion with {undertone} undertones. Most colors work for you. Focus on medium-to-dark shades for best contrast.",
            "medium": f"You have a beautiful medium/wheatish complexion with {undertone} undertones. Earth tones and jewel tones are your best friends!",
            "olive": f"You have a gorgeous olive/dusky complexion with {undertone} undertones. Light and bright colors create stunning contrast!",
            "brown": f"You have a rich brown complexion with {undertone} undertones. Bright, bold colors look INCREDIBLE on you!",
            "dark": f"You have a beautiful deep complexion with {undertone} undertones. Bold colors and whites create stunning contrast!",
        }
        return summaries.get(category, summaries["medium"])