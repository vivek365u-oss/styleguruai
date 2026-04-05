# 🔑 Razorpay Setup Guide - PHASE 1.2

## Step 1: Get Your Razorpay API Keys

### Option A: Using Sandbox (TESTING)
1. Go to https://dashboard.razorpay.com/
2. Login with your Razorpay account
3. Click **Settings** → **API Keys**
4. You'll see two tabs: **Test** and **Live**
5. **STAY ON TEST TAB** for sandbox testing
6. Copy:
   - **Key ID** (looks like `rzp_test_XXXXXXXXXXXX`)
   - **Key Secret** (keep this secret!)

### Option B: Using Live (PRODUCTION)
- Switch to **Live** tab on same page
- Use live keys for real money processing
- Requires business verification

---

## Step 2: Add to Frontend (.env.local)

File: `frontend/.env.local`

```
REACT_APP_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
VITE_API_URL=http://localhost:8000
```

**Replace** `rzp_test_XXXXXXXXXXXX` with your actual test Key ID

---

## Step 3: Add to Backend (.env)

File: `Backend/.env`

```
RAZORPAY_KEY_SECRET=your_test_key_secret_here
FIREBASE_CREDENTIALS_JSON={}
SENTRY_DSN=
ENVIRONMENT=test
```

**Replace** `your_test_key_secret_here` with your actual test Key Secret

---

## Step 4: Verify Setup

### Frontend Check
```bash
cd frontend
npm run dev
# Should start without errors
# Check console for: "Razorpay Key ID loaded"
```

### Backend Check
```bash
cd Backend
python main.py
# Should show: "INFO: Uvicorn running on http://0.0.0.0:8000"
```

---

## Step 5: Test Payment Flow

### 1. Create Account
- Visit http://localhost:5173 (frontend)
- Sign up with email

### 2. Trigger Paywall
- Use color scanner 3 times (free analyses)
- On 3rd analysis, paywall modal should appear

### 3. Click "Upgrade Now"
- Select: **Monthly (₹59)** or **Yearly (₹499)**
- Click: **Upgrade Now with Razorpay**

### 4. Razorpay Sandbox Payment
Razorpay modal will open. Use test card:

| Field | Value |
|-------|-------|
| Card Number | `4111 1111 1111 1111` |
| Expiry | `12/25` |
| CVV | `123` |
| OTP | Any 6 digits (e.g., `123456`) |
| Email | Auto-filled |

### 5. Verify Success
- ✅ Payment modal closes
- ✅ Toast shows: "Upgrade successful!"
- ✅ Firestore document created: `users/{uid}/tier = "premium"`
- ✅ Next analysis is unlimited (no paywall)

---

## Troubleshooting

### Error: "Razorpay is not defined"
**Fix:** Check if `REACT_APP_RAZORPAY_KEY_ID` is set in `.env.local`
```bash
# Restart frontend
cd frontend
npm run dev
```

### Error: "Payment verification failed"
**Fix:** Check if `RAZORPAY_KEY_SECRET` is correct in `Backend/.env`
```bash
# Restart backend
python main.py
```

### Error: "Subscription activation failed"
**Check logs:**
- Frontend: Open DevTools (F12) → Console tab
- Backend: Check terminal output
- Firestore: Check `users/{uid}` document was created

### Payment Success but No Subscription?
1. Check Firestore: `users/{uid}` collection
2. Should have fields:
   - `tier: "premium"`
   - `premium_until: "2026-05-05T..."`
   - `payment_id: "pay_XXXXX"`
3. If missing, payment was successful but backend activation failed
   - Check backend logs for errors

---

## Production Setup

### For Vercel (Frontend)
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add:
   ```
   REACT_APP_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
   VITE_API_URL=https://your-backend.onrender.com
   ```

### For Render (Backend)
1. Go to https://dashboard.render.com
2. Select your service
3. Settings → Environment
4. Add:
   ```
   RAZORPAY_KEY_SECRET=your_live_key_secret
   ```
5. Deploy

---

## Useful Links

- 🔑 Razorpay Dashboard: https://dashboard.razorpay.com/
- 📖 Razorpay Docs: https://razorpay.com/docs/
- 🧪 Test Cards: https://razorpay.com/docs/development/sandbox/test-cards/
- 📊 Razorpay Payments Webhook: https://razorpay.com/docs/webhooks/

---

## Security Notes

⚠️ **NEVER commit .env files to Git!**

Check `.gitignore`:
```
.env
.env.local
.env.*.local
```

**If accidentally committed:**
```bash
git rm --cached .env
git commit -m "Remove .env from tracking"
```

Then regenerate your Razorpay keys in dashboard (they may be exposed).
