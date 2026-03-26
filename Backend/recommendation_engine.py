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
            ("fair", "warm"): [
                {**self.COLORS["beige"], "reason": "Too close to your skin tone — washed out look"},
                {**self.COLORS["peach"], "reason": "Blends with fair warm skin — no contrast"},
                {**self.COLORS["camel"], "reason": "Makes you look dull — zero contrast"},
                {**self.COLORS["orange"], "reason": "Clashes with fair warm undertone"},
            ],
            ("fair", "cool"): [
                {**self.COLORS["pastel_pink"], "reason": "Makes fair cool skin look flushed"},
                {**self.COLORS["peach"], "reason": "Too warm — clashes with cool undertone"},
                {**self.COLORS["orange"], "reason": "Warm tone fights your cool undertone badly"},
                {**self.COLORS["neon_green"], "reason": "Overwhelms fair complexion"},
            ],
            ("light", "warm"): [
                {**self.COLORS["tan"], "reason": "Too similar to skin tone — no contrast"},
                {**self.COLORS["camel"], "reason": "Blends in — you disappear in this color"},
                {**self.COLORS["hot_pink"], "reason": "Clashes with warm undertones"},
                {**self.COLORS["neon_green"], "reason": "Too harsh and unflattering"},
            ],
            ("light", "cool"): [
                {**self.COLORS["tan"], "reason": "Too warm — fights your cool undertone"},
                {**self.COLORS["mustard"], "reason": "Warm yellow clashes with cool skin"},
                {**self.COLORS["orange"], "reason": "Too warm for your cool undertone"},
                {**self.COLORS["hot_pink"], "reason": "Clashes with light cool skin"},
            ],
            ("medium", "warm"): [
                {**self.COLORS["tan"], "reason": "Too close to your skin — creates no contrast"},
                {**self.COLORS["khaki"], "reason": "Dull on medium warm skin as a shirt"},
                {**self.COLORS["neon_green"], "reason": "Unflattering harsh color"},
                {**self.COLORS["hot_pink"], "reason": "Clashes with warm medium skin"},
            ],
            ("medium", "cool"): [
                {**self.COLORS["khaki"], "reason": "Too warm and dull for cool undertone"},
                {**self.COLORS["mustard"], "reason": "Warm yellow clashes with your cool undertone"},
                {**self.COLORS["orange"], "reason": "Too warm — fights your cool undertone"},
                {**self.COLORS["hot_pink"], "reason": "Unflattering on medium cool skin"},
            ],
            ("olive", "warm"): [
                {**self.COLORS["chocolate"], "reason": "Too close to olive skin — no visual interest"},
                {**self.COLORS["gray"], "reason": "Makes olive warm skin look ashy"},
                {**self.COLORS["hot_pink"], "reason": "Clashes with olive warm undertone"},
                {**self.COLORS["neon_green"], "reason": "Harsh and unflattering"},
            ],
            ("olive", "cool"): [
                {**self.COLORS["chocolate"], "reason": "Too muddy against olive cool skin"},
                {**self.COLORS["rust"], "reason": "Too warm — clashes with cool undertone"},
                {**self.COLORS["mustard"], "reason": "Warm yellow fights your cool undertone"},
                {**self.COLORS["neon_green"], "reason": "Harsh and garish"},
            ],
            ("brown", "warm"): [
                {**self.COLORS["chocolate"], "reason": "Blends with skin — zero contrast"},
                {**self.COLORS["gray"], "reason": "Makes brown warm skin look dull and ashy"},
                {**self.COLORS["rust"], "reason": "Too close to brown warm skin — muddy look"},
                {**self.COLORS["neon_green"], "reason": "Too garish and unflattering"},
            ],
            ("brown", "cool"): [
                {**self.COLORS["chocolate"], "reason": "Blends completely — no contrast at all"},
                {**self.COLORS["gray"], "reason": "Ashy and dull against brown cool skin"},
                {**self.COLORS["orange"], "reason": "Too warm — clashes with cool undertone"},
                {**self.COLORS["mustard"], "reason": "Warm yellow fights cool undertone badly"},
            ],
            ("dark", "warm"): [
                {**self.COLORS["black"], "reason": "Dark-on-dark — no contrast at all"},
                {**self.COLORS["chocolate"], "reason": "Too similar to skin — blends completely"},
                {**self.COLORS["gray"], "reason": "Washes out dark warm skin"},
                {**self.COLORS["neon_green"], "reason": "Looks harsh and cheap"},
            ],
            ("dark", "cool"): [
                {**self.COLORS["black"], "reason": "Dark-on-dark — loses all definition"},
                {**self.COLORS["chocolate"], "reason": "Too similar to dark cool skin"},
                {**self.COLORS["gray"], "reason": "Ashy and unflattering on dark cool skin"},
                {**self.COLORS["rust"], "reason": "Too warm — clashes with cool undertone"},
            ],
        }
        key = (category, undertone)
        if key not in avoid:
            return avoid.get((category, "warm"), avoid[("medium", "warm")])
        return avoid[key]
        
        
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

    def get_female_recommendations(self, skin_tone: SkinToneResult) -> dict:
        category = skin_tone.category
        undertone = skin_tone.subcategory
        return {
            "summary": self._get_female_summary(category, undertone),
            "best_dress_colors": self._get_dress_colors(category, undertone),
            "best_top_colors": self._get_top_colors(category, undertone),
            "best_pant_colors": self._get_pant_colors(category, undertone),
            "saree_suggestions": self._get_saree_suggestions(category, undertone),
            "makeup_suggestions": self._get_makeup_suggestions(category, undertone),
            "accessories": self._get_female_accessories(category, undertone),
            "outfit_combos": self._get_female_outfit_combos(category, undertone),
            "colors_to_avoid": self._get_avoid_colors(category, undertone),
            "style_tips": self._get_female_style_tips(category, undertone),
            "occasion_advice": self._get_occasion_advice(category, undertone),
            "ethnic_wear": self._get_saree_suggestions(category, undertone),
        }

    def _get_dress_colors(self, category, undertone):
        recommendations = {
            ("fair", "warm"): [
                {**self.COLORS["burgundy"], "reason": "Rich color that makes fair skin glow"},
                {**self.COLORS["forest_green"], "reason": "Deep green looks elegant on fair skin"},
                {**self.COLORS["navy_blue"], "reason": "Classic choice for fair warm skin"},
                {**self.COLORS["coral"], "reason": "Warm pop of color that flatters"},
                {**self.COLORS["mustard"], "reason": "Trendy warm tone for fair skin"},
            ],
            ("fair", "cool"): [
                {**self.COLORS["royal_blue"], "reason": "Cool blue looks stunning"},
                {**self.COLORS["emerald"], "reason": "Rich green for cool fair skin"},
                {**self.COLORS["lavender"], "reason": "Soft purple is perfect"},
                {**self.COLORS["burgundy"], "reason": "Deep red adds sophistication"},
                {**self.COLORS["charcoal"], "reason": "Elegant and timeless"},
            ],
            ("light", "warm"): [
                {**self.COLORS["maroon"], "reason": "Deep warm red is stunning"},
                {**self.COLORS["olive_green"], "reason": "Earth tone that suits perfectly"},
                {**self.COLORS["teal"], "reason": "Rich blue-green pops beautifully"},
                {**self.COLORS["rust"], "reason": "Warm earth tone that glows"},
                {**self.COLORS["navy_blue"], "reason": "Classic and always works"},
            ],
            ("light", "cool"): [
                {**self.COLORS["royal_blue"], "reason": "Cool blue enhances undertone"},
                {**self.COLORS["wine_red"], "reason": "Deep cool red looks sophisticated"},
                {**self.COLORS["sage_green"], "reason": "Muted green harmonizes beautifully"},
                {**self.COLORS["lavender"], "reason": "Soft purple is magical"},
                {**self.COLORS["charcoal"], "reason": "Always polished and elegant"},
            ],
            ("medium", "warm"): [
                {**self.COLORS["white"], "reason": "Fresh clean contrast"},
                {**self.COLORS["maroon"], "reason": "Deep red brings out golden tones"},
                {**self.COLORS["olive_green"], "reason": "Earth tone made for you"},
                {**self.COLORS["coral"], "reason": "Warm color that energizes"},
                {**self.COLORS["navy_blue"], "reason": "Perfect contrast always"},
            ],
            ("medium", "cool"): [
                {**self.COLORS["cobalt_blue"], "reason": "Strong cool blue is stunning"},
                {**self.COLORS["emerald"], "reason": "Rich green enhances cool tones"},
                {**self.COLORS["white"], "reason": "Crisp white always works"},
                {**self.COLORS["burgundy"], "reason": "Deep cool red looks polished"},
                {**self.COLORS["teal"], "reason": "Cool blue-green is your color"},
            ],
            ("olive", "warm"): [
                {**self.COLORS["white"], "reason": "Best contrast for olive skin"},
                {**self.COLORS["coral"], "reason": "Vibrant warm color pops"},
                {**self.COLORS["sky_blue"], "reason": "Fresh and striking"},
                {**self.COLORS["mustard"], "reason": "Golden tone complements perfectly"},
                {**self.COLORS["cream"], "reason": "Soft neutral glows against olive"},
            ],
            ("olive", "cool"): [
                {**self.COLORS["royal_blue"], "reason": "Vivid blue creates contrast"},
                {**self.COLORS["white"], "reason": "Always flattering"},
                {**self.COLORS["emerald"], "reason": "Bold green looks stunning"},
                {**self.COLORS["lavender"], "reason": "Beautiful unexpected pairing"},
                {**self.COLORS["wine_red"], "reason": "Cool deep red is sophisticated"},
            ],
            ("brown", "warm"): [
                {**self.COLORS["white"], "reason": "Maximum contrast — gorgeous"},
                {**self.COLORS["bright_yellow"], "reason": "FANTASTIC on brown skin"},
                {**self.COLORS["coral"], "reason": "Warm bright color stands out"},
                {**self.COLORS["sky_blue"], "reason": "Light blue is incredibly flattering"},
                {**self.COLORS["mint_green"], "reason": "Fresh pop of color"},
            ],
            ("brown", "cool"): [
                {**self.COLORS["white"], "reason": "Crisp contrast always works"},
                {**self.COLORS["royal_blue"], "reason": "Vivid blue is your power color"},
                {**self.COLORS["emerald"], "reason": "Bold green creates regal look"},
                {**self.COLORS["lavender"], "reason": "Soft purple provides elegance"},
                {**self.COLORS["cobalt_blue"], "reason": "Deep blue looks rich"},
            ],
            ("dark", "warm"): [
                {**self.COLORS["white"], "reason": "THE best color — maximum impact"},
                {**self.COLORS["bright_yellow"], "reason": "Bold and beautiful"},
                {**self.COLORS["orange"], "reason": "Vibrant warm color looks incredible"},
                {**self.COLORS["coral"], "reason": "Warm bright tone glows"},
                {**self.COLORS["mint_green"], "reason": "Cool pop that stands out"},
            ],
            ("dark", "cool"): [
                {**self.COLORS["white"], "reason": "Classic, clean, stunning"},
                {**self.COLORS["royal_blue"], "reason": "Rich blue creates powerful look"},
                {**self.COLORS["emerald"], "reason": "Deep green looks regal"},
                {**self.COLORS["lavender"], "reason": "Soft purple creates contrast"},
                {**self.COLORS["powder_blue"], "reason": "Soft blue for refined look"},
            ],
        }
        key = (category, undertone)
        if key not in recommendations:
            warm = recommendations.get((category, "warm"), [])
            cool = recommendations.get((category, "cool"), [])
            return warm[:3] + cool[:2]
        return recommendations[key]

    def _get_top_colors(self, category, undertone):
        return self._get_dress_colors(category, undertone)

    def _get_saree_suggestions(self, category, undertone):
        if category in ["fair", "light"]:
            return [
                {"type": "Silk Saree", "colors": "Deep maroon, navy blue, forest green", "reason": "Rich colors create stunning contrast with fair skin", "occasion": "Weddings & Festivals"},
                {"type": "Chiffon Saree", "colors": "Pastel pink, lavender, mint green", "reason": "Soft colors complement fair complexion beautifully", "occasion": "Day functions"},
                {"type": "Banarasi Saree", "colors": "Royal blue with gold, burgundy with silver", "reason": "Jewel tones look magnificent on fair skin", "occasion": "Grand occasions"},
                {"type": "Cotton Saree", "colors": "Olive green, rust, mustard", "reason": "Earth tones add warmth to fair skin", "occasion": "Casual & Office"},
                {"type": "Suits & Salwar", "colors": "Teal, emerald, deep purple", "reason": "Rich tones enhance fair complexion", "occasion": "Daily wear"},
            ]
        elif category in ["medium", "olive"]:
            return [
                {"type": "Silk Saree", "colors": "White, cream, sky blue, coral", "reason": "Light colors create beautiful contrast with medium skin", "occasion": "Weddings & Festivals"},
                {"type": "Chiffon Saree", "colors": "Maroon, navy, olive green", "reason": "These colors make medium skin tone glow", "occasion": "Parties & Functions"},
                {"type": "Banarasi Saree", "colors": "Ivory with gold work, red with gold", "reason": "Classic combinations look stunning", "occasion": "Grand occasions"},
                {"type": "Cotton Saree", "colors": "Turquoise, rust, mustard yellow", "reason": "Vibrant colors enhance medium skin", "occasion": "Casual & Office"},
                {"type": "Suits & Salwar", "colors": "Sky blue, white, coral", "reason": "Fresh colors complement medium skin tone", "occasion": "Daily wear"},
            ]
        else:
            return [
                {"type": "Silk Saree", "colors": "White, golden yellow, bright coral", "reason": "Bold bright colors look AMAZING on dark skin", "occasion": "Weddings & Festivals"},
                {"type": "Chiffon Saree", "colors": "Royal blue, emerald green, hot pink", "reason": "Vibrant colors create stunning contrast", "occasion": "Parties & Functions"},
                {"type": "Banarasi Saree", "colors": "White with gold, cream with silver", "reason": "Light base with metallic work looks regal", "occasion": "Grand occasions"},
                {"type": "Cotton Saree", "colors": "Bright yellow, turquoise, orange", "reason": "Bold colors make dark skin glow beautifully", "occasion": "Casual & Office"},
                {"type": "Suits & Salwar", "colors": "White, bright yellow, royal blue", "reason": "These colors are your power palette", "occasion": "Daily wear"},
            ]

    def _get_makeup_suggestions(self, category, undertone):
        if category in ["fair", "light"]:
            return [
                {"product": "Foundation", "shade": "Ivory to Light Beige", "brands": "Lakme, Maybelline, MAC", "tip": "Always match your neck color, not just face"},
                {"product": "Lipstick", "shades": "Nude pink, coral, berry red, mauve", "tip": "Avoid very dark shades — they can look harsh on fair skin"},
                {"product": "Blush", "shades": "Peach, light pink, rose", "tip": "Soft colors give natural glow"},
                {"product": "Eyeshadow", "shades": "Earthy browns, champagne, soft purples", "tip": "Warm neutrals make eyes pop beautifully"},
                {"product": "Kajal/Eyeliner", "shade": "Black or dark brown", "tip": "Black kajal creates beautiful contrast"},
            ]
        elif category in ["medium", "olive"]:
            return [
                {"product": "Foundation", "shade": "Warm Beige to Medium Tan", "brands": "Lakme, Sugar, Nykaa", "tip": "Go for foundations with warm/golden undertones"},
                {"product": "Lipstick", "shades": "Brick red, terracotta, deep nude, berry", "tip": "Earth tones look gorgeous on medium skin"},
                {"product": "Blush", "shades": "Warm peach, terracotta, coral", "tip": "Warm blush shades complement medium skin perfectly"},
                {"product": "Eyeshadow", "shades": "Bronze, gold, copper, warm browns", "tip": "Metallic warm shades make eyes look stunning"},
                {"product": "Kajal/Eyeliner", "shade": "Black or bronze", "tip": "Bronze kajal looks especially beautiful"},
            ]
        else:
            return [
                {"product": "Foundation", "shade": "Rich Tan to Deep Brown", "brands": "Fenty Beauty, MAC, Nykaa", "tip": "Look for foundations specifically made for deep skin tones"},
                {"product": "Lipstick", "shades": "Bold red, deep plum, bright coral, orange-red", "tip": "Bold colors look INCREDIBLE — don't be afraid!"},
                {"product": "Blush", "shades": "Deep coral, bright orange, warm terracotta", "tip": "Bold blush makes dark skin glow magnificently"},
                {"product": "Eyeshadow", "shades": "Gold, copper, bright colors, glitter", "tip": "Metallics and bolds look stunning — go bold!"},
                {"product": "Kajal/Eyeliner", "shade": "Black, colored liners", "tip": "Colored kajal (blue, green, purple) looks amazing"},
            ]

    def _get_female_accessories(self, category, undertone):
        if undertone == "warm":
            return [
                {"type": "Jewellery Metal", "suggestion": "Gold jewellery", "reason": "Gold complements warm undertones beautifully"},
                {"type": "Handbag", "colors": "Tan, camel, rust, mustard", "reason": "Warm earth tones for bags"},
                {"type": "Footwear", "colors": "Tan heels, brown sandals, gold flats", "reason": "Warm neutrals work best"},
                {"type": "Dupatta/Scarf", "colors": "Contrasting bold colors", "reason": "Use accessories to add color pop"},
                {"type": "Bangles/Bracelets", "suggestion": "Gold, copper, wooden bangles", "reason": "Warm metals enhance warm undertones"},
            ]
        else:
            return [
                {"type": "Jewellery Metal", "suggestion": "Silver jewellery", "reason": "Silver complements cool undertones perfectly"},
                {"type": "Handbag", "colors": "Black, navy, burgundy, grey", "reason": "Cool neutrals for bags"},
                {"type": "Footwear", "colors": "Black heels, silver flats, navy pumps", "reason": "Cool colors complement cool undertones"},
                {"type": "Dupatta/Scarf", "colors": "Contrasting jewel tones", "reason": "Rich cool colors as accents"},
                {"type": "Bangles/Bracelets", "suggestion": "Silver, platinum, white gold", "reason": "Cool metals enhance cool undertones"},
            ]

    def _get_female_outfit_combos(self, category, undertone):
        if category in ["fair", "light"]:
            return [
                {"top": "White cotton kurta", "bottom": "Navy blue palazzo", "dupatta": "Floral print", "shoes": "Tan sandals", "occasion": "College / Casual", "vibe": "Fresh and elegant"},
                {"top": "Burgundy crop top", "bottom": "High waist black jeans", "dupatta": "-", "shoes": "Nude heels", "occasion": "Date / Party", "vibe": "Bold and stylish"},
                {"top": "Forest green kurti", "bottom": "Beige churidar", "dupatta": "Cream", "shoes": "Brown flats", "occasion": "Office / Formal", "vibe": "Professional and graceful"},
                {"top": "Pastel pink western top", "bottom": "White palazzo", "dupatta": "-", "shoes": "White sneakers", "occasion": "Weekend / Brunch", "vibe": "Soft and feminine"},
                {"top": "Navy blazer + white top", "bottom": "Beige trousers", "dupatta": "-", "shoes": "Nude pumps", "occasion": "Interview / Formal", "vibe": "Confident and polished"},
            ]
        elif category in ["medium", "olive"]:
            return [
                {"top": "Coral kurti", "bottom": "White palazzo", "dupatta": "Gold border", "shoes": "Gold sandals", "occasion": "Festival / Function", "vibe": "Radiant and festive"},
                {"top": "White cotton top", "bottom": "Navy blue jeans", "dupatta": "-", "shoes": "Brown sandals", "occasion": "College / Casual", "vibe": "Classic and fresh"},
                {"top": "Maroon silk blouse", "bottom": "Cream saree", "dupatta": "-", "shoes": "Gold heels", "occasion": "Wedding / Grand occasion", "vibe": "Timeless and elegant"},
                {"top": "Sky blue kurti", "bottom": "Beige leggings", "dupatta": "White", "shoes": "White flats", "occasion": "Office / Daily", "vibe": "Professional and comfortable"},
                {"top": "Rust western dress", "bottom": "-", "dupatta": "-", "shoes": "Tan heels", "occasion": "Date / Evening out", "vibe": "Earthy and chic"},
            ]
        else:
            return [
                {"top": "White anarkali kurta", "bottom": "White churidar", "dupatta": "Gold border", "shoes": "Gold heels", "occasion": "Wedding / Grand occasion", "vibe": "Regal and stunning"},
                {"top": "Bright yellow top", "bottom": "Navy blue jeans", "dupatta": "-", "shoes": "White sneakers", "occasion": "College / Casual", "vibe": "Bold and confident"},
                {"top": "Royal blue saree blouse", "bottom": "Royal blue saree", "dupatta": "-", "shoes": "Gold heels", "occasion": "Festival / Function", "vibe": "Powerful and beautiful"},
                {"top": "Coral western dress", "bottom": "-", "dupatta": "-", "shoes": "Nude heels", "occasion": "Date / Party", "vibe": "Vibrant and gorgeous"},
                {"top": "Emerald green kurti", "bottom": "Black palazzo", "dupatta": "Gold", "shoes": "Black heels", "occasion": "Office / Formal", "vibe": "Rich and professional"},
            ]

    def _get_female_style_tips(self, category, undertone):
        common = [
            "Fit is everything — well-fitted clothes always look better!",
            "Invest in good innerwear — it makes any outfit look better",
            "A good pair of black jeans goes with everything",
            "Own at least one good white and one black outfit",
        ]
        if category in ["fair", "light"]:
            specific = [
                "You can wear both pastels AND bold colors — lucky you!",
                "Deep jewel tones (emerald, sapphire, ruby) look stunning on you",
                "Gold jewellery complements warm fair skin, silver for cool",
            ]
        elif category in ["medium", "olive"]:
            specific = [
                "Most versatile skin tone — earth tones are your superpower!",
                "Warm metals (gold, copper) look incredible on you",
                "Contrast is key — light top with dark bottom or vice versa",
            ]
        else:
            specific = [
                "Bold, bright colors were MADE for your skin tone!",
                "White is your ultimate power color — stock up!",
                "Metallics (gold, silver) look absolutely stunning on you",
            ]
        return specific + common

    def _get_female_summary(self, category, undertone):
        summaries = {
            "fair": f"You have a beautiful fair complexion with {undertone} undertones. Rich jewel tones and deep colors create stunning contrast. You have the freedom to wear both bold and soft colors!",
            "light": f"You have a lovely light/wheatish complexion with {undertone} undertones. Earth tones and jewel tones are your best friends. Most colors work beautifully for you!",
            "medium": f"You have a gorgeous medium/wheatish complexion with {undertone} undertones — the most versatile skin tone! Warm earth tones and bright colors look incredible on you.",
            "olive": f"You have a beautiful olive/dusky complexion with {undertone} undertones. Light and bright colors create stunning contrast against your skin. Embrace bold colors!",
            "brown": f"You have a rich brown complexion with {undertone} undertones. Bold, bright colors look AMAZING on you. White, royal blue, and warm bright colors are your power palette!",
            "dark": f"You have a stunning deep complexion with {undertone} undertones. Bold colors, whites, and metallics create breathtaking contrast. You can pull off looks others can't!",
        }
        return summaries.get(category, summaries["medium"])

    def get_seasonal_recommendations(self, skin_tone: SkinToneResult, season: str) -> dict:
        category = skin_tone.category
        undertone = skin_tone.subcategory

        seasonal_data = {
            "summer": {
                "title": "☀️ Summer Collection",
                "description": "Stay cool and stylish in the summer heat",
                "fabrics": ["Cotton", "Linen", "Chambray", "Seersucker"],
                "avoid_fabrics": ["Polyester", "Wool", "Heavy denim"],
                "colors_boost": ["sky_blue", "white", "mint_green", "cream", "powder_blue"],
                "colors_reduce": ["black", "maroon", "chocolate"],
                "outfit_tips": [
                    "Prefer light colors — they absorb less heat",
                    "Wear loose-fit clothes — better air circulation",
                    "Cotton fabric is best — absorbs sweat well",
                    "Wear light-colored shoes — avoid leather in heat",
                ],
                "male_outfits": [
                    {"top": "White linen shirt", "bottom": "Beige chinos", "shoes": "White canvas sneakers", "occasion": "Office/College", "vibe": "Cool & Professional"},
                    {"top": "Sky blue polo", "bottom": "Light grey shorts", "shoes": "Flip flops", "occasion": "Casual/Weekend", "vibe": "Breezy & Relaxed"},
                    {"top": "Mint green t-shirt", "bottom": "White linen pants", "shoes": "White sneakers", "occasion": "Brunch/Outing", "vibe": "Fresh & Clean"},
                    {"top": "Printed cotton shirt", "bottom": "Navy shorts", "shoes": "Sandals", "occasion": "Beach/Travel", "vibe": "Vacation Ready"},
                ],
                "female_outfits": [
                    {"top": "White cotton kurti", "bottom": "Palazzo pants", "dupatta": "Light floral", "shoes": "Flat sandals", "occasion": "College/Casual", "vibe": "Breezy & Ethnic"},
                    {"top": "Floral sundress", "bottom": "-", "dupatta": "-", "shoes": "White sandals", "occasion": "Brunch/Outing", "vibe": "Feminine & Fresh"},
                    {"top": "Crop top", "bottom": "High waist linen pants", "dupatta": "-", "shoes": "Strappy sandals", "occasion": "Date/Party", "vibe": "Trendy & Cool"},
                    {"top": "Cotton saree blouse", "bottom": "Light cotton saree", "dupatta": "-", "shoes": "Flats", "occasion": "Festival/Function", "vibe": "Traditional & Comfortable"},
                ],
            },
            "monsoon": {
                "title": "🌧️ Monsoon Collection",
                "description": "Stay stylish and practical during the rainy season",
                "fabrics": ["Quick-dry polyester", "Nylon", "Synthetic blends"],
                "avoid_fabrics": ["White cotton", "Silk", "Suede", "Light linen"],
                "colors_boost": ["navy_blue", "maroon", "forest_green", "charcoal", "teal"],
                "colors_reduce": ["white", "cream", "beige"],
                "outfit_tips": [
                    "Prefer dark colors — they hide dirt and stains better",
                    "Wear quick-dry fabric — dries faster when wet",
                    "Use waterproof footwear",
                    "Avoid white — it becomes transparent when wet",
                    "Keep an extra pair of clothes in your bag",
                ],
                "male_outfits": [
                    {"top": "Navy blue polo", "bottom": "Dark jeans", "shoes": "Waterproof loafers", "occasion": "Office/College", "vibe": "Practical & Smart"},
                    {"top": "Dark green shirt", "bottom": "Black chinos", "shoes": "Rubber sole shoes", "occasion": "Casual/Daily", "vibe": "Monsoon Ready"},
                    {"top": "Maroon t-shirt", "bottom": "Dark shorts", "shoes": "Slippers", "occasion": "Home/Casual", "vibe": "Comfortable"},
                    {"top": "Charcoal windbreaker", "bottom": "Dark jeans", "shoes": "Boots", "occasion": "Travel/Outing", "vibe": "Adventure Ready"},
                ],
                "female_outfits": [
                    {"top": "Dark cotton kurti", "bottom": "Dark leggings", "dupatta": "-", "shoes": "Rubber flats", "occasion": "College/Daily", "vibe": "Practical & Stylish"},
                    {"top": "Navy wrap dress", "bottom": "-", "dupatta": "-", "shoes": "Waterproof sandals", "occasion": "Office/Casual", "vibe": "Chic & Practical"},
                    {"top": "Teal top", "bottom": "Dark palazzo", "dupatta": "Navy", "shoes": "Kolhapuri flats", "occasion": "Casual/Outing", "vibe": "Ethnic & Smart"},
                    {"top": "Quick-dry kurta", "bottom": "Churidar", "dupatta": "Matching", "shoes": "Rubber flats", "occasion": "Function/Festival", "vibe": "Monsoon Traditional"},
                ],
            },
            "winter": {
                "title": "❄️ Winter Collection",
                "description": "Stay warm and stylish in the cold weather",
                "fabrics": ["Wool", "Cashmere", "Fleece", "Velvet", "Corduroy"],
                "avoid_fabrics": ["Thin cotton", "Linen", "Light synthetic"],
                "colors_boost": ["maroon", "navy_blue", "forest_green", "charcoal", "burgundy", "rust"],
                "colors_reduce": ["white", "cream", "pastel_blue"],
                "outfit_tips": [
                    "Rich deep colors are most flattering in winter",
                    "Layer up — multiple light layers are better than one heavy layer",
                    "A scarf and jacket complete any winter outfit",
                    "Wear boots — stylish and warm",
                    "Prefer dark solid colors for a sleek look",
                ],
                "male_outfits": [
                    {"top": "Maroon sweater + white shirt", "bottom": "Dark jeans", "shoes": "Brown leather boots", "occasion": "Office/College", "vibe": "Warm & Classic"},
                    {"top": "Navy blazer + grey turtleneck", "bottom": "Charcoal trousers", "shoes": "Black boots", "occasion": "Formal/Office", "vibe": "Sharp & Sophisticated"},
                    {"top": "Rust hoodie + black jacket", "bottom": "Dark jeans", "shoes": "Sneakers", "occasion": "Casual/Weekend", "vibe": "Cozy & Trendy"},
                    {"top": "Wool overcoat + inner layer", "bottom": "Dark chinos", "shoes": "Derby shoes", "occasion": "Party/Event", "vibe": "Elegant & Warm"},
                ],
                "female_outfits": [
                    {"top": "Burgundy sweater", "bottom": "Black jeans", "dupatta": "-", "shoes": "Ankle boots", "occasion": "College/Casual", "vibe": "Cozy & Chic"},
                    {"top": "Velvet blouse + shawl", "bottom": "Silk saree", "dupatta": "-", "shoes": "Heels", "occasion": "Wedding/Function", "vibe": "Royal & Warm"},
                    {"top": "Woolen kurti", "bottom": "Churidar + jacket", "dupatta": "Woolen shawl", "shoes": "Boots", "occasion": "Daily/Office", "vibe": "Ethnic & Warm"},
                    {"top": "Turtleneck top", "bottom": "High waist skirt", "dupatta": "-", "shoes": "Knee boots", "occasion": "Date/Party", "vibe": "Trendy & Sophisticated"},
                ],
            },
            "festive": {
                "title": "🎉 Festive Collection",
                "description": "Perfect looks for Diwali, Eid, Christmas and all festivals",
                "fabrics": ["Silk", "Brocade", "Velvet", "Chanderi", "Georgette"],
                "avoid_fabrics": ["Plain cotton", "Denim", "Sports fabric"],
                "colors_boost": ["maroon", "navy_blue", "royal_blue", "emerald", "mustard", "orange"],
                "colors_reduce": ["gray", "tan", "khaki"],
                "outfit_tips": [
                    "Choose rich fabrics — silk, brocade, velvet",
                    "Deep jewel tones look best for festive occasions",
                    "Add gold and silver accessories",
                    "Try traditional + modern fusion looks",
                ],
                "male_outfits": [
                    {"top": "Silk kurta (maroon/navy)", "bottom": "White churidar", "shoes": "Mojari/Jutti", "occasion": "Diwali/Eid", "vibe": "Traditional & Elegant"},
                    {"top": "Brocade sherwani", "bottom": "Churidar", "shoes": "Kolhapuri", "occasion": "Wedding/Grand function", "vibe": "Regal & Festive"},
                    {"top": "Nehru jacket + kurta", "bottom": "Straight pants", "shoes": "Formal shoes", "occasion": "Office party/Semi-formal", "vibe": "Smart Festive"},
                    {"top": "Blazer + ethnic inner", "bottom": "Chinos", "shoes": "Oxford shoes", "occasion": "Christmas/New Year", "vibe": "Fusion Festive"},
                ],
                "female_outfits": [
                    {"top": "Silk saree blouse", "bottom": "Banarasi saree", "dupatta": "-", "shoes": "Gold heels", "occasion": "Diwali/Puja", "vibe": "Traditional & Stunning"},
                    {"top": "Anarkali suit", "bottom": "Churidar", "dupatta": "Net dupatta", "shoes": "Heels/Jutti", "occasion": "Eid/Festival", "vibe": "Graceful & Festive"},
                    {"top": "Velvet blouse", "bottom": "Lehenga", "dupatta": "Matching", "shoes": "Embellished heels", "occasion": "Wedding/Grand occasion", "vibe": "Bridal & Royal"},
                    {"top": "Fusion indo-western top", "bottom": "Skirt/Palazzo", "dupatta": "-", "shoes": "Block heels", "occasion": "Christmas/New Year party", "vibe": "Modern Festive"},
                ],
            },
            "college": {
                "title": "🎓 College Wear",
                "description": "Stay trendy and comfortable on campus",
                "fabrics": ["Cotton", "Denim", "Jersey", "Casual blends"],
                "avoid_fabrics": ["Formal wool", "Silk", "Heavy fabrics"],
                "colors_boost": ["navy_blue", "white", "sky_blue", "olive_green", "maroon"],
                "colors_reduce": ["formal_grey", "black_formal"],
                "outfit_tips": [
                    "Balance comfort and style",
                    "Choose versatile pieces — from classroom to canteen",
                    "Good fitting jeans are a worthy investment",
                    "White sneakers are the most versatile footwear",
                    "A backpack makes you look both casual and smart",
                ],
                "male_outfits": [
                    {"top": "Graphic t-shirt", "bottom": "Slim jeans", "shoes": "White sneakers", "occasion": "Regular college day", "vibe": "Casual & Trendy"},
                    {"top": "Polo shirt", "bottom": "Chinos", "shoes": "Loafers", "occasion": "Presentation/Seminar", "vibe": "Smart Casual"},
                    {"top": "Hoodie + inner tee", "bottom": "Joggers", "shoes": "Sneakers", "occasion": "Sports/Practical class", "vibe": "Athletic & Comfortable"},
                    {"top": "Casual blazer + t-shirt", "bottom": "Dark jeans", "shoes": "Casual shoes", "occasion": "College event/Fest", "vibe": "Stylish & Stand-out"},
                    {"top": "Kurta (casual)", "bottom": "Jeans", "shoes": "Sneakers", "occasion": "Cultural fest/Function", "vibe": "Desi Cool"},
                ],
                "female_outfits": [
                    {"top": "Casual kurti", "bottom": "Jeans/Leggings", "dupatta": "Optional", "shoes": "Flats/Sneakers", "occasion": "Regular college day", "vibe": "Comfortable & Indian"},
                    {"top": "Crop top", "bottom": "High waist jeans", "dupatta": "-", "shoes": "White sneakers", "occasion": "Casual day/Hangout", "vibe": "Trendy & Young"},
                    {"top": "Oversized hoodie", "bottom": "Leggings/Joggers", "dupatta": "-", "shoes": "Sneakers", "occasion": "Sports/Practical", "vibe": "Comfortable & Cool"},
                    {"top": "Co-ord set", "bottom": "Matching bottom", "dupatta": "-", "shoes": "Sandals/Sneakers", "occasion": "College fest/Event", "vibe": "Instagram Ready"},
                    {"top": "Shirt dress", "bottom": "-", "dupatta": "Light scarf", "shoes": "Flats", "occasion": "Presentation/Cultural", "vibe": "Chic & Smart"},
                ],
            },
        }

        season_info = seasonal_data.get(season, seasonal_data["summer"])
        base_shirt = self._get_shirt_colors(category, undertone)
        base_pant = self._get_pant_colors(category, undertone)
        boosted_colors = []
        for color_key in season_info.get("colors_boost", []):
            if color_key in self.COLORS:
                boosted_colors.append({
                    **self.COLORS[color_key],
                    "reason": f"Perfect for {season_info['title']} — highly recommended!"
                })

        return {
            "season": season,
            "title": season_info["title"],
            "description": season_info["description"],
            "fabrics_recommended": season_info["fabrics"],
            "fabrics_avoid": season_info["avoid_fabrics"],
            "outfit_tips": season_info["outfit_tips"],
            "seasonal_colors": boosted_colors,
            "male_outfits": season_info["male_outfits"],
            "female_outfits": season_info["female_outfits"],
            "base_shirt_colors": base_shirt,
            "base_pant_colors": base_pant,
        }

    def check_outfit_compatibility(self, skin_tone: SkinToneResult, outfit_color: dict) -> dict:
        category = skin_tone.category
        undertone = skin_tone.subcategory

        outfit_r = outfit_color["r"]
        outfit_g = outfit_color["g"]
        outfit_b = outfit_color["b"]
        outfit_hex = outfit_color["hex"]
        outfit_name = outfit_color.get("name", "This color")

        best_colors = self._get_shirt_colors(category, undertone)
        avoid_colors = self._get_avoid_colors(category, undertone)

        # ============================================
        # COLOR CONVERSION HELPERS
        # ============================================
        def rgb_to_lab(r, g, b):
            r, g, b = r/255.0, g/255.0, b/255.0
            r = ((r + 0.055) / 1.055) ** 2.4 if r > 0.04045 else r / 12.92
            g = ((g + 0.055) / 1.055) ** 2.4 if g > 0.04045 else g / 12.92
            b = ((b + 0.055) / 1.055) ** 2.4 if b > 0.04045 else b / 12.92
            x = r * 0.4124 + g * 0.3576 + b * 0.1805
            y = r * 0.2126 + g * 0.7152 + b * 0.0722
            z = r * 0.0193 + g * 0.1192 + b * 0.9505
            x, y, z = x/0.95047, y/1.0, z/1.08883
            fx = x**0.3333 if x > 0.008856 else 7.787*x + 0.1379
            fy = y**0.3333 if y > 0.008856 else 7.787*y + 0.1379
            fz = z**0.3333 if z > 0.008856 else 7.787*z + 0.1379
            return 116*fy - 16, 500*(fx - fy), 200*(fy - fz)

        def color_distance(r1, g1, b1, r2, g2, b2):
            L1, a1, b1v = rgb_to_lab(r1, g1, b1)
            L2, a2, b2v = rgb_to_lab(r2, g2, b2)
            return ((L1-L2)**2 + (a1-a2)**2 + (b1v-b2v)**2) ** 0.5

        def hex_to_rgb(hex_color):
            h = hex_color.lstrip('#')
            return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)

        # ============================================
        # SKIN TONE CONTRAST CHECK
        # ============================================
        skin_rgb = {
            "fair": (220, 190, 160),
            "light": (195, 155, 120),
            "medium": (175, 140, 105),
            "olive": (155, 120, 85),
            "brown": (120, 85, 60),
            "dark": (80, 55, 40),
        }
        sr, sg, sb = skin_rgb.get(category, (175, 140, 105))
        skin_outfit_contrast = color_distance(outfit_r, outfit_g, outfit_b, sr, sg, sb)

        # ============================================
        # BEST COLORS SE DISTANCE
        # ============================================
        distances_to_best = []
        for color in best_colors:
            cr, cg, cb = hex_to_rgb(color["hex"])
            dist = color_distance(outfit_r, outfit_g, outfit_b, cr, cg, cb)
            distances_to_best.append((dist, color))
        distances_to_best.sort(key=lambda x: x[0])

        min_best_distance = distances_to_best[0][0]
        closest_best = distances_to_best[0][1]

        # ============================================
        # AVOID COLORS SE DISTANCE
        # ============================================
        distances_to_avoid = []
        for color in avoid_colors:
            cr, cg, cb = hex_to_rgb(color["hex"])
            dist = color_distance(outfit_r, outfit_g, outfit_b, cr, cg, cb)
            distances_to_avoid.append((dist, color))
        distances_to_avoid.sort(key=lambda x: x[0])

        min_avoid_distance = distances_to_avoid[0][0]

        # ============================================
        # CONTINUOUS SCORE CALCULATION
        # Fixed thresholds ki jagah continuous formula
        # ============================================

        # Base score from best color proximity (0-60 points)
        best_score = max(0, 60 - (min_best_distance * 0.6))

        # Contrast score (0-25 points)
        if skin_outfit_contrast < 15:
            contrast_score = 5
        elif skin_outfit_contrast < 30:
            contrast_score = 12
        elif skin_outfit_contrast < 50:
            contrast_score = 20
        elif skin_outfit_contrast < 80:
            contrast_score = 25
        elif skin_outfit_contrast < 110:
            contrast_score = 20
        else:
            contrast_score = 15

        # Undertone harmony (0-15 points)
        outfit_warmth = outfit_r - outfit_b
        skin_is_warm = undertone == "warm"
        if skin_is_warm and outfit_warmth > 30:
            undertone_score = 15
        elif not skin_is_warm and outfit_warmth < -20:
            undertone_score = 15
        elif abs(outfit_warmth) < 30:
            undertone_score = 10
        else:
            undertone_score = 5

        # Total raw score
        raw_score = best_score + contrast_score + undertone_score

        # Avoid penalty
        avoid_penalty = 0
        if min_avoid_distance < 20:
            avoid_penalty = 35
        elif min_avoid_distance < 35:
            avoid_penalty = 20
        elif min_avoid_distance < 50:
            avoid_penalty = 10

        # Final score — max 97, min 15
        score = max(15, min(97, int(raw_score - avoid_penalty)))

        # ============================================
        # RATING
        # ============================================
        if score >= 85:
            rating = "excellent"
        elif score >= 72:
            rating = "great"
        elif score >= 58:
            rating = "good"
        elif score >= 42:
            rating = "okay"
        elif score >= 28:
            rating = "poor"
        else:
            rating = "avoid"

        # ============================================
        # MESSAGES
        # ============================================
        if rating == "excellent":
            message = f"🌟 Perfect! {outfit_name} is an EXCELLENT match for your {category} skin tone!"
        elif rating == "great":
            message = f"✅ Great choice! {outfit_name} will look very flattering on you!"
        elif rating == "good":
            message = f"👍 Good choice! {outfit_name} will look decent on you. There are better options too."
        elif rating == "okay":
            message = f"⚠️ Average match. {outfit_name} will work, but your best colors are different."
        elif rating == "poor":
            message = f"❌ This color doesn't match well with your skin tone."
        else:
            message = f"🚫 Avoid this. {outfit_name} may wash out your skin tone."

        # ============================================
        # UNDERTONE TIP
        # ============================================
        if undertone_score >= 12:
            undertone_tip = f"✨ Bonus: This color harmonizes beautifully with your {undertone} undertone!"
        elif undertone_score == 10:
            undertone_tip = f"💡 This is a neutral color — it works well with your {undertone} undertone."
        else:
            undertone_tip = f"💡 Tip: {'Warm (orange/red/yellow tones)' if skin_is_warm else 'Cool (blue/purple/green tones)'} colors work better with your {undertone} undertone."

        # Better alternatives
        better_alternatives = [
            {"name": c["name"], "hex": c["hex"], "reason": c["reason"]}
            for _, c in distances_to_best[:3]
        ]

        return {
            "compatibility_score": score,
            "rating": rating,
            "message": message,
            "undertone_tip": undertone_tip,
            "outfit_color": {
                "hex": outfit_hex,
                "r": outfit_r,
                "g": outfit_g,
                "b": outfit_b,
            },
            "skin_tone": category,
            "undertone": undertone,
            "closest_match": closest_best,
            "better_alternatives": better_alternatives,
            "verdict": "✅ Pehno!" if score >= 58 else "❌ Mat Pehno!",
            "score_breakdown": {
                "color_match": int(best_score),
                "contrast": contrast_score,
                "undertone": undertone_score,
                "penalty": avoid_penalty,
            }
        }