# PHASE 1.2 - Setup Guide

## Environment Variables Required

### Frontend (.env or .env.local)
```
REACT_APP_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXX
```

Get from: [Razorpay Dashboard](https://dashboard.razorpay.com/) → Settings → API Keys

### Backend (.env or set in Render)
```
RAZORPAY_KEY_SECRET=your_secret_key_here
```

## Testing Paywall Locally

### 1. Start Frontend
```bash
cd frontend
npm run dev
```

### 2. Start Backend
```bash
cd Backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

### 3. Test Free Tier (3 Analyses)
1. Create account
2. Run color analysis 3 times
3. After 3rd analysis, paywall should appear automatically

### 4. Test Payment (Sandbox)
Click "Upgrade Now" → Use Razorpay test card:
- Card: `4111 1111 1111 1111`
- Expiry: `12/25`
- CVV: `123`
- OTP: Any 6 digits

After payment:
- ✅ Modal closes
- ✅ `isPro` becomes `true`
- ✅ Unlimited analyses unlocked
- ✅ Firestore subscription created

## Firestore Structure Created

### Document Path
```
users/{uid}/
  - tier: "premium"
  - subscription_plan: "monthly" | "yearly"
  - premium_until: "2025-04-05T10:00:00Z"
  - payment_id: "pay_XXXXX"
  - activated_at: "2026-04-05T10:00:00Z"
```

## Flow Diagram

```
User completes 3rd analysis (free)
    ↓
handleAnalysisComplete() triggered
    ↓
count >= 3 && !isPro → setPaywallOpen(true)
    ↓
PaywallModal opens with:
  - Monthly: ₹59
  - Yearly: ₹499 (save 16%)
    ↓
User clicks "Upgrade Now"
    ↓
Razorpay modal opens
    ↓
User enters card details (test)
    ↓
Razorpay handler called with response
    ↓
POST /api/subscriptions/activate
    ↓
Backend verifies signature
    ↓
Saves to Firestore
    ↓
onUpgrade() → reload app
    ↓
PlanContext refreshes
    ↓
Premium unlocked! ✅
```

## Key Files Changed

1. **frontend/src/components/Dashboard.jsx**
   - Added paywall trigger after 3rd analysis
   - Check: `if (!isPro && count >= 3) setPaywallOpen(true)`

2. **frontend/src/components/PaywallModal.jsx**
   - Added plan selector (monthly/yearly)
   - Razorpay SDK integration
   - Dynamic pricing display
   - Payment handler + backend call

3. **frontend/src/components/PremiumFeatureGuard.jsx** (NEW)
   - Reusable wrapper for premium features
   - Shows lock overlay + upgrade button

4. **Backend/main.py**
   - New endpoint: `POST /api/subscriptions/activate`
   - Razorpay signature verification
   - Firestore subscription creation

## Next Steps (PHASE 1.3)

- [ ] Shopping cart component
- [ ] Link products to recommendations
- [ ] Track sales for affiliate commission (4%)
- [ ] Admin dashboard for revenue tracking
