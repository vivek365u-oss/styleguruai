#!/usr/bin/env python3
"""
Pricing Audit & Firestore Migration Script
IMPORTANT: Run this ONLY once after deploying the pricing fix
This script audits and fixes any corrupted subscription pricing in Firestore

Usage:
    python fix_pricing_firestore.py
"""

import firebase_admin
from firebase_admin import firestore, credentials
from datetime import datetime
import os
import sys
from pathlib import Path

# Correct pricing reference
CORRECT_PRICES = {
    'weekly': 2900,
    'monthly': 5900,
    'yearly': 49900,
    'coins_10': 2900,
    'coins_25': 4900
}

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    try:
        # Look for serviceAccountKey.json
        cred_path = None
        
        # Check common locations
        possible_paths = [
            'serviceAccountKey.json',
            Path.home() / '.firebase' / 'serviceAccountKey.json',
            Path(__file__).parent / 'serviceAccountKey.json',
        ]
        
        for path in possible_paths:
            if Path(path).exists():
                cred_path = path
                break
        
        if not cred_path:
            print("❌ serviceAccountKey.json not found!")
            print("   Place it in one of these locations:")
            for path in possible_paths:
                print(f"     - {path}")
            sys.exit(1)
        
        cred = credentials.Certificate(str(cred_path))
        firebase_admin.initialize_app(cred)
        print(f"✅ Firebase initialized with: {cred_path}")
    except Exception as e:
        print(f"❌ Failed to initialize Firebase: {e}")
        sys.exit(1)

def audit_user_subscriptions():
    """Audit all user subscription records and report issues"""
    db = firestore.client()
    
    print("\n" + "="*60)
    print("AUDIT: Scanning user subscription records...")
    print("="*60)
    
    issues = {
        'wrong_price': [],
        'invalid_plan': [],
        'missing_plan': [],
        'ok': []
    }
    
    try:
        users = db.collection('users').stream()
        user_count = 0
        
        for user_doc in users:
            user_id = user_doc.id
            user_data = user_doc.to_dict()
            
            if not user_data:
                continue
            
            user_count += 1
            
            # Check subscription
            subscription = user_data.get('subscription', {})
            
            if not subscription:
                # No subscription
                continue
            
            plan = subscription.get('plan')
            stored_amount = subscription.get('amount')
            
            if not plan:
                issues['missing_plan'].append({
                    'user_id': user_id,
                    'stored_amount': stored_amount
                })
                continue
            
            if plan not in CORRECT_PRICES:
                issues['invalid_plan'].append({
                    'user_id': user_id,
                    'plan': plan,
                    'stored_amount': stored_amount
                })
                continue
            
            expected_amount = CORRECT_PRICES[plan]
            
            if stored_amount != expected_amount:
                issues['wrong_price'].append({
                    'user_id': user_id,
                    'plan': plan,
                    'expected': expected_amount,
                    'actual': stored_amount,
                    'rupees': f"₹{stored_amount/100 if stored_amount else 0}"
                })
            else:
                issues['ok'].append(user_id)
        
        print(f"\n📊 Audit Results ({user_count} users scanned):")
        print(f"   ✅ OK: {len(issues['ok'])}")
        print(f"   ⚠️  Wrong price: {len(issues['wrong_price'])}")
        print(f"   ⚠️  Invalid plan: {len(issues['invalid_plan'])}")
        print(f"   ⚠️  Missing plan: {len(issues['missing_plan'])}")
        
        if issues['wrong_price']:
            print(f"\n🔴 PRICING ISSUES FOUND:")
            for issue in issues['wrong_price'][:5]:  # Show first 5
                print(f"   User: {issue['user_id']}")
                print(f"     Plan: {issue['plan']}")
                print(f"     Expected: {issue['expected']} paise (₹{issue['expected']/100})")
                print(f"     Actual: {issue['actual']} paise ({issue['rupees']})")
                print()
            
            if len(issues['wrong_price']) > 5:
                print(f"   ... and {len(issues['wrong_price']) - 5} more\n")
        
        return issues
        
    except Exception as e:
        print(f"❌ Audit error: {e}")
        return None

def fix_user_subscriptions():
    """Fix all identified pricing issues in Firestore"""
    db = firestore.client()
    
    print("\n" + "="*60)
    print("FIX: Correcting subscription prices...")
    print("="*60)
    
    issues = audit_user_subscriptions()
    
    if not issues or not issues['wrong_price']:
        print("\n✅ No pricing issues found to fix!")
        return 0
    
    wrong_count = len(issues['wrong_price'])
    print(f"\n⚠️  Found {wrong_count} records to fix")
    
    # Confirm before fixing
    confirm = input(f"\n🔧 Fix {wrong_count} pricing issues? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("❌ Cancelled.")
        return 0
    
    fixed_count = 0
    error_count = 0
    
    for issue in issues['wrong_price']:
        try:
            user_id = issue['user_id']
            plan = issue['plan']
            expected_amount = issue['expected']
            actual_amount = issue['actual']
            
            # Update the subscription
            user_ref = db.collection('users').document(user_id)
            user_ref.update({
                'subscription.amount': expected_amount,
                'subscription.fixed_at': datetime.now(),
                'subscription.fix_note': f'Pricing correction from ₹{actual_amount/100} to ₹{expected_amount/100}'
            })
            
            print(f"✅ Fixed {user_id}: {plan} ₹{actual_amount/100} → ₹{expected_amount/100}")
            fixed_count += 1
            
        except Exception as e:
            print(f"❌ Error fixing {user_id}: {e}")
            error_count += 1
    
    print(f"\n📝 Summary:")
    print(f"   ✅ Fixed: {fixed_count}")
    print(f"   ❌ Errors: {error_count}")
    
    return fixed_count

def verify_fix():
    """Verify that all pricing is now correct"""
    print("\n" + "="*60)
    print("VERIFY: Checking if all pricing is corrected...")
    print("="*60)
    
    issues = audit_user_subscriptions()
    
    if issues and issues['wrong_price']:
        print(f"\n❌ Still {len(issues['wrong_price'])} issues after fix!")
        return False
    
    print(f"\n✅ All pricing is now correct!")
    return True

def main():
    """Main execution"""
    print("""
╔════════════════════════════════════════════════════════╗
║   ToneFit: Pricing Audit & Firestore Cleanup Script   ║
║   Version: 1.0                                          ║
╚════════════════════════════════════════════════════════╝
    """)
    
    # Initialize Firebase
    initialize_firebase()
    
    # Show menu
    print("\nOptions:")
    print("  1. Audit (scan without fixing)")
    print("  2. Fix (audit + correct pricing issues)")
    print("  3. Verify (check if all pricing is correct)")
    
    choice = input("\nSelect option (1-3): ").strip()
    
    if choice == '1':
        audit_user_subscriptions()
    elif choice == '2':
        fixed = fix_user_subscriptions()
        if fixed > 0:
            verify_fix()
    elif choice == '3':
        verify_fix()
    else:
        print("❌ Invalid option")
        sys.exit(1)
    
    print("\n✅ Done!")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n❌ Cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)
