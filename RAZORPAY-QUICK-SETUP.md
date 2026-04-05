# ⚡ Quick Setup - Razorpay Testing

## You Need These 2 Things From Razorpay:

### 1. KEY ID (Frontend)
```
rzp_test_XXXXXXXXXXXX  ← Copy this
```

### 2. KEY SECRET (Backend)
```
your_secret_key_here  ← KEEP THIS SECRET
```

---

## Where to Get Them (2 Min)

1. Go: https://dashboard.razorpay.com/
2. Click: **Settings** → **API Keys**
3. Make sure you're on **TEST** tab (not Live)
4. Copy both values

---

## Where to Put Them

### Frontend
**File:** `frontend/.env.local`
```
REACT_APP_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
```

### Backend
**File:** `Backend/.env`
```
RAZORPAY_KEY_SECRET=your_test_key_secret_here
```

---

## Test Payment Card

When you click "Upgrade Now":
- **Card:** 4111 1111 1111 1111
- **Expiry:** 12/25
- **CVV:** 123
- **OTP:** 123456 (any 6 digits)

---

## After Setup

✅ Run locally to test paywall
✅ Test with sandbox card
✅ Verify Firestore subscription created
✅ Then we'll start PHASE 1.3 (Shopping Cart)

👉 Set these up and let me know when done!
