## 📋 Description

<!-- 
  Required: Clearly explain WHAT this PR does and WHY.
  This satisfies CodeRabbit's "Description check".
-->

### What changed?
<!-- 
  Briefly describe the changes (bug fix / feature / refactor / docs).
  Example: "Fixed the Firestore atomicity bug in wardrobe counter increment"
-->

### Why?
<!--
  What problem does this solve? Link to the issue if applicable.
  Example: "Wardrobe counter was stuck at 0 due to missing FieldValue.increment()"
-->

---

## 🔗 Linked Issues

<!--
  Link any related GitHub issues using keywords so they auto-close on merge.
  Example: "Closes #42" or "Fixes #17"
-->

Closes #

---

## 🧪 Type of Change

<!-- Check all that apply -->
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that changes existing behavior)
- [ ] 🔒 Security fix
- [ ] ♻️ Refactor (no functional change)
- [ ] 📝 Documentation update
- [ ] 🎨 UI / styling change
- [ ] ⚡ Performance improvement

---

## 🗂️ Areas Affected

<!-- Check all areas touched by this PR -->
- [ ] Frontend (React / Vite)
- [ ] Backend (FastAPI / Python)
- [ ] Firestore rules / schema
- [ ] Payments (Razorpay)
- [ ] Analytics (GA4)
- [ ] Firebase Auth
- [ ] Face detection / CV pipeline
- [ ] Skin tone classification
- [ ] Recommendation engine
- [ ] Push notifications
- [ ] Deployment config (Vercel / Render)

---

## ✅ Pre-Merge Checklist

<!-- Complete this checklist before requesting review -->
- [ ] I have tested these changes locally
- [ ] No API keys, secrets, or credentials are hardcoded
- [ ] Firestore writes use `FieldValue.increment()` (not manual read-modify-write)
- [ ] Razorpay payments are verified server-side before granting access
- [ ] New Python functions have docstrings
- [ ] New React components have prop type comments or PropTypes
- [ ] No `console.log` debugging statements left in production code
- [ ] The build passes (`npm run build` in frontend)

---

## 📸 Screenshots / Recordings (if UI change)

<!-- 
  Drag and drop screenshots or screen recordings here.
  For UI changes, before/after screenshots are strongly preferred.
-->

---

## 🔍 Additional Notes for Reviewer

<!-- Anything the reviewer should pay special attention to or be aware of -->
