#!/usr/bin/env python3
"""
Quick product seeding script for ToneFit
Seeds 1000+ products to Firestore
"""
import requests
import os

# Get your backend URL
BACKEND_URL = os.environ.get("VITE_API_URL", "http://localhost:8000")
ADMIN_TOKEN = os.environ.get("FIREBASE_ADMIN_TOKEN", "")

print(f"🌱 Seeding products to: {BACKEND_URL}")

# Try to seed products
try:
    response = requests.post(
        f"{BACKEND_URL}/api/products/seed",
        headers={
            "Authorization": f"Bearer {ADMIN_TOKEN}",
            "Content-Type": "application/json"
        },
        timeout=300  # 5 minute timeout for seeding
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success! {data.get('message', '')}")
        print(f"📊 Total products seeded: {data.get('total_products', 0)}")
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"   {response.text}")
except Exception as e:
    print(f"❌ Connection error: {str(e)}")
    print(f"   Make sure backend is running at {BACKEND_URL}")
