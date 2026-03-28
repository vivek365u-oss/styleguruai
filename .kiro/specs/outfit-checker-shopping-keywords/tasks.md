# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Hardcoded Keyword Bug in OutfitShopCard
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases — e.g., color.name = "Navy Blue", "Rust", "Coral" — and assert that generated URLs contain the color name AND at least one trending keyword
  - Test `isBugCondition(colorName, generatedURL)` from design:
    - `colorInURL := colorName.toLowerCase() IN generatedURL.toLowerCase()`
    - `hasTrending := ANY keyword IN ["oversized", "trending 2025", "streetwear", "coord set", "cargo"] WHERE keyword IN generatedURL`
    - Bug condition: `NOT colorInURL OR NOT hasTrending`
  - For `OutfitShopCard`, call the URL-building logic with color = `{ name: "Navy Blue", hex: "#001F5B" }` and assert Amazon URL contains `"navy+blue"` AND one of the trending keywords
  - For `OutfitShopCard`, repeat with color = `{ name: "Rust", hex: "#B7410E" }` and color = `{ name: "Coral", hex: "#FF7F50" }`
  - For `ShoppingLinks` fallback (color not in topPicksMap, e.g., "Lavender"), assert Flipkart URL contains `"lavender"` AND a trending keyword
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists; current URLs use hardcoded `"men tshirt polo shirt"` without trending keywords)
  - Document counterexamples found, e.g., `"navy+blue+men+tshirt+polo+shirt"` — missing "oversized" / "trending 2025"
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - topPicksMap Curated URLs + Budget Filter Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: `ShoppingLinks` with color = "navy blue" + category = "shirt" → uses curated `topPicksMap` URL (not fallback) on unfixed code
  - Observe: `ShoppingLinks` with color = "teal" + category = "dress" → uses curated `topPicksMap` URL on unfixed code
  - Observe: Budget filter ₹500 in `OutfitShopCard` → `amzPriceParam = "%2Cp_36%3A-50000"` appended to URL on unfixed code
  - Observe: Budget filter "Any" → no price param in URL on unfixed code
  - Write property-based tests:
    - For all colors in `topPicksMap` (navy blue, teal, rust, cobalt blue, forest green, mustard, burgundy, coral) with matching categories, assert curated URL is used (not the dynamic fallback)
    - For all budget values (₹500, ₹1000, ₹2000, Any), assert correct price params are appended in both `OutfitShopCard` and `ShoppingLinks`
    - For all non-buggy inputs (colors in topPicksMap), assert `topPick` badge "⭐ Top Pick — All 4 Platforms" is rendered
  - Verify tests PASS on UNFIXED code (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.4_

- [x] 3. Fix for hardcoded shopping keywords in OutfitShopCard and ShoppingLinks fallback

  - [x] 3.1 Fix `OutfitShopCard` in `OutfitChecker.jsx` — replace hardcoded keywords with dynamic color + trending terms
    - Remove hardcoded `"men tshirt polo shirt"` from all 4 platform URL strings
    - Build dynamic keyword: `colorDisplay + " men oversized tshirt streetwear trending 2025"` for Amazon
    - Build dynamic keyword: `colorDisplay + " men oversized tshirt"` for Flipkart query param
    - Build dynamic Myntra URL: `https://www.myntra.com/tshirts?rawQuery=${colorLower}+men+oversized`
    - Build dynamic Meesho URL: `https://meesho.com/search?q=${encodeURIComponent(colorDisplay + ' men oversized tshirt trending')}`
    - Keep budget filter params (`amzPriceParam`, `fkPriceParam`, `myntraPriceParam`) unchanged
    - _Bug_Condition: `isBugCondition(colorName, generatedURL)` where `NOT colorInURL OR NOT hasTrending`_
    - _Expected_Behavior: URL contains `color.name.toLowerCase()` AND at least one of ["oversized", "trending 2025", "streetwear", "coord set", "cargo"]_
    - _Preservation: Budget filter logic (amzPriceParam, fkPriceParam, myntraPriceParam) must remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.2_

  - [x] 3.2 Fix `ShoppingLinks` fallback `cfg` in `ResultsDisplay.jsx` — upgrade generic fallback with trending keywords
    - Locate the fallback `cfg` object: `categoryConfig[category] || { amzKw: \`${colorDisplay} ${...} ${category}\`, ... }`
    - Update fallback `amzKw` to include trending terms: `\`${colorDisplay} ${isFemale ? 'women' : 'men'} ${category} oversized trending 2025\``
    - Update fallback `meesho` to include trending terms: `\`${colorDisplay} ${isFemale ? 'women' : 'men'} ${category} trending\``
    - Update fallback `myntra` URL to include trending query: `\`https://www.myntra.com/fashion?rawQuery=${colorLower}+${isFemale ? 'women' : 'men'}+${category}+trending\``
    - Do NOT touch `topPicksMap` entries — they are curated and must remain unchanged
    - Do NOT touch any `categoryConfig` entries (dress, top, kurti, shirt, pant, etc.) — only the final fallback `||` branch
    - _Bug_Condition: `isBugCondition(colorName, fallbackURL)` where color not in topPicksMap and category not in categoryConfig_
    - _Expected_Behavior: Fallback URL contains color name AND at least one trending keyword_
    - _Preservation: topPicksMap curated entries and all categoryConfig entries unchanged_
    - _Requirements: 2.4, 2.5, 3.1, 3.4_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Color-Specific + Trending Keywords in Shopping URLs
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms: generated URLs contain detected color name AND at least one trending 2025 keyword
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - topPicksMap Curated URLs + Budget Filter Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm topPicksMap curated entries still override dynamic URLs for matched colors
    - Confirm budget filter price params still append correctly in both components
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify in browser: upload a "Navy Blue" outfit → Amazon link should contain "navy+blue" AND "oversized" or "trending+2025"
  - Verify in browser: upload a "Rust" outfit → links should be rust-specific with trending keywords
  - Verify topPicksMap colors (navy blue, teal, rust, etc.) still show "⭐ Top Pick" badge
  - Verify budget filter still works correctly in both OutfitShopCard and ShoppingLinks
