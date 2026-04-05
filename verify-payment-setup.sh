#!/bin/bash
# Quick verification script for payment flow setup

echo "🔍 StyleGuru Payment Flow Verification"
echo "========================================"
echo ""

# Check frontend .env
echo "1. Frontend Environment:"
if [ -f "frontend/.env.local" ]; then
    if grep -q "REACT_APP_RAZORPAY_KEY_ID" frontend/.env.local; then
        echo "✅ REACT_APP_RAZORPAY_KEY_ID is set"
        KEY=$(grep "REACT_APP_RAZORPAY_KEY_ID" frontend/.env.local | cut -d'=' -f2)
        if [[ $KEY == rzp_* ]]; then
            echo "   Format: $KEY"
        else
            echo "   ⚠️  Format looks wrong: $KEY"
        fi
    else
        echo "❌ REACT_APP_RAZORPAY_KEY_ID not found in frontend/.env.local"
    fi
else
    echo "❌ frontend/.env.local does not exist"
fi
echo ""

# Check backend .env
echo "2. Backend Environment:"
if [ -f "Backend/.env" ]; then
    if grep -q "RAZORPAY_KEY_SECRET" Backend/.env; then
        echo "✅ RAZORPAY_KEY_SECRET is set"
        SECRET=$(grep "RAZORPAY_KEY_SECRET" Backend/.env | cut -d'=' -f2)
        if [[ $SECRET == ENTER_* ]] || [[ -z "$SECRET" ]]; then
            echo "   ⚠️  Still has placeholder value"
        else
            echo "   ✅ Has value (hidden for security)"
        fi
    else
        echo "❌ RAZORPAY_KEY_SECRET not found in Backend/.env"
    fi
else
    echo "❌ Backend/.env does not exist"
fi
echo ""

# Check if services are running
echo "3. Services Status:"
echo "   Frontend: npm run dev (check terminal)"
echo "   Backend: python main.py (check terminal)"
echo ""

# Check API connectivity
echo "4. API Test:"
echo "   Testing backend health..."
curl -s http://localhost:8000/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend is reachable at http://localhost:8000"
else
    echo "❌ Backend is NOT reachable"
    echo "   Run: cd Backend && python main.py"
fi
echo ""

# Check files exist
echo "5. Core Files:"
[ -f "frontend/src/components/PaywallModal.jsx" ] && echo "✅ PaywallModal.jsx exists" || echo "❌ PaywallModal.jsx missing"
[ -f "Backend/main.py" ] && echo "✅ Backend/main.py exists" || echo "❌ Backend/main.py missing"
[ -f "frontend/src/api/styleApi.js" ] && echo "✅ styleApi.js exists" || echo "❌ styleApi.js missing"
echo ""

echo "✨ Verification complete!"
echo ""
echo "Next steps:"
echo "1. If any ❌ items, fix them"
echo "2. Hard refresh browser: Ctrl+Shift+R"
echo "3. Create 3 analyses to trigger paywall"
echo "4. Click 'Upgrade Now' and check browser console (F12)"
