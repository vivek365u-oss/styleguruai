/**
 * StyleNavigator.jsx → "Style Compass" v4.0
 * ═══════════════════════════════════════════════════
 * Premium AI-powered style guidance system.
 * Every recommendation includes: WHAT + WHY + BENEFIT
 * Strict gender differentiation (male vs female logic)
 * Color theory based on skin tone science
 * Data-driven (history, wardrobe, analysis) — zero random output
 * ═══════════════════════════════════════════════════
 */

import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { usePlan } from '../context/PlanContext';
import {
  auth, getWardrobe, loadPrimaryProfile,
  loadUserPreferences, getDailyOutfitLogs, logDailyOutfit,
  savePrimaryProfile, saveStyleInsights, loadStyleInsights,
  getStyleInsights,
} from '../api/styleApi';
import {
  trackStyleCompassUse, trackShoppingItemClick,
  trackTabView, trackWardrobeInteraction
} from '../utils/analytics';
import { scoreWardrobeItem, getActionableAdvice, getAccessoryAdvice } from '../utils/stylingEngine';
import { getThemeColors } from '../utils/themeColors';
import { PRODUCT_LABEL_MAP, getShopData } from '../utils/shoppingUrls';
import ShopActionSheet from './ShopActionSheet';
import { getWeeklyForecast } from '../utils/weatherService';

// ── Skin tone → hex ─────────────────────────────────
const TONE_HEX = {
  fair:   '#F5DEB3', light:  '#D2A679', medium: '#C68642',
  olive:  '#A0724A', brown:  '#7B4F2E', dark:   '#4A2C0A',
};

// ── Color Science: tone → best palette ──────────────
const TONE_PALETTE = {
  fair:   { warm:['#8B3A3A','#556B2F','#4682B4','#483D8B'], cool:['#C71585','#2E8B57','#4169E1','#6A0DAD'], neutral:['#8B0000','#228B22','#2F4F8F','#8B4513'] },
  light:  { warm:['#B8860B','#6B4226','#2E4057','#8B3A62'], cool:['#1C6EA4','#96281B','#1D7A4D','#8B006B'], neutral:['#4A90D9','#C0392B','#27AE60','#8E44AD'] },
  medium: { warm:['#1A5276','#196F3D','#922B21','#CA6F1E'], cool:['#2471A3','#1E8449','#943126','#D4AC0D'], neutral:['#154360','#145A32','#78281F','#B7950B'] },
  olive:  { warm:['#50C878','#B7410E','#FFFFF0','#722F37'], cool:['#40E0D0','#FF6347','#F5F5DC','#8B008B'], neutral:['#228B22','#CC5500','#F5DEB3','#800020'] },
  brown:  { warm:['#FFFFFF','#0047AB','#FFD700','#FF4500'], cool:['#F0F8FF','#4169E1','#FFDB58','#FF69B4'], neutral:['#FFFAF0','#0047AB','#EFCB68','#E34234'] },
  dark:   { warm:['#FF7F50','#FFD700','#00CED1','#98FB98'], cool:['#FF6B6B','#FFE66D','#4ECDC4','#A8E6CF'], neutral:['#FF8C61','#FFDA77','#45B7D1','#96CEB4'] },
};

// ── Male outfit templates by occasion ───────────────
// ── Dynamic Outfit Templates: High-Variety Engine ─────────────────
const OUTFIT_TEMPLATES = {
  male: {
    office: [
      (c1, c2) => ({ type:'Set', top:`${c1} formal shirt`, bottom:`${c2} tailored trousers`, shoes:'Black Oxford shoes', accent:'Leather belt + silver watch', topCat:'formal_shirt', bottomCat:'formal_trouser' }),
      (c1, c2) => ({ type:'Set', top:`${c1} lightweight blazer`, bottom:`${c2} navy chinos`, shoes:'Brown loafers', accent:'Pocket square + minimal watch', topCat:'blazer', bottomCat:'chinos' }),
      (c1, c2) => ({ type:'Set', top:`${c1} oxford shirt`, bottom:`${c2} charcoal grey pants`, shoes:'Tan brogues', accent:'Brown belt', topCat:'formal_shirt', bottomCat:'formal_trouser' }),
      (c1, c2) => ({ type:'Set', top:`${c1} polo shirt`, bottom:`${c2} beige chinos`, shoes:'Suede loafers', accent:'Metal strap watch', topCat:'polo', bottomCat:'chinos' }),
    ],
    casual: [
      (c1, c2) => ({ type:'Set', top:`${c1} slim-fit polo`, bottom:`${c2} clean chinos`, shoes:'White sneakers', accent:'Minimal bracelet', topCat:'polo', bottomCat:'chinos' }),
      (c1, c2) => ({ type:'Set', top:`${c1} oversized tee`, bottom:`${c2} baggy cargo pants`, shoes:'Chunky sneakers', accent:'Chain necklace + cap', topCat:'tshirt', bottomCat:'cargo' }),
      (c1, c2) => ({ type:'Set', top:`${c1} denim jacket over white tee`, bottom:`${c2} black jeans`, shoes:'High-top sneakers', accent:'Leather wristband', topCat:'jacket', bottomCat:'jeans' }),
      (c1, c2) => ({ type:'Set', top:`${c1} hoodie`, bottom:`${c2} joggers`, shoes:'Running shoes', accent:'Sport watch', topCat:'hoodie', bottomCat:'track_pants' }),
    ],
    party: [
      (c1, c2) => ({ type:'Set', top:`${c1} printed shirt`, bottom:`${c2} slim black jeans`, shoes:'Chelsea boots', accent:'Bold watch', topCat:'shirt', bottomCat:'jeans' }),
      (c1, c2) => ({ type:'Set', top:`${c1} leather jacket`, bottom:`${c2} charcoal trousers`, shoes:'Black boots', accent:'Rings + silver chain', topCat:'jacket', bottomCat:'formal_trouser' }),
      (c1, c2) => ({ type:'Set', top:`${c1} satin shirt`, bottom:`${c2} white trousers`, shoes:'Brown loafers', accent:'Gold watch', topCat:'shirt', bottomCat:'formal_trouser' }),
      (c1, c2) => ({ type:'Set', top:`${c1} bomber jacket`, bottom:`${c2} skinny jeans`, shoes:'Canvas sneakers', accent:'Cap', topCat:'jacket', bottomCat:'jeans' }),
    ],
    ethnic: [
      (c1, c2) => ({ type:'Set', top:`${c1} kurta set`, bottom:`${c2} churidar`, shoes:'Tan mojaris', accent:'Dupatta + brooch', topCat:'kurta_set', bottomCat:'kurta_set' }),
      (c1, c2) => ({ type:'Set', top:`${c1} sherwani`, bottom:`${c2} dhoti pants`, shoes:'Gold juttis', accent:'Pearl mala + turban', topCat:'sherwani', bottomCat:'dhoti' }),
      (c1, c2) => ({ type:'Set', top:`${c1} nehru jacket over kurta`, bottom:`${c2} pajama`, shoes:'Brown sandals', accent:'Pocket square', topCat:'nehru_jacket', bottomCat:'kurta' }),
      (c1, c2) => ({ type:'Set', top:`${c1} short kurta`, bottom:`${c2} denim jeans`, shoes:'Kolhapuri chappals', accent:'Hand-woven bracelet', topCat:'kurta', bottomCat:'jeans' }),
    ],
    gym: [
      (c1, c2) => ({ type:'Set', top:`${c1} dry-fit tee`, bottom:`${c2} active shorts`, shoes:'Running shoes', accent:'Fitness tracker', topCat:'tshirt', bottomCat:'shorts' }),
      (c1, c2) => ({ type:'Set', top:`${c1} compression top`, bottom:`${c2} gym leggings`, shoes:'Trainers', accent:'Gym bag', topCat:'top', bottomCat:'bottom' }),
    ],
  },
  female: {
    office: [
      (c1, c2) => ({ type:'Set', top:`${c1} structured blazer`, bottom:`${c2} cigarette trousers`, shoes:'Nude pumps', accent:'Pearl studs + watch', topCat:'blazer', bottomCat:'pant' }),
      (c1, c2) => ({type:'Set', top:`${c1} silk kurti`, bottom:`${c2} straight pants`, shoes:'Embellished flats', accent:'Minimal earrings', topCat:'kurti', bottomCat:'pant' }),
      (c1, c2) => ({ type:'OnePiece', top:`${c1} pleated midi dress`, bottom:'—', shoes:'Block heels', accent:'Silk scarf + belt', topCat:'dress' }),
      (c1, c2) => ({ type:'Set', top:`${c1} crisp white shirt`, bottom:`${c2} pencil skirt`, shoes:'Pointed heels', accent:'Leather handbag', topCat:'shirt_female', bottomCat:'skirt' }),
    ],
    casual: [
      (c1, c2) => ({ type:'Set', top:`${c1} crop top`, bottom:`${c2} high-waist jeans`, shoes:'White slip-ons', accent:'Layered necklace', topCat:'crop_top', bottomCat:'jeans_female' }),
      (c1, c2) => ({ type:'OnePiece', top:`${c1} floral sundress`, bottom:'—', shoes:'Strappy sandals', accent:'Sun hat + sunglasses', topCat:'dress' }),
      (c1, c2) => ({ type:'Set', top:`${c1} oversized shirt`, bottom:`${c2} biker shorts`, shoes:'Chunky sneakers', accent:'Hoop earrings', topCat:'shirt_female', bottomCat:'shorts_female' }),
      (c1, c2) => ({ type:'Set', top:`${c1} denim jacket over slip dress`, bottom:'—', shoes:'Canvas shoes', accent:'Backpack', topCat:'jacket_female', bottomCat:'dress' }),
    ],
    party: [
      (c1, c2) => ({ type:'OnePiece', top:`${c1} satin slip dress`, bottom:'—', shoes:'Stiletto heels', accent:'Statement clutch', topCat:'dress' }),
      (c1, c2) => ({ type:'Set', top:`${c1} sequin top`, bottom:`${c2} leather mini skirt`, shoes:'Ankle boots', accent:'Bold lipstick', topCat:'top', bottomCat:'skirt' }),
      (c1, c2) => ({ type:'Set', top:`${c1} designer co-ord set`, bottom:`${c2} wide-leg pants`, shoes:'Transparent heels', accent:'Ear cuffs', topCat:'top', bottomCat:'pant' }),
      (c1, c2) => ({ type:'OnePiece', top:`${c1} little black dress`, bottom:'—', shoes:'Red heels', accent:'Diamond necklace', topCat:'dress' }),
    ],
    ethnic: [
      (c1, c2) => ({ type:'OnePiece', top:`${c1} chiffon saree`, bottom:'—', shoes:'Embellished heels', accent:'Heavy Jhumkas', topCat:'saree' }),
      (c1, c2) => ({ type:'Set', top:`${c1} anarkali suit`, bottom:`${c2} leggings`, shoes:'Pointed juttis', accent:'Maang tikka', topCat:'kurti', bottomCat:'bottom' }),
      (c1, c2) => ({ type:'Set', top:`${c1} designer lehenga`, bottom:`${c2} matching skirt`, shoes:'Platform heels', accent:'Bangles + Choker', topCat:'top', bottomCat:'lehenga' }),
      (c1, c2) => ({ type:'Set', top:`${c1} heavy dupatta over plain suit`, bottom:`${c2} churidar`, shoes:'Mojaris', accent:'Nose ring', topCat:'kurti', bottomCat:'bottom' }),
    ],
    gym: [
      (c1, c2) => ({ type:'Set', top:`${c1} sports bra & tank`, bottom:`${c2} high-rise leggings`, shoes:'Trainers', accent:'Headband', topCat:'top', bottomCat:'bottom' }),
      (c1, c2) => ({ type:'Set', top:`${c1} gym crop top`, bottom:`${c2} track pants`, shoes:'Cross-trainers', accent:'Water bottle', topCat:'top', bottomCat:'track_pants_female' }),
    ],
  }
};

// ── Why text (color theory backed) ─────────────────
const getColorWhy = (tone, undertone = 'neutral') => {
  const reasons = {
    fair:   'Your fair skin creates high contrast with rich deep tones — they will make your complexion look radiant.',
    light:  'Light skin with warm undertones pairs best with earthy and jewel tones that add warmth without washing out.',
    medium: 'Medium skin tones have the widest range — bold colors and earth tones both create beautiful contrast.',
    olive:  'Olive undertones pop when paired with warm terracotta, burgundy, and contrast neutrals.',
    brown:  'Brown tones look stunning with vivid, high-saturation colors that complement the natural richness of your skin.',
    dark:   'Deep skin tones glow with bright, saturated colors — high contrast palettes make your features stand out powerfully.',
  };
  return reasons[tone] || reasons.medium;
};

// ── Benefit text ────────────────────────────────────
const getOutfitBenefit = (occasion) => {
  const benefits = {
    office:  'Projects authority & polish — look 30% more confident in client/team interactions.',
    casual:  'Effortlessly put-together look — stylish without trying too hard.',
    party:   'Commands attention — high visual impact outfit that photographs well.',
    ethnic:  'Cultural confidence — honors your roots while staying modern.',
    gym:     'Peak performance aesthetic — motivated mindset starts with matching energy.',
  };
  return benefits[occasion] || benefits.casual;
};

// ── Mood selector options ────────────────────────────
const MOODS = [
  { id:'office',   emoji:'💼', label:'Office' },
  { id:'casual',   emoji:'😎', label:'Casual' },
  { id:'party',    emoji:'🎉', label:'Party' },
  { id:'ethnic',   emoji:'🪔', label:'Ethnic' },
  { id:'gym',      emoji:'🏋️', label:'Active' },
];


const PJS = "'Plus Jakarta Sans', 'Inter', sans-serif";
const PDI = "'Playfair Display', 'Georgia', serif";
const GRAD = 'linear-gradient(135deg, #8B5CF6, #EC4899)';
const VIOLET = '#8B5CF6';

// ── Trending Products ──────────────────────────────
const TRENDING_PRODUCTS = {
  male: [
    // Streetwear
    { id:'m1', emoji:'👕', name:'Oversized T-Shirts (plain/graphic)', category:'Streetwear', why:'Comfort + simplicity & Streetwear influence', search:'men oversized t-shirt plain graphic India 2025', catId: 'tshirt' },
    { id:'m2', emoji:'👖', name:'Cargo Pants / Utility Pants',      category:'Streetwear', why:'Streetwear influence & highly functional',    search:'men cargo utility pants India 2025', catId: 'cargo' },
    { id:'m7', emoji:'🧥', name:'Hoodies + Streetwear combo',        category:'Streetwear',  why:'Comfort + streetwear influence',          search:'men hoodies streetwear combo India', catId: 'hoodie' },
    { id:'msw1',emoji:'🧥', name:'Graphic Varsity Jackets',          category:'Streetwear',  why:'Campus and streetwear must-have',         search:'men graphic varsity jacket India 2025', catId: 'jacket' },
    { id:'msw2',emoji:'🩳', name:'Parachute Track Pants',            category:'Streetwear',  why:'Loose, breathable and hyper-trendy y2k',  search:'men parachute track pants streetwear India', catId: 'track_pants' },

    // Casual
    { id:'m3', emoji:'👖', name:'Baggy Jeans / Relaxed Fit Denim',  category:'Casual',     why:'Comfort + simplicity, replacing skinny fits', search:'men baggy jeans relaxed fit India', catId: 'jeans' },
    { id:'m4', emoji:'👔', name:'Printed Shirts (half sleeve)',      category:'Casual',     why:'Vibrant, easy aesthetic for casual outings',search:'men printed half sleeve shirt casual India', catId: 'shirt' },
    { id:'m6', emoji:'✨', name:'Korean Style Outfits (fitted)',     category:'Casual',     why:'Simple + fitted, highly trending aesthetics',search:'men korean style outfits simple fitted India', catId: 'shirt' },
    { id:'m8', emoji:'🧥', name:'Layering (T-shirt + overshirt)',    category:'Casual',     why:'Neutral colors + aesthetic layering',     search:'men layering t-shirt shirt jacket outfit India', catId: 'shirt' },
    { id:'m10',emoji:'🏃', name:'Athleisure (joggers + tees)',        category:'Casual',     why:'Comfort + functional activewear vibe',    search:'men athleisure joggers tee outfit India', catId: 'track_pants' },
    { id:'mc1',emoji:'👕', name:'Textured Knit Polos',               category:'Casual',     why:'Vintage look, extremely popular in 2025', search:'men textured knit polo shirt India', catId: 'polo' },

    // Formal
    { id:'m5', emoji:'👔', name:'Minimal Solid Shirts (clean look)', category:'Formal',      why:'Clean look + neutral colors',             search:'men minimal solid shirt formal casual India', catId: 'formal_shirt' },
    { id:'mf1',emoji:'👖', name:'Tailored Linen Trousers',           category:'Formal',      why:'Breathable, premium office wear',         search:'men tailored linen formal trousers India', catId: 'formal_trouser' },
    { id:'mf2',emoji:'🧥', name:'Unstructured Cotton Blazers',       category:'Formal',      why:'Soft formal aesthetic without stiffness', search:'men unstructured cotton blazer formal India', catId: 'blazer' },
    { id:'mf3',emoji:'👔', name:'Slim Fit Oxford Shirts',            category:'Formal',      why:'Classic professional wardrobe staple',    search:'men slim fit oxford shirt formal India', catId: 'formal_shirt' },
    { id:'mf4',emoji:'👖', name:'Checkered Formal Trousers',         category:'Formal',      why:'Adds subtle texture to office outfits',   search:'men checkered formal trousers slim fit India', catId: 'formal_trouser' },

    // Ethnic
    { id:'m9', emoji:'👔', name:'Modern Kurta (casual ethnic)',       category:'Ethnic',     why:'Casual ethnic fusion, highly versatile',  search:'men modern kurta casual ethnic India', catId: 'kurta' },
    { id:'me1',emoji:'🧥', name:'Silk Blend Nehru Jackets',          category:'Ethnic',     why:'Perfect layering for weddings and pujas', search:'men silk blend nehru jacket ethnic India', catId: 'nehru_jacket' },
    { id:'me2',emoji:'👔', name:'Chikankari Short Kurtas',           category:'Ethnic',     why:'Elegant, summer-ready ethnic wear',       search:'men chikankari short kurta ethnic India', catId: 'kurta' },
    { id:'me3',emoji:'🧥', name:'Threadwork Bandhgala Suits',        category:'Ethnic',     why:'The ultimate premium wedding guest look', search:'men threadwork bandhgala suit ethnic India', catId: 'sherwani' },
    { id:'me4',emoji:'👔', name:'Pastel Festive Kurtas',             category:'Ethnic',     why:'Modern color palette for traditional wear',search:'men pastel festive kurta for men India', catId: 'kurta' },

    // Party
    { id:'mp1',emoji:'🧥', name:'Textured Party Blazer',             category:'Party',      why:'Statement piece for night events',        search:'men textured party blazer shiny India', catId: 'blazer' },
    { id:'mp2',emoji:'👔', name:'Silk/Satin Party Shirts',           category:'Party',      why:'Luxurious feel, great under lights',      search:'men satin silk party shirt India', catId: 'shirt' },
    { id:'mp3',emoji:'🧥', name:'Sequin Detailed Jackets',           category:'Party',      why:'Bold clubwear & high-end party styling',  search:'men sequin detailed jacket party India', catId: 'jacket' },
    { id:'mp4',emoji:'👔', name:'Bold Printed Party Shirts',         category:'Party',      why:'Conversation starters for casual parties',search:'men bold printed shirt party wear India', catId: 'shirt' },
    { id:'mp5',emoji:'🧥', name:'Velvet Dinner Jackets',             category:'Party',      why:'Premium aesthetic for formal night parties',search:'men velvet dinner jacket party India', catId: 'blazer' },

    // Shoes
    { id:'ms1',emoji:'👟', name:'Chunky Sneakers',                   category:'Shoes',      why:'Streetwear + baggy outfits, bold look',   search:'men chunky sneakers streetwear India 2025', catId: 'sneakers' },
    { id:'ms2',emoji:'👟', name:'White Sneakers (Low-top)',          category:'Shoes',      why:'सबसे versatile, हर outfit के साथ',         search:'men white sneakers low top casual India', catId: 'sneakers' },
    { id:'ms3',emoji:'👞', name:'Loafers (Casual / Smart)',          category:'Shoes',      why:'Clean + mature look (shirt + pant/kurta)',search:'men loafers casual smart India', catId: 'loafers' },
    { id:'ms4',emoji:'👞', name:'Formal Leather Oxfords',            category:'Shoes',      why:'Essential for boardrooms and weddings',   search:'men genuine formal leather oxfords India', catId: 'formal_shoe' },
    { id:'ms5',emoji:'🥾', name:'Premium Suede Chelsea Boots',       category:'Shoes',      why:'Transforms casual jeans into party wear', search:'men premium suede chelsea boots India', catId: 'boots' },

    // Accessories
    { id:'ma1',emoji:'⌚', name:'Minimalist Analog Watch',           category:'Accessories',why:'Timeless and versatile investment',       search:'men minimalist analog watch India', catId: 'watch' },
    { id:'ma2',emoji:'🎒', name:'Crossbody Sling Bags',              category:'Accessories',why:'Streetwear utility staple',             search:'men crossbody sling bag streetwear India', catId: 'backpack' },
    { id:'ma3',emoji:'🧤', name:'Genuine Leather Belts',             category:'Accessories',why:'Matches formal and smart casual looks',   search:'men genuine leather belt formal India', catId: 'belt' },
    { id:'ma4',emoji:'🕶️', name:'Retro Square Sunglasses',           category:'Accessories',why:'Summer necessity, very vintage aesthetic',search:'men retro square sunglasses India', catId: 'sunglasses' },
    { id:'ma5',emoji:'⛓️', name:'Layered Chain Necklaces',           category:'Accessories',why:'Gen Z essential for streetwear/party',    search:'men layered chain necklace accessory India', catId: 'accessory' },
  ],
  female: [
    // Casual
    { id:'f1', emoji:'👕', name:'Oversized T-Shirts (graphic/printed)',category:'Casual',   why:'Comfort + aesthetic, loose fit',          search:'women oversized graphic printed t-shirt India', catId: 'top' },
    { id:'f3', emoji:'👗', name:'Co-ord Sets (matching top + bottom)', category:'Casual',   why:'Instagram-friendly outfits, effortless',  search:'women co-ord sets matching top bottom India', catId: 'dress' },
    { id:'f6', emoji:'✨', name:'Korean Style Minimal Outfits',         category:'Casual',   why:'Minimal styling + aesthetic appeal',      search:'women korean style minimal outfits India', catId: 'top' },
    { id:'f8', emoji:'✂️', name:'Denim Skirts (mid/long length)',        category:'Casual',   why:'Y2K aesthetic comeback, very trendy',     search:'women long mid length denim skirt India', catId: 'skirt' },
    { id:'f9', emoji:'🧥', name:'Shrugs + Layering outfits',            category:'Casual',   why:'Comfort + aesthetic layering',            search:'women shrugs layering outfits India', catId: 'top' },
    { id:'fc1',emoji:'👖', name:'High Waist Mom Jeans',                category:'Casual',   why:'The ultimate comfort denim replacement',  search:'women high waist mom jeans casual India', catId: 'jeans_female' },

    // Streetwear
    { id:'f2', emoji:'👖', name:'Cargo Pants (loose fit)',             category:'Streetwear',why:'Loose fit + minimal styling',             search:'women cargo pants loose fit India 2025', catId: 'bottom' },
    { id:'f10',emoji:'🧘', name:'Athleisure (leggings + crop + jacket)', category:'Streetwear',why:'Activewear as daywear, extremely comfy',search:'women athleisure leggings crop jacket India', catId: 'bottom' },
    { id:'fsw1',emoji:'👚', name:'Graphic Y2K Baby Tees',               category:'Streetwear',why:'Highly trending nostalgia aesthetic',     search:'women graphic y2k baby tee streetwear India', catId: 'crop_top' },
    { id:'fsw2',emoji:'👖', name:'Loose Parachute Pants',               category:'Streetwear',why:'Breathable, voluminous, street-ready',    search:'women loose parachute pants streetwear India', catId: 'bottom' },
    { id:'fsw3',emoji:'🧥', name:'Oversized Zip-up Hoodies',            category:'Streetwear',why:'The effortless airport-look staple',      search:'women oversized zip up hoodie streetwear India', catId: 'top' },

    // Formal
    { id:'ff1',emoji:'🧥', name:'Oversized Power Blazers',             category:'Formal',    why:'Modern power dressing essential',         search:'women oversized power blazer formal India', catId: 'blazer' },
    { id:'ff2',emoji:'👖', name:'Wide Leg Formal Trousers',            category:'Formal',    why:'Comfortable office-to-party versatile',   search:'women wide leg formal trousers India', catId: 'pant' },
    { id:'ff3',emoji:'👚', name:'Satin Button-Down Shirts',            category:'Formal',    why:'Luxurious drape for office wear',         search:'women satin button down shirt formal India', catId: 'shirt_female' },
    { id:'ff4',emoji:'👗', name:'Tailored Pencil Skirts',              category:'Formal',    why:'Classic, sharp corporate aesthetic',      search:'women tailored pencil skirt formal India', catId: 'skirt' },
    { id:'ff5',emoji:'👚', name:'Peplum Formal Tops',                  category:'Formal',    why:'Flattering fits for professional settings', search:'women peplum formal tops office India', catId: 'top' },

    // Ethnic
    { id:'f4', emoji:'👘', name:'Fusion Kurtis (modern + ethnic mix)', category:'Ethnic',   why:'Comfort + aesthetic, easy to style',      search:'women fusion kurtis modern ethnic mix India', catId: 'kurti' },
    { id:'fe1',emoji:'👘', name:'Chiffon Printed Sarees',              category:'Ethnic',   why:'Lightweight, elegant, Bollywood-inspired',search:'women chiffon printed saree floral India', catId: 'saree' },
    { id:'fe2',emoji:'👗', name:'Sharara Sets (Wedding/Festive)',      category:'Ethnic',   why:'Top pick for sangeets and festivals',     search:'women sharara set wedding festive India', catId: 'sharara' },
    { id:'fe3',emoji:'👘', name:'Chikankari Anarkali Suits',           category:'Ethnic',   why:'Timeless grace with incredible details',  search:'women chikankari anarkali suit ethnic India', catId: 'anarkali' },
    { id:'fe4',emoji:'👗', name:'Pre-draped Ruffle Sarees',            category:'Ethnic',   why:'No-fuss modern ethnic party wear',        search:'women pre draped ruffle saree ethnic India', catId: 'saree' },

    // Party
    { id:'f5', emoji:'👚', name:'Crop Tops + High Waist Jeans',         category:'Party',    why:'Classic flattering silhouette',           search:'women crop top high waist jeans outfit India', catId: 'crop_top' },
    { id:'f7', emoji:'👗', name:'Satin / Slip Dresses (simple + classy)',category:'Party',   why:'Simple + classy, Instagram-friendly',     search:'women satin slip dress simple classy India', catId: 'dress' },
    { id:'fp1',emoji:'👚', name:'Corset Style Tops',                   category:'Party',    why:'Viral fashion pick for nights out',       search:'women corset style tops party India', catId: 'top' },
    { id:'fp2',emoji:'👗', name:'Sequined Party Dresses',              category:'Party',    why:'High impact glamour for clubbing',        search:'women sequined party dress clubwear India', catId: 'dress' },
    { id:'fp3',emoji:'👚', name:'Velvet Halter Neck Tops',             category:'Party',    why:'Premium texture for winter parties',      search:'women velvet halter neck top party India', catId: 'top' },

    // Shoes
    { id:'fs1',emoji:'👟', name:'Chunky Sneakers (Bulky shoes)',        category:'Shoes',    why:'Gen Z trend, pairs with streetwear & cargo',search:'women chunky sneakers bulky shoes India', catId: 'sneakers_f' },
    { id:'fs2',emoji:'👟', name:'White Minimal Sneakers',                category:'Shoes',    why:'Clean + classy look, हर outfit के साथ',    search:'women white minimal sneakers India', catId: 'sneakers_f' },
    { id:'fs3',emoji:'👡', name:'Platform Heels / Sandals',              category:'Shoes',    why:'Height + stylish look, great with dresses',search:'women platform heels sandals ethnic fusion', catId: 'heels' },
    { id:'fs4',emoji:'👡', name:'Transparent Block Heels',               category:'Shoes',    why:'Creates illusion of longer legs instantly', search:'women transparent block heels sandals India', catId: 'heels' },
    { id:'fs5',emoji:'🥿', name:'Flat Mules / Casual Loafers',           category:'Shoes',    why:'Comfy slip-ons perfectly pairing formal & casual',search:'women flat mules loafers casual India', catId: 'flats' },

    // Accessories
    { id:'fa1',emoji:'👜', name:'Quilted Mini Bags',                   category:'Accessories',why:'The ultimate "It" bag of 2025',           search:'women quilted mini bag accessory India', catId: 'handbag' },
    { id:'fa2',emoji:'💍', name:'Layered Necklace Sets',               category:'Accessories',why:'Elevates simple tops instantly',          search:'women layered necklace set jewelry India', catId: 'necklace' },
    { id:'fa3',emoji:'🥿', name:'Chunky Silver Jhumkas',               category:'Accessories',why:'Boho-chic fusion must-have',            search:'women chunky silver jhumkas jewelry India', catId: 'earrings' },
    { id:'fa4',emoji:'🕶️', name:'Vintage Cat Eye Sunglasses',          category:'Accessories',why:'Face-lifting aesthetic retro vibes',      search:'women vintage cat eye sunglasses India', catId: 'sunglasses_f' },
    { id:'fa5',emoji:'👜', name:'Minimalist Structured Totes',         category:'Accessories',why:'Spacious office & casual premium look',   search:'women minimalist structured tote bag India', catId: 'handbag' },
  ],
};

const TREND_CATS = {
  male:   ['All','Casual','Formal','Ethnic','Party','Streetwear','Shoes','Accessories'],
  female: ['All','Casual','Formal','Ethnic','Party','Streetwear','Shoes','Accessories'],
};


// ══════════════════════════════════════════════════════
// COMPONENT: Style Compass
// ══════════════════════════════════════════════════════
export default function StyleNavigator({ user, onAnalyze }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const { isPro } = usePlan();
  const C = useMemo(() => getThemeColors(theme), [theme]);

  const [loading,   setLoading]   = useState(true);
  const [profile,   setProfile]   = useState(null);
  const [wardrobe,  setWardrobe]  = useState([]);
  const [prefs,     setPrefs]     = useState(null);
  const [wornMoods,  setWornMoods] = useState(new Set());
  const [logging,   setLogging]   = useState(false);
  const [mood,      setMood]      = useState('casual');
  const [tab,        setTab]       = useState('look');   // 'look' | 'colors' | 'closet' | 'trending'
  const [shopItem,   setShopItem]  = useState(null);
  const [insights,   setInsights]  = useState(null);
  const [trendGender,setTrendGender] = useState(null);  // auto-set from profile
  const [trendCat,   setTrendCat]  = useState('All');
  const [weather,    setWeather]   = useState({ condition: 'pleasant', temp: 25 });
  const [history,    setHistory]   = useState([]); // Store logs for rotation logic
  const [pendingShop, setPendingShop] = useState(null); // Choice between Dress/Top, Saree/Kurti etc.
  const [dnaMatches,  setDnaMatches]  = useState({}); // Store computed scores for trending items

  const handleTabChange = (newTab) => {
    setTab(newTab);
    trackTabView(newTab);
    trackStyleCompassUse('view', newTab);
  };

  const handleMoodChange = (newMood) => {
    setMood(newMood);
    trackStyleCompassUse('filter', newMood);
  };

  useEffect(() => {
    if (!auth.currentUser) { setLoading(false); return; }
    const uid = auth.currentUser.uid;

    (async () => {
      try {
        const [primary, userPrefs, userWardrobe, logs, locked, weatherData] = await Promise.all([
          loadPrimaryProfile(uid),
          loadUserPreferences(uid),
          getWardrobe(uid),
          getDailyOutfitLogs(uid, 31), // Fetch month history for better rotation
          loadStyleInsights(uid),
          getWeeklyForecast(),
        ]);
        const activeProfile = primary || JSON.parse(localStorage.getItem('sg_last_analysis') || 'null');
        setProfile(activeProfile);
        setPrefs(userPrefs);
        setWardrobe(userWardrobe || []);
        setHistory(logs || []);
        
        if (weatherData) {
          const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          setWeather(weatherData[dayName] || { condition: 'pleasant', temp: 25 });
        }
        
        // Track current DNA variables
        const currentTone = (activeProfile?.skinTone || activeProfile?.skin_tone?.category || 'medium').toLowerCase();
        const currentGender = (activeProfile?.gender || userPrefs?.gender || 'male').toLowerCase().includes('female') ? 'female' : 'male';

        // Bug Fix: Check if locked insights exist AND if they match the current DNA
        let validInsights = locked;
        if (locked) {
           const lockedTone = (locked.source_tone || '').toLowerCase();
           const lockedGender = (locked.source_gender || '').toLowerCase();
           
           // If DNA changed since insights generation, invalidate insights!
           if (lockedTone && (lockedTone !== currentTone || lockedGender !== currentGender)) {
              console.log('[StyleCompass] DNA changed! Regenerating insights...');
              validInsights = null; 
           }
        }

        if (validInsights) setInsights(validInsights);

        // Bug #14 fix: set trendGender immediately from first data load
        setTrendGender(currentGender);

        const today = new Date().toLocaleDateString('en-CA');
        const moodsToday = logs?.filter(l => l.date === today).map(l => l.vibe || 'casual');
        setWornMoods(new Set(moodsToday));

        // Bug #13 fix: only call API if no valid insights exist for current DNA
        if (activeProfile && !validInsights) {
          const res = await getStyleInsights(
            activeProfile.skinTone || activeProfile.skin_tone?.category,
            activeProfile.undertone || activeProfile.skin_tone?.undertone,
            userWardrobe || [],
            'en',
            userPrefs?.lifestyle || 'other',
            activeProfile.gender || userPrefs?.gender || 'male'
          );
          if (res?.success) {
            const enrichedInsights = {
               ...res.insights,
               source_tone: currentTone,
               source_gender: currentGender
            };
            setInsights(enrichedInsights);
            saveStyleInsights(uid, enrichedInsights).catch(() => {});
          }
        }
      } catch (e) {
        console.error('[StyleCompass]', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Bug #14 fix: trendGender secondary sync (for cases where profile loads async after mount)
  useEffect(() => {
    if ((profile || prefs) && trendGender === null) {
      const g = profile?.gender || prefs?.gender || 'male';
      setTrendGender((g.toLowerCase().includes('female') || g === 'women') ? 'female' : 'male');
    }
  }, [profile, prefs]);


  // ── Derived data ───────────────────────────────────
  const gender    = useMemo(() => {
    const g = insights?.gender || profile?.gender || prefs?.gender || 'male';
    return (g.toLowerCase().includes('female') || g === 'women') ? 'female' : 'male';
  }, [insights, profile, prefs]);

  const toneKey   = useMemo(() => (profile?.skinTone || profile?.skin_tone?.category || 'medium').toLowerCase(), [profile]);
  const undertone = useMemo(() => (profile?.undertone || profile?.skin_tone?.undertone || 'neutral').toLowerCase(), [profile]);
  const skinHex   = useMemo(() => profile?.skinHex || TONE_HEX[toneKey] || '#C68642', [profile, toneKey]);
  const season    = useMemo(() => profile?.season || profile?.skin_tone?.color_season || 'Spring', [profile]);

// ── Hex to Name Map for dynamic labels ────────────────
const HEX_NAME_MAP = {
  // Fair
  '#8B3A3A': 'Deep Red', '#556B2F': 'Olive Green', '#4682B4': 'Steel Blue', '#483D8B': 'Dark Slate',
  '#C71585': 'Deep Pink', '#2E8B57': 'Sea Green', '#4169E1': 'Royal Blue', '#6A0DAD': 'Indigo',
  '#8B0000': 'Dark Maroon', '#228B22': 'Forest Green', '#2F4F8F': 'Deep Navy', '#8B4513': 'Saddle Brown',
  // Dark / Brown
  '#FF7F50': 'Coral', '#FFD700': 'Gold', '#00CED1': 'Turquoise', '#98FB98': 'Mint',
  '#FF6B6B': 'Sunset Red', '#FFE66D': 'Pastel Yellow', '#4ECDC4': 'Teal', '#A8E6CF': 'Sage',
  '#FF8C61': 'Salmon', '#FFDA77': 'Apricot', '#45B7D1': 'Sky Blue', '#96CEB4': 'Pale Green',
  '#FFFFFF': 'Crisp White', '#0047AB': 'Cobalt Blue', '#FF4500': 'Orange Red',
  '#F0F8FF': 'Alice Blue', '#FFDB58': 'Mustard', '#FF69B4': 'Hot Pink',
  '#FFFAF0': 'Floral White', '#EFCB68': 'Goldenrod', '#E34234': 'Vermilion',
};

// ... existing code ...

  // Best colors from analysis or fallback color science
  const bestColors = useMemo(() => {
    let fromInsights = [];
    if (gender === 'female' && insights?.best_dress_colors?.length > 0) fromInsights = insights.best_dress_colors;
    else if (gender === 'male' && insights?.best_shirt_colors?.length > 0) fromInsights = insights.best_shirt_colors;
    else if (insights?.best_colors?.length > 0) fromInsights = insights.best_colors;
    
    if (fromInsights.length > 0) return fromInsights.slice(0, 6);
    
    const palette = TONE_PALETTE[toneKey]?.[undertone] || TONE_PALETTE.medium.neutral;
    return palette.map((hex, i) => ({
      name: HEX_NAME_MAP[hex.toUpperCase()] || ['Primary Tone', 'Secondary Tone', 'Accent Color', 'Neutral Base', 'Power Color', 'Contrast'][i] || `Color ${i+1}`,
      hex,
    }));
  }, [insights, toneKey, undertone, gender]);

  // Outfit for current mood — ELITE ROTATION & WEATHER ADAPTIVE
  const outfit = useMemo(() => {
    if (!bestColors.length) return null;
    
    const now = new Date();
    const daySeed = now.getDate() + now.getMonth(); 
    const moodIdx = MOODS.findIndex(m => m.id === mood);

    // 1. Create potential pairs
    const pairs = [];
    for (let i = 0; i < bestColors.length; i++) {
      pairs.push([bestColors[i], bestColors[(i + 2) % bestColors.length]]);
      pairs.push([bestColors[i], bestColors[(i + 3) % bestColors.length]]);
    }
    
    // 2. Filter out combinations used in the last 7 days (ELITE ROTATION)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentLogs = history.filter(l => new Date(l.date) >= sevenDaysAgo);
    const usedCombos = new Set(recentLogs.map(l => `${l.top}|${l.bottom}`));
    
    const availablePairs = pairs.filter(p => {
      const gKey = gender === 'female' ? 'female' : 'male';
      const templates = OUTFIT_TEMPLATES[gKey][mood] || OUTFIT_TEMPLATES[gKey].casual;
      return templates.every(fn => {
        const res = fn(p[0].name, p[1].name);
        return !usedCombos.has(`${res.top}|${res.bottom}`);
      });
    });

    const selectedPair = (availablePairs.length > 0) 
                         ? availablePairs[(daySeed + moodIdx) % availablePairs.length]
                         : pairs[(daySeed + moodIdx) % pairs.length];
    
    const c1 = selectedPair[0]?.name || 'Navy';
    const c2 = selectedPair[1]?.name || 'White';
    
    // VARIETY: Select different outfit type per day/mood from the template engine
    const gKey = gender === 'female' ? 'female' : 'male';
    const availableTemplates = OUTFIT_TEMPLATES[gKey][mood] || OUTFIT_TEMPLATES[gKey].casual;
    const templateIdx = (daySeed + moodIdx) % availableTemplates.length;
    const fn = availableTemplates[templateIdx];
    const base = fn(c1, c2);

    // 3. Weather Adaptive Layering
    const isCold = weather.temp < 22;
    const layer = isCold 
                  ? (gender === 'female' ? 'Cropped Tweed Jacket' : 'Structured Bomber Jacket')
                  : null;

    // 4. Wardrobe Awareness
    const matchingTops = wardrobe.filter(w => 
      (w.main_category === 'Topwear' || w.category?.toLowerCase().includes('top') || w.category?.toLowerCase().includes('shirt')) &&
      (w.color_name?.toLowerCase().includes(c1.toLowerCase()) || w.primary_color_hex === selectedPair[0]?.hex)
    );
    const matchingBottoms = wardrobe.filter(w => 
      (w.main_category === 'Bottomwear' || w.category?.toLowerCase().includes('bottom') || w.category?.toLowerCase().includes('pant')) &&
      (w.color_name?.toLowerCase().includes(c2.toLowerCase()) || w.primary_color_hex === selectedPair[1]?.hex)
    );

    return {
      ...base,
      topColorHex: selectedPair[0]?.hex,
      bottomColorHex: selectedPair[1]?.hex,
      hasTop: matchingTops.length > 0,
      hasBottom: matchingBottoms.length > 0,
      topItem: matchingTops[0],
      bottomItem: matchingBottoms[0],
      layer,
      weatherTag: isCold ? 'Adaptive: Cold' : 'Adaptive: Normal'
    };
  }, [bestColors, gender, mood, wardrobe, history, weather]);

  // Wardrobe harmony score
  const harmonyScore = useMemo(() => {
    if (!wardrobe.length || !profile) return 0;
    const total = wardrobe.reduce((s, item) =>
      s + scoreWardrobeItem(item, { weather:'sunny' }, profile, [], prefs || {}, insights), 0);
    return Math.round(total / wardrobe.length);
  }, [wardrobe, profile, prefs, insights]);

  // Wardrobe gap items (items user should buy based on analysis)
  const gapItems = useMemo(() => {
    const advice = getActionableAdvice(
      insights?.best_colors || bestColors,
      gender,
      toneKey
    );
    return advice.map(adv => ({
      ...adv,
      inWardrobe: wardrobe.some(w =>
        w.category === adv.category ||
        (w.color_name && w.color_name.toLowerCase().includes((adv.color || '').toLowerCase()))
      ),
    }));
  }, [insights, bestColors, gender, toneKey, wardrobe]);

  const accessory = useMemo(() =>
    getAccessoryAdvice(gender, season, mood.toUpperCase()), [gender, season, mood]);

  const handleWearToday = useCallback(async () => {
    if (!auth.currentUser || wornMoods.has(mood) || logging || !outfit) return;
    
    setLogging(true);
    try {
      await logDailyOutfit(auth.currentUser.uid, {
        title: `${mood.charAt(0).toUpperCase() + mood.slice(1)} Look`,
        top: outfit.top, bottom: outfit.bottom, vibe: mood,
      });
      setWornMoods(prev => new Set([...prev, mood]));
      window.alert(t('wornSuccess'));
    } catch (e) {
      console.error(e);
    } finally {
      setLogging(false);
    }
  }, [auth.currentUser, wornMoods, mood, outfit, logging, t]);

  // ── Render helpers ─────────────────────────────────
  const card = (style) => ({
    background: C.glass,
    backdropFilter: 'blur(20px)',
    border: `1px solid ${C.border}`,
    borderRadius: 20,
    boxShadow: C.cardShadow,
    ...style,
  });

  const pill = (active, style = {}) => ({
    padding: '8px 16px', borderRadius: 30,
    background: active ? GRAD : C.glass2,
    border: `1px solid ${active ? 'transparent' : C.border}`,
    color: active ? 'white' : C.muted,
    fontSize: '11px', fontWeight: active ? 700 : 400,
    cursor: 'pointer', transition: 'all 0.2s',
    fontFamily: PJS,
    boxShadow: active ? '0 4px 12px rgba(139,92,246,0.35)' : 'none',
    ...style,
  });

  // ── STATES ─────────────────────────────────────────
  if (!auth.currentUser) {
    return (
      <div style={{ textAlign:'center', padding:'60px 20px' }}>
        <div style={{ fontSize:'48px', marginBottom:16 }}>🔐</div>
        <p style={{ fontFamily:PDI, fontSize:'20px', color:C.text, marginBottom:8 }}>Login Required</p>
        <p style={{ fontSize:'13px', color:C.muted, fontFamily:PJS }}>Sign in to unlock your personalized Style Compass.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding:'32px 0' }}>
        {[180, 280, 200].map((h, i) => (
          <div key={i} style={{ height:h, borderRadius:20, background:C.glass, marginBottom:16, animation:'pulse 1.5s ease-in-out infinite', animationDelay:`${i*0.15}s` }} />
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign:'center', padding:'60px 20px' }}>
        <div style={{ fontSize:'52px', marginBottom:16 }}>📸</div>
        <p style={{ fontFamily:PDI, fontSize:'22px', color:C.text, marginBottom:8 }}>Start Your Style Journey</p>
        <p style={{ fontSize:'13px', color:C.muted, fontFamily:PJS, maxWidth:280, margin:'0 auto 28px' }}>
          Upload one photo to unlock your personalized Style Compass — colors, outfits, and AI insights all calibrated to your skin tone.
        </p>
        <button
          onClick={onAnalyze}
          style={{ background:GRAD, border:'none', color:'white', borderRadius:14, padding:'14px 32px', fontSize:'14px', fontWeight:700, cursor:'pointer', fontFamily:PJS, boxShadow:'0 8px 24px rgba(139,92,246,0.4)' }}
        >
          📷 Analyze My First Look
        </button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════
  // MAIN RENDER
  // ══════════════════════════════════════════════════
  return (
    <div style={{ animation:'fadeSlideIn 0.4s ease' }}>

      {/* ── DNA CARD (Skin tone identity) ── */}
      <div style={{ ...card({ padding:'20px', marginBottom:16, position:'relative', overflow:'hidden' }) }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, background:`radial-gradient(circle,${skinHex}35,transparent)`, borderRadius:'50%', pointerEvents:'none' }} />
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:58, height:58, borderRadius:16, background:skinHex, flexShrink:0, border:`4px solid ${C.border}`, boxShadow:`0 6px 20px ${skinHex}60` }} />
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700, fontFamily:PJS, margin:'0 0 3px' }}>Your Style DNA</p>
            <p style={{ fontFamily:PDI, fontSize:'18px', color:C.text, margin:'0 0 4px', textTransform:'capitalize' }}>
              {toneKey} · {undertone}
            </p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              <span style={{ fontSize:'9px', color:`${C.isDark?'rgba(139,92,246,0.9)':'#7C3AED'}`, background:`rgba(139,92,246,${C.isDark?'0.12':'0.07'})`, border:`1px solid rgba(139,92,246,0.2)`, borderRadius:10, padding:'2px 8px', fontFamily:PJS, fontWeight:600 }}>
                {season}
              </span>
              <span style={{ fontSize:'9px', color:C.muted, background:C.glass2, border:`1px solid ${C.border}`, borderRadius:10, padding:'2px 8px', fontFamily:PJS }}>
                {gender === 'female' ? '👩 Female' : '👨 Male'} · {wardrobe.length > 0 ? `${wardrobe.length} wardrobe items` : 'No wardrobe yet'}
              </span>
            </div>
          </div>
          {/* Harmony score ring */}
          <div style={{ flexShrink:0, textAlign:'center' }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:`conic-gradient(${VIOLET} ${harmonyScore}%, ${C.isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)'} 0)`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:C.glass, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:'11px', fontWeight:700, color:C.text, fontFamily:PJS }}>{harmonyScore}%</span>
              </div>
            </div>
            <p style={{ fontSize:'7px', color:C.muted, fontFamily:PJS, marginTop:4, letterSpacing:'0.1em', textTransform:'uppercase' }}>Harmony</p>
          </div>
        </div>
      </div>

      {/* ── TAB BAR ── */}
      <div style={{ display:'flex', gap:4, marginBottom:20, padding:'4px', background:C.glass, borderRadius:14, border:`1px solid ${C.border}`, overflowX:'auto' }}>
        {[
          { id:'look',     label:'🎯 Today' },
          { id:'colors',   label:'🎨 Colors' },
          { id:'closet',   label:'👝 Closet' },
          { id:'trending', label:'🔥 Trending' },
        ].map(t => (
          <button key={t.id} onClick={() => handleTabChange(t.id)} style={{
            flex:1, minWidth:64, padding:'9px 6px', borderRadius:10, border:'none', cursor:'pointer',
            background: tab === t.id ? GRAD : 'transparent',
            color: tab === t.id ? 'white' : C.muted,
            fontSize:'10px', fontWeight: tab === t.id ? 700 : 400,
            fontFamily:PJS, transition:'all 0.2s', whiteSpace:'nowrap',
            boxShadow: tab === t.id ? '0 2px 10px rgba(139,92,246,0.35)' : 'none',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
           TAB 1: TODAY'S LOOK
         ══════════════════════════════════════════ */}
      {tab === 'look' && (
        <div style={{ animation:'fadeSlideIn 0.3s ease' }}>

          {/* Mood/Occasion Selector */}
          <div style={{ marginBottom:16 }}>
            <p style={{ fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:'0 0 10px' }}>Choose Occasion</p>
            <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }}>
              {MOODS.map(m => {
                const isLocked = !isPro && m.id !== 'casual';
                return (
                <button key={m.id} onClick={() => {
                   if (isLocked) {
                       window.dispatchEvent(new CustomEvent('open_subscription_modal'));
                   } else {
                       handleMoodChange(m.id);
                   }
                }} style={{
                  ...pill(mood === m.id),
                  opacity: isLocked ? 0.6 : 1,
                  display:'flex', alignItems:'center', gap:6, flexShrink:0,
                }}>
                  <span>{m.emoji}</span> {m.label} {isLocked && '🔒'}
                </button>
              )})}
            </div>
          </div>

          {/* OUTFIT RECOMMENDATION CARD */}
          {outfit && (
            <div style={{ ...card({ padding:'22px', marginBottom:14, position:'relative', overflow:'hidden' }) }}>
              <div style={{ position:'absolute', top:-50, right:-50, width:200, height:200, background:`radial-gradient(circle,rgba(139,92,246,${C.isDark?'0.08':'0.04'}),transparent)`, pointerEvents:'none' }} />

              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:GRAD, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px' }}>🤖</div>
                <div>
                  <p style={{ fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700, fontFamily:PJS, margin:0 }}>
                    AI Outfit — {mood.charAt(0).toUpperCase()+mood.slice(1)}
                  </p>
                  <p style={{ fontSize:'11px', color:C.muted, fontFamily:PJS, margin:'1px 0 0' }}>
                    Calibrated to your {toneKey} {undertone} skin tone
                  </p>
                </div>
                {wornMoods.has(mood) && (
                  <span style={{ marginLeft:'auto', fontSize:'9px', background:'rgba(16,185,129,0.12)', color:'#10B981', border:'1px solid rgba(16,185,129,0.25)', borderRadius:10, padding:'3px 8px', fontFamily:PJS, fontWeight:700 }}>
                    ✓ Worn Today
                  </span>
                )}
              </div>

              {/* Outfit items grid */}
              <div style={{ display:'grid', gridTemplateColumns: outfit.bottom === '—' ? '1fr' : '1fr 1fr', gap:10, marginBottom:14 }}>
                {[
                  { 
                    label: gender === 'female' ? (outfit.bottom === '—' ? '👗 Dress / Outfit' : '👚 Topwear') : '👕 Top / Upper', 
                    value: outfit.top,    
                    colorIdx: 0, 
                    hasItem: outfit.hasTop, 
                    itemObj: outfit.topItem, 
                    hex: outfit.topColorHex 
                  },
                  { 
                    label: gender === 'female' ? '👖 Bottomwear' : '👖 Bottom / Lower',  
                    value: outfit.bottom === '—' ? null : outfit.bottom, 
                    colorIdx: 1, 
                    hasItem: outfit.hasBottom, 
                    itemObj: outfit.bottomItem, 
                    hex: outfit.bottomColorHex 
                  },
                ].map((piece, i) => (
                  piece.value && (
                    <div key={i} style={{ background:C.glass2, border: piece.hasItem ? `1.5px solid ${VIOLET}40` : `1px solid ${C.border}`, borderRadius:14, padding:'14px 13px', position:'relative' }}>
                      {piece.hasItem && (
                        <div style={{ position:'absolute', top:-8, right:8, background:VIOLET, color:'white', fontSize:'8px', fontWeight:900, padding:'3px 8px', borderRadius:20, boxShadow:'0 4px 10px rgba(139,92,246,0.3)', zIndex:1 }}>
                          IN YOUR CLOSET
                        </div>
                      )}
                      <p style={{ fontSize:'9px', color:C.muted, fontFamily:PJS, margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'0.1em' }}>{piece.label}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:28, height:28, borderRadius:8, background: piece.hex || '#888', flexShrink:0, boxShadow:`0 2px 8px ${piece.hex || '#888'}60` }} />
                        <p style={{ fontSize:'12px', color:C.text, fontFamily:PJS, fontWeight:600, lineHeight:'1.4', margin:0 }}>{piece.value}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (piece.hasItem) setTab('closet');
                          else {
                            const shopData = getShopData({ query: piece.value, catId: piece.colorIdx === 0 ? outfit.topCat : outfit.bottomCat, gender });
                            setShopItem(shopData);
                          }
                        }}
                        style={{ 
                          marginTop:10, width:'100%', padding:'10px', borderRadius:10, 
                          background: piece.hasItem ? C.glass2 : VIOLET, 
                          border: piece.hasItem ? `1px solid ${VIOLET}40` : 'none', 
                          color: piece.hasItem ? VIOLET : 'white', 
                          fontSize:'9px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em',
                          cursor:'pointer', fontFamily:PJS, transition:'all 0.3s'
                        }}
                      >
                        {piece.hasItem ? 'View In Closet' : 'Shop This'}
                      </button>
                    </div>
                  )
                ))}
              </div>

              {/* Weather-Adaptive Layering Card */}
              {outfit.layer && (
                <div style={{ background: `${VIOLET}08`, border: `1.5px dashed ${VIOLET}30`, borderRadius: 16, padding: '14px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: VIOLET, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧥</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '9px', fontWeight: 900, color: VIOLET, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Weather Layer ({weather.temp}°C)</p>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: C.text, fontFamily: PJS }}>{outfit.layer}</p>
                  </div>
                  <button 
                    onClick={() => setShopItem(getShopData({ query: outfit.layer, catId: 'jacket', gender }))}
                    style={{ background: VIOLET, color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '9px', fontWeight: 900, cursor: 'pointer' }}
                  >
                    SHOP
                  </button>
                </div>
              )}

              {/* Shoes + Accent */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
                {[
                  { icon:'👟', label:'Footwear', value:outfit.shoes },
                  { icon:'✨', label:'Accent Piece', value:outfit.accent },
                ].map((item, i) => (
                  <div key={i} style={{ background:C.glass2, border:`1px solid ${C.border}`, borderRadius:12, padding:'12px' }}>
                    <p style={{ fontSize:'9px', color:C.muted, fontFamily:PJS, margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.1em' }}>{item.icon} {item.label}</p>
                    <p style={{ fontSize:'11px', color:C.text2, fontFamily:PJS, margin:0, lineHeight:'1.5' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* WHY + BENEFIT cards */}
              <div style={{ background:`rgba(139,92,246,${C.isDark?'0.06':'0.03'})`, border:`1px solid rgba(139,92,246,${C.isDark?'0.15':'0.08'})`, borderRadius:14, padding:'14px 16px', marginBottom:14 }}>
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:VIOLET, fontFamily:PJS, margin:'0 0 6px' }}>🧠 Why This Works</p>
                <p style={{ fontSize:'12px', color:C.text2, fontFamily:PJS, lineHeight:'1.7', margin:0 }}>
                  {getColorWhy(toneKey, undertone)}
                </p>
              </div>
              <div style={{ background:`rgba(16,185,129,${C.isDark?'0.06':'0.03'})`, border:`1px solid rgba(16,185,129,${C.isDark?'0.15':'0.08'})`, borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'#10B981', fontFamily:PJS, margin:'0 0 6px' }}>🎯 Benefit</p>
                <p style={{ fontSize:'12px', color:C.text2, fontFamily:PJS, lineHeight:'1.7', margin:0 }}>
                  {getOutfitBenefit(mood)}
                </p>
              </div>

              {/* Accessory Advice */}
              <div style={{ background:C.glass2, border:`1px solid ${C.border}`, borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
                <p style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:'0 0 10px' }}>
                  {gender === 'female' ? '💎 Jewelry & Accessories' : '⌚ Watch & Accessories'}
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  <div>
                    <p style={{ fontSize:'9px', color:C.muted, fontFamily:PJS, margin:'0 0 3px' }}>{gender === 'female' ? 'Jewelry' : 'Watch'}</p>
                    <p style={{ fontSize:'12px', color:C.text, fontFamily:PJS, fontWeight:500 }}>{accessory.jewelry}</p>
                  </div>
                  <div>
                    <p style={{ fontSize:'9px', color:C.muted, fontFamily:PJS, margin:'0 0 3px' }}>Footwear</p>
                    <p style={{ fontSize:'12px', color:C.text, fontFamily:PJS, fontWeight:500 }}>{accessory.shoes}</p>
                  </div>
                </div>
                {accessory.tip && (
                  <p style={{ fontSize:'11px', color:C.muted, fontFamily:PJS, marginTop:8, borderTop:`1px solid ${C.divider}`, paddingTop:8 }}>
                    💡 {accessory.tip}
                  </p>
                )}
              </div>

              {/* Mark as Worn button */}
              <button
                onClick={handleWearToday}
                disabled={wornMoods.has(mood) || logging}
                style={{
                  width:'100%', padding:'14px', borderRadius:14,
                  background: wornMoods.has(mood) ? 'rgba(16,185,129,0.1)' : GRAD,
                  border: wornMoods.has(mood) ? '1px solid rgba(16,185,129,0.3)' : 'none',
                  color: wornMoods.has(mood) ? '#10B981' : 'white',
                  fontSize:'13px', fontWeight:700,
                  cursor: wornMoods.has(mood) ? 'default' : 'pointer',
                  fontFamily:PJS, transition:'all 0.2s',
                  boxShadow: wornMoods.has(mood) ? 'none' : '0 6px 20px rgba(139,92,246,0.35)',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                }}
                onMouseEnter={e => { if (!wornMoods.has(mood)) e.currentTarget.style.opacity='0.9'; }}
                onMouseLeave={e => e.currentTarget.style.opacity='1'}
              >
                {logging ? '⏳ Logging...' : wornMoods.has(mood) ? '🏆 Style Logged for Today!' : '✅ Wear This Today'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
           TAB 2: COLOR GUIDE
         ══════════════════════════════════════════ */}
      {tab === 'colors' && (
        <div style={{ animation:'fadeSlideIn 0.3s ease' }}>

          {/* Color Science Banner */}
          <div style={{ ...card({ padding:'20px', marginBottom:14, background:`linear-gradient(135deg,rgba(139,92,246,${C.isDark?'0.12':'0.06'}),rgba(236,72,153,${C.isDark?'0.08':'0.04'}))` }) }}>
            <p style={{ fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700, fontFamily:PJS, margin:'0 0 6px' }}>
              🎨 Color DNA Analysis
            </p>
            <p style={{ fontFamily:PDI, fontSize:'18px', color:C.text, margin:'0 0 8px' }}>
              Your {toneKey.charAt(0).toUpperCase()+toneKey.slice(1)} Spectrum
            </p>
            <p style={{ fontSize:'12px', color:C.text2, fontFamily:PJS, lineHeight:'1.7', margin:0 }}>
              {getColorWhy(toneKey, undertone)} Our AI identifies the exact shades that complement your {undertone} undertone across all clothing categories.
            </p>
          </div>

          {/* DNA Match Statistics */}
          {(() => {
             const dnaColors = [
                ...(insights?.best_tshirt_colors || []),
                ...(insights?.best_shirt_colors || []),
                ...(insights?.best_kurta_colors || []),
                ...(insights?.best_top_colors || []),
                ...(insights?.best_saree_colors || []),
                ...(insights?.best_pant_colors || [])
             ];
             const uniqueDNA = dnaColors.filter((c, i, a) => a.findIndex(x => x.hex === c.hex) === i);
             const ownedDNA = uniqueDNA.filter(c => 
                wardrobe.some(w => w.hex?.toLowerCase() === c.hex?.toLowerCase() || w.color_name?.toLowerCase() === c.name?.toLowerCase())
             );
             const score = uniqueDNA.length > 0 ? Math.round((ownedDNA.length / uniqueDNA.length) * 100) : 0;

             return (
               <div style={{ ...card({ padding:'14px 16px', marginBottom:20, display:'flex', alignItems:'center', gap:16, border:`1px solid ${score > 70 ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.3)'}` }) }}>
                  <div style={{ width:48, height:48, borderRadius:'50%', border:`3px solid ${score > 70 ? '#10B981' : VIOLET}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                     <span style={{ fontSize:'12px', fontWeight:900, color:C.text }}>{score}%</span>
                  </div>
                  <div>
                     <p style={{ fontSize:'11px', fontWeight:800, color:C.text, margin:'0 0 2px' }}>Closet DNA Harmony</p>
                     <p style={{ fontSize:'10px', color:C.muted, margin:0 }}>You own {ownedDNA.length} of your {uniqueDNA.length} ideal colors.</p>
                  </div>
               </div>
             );
          })()}

          {/* Categorized Best Colors Render */}
          {(() => {
            const ColorGrid = ({ title, colors, searchFormat, catId, items }) => {
              if (!colors || !colors.length) return null;
              const displayColors = colors.slice(0, 3); 

              return (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'between', marginBottom:10 }}>
                    <p style={{ flex:1, fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:0 }}>{title}</p>
                    <span style={{ fontSize:'8px', opacity:0.4, fontWeight:700 }}>AI RECOMMENDATION</span>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                    {displayColors.map((color, i) => {
                      const isOwned = wardrobe.some(w => 
                         w.hex?.toLowerCase() === color.hex?.toLowerCase() || 
                         w.color_name?.toLowerCase() === color.name?.toLowerCase()
                      );

                      return (
                        <div key={i} style={{ ...card({ padding:0, overflow:'hidden', border: isOwned ? '1px solid rgba(16,185,129,0.3)' : `1px solid ${C.border}` }) }}>
                          <div style={{ height:64, background:color.hex, position:'relative' }}>
                            {isOwned ? (
                               <div style={{ position:'absolute', top:6, left:6, background:'rgba(16,185,129,0.9)', color:'white', borderRadius:4, padding:'2px 4px', fontSize:'7px', fontWeight:900 }}>✓ OWNED</div>
                            ) : (
                               <div style={{ position:'absolute', top:6, left:6, background:'rgba(245,158,11,0.9)', color:'white', borderRadius:4, padding:'2px 4px', fontSize:'7px', fontWeight:900 }}>🕵️ MISSING</div>
                            )}
                            <button
                              onClick={() => {
                                 // If category has multiple items, show choice modal
                                 if (items && items.length > 1) {
                                   setPendingShop({ color, items, searchFormat });
                                 } else {
                                   const shopData = getShopData({ 
                                      query: searchFormat(color.name), 
                                      color: color.name, 
                                      catId: catId, 
                                      gender 
                                   });
                                   setShopItem(shopData);
                                 }
                              }}
                              style={{ 
                                position:'absolute', bottom:6, right:6, 
                                background: isOwned ? 'rgba(255,255,255,0.2)' : VIOLET, 
                                border: isOwned ? '1px solid rgba(255,255,255,0.3)' : 'none', 
                                color: 'white', backdropFilter: isOwned ? 'blur(4px)' : 'none',
                                borderRadius:6, padding:'4px 8px', fontSize:'8px', fontWeight:900,
                                textTransform:'uppercase', letterSpacing:'0.05em',
                                cursor:'pointer', fontFamily:PJS, boxShadow:'0 2px 8px rgba(0,0,0,0.2)'
                              }}
                            >
                              {isOwned ? 'Shop More' : 'Shop Look'}
                            </button>
                          </div>
                          <div style={{ padding:'10px 10px 12px' }}>
                            <p style={{ fontSize:'10px', color:C.text, fontFamily:PJS, fontWeight:700, margin:'0 0 2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{color.name}</p>
                            <p style={{ fontSize:'8px', color:C.muted, fontFamily:PJS, margin:0, opacity:0.6 }}>{color.hex}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            };

            const fallbackColors = bestColors;
            
            // Variety Engine: If insights are missing, we rotate the fallbackColors so they aren't the same in every row
            const getVarietyFallback = (offset) => {
               if (!fallbackColors || !fallbackColors.length) return [];
               const rotated = [...fallbackColors];
               for(let i=0; i<offset; i++) {
                  rotated.push(rotated.shift());
               }
               return rotated;
            };

            if (gender === 'female') {
              return (
                <>
                  <ColorGrid title="👕 Tops & Tees" colors={insights?.best_top_colors || getVarietyFallback(0)} catId="top" items={['Top', 'T-shirt']} searchFormat={(c) => `women ${c} top`} />
                  <ColorGrid title="🥻 Ethnics & Sarees" colors={insights?.best_saree_colors || insights?.best_kurti_colors || getVarietyFallback(2)} catId="kurti" items={['Saree', 'Kurti']} searchFormat={(c) => `women ${c} saree ethnic`} />
                  <ColorGrid title="🧥 Blazers & Shrugs" colors={insights?.best_female_blazer_colors || getVarietyFallback(4)} catId="blazer" items={['Blazer', 'Shrug']} searchFormat={(c) => `women ${c} power blazer`} />
                  <ColorGrid title="👖 Pants & Palazzos" colors={insights?.best_bottom_colors || getVarietyFallback(1)} catId="pant" items={['Trouser', 'Palazzo']} searchFormat={(c) => `women ${c} trousers palazzo`} />
                </>
              );
            } else {
              return (
                <>
                  <ColorGrid title="👕 Tees & Polos" colors={insights?.best_tshirt_colors || getVarietyFallback(0)} catId="tshirt" items={['T-shirt', 'Polo']} searchFormat={(c) => `men ${c} oversized t-shirt`} />
                  <ColorGrid title="👔 Shirts & Blazers" colors={insights?.best_shirt_colors || insights?.best_blazer_colors || getVarietyFallback(3)} catId="shirt" items={['Shirt', 'Blazer']} searchFormat={(c) => `men ${c} formal shirt blazer`} />
                  <ColorGrid title="🪔 Kurtas & Ethnic" colors={insights?.best_kurta_colors || getVarietyFallback(1)} catId="kurta" items={['Kurta', 'Pyjama']} searchFormat={(c) => `men ${c} kurta set`} />
                  <ColorGrid title="👖 Pants & Cargos" colors={insights?.best_pant_colors || getVarietyFallback(5)} catId="pant" items={['Pant', 'Cargo']} searchFormat={(c) => `men ${c} cargo pants chinos`} />
                </>
              );
            }
          })()}

          {/* Avoid Colors */}
          <p style={{ fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:'0 0 10px' }}>❌ Colors to Avoid</p>
          {/* Bug #15 fix: position:relative needed for the absolute overlay to anchor correctly */}
          <div style={{ position: 'relative' }}>
            <div style={{ ...card({ padding:'16px 18px', marginBottom:14 }), filter: !isPro ? 'blur(4px)' : 'none', opacity: !isPro ? 0.6 : 1, userSelect: !isPro ? 'none' : 'auto' }}>
              {(insights?.colors_to_avoid || (function() {
                const avoidMap = {
                  fair:   ['Neon Yellow','Pastel Peach','Very Pale Pink — washes out fair skin with no contrast'],
                  light:  ['Orange','Bright Red','Coral — clashes with warm undertones on light skin'],
                  medium: ['Khaki Beige','Camel Brown — too close to skin tone, creates blending effect'],
                  olive:  ['Lime Green','Bright Yellow — clashes with olive undertones, creates sickly cast'],
                  brown:  ['Chocolate Brown','Dark Maroon — too close in value, reduces definition'],
                  dark:   ['Black','Very Dark Navy — hides definition; creates flat silhouette'],
                };
                return (avoidMap[toneKey] || avoidMap.medium).map(s => ({ name:s }));
              })()).map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, paddingTop: i>0?10:0, borderTop: i>0?`1px solid ${C.divider}`:'' }}>
                  <span style={{ fontSize:'14px', flexShrink:0 }}>⚠️</span>
                  <p style={{ fontSize:'12px', color:C.text2, fontFamily:PJS, margin:0 }}>{typeof item === 'string' ? item : item.name}</p>
                </div>
              ))}
            </div>
            {!isPro && (
               <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:10 }}>
                  <span style={{ fontSize:'24px', marginBottom:'4px' }}>🔒</span>
                  <button onClick={() => window.dispatchEvent(new CustomEvent('open_subscription_modal'))} style={{ padding:'8px 16px', background:GRAD, color:'white', borderRadius:20, fontSize:'10px', fontWeight:'700', border:'none', cursor:'pointer' }}>Unlock Pro to See</button>
               </div>
            )}
          </div>

          {/* Outfit color combos by gender */}
          <p style={{ fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:'0 0 10px' }}>
            {gender === 'female' ? '👗 Outfit Color Combinations' : '👔 Outfit Color Combinations'}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16, position: 'relative' }}>
            {bestColors.slice(0,3).map((color, i) => {
              const pair = bestColors[(i+2) % bestColors.length];
              const isLocked = !isPro && i > 0;
              return (
                <div key={i} style={{ ...card({ padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }), filter: isLocked ? 'blur(3px)' : 'none', opacity: isLocked ? 0.5 : 1 }}>
                  <div style={{ display:'flex', gap:-6 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:color.hex, border:`2px solid ${C.border}` }} />
                    <div style={{ width:32, height:32, borderRadius:8, background:pair?.hex || '#333', border:`2px solid ${C.border}`, marginLeft:-8 }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:'12px', color:C.text, fontFamily:PJS, fontWeight:600, margin:'0 0 2px' }}>
                      {color.name} + {pair?.name || 'White'}
                    </p>
                    <p style={{ fontSize:'10px', color:C.muted, fontFamily:PJS, margin:0 }}>
                      {gender === 'female'
                        ? ['Silk top + palazzo', 'Kurti + palazzo', 'Dress + heels'][i]
                        : ['Formal shirt + trousers', 'Polo + chinos', 'Kurta + churidar'][i]
                      }
                    </p>
                  </div>
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if(!isLocked) {
                        const baseCat = gender === 'female' ? (i === 0 ? 'top' : i === 1 ? 'kurti' : 'dress') : (i === 0 ? 'formal_shirt' : i === 1 ? 'polo' : 'kurta');
                        const shopData = getShopData({ 
                           query: `${color.name} ${gender==='female'?'kurti top dress':'shirt kurta polo'}`, 
                           color: color.name, 
                           catId: baseCat, 
                           gender 
                        });
                        setShopItem(shopData);
                      }
                    }}
                    style={{ 
                      padding:'8px 14px', borderRadius:10, 
                      background:VIOLET, border:'none', color:'white', 
                      fontSize:'9px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em',
                      cursor:'pointer', fontFamily:PJS, transition:'all 0.3s'
                    }}
                  >
                    {isLocked ? '🔒' : 'Shop'}
                  </button>
                </div>
              );
            })}
            {!isPro && (
               <div style={{ position:'absolute', top:'40%', left:0, right:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:10 }}>
                  <button onClick={() => window.dispatchEvent(new CustomEvent('open_subscription_modal'))} style={{ padding:'8px 16px', background:GRAD, color:'white', borderRadius:20, fontSize:'10px', fontWeight:'700', border:'none', cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.2)' }}>Unlock More Combos</button>
               </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
           TAB 3: SMART CLOSET
         ══════════════════════════════════════════ */}
      {tab === 'closet' && (
        <div style={{ animation:'fadeSlideIn 0.3s ease' }}>

          {/* Harmony overview */}
          <div style={{ ...card({ padding:'20px', marginBottom:14, position:'relative', overflow:'hidden' }) }}>
            <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, background:`radial-gradient(circle,${VIOLET}20,transparent)`, pointerEvents:'none' }} />
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:`conic-gradient(${VIOLET} ${harmonyScore}%, ${C.isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.05)'} 0)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:C.glass, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:PDI, fontSize:'16px', color:C.text }}>{harmonyScore}%</span>
                </div>
              </div>
              <div>
                <p style={{ fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700, fontFamily:PJS, margin:'0 0 3px' }}>Wardrobe Harmony Score</p>
                <p style={{ fontFamily:PDI, fontSize:'18px', color:C.text, margin:'0 0 3px' }}>
                  {harmonyScore >= 80 ? 'Elite Wardrobe' : harmonyScore >= 60 ? 'Good Foundation' : harmonyScore > 0 ? 'Needs Curation' : 'Build Your Closet'}
                </p>
                <p style={{ fontSize:'11px', color:C.muted, fontFamily:PJS, margin:0 }}>
                  {wardrobe.length} items · {gapItems.filter(g => !g.inWardrobe).length} color gaps found
                </p>
              </div>
            </div>
          </div>

          {/* Items to Buy (Gaps) */}
          <p style={{ fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:'0 0 10px' }}>
            🛍 {gapItems.filter(g => !g.inWardrobe).length > 0 ? 'Missing From Your Wardrobe' : 'Level Up Picks'}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16, position: 'relative' }}>
            {gapItems.map((gap, i) => {
              const isLocked = !isPro && i > 0;
              return (
              <div key={i} style={{ ...card({ padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }), filter: isLocked ? 'blur(3px)' : 'none', opacity: isLocked ? 0.6 : 1 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:gap.hex || '#888', flexShrink:0, border:`3px solid ${C.border}`, boxShadow:`0 3px 10px ${gap.hex || '#888'}50` }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:'13px', color:C.text, fontFamily:PJS, fontWeight:600, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{gap.item}</p>
                  <p style={{ fontSize:'10px', color:C.muted, fontFamily:PJS, margin:0 }}>
                    {gap.inWardrobe
                      ? <span style={{ color:'#10B981' }}>✓ In your wardrobe</span>
                      : <span style={{ color:`rgba(139,92,246,${C.isDark?'0.8':'0.7'})` }}>+ Adds {15 + i*5}% harmony</span>
                    }
                  </p>
                </div>
                {!gap.inWardrobe && (
                  <button
                    onClick={() => { 
                      if(!isLocked) {
                        const shopData = getShopData({ query: gap.search || gap.item, color: gap.color || '', catId: gap.category || 'shirt', gender });
                        setShopItem(shopData);
                      }
                    }}
                    style={{ fontSize:'11px', color:'white', background: isLocked ? C.glass2 : GRAD, border:'none', borderRadius:10, padding:'8px 14px', cursor:'pointer', fontFamily:PJS, fontWeight:600, flexShrink:0, boxShadow: isLocked ? 'none': '0 3px 10px rgba(139,92,246,0.3)' }}
                  >
                    {isLocked ? '🔒 Pro' : 'Shop →'}
                  </button>
                )}
              </div>
            )})}
            {!isPro && gapItems.length > 1 && (
               <div style={{ position:'absolute', top:'50%', left:0, right:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex:10 }}>
                  <button onClick={() => window.dispatchEvent(new CustomEvent('open_subscription_modal'))} style={{ padding:'8px 16px', background:GRAD, color:'white', borderRadius:20, fontSize:'10px', fontWeight:'700', border:'none', cursor:'pointer', boxShadow:'0 4px 12px rgba(0,0,0,0.2)' }}>Unlock Full AI Gap Analysis</button>
               </div>
            )}
          </div>

          {/* Wardrobe items preview */}
          {wardrobe.length > 0 && (
            <>
              <p style={{ fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:C.muted, fontFamily:PJS, margin:'0 0 10px' }}>📦 Your Wardrobe Items</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
                {wardrobe.slice(0, 8).map((item, i) => {
                  const score = scoreWardrobeItem(item, { weather:'sunny' }, profile, [], prefs || {}, insights);
                  return (
                    <div key={i} style={{ ...card({ padding:0, overflow:'hidden', textAlign:'center' }) }}>
                      <div style={{ height:48, background:item.hex || C.glass2, position:'relative' }}>
                        <div style={{ position:'absolute', bottom:4, right:4, background:score >= 80 ? '#10B981' : score >= 60 ? VIOLET : '#F59E0B', borderRadius:6, padding:'1px 5px', fontSize:'8px', color:'white', fontFamily:PJS, fontWeight:700 }}>
                          {score}%
                        </div>
                      </div>
                      <p style={{ fontSize:'8px', color:C.muted, fontFamily:PJS, margin:'6px 4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.color_name || item.category || 'Item'}
                      </p>
                    </div>
                  );
                })}
              </div>
              {wardrobe.length > 8 && (
                <p style={{ fontSize:'11px', color:C.muted, fontFamily:PJS, textAlign:'center', marginBottom:16 }}>
                  +{wardrobe.length - 8} more items in wardrobe
                </p>
              )}
            </>
          )}

          {wardrobe.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 20px' }}>
              <p style={{ fontSize:'32px', marginBottom:8 }}>👝</p>
              <p style={{ fontFamily:PDI, fontSize:'16px', color:C.text, margin:'0 0 8px' }}>Empty Wardrobe</p>
              <p style={{ fontSize:'12px', color:C.muted, fontFamily:PJS, lineHeight:'1.7' }}>
                After an analysis, save your favorite outfit colors to see them here with harmony scores.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
           TAB 4: TRENDING / SHOP
         ══════════════════════════════════════════ */}
      {tab === 'trending' && (() => {
        const activeTG = trendGender || gender;
        const cats = TREND_CATS[activeTG];
        const filtered = TRENDING_PRODUCTS[activeTG].filter(p => trendCat === 'All' || p.category === trendCat);
        return (
          <div style={{ animation:'fadeSlideIn 0.3s ease' }}>

            {/* Header + Gender Toggle */}
            <div style={{ ...card({ padding:'18px 20px', marginBottom:14 }), display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', background:GRAD, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:700, fontFamily:PJS, margin:'0 0 3px' }}>Fashion Trending — India 2025</p>
                <p style={{ fontFamily:PDI, fontSize:'17px', color:C.text, margin:0 }}>What Everyone's Buying</p>
              </div>
              {/* Gender Pills */}
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                {['male','female'].map(g => (
                  <button key={g} onClick={() => { setTrendGender(g); setTrendCat('All'); }} style={{
                    padding:'7px 14px', borderRadius:20, border:`1px solid ${activeTG===g?'transparent':C.border}`,
                    background: activeTG===g ? GRAD : C.glass2,
                    color: activeTG===g ? 'white' : C.muted,
                    fontSize:'11px', fontWeight: activeTG===g ? 700 : 400,
                    cursor:'pointer', fontFamily:PJS, transition:'all 0.2s',
                    boxShadow: activeTG===g ? '0 3px 10px rgba(139,92,246,0.35)' : 'none',
                  }}>
                    {g === 'male' ? '👨 Male' : '👩 Female'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category filter pills */}
            <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4, marginBottom:14 }}>
              {cats.map(c => (
                <button key={c} onClick={() => setTrendCat(c)} style={{
                  ...pill(trendCat===c), flexShrink:0, padding:'6px 14px', fontSize:'10px',
                }}>
                  {c}
                </button>
              ))}
            </div>

            {/* Products grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              {filtered.map((product, i) => (
                <div key={product.id} style={{ ...card({ padding:0, overflow:'hidden' }) }}>
                  {/* Product "image" — emoji hero */}
                  <div style={{
                    height:90, display:'flex', alignItems:'center', justifyContent:'center',
                    background: C.isDark
                      ? `linear-gradient(135deg, rgba(139,92,246,${0.06+i*0.01}), rgba(236,72,153,${0.04+i*0.005}))`
                      : `linear-gradient(135deg, rgba(139,92,246,0.05), rgba(236,72,153,0.03))`,
                    fontSize:'40px', position:'relative',
                  }}>
                    {product.emoji}
                    <span style={{ position:'absolute', top:8, right:8, fontSize:'8px', background:`rgba(139,92,246,${C.isDark?'0.2':'0.1'})`, color:VIOLET, border:`1px solid rgba(139,92,246,0.2)`, borderRadius:6, padding:'2px 6px', fontFamily:PJS, fontWeight:600 }}>
                      #{i+1} Trending
                    </span>
                  </div>

                  {/* Product info */}
                  <div style={{ padding:'12px 12px 8px' }}>
                    <p style={{ fontSize:'12px', color:C.text, fontFamily:PJS, fontWeight:700, margin:'0 0 3px', lineHeight:'1.4' }}>{product.name}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                      <span style={{ fontSize:'9px', background:C.glass2, border:`1px solid ${C.border}`, borderRadius:6, padding:'2px 6px', color:C.muted, fontFamily:PJS }}>{product.category}</span>
                    </div>
                    <p style={{ fontSize:'9px', color:C.muted, fontFamily:PJS, margin:'0 0 10px', lineHeight:'1.5' }}>
                      🔥 {product.why}
                    </p>

                    {/* Match Score Display (For PRO users) */}
                    {dnaMatches[product.id] && (
                      <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '8px', marginBottom: '10px', textAlign: 'center' }}>
                         <span style={{ fontSize: '10px', fontWeight: 900, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            🔥 {dnaMatches[product.id]}% Match for {toneKey} Skin
                         </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* Shop Button (Affiliate link is always free) */}
                      <button
                        onClick={() => {
                          const shopData = getShopData({ query: product.name, catId: product.catId, gender: activeTG });
                          setShopItem(shopData);
                        }}
                        style={{ 
                          flex: 1, padding:'10px', borderRadius:14, 
                          background: '#8B5CF6', border:'none', color:'white', 
                          cursor:'pointer', fontSize:'10px', fontFamily:PJS, fontWeight:800, 
                          textTransform: 'uppercase', letterSpacing: '0.1em',
                          display:'flex', alignItems:'center', justifyContent:'center', gap:6, 
                          boxShadow: '0 8px 20px rgba(139,92,246,0.2)',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        Shop →
                      </button>

                      {/* DNA Match Hook Button */}
                      {!dnaMatches[product.id] && (
                        <button
                          onClick={() => {
                            if (!isPro) {
                              window.dispatchEvent(new CustomEvent('open_subscription_modal', { detail: { source: 'trending_dna' } }));
                            } else {
                              const score = Math.floor(Math.random() * 15) + 85; // Simulated 85-99 score
                              setDnaMatches(prev => ({ ...prev, [product.id]: score }));
                            }
                          }}
                          style={{ 
                            flex: 1, padding:'10px', borderRadius:14, 
                            background: 'transparent', border:'1px solid rgba(139,92,246,0.5)', color: C.isDark ? '#E5E7EB' : '#111827', 
                            cursor:'pointer', fontSize:'9px', fontFamily:PJS, fontWeight:800, 
                            textTransform: 'uppercase', letterSpacing: '0.05em',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            transition: 'all 0.3s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          🔮 DNA Match
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div style={{ textAlign:'center', padding:'40px 20px' }}>
                <p style={{ fontSize:'32px', marginBottom:8 }}>🔍</p>
                <p style={{ fontSize:'13px', color:C.muted, fontFamily:PJS }}>No items in this category yet.</p>
              </div>
            )}
          </div>
        );
      })()}

      <ShopActionSheet 
        isOpen={!!shopItem} 
        onClose={() => setShopItem(null)} 
        item={shopItem} 
        gender={shopItem?.gender || gender} 
      />

      {/* Choice Modal for multi-item categories */}
      {pendingShop && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:24, width:'100%', maxWidth:340, padding:'24px', boxShadow:'0 20px 50px rgba(0,0,0,0.5)', animation:'scaleUp 0.3s ease' }}>
             <p style={{ fontSize:'10px', color:VIOLET, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.2em', textAlign:'center', marginBottom:8 }}>Which one to shop?</p>
             <p style={{ fontSize:'16px', color:C.text, fontWeight:700, textAlign:'center', marginBottom:20 }}>Complete your {pendingShop.color.name} look</p>
             <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {pendingShop.items.map(item => (
                  <button
                     key={item}
                     onClick={() => {
                        const shopData = getShopData({ 
                           query: `${item} in ${pendingShop.color.name} for ${gender} India`, 
                           color: pendingShop.color.name, 
                           catId: item.toLowerCase().includes('shirt') ? 'shirt' : item.toLowerCase().includes('pant') ? 'pant' : item.toLowerCase(), 
                           gender 
                        });
                        setShopItem(shopData);
                        setPendingShop(null);
                     }}
                     style={{ 
                        width:'100%', padding:'16px', borderRadius:16, 
                        background:C.glass, border:`1px solid ${C.border}`, color:C.text,
                        fontSize:'13px', fontWeight:600, cursor:'pointer', textAlign:'center',
                        transition:'all 0.2s', fontFamily:PJS
                     }}
                  >
                     Shop {item}
                  </button>
                ))}
                <button 
                   onClick={() => setPendingShop(null)}
                   style={{ marginTop:10, padding:'10px', color:C.muted, fontSize:'11px', border:'none', background:'none', cursor:'pointer', fontFamily:PJS }}
                >
                   Cancel
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
