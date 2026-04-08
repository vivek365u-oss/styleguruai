# 📊 ToneFit Data Storage Architecture

Complete guide: **Kahan kahan data store ho raha hai**

---

## 🔥 FIREBASE FIRESTORE (Cloud Database)

**Server**: Google Cloud Firestore (Production database)

### 1. **Users Collection** - `users/{uid}/`
**Purpose:** User profile & account data

```
users/
├── {uid}/
│   ├── email (string)
│   ├── full_name (string)
│   ├── phone (string)
│   ├── created_at (timestamp)
│   ├── premium_status (boolean)
│   ├── subscription_plan (string) - "free", "basic", "premium"
│   ├── subscription_expiry (timestamp)
│   ├── language_preference (string)
│   ├── gender_preference (string)
│   ├── primary_profile (object)
│   │   ├── skin_tone (string)
│   │   ├── color_season (string)
│   │   └── confidence (number)
│   │
│   └── Subcollections:
│       ├── skin_analyses/                    (Historical analyses)
│       │   └── {analysis_id}/
│       │       ├── timestamp
│       │       ├── skin_tone
│       │       ├── outfit_color
│       │       ├── recommendations
│       │       └── quality_score
│       │
│       ├── saved_outfits/                    (Saved outfit combinations)
│       │   └── {outfit_id}/
│       │       ├── outfit_name
│       │       ├── colors
│       │       ├── occasion
│       │       └── created_at
│       │
│       ├── saved_colors/                     (Color palette saves)
│       │   └── {color_id}/
│       │       ├── color_name
│       │       ├── hex
│       │       ├── reason_saved
│       │       └── saved_at
│       │
│       ├── push_subscriptions/               (Push notification endpoints)
│       │   └── {sub_id}/
│       │       ├── endpoint
│       │       ├── auth_token
│       │       ├── p256dh_key
│       │       └── created_at
│       │
│       ├── affiliate_history/                (Affiliate links clicked)
│       │   └── {click_id}/
│       │       ├── product_id
│       │       ├── product_name
│       │       ├── affiliate_link
│       │       ├── platform (Amazon/Flipkart/Myntra/Meesho)
│       │       ├── commission_percentage
│       │       └── timestamp
│       │
│       └── payment_logs/                     (Payment records)
│           └── {payment_id}/
│               ├── razorpay_payment_id
│               ├── razorpay_order_id
│               ├── amount
│               ├── status (success/failed/pending)
│               ├── transaction_fee
│               ├── plan_purchased
│               ├── subscription_months
│               └── timestamp
```

### 2. **Products Collection** - `products/`
**Purpose:** Shopping catalog (clothing items)

```
products/
├── {product_id}/
│   ├── name (string)
│   ├── color (string)
│   ├── gender (string) - "male", "female", "unisex"
│   ├── category (string) - "shirt", "pant", "dress", etc.
│   ├── price (number)
│   ├── affiliate_link (string)
│   ├── platform (string) - "amazon", "flipkart", "myntra", "meesho"
│   ├── commission_percentage (number)
│   ├── image_url (string)
│   └── created_at (timestamp)
```

**Total Products:** ~500-1000 items (seeded on first request if empty)

### 3. **Payment Logs Collection** - `payment_logs/`
**Purpose:** Global payment transaction tracking (for admin/analytics)

```
payment_logs/
├── {payment_log_id}/
│   ├── user_id (string)
│   ├── razorpay_payment_id (string) [UNIQUE INDEX]
│   ├── razorpay_order_id (string)
│   ├── amount (number)
│   ├── currency (string) - "INR"
│   ├── status (string) - "success", "failed", "pending"
│   ├── transaction_fee (number)
│   ├── plan_purchased (string)
│   ├── subscription_months (number)
│   ├── payment_method (string) - "card", "netbanking", "upi"
│   ├── timestamp (timestamp)
│   ├── idempotency_key (string) - prevents duplicate payments
│   ├── processed_at (timestamp)
│   └── error_message (string) [if failed]
```

### 4. **Affiliate Clicks Collection** - `affiliate_clicks/`
**Purpose:** Global tracking of all affiliate link clicks (for analytics)

```
affiliate_clicks/
├── {click_id}/
│   ├── user_id (string)
│   ├── product_id (string)
│   ├── product_name (string)
│   ├── affiliate_link (string)
│   ├── platform (string) - "amazon", "flipkart", "myntra", "meesho"
│   ├── commission_percentage (number)
│   ├── clicked_at (timestamp)
│   └── source (string) - "color_card", "recommendation", "shopping_tab"
```

---

## 💾 LOCAL STORAGE (Browser) - `localStorage`

**Scope:** Per-browser, per-user (persists until cleared)

### **User Session Data:**
```
{
  // Onboarding & UI State
  "sg_onboarded": "1",                        // Has user seen onboarding?
  "sg_gender_pref": "male",                   // User gender preference
  "sg_daily_drop_date": "2024-04-09",         // Last daily drop check
  "sg_streak_count": "15",                    // Consecutive days used
  "sg_last_checkin": "2024-04-09",            // Last check-in date
  
  // Primary Profile
  "sg_primary_profile": {
    "skin_tone": "warm_medium",
    "color_season": "autumn",
    "confidence": 0.95
  },
  
  // Analysis History
  "sg_last_analysis": {
    "timestamp": 1712659200000,
    "skin_tone": "warm_medium",
    "outfit_color": "Navy Blue",
    "gender": "male",
    "recommendations": {...}
  },
  "sg_analysis_history": [
    {timestamp, skin_tone, outfit_color, ...},
    {timestamp, skin_tone, outfit_color, ...}
  ],
  "sg_analysis_count": "42",                  // Total analyses done
  
  // Shopping Cart
  "sg_cart": [
    {
      "id": "product_123",
      "name": "Blue Shirt",
      "price": 499,
      "quantity": 1,
      "gender": "male",
      "color": "Blue"
    },
    {...}
  ],
  
  // Last Order (for success page)
  "sg_last_order": {
    "order_id": "order_abc123",
    "amount": 499,
    "plan": "basic_1_month",
    "timestamp": 1712659200000
  },
  
  // Wardrobe Queue (items pending upload to Firestore)
  "sg_wardrobe_queue": [],
  
  // Other UI State
  "sg_theme": "dark",                         // Theme preference
  "sg_language": "en"                         // Language preference
}
```

**Storage Size:** ~50KB-200KB per user

---

## 🖥️ BACKEND (Temporary Storage)

### **Image Processing** - `backend/uploads/`
**Lifetime:** 5-30 seconds (auto-deleted after analysis)

```
uploads/
├── {uuid}_unique_id_{.jpg|.png|.webp}      (Temp image file)
└── [Auto-deleted after analysis completes]
```

**Purpose:** 
- User uploads photo
- Backend saves to `/uploads/` temporarily
- Processes image (compression, face detection, skin tone analysis)
- Deletes uploaded file after analysis

**Max Size:** 10MB per image

---

## 🔐 FIREBASE AUTHENTICATION

**Stored Separately in Firebase Auth Service (not Firestore)**

```
Firebase Auth
├── Email & Password (encrypted)
├── Google OAuth tokens
├── Facebook OAuth tokens
├── Auth UID (used as Firestore key)
├── Email verification status
├── Creation date
└── Last sign-in date
```

---

## 📊 DATA FLOW SUMMARY

### **User Uploads Photo:**
```
1. Browser → LocalStorage: Save analysis to sg_last_analysis
2. Browser → Backend API: Upload photo
3. Backend: Process in /uploads/ (temporary)
4. Backend → Firestore: Save analysis to users/{uid}/skin_analyses/
5. Backend: Delete temp file
6. Backend → Browser: Return analysis + recommendations
```

### **User Makes Payment:**
```
1. Frontend: Initiate Razorpay payment
2. Razorpay: Process at their servers
3. Razorpay → Backend: Send payment confirmation
4. Backend → Firestore: 
   - users/{uid}/subscription_expiry = future date
   - payment_logs/{payment_id} = payment record
5. Frontend → LocalStorage: Save sg_last_order
6. Frontend: Show success page
```

### **User Clicks Affiliate Link:**
```
1. Frontend → Backend: POST /api/affiliate-click
2. Backend → Firestore:
   - affiliate_clicks/{click_id} = click record
   - users/{uid}/affiliate_history/{click_id} = click record
3. Frontend → Browser: Redirect to affiliate link
```

---

## 🎯 DATA STORAGE BY FEATURE

| Feature | Storage Type | Persistent | Example Data |
|---------|-------------|-----------|--------------|
| **User Login** | Firebase Auth | ✅ Permanent | Email, password hash, UID |
| **User Profile** | Firestore | ✅ Permanent | Name, skin tone, preferences |
| **Analysis History** | Firestore + LocalStorage | ✅ Permanent | Skin tone, date, recommendations |
| **Saved Colors** | Firestore | ✅ Permanent | Color palettes, reasons |
| **Saved Outfits** | Firestore | ✅ Permanent | Outfit combinations |
| **Shopping Cart** | LocalStorage | ✅ Until cleared | Products, quantities |
| **Current Analysis** | LocalStorage | ✅ Session | Last skin analysis |
| **Payment History** | Firestore | ✅ Permanent | Payments, subscriptions |
| **Affiliate Clicks** | Firestore | ✅ Permanent | Amazon/Flipkart links clicked |
| **Temp Images** | Backend /uploads/ | ❌ 30 sec | Uploaded photos |
| **Push Notifications** | Firestore | ✅ Until unsubscribed | Subscription tokens |

---

## 📈 STORAGE QUOTAS & LIMITS

### **Firestore (Google Cloud)**
- **Free Tier:** 1GB storage, 50K reads/day
- **Current Usage:** ~100MB (growing)
- **Products:** ~800 items
- **Users:** 50+ users
- **Payment Safety:** All payments logged with idempotency keys

### **LocalStorage (Browser)**
- **Limit:** 5-10MB per origin
- **Current Usage:** ~100-200KB per user
- **Can be cleared** by user or app

### **Backend /uploads/**
- **Limit:** Server disk space
- **Current Usage:** 0 (auto-cleaned)
- **Auto-cleanup:** Every 30 seconds

---

## 🔒 PRIVACY & SECURITY

### **What's Encrypted:**
- ✅ Firebase Auth credentials
- ✅ Razorpay payment data (at Razorpay)
- ✅ User passwords (salted & hashed)

### **What's Visible:**
- User email, name (to user & admin)
- Skin tone analysis results (to user)
- Payment history (to user & admin)
- Affiliate clicks (to admin for analytics)

### **GDPR Compliance:**
- Users can request data export
- Users can request account deletion
- All data deletable from Firestore

---

## 📝 BACKUP & RECOVERY

### **Firestore Backups:**
- Google Cloud automatic backups (retention: 35 days)
- Manual exports possible via Firebase Console

### **LocalStorage Recovery:**
- Cleared automatically if user clears browser data
- Can be restored if browser history isn't cleared

---

## 🚀 RECOMMENDATIONS

### **For You:**
1. **Add database indexing** on frequently queried fields:
   - `payment_logs: razorpay_payment_id` ✅ (Already indexed)
   - `products: color, gender`
   - `users/{uid}/affiliate_history: timestamp`

2. **Enable Firebase backup** for data safety

3. **Archive old analysis data** after 6 months

4. **Monitor Firestore costs** as user base grows

5. **Set up Firestore security rules** to prevent data leaks