# Deployment & Testing Guide: Pricing Fix

## Quick Summary of Changes

### Files Modified:
1. **Backend/main.py** 
   - ✅ Added plan validation in create-checkout endpoint
   - ✅ Added detailed logging for all payment events
   - ✅ Enhanced activate endpoint logging

2. **frontend/src/components/PaywallModal.jsx**
   - ✅ Redesigned tab switcher with clearer visual distinction
   - ✅ Added prominent amount confirmation badge
   - ✅ Made "ONE-TIME" vs "SUBSCRIPTION" crystal clear

3. **frontend/src/components/PlansUpgradeScreen.jsx**
   - ✅ Already had correct pricing (₹59 for monthly)

4. **New File: fix_pricing_firestore.py**
   - ✅ Audit script for Firestore pricing records
   - ✅ Fix script for corrupted data
   - ✅ Verify script for confirmation

---

## Phase 1: Local Testing (Before Deployment)

### Step 1: Test Backend Logging
```bash
# Test the create-checkout endpoint
curl -X POST http://localhost:8000/api/subscriptions/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"plan": "monthly"}'

# Expected response:
# {
#   "success": true,
#   "order_id": "order_...",
#   "amount": 5900,
#   "plan_type": "subscription",
#   "amount_rupees": 59
# }

# Check backend logs - should show:
# [PAYMENT] ℹ️ Request | User: uid_... | Plan: monthly (subscription) | Amount: ₹59
# [PAYMENT] ✅ Order Created | Order ID: order_... | Amount: ₹59 | Plan: monthly
```

### Step 2: Test Frontend UI Changes
```bash
# Start frontend dev server
cd frontend
npm run dev

# In browser:
# 1. Open PaywallModal
# 2. Verify clear distinction between:
#    - 🪙 ONE-TIME COINS (left tab - amber color)
#    - 👑 SUBSCRIPTION (right tab - purple color)
#
# 3. Click on "Monthly" subscription
# 4. Verify amount confirmation badge shows:
#    ✓ You will pay: ₹59
#    👑 Auto-renews monthly
#
# 5. Click on "25 Coins"
# 6. Verify amount confirmation badge shows:
#    ✓ You will pay: ₹49
#    🪙 One-time coin purchase
```

### Step 3: Test with Invalid Plan
```bash
# Should fail with validation error
curl -X POST http://localhost:8000/api/subscriptions/create-checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"plan": "invalid_plan"}'

# Expected:
# {
#   "detail": "Invalid plan: invalid_plan. Must be one of ['weekly', 'monthly', 'yearly', 'coins_10', 'coins_25']"
# }

# Check logs:
# [PAYMENT] ❌ Invalid plan received: invalid_plan
```

### Step 4: Test Payment Flow End-to-End
```bash
# On test account/with test Razorpay keys:
# 1. Try paying for Monthly subscription (₹59)
# 2. Check backend logs for complete trace:
#    [PAYMENT] ℹ️ Request | User: uid_... | Plan: monthly (subscription) | Amount: ₹59
#    [PAYMENT] ✅ Order Created | Order ID: order_... | Amount: ₹59 | Plan: monthly
#    [PAYMENT] ℹ️ Activation Request | User: uid_... | Payment: pay_...
#    [PAYMENT] ✅ Subscription Successfully | User: uid_... | Plan: monthly | Days: 30 | Until: 2024-XX-XX
#
# 3. Verify Razorpay dashboard shows ₹59 charge
# 4. Try paying for 25 Coins (₹49)
# 5. Verify logs show ₹49
# 6. Verify Razorpay shows ₹49
```

---

## Phase 2: Staging Deployment

### Step 1: Deploy Backend Changes
```bash
# Commit changes
git add Backend/main.py fix_pricing_firestore.py
git commit -m "fix: Add pricing validation and comprehensive payment logging"

# Deploy to staging
git push origin main  # or your staging branch

# Monitor staging logs for 10 payments minimum
# Ensure all show correct amounts and plan types
```

### Step 2: Deploy Frontend Changes
```bash
# Commit frontend changes
git add frontend/src/components/PaywallModal.jsx
git commit -m "fix: Improve UI clarity between coins and subscriptions"

# Deploy to staging
npm run build
# Deploy dist/ folder to staging environment
```

### Step 3: Create Test Cases in Staging
```bash
Test Plan (₹59 Monthly):
✓ Select Monthly subscription
✓ Verify UI shows ₹59
✓ Verify confirmation badge shows ₹59 & subscription details
✓ Process payment
✓ Log shows amount: 5900 paise (₹59)
✓ Payment success confirms plan type

Test Plan (₹49 Coins):
✓ Switch to Coins tab  
✓ Select 25 Coins
✓ Verify UI clearly shows ₹49 on COINS tab (not subscription tab)
✓ Verify confirmation badge shows ₹49 & one-time details
✓ Process payment
✓ Log shows amount: 4900 paise (₹49)
✓ Payment success confirms coins_25

Test Plan (Other Plans):
✓ Test weekly (₹29)
✓ Test yearly (₹499)
✓ Test coins_10 (₹29)
✓ All should show correct amounts
```

### Step 4: Run Firestore Audit in Staging
```bash
# Before running migration, just audit
python fix_pricing_firestore.py
# Select option: 1 (Audit)

# This will:
# - Scan all user subscriptions
# - Report how many are correct vs have issues
# - Show exact amounts for any mismatches

# Example output:
# 📊 Audit Results (1,245 users scanned):
#    ✅ OK: 1,240
#    ⚠️  Wrong price: 5
#    ⚠️  Invalid plan: 0
#    ⚠️  Missing plan: 0
#
# This tells you how many users were affected
```

### Step 5: Stakeholder Review in Staging
- ✅ QA team tests payment flow
- ✅ Confirm UI changes are clear
- ✅ Review logs for accuracy
- ✅ 48-hour monitoring period
- ✅ Check Razorpay transactions match logs

---

## Phase 3: Production Deployment

### Pre-Deployment Checklist
- [ ] All staging tests pass
- [ ] Backend logging working correctly
- [ ] Frontend UI changes tested
- [ ] Firestore audit completed (if needed)
- [ ] Customer communication templates prepared
- [ ] Support team briefed on changes

### Deployment Steps

**Step 1: Deploy Backend (Critical Path)**
```bash
# Deploy Backend/main.py
# This adds validation & logging ONLY - no payment behavior changes

# Post-deployment verification:
# 1. Check backend logs for new [PAYMENT] prefixed messages
# 2. Process one test payment
# 3. Verify logs show: Request → Order Created → Activation Request → Success
# 4. Monitor error logs for any issues
```

**Step 2: Deploy Frontend (Safe - UI Only)**
```bash
# Deploy updated PaywallModal.jsx
# This improves UI clarity - purely visual, no functional changes

# Post-deployment verification:
# 1. Clear browser cache
# 2. Open PaywallModal
# 3. Verify clear visual distinction between tabs
# 4. Verify amount confirmation badge displays

# Rollback if needed: Revert to previous PaywallModal.jsx
```

**Step 3: Monitor Phase (48 hours)**
```bash
# Watch these metrics:
# - Payment success rate (should be 100%)
# - Payment amounts (should always be ₹29, ₹49, ₹59, or ₹499)
# - Logs show correct plan types and amounts
# - No user complaints about wrong charges
# - Razorpay transaction amounts match backend logs

# Commands to monitor:
# Backend logs (using your logging platform):
grep "[PAYMENT]" /var/logs/tonfit-backend.log | grep "₹49.*monthly"
# Should return 0 results (no monthly subscriptions being charged ₹49)

# Check for errors:
grep "[PAYMENT] ❌" /var/logs/tonfit-backend.log
# Should be rare and specific errors only
```

---

## Phase 4: Post-Deployment Actions

### Option A: If No Issues Found (Expected ✅)
```bash
# After 48 hours with 0 complaints about ₹49:

# 1. Send positive communication to users
# 2. Run Firestore audit to identify affected users (if any)
# 3. Create compensation plan for any users who were charged ₹49 by mistake

# Check affected users:
python fix_pricing_firestore.py
# Select option: 1 (Audit)
# Review results
```

### Option B: If Issues Found (Unlikely)
```bash
# Immediate action steps:

# 1. If wrong amounts still showing:
#    → Check Razorpay API key configuration
#    → Restart backend service
#    → Check for cached responses

# 2. If UI issues persist:
#    → Clear frontend cache
#    → Hard refresh (Ctrl+Shift+R)
#    → Clear service worker

# 3. If some users still charged wrong amount:
#    → Check Firestore for override pricing
#    → Run: python fix_pricing_firestore.py (option 2)
#    → Review logs for which plan was actually sent
```

### Option C: Fix Corrupted Firestore Data (If Audit Shows Issues)
```bash
# ONLY run after audit confirms issues
python fix_pricing_firestore.py

# Select option: 2 (Fix)
# Will prompt: "Fix N pricing issues? (yes/no)"
# Type: yes

# Output will show:
# ✅ Fixed user1: monthly ₹49 → ₹59
# ✅ Fixed user2: monthly ₹49 → ₹59
# ... etc

# Then verify:
python fix_pricing_firestore.py
# Select option: 3 (Verify)
# Should show: ✅ All pricing is now correct!
```

---

## Communication Templates

### To Users (Via In-App Message)
```
📢 Good News: Payment System Enhanced

We've improved our payment interface to make it crystal clear 
what you're purchasing:

🪙 ONE-TIME COINS (₹49 for 25 coins - one time purchase)
👑 MONTHLY SUBSCRIPTION (₹59/month - auto-renews)

These are now clearly separated to prevent any confusion.

If you accidentally purchased coins instead of a subscription 
and would like to switch, please contact support!
```

### To Support Team
```
⚠️ IMPORTANT: Pricing System Update

Changes made:
✅ Clear visual distinction between coins and subscriptions
✅ Amount confirmation badge before payment
✅ Comprehensive logging of all payments

User issues to watch for:
❌ Users claiming they paid ₹49 for monthly (₹49 is coins_25 only)
❌ Users confused about coins vs subscription

How to help:
1. Ask if they see "🪙 ONE-TIME COINS" tab or "👑 SUBSCRIPTION" tab
2. Check their last payment in Razorpay (should match the tab they selected)
3. If wrong amount charged:
   - Note their user ID and payment ID
   - Flag for management review
   - Offer refund + free month as goodwill

Contact engineering if multiple users report same issue.
```

### To Management
```
PRICING INCONSISTENCY FIX - DEPLOYMENT COMPLETE

Problem: Users reported ₹49 charge while UI displayed ₹59 for monthly subscription
Root Cause: ₹49 is actually for "coins_25" (one-time purchase), not monthly subscription
             UI didn't clearly distinguish between the two

Solution Implemented:
✅ Backend: Validation & comprehensive logging added
✅ Frontend: Visual clarity enhancement (tab redesign + confirmation badge)
✅ Monitoring: 2 new scripts for audit/fix/verify

Expected Outcome:
- Zero confusion between coins and subscriptions
- Full ability to debug any future payment issues
- Complete audit trail of all payments
- Can identify and compensate any users who were charged wrong amount

Rollout Status:
✅ Deployed to staging (verified)
✅ Deployed to production  
✅ Monitoring for 48 hours (no issues if green light)
```

---

## Emergency Rollback Plan

If major issues discovered:

```bash
# Quick Rollback
git revert <commit_hash>  # Revert the payment changes
npm run build
# Redeploy

# Note: Logging changes are safe to keep (info collection only)
# Only revert UI changes if critical issues
```

---

## Success Criteria

✅ **Phase Complete when:**
1. All test payments show correct amounts in logs
2. No user complaints about ₹49 monthly subscription charge
3. Razorpay transactions match logged/displayed amounts
4. UI clearly distinguishes coins from subscriptions
5. 48-hour monitoring shows 0 pricing mismatches
6. Firestore audit shows no corruption

✅ **Expected Timeline:**
- Phase 1 (Testing): 2-4 hours
- Phase 2 (Staging): 24-48 hours
- Phase 3 (Production): 48-72 hours
- Phase 4 (Verification): Ongoing

---

## Questions or Issues?

Review these files:
- `/PRICING_MISMATCH_FIX.md` - Technical details
- This file - Deployment guide
- Backend logs - `[PAYMENT]` tagged messages
- Frontend console - Payment flow debug info

Contact: Check Slack #engineering-payments or create GitHub issue
