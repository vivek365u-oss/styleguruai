"""
face_shape_detector.py — StyleGuru AI
======================================
Face Shape Detection Engine using MediaPipe 468-point landmarks.
Uses scientifically validated geometric ratio method.

Face Shapes Detected:
  - OVAL    (balanced, elongated — ideal reference shape)
  - ROUND   (similar width & height, soft jaw)
  - SQUARE  (strong jaw, similar forehead & jaw width)
  - HEART   (wide forehead, narrow jaw, pointed chin)
  - OBLONG  (significantly longer than wide)
  - DIAMOND (wide cheekbones, narrow forehead & jaw)

Reference landmarks (MediaPipe indices):
  10  → Top of forehead
  152 → Bottom of chin
  54  → Right temple
  284 → Left temple
  234 → Right cheekbone (zygomatic arch)
  454 → Left cheekbone (zygomatic arch)
  172 → Right jaw angle
  397 → Left jaw angle
  1   → Nose tip (midpoint reference)

Method: Ratio-based geometric classification
  face_ratio     = height / width
  forehead_ratio = forehead_width / face_width
  jaw_ratio      = jaw_width / face_width
  cheek_ratio    = cheekbone_width / face_width
"""

import math
import logging
from typing import Dict, Tuple, Optional, List

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────────────
# Face Shape Knowledge Base
# ──────────────────────────────────────────────────────

FACE_SHAPE_DATA = {
    "oval": {
        "display": "Oval",
        "description": "Your face is gently elongated with balanced proportions and a slightly narrower chin than forehead. This is the most versatile face shape.",
        "icon": "🥚",
        "characteristics": ["Slightly longer than wide", "Rounded jawline", "Forehead slightly wider than jaw", "No dominant angles"],
        "celebrity_examples": ["Beyoncé", "George Clooney", "Rihanna", "Ryan Gosling"],
    },
    "round": {
        "display": "Round",
        "description": "Your face has similar width and height with full, soft cheeks and a rounded jawline that creates a youthful appearance.",
        "icon": "⭕",
        "characteristics": ["Nearly equal width and height", "Full cheeks", "Soft rounded jaw", "Less defined chin"],
        "celebrity_examples": ["Selena Gomez", "Chrissy Teigen", "Zayn Malik"],
    },
    "square": {
        "display": "Square",
        "description": "Your face has a strong, defined jawline with similar forehead and jaw width, giving you a bold, powerful look.",
        "icon": "⬜",
        "characteristics": ["Strong angular jaw", "Broad forehead", "Jaw & forehead roughly equal in width", "Minimal curve at cheeks"],
        "celebrity_examples": ["Olivia Wilde", "Angelina Jolie", "Brad Pitt", "David Beckham"],
    },
    "heart": {
        "display": "Heart",
        "description": "Your face has a wider forehead that gracefully narrows to a delicate, pointed chin, resembling the shape of a heart.",
        "icon": "❤️",
        "characteristics": ["Wide forehead", "High cheekbones", "Narrow jaw & chin", "Pointed chin"],
        "celebrity_examples": ["Reese Witherspoon", "Ryan Gosling", "Scarlett Johansson"],
    },
    "oblong": {
        "display": "Oblong",
        "description": "Your face is notably longer than it is wide, with straight sides and a long chin, giving an elegant, refined appearance.",
        "icon": "📏",
        "characteristics": ["Significantly longer than wide", "Straight sides", "Forehead, cheeks & jaw similar width", "Long chin"],
        "celebrity_examples": ["Kim Kardashian", "Adam Driver", "Sarah Jessica Parker"],
    },
    "diamond": {
        "display": "Diamond",
        "description": "Your face has wide, high cheekbones that narrow at both the forehead and jaw, creating a striking angular silhouette.",
        "icon": "💎",
        "characteristics": ["Wide, prominent cheekbones", "Narrow forehead", "Narrow chin/jaw", "Angular & distinctive"],
        "celebrity_examples": ["Taylor Swift", "Halle Berry", "Idris Elba"],
    },
}

# ──────────────────────────────────────────────────────
# Hairstyle Rules Database
# Full logic-based rules: face_shape × gender → styles
# ──────────────────────────────────────────────────────

HAIRSTYLE_DATABASE = {

    # ─── OVAL ─────────────────────────────────────────
    "oval": {
        "male": [
            {
                "rank": 1,
                "name": "Classic Undercut",
                "description": "Short sides with longer, swept-back top. Clean and masculine.",
                "reason": "Oval faces suit almost any cut. The undercut creates clean definition without changing your balanced proportions.",
                "benefit": "Gives a sharp, modern, professional look that transitions from office to night out.",
                "avoid_reason": None,
                "style_tip": "Style the top with matte pomade for a natural finish. Ask for a skin fade on the sides.",
                "hair_color": "Your warm undertone suits dark brown or black. Try subtle caramel highlights.",
                "hair_color_avoid": "Avoid platinum blonde — it can look harsh against warm skin.",
                "occasion": ["casual", "office", "date"],
                "difficulty": "Easy",
                "emoji": "✂️",
            },
            {
                "rank": 2,
                "name": "Textured Quiff",
                "description": "Volume on top, pushed forward and up, with tapered sides.",
                "reason": "The quiff adds height which enhances your already balanced oval proportions.",
                "benefit": "Adds height and visual interest without fighting your natural bone structure.",
                "avoid_reason": None,
                "style_tip": "Use a blow dryer + round brush to build volume at the roots, then finish with light-hold wax.",
                "hair_color": "Rich dark brown or deep black work best for your skin tone.",
                "hair_color_avoid": "Skip ashy tones — they don't complement warm-undertone skin.",
                "occasion": ["casual", "date", "party"],
                "difficulty": "Medium",
                "emoji": "💈",
            },
            {
                "rank": 3,
                "name": "Caesar Cut",
                "description": "Short, horizontally fringed cut with uniform length on top.",
                "reason": "A timeless, low-maintenance style that perfectly suits oval faces without any modifications needed.",
                "benefit": "Easy to maintain. Looks groomed with zero effort after styling.",
                "avoid_reason": None,
                "style_tip": "Keep the fringe about 2-3 cm long. Light pomade or cream for definition.",
                "styling_steps": [
                    "Towel dry hair until slightly damp.",
                    "Apply a pea-sized amount of light-hold pomade.",
                    "Comb the top hair forward and slightly to the side.",
                    "Use fingers to separate strands for a natural finish."
                ],
                "maintenance_tip": "Get a trim every 3-4 weeks to keep the fringe length precise.",
                "hair_color": "Jet black or dark espresso are ideal. Adds depth and structure.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office"],
                "difficulty": "Easy",
                "emoji": "👑",
            },
            {
                "rank": 4,
                "name": "Long Textured Waves",
                "description": "Shoulder-length or longer hair with natural waves or curls left loose.",
                "reason": "Oval faces can carry long hair effortlessly. Waves add natural movement without adding unwanted width.",
                "benefit": "Bohemian, artistic vibe. Adds personality and artistic flair.",
                "avoid_reason": None,
                "style_tip": "Use sea salt spray on damp hair and diffuse for natural waves. Avoid flat ironing.",
                "hair_color": "Warm toffee highlights or balayage complement Indian skin tones beautifully.",
                "hair_color_avoid": "Avoid cool-toned highlights like ash or silver.",
                "occasion": ["casual", "party"],
                "difficulty": "Easy",
                "emoji": "🌊",
            },
            {
                "rank": 5,
                "name": "Slicked-Back",
                "description": "All hair combed straight back from forehead, secured with gel or pomade.",
                "reason": "Reveals your full oval silhouette and jawline — one of the most flattering looks for this shape.",
                "benefit": "Ultra-polished, powerful. Perfect for formal events and important meetings.",
                "avoid_reason": None,
                "style_tip": "Apply medium-hold pomade to damp hair, comb back, then let dry completely before touchups.",
                "hair_color": "Natural black or deep brown. No highlights needed — the sleekness is the style.",
                "hair_color_avoid": None,
                "occasion": ["office", "wedding", "formal"],
                "difficulty": "Easy",
                "emoji": "🎩",
            },
        ],
        "female": [
            {
                "rank": 1,
                "name": "Layered Lob (Long Bob)",
                "description": "Chin-to-collarbone length with internal layers for movement.",
                "reason": "Oval faces are perfectly proportioned for a lob. Layers keep it from looking bulky and add body.",
                "benefit": "Works for both straight and wavy hair. Extremely versatile and professional.",
                "avoid_reason": None,
                "style_tip": "Ask your stylist for 'invisible layers' so the outside stays clean while the inside has movement.",
                "hair_color": "Caramel balayage or honey highlights frame the face beautifully.",
                "hair_color_avoid": "Heavy single-color dark tones can look flat on this cut.",
                "occasion": ["casual", "office", "date"],
                "difficulty": "Easy",
                "emoji": "💇‍♀️",
            },
            {
                "rank": 2,
                "name": "Soft Waves with Side Part",
                "description": "Long hair with a deep side part and soft, loose waves throughout.",
                "reason": "Side parts and soft waves are universally flattering on oval faces, adding romantic movement.",
                "benefit": "Effortlessly elegant. Works with any texture after minimal styling.",
                "avoid_reason": None,
                "style_tip": "Use a 1.5-inch curling iron and curl away from your face for the most flattering look.",
                "hair_color": "Warm ombre — dark roots fading to chestnut or gold — is stunning.",
                "hair_color_avoid": "Skip cool-toned highlights like platinum on warm skin.",
                "occasion": ["casual", "date", "party", "wedding"],
                "difficulty": "Medium",
                "emoji": "🌸",
            },
            {
                "rank": 3,
                "name": "Blunt Straight Bob",
                "description": "Clean-cut, jaw-length bob with a blunt edge and no layers.",
                "reason": "The geometric precision of a blunt bob looks bold and editorial on an oval face.",
                "benefit": "Modern, high-fashion look. Low maintenance once cut properly.",
                "avoid_reason": None,
                "style_tip": "Flat iron for a sleek look or blow dry with a round brush for a slight curve under.",
                "hair_color": "Rich dark brown or glossy jet black makes the blunt line pop dramatically.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office"],
                "difficulty": "Easy",
                "emoji": "✂️",
            },
            {
                "rank": 4,
                "name": "Curtain Bangs with Long Layers",
                "description": "Face-framing bangs split in the center, brushed to either side, with long cascading layers.",
                "reason": "Curtain bangs are extremely flattering on oval faces as they frame without shortening.",
                "benefit": "Romantic and face-framing. Adds character without committing to full bangs.",
                "avoid_reason": None,
                "style_tip": "Blow dry the bangs outward and apart using a round brush. Finish with a light serum.",
                "hair_color": "Subtle face-framing highlights around the bang area make them pop.",
                "hair_color_avoid": None,
                "occasion": ["casual", "date", "party"],
                "difficulty": "Medium",
                "emoji": "🪮",
            },
            {
                "rank": 5,
                "name": "High Voluminous Ponytail",
                "description": "Sleek ponytail secured high on the crown with volume at the base.",
                "reason": "A high ponytail complements oval proportions by elongating the neck and revealing natural cheekbones.",
                "benefit": "Quick, elegant and sporty. Perfect for gym, events or days when you need hair out of the way.",
                "avoid_reason": None,
                "style_tip": "Wrap a small section of hair around the elastic to hide it. Tease the roots slightly for volume.",
                "hair_color": None,
                "hair_color_avoid": None,
                "occasion": ["casual", "sports", "party"],
                "difficulty": "Easy",
                "emoji": "🏋️‍♀️",
            },
        ],
    },

    # ─── ROUND ────────────────────────────────────────
    "round": {
        "male": [
            {
                "rank": 1,
                "name": "High Fade with Textured Top",
                "description": "Skin or high fade on the sides with 2-3 inches of textured, styled hair on top.",
                "reason": "Adding height on top with a high fade creates an elongating effect that counteracts round proportions.",
                "benefit": "Visually slims the face and adds masculinity. The contrast between shaved sides and textured top is striking.",
                "avoid_reason": "Avoid buzz cuts — they emphasize width over height.",
                "style_tip": "Style the top upward with a medium-hold clay for a natural matte finish.",
                "hair_color": "Dark tones (black, dark brown) are slimming. Avoid light colors on top.",
                "hair_color_avoid": "Avoid bleached or very light hair on a round face — it draws attention to width.",
                "occasion": ["casual", "office", "date"],
                "difficulty": "Easy",
                "emoji": "📐",
            },
            {
                "rank": 2,
                "name": "Pompadour",
                "description": "Volume swept upward and back from the forehead with tight sides.",
                "reason": "The vertical height of a pompadour counters roundness perfectly by elongating the visual face length.",
                "benefit": "Dramatic and confident. Adds significant height that slims the overall face.",
                "avoid_reason": "Avoid flat, close-cropped styles — they emphasize the circular outline.",
                "style_tip": "Use a strong-hold pomade. Blow dry the front upward while pushing back with a comb.",
                "hair_color": "Rich black or dark espresso. The darkness of the hair contrasts with the height.",
                "hair_color_avoid": "Skip cool greys or ash tones — they widen the appearance.",
                "occasion": ["date", "party", "casual"],
                "difficulty": "Hard",
                "emoji": "🚀",
            },
            {
                "rank": 3,
                "name": "Angular Fringe",
                "description": "Straight-across fringe cut at an angular diagonal across the forehead.",
                "reason": "Diagonal angles break up the circular outline of round faces, adding definition.",
                "benefit": "Creates angles where there are none. Immediately sharpens the face's appearance.",
                "avoid_reason": "Avoid straight-across blunt bangs — they cut the face in half and emphasize width.",
                "style_tip": "Cut the fringe diagonally, longest on one side. Style with light cream.",
                "hair_color": "Dark, cool-toned browns create an illusion of length.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office"],
                "difficulty": "Easy",
                "emoji": "📏",
            },
            {
                "rank": 4,
                "name": "Faux Hawk",
                "description": "Short sides with a strip of longer hair down the center styled upward.",
                "reason": "The central strip of height creates a strong vertical line that elongates a round face dramatically.",
                "benefit": "Edgy, modern and face-slimming. Commands attention in any room.",
                "avoid_reason": None,
                "style_tip": "Use strong-hold gel or wax to push the central strip upward and hold it in place.",
                "hair_color": "Keep natural dark tones. A light streak down the center can look cool but be careful.",
                "hair_color_avoid": None,
                "occasion": ["casual", "party"],
                "difficulty": "Medium",
                "emoji": "⚡",
            },
            {
                "rank": 5,
                "name": "Short Crop with Texture",
                "description": "Uniform short length with textured, tousled styling on top.",
                "reason": "A slightly longer top with texture creates the illusion of length compared to a plain buzz cut.",
                "benefit": "Very low maintenance. Great for guys who want minimal effort with clean results.",
                "avoid_reason": "Keep at least 2cm on top — going too short emphasizes the round outline.",
                "style_tip": "Rub a small amount of matte wax between palms and tousle through the top.",
                "hair_color": "Natural color. Avoid bleaching for round faces.",
                "hair_color_avoid": "Avoid light colors — they soften the face even more.",
                "occasion": ["casual", "office", "sports"],
                "difficulty": "Easy",
                "emoji": "🌀",
            },
        ],
        "female": [
            {
                "rank": 1,
                "name": "Long Layers with Side Sweep",
                "description": "Long hair past the shoulder with face-framing layers and a side-swept finish.",
                "reason": "Length elongates a round face. Side sweep creates a diagonal line that adds angular definition.",
                "benefit": "Lengthens the face visually. The side sweep creates asymmetry that adds dimension.",
                "avoid_reason": "Avoid chin-length bobs — they stop right at the widest point of a round face.",
                "style_tip": "Deep side part is your best friend. Blow dry the sides straight and smooth for a sleek fall.",
                "hair_color": "Dark ombre with lighter ends draws the eye downward, elongating the face.",
                "hair_color_avoid": "Avoid very light, single-process color around the jawline — it frames the width.",
                "occasion": ["casual", "office", "date"],
                "difficulty": "Easy",
                "emoji": "💫",
            },
            {
                "rank": 2,
                "name": "High Bun or Top Knot",
                "description": "Hair gathered high on top of the head into a smooth or textured bun.",
                "reason": "Length above the face visually elongates the face and draws attention away from width.",
                "benefit": "Height above the crown is the quickest way to balance a round face. Elegant and practical.",
                "avoid_reason": "Avoid low buns at the nape — they emphasize cheek width.",
                "style_tip": "Pull the bun high — directly on top of the head or slightly toward the front hairline.",
                "hair_color": None,
                "hair_color_avoid": None,
                "occasion": ["gym", "casual", "office", "wedding"],
                "difficulty": "Easy",
                "emoji": "👸",
            },
            {
                "rank": 3,
                "name": "V-Cut Layers",
                "description": "Long hair cut into a deep V shape at the back with face-framing layers.",
                "reason": "The V-shaped cut creates strong vertical lines that counteract the horizontal breadth of round faces.",
                "benefit": "Dramatically slimming. The sharp V at the back creates an elongated silhouette.",
                "avoid_reason": "Avoid U-cut or blunt straight-across cuts — they add width.",
                "style_tip": "Ask for the V to be quite pronounced — at least 5 cm difference between center and sides.",
                "hair_color": "Dark roots with warm, face-framing highlights create depth that slims.",
                "hair_color_avoid": "Avoid bright hair colors around the face — they highlight width.",
                "occasion": ["casual", "party", "date"],
                "difficulty": "Medium",
                "emoji": "🔥",
            },
            {
                "rank": 4,
                "name": "Sleek Straight Ponytail",
                "description": "Hair pulled back very sleek and straight into a mid or high ponytail.",
                "reason": "Pulling hair back tight reveals bone structure and creates the desired angular definition.",
                "benefit": "Instantly slimming and chic. Reveals the natural contours of your face.",
                "avoid_reason": "Avoid fluffy, voluminous ponytails with excess hair around the face.",
                "style_tip": "Use a fine-tooth comb and edge control to get the sleekest possible result at the temples.",
                "hair_color": None,
                "hair_color_avoid": None,
                "occasion": ["office", "gym", "casual"],
                "difficulty": "Easy",
                "emoji": "💼",
            },
            {
                "rank": 5,
                "name": "Asymmetrical Short Cut",
                "description": "A short cut that is longer on one side than the other, creating visual movement and angles.",
                "reason": "Asymmetry breaks the circular outline of round faces with unexpected angles.",
                "benefit": "Artistic and editorial. Very unique and shows bold personal style.",
                "avoid_reason": "Avoid symmetrical round bobs — they mirror the face's shape.",
                "style_tip": "Work with your natural hair texture. Let the longer side fall naturally.",
                "hair_color": "Bold color on the longer side is a stunning statement for this cut.",
                "hair_color_avoid": None,
                "occasion": ["casual", "party"],
                "difficulty": "Hard",
                "emoji": "🎨",
            },
        ],
    },

    # ─── SQUARE ───────────────────────────────────────
    "square": {
        "male": [
            {
                "rank": 1,
                "name": "Side-Swept Quiff",
                "description": "Volume pushed to the side and upward with blended, tapered sides.",
                "reason": "The sweep and roundness of a quiff softens square angles. Curved styling counteracts sharp jaw angles.",
                "benefit": "Softens the strong jawline while maintaining masculinity. Adds romantic flair.",
                "avoid_reason": "Avoid harsh, geometric cuts like a flat top — they reinforce the square shape.",
                "style_tip": "Blow dry hair toward one side while lifting at the roots. Use a flexible hold cream.",
                "hair_color": "Warm medium brown. Too dark makes the jaw look heavier.",
                "hair_color_avoid": "Avoid jet black with square faces — it hardens the jaw further.",
                "occasion": ["casual", "date", "office"],
                "difficulty": "Medium",
                "emoji": "🌊",
            },
            {
                "rank": 2,
                "name": "Low Fade with Soft Layers",
                "description": "Gentle low fade that gradually blends into soft, layered top hair.",
                "reason": "A low (not high) fade reduces the effect of a wide jaw. Soft layers on top add roundness.",
                "benefit": "Creates the appearance of a longer, more oval face shape through gentle transitions.",
                "avoid_reason": "Avoid high fades — they emphasize the jawline width.",
                "style_tip": "Ask for a skin fade starting at the ear level (low), not at the temples.",
                "hair_color": "Medium tones — chestnut or warm brown — soften the face best.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office"],
                "difficulty": "Easy",
                "emoji": "🍂",
            },
            {
                "rank": 3,
                "name": "Textured Crop",
                "description": "Short, textured top with disconnected or blended fade and a natural finish.",
                "reason": "Texture on top adds movement and visual softness that counteracts the rigidity of square angles.",
                "benefit": "Fashion-forward look that's easy to style and maintain.",
                "avoid_reason": "Avoid super clean, slicked-down styles — they highlight the jaw's angularity.",
                "style_tip": "Work matte clay into dry hair by scrunching upward for natural texture.",
                "hair_color": "Natural or slightly lightened warm brown is most flattering.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office", "date"],
                "difficulty": "Easy",
                "emoji": "✨",
            },
            {
                "rank": 4,
                "name": "Curly or Wavy Natural",
                "description": "Natural curls or waves left to form their own shape with minimal control.",
                "reason": "Curls and waves add roundness and softness — the exact counterbalance to sharp square angles.",
                "benefit": "Curls naturally soften the face. If you have curly hair, this is your superpower.",
                "avoid_reason": "Avoid forcing straight styles if you have natural curl — you're fighting your best asset.",
                "style_tip": "Apply curl cream or gel to wet hair, scrunch upward, and diffuse dry. Do not touch until dry.",
                "hair_color": "Let natural curl patterns and dark tones speak for themselves.",
                "hair_color_avoid": None,
                "occasion": ["casual", "party"],
                "difficulty": "Easy",
                "emoji": "🌀",
            },
            {
                "rank": 5,
                "name": "Shaggy Mid-Length",
                "description": "Mid-length hair with choppy, uneven layers and curtain bangs or a center part.",
                "reason": "The shaggy texture and face-framing layers add softness around the jaw area.",
                "benefit": "Cool, artistic, laid-back vibe. Covers and softens the square jawline naturally.",
                "avoid_reason": None,
                "style_tip": "Get point-cut layers (not blunt lines). A sea salt spray gives ideal texture.",
                "hair_color": "Warm highlights give this style warmth and depth.",
                "hair_color_avoid": None,
                "occasion": ["casual", "creative"],
                "difficulty": "Easy",
                "emoji": "🎸",
            },
        ],
        "female": [
            {
                "rank": 1,
                "name": "Soft Layered Waves",
                "description": "Long hair with abundant soft waves and face-framing layers that fall past the jaw.",
                "reason": "Soft waves counteract the angular jaw with curved, organic shapes. Length past the jaw minimizes its width.",
                "benefit": "Romantic and feminine. Naturally softens the strong square features without hiding them.",
                "avoid_reason": "Avoid blunt-cut chin-length bobs — they stop exactly at the widest point.",
                "style_tip": "Use a large barrel (1.75 inch) for loose, romantic waves. Finish with a light texture spray.",
                "hair_color": "Warm balayage — caramel, honey, or toffee — softens the face beautifully.",
                "hair_color_avoid": "Avoid very dark, severe single-color treatments that emphasize the jaw.",
                "occasion": ["casual", "date", "wedding"],
                "difficulty": "Medium",
                "emoji": "🌹",
            },
            {
                "rank": 2,
                "name": "Off-Center Part with Long Locks",
                "description": "Long hair with a deeply off-center (not quite side) part that creates asymmetry.",
                "reason": "Asymmetry disrupts the balanced squareness of the face. The off-center part shifts visual focus.",
                "benefit": "Subtle but effective technique. One of the simplest ways to immediately change how your face reads.",
                "avoid_reason": "Avoid center parts — they emphasize symmetrical squareness of the jawline.",
                "style_tip": "Part hair at 70/30 ratio rather than exactly in the middle or far to the side.",
                "hair_color": "Rich brunette shades work beautifully with this look.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office", "date"],
                "difficulty": "Easy",
                "emoji": "🎭",
            },
            {
                "rank": 3,
                "name": "Layered Bob with Wispy Ends",
                "description": "Jaw-length or slightly below with layered ends that taper to wispy, textured tips.",
                "reason": "Wispy, textured ends soften the otherwise geometric nature of a standard bob on a square face.",
                "benefit": "Softens without losing the chic structure of a bob.",
                "avoid_reason": "Avoid a blunt-cut bob — it creates a hard horizontal line at the jawline.",
                "style_tip": "Ask specifically for 'point cutting' at the ends to create the wispy effect.",
                "hair_color": "Subtle highlights throughout add dimension and break up solid blocks of color.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office"],
                "difficulty": "Easy",
                "emoji": "🦋",
            },
            {
                "rank": 4,
                "name": "Long Curtain Bangs",
                "description": "Face-framing bangs that split in the center and cascade gently to either side.",
                "reason": "Curtain bangs create a V-shape at the forehead that draws the eye to the center and softens the sides.",
                "benefit": "Adds a romantic, boho touch while effectively narrowing the perception of square features.",
                "avoid_reason": "Avoid blunt straight-across bangs — they create a harsh horizontal line.",
                "style_tip": "Blow dry the bangs outward and apart into their signature heart shape.",
                "hair_color": "Any warm tone works. Lighter highlights around the bangs draw extra attention to the center.",
                "hair_color_avoid": None,
                "occasion": ["casual", "date", "party"],
                "difficulty": "Medium",
                "emoji": "💝",
            },
            {
                "rank": 5,
                "name": "Messy Updo with Tendrils",
                "description": "A loosely gathered updo (chignon or bun) with soft tendrils left loose around the face.",
                "reason": "Loose face-framing tendrils soften the jawline while the updo reveals the neck's length.",
                "benefit": "Elegant and effortlessly romantic. Perfect for events and weddings.",
                "avoid_reason": "Avoid slicked-back, super tight updos that expose the full squared jaw.",
                "style_tip": "Pull out 2-3 sections at the temples and curl them loosely before setting the updo.",
                "hair_color": None,
                "hair_color_avoid": None,
                "occasion": ["wedding", "party", "formal"],
                "difficulty": "Medium",
                "emoji": "💍",
            },
        ],
    },

    # ─── HEART ────────────────────────────────────────
    "heart": {
        "male": [
            {
                "rank": 1,
                "name": "Medium Length Center Part",
                "description": "Hair grown to ear length or longer, parted at the center and falling on either side.",
                "reason": "A center part draws attention to the center of the face and minimizes wide forehead perception.",
                "benefit": "Balances the wide forehead vs. narrow chin ratio. Casual-cool aesthetic.",
                "avoid_reason": "Avoid pompadours and high-volume styles — they add even more forehead height.",
                "style_tip": "Let hair grow past the ears. A light texturizing spray gives effortless body.",
                "hair_color": "Natural medium tones. Highlights around the jaw area can visually widen it.",
                "hair_color_avoid": "Avoid very dark heavy hair at the top — it emphasizes forehead size.",
                "occasion": ["casual", "creative"],
                "difficulty": "Easy",
                "emoji": "🎸",
            },
            {
                "rank": 2,
                "name": "Low-Maintained Stubble + Medium Hair",
                "description": "Medium-length hair paired with 3-5 day beard stubble across the jaw.",
                "reason": "Stubble adds visual width to the narrow jaw and chin, perfectly balancing a heart-shaped face.",
                "benefit": "The beard effectively creates the jaw definition that naturally isn't there. Very masculine result.",
                "avoid_reason": None,
                "style_tip": "Keep stubble between 3-5mm for maximum jaw-widening effect. Clean the neck line sharply.",
                "hair_color": "Natural colors work. The beard is the key styling element here.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office", "date"],
                "difficulty": "Easy",
                "emoji": "🧔",
            },
            {
                "rank": 3,
                "name": "Side Part Low Fade",
                "description": "Defined side part with a low, gradual fade and the hair combed to one side.",
                "reason": "A low (not skin) fade and side part add width at the lower portion of the face, balancing the wide top.",
                "benefit": "Classic, groomed and face-balancing. Works in every professional and social setting.",
                "avoid_reason": "Avoid high fades — they narrow the sides and emphasize the already narrow jaw.",
                "style_tip": "Ask for a low fade starting just above the ear. Part on the side your hair naturally grows.",
                "hair_color": "Rich medium brown or natural black. Natural is best for this shape.",
                "hair_color_avoid": None,
                "occasion": ["office", "casual", "date"],
                "difficulty": "Easy",
                "emoji": "👔",
            },
            {
                "rank": 4,
                "name": "Textured Fringe (Forward Brushed)",
                "description": "Medium-length hair brushed forward toward the forehead in a textured, casual finish.",
                "reason": "Brushing hair forward reduces the forehead's visual prominence — critical for heart face shapes.",
                "benefit": "Minimizes the wide forehead. Makes the face appear more balanced and proportional.",
                "avoid_reason": "Avoid styles that expose the full forehead — they emphasize the heart shape's wide top.",
                "style_tip": "Use a light-hold mousse or cream and push hair forward-and-slightly-down onto the forehead.",
                "hair_color": "Medium brown or natural. Keep it simple.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office"],
                "difficulty": "Easy",
                "emoji": "🌿",
            },
            {
                "rank": 5,
                "name": "Full Beard + Short Hair",
                "description": "Very short, closely cropped hair combined with a full, well-groomed beard.",
                "reason": "A full beard is the most powerful tool for adding width to the narrow jaw of a heart-shaped face.",
                "benefit": "Dramatically balances the face. Adds jaw presence and masculinity while short hair minimizes the forehead.",
                "avoid_reason": None,
                "style_tip": "Beard should be kept slightly fuller at the chin/jaw sides. Trim to maintain neat lines.",
                "hair_color": "Natural. The beard does all the work here.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office", "date"],
                "difficulty": "Easy",
                "emoji": "💪",
            },
        ],
        "female": [
            {
                "rank": 1,
                "name": "Chin-Length Bob with Volume at Jaw",
                "description": "A bob that graduates longer at the jaw and has volume flicked outward at the ends.",
                "reason": "Volume at jaw level is the key technique for heart faces — it widens the narrow lower face.",
                "benefit": "Creates the illusion of a wider jaw. Balances the wide forehead with the narrow chin perfectly.",
                "avoid_reason": "Avoid very straight, pin-straight blunt ends that taper to nothing at the jaw.",
                "style_tip": "Use a round brush while blow drying to flip the ends outward at the jaw.",
                "hair_color": "Warm highlights at the jawline draw attention to the lower face — very strategic!",
                "hair_color_avoid": "Avoid very dark ends — they visually narrow the jaw further.",
                "occasion": ["casual", "office", "date"],
                "difficulty": "Medium",
                "emoji": "🌟",
            },
            {
                "rank": 2,
                "name": "Side-Swept Bangs",
                "description": "Long bangs that sweep across the forehead from one side, partially covering it.",
                "reason": "Side-swept bangs reduce the visual width of the forehead — the defining challenge of heart face shapes.",
                "benefit": "Instantly minimizes the forehead. One of the fastest ways to transform a heart face.",
                "avoid_reason": "Avoid center-parted bangs — they expose the full width of the forehead.",
                "style_tip": "Blow dry bangs toward the shorter side, then pin to the side. A little texture spray prevents flatness.",
                "hair_color": "The bang area looks stunning with subtle highlights to add dimension.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office", "date"],
                "difficulty": "Easy",
                "emoji": "💫",
            },
            {
                "rank": 3,
                "name": "Wavy Lob with Volume Below Jaw",
                "description": "Collarbone-length lob with waves that have maximum fullness at and below the jawline.",
                "reason": "Fullness below the jaw creates visual width at the bottom, balancing the heart's wide top.",
                "benefit": "The waves create natural-looking width exactly where needed. Romantic and elegant.",
                "avoid_reason": "Avoid styles with volume at the temples — they widen the already-wide forehead area.",
                "style_tip": "Curl the bottom sections the most. Leave the top sections more relaxed.",
                "hair_color": "Warm honey balayage concentrated towards the ends creates lower-face warmth.",
                "hair_color_avoid": "Avoid parting light highlights near the temples — it broadens the forehead.",
                "occasion": ["casual", "date", "party"],
                "difficulty": "Medium",
                "emoji": "🌺",
            },
            {
                "rank": 4,
                "name": "Textured Updo with Face Framing",
                "description": "A messy updo that leaves 2-3 tendrils at the jaw/chin level on both sides.",
                "reason": "Tendrils at jaw level draw the eye down and add apparent width to the narrow chin area.",
                "benefit": "Elegant solution that works even in formal settings. Face-framing tendrils are the secret weapon.",
                "avoid_reason": "Avoid all hair pulled back tight with nothing framing the face — exposes full forehead.",
                "style_tip": "Pull out 2 sections near the ears specifically, and curl those tendrils forward toward the chin.",
                "hair_color": None,
                "hair_color_avoid": None,
                "occasion": ["wedding", "formal", "party"],
                "difficulty": "Medium",
                "emoji": "💐",
            },
            {
                "rank": 5,
                "name": "Natural Curly Crown",
                "description": "Natural curls worn freely with volume concentrated at and below the cheekbones.",
                "reason": "If you have natural curls, they naturally add width to the lower portion of the face.",
                "benefit": "Curls at jaw level create natural fullness without any effort. Celebrate your natural texture!",
                "avoid_reason": "Avoid pineapple up-dos — they add crown height and widen the forehead area.",
                "style_tip": "Use a diffuser. Apply curl cream focusing on mid-lengths and ends for lower fullness.",
                "hair_color": "Natural or rich warm tones. Let the texture be the star.",
                "hair_color_avoid": None,
                "occasion": ["casual", "party"],
                "difficulty": "Easy",
                "emoji": "🌸",
            },
        ],
    },

    # ─── OBLONG ───────────────────────────────────────
    "oblong": {
        "male": [
            {
                "rank": 1,
                "name": "Side Part with Volume at Sides",
                "description": "Side-parted hair with width and body added at the temples and sides.",
                "reason": "Oblong faces benefit from width, not height. Volume at the sides adds the visual width that balances the long face.",
                "benefit": "Effectively shortens the perceived face length by adding horizontal fullness.",
                "avoid_reason": "Avoid pompadours and high volume on top — they make an already long face look longer.",
                "style_tip": "Blow dry side sections outward, not upward. Use a volumizing mousse at the roots.",
                "hair_color": "Medium tones. Avoid very dark single-color treatments that add visual length.",
                "hair_color_avoid": "Avoid all-dark hair — it elongates the face further.",
                "occasion": ["office", "casual", "date"],
                "difficulty": "Medium",
                "emoji": "↔️",
            },
            {
                "rank": 2,
                "name": "Fringe / Curtain Bangs",
                "description": "Hair brought forward over the forehead in a curtain-split fringe.",
                "reason": "A fringe covers part of the forehead, dividing the face's length into shorter visual sections.",
                "benefit": "Immediately reduces the perceived length of the face. Trendy and face-framing.",
                "avoid_reason": "Avoid slicked-back styles that fully expose the forehead — they maximize length.",
                "style_tip": "Ask for the fringe to fall just above the eyebrows. Too long and it loses its shortening effect.",
                "hair_color": "Natural or warm-toned. A slightly lighter fringe draws attention to it — use strategically.",
                "hair_color_avoid": None,
                "occasion": ["casual", "creative", "office"],
                "difficulty": "Easy",
                "emoji": "🎯",
            },
            {
                "rank": 3,
                "name": "Short Textured Crop",
                "description": "Short all-around cut with deliberate texture and movement on top.",
                "reason": "Keeps hair close to the head, minimizing the face's overall length without adding height.",
                "benefit": "Low maintenance and compact. Doesn't add unnecessary length or height to the face.",
                "avoid_reason": "Avoid fades with very tall tops — takes the face length to extremes.",
                "style_tip": "Ask for uniform texture throughout — not a high fade. A mid or low fade is safer.",
                "hair_color": "Any color works. If choosing lighter, keep it uniform, not concentrated on top.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office"],
                "difficulty": "Easy",
                "emoji": "🌱",
            },
            {
                "rank": 4,
                "name": "Horizontal-Swept Undercut",
                "description": "Undercut with top hair styled horizontally (flat, swept to one side, not upward).",
                "reason": "A horizontal sweep across the forehead is the opposite of height — it adds width and shortens the face.",
                "benefit": "Modern, clean look. The horizontal lines counteract vertical elongation effectively.",
                "avoid_reason": "Avoid the vertical pompadour version of undercut — stylize horizontally.",
                "style_tip": "Use a fine comb and medium pomade to achieve a flat, wide sweep of the top section.",
                "hair_color": "Medium brown or dark for structure. A subtle highlight on top draws attention to the horizontal sweep.",
                "hair_color_avoid": None,
                "occasion": ["office", "date"],
                "difficulty": "Easy",
                "emoji": "🎵",
            },
            {
                "rank": 5,
                "name": "Beard Styling (Short, Wide Shape)",
                "description": "Short beard styled wider and squarer at the sides to visually add jaw width.",
                "reason": "A wide beard profile shortens the visual length of an oblong face by adding horizontal mass at the jaw.",
                "benefit": "The beard itself becomes a shaping tool. Very low effort for big face-balancing results.",
                "avoid_reason": "Avoid long pointed beards — they extend facial length downward.",
                "style_tip": "Trim beard shorter at the chin tip, keeping it fuller at the jaw sides for a wider profile.",
                "hair_color": "Natural beard color. Light beard products for cleanliness and shape.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office"],
                "difficulty": "Easy",
                "emoji": "🧔",
            },
        ],
        "female": [
            {
                "rank": 1,
                "name": "Straight-Across Bangs",
                "description": "Full, straight-across blunt fringe covering the upper forehead.",
                "reason": "Oblong is one of the few face shapes that benefits from straight-across bangs — they divide the length.",
                "benefit": "Instantly cuts face length. The horizontal line of the bangs creates a visual shortening effect.",
                "avoid_reason": "Avoid long, side-swept styles that expose the full length of the face.",
                "style_tip": "Keep the bangs hitting at the eyebrows — too short looks harsh, too long loses effect.",
                "hair_color": "Face-framing highlights near the bangs make them a statement feature.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office", "date"],
                "difficulty": "Easy",
                "emoji": "✂️",
            },
            {
                "rank": 2,
                "name": "Voluminous Curls",
                "description": "Full, voluminous curls or waves that add width at the sides of the head.",
                "reason": "Volume at the sides creates horizontal breadth — exactly what oblong faces need to look balanced.",
                "benefit": "Natural, bouncy, full-of-life look. Extremely effective at adding needed width.",
                "avoid_reason": "Avoid sleek, straight long hairstyles — they emphasize the face's length.",
                "style_tip": "Diffuse curls with your head tilted sideways to maximize side volume.",
                "hair_color": "Warm highlights (honey, caramel, golden) add visual warmth and dimension to the curls.",
                "hair_color_avoid": None,
                "occasion": ["casual", "party", "date"],
                "difficulty": "Easy",
                "emoji": "🌈",
            },
            {
                "rank": 3,
                "name": "Shoulder-Length Bob (No Layers)",
                "description": "Collarbone-length blunt bob with uniform length and gentle volume.",
                "reason": "A blunt shoulder-length style adds width and avoids the length-maximizing effect of long, straight hair.",
                "benefit": "Modern and structured. One of the best face-shortening hairstyles for oblong faces.",
                "avoid_reason": "Avoid very long, very straight styles — they exaggerate length.",
                "style_tip": "Blow dry outward with a round brush for volume at the sides. Avoid flat ironing toward the face.",
                "hair_color": "Golden blonde, caramel, or warm brunette tones with highlights add horizontal richness.",
                "hair_color_avoid": "Avoid a dark-to-light vertical ombre — it draws the eye up and down, adding perceived length.",
                "occasion": ["casual", "office", "date"],
                "difficulty": "Easy",
                "emoji": "💎",
            },
            {
                "rank": 4,
                "name": "Wavy Half-Up Half-Down",
                "description": "Top half pinned back, bottom half left in loose waves with side volume.",
                "reason": "The half-up style adds width to the mid-section of the face — balancing an oblong shape well.",
                "benefit": "Versatile and pretty. Works for casual outings and dressed-up occasions.",
                "avoid_reason": None,
                "style_tip": "Add waves to the bottom section and leave it full and wide. Avoid tight or pin-straight styling.",
                "hair_color": "Any warm tone flatters this style. Beachy highlights look stunning.",
                "hair_color_avoid": None,
                "occasion": ["casual", "date", "party"],
                "difficulty": "Easy",
                "emoji": "🌅",
            },
            {
                "rank": 5,
                "name": "Wispy Pixie Cut",
                "description": "Very short cut with texture and wispy pieces around the ears and crown.",
                "reason": "Pixie cuts minimize overall head volume and length — creating a compact silhouette that balances oblong faces.",
                "benefit": "Bold, confident and modern. Eliminates the issue of managing long lengths.",
                "avoid_reason": "Avoid very high crown volume on a pixie — it adds height instead of width.",
                "style_tip": "Grow out the sides slightly while keeping the top close. Texture spray for that wispy look.",
                "hair_color": "This is great for color experimentation! Vibrant colors look stunning on a pixie.",
                "hair_color_avoid": None,
                "occasion": ["casual", "creative", "office"],
                "difficulty": "Easy",
                "emoji": "✨",
            },
        ],
    },

    # ─── DIAMOND ──────────────────────────────────────
    "diamond": {
        "male": [
            {
                "rank": 1,
                "name": "Full Side Part with Volume at Forehead",
                "description": "Side-parted style with volume and width at the temples and forehead area.",
                "reason": "Diamond faces have a narrow forehead. Adding width there creates better overall balance.",
                "benefit": "Widens the narrow forehead to better match the prominent cheekbones.",
                "avoid_reason": "Avoid slicked-back styles — they expose the narrow forehead.",
                "style_tip": "Blow dry the hair forward and sideways at the temples to maximize forehead width.",
                "hair_color": "Warm medium tones. Slightly lighter at the temples creates visual width.",
                "hair_color_avoid": None,
                "occasion": ["office", "date", "casual"],
                "difficulty": "Medium",
                "emoji": "💡",
            },
            {
                "rank": 2,
                "name": "Fringe / Curtain Bangs",
                "description": "Hair brought forward in a fringe or split curtain-style across the forehead.",
                "reason": "Bangs add apparent forehead width to the narrowest part of a diamond face.",
                "benefit": "Immediately balances the narrowest feature (forehead) of the diamond shape.",
                "avoid_reason": "Avoid styles that expose the full narrow forehead — they make the cheekbones look even wider in contrast.",
                "style_tip": "Curtain bangs work best — they fill out the temple area naturally.",
                "hair_color": "Natural. Lighter bangs create visual width at the forehead.",
                "hair_color_avoid": None,
                "occasion": ["casual", "creative"],
                "difficulty": "Easy",
                "emoji": "🎭",
            },
            {
                "rank": 3,
                "name": "Textured Mid-Length with Bob",
                "description": "Medium-length hair with texture and a style that adds volume at the chin/jaw level.",
                "reason": "Volume at the chin counteracts the narrow jaw of a diamond face, adding needed balance.",
                "benefit": "Adds fullness to both ends (forehead and chin) that balances the wide-cheekbone-dominated diamond.",
                "avoid_reason": None,
                "style_tip": "Style the ends outward slightly — a round brush while blow drying achieves this.",
                "hair_color": "Warm tones throughout. Highlights at the temples and jaw area add width where needed.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office"],
                "difficulty": "Medium",
                "emoji": "⚡",
            },
            {
                "rank": 4,
                "name": "Low-Profile Buzz Cut",
                "description": "Short, uniform buzz or crew cut that keeps the overall profile compact.",
                "reason": "A clean, short cut doesn't add unnecessary volume anywhere — letting the striking cheekbones be the statement.",
                "benefit": "Confident and decisive. Actually shows off the angular diamond structure attractively.",
                "avoid_reason": None,
                "style_tip": "Go for a Grade 2-3 on the sides and 4 on top. Clean cheeks and neck line sharply.",
                "hair_color": "Natural. No highlights needed — the structure is striking enough.",
                "hair_color_avoid": None,
                "occasion": ["casual", "sports", "office"],
                "difficulty": "Easy",
                "emoji": "💈",
            },
            {
                "rank": 5,
                "name": "Beard at Chin Level (Medium)",
                "description": "Medium-length beard concentrated at the chin and jaw sides to add width.",
                "reason": "A beard at chin level adds visual mass to the narrow jaw of a diamond face.",
                "benefit": "Strategically widens the chin area, balancing the wide-cheekbone feature.",
                "avoid_reason": "Avoid clean-shaven looks — they expose the narrow chin in contrast to wide cheekbones.",
                "style_tip": "Keep beard fuller at the chin tip, keep cheeks tidy. The chin width is key.",
                "hair_color": "Natural beard color.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office", "date"],
                "difficulty": "Easy",
                "emoji": "🧔",
            },
        ],
        "female": [
            {
                "rank": 1,
                "name": "Side-Swept Bangs with Layered Long Hair",
                "description": "Long layered hair with bangs swept to the side, adding width at forehead and volume at jaw.",
                "reason": "Side sweep adds forehead width; long layers add jaw width. Both ends of diamond become wider — balance achieved.",
                "benefit": "Addresses both narrow points of the diamond face simultaneously.",
                "avoid_reason": "Avoid styles that expose both forehead and chin fully without framing.",
                "style_tip": "Focus layering at chin and jaw level specifically. Use round brush to push ends outward.",
                "hair_color": "Warm highlights at both bangs and ends (double balayage) maximizes the balancing effect.",
                "hair_color_avoid": None,
                "occasion": ["casual", "date", "office"],
                "difficulty": "Medium",
                "emoji": "🌺",
            },
            {
                "rank": 2,
                "name": "Chin-Length Bob with Volume",
                "description": "A bob ending exactly at the chin with maximum volume and outward flip at the ends.",
                "reason": "Volume at chin level adds width to the narrow jaw — the lower narrow point of the diamond.",
                "benefit": "Elegant and structured. Creates the widest point at chin level, which is exactly what's needed.",
                "avoid_reason": "Avoid very sleek, inward-curling ends — they narrow the chin even further.",
                "style_tip": "Use a large round brush to aggressively flip the ends outward. Hairspray to hold.",
                "hair_color": "Lighter, warm tones at the ends draw attention to the widened jaw area.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office", "date"],
                "difficulty": "Medium",
                "emoji": "👑",
            },
            {
                "rank": 3,
                "name": "Full Bangs (Straight Across)",
                "description": "Full fringe of straight-across bangs sitting above the eyebrows.",
                "reason": "Full bangs specifically add forehead width — the narrowest point on a diamond face.",
                "benefit": "Instantly widens the narrow forehead. Few hairstyles balance diamond faces as effectively as full bangs.",
                "avoid_reason": "Avoid exposing the full forehead — the contrast with wide cheekbones is stark.",
                "style_tip": "Keep bangs at eyebrow level. Too short looks harsh; too long reduces their widening effect.",
                "hair_color": "The bangs can be slightly lighter to maximize their forehead-widening effect.",
                "hair_color_avoid": None,
                "occasion": ["casual", "office"],
                "difficulty": "Easy",
                "emoji": "💎",
            },
            {
                "rank": 4,
                "name": "Voluminous Pixie",
                "description": "A short pixie cut with deliberate volume pushed outward at the temples.",
                "reason": "Volume at the temples adds width to the temple/forehead area without height.",
                "benefit": "Bold and dramatic choice that uses strategic volume exactly where diamond faces need it.",
                "avoid_reason": None,
                "style_tip": "Ask for the sides to be slightly longer with texture pushed outward at the temples.",
                "hair_color": "Vibrant color on a pixie is stunning. Try burgundy, deep plum or warm copper.",
                "hair_color_avoid": None,
                "occasion": ["casual", "creative", "party"],
                "difficulty": "Medium",
                "emoji": "✨",
            },
            {
                "rank": 5,
                "name": "Low Messy Bun with Face-Framing Pieces",
                "description": "A bun placed at the nape or low on the head, with 2-3 loose pieces framing the face.",
                "reason": "A LOW bun doesn't add height; face-framing pieces add width at both temples and jaw.",
                "benefit": "Casual-elegant. Low placement doesn't add height; face frames add the needed width at both ends.",
                "avoid_reason": "Avoid high buns — they add crown height and further emphasize cheekbone width from below.",
                "style_tip": "Let the bun be loose and textured. Pull out temple pieces and curl them gently.",
                "hair_color": None,
                "hair_color_avoid": None,
                "occasion": ["casual", "office", "date"],
                "difficulty": "Easy",
                "emoji": "🌸",
            },
        ],
    },
}


# ──────────────────────────────────────────────────────
# Face Shape Detector Class
# ──────────────────────────────────────────────────────

class FaceShapeDetector:
    """
    Detects face shape from MediaPipe 468-point facial landmarks.
    Uses geometric ratio analysis to classify into 6 shapes.
    """

    # Key landmark indices
    FOREHEAD_TOP    = 10    # Top of forehead
    CHIN_BOTTOM     = 152   # Bottom of chin
    RIGHT_TEMPLE    = 54    # Right temporal region
    LEFT_TEMPLE     = 284   # Left temporal region
    RIGHT_CHEEK     = 234   # Right zygomatic arch (widest cheek)
    LEFT_CHEEK      = 454   # Left zygomatic arch (widest cheek)
    RIGHT_JAW       = 172   # Right jaw angle
    LEFT_JAW        = 397   # Left jaw angle
    FOREHEAD_RIGHT  = 67    # Right forehead
    FOREHEAD_LEFT   = 297   # Left forehead
    NOSE_TIP        = 1     # Nose tip (reference)
    RIGHT_EAR       = 162   # Near right ear
    LEFT_EAR        = 389   # Near left ear

    def _dist(self, p1: Tuple[float, float], p2: Tuple[float, float]) -> float:
        """Euclidean distance between two 2D points."""
        return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)

    # ── Archetype Targets ──────────────────────────────
    # Based on standard facial morphology studies.
    # Format: [FaceRatio, ForeheadRatio, JawRatio]
    ARCHETYPES = {
        "oval":    [1.40, 0.85, 0.75],
        "round":   [1.10, 0.85, 0.85],
        "square":  [1.10, 0.95, 0.95],
        "heart":   [1.35, 0.98, 0.68],
        "diamond": [1.40, 0.72, 0.72],
        "oblong":  [1.70, 0.85, 0.75],
    }

    def _get_max_width(self, landmarks: Dict[int, Tuple[int, int]], point_pairs: List[Tuple[int, int]]) -> float:
        """Finds the maximum width across a set of landmark pairs."""
        max_w = 0.0
        for p1_idx, p2_idx in point_pairs:
            p1 = landmarks.get(p1_idx)
            p2 = landmarks.get(p2_idx)
            if p1 and p2:
                w = self._dist(p1, p2)
                if w > max_w: max_w = w
        return max_w

    def detect_shape(self, landmarks: Dict[int, Tuple[int, int]]) -> Dict:
        """
        Classify face shape using multi-point similarity scoring.
        Handles hair occlusion and head tilt by taking regional maximums.
        """
        try:
            # ── Regional Target Points ──────────────────────────
            FOREHEAD_PAIRS = [(54, 284), (103, 332), (67, 297), (109, 338)]
            CHEEK_PAIRS    = [(234, 454), (127, 356), (116, 345), (123, 352)]
            JAW_PAIRS      = [(172, 397), (136, 365), (150, 379), (149, 378), (176, 400)]
            
            fh_top = landmarks.get(self.FOREHEAD_TOP)
            ch_bot = landmarks.get(self.CHIN_BOTTOM)

            if not fh_top or not ch_bot:
                return self._fallback_result()

            # ── Step 1: Regional Measurements ──────────────────
            face_h  = self._dist(fh_top, ch_bot)
            fore_w  = self._get_max_width(landmarks, FOREHEAD_PAIRS)
            cheek_w = self._get_max_width(landmarks, CHEEK_PAIRS)
            jaw_w   = self._get_max_width(landmarks, JAW_PAIRS)
            
            # Sanity check widths (cheeks should generally be wide)
            if cheek_w < 10: return self._fallback_result()
            
            # Normalize zero forehead (occluded) to a conservative estimate rather than Oval default
            if fore_w < 1: fore_w = cheek_w * 0.82 

            # ── Step 2: Ratios ─────────────────────────────────
            face_r = face_h / cheek_w
            fore_r = fore_w / cheek_w
            jaw_r  = jaw_w / cheek_w
            var    = abs(fore_r - jaw_r)

            measurements = {
                "face_ratio": round(face_r, 3),
                "forehead_ratio": round(fore_r, 3),
                "jaw_ratio": round(jaw_r, 3),
                "width_variance": round(var, 3),
            }

            # ── Step 3: Fuzzy Classification Scorer ────────────
            # Target values optimized for the multi-point MAX approach
            # Square needs high JawRatio; Round needs low FaceRatio; Heart needs high ForeheadRatio
            ARCHS = {
                "oval":    [1.38, 0.85, 0.72],
                "round":   [1.08, 0.86, 0.86],
                "square":  [1.10, 0.96, 0.98],
                "heart":   [1.35, 1.02, 0.65],
                "diamond": [1.42, 0.72, 0.72],
                "oblong":  [1.70, 0.82, 0.72],
            }

            scores = {}
            user_vec = [face_r, fore_r, jaw_r]

            for shape_name, target in ARCHS.items():
                # Adjusted Weights:
                # v2 (Jaw Ratio) is critical for Square/Diamond/Heart: Weight 2.5
                # v1 (Forehead Ratio) is critical for Heart/Diamond/Square: Weight 1.5
                # v0 (Face Ratio) is critical for Round/Oblong: Weight 1.8
                dist = math.sqrt(
                    1.8 * (user_vec[0] - target[0])**2 +
                    1.2 * (user_vec[1] - target[1])**2 +
                    2.8 * (user_vec[2] - target[2])**2
                )
                conf = max(0, 1 - (dist / 0.65)) 
                
                # Dynamic Boost Logic 
                if shape_name == "square":
                    if jaw_r > 0.92 and face_r < 1.25: conf += 0.2
                elif shape_name == "round":
                    if face_r < 1.12 and jaw_r > 0.85: conf += 0.15
                elif shape_name == "heart":
                    if fore_r > 0.98 and jaw_r < 0.75: conf += 0.15
                elif shape_name == "diamond":
                    if fore_r < 0.80 and jaw_r < 0.80: conf += 0.15
                elif shape_name == "oblong":
                    if face_r > 1.6: conf += 0.2

                scores[shape_name] = round(min(1.0, conf), 3)

            # ── Step 4: Win Selection ──────────────────────────
            sorted_scores = sorted(scores.items(), key=lambda x: x[1], reverse=True)
            primary_shape, primary_conf = sorted_scores[0]
            
            secondary_traits = None
            if len(sorted_scores) > 1:
                sec_shape, sec_conf = sorted_scores[1]
                if sec_conf > 0.4 and (primary_conf - sec_conf) < 0.25:
                    secondary_traits = {
                        "shape": sec_shape,
                        "display": FACE_SHAPE_DATA[sec_shape]["display"],
                        "confidence": sec_conf
                    }

            print(f"[SHAPE v3] Primary: {primary_shape} ({primary_conf*100:.0f}%) | Traits: {secondary_traits['shape'] if secondary_traits else 'None'}")
            print(f"[SHAPE v3] Measurements: FR={face_r:.2f}, ForeR={fore_r:.2f}, JawR={jaw_r:.2f}")

            return {
                "shape": primary_shape,
                "confidence": primary_conf,
                "secondary": secondary_traits,
                "all_scores": dict(sorted_scores[:3]),
                "ratios": measurements,
                "data": FACE_SHAPE_DATA.get(primary_shape, FACE_SHAPE_DATA["oval"]),
            }

        except Exception as e:
            logger.error(f"Detection 3.0 error: {e}")
            import traceback
            traceback.print_exc()
            return self._fallback_result()

    def _fallback_result(self) -> Dict:
        """Safe fallback when data is noisy or landmarks missing."""
        return {
            "shape": "oval",
            "confidence": 0.5,
            "secondary": None,
            "ratios": {},
            "data": FACE_SHAPE_DATA["oval"],
            "fallback": True,
        }

    def get_hairstyle_recommendations(
        self,
        shape: str,
        gender: str,
        skin_tone: Optional[str] = None,
        texture: Optional[str] = None,
        limit: int = 5,
    ) -> List[Dict]:
        """
        Get hairstyle recommendations based on face shape and gender.

        Args:
            shape:      Detected face shape key (oval, round, square, etc.)
            gender:     'male' or 'female'
            skin_tone:  Optional skin tone (fair, light, medium, olive, brown, dark)
            texture:    Optional hair texture (straight, wavy, curly, coily)
            limit:      Max number of recommendations to return

        Returns:
            List of recommendation dicts
        """
        shape = shape.lower().strip()
        gender = "female" if gender.lower() in ("female", "f", "woman", "girl") else "male"

        shape_data = HAIRSTYLE_DATABASE.get(shape)
        if not shape_data:
            logger.warning(f"Unknown face shape '{shape}', falling back to oval")
            shape_data = HAIRSTYLE_DATABASE["oval"]

        recommendations = shape_data.get(gender, [])
        # Sort by rank and limit
        return sorted(recommendations, key=lambda r: r.get("rank", 99))[:limit]

    def get_beard_recommendations(
        self,
        shape: str,
        skin_tone: Optional[str] = None,
        limit: int = 3,
    ) -> List[Dict]:
        """
        Get beard style recommendations based on face shape.

        Args:
            shape:      Detected face shape key (oval, round, square, etc.)
            skin_tone:  Optional skin tone (fair, light, medium, olive, brown, dark)
            limit:      Max number of recommendations to return

        Returns:
            List of beard recommendation dicts
        """
        shape = shape.lower().strip()

        # Beard recommendations database
        BEARD_RECOMMENDATIONS = {
            "oval": [
                {
                    "name": "Full Beard",
                    "visual_hint": "full_beard",
                    "reason": "Your balanced oval face can carry any beard style. A full beard adds masculinity without overwhelming your features.",
                    "styling_tips": "Keep the neckline clean - 1 inch above the Adam's apple. Use beard oil daily.",
                    "maintenance": "Trim every 2 weeks using a 10-12mm guard."
                },
                {
                    "name": "Goatee",
                    "visual_hint": "goatee",
                    "reason": "A classic goatee highlights your natural chin definition and works perfectly with oval proportions.",
                    "styling_tips": "Shave cheeks and neck completely clean. Focus on a sharp circle around the mouth.",
                    "maintenance": "Daily shaving of surrounding areas is required to keep it sharp."
                },
                {
                    "name": "Heavy Stubble",
                    "visual_hint": "stubble",
                    "reason": "Light stubble adds texture and ruggedness while maintaining your clean, balanced look.",
                    "styling_tips": "Let it grow for 3-5 days. Use a trimmer on a 2-3mm setting.",
                    "maintenance": "Trim every 3 days. Moisturize skin to avoid itchiness."
                },
            ],
            "round": [
                {
                    "name": "Van Dyke",
                    "visual_hint": "van_dyke",
                    "reason": "The pointed shape of a Van Dyke adds angles to soften roundness and creates a more defined chin.",
                    "styling_tips": "Keep the mustache and chin beard disconnected. Point the chin beard slightly.",
                    "maintenance": "Requires precise trimming to keep the chin-mustache gap clean."
                },
                {
                    "name": "Garibaldi",
                    "visual_hint": "full_beard",
                    "reason": "A wide, rounded beard that is shorter at the bottom to elongate the face visually.",
                    "styling_tips": "Let it grow full but keep the bottom wide and flat to add structure.",
                    "maintenance": "Trim the bottom horizontally to maintain the square-ish silhouette."
                },
                {
                    "name": "Short Boxed Beard",
                    "visual_hint": "full_beard",
                    "reason": "Neat and trimmed close to the face to define the jawline without adding cheek width.",
                    "styling_tips": "Lower the cheek lines to expose more skin, making the face look longer.",
                    "maintenance": "Trim weekly on a 5-6mm setting."
                },
            ],
            "square": [
                {
                    "name": "Circle Beard",
                    "visual_hint": "goatee",
                    "reason": "The circular shape counterbalances your square angles, creating visual harmony.",
                    "styling_tips": "Ensure the mustache and chin beard connect in a smooth circle.",
                    "maintenance": "Weekly shaping to keep the circular curve soft."
                },
                {
                    "name": "Anchor Beard",
                    "visual_hint": "anchor",
                    "reason": "A pointed beard that traces the jawline, elongating the face and softening the square corners.",
                    "styling_tips": "The beard should follow the jawline and end in a point at the chin.",
                    "maintenance": "Daily maintenance to keep the 'anchor' shape distinct."
                },
                {
                    "name": "Royale Beard",
                    "visual_hint": "van_dyke",
                    "reason": "A mustache anchored by a chin strip. Minimalist and sharp.",
                    "styling_tips": "Keep the mustache and chin beard thin and elegant.",
                    "maintenance": "Precision trimming every 2 days."
                },
            ],
            "heart": [
                {
                    "name": "Full Beard (High Volume)",
                    "visual_hint": "full_beard",
                    "reason": "A fuller beard adds width to your narrow chin, balancing your wider forehead perfectly.",
                    "styling_tips": "Focus volume on the jaw sides, not just the chin.",
                    "maintenance": "Condition daily to keep the volume looking groomed."
                },
                {
                    "name": "Extended Goatee",
                    "visual_hint": "goatee",
                    "reason": "Adds mass to the chin and jaw while leaving cheeks clean, narrowing the top-bottom gap.",
                    "styling_tips": "Let the goatee extend along the jawline toward the ears.",
                    "maintenance": "Shave upper cheeks regularly."
                },
                {
                    "name": "Mutton Chops",
                    "visual_hint": "stubble",
                    "reason": "Mutton chops add volume at the jaw level, creating balance with your wider upper face.",
                    "styling_tips": "Keep the sideburns wide and connected to a mustache.",
                    "maintenance": "Shave the chin area daily to keep the chops distinct."
                },
            ],
            "oblong": [
                {
                    "name": "Short Boxed Beard (Wide)",
                    "visual_hint": "full_beard",
                    "reason": "A wider, horizontal beard adds width to your long face, creating better proportions.",
                    "styling_tips": "Keep the beard shorter at the chin than at the sides.",
                    "maintenance": "Trim the chin area 2mm shorter than the sideburns."
                },
                {
                    "name": "Stubble (Groomed)",
                    "visual_hint": "stubble",
                    "reason": "Well-maintained stubble adds horizontal texture without vertical length.",
                    "styling_tips": "Keep the neckline high to avoid elongating the face.",
                    "maintenance": "Trim to 3mm every other day."
                },
                {
                    "name": "Chevron Mustache",
                    "visual_hint": "van_dyke",
                    "reason": "A thick mustache draws focus horizontally across the face, breaking the vertical length.",
                    "styling_tips": "Grow the mustache thick and let it cover the top lip slightly.",
                    "maintenance": "Trim the edges to keep it within the mouth width."
                },
            ],
            "diamond": [
                {
                    "name": "Balbo Beard",
                    "visual_hint": "anchor",
                    "reason": "A beard with no sideburns and a floating mustache, emphasizing the chin and balancing wide cheekbones.",
                    "styling_tips": "Mustache should be disconnected from the beard.",
                    "maintenance": "Precision shaving of the sideburn/ear area is critical."
                },
                {
                    "name": "Full Beard (Rounded)",
                    "visual_hint": "full_beard",
                    "reason": "A rounded full beard softens your prominent cheekbones and widens the narrow jaw.",
                    "styling_tips": "Trim the cheeks slightly shorter than the jaw to emphasize the bottom width.",
                    "maintenance": "Brush downward and trim to a rounded shape."
                },
                {
                    "name": "Chin Strap + Mustache",
                    "visual_hint": "stubble",
                    "reason": "Minimalist lines that trace the jaw, adding definition where needed.",
                    "styling_tips": "Keep the strap very thin and precise along the jawbone.",
                    "maintenance": "Daily maintenance to prevent the strap from widening."
                },
            ],
        }

        recommendations = BEARD_RECOMMENDATIONS.get(shape, BEARD_RECOMMENDATIONS["oval"])
        return recommendations[:limit]


# ──────────────────────────────────────────────────────
# Singleton for use in main.py
# ──────────────────────────────────────────────────────
face_shape_detector = FaceShapeDetector()
