# 🔧 Payment Flow Debugging Guide

## Issue: Nothing Happens When Clicking "Upgrade Now"

### Step 1: Check Frontend Console
Press `F12` in browser → **Console tab**

Look for logs starting with `[Payment]`:
- ✅ `[Payment] Processing payment response...` = Handler fired
- ✅ `[Payment] ✅ Subscription activated:` = Success
- ❌ `[Payment] ❌ Error:` = Backend returned error

### Step 2: Check If Razorpay Script Loaded
In Console, type:
```javascript
window.Razorpay
```

Should show: `ƒ Razorpay(options)` (a function)

If `undefined` → Razorpay script didn't load

**Fix:**
```bash
# Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
# Or restart: npm run dev
```

### Step 3: Check Razorpay Key
In Console, type:
```javascript
import.meta.env.VITE_API_URL
process.env.REACT_APP_RAZORPAY_KEY_ID
```

Should show your key (not undefined)

If undefined:
- Check `frontend/.env.local` exists
- Has `REACT_APP_RAZORPAY_KEY_ID=rzp_test_XXXX`

### Step 4: Check Network Request
1. Open DevTools → **Network tab**
2. Click "Upgrade Now"
3. Look for request to `/api/subscriptions/activate`
   - Should show as **POST**
   - Status: **200** (success) or **4xx/5xx** (error)

**If request NOT in list:**
- Razorpay modal didn't open
- Check [Payment] logs for errors

**If request shows error:**
- 400: Check Razorpay signature
- 500: Backend misconfigured
- Click request → **Response tab** for error details

### Step 5: Check Backend Logs
If running locally:
```bash
cd Backend
python main.py
# Watch terminal output
```

When payment is submitted, should see:
```
[Payment] Processing payment response...
POST /api/subscriptions/activate
Subscription activation error: ...
```

---

## Common Issues & Fixes

### Issue 1: "Razorpay is not defined"
**Error in Console:**
```
RazorpayError: Razorpay is not defined
```

**Fix:**
- Hard refresh browser (Ctrl+Shift+R)
- Wait 2-3 seconds for Razorpay script to load
- Check CDN: https://checkout.razorpay.com/v1/checkout.js

### Issue 2: "API call returns 404"
**Network tab shows:** `POST /api/subscriptions/activate 404`

**Fix:**
- Check `VITE_API_URL` in frontend/.env.local
- Should be: `http://localhost:8000` (dev) or your backend URL
- Verify backend is running: `http://localhost:8000/health`

### Issue 3: "Payment verification failed"
**Network response:**
```json
{"detail": "Payment verification failed"}
```

**Fix:**
- Check `RAZORPAY_KEY_SECRET` in Backend/.env
- Must match your Razorpay account (test or live)
- Not working? Regenerate keys in dashboard

### Issue 4: "Subscription activation failed"
**Network response:**
```json
{"detail": "Subscription activation failed"}
```

**Fix:**
- Check backend logs for exact error
- Common: Firebase not configured
- Check `FIREBASE_CREDENTIALS_JSON` in Backend/.env

---

## Complete Debugging Checklist

- [ ] Frontend console shows [Payment] logs
- [ ] window.Razorpay is defined
- [ ] REACT_APP_RAZORPAY_KEY_ID is set
- [ ] Network tab shows POST to /api/subscriptions/activate
- [ ] Response status is 200 or 4xx (not "pending")
- [ ] Backend logs show endpoint was called
- [ ] RAZORPAY_KEY_SECRET is set in Backend
- [ ] Firestore document created: users/{uid} with tier="premium"

---

## What Should Happen

**Step-by-step success flow:**

1. Click "Upgrade Now"
   ```
   Console: [Payment] Processing payment response...
   ```

2. Razorpay modal opens with checkout form

3. Enter test card: `4111 1111 1111 1111`

4. Backend processes payment
   ```
   Console: [Payment] ✅ Subscription activated: {...}
   Network: Status 200
   ```

5. Modal closes, page reloads

6. ✅ Premium badge shows in header

7. ✅ Firestore: users/{uid}/tier = "premium"

---

## Need More Help?

**Check these files:**
- Frontend API config: `frontend/src/api/styleApi.js`
- Backend endpoint: `Backend/main.py` (line 780+)
- Environment: `frontend/.env.local` & `Backend/.env`
- Logs: Browser console (F12) + Backend terminal

**Still stuck?** Share:
1. Console error message (exact text)
2. Network response body
3. Backend error logs
