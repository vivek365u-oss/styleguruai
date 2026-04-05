import os
import json
import random
from typing import Optional

try:
    from pywebpush import webpush, WebPushException
    WEBPUSH_AVAILABLE = True
except ImportError:
    WEBPUSH_AVAILABLE = False

# ── Tip Pool ─────────────────────────────────────────────────
# Each tip has: text, skin_tones (list or "all"), color_seasons (list or "all")
TIPS_POOL = [
    # Generic tips (all skin tones, all seasons)
    {"text": "Navy blue suits warm undertones perfectly — try it for your next outfit! 👔", "skin_tones": "all", "color_seasons": "all"},
    {"text": "White sneakers go with everything — the most versatile footwear you can own. 👟", "skin_tones": "all", "color_seasons": "all"},
    {"text": "Fit matters more than color — a well-fitted outfit always wins. ✨", "skin_tones": "all", "color_seasons": "all"},
    {"text": "Coord sets are trending — pick a color that matches your skin tone for max impact. 👗", "skin_tones": "all", "color_seasons": "all"},
    {"text": "Wear your best color near your face — it draws attention to your features. 🎨", "skin_tones": "all", "color_seasons": "all"},
    {"text": "For festive occasions, always go one shade bolder than your usual choice. 🎉", "skin_tones": "all", "color_seasons": "all"},
    {"text": "Oversized fits look best when you balance with fitted bottoms. 👕", "skin_tones": "all", "color_seasons": "all"},
    # Fair/Light skin tips
    {"text": "Jewel tones like emerald, sapphire, and ruby look stunning on fair skin! 💎", "skin_tones": ["fair", "light"], "color_seasons": "all"},
    {"text": "Avoid head-to-toe light colors — add one dark piece for contrast. 🌑", "skin_tones": ["fair", "light"], "color_seasons": "all"},
    {"text": "Burgundy and forest green are your power colors this season. 🍷", "skin_tones": ["fair", "light"], "color_seasons": ["Autumn", "Winter"]},
    # Medium/Olive skin tips
    {"text": "Earth tones like olive, rust, and mustard are your secret weapon! 🌿", "skin_tones": ["medium", "olive"], "color_seasons": "all"},
    {"text": "You have the most versatile skin tone — most colors work for you! 🎨", "skin_tones": ["medium", "olive"], "color_seasons": "all"},
    {"text": "Contrast is your friend — pair light shirts with dark pants or vice versa. ⚡", "skin_tones": ["medium", "olive"], "color_seasons": "all"},
    {"text": "Terracotta and coral are perfect for your warm undertones this season. 🧡", "skin_tones": ["medium", "olive"], "color_seasons": ["Spring", "Autumn"]},
    # Brown/Dark skin tips
    {"text": "Bold, bright colors look AMAZING on you — don't be afraid of them! 🌟", "skin_tones": ["brown", "dark"], "color_seasons": "all"},
    {"text": "White is your power color — always have multiple white shirts/tees. 🤍", "skin_tones": ["brown", "dark"], "color_seasons": "all"},
    {"text": "Bright yellow and coral look incredible on dark skin tones. ☀️", "skin_tones": ["brown", "dark"], "color_seasons": ["Spring", "Summer"]},
    {"text": "Gold jewellery enhances your skin tone beautifully — embrace it! ✨", "skin_tones": ["brown", "dark"], "color_seasons": "all"},
    # Seasonal tips
    {"text": "In summer, light pastels keep you cool and stylish at the same time. ☀️", "skin_tones": "all", "color_seasons": ["Summer"]},
    {"text": "For ethnic wear, jewel tones like deep red and emerald are universally flattering. 🪷", "skin_tones": "all", "color_seasons": ["Autumn", "Winter"]},
    {"text": "A dupatta in a contrasting color can completely transform a simple outfit. 🧣", "skin_tones": "all", "color_seasons": "all"},
    {"text": "Match your lip color to your undertone — warm tones suit coral, cool tones suit berry. 💄", "skin_tones": "all", "color_seasons": "all"},
]

GENERIC_TIPS = [t for t in TIPS_POOL if t["skin_tones"] == "all"]


class PushService:
    def __init__(self, vapid_private_key: str, vapid_public_key: str, vapid_claims_email: str):
        self.vapid_private_key = vapid_private_key
        self.vapid_public_key = vapid_public_key
        self.vapid_claims = {"sub": f"mailto:{vapid_claims_email}"}

    def get_tip_for_user(self, skin_tone: Optional[str], color_season: Optional[str]) -> str:
        """Select a personalized tip. Falls back to generic if no match or no profile."""
        if not skin_tone:
            return random.choice(GENERIC_TIPS)["text"]

        # Filter tips matching skin_tone and color_season
        matching = []
        for tip in TIPS_POOL:
            tone_match = tip["skin_tones"] == "all" or (isinstance(tip["skin_tones"], list) and skin_tone in tip["skin_tones"])
            season_match = tip["color_seasons"] == "all" or (isinstance(tip["color_seasons"], list) and color_season in tip["color_seasons"])
            if tone_match and season_match:
                matching.append(tip)

        if not matching:
            matching = GENERIC_TIPS

        return random.choice(matching)["text"]

    def send_notification(self, subscription_info: dict, payload: dict) -> bool:
        """Send a push notification. Returns True on success, False on failure."""
        if not WEBPUSH_AVAILABLE:
            print("pywebpush not available — skipping push notification")
            return False
        try:
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(payload),
                vapid_private_key=self.vapid_private_key,
                vapid_claims=self.vapid_claims,
            )
            return True
        except WebPushException as e:
            status_code = e.response.status_code if e.response else None
            print(f"WebPushException: {e}, status={status_code}")
            raise
        except Exception as e:
            print(f"Push notification error: {e}")
            return False

    def _delete_stale_subscription(self, db, uid: str, sub_id: str):
        """Delete a stale push subscription from Firestore."""
        try:
            db.collection("users").document(uid).collection("push_subscriptions").document(sub_id).delete()
            print(f"Deleted stale subscription {sub_id} for user {uid}")
        except Exception as e:
            print(f"Failed to delete stale subscription: {e}")

    def send_weekly_tips(self, db) -> dict:
        """Send weekly tips to all subscribed users. Returns counts."""
        sent = 0
        failed = 0
        deleted = 0

        try:
            # Get all users
            users_ref = db.collection("users").stream()
            for user_doc in users_ref:
                uid = user_doc.id
                try:
                    subs_ref = db.collection("users").document(uid).collection("push_subscriptions").stream()
                    for sub_doc in subs_ref:
                        sub_data = sub_doc.to_dict()
                        sub_id = sub_doc.id

                        skin_tone = sub_data.get("skin_tone")
                        color_season = sub_data.get("color_season")
                        tip_text = self.get_tip_for_user(skin_tone, color_season)

                        subscription_info = {
                            "endpoint": sub_data["endpoint"],
                            "keys": sub_data.get("keys", {}),
                        }
                        payload = {
                            "title": "StyleGuru AI 🎨",
                            "body": tip_text,
                            "icon": "/favicon.svg",
                            "data": {"url": "/dashboard"},
                        }

                        try:
                            self.send_notification(subscription_info, payload)
                            sent += 1
                        except Exception as e:
                            status_code = None
                            if hasattr(e, 'response') and e.response is not None:
                                status_code = e.response.status_code
                            if status_code in (410, 404):
                                self._delete_stale_subscription(db, uid, sub_id)
                                deleted += 1
                            else:
                                failed += 1
                except Exception as e:
                    print(f"Error processing user {uid}: {e}")
                    failed += 1
        except Exception as e:
            print(f"send_weekly_tips error: {e}")

        return {"sent": sent, "failed": failed, "deleted": deleted}
