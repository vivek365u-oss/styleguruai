// ============================================================
// StyleGuru — Tab-Based Results Display (App-like UX)
// ============================================================
import { useState, useEffect, useContext, useMemo } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { ThemeContext } from '../App';
import { publishToCommunityFeed, auth } from '../api/styleApi';
import { translateBackendObject } from '../i18n/backendTranslations';

// ── Shopping Links ───────────────────────────────────────────
function ShoppingLinks({ colorName, category = "shirt", gender = "male" }) {
  const { t } = useLanguage();
  const isFemale = gender === "female";
  const colorLower = colorName.toLowerCase().replace(/\s+/g, '+');
  const colorDisplay = colorName.toLowerCase().replace(/\s+/g, ' ');
  const colorMyntra = colorName.toLowerCase().replace(/\s+/g, '%20'); // Myntra rawQuery needs %20
  const AMAZON_TAG = 'styleguruai-21';
  const [budget, setBudget] = useState(null); // null = no filter
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const budgets = [
    { label: '₹500', amzMax: 500, fkMax: 500, myntraMax: 500 },
    { label: '₹1000', amzMax: 1000, fkMax: 1000, myntraMax: 1000 },
    { label: '₹2000', amzMax: 2000, fkMax: 2000, myntraMax: 2000 },
    { label: 'Any', amzMax: null, fkMax: null, myntraMax: null },
  ];

  const categoryConfig = {
    // ── WOMEN ── 2025 trending keywords
    dress:      { amzKw: `${colorDisplay} women coord set maxi dress trending 2025`,    amzNode: '1968024031', myntra: `https://www.myntra.com/co-ords?rawQuery=${colorMyntra}%20women%20coord%20set`,           meesho: `${colorDisplay} women coord set maxi dress` },
    top:        { amzKw: `${colorDisplay} women crop top oversized tshirt trending`,    amzNode: '1968024031', myntra: `https://www.myntra.com/tops?rawQuery=${colorMyntra}%20women%20crop%20top%20oversized`,     meesho: `${colorDisplay} women crop top oversized` },
    kurti:      { amzKw: `${colorDisplay} women kurti with jeans casual trending`,      amzNode: '1968024031', myntra: `https://www.myntra.com/kurtas?rawQuery=${colorMyntra}%20women%20kurti`,         meesho: `${colorDisplay} women kurti casual` },
    lehenga:    { amzKw: `${colorDisplay} women lehenga choli bridal wedding 2025`,     amzNode: '1968024031', myntra: `https://www.myntra.com/lehenga-cholis?rawQuery=${colorMyntra}%20women%20lehenga`,      meesho: `${colorDisplay} women lehenga bridal` },
    saree:      { amzKw: `${colorDisplay} women saree georgette silk trending`,         amzNode: '1968024031', myntra: `https://www.myntra.com/sarees?rawQuery=${colorMyntra}%20women%20saree`,      meesho: `${colorDisplay} women saree georgette` },
    bottom:     { amzKw: `${colorDisplay} women baggy jeans wide leg palazzo trending`, amzNode: '1968024031', myntra: `https://www.myntra.com/jeans?rawQuery=${colorMyntra}%20women%20jeans`,        meesho: `${colorDisplay} women baggy jeans palazzo` },
    handbag:    { amzKw: `${colorDisplay} women sling bag tote trending 2025`,          amzNode: '1953539031', myntra: `https://www.myntra.com/handbags?rawQuery=${colorMyntra}%20women%20handbag`,         meesho: `${colorDisplay} women sling bag tote` },
    jewellery:  { amzKw: `${colorDisplay} women oxidised jewellery set trending`,       amzNode: '1953557031', myntra: `https://www.myntra.com/jewellery?rawQuery=${colorMyntra}%20women%20jewellery`,      meesho: `${colorDisplay} women jewellery set` },
    dupatta:    { amzKw: `${colorDisplay} women dupatta stole trending`,                amzNode: '1968024031', myntra: `https://www.myntra.com/dupattas?rawQuery=${colorMyntra}%20women%20dupatta`,            meesho: `${colorDisplay} women dupatta stole` },
    // ── GENDER AWARE ──
    watch:      { amzKw: isFemale ? `${colorDisplay} women analog watch fashion trending` : `${colorDisplay} men analog watch casual trending`, amzNode: '1350380031', myntra: isFemale ? `https://www.myntra.com/watches?rawQuery=${colorMyntra}%20women%20watch` : `https://www.myntra.com/watches?rawQuery=${colorMyntra}%20men%20watch`, meesho: isFemale ? `${colorDisplay} women watch fashion` : `${colorDisplay} men watch casual` },
    wallet:     { amzKw: isFemale ? `${colorDisplay} women wallet clutch trending` : `${colorDisplay} men slim wallet rfid`, amzNode: '1953539031', myntra: isFemale ? `https://www.myntra.com/wallets?rawQuery=${colorMyntra}%20women%20wallet` : `https://www.myntra.com/wallets?rawQuery=${colorMyntra}%20men%20wallet`, meesho: isFemale ? `${colorDisplay} women wallet clutch` : `${colorDisplay} men slim wallet` },
    sunglasses: { amzKw: isFemale ? `${colorDisplay} women sunglasses trendy oversized` : `${colorDisplay} men sunglasses trendy polarized`, amzNode: '1350380031', myntra: isFemale ? `https://www.myntra.com/sunglasses?rawQuery=${colorMyntra}%20women%20sunglasses` : `https://www.myntra.com/sunglasses?rawQuery=${colorMyntra}%20men%20sunglasses`, meesho: isFemale ? `${colorDisplay} women sunglasses trendy` : `${colorDisplay} men sunglasses trendy` },
    accessories:{ amzKw: isFemale ? `${colorDisplay} women accessories jewellery trending` : `${colorDisplay} men accessories cap streetwear`, amzNode: isFemale ? '1953557031' : '1968024031', myntra: isFemale ? `https://www.myntra.com/jewellery?rawQuery=${colorMyntra}%20women%20jewellery` : `https://www.myntra.com/accessories?rawQuery=${colorMyntra}%20men%20accessories`, meesho: isFemale ? `${colorDisplay} women accessories` : `${colorDisplay} men accessories streetwear` },
    bag:        { amzKw: isFemale ? `${colorDisplay} women sling bag tote trending` : `${colorDisplay} men backpack sling bag streetwear`, amzNode: '1953539031', myntra: isFemale ? `https://www.myntra.com/handbags?rawQuery=${colorMyntra}%20women%20handbag` : `https://www.myntra.com/backpacks?rawQuery=${colorMyntra}%20men%20backpack`, meesho: isFemale ? `${colorDisplay} women sling bag` : `${colorDisplay} men backpack streetwear` },
    shoes:      { amzKw: isFemale ? `${colorDisplay} women sneakers chunky platform trending` : `${colorDisplay} men sneakers casual streetwear`, amzNode: '1983518031', myntra: isFemale ? `https://www.myntra.com/sneakers?rawQuery=${colorMyntra}%20women%20sneakers` : `https://www.myntra.com/sneakers?rawQuery=${colorMyntra}%20men%20sneakers`, meesho: isFemale ? `${colorDisplay} women chunky sneakers` : `${colorDisplay} men casual sneakers` },
    footwear:   { amzKw: isFemale ? `${colorDisplay} women sneakers heels sandals trending` : `${colorDisplay} men sneakers loafers casual`, amzNode: '1983518031', myntra: isFemale ? `https://www.myntra.com/sneakers?rawQuery=${colorMyntra}%20women%20footwear` : `https://www.myntra.com/sneakers?rawQuery=${colorMyntra}%20men%20footwear`, meesho: isFemale ? `${colorDisplay} women footwear trending` : `${colorDisplay} men footwear casual` },
    // ── MEN ── 2025 trending keywords
    shirt:      { amzKw: isFemale ? `${colorDisplay} women crop top coord set oversized` : `${colorDisplay} men oversized tshirt polo streetwear trending`, amzNode: '1968024031', myntra: isFemale ? `https://www.myntra.com/tops?rawQuery=${colorMyntra}%20women%20crop%20top` : `https://www.myntra.com/tshirts?rawQuery=${colorMyntra}%20men%20oversized%20tshirt`, meesho: isFemale ? `${colorDisplay} women crop top coord` : `${colorDisplay} men oversized tshirt polo` },
    pant:       { amzKw: isFemale ? `${colorDisplay} women baggy jeans palazzo wide leg` : `${colorDisplay} men cargo pants joggers streetwear trending`, amzNode: '1968024031', myntra: isFemale ? `https://www.myntra.com/jeans?rawQuery=${colorMyntra}%20women%20jeans` : `https://www.myntra.com/cargos?rawQuery=${colorMyntra}%20men%20cargo`, meesho: isFemale ? `${colorDisplay} women baggy jeans palazzo` : `${colorDisplay} men cargo joggers streetwear` },
    belt:       { amzKw: `${colorDisplay} men belt casual streetwear`, amzNode: '1968024031', myntra: `https://www.myntra.com/belts?rawQuery=${colorMyntra}%20men%20belt`, meesho: `${colorDisplay} men belt casual` },
  };

  const cfg = categoryConfig[category] || { amzKw: `${colorDisplay} ${isFemale ? 'women' : 'men'} ${category} oversized trending 2025`, amzNode: '1968024031', myntra: isFemale ? `https://www.myntra.com/women?rawQuery=${colorMyntra}%20women%20${category}` : `https://www.myntra.com/men?rawQuery=${colorMyntra}%20men%20${category}`, meesho: `${colorDisplay} ${isFemale ? 'women' : 'men'} ${category} trending` };

  // Build price-filtered URLs — optimized for best results
  const amzPriceParam = budget?.amzMax ? `%2Cp_36%3A-${budget.amzMax * 100}` : '';
  const fkPriceParam = budget?.fkMax ? `&p%5B%5D=facets.price_range.from%3D0&p%5B%5D=facets.price_range.to%3D${budget.fkMax}` : '';
  const myntraPriceParam = budget?.myntraMax ? `&p=price%5B0%5D%3D0%20TO%20${budget.myntraMax}` : '';

  // Curated top picks — highly relevant direct search URLs per color+category for ALL 4 platforms
  const topPicksMap = {
    'navy blue': {
      shirt:   { amz: `https://www.amazon.in/s?k=navy%20blue%20men%20oversized%20tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=navy%20blue%20men%20oversized%20tshirt&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=navy%20blue%20men%20oversized%20tshirt`, mee: 'https://meesho.com/search?q=navy+blue+men+oversized+tshirt' },
      pant:    { amz: `https://www.amazon.in/s?k=navy%20blue%20men%20cargo%20pants&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=navy%20blue%20men%20cargo%20pants&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/cargos?rawQuery=navy%20blue%20men%20cargo`, mee: 'https://meesho.com/search?q=navy+blue+men+cargo+pants' },
      dress:   { amz: `https://www.amazon.in/s?k=navy%20blue%20women%20coord%20set&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=navy%20blue%20women%20coord%20set&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/co-ords?rawQuery=navy%20blue%20women%20coord%20set`, mee: 'https://meesho.com/search?q=navy+blue+women+coord+set' },
    },
    'teal': {
      shirt:   { amz: `https://www.amazon.in/s?k=teal%20men%20oversized%20tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=teal%20men%20oversized%20tshirt&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=teal%20men%20oversized%20tshirt`, mee: 'https://meesho.com/search?q=teal+men+oversized+tshirt' },
      dress:   { amz: `https://www.amazon.in/s?k=teal%20women%20coord%20set%20maxi&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=teal%20women%20coord%20set&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/co-ords?rawQuery=teal%20women%20coord%20set`, mee: 'https://meesho.com/search?q=teal+women+coord+set' },
    },
    'rust': {
      shirt:   { amz: `https://www.amazon.in/s?k=rust%20orange%20men%20oversized%20tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=rust%20orange%20men%20oversized%20tshirt&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=rust%20orange%20men%20oversized%20tshirt`, mee: 'https://meesho.com/search?q=rust+orange+men+tshirt' },
      dress:   { amz: `https://www.amazon.in/s?k=rust%20women%20coord%20set%20maxi&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=rust%20women%20coord%20set&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/co-ords?rawQuery=rust%20women%20coord%20set`, mee: 'https://meesho.com/search?q=rust+women+coord+set' },
    },
    'cobalt blue': {
      shirt:   { amz: `https://www.amazon.in/s?k=cobalt%20blue%20men%20tshirt%20polo&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=cobalt%20blue%20men%20tshirt%20polo&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=cobalt%20blue%20men%20tshirt`, mee: 'https://meesho.com/search?q=cobalt+blue+men+tshirt+polo' },
      dress:   { amz: `https://www.amazon.in/s?k=cobalt%20blue%20women%20coord%20set&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=cobalt%20blue%20women%20coord%20set&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/co-ords?rawQuery=cobalt%20blue%20women%20coord%20set`, mee: 'https://meesho.com/search?q=cobalt+blue+women+coord+set' },
    },
    'forest green': {
      shirt:   { amz: `https://www.amazon.in/s?k=forest%20green%20men%20oversized%20tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=forest%20green%20men%20oversized%20tshirt&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=forest%20green%20men%20oversized%20tshirt`, mee: 'https://meesho.com/search?q=forest+green+men+oversized+tshirt' },
      kurti:   { amz: `https://www.amazon.in/s?k=forest%20green%20women%20kurti&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=forest%20green%20women%20kurti&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/kurtas?rawQuery=forest%20green%20women%20kurti`, mee: 'https://meesho.com/search?q=forest+green+women+kurti' },
    },
    'mustard': {
      shirt:   { amz: `https://www.amazon.in/s?k=mustard%20yellow%20men%20polo%20tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=mustard%20yellow%20men%20polo%20tshirt&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=mustard%20yellow%20men%20polo%20tshirt`, mee: 'https://meesho.com/search?q=mustard+yellow+men+polo+tshirt' },
      dress:   { amz: `https://www.amazon.in/s?k=mustard%20yellow%20women%20coord%20set&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=mustard%20yellow%20women%20coord%20set&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/co-ords?rawQuery=mustard%20yellow%20women%20coord%20set`, mee: 'https://meesho.com/search?q=mustard+yellow+women+coord+set' },
    },
    'burgundy': {
      shirt:   { amz: `https://www.amazon.in/s?k=burgundy%20maroon%20men%20oversized%20tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=burgundy%20maroon%20men%20oversized%20tshirt&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=burgundy%20men%20oversized%20tshirt`, mee: 'https://meesho.com/search?q=burgundy+maroon+men+tshirt' },
      lehenga: { amz: `https://www.amazon.in/s?k=burgundy%20women%20lehenga%20choli&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=burgundy%20women%20lehenga%20choli&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/lehenga-cholis?rawQuery=burgundy%20women%20lehenga`, mee: 'https://meesho.com/search?q=burgundy+women+lehenga+choli' },
    },
    'coral': {
      dress:   { amz: `https://www.amazon.in/s?k=coral%20women%20maxi%20dress%20coord&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=coral%20women%20coord%20set&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/co-ords?rawQuery=coral%20women%20coord%20set`, mee: 'https://meesho.com/search?q=coral+women+coord+set+maxi' },
      shirt:   { amz: `https://www.amazon.in/s?k=coral%20men%20polo%20tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/search?q=coral%20men%20polo%20tshirt&sort=popularity_desc${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=coral%20men%20polo%20tshirt`, mee: 'https://meesho.com/search?q=coral+men+polo+tshirt' },
    },
  };

  const colorKey = colorDisplay.toLowerCase();
  const topPick = topPicksMap[colorKey]?.[category];

  const links = [
    { name: 'Amazon',   url: topPick?.amz || `https://www.amazon.in/s?k=${encodeURIComponent(cfg.amzKw)}&rh=n%3A${cfg.amzNode}${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, icon: '🛒', bg: isDark ? 'bg-orange-500/20 hover:bg-orange-500/40 border-orange-500/30 text-orange-300' : 'bg-orange-50 hover:bg-orange-100 border-orange-300 text-orange-700 font-bold' },
    { name: 'Flipkart', url: topPick?.fk  || `https://www.flipkart.com/search?q=${encodeURIComponent(colorDisplay + ' ' + category)}&sort=popularity_desc${fkPriceParam}`, icon: '🏪', bg: isDark ? 'bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/30 text-blue-300' : 'bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 font-bold' },
    { name: 'Myntra',   url: topPick?.myn || `${cfg.myntra}${myntraPriceParam}`, icon: '👗', bg: isDark ? 'bg-pink-500/20 hover:bg-pink-500/40 border-pink-500/30 text-pink-300' : 'bg-pink-50 hover:bg-pink-100 border-pink-300 text-pink-700 font-bold' },
    { name: 'Meesho',   url: topPick?.mee || `https://meesho.com/search?q=${encodeURIComponent(cfg.meesho)}`, icon: '🛍️', bg: isDark ? 'bg-purple-500/20 hover:bg-purple-500/40 border-purple-500/30 text-purple-300' : 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700 font-bold' },
  ];

  return (
    <div className="mt-2 space-y-2">
      {/* Top Pick badge when curated URL available */}
      {topPick && (
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full
            ${isDark ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-green-100 border-green-400 text-green-700'}`}>
            ⭐ {t('topPicks')}
          </span>
        </div>
      )}
      {/* Budget filter pills */}
      <div className="flex gap-1.5 flex-wrap">
        {budgets.map((b) => (
          <button
            key={b.label}
            onClick={(e) => { e.stopPropagation(); setBudget(b.label === 'Any' ? null : b); }}
            className={`px-2 py-0.5 rounded-full text-xs font-bold border transition-all ${
              (b.label === 'Any' && !budget) || budget?.label === b.label
                ? isDark ? 'bg-purple-500/40 border-purple-400 text-purple-200' : 'bg-purple-600 border-purple-600 text-white shadow-sm'
                : isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white/70' : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>
      {/* Shop links */}
      <div className="flex gap-1.5 flex-wrap">
        {links.map((link) => (
          <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:scale-105 ${link.bg}`}>
            <span>{link.icon}</span><span>{link.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Color Card (compact, tap to expand) ─────────────────────
function ColorCard({ color, category, gender, isDark, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('sg_saved_colors') || '[]');
      return s.some(c => c.hex === color.hex);
    } catch { return false; }
  });

  const toggleSave = (e) => {
    e.stopPropagation();
    try {
      const s = JSON.parse(localStorage.getItem('sg_saved_colors') || '[]');
      let updated;
      if (saved) {
        updated = s.filter(c => c.hex !== color.hex);
      } else {
        updated = [...s, { name: color.name, hex: color.hex, category, gender }];
      }
      localStorage.setItem('sg_saved_colors', JSON.stringify(updated));
      setSaved(!saved);
    } catch {}
  };

  const cardCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const nameCls = isDark ? 'text-white' : 'text-gray-800';
  const hexCls  = isDark ? 'text-white/30' : 'text-gray-400';
  const chevronCls = isDark ? 'text-white/30' : 'text-gray-400';
  const hexBorderCls = isDark ? 'border-white/10' : 'border-gray-200';
  const dividerCls = isDark ? 'border-white/5' : 'border-gray-100';
  const reasonCls = isDark ? 'text-white/50' : 'text-gray-500';

  return (
    <div className={`${cardCls} ${className} rounded-2xl overflow-hidden transition-all duration-300 hover:border-purple-500/40`} onClick={() => setExpanded(e => !e)}>
      <div className="flex items-center gap-3 p-3 cursor-pointer">
        <div className={`w-12 h-12 rounded-xl flex-shrink-0 shadow-lg border ${hexBorderCls} swatch-pop`} style={{ backgroundColor: color.hex }} />
        <div className="flex-1 min-w-0">
          <p className={`${nameCls} font-bold text-sm truncate`}>{color.name}</p>
          <p className={`${hexCls} text-xs font-mono`}>{color.hex}</p>
        </div>
        <button
          onClick={toggleSave}
          className={`text-lg transition-transform hover:scale-125 ${saved ? 'text-pink-400' : isDark ? 'text-white/20 hover:text-pink-400' : 'text-gray-300 hover:text-pink-400'}`}
          title={saved ? 'Remove from saved' : 'Save color'}
        >
          {saved ? '❤️' : '🤍'}
        </button>
        <span className={`${chevronCls} text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </div>
      {expanded && (
        <div className={`px-3 pb-3 border-t ${dividerCls} pt-2 scale-in`} onClick={e => e.stopPropagation()}>
          {color.reason && <p className={`${reasonCls} text-xs mb-2 leading-relaxed`}>{color.reason}</p>}
          <ShoppingLinks colorName={color.name} category={category} gender={gender} />
        </div>
      )}
    </div>
  );
}

// ── Outfit Card ──────────────────────────────────────────────
function OutfitCard({ combo, index, isDark }) {
  const colors = ["purple", "pink", "blue", "emerald", "amber"];
  const color = colors[index % colors.length];
  const colorMap = {
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    pink: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  };
  const topItem = combo.shirt || combo.top || combo.dress || "";
  const bottomItem = combo.pant || combo.bottom || "";
  const headingCls = isDark ? 'text-white' : 'text-gray-800';
  const subCls = isDark ? 'text-white/60' : 'text-gray-500';
  const badgeCls = isDark ? 'bg-white/10 text-white/80' : 'bg-white/60 text-gray-700';
  const vibeCls = isDark ? 'text-white/30' : 'text-gray-400';

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-4`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1">
          <p className={`${headingCls} font-bold text-sm mb-1`}>{topItem}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {bottomItem && <span className={subCls}>👖 {bottomItem}</span>}
            {combo.shoes && <span className={subCls}>👟 {combo.shoes}</span>}
            {combo.dupatta && combo.dupatta !== "-" && <span className={subCls}>🧣 {combo.dupatta}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`${badgeCls} text-xs px-2 py-1 rounded-full`}>{combo.occasion}</span>
          {combo.vibe && <p className={`${vibeCls} text-xs mt-1 italic`}>{combo.vibe}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Color Palette Download ───────────────────────────────────
function downloadPalette(colors, skinTone) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#050816';
  ctx.fillRect(0, 0, 600, 200);

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`StyleGuru AI — ${skinTone} Skin Palette`, 20, 30);
  ctx.fillStyle = '#a855f7';
  ctx.font = '11px Arial';
  ctx.fillText('styleguruai.in', 20, 48);

  // Color swatches
  const swatchW = 70, swatchH = 100, startX = 20, startY = 65, gap = 10;
  colors.slice(0, 7).forEach((color, i) => {
    const x = startX + i * (swatchW + gap);
    ctx.fillStyle = color.hex;
    ctx.beginPath();
    ctx.roundRect(x, startY, swatchW, swatchH, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Arial';
    ctx.fillText(color.name?.slice(0, 10) || '', x + 4, startY + swatchH + 14);
    ctx.fillStyle = '#888';
    ctx.font = '8px Arial';
    ctx.fillText(color.hex, x + 4, startY + swatchH + 25);
  });

  const link = document.createElement('a');
  link.download = `styleguruai-${skinTone}-palette.png`;
  link.href = canvas.toDataURL();
  link.click();
}

// ── Celebrity Skin Match ─────────────────────────────────────
const CELEBRITY_MAP = {
  fair: {
    male:   [
      { name: 'Ranbir Kapoor', tip: 'Navy, burgundy, olive green, charcoal' },
      { name: 'Shahid Kapoor', tip: 'Deep maroon, forest green, royal blue' },
      { name: 'Hrithik Roshan', tip: 'White, navy, teal, mustard' },
    ],
    female: [
      { name: 'Alia Bhatt', tip: 'Pastels, blush pink, lavender, navy' },
      { name: 'Shraddha Kapoor', tip: 'Mint green, coral, sky blue, white' },
      { name: 'Anushka Sharma', tip: 'Dusty rose, sage green, cobalt blue' },
    ],
  },
  light: {
    male:   [
      { name: 'Varun Dhawan', tip: 'Sky blue, olive, rust, maroon' },
      { name: 'Tiger Shroff', tip: 'White, navy, coral, forest green' },
      { name: 'Kartik Aaryan', tip: 'Mustard, teal, burgundy, sky blue' },
    ],
    female: [
      { name: 'Katrina Kaif', tip: 'Coral, peach, sky blue, mint green' },
      { name: 'Jacqueline Fernandez', tip: 'Bright yellow, hot pink, white, teal' },
      { name: 'Kriti Sanon', tip: 'Olive, rust, mustard, navy blue' },
    ],
  },
  medium: {
    male:   [
      { name: 'Shah Rukh Khan', tip: 'White, navy, maroon, olive green' },
      { name: 'Salman Khan', tip: 'Sky blue, white, rust, forest green' },
      { name: 'Ranveer Singh', tip: 'Bold colors — coral, mustard, teal' },
    ],
    female: [
      { name: 'Deepika Padukone', tip: 'Terracotta, rust, teal, mustard' },
      { name: 'Kareena Kapoor', tip: 'White, coral, sky blue, olive green' },
      { name: 'Madhuri Dixit', tip: 'Maroon, navy, forest green, coral' },
    ],
  },
  olive: {
    male:   [
      { name: 'Ajay Devgn', tip: 'White, sky blue, olive, rust' },
      { name: 'Akshay Kumar', tip: 'Bright colors — yellow, coral, white' },
      { name: 'Anil Kapoor', tip: 'White, royal blue, coral, cream' },
    ],
    female: [
      { name: 'Priyanka Chopra', tip: 'Olive, burnt orange, forest green' },
      { name: 'Sushmita Sen', tip: 'White, royal blue, coral, gold' },
      { name: 'Shilpa Shetty', tip: 'Bright yellow, white, teal, coral' },
    ],
  },
  brown: {
    male:   [
      { name: 'Nawazuddin Siddiqui', tip: 'White, sky blue, cobalt, bright yellow' },
      { name: 'Irrfan Khan', tip: 'White, royal blue, emerald, cream' },
      { name: 'Manoj Bajpayee', tip: 'White, bright blue, coral, gold' },
    ],
    female: [
      { name: 'Bipasha Basu', tip: 'Cobalt blue, fuchsia, gold, white' },
      { name: 'Kajol', tip: 'White, royal blue, bright yellow, coral' },
      { name: 'Tabu', tip: 'Emerald, white, cobalt blue, gold' },
    ],
  },
  dark: {
    male:   [
      { name: 'Vijay (Thalapathy)', tip: 'White, bright yellow, royal blue, gold' },
      { name: 'Rajinikanth', tip: 'White, cream, bright colors, gold' },
      { name: 'Dhanush', tip: 'White, cobalt blue, bright yellow, coral' },
    ],
    female: [
      { name: 'Nandita Das', tip: 'Bright jewel tones, white, gold, red' },
      { name: 'Vidya Balan', tip: 'White, bright yellow, royal blue, coral' },
      { name: 'Konkona Sen Sharma', tip: 'White, emerald, cobalt blue, gold' },
    ],
  },
};

// ── Profile Hero Card ────────────────────────────────────────
function ProfileCard({ analysis, recommendations, uploadedImage, isFemale, isSeasonal, isDark, photoQuality }) {
  const { t } = useLanguage();
  const toneColors = { fair: "#F5DEB3", light: "#D2A679", medium: "#C68642", olive: "#A0724A", brown: "#7B4F2E", dark: "#4A2C0A" };
  const wrapperCls = isDark
    ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10'
    : 'bg-white border border-gray-200 shadow-sm';
  const labelCls = isDark ? 'text-white/40' : 'text-gray-500';
  const headingCls = isDark ? 'text-white' : 'text-gray-800';
  const skinLabelCls = isDark ? 'text-white/40' : 'text-gray-400';
  const imgBorderCls = isDark ? 'border-white/20' : 'border-gray-200';
  const summaryBgCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-200';
  const summaryCls = isDark ? 'text-white/60' : 'text-gray-500';

  const celebList = CELEBRITY_MAP[analysis.skin_tone.category]?.[isFemale ? 'female' : 'male'] || [];
  // Pick celebrity based on undertone to add variety
  const undertoneIdx = analysis.skin_tone.undertone === 'warm' ? 0 : analysis.skin_tone.undertone === 'cool' ? 1 : 2;
  const celeb = celebList[undertoneIdx % celebList.length];

  // Style Score — dynamic based on actual quality score + confidence
  const qualityScore = photoQuality?.score || 85;
  const confidenceBonus = analysis.skin_tone.confidence === 'high' ? 10 : analysis.skin_tone.confidence === 'medium' ? 5 : 0;
  const rawScore = Math.round((qualityScore * 0.7) + confidenceBonus + (analysis.skin_tone.brightness_score ? Math.min(10, analysis.skin_tone.brightness_score / 25) : 5));
  const styleScore = Math.min(98, Math.max(55, rawScore));

  // WhatsApp share
  const handleWhatsAppShare = () => {
    const skinTone = analysis.skin_tone.category;
    const undertone = analysis.skin_tone.undertone;
    const season = analysis.skin_tone.color_season;
    const celebName = celeb?.name || celebList[0]?.name || '';
    const msg = `✨ My StyleGuru AI Style Profile!\n\n🎨 Skin Tone: ${skinTone} (${undertone} undertone)\n🍂 Color Season: ${season}\n⭐ Celebrity Match: ${celebName}\n💯 Style Score: ${styleScore}/100\n\nGet your FREE AI style analysis 👇\nhttps://www.styleguruai.in`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className={`relative overflow-hidden ${wrapperCls} rounded-2xl p-4`}>
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: toneColors[analysis.skin_tone.category] }} />
      <div className="flex items-center gap-4">
        {uploadedImage && (
          <div className="relative flex-shrink-0">
            <img src={uploadedImage} alt="Your photo" className={`w-20 h-20 object-cover rounded-2xl border-2 ${imgBorderCls} shadow-xl`} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900" style={{ backgroundColor: toneColors[analysis.skin_tone.category] }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`${labelCls} text-xs uppercase tracking-widest mb-0.5`}>
            {isSeasonal ? 'Seasonal' : isFemale ? '👩 Female' : '👨 Male'} Profile
          </p>
          <h2 className={`${headingCls} text-2xl font-black capitalize`}>
            {analysis.skin_tone.category} <span className={`${skinLabelCls} font-light text-lg`}>Skin</span>
          </h2>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${isDark ? 'bg-purple-500/20 border-purple-500/30 text-purple-200' : 'bg-purple-100 border-purple-400 text-purple-800 font-semibold'}`}>{analysis.skin_tone.undertone}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? 'bg-pink-500/20 border-pink-500/30 text-pink-200' : 'bg-pink-100 border-pink-400 text-pink-800 font-semibold'}`}>🍂 {analysis.skin_tone.color_season}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              analysis.skin_tone.confidence === "high"
                ? isDark ? "bg-green-500/20 border-green-500/30 text-green-300" : "bg-green-100 border-green-500 text-green-800 font-semibold"
                : isDark ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-300" : "bg-yellow-100 border-yellow-500 text-yellow-800 font-semibold"
            }`}>
              {analysis.skin_tone.confidence === "high" ? "✓ High" : "~ Medium"}
            </span>
          </div>
        </div>
      </div>

      {/* Style Score */}
      <div className={`mt-3 rounded-xl p-3 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center justify-between mb-1.5">
          <p className={`text-xs font-bold ${isDark ? 'text-white/70' : 'text-gray-700'}`}>💯 {t('styleScore')}</p>
          <span className="text-purple-400 font-black text-sm">{styleScore}/100</span>
        </div>
        <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
          <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 fill-bar" style={{ '--target-width': `${styleScore}%`, width: `${styleScore}%` }} />
        </div>
      </div>

      {/* Celebrity Match */}
      {celeb && (
        <div className={`mt-2 rounded-xl p-3 border flex items-center gap-3 ${isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
          <span className="text-2xl">🌟</span>
          <div className="flex-1">
            <p className={`text-xs font-bold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>⭐ {t('celebMatch')}</p>
            <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{t(celeb?.name)}</p>
            <p className={`text-xs ${isDark ? 'text-amber-100/60' : 'text-amber-700'}`}>{celeb?.tip}</p>
          </div>
        </div>
      )}

      {/* Summary */}
      {(recommendations.summary || recommendations.description) && (
        <div className={`mt-2 ${summaryBgCls} rounded-xl p-3`}>
          <p className={`${summaryCls} text-xs leading-relaxed`}>{recommendations.summary || recommendations.description}</p>
        </div>
      )}

      {/* WhatsApp Share + Download Style Card */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleWhatsAppShare}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl text-green-400 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>📱</span>
          <span>WhatsApp</span>
        </button>
        <button
          onClick={() => {
            // Generate shareable style card
            const canvas = document.createElement('canvas');
            canvas.width = 800; canvas.height = 500;
            const ctx = canvas.getContext('2d');
            // Background gradient
            const grad = ctx.createLinearGradient(0, 0, 800, 500);
            grad.addColorStop(0, '#0f0c29'); grad.addColorStop(0.5, '#302b63'); grad.addColorStop(1, '#24243e');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, 800, 500);
            // Skin tone circle
            const skinHex = analysis.skin_color?.hex || '#C68642';
            ctx.beginPath(); ctx.arc(120, 180, 70, 0, Math.PI * 2);
            ctx.fillStyle = skinHex; ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 3; ctx.stroke();
            // Text
            ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '14px Arial'; ctx.fillText('MY STYLE PROFILE', 220, 100);
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 42px Arial';
            ctx.fillText(`${analysis.skin_tone.category.charAt(0).toUpperCase() + analysis.skin_tone.category.slice(1)} Skin`, 220, 155);
            ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '20px Arial';
            ctx.fillText(`${analysis.skin_tone.undertone} undertone  •  ${analysis.skin_tone.color_season}`, 220, 195);
            ctx.fillStyle = '#a855f7'; ctx.font = 'bold 28px Arial';
            ctx.fillText(`Style Score: ${styleScore}/100`, 220, 245);
            // Color palette
            const colors = recommendations?.best_shirt_colors?.slice(0, 5) || [];
            colors.forEach((c, i) => {
              ctx.beginPath(); ctx.arc(220 + i * 70, 320, 28, 0, Math.PI * 2);
              ctx.fillStyle = c.hex; ctx.fill();
              ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke();
            });
            ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '13px Arial';
            ctx.fillText('Your Best Colors', 220, 380);
            // Branding
            ctx.fillStyle = '#a855f7'; ctx.font = 'bold 16px Arial';
            ctx.fillText('styleguruai.in', 620, 470);
            // Download
            const link = document.createElement('a');
            link.download = `styleguruai-${analysis.skin_tone.category}-profile.png`;
            link.href = canvas.toDataURL(); link.click();
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-400 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>🎨</span>
          <span>Save Card</span>
        </button>
      </div>
    </div>
  );
}

// ── Complete the Look ────────────────────────────────────────
function CompleteTheLook({ shirtColor, pantColors, isDark, gender }) {
  const { t } = useLanguage();
  const AMAZON_TAG = 'styleguruai-21';
  const isFemale = gender === 'female';
  const pant = pantColors?.[0];
  if (!shirtColor) return null;

  const items = [
    { label: isFemale ? '👚 Top' : '👕 T-Shirt', color: shirtColor, cat: isFemale ? 'top' : 'shirt' },
    pant ? { label: isFemale ? '👖 Bottom' : '👖 Cargo/Jogger', color: pant, cat: isFemale ? 'bottom' : 'pant' } : null,
    { label: isFemale ? '👟 Sneakers' : '👟 Sneakers', color: { name: 'White', hex: '#FFFFFF' }, cat: 'shoes' },
  ].filter(Boolean);

  const cardCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const labelCls = isDark ? 'text-white/50' : 'text-gray-500';
  const nameCls = isDark ? 'text-white' : 'text-gray-800';

  return (
    <div className={`${cardCls} rounded-2xl p-4`}>
      <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${labelCls}`}>✨ {t('completeLook')}</p>
      <div className="flex gap-2 mb-3">
        {items.map((item, i) => (
          <div key={i} className="flex-1 text-center">
            <div className="w-10 h-10 rounded-xl mx-auto mb-1 border border-white/20 shadow" style={{ backgroundColor: item.color.hex }} />
            <p className={`text-xs font-semibold ${nameCls}`}>{item.label}</p>
            <p className={`text-xs ${labelCls} truncate`}>{item.color.name}</p>
          </div>
        ))}
      </div>
      {/* Shop the full look */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { name: '🛒 Amazon', url: `https://www.amazon.in/s?k=${encodeURIComponent(shirtColor.name + (isFemale ? ' women coord set' : ' men outfit set'))}&rh=n%3A1968024031&sort=review-rank&tag=${AMAZON_TAG}`, bg: isDark ? 'bg-orange-500/20 border-orange-500/30 text-orange-300' : 'bg-orange-50 border-orange-300 text-orange-700 font-bold' },
          { name: '🏪 Flipkart', url: `https://www.flipkart.com/search?q=${encodeURIComponent(shirtColor.name + (isFemale ? ' women coord set' : ' men outfit'))}&sort=popularity_desc`, bg: isDark ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700 font-bold' },
          { name: '👗 Myntra', url: `https://www.myntra.com/${isFemale ? 'co-ords' : 'tshirts'}?rawQuery=${shirtColor.name.toLowerCase().replace(/\s+/g, '%20')}%20${isFemale ? 'women%20coord%20set' : 'men%20oversized'}`, bg: isDark ? 'bg-pink-500/20 border-pink-500/30 text-pink-300' : 'bg-pink-50 border-pink-300 text-pink-700 font-bold' },
          { name: '🛍️ Meesho', url: `https://meesho.com/search?q=${encodeURIComponent(shirtColor.name + (isFemale ? ' women coord set' : ' men outfit'))}`, bg: isDark ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-300 text-purple-700 font-bold' },
        ].map(link => (
          <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:scale-105 ${link.bg}`}>
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Colors Tab ───────────────────────────────────────────────
function ColorsTab({ recommendations, isFemale, isSeasonal, effectiveGender, shirtCategory, pantCategory, isDark }) {
  const { t } = useLanguage();
  const avoidColors = recommendations.colors_to_avoid || [];
  const sectionLabelCls = isDark ? 'text-white/50' : 'text-gray-500';

  if (isSeasonal) {
    const seasonalColors = recommendations.seasonal_colors || [];
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4">
          <p className="text-amber-200 font-bold text-sm mb-1">{recommendations.title}</p>
          <p className="text-amber-100/50 text-xs">{recommendations.description}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {(recommendations.fabrics_recommended || []).map((f, i) => <span key={i} className="bg-green-500/20 text-green-200 text-xs px-2 py-0.5 rounded-full">{f}</span>)}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {seasonalColors.map((color, i) => <ColorCard key={i} color={color} category={shirtCategory} gender={effectiveGender} isDark={isDark} />)}
        </div>
      </div>
    );
  }

  if (isFemale) {
    const sections = [
      { title: 'dressColors', colors: recommendations.best_dress_colors || [], cat: 'dress' },
      { title: 'topColors', colors: recommendations.best_top_colors || [], cat: 'top' },
      { title: 'kurtiColors', colors: recommendations.best_kurti_colors || [], cat: 'kurti' },
      { title: 'lehengaColors', colors: recommendations.best_lehenga_colors || [], cat: 'lehenga' },
      { title: 'bottomColors', colors: recommendations.best_bottom_colors || recommendations.best_pant_colors || [], cat: 'bottom' },
    ].filter(s => s.colors.length > 0);

    return (
      <div className="space-y-5">
        {sections.map((sec) => (
          <div key={sec.title}>
            <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>{t(sec.title)}</p>
            <div className="grid grid-cols-1 gap-2">
              {sec.colors.map((color, i) => <ColorCard key={i} color={color} category={sec.cat} gender="female" isDark={isDark} />)}
            </div>
          </div>
        ))}
        {avoidColors.length > 0 && (
          <div>
            <p className="text-red-400/70 text-xs font-semibold uppercase tracking-wide mb-2">🚫 {t('avoidThese')}</p>
            <div className="grid grid-cols-1 gap-2">
              {avoidColors.map((color, i) => <ColorCard key={i} color={color} category="dress" gender="female" isDark={isDark} />)}
            </div>
          </div>
        )}

        {/* Complete the Look — Female */}
        {(() => {
          const topColor = (recommendations.best_dress_colors || recommendations.best_top_colors || [])[0];
          const bottomColor = (recommendations.best_bottom_colors || recommendations.best_pant_colors || [])[0];
          return topColor ? <CompleteTheLook shirtColor={topColor} pantColors={bottomColor ? [bottomColor] : []} isDark={isDark} gender="female" /> : null;
        })()}
      </div>
    );
  }

  // Male
  const shirtColors = recommendations.best_shirt_colors || [];
  const pantColors = recommendations.best_pant_colors || recommendations.base_pant_colors || [];
  return (
    <div className="space-y-5">
      {shirtColors.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>👕 T-Shirt / Top Colors</p>
          <div className="grid grid-cols-1 gap-2">
            {shirtColors.map((color, i) => <ColorCard key={i} color={color} category="shirt" gender="male" isDark={isDark} className={`stagger-${Math.min(i+1,6)}`} />)}
          </div>
        </div>
      )}
      {pantColors.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>👖 Pants / Cargo Colors</p>
          <div className="grid grid-cols-1 gap-2">
            {pantColors.map((color, i) => <ColorCard key={i} color={color} category="pant" gender="male" isDark={isDark} />)}
          </div>
        </div>
      )}
      {avoidColors.length > 0 && (
        <div>
          <p className="text-red-400/70 text-xs font-semibold uppercase tracking-wide mb-2">🚫 Avoid These</p>
          <div className="grid grid-cols-1 gap-2">
            {avoidColors.map((color, i) => <ColorCard key={i} color={color} category="shirt" gender="male" isDark={isDark} />)}
          </div>
        </div>
      )}

      {/* Complete the Look */}
      {shirtColors.length > 0 && (
        <CompleteTheLook shirtColor={shirtColors[0]} pantColors={pantColors} isDark={isDark} gender="male" />
      )}
    </div>
  );
}

// ── Outfits Tab ──────────────────────────────────────────────
function OutfitsTab({ recommendations, isFemale, isSeasonal, seasonalGender, styleTips, occasionAdvice, ethnicWear, sareeSuggestions, isDark, bodyTypeTips = [], bodyType = null, userOccasion = 'casual' }) {
  const { t } = useLanguage();
  let outfits = [];
  if (isSeasonal) outfits = seasonalGender === 'female' ? (recommendations.female_outfits || []) : (recommendations.male_outfits || []);
  else if (isFemale) outfits = recommendations.outfit_combos || [];
  else outfits = recommendations.outfit_combinations || recommendations.outfit_combos || [];

  const sectionLabelCls = isDark ? 'text-white/50' : 'text-gray-500';
  const cardBgCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const bodyTextCls = isDark ? 'text-white/60' : 'text-gray-500';
  const mutedCls = isDark ? 'text-white/40' : 'text-gray-400';
  const tipTextCls = isDark ? 'text-white/70' : 'text-gray-600';

  // Find occasion-specific advice
  const occasionKey = Object.keys(occasionAdvice).find(k => k.toLowerCase().includes(userOccasion)) || null;
  const featuredAdvice = occasionKey ? occasionAdvice[occasionKey] : null;

  return (
    <div className="space-y-5">
      {/* Featured occasion advice (highlighted) */}
      {featuredAdvice && (
        <div className={`rounded-2xl p-4 border-2 border-purple-500/40 ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
          <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
            ✨ For Your {occasionKey} Look
          </p>
          <p className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-800'}`}>{featuredAdvice}</p>
        </div>
      )}
      {/* Outfit combos */}
      {outfits.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>🧥 {t('outfitCombos')}</p>
          <div className="space-y-2">
            {outfits.map((combo, i) => <OutfitCard key={i} combo={combo} index={i} isDark={isDark} />)}
          </div>
        </div>
      )}

      {/* Occasion advice */}
      {Object.keys(occasionAdvice).length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>📅 {t('whatToWear')}</p>
          <div className="space-y-2">
            {Object.entries(occasionAdvice).map(([occasion, advice], i) => (
              <div key={i} className={`${cardBgCls} rounded-xl p-3`}>
                <p className="text-purple-300 text-xs font-bold uppercase tracking-wide mb-1">{occasion}</p>
                <p className={`${bodyTextCls} text-sm`}>{advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Style tips */}
      {styleTips.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>💡 {t('styleTips')}</p>
          <div className="space-y-2">
            {styleTips.map((tip, i) => (
              <div key={i} className={`flex items-start gap-2 ${cardBgCls} rounded-xl p-3`}>
                <span className="text-purple-400 flex-shrink-0">✦</span>
                <p className={`${tipTextCls} text-sm leading-relaxed`}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ethnic wear */}
      {/* Body Type Tips */}
      {bodyTypeTips.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>
            👤 {bodyType === 'slim' ? 'Slim Body' : bodyType === 'athletic' ? 'Athletic Body' : bodyType === 'plus' ? 'Plus Size' : 'Body Type'} Tips
          </p>
          <div className={`rounded-2xl p-4 space-y-2 border ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'}`}>
            {bodyTypeTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-blue-400 flex-shrink-0">✦</span>
                <p className={`text-sm ${isDark ? 'text-blue-100/70' : 'text-blue-800'}`}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {ethnicWear.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>🪷 {t('ethnicWear')}</p>
          <div className={`rounded-2xl p-4 space-y-2 border ${isDark ? 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
            {ethnicWear.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-500 flex-shrink-0">★</span>
                <p className={`text-sm ${isDark ? 'text-amber-100/70' : 'text-amber-800'}`}>{typeof s === "string" ? s : `${s.type}: ${s.colors} — ${s.occasion}`}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saree suggestions (female) */}
      {sareeSuggestions.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>🥻 {t('sareeSuits')}</p>
          <div className="space-y-2">
            {sareeSuggestions.map((item, i) => (
              <div key={i} className={`${isDark ? 'bg-white/5' : 'bg-white shadow-sm'} rounded-xl p-3 border border-pink-500/20`}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className={`${isDark ? 'text-pink-200' : 'text-pink-700'} font-bold text-sm`}>{item.type}</p>
                    <p className={`${isDark ? 'text-white/50' : 'text-gray-500'} text-xs mt-0.5`}>🎨 {item.colors}</p>
                    <p className={`${mutedCls} text-xs`}>{item.reason}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${isDark ? 'bg-pink-500/20 text-pink-300 border-pink-500/20' : 'bg-pink-100 text-pink-700 border-pink-300 font-semibold'}`}>{item.occasion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Accessories Tab ──────────────────────────────────────────
function AccessoriesTab({ recommendations, isFemale, makeupSuggestions, isDark }) {
  const { t } = useLanguage();
  const accessories = recommendations.accessories || [];
  const accentColors = recommendations.accent_colors || [];

  const getAccCat = (typeLC, isFem) => {
    if (typeLC.includes('jewel') || typeLC.includes('earring') || typeLC.includes('necklace') || typeLC.includes('bangle') || typeLC.includes('ring') || typeLC.includes('bracelet')) return 'jewellery';
    if (typeLC.includes('bag') || typeLC.includes('purse') || typeLC.includes('clutch')) return isFem ? 'handbag' : 'bag';
    if (typeLC.includes('footwear') || typeLC.includes('shoe') || typeLC.includes('heel') || typeLC.includes('sandal')) return 'footwear';
    if (typeLC.includes('watch')) return 'watch';
    if (typeLC.includes('dupatta') || typeLC.includes('scarf') || typeLC.includes('stole')) return 'dupatta';
    if (typeLC.includes('belt')) return 'belt';
    if (typeLC.includes('wallet')) return 'wallet';
    if (typeLC.includes('sunglass')) return 'sunglasses';
    if (typeLC.includes('backpack')) return 'bag';
    return 'accessories';
  };

  const sectionLabelCls = isDark ? 'text-white/50' : 'text-gray-500';
  const cardBgCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const headingCls = isDark ? 'text-white' : 'text-gray-800';
  const subCls = isDark ? 'text-white/50' : 'text-gray-500';
  const mutedCls = isDark ? 'text-white/30' : 'text-gray-400';
  const emptyTextCls = isDark ? 'text-white/40' : 'text-gray-400';

  return (
    <div className="space-y-5">
      {/* Female accessories */}
      {isFemale && accessories.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>👜 Accessories & Jewellery</p>
          <div className="space-y-2">
            {accessories.map((item, i) => {
              const typeLC = (item.type || '').toLowerCase();
              const cat = getAccCat(typeLC, true);
              const searchTerm = item.suggestion || item.colors || item.type;
              return (
                <div key={i} className={`${cardBgCls} rounded-xl p-3`}>
                  <p className="text-purple-300 font-bold text-sm">{item.type}</p>
                  <p className={`${subCls} text-xs mt-0.5`}>{item.suggestion || item.colors}</p>
                  {item.reason && <p className={`${mutedCls} text-xs`}>{item.reason}</p>}
                  <ShoppingLinks colorName={searchTerm} category={cat} gender="female" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Male accent colors / accessories */}
      {!isFemale && accentColors.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>⌚ Accessories For You</p>
          <div className="space-y-2">
            {accentColors.map((item, i) => {
              const typeLC = (item.type || '').toLowerCase();
              const cat = getAccCat(typeLC, false);
              const searchTerm = item.suggestion || item.name || item.type;
              return (
                <div key={i} className={`${cardBgCls} rounded-xl p-3`}>
                  <p className="text-purple-300 font-bold text-sm">{item.type}</p>
                  <p className={`${subCls} text-xs mt-0.5`}>{item.name}</p>
                  {item.reason && <p className={`${mutedCls} text-xs`}>{item.reason}</p>}
                  <ShoppingLinks colorName={searchTerm} category={cat} gender="male" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Makeup (female) */}
      {isFemale && makeupSuggestions.length > 0 && (
        <div>
          <p className={`${sectionLabelCls} text-xs font-semibold uppercase tracking-wide mb-2`}>💄 Makeup Suggestions</p>
          <div className="space-y-2">
            {makeupSuggestions.map((item, i) => (
              <div key={i} className={`${isDark ? 'bg-white/5' : 'bg-white shadow-sm'} rounded-xl p-3 border border-rose-500/20`}>
                <p className="text-rose-200 font-bold text-sm">{item.product}</p>
                <p className={`${subCls} text-xs mt-0.5`}>{item.shade || item.shades}</p>
                {item.brands && <p className={`${mutedCls} text-xs`}>Brands: {item.brands}</p>}
                {item.tip && <p className={`${isDark ? 'text-white/40' : 'text-gray-400'} text-xs mt-1 italic`}>💡 {item.tip}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isFemale && accentColors.length === 0 && (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">⌚</p>
          <p className={`${emptyTextCls} text-sm`}>No accessories data available</p>
        </div>
      )}
    </div>
  );
}



// ── Main ResultsDisplay ──────────────────────────────────────
function ResultsDisplay({ data, uploadedImage, onReset }) {
  const { language, t } = useLanguage();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState('colors');
  const [showConfetti, setShowConfetti] = useState(() => {
    const isFirst = !localStorage.getItem('sg_analysis_count') || localStorage.getItem('sg_analysis_count') === '1';
    return isFirst;
  });
  const [shareStatus, setShareStatus] = useState(null);

  // Normalize data to handle both { analysis: { skin_tone } } and { skin_tone } root formats
  const normalizedData = useMemo(() => {
    if (!data) return null;
    let base = { ...data };
    
    // If skin_tone is at root, move it into analysis wrapper for consistency
    if (!base.analysis && base.skin_tone) {
      base.analysis = {
        skin_tone: base.skin_tone,
        skin_color: base.skin_color,
        description: base.description || base.summary
      };
    }
    
    // Ensure recommendations is at root if it was nested
    if (!base.recommendations && base.analysis?.recommendations) {
      base.recommendations = base.analysis.recommendations;
    }

    // Translate if recommendations exist
    if (base.recommendations) {
      base.recommendations = translateBackendObject(base.recommendations, language);
    }
    
    return base;
  }, [data, language]);

  const finalData = normalizedData;

  useEffect(() => {
    if (showConfetti) { const timer = setTimeout(() => setShowConfetti(false), 2000); return () => clearTimeout(timer); }
  }, [showConfetti]);

  if (!finalData || !finalData.analysis?.skin_tone) {
    return (
      <div className="mt-8 text-center px-6">
        <p className="text-4xl mb-4">🔍</p>
        <p className="text-white/60 text-sm font-medium mb-2">{t('resultsLoadError') || 'Analysis results could not be processed.'}</p>
        <p className="text-white/30 text-xs mb-6">This usually happens if the photo was too dark or blurry.</p>
        <button onClick={onReset} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95">
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  const analysis = finalData.analysis;
  const recommendations = finalData.recommendations || {};
  const photo_quality = finalData.photo_quality || { score: 80, warnings: [] };
  const isFemale = finalData.gender === "female";
  const isSeasonal = finalData.gender === "seasonal";
  const seasonalGender = data.seasonalGender || "male";
  const bodyType = data.bodyType || null;
  const userOccasion = data.occasion || 'casual';
  const userBudget = data.budget || 'any';

  const OCCASION_LABELS = { casual: '😎 Casual', office: '💼 Office', wedding: '💍 Wedding', party: '🎉 Party', date: '❤️ Date' };
  const BUDGET_LABELS = { any: 'Any Budget', '500': 'Under ₹500', '1000': 'Under ₹1000', '2000': 'Under ₹2000' };

  const BODY_TYPE_TIPS = {
    slim:     ['Layering adds visual bulk — try oversized tees over shirts', 'Horizontal stripes and bold patterns work great for you', 'Baggy jeans and cargo pants suit your frame perfectly'],
    athletic: ['V-neck tees highlight your shoulders beautifully', 'Slim-fit or straight-cut pants balance your proportions', 'Polo shirts and fitted tees are your best friends'],
    average:  ['You can wear almost any silhouette — experiment freely', 'Both oversized and fitted styles suit you well', 'Monochromatic outfits create a sleek, elongated look'],
    plus:     ['Dark colors and vertical patterns create a slimming effect', 'Well-fitted clothes look better than very loose or very tight', 'High-waist bottoms define your waist beautifully'],
  };
  const bodyTypeTips = bodyType ? BODY_TYPE_TIPS[bodyType] || [] : [];
  const effectiveGender = isSeasonal ? seasonalGender : (isFemale ? 'female' : 'male');
  const shirtCategory = effectiveGender === 'female' ? "dress" : "shirt";
  const pantCategory = effectiveGender === 'female' ? "bottom" : "pant";
  const styleTips = isSeasonal ? (recommendations.outfit_tips || []) : (recommendations.style_tips || []);
  const occasionAdvice = recommendations.occasion_advice || {};
  const sareeSuggestions = recommendations.saree_suggestions || [];
  const makeupSuggestions = recommendations.makeup_suggestions || [];
  const ethnicWear = recommendations.ethnic_wear || sareeSuggestions;

  const tabs = [
    { id: 'colors',      label: 'Colors',      emoji: '🎨' },
    { id: 'outfits',     label: 'Outfits',     emoji: '👔' },
    { id: 'accessories', label: 'Accessories', emoji: '✨' },
  ];

  const tabBarBg = isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100 border border-gray-200';
  const inactiveTabCls = isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-400 hover:text-gray-600';

  return (
    <div className="space-y-4 pb-4 bg-transparent">
      {/* First analysis confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-start justify-center pt-20">
          <div className="text-center scale-in">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-white font-black text-lg bg-purple-600/90 px-6 py-3 rounded-2xl shadow-2xl">
              Your Style Profile is Ready!
            </p>
          </div>
          {['🎨','✨','💜','🌟','👗'].map((e, i) => (
            <span key={i} className="confetti absolute text-2xl"
              style={{ left: `${15 + i * 18}%`, animationDelay: `${i * 0.15}s` }}>{e}</span>
          ))}
        </div>
      )}
      {/* Festival Mode Banner */}
      {(() => {
        const month = new Date().getMonth() + 1;
        const isFestive = [10, 11, 12, 1].includes(month);
        if (!isFestive) return null;
        const festivals = { 10: '🪔 Diwali', 11: '🎉 Wedding Season', 12: '🎄 Christmas', 1: '🎊 New Year' };
        return (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">{festivals[month]?.split(' ')[0]}</span>
            <div>
              <p className={`text-xs font-bold ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>{festivals[month]} Special!</p>
              <p className={`text-xs ${isDark ? 'text-amber-100/60' : 'text-amber-700'}`}>Check Outfits tab for festive recommendations</p>
            </div>
          </div>
        );
      })()}
      {/* Photo quality warning */}
      {photo_quality?.warnings?.length > 0 && (
        <div className={`rounded-xl p-3 border ${isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-300'}`}>
          <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>💡 Photo Tips:</p>
          {photo_quality.warnings.map((w, i) => <p key={i} className={`text-xs ${isDark ? 'text-yellow-300/60' : 'text-yellow-600'}`}>• {w.message} → {w.fix}</p>)}
        </div>
      )}

      {/* Occasion + Budget context banner */}
      <div className={`flex items-center gap-2 flex-wrap rounded-xl px-3 py-2 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
        <span className={`text-xs font-semibold ${isDark ? 'text-white/40' : 'text-gray-500'}`}>Styled for:</span>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isDark ? 'bg-pink-500/20 border-pink-500/30 text-pink-300' : 'bg-pink-100 border-pink-300 text-pink-700'}`}>
          {OCCASION_LABELS[userOccasion] || '😎 Casual'}
        </span>
        {userBudget !== 'any' && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${isDark ? 'bg-green-500/20 border-green-500/30 text-green-300' : 'bg-green-100 border-green-300 text-green-700'}`}>
            💰 {BUDGET_LABELS[userBudget]}
          </span>
        )}
      </div>

      {/* Profile card */}
      <ProfileCard
        analysis={analysis}
        recommendations={recommendations}
        uploadedImage={uploadedImage}
        isFemale={isFemale}
        isSeasonal={isSeasonal}
        isDark={isDark}
        photoQuality={photo_quality}
      />

      {/* Actions: Download / Share */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        {(() => {
          const allColors = [
            ...(recommendations.best_shirt_colors || recommendations.best_dress_colors || recommendations.seasonal_colors || []),
            ...(recommendations.best_pant_colors || []),
          ].slice(0, 7);
          if (allColors.length === 0) return null;
          return (
            <button
              onClick={() => downloadPalette(allColors, analysis.skin_tone.category)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all hover:scale-[1.02] ${isDark ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-purple-500/40' : 'bg-white border-gray-200 text-gray-600 hover:border-purple-400 shadow-sm'}`}
            >
              <span>🎨</span>
              <span>Download Palette</span>
            </button>
          );
        })()}
        
        <button
          onClick={async () => {
            if (shareStatus === 'success') return;
            setShareStatus('loading');
            try {
              const paletteData = {
                skinHex: analysis.skin_color.hex,
                skinTone: analysis.skin_tone.category,
                undertone: analysis.skin_tone.undertone || '',
                colorSeason: analysis.skin_tone.color_season || '',
                gender: result.gender || 'male',
                bestColors: [
                  ...(recommendations.best_shirt_colors || recommendations.best_dress_colors || recommendations.seasonal_colors || []),
                ].slice(0, 5)
              };
              await publishToCommunityFeed(auth.currentUser?.uid || 'anon', paletteData);
              setShareStatus('success');
            } catch (e) {
              setShareStatus('error');
              setTimeout(() => setShareStatus(null), 3000);
            }
          }}
          disabled={shareStatus === 'loading' || shareStatus === 'success'}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] shadow-sm ${
            shareStatus === 'success' 
            ? 'bg-green-500 text-white border-green-500' 
            : shareStatus === 'error'
            ? 'bg-red-500 text-white border-red-500'
            : isDark 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent hover:from-purple-500 hover:to-pink-500' 
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent hover:from-purple-600 hover:to-pink-600'
          }`}
        >
          {shareStatus === 'loading' ? (
             <span className="animate-spin text-sm">↻</span>
          ) : shareStatus === 'success' ? (
             <span>✅ Shared!</span>
          ) : shareStatus === 'error' ? (
             <span>Error</span>
          ) : (
            <>
              <span>🌍</span>
              <span>Share to Community</span>
            </>
          )}
        </button>
      </div>

      {/* Tab bar */}
      <div className={`flex ${tabBarBg} rounded-2xl p-1 gap-1`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : inactiveTabCls
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content — swipe support */}
      <div
        className="tab-content"
        onTouchStart={(e) => { window._touchStartX = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = window._touchStartX - e.changedTouches[0].clientX;
          const tabOrder = ['colors', 'outfits', 'accessories'];
          const idx = tabOrder.indexOf(activeTab);
          if (diff > 50 && idx < tabOrder.length - 1) setActiveTab(tabOrder[idx + 1]);
          if (diff < -50 && idx > 0) setActiveTab(tabOrder[idx - 1]);
        }}
      >
        {activeTab === 'colors' && (
          <ColorsTab
            recommendations={recommendations}
            isFemale={isFemale}
            isSeasonal={isSeasonal}
            effectiveGender={effectiveGender}
            shirtCategory={shirtCategory}
            pantCategory={pantCategory}
            isDark={isDark}
          />
        )}
        {activeTab === 'outfits' && (
          <OutfitsTab
            recommendations={recommendations}
            isFemale={isFemale}
            isSeasonal={isSeasonal}
            seasonalGender={seasonalGender}
            styleTips={styleTips}
            occasionAdvice={occasionAdvice}
            ethnicWear={ethnicWear}
            sareeSuggestions={sareeSuggestions}
            isDark={isDark}
            bodyTypeTips={bodyTypeTips}
            bodyType={bodyType}
            userOccasion={userOccasion}
          />
        )}
        {activeTab === 'accessories' && (
          <AccessoriesTab
            recommendations={recommendations}
            isFemale={isFemale}
            makeupSuggestions={makeupSuggestions}
            isDark={isDark}
          />
        )}
      </div>

      {/* Related Blog Posts */}
      {(() => {
        const skinTone = analysis?.skin_tone?.category;
        const blogs = [
          { slug: 'skin-tone-colors', title: 'Best Colors for Your Skin Tone', emoji: '🎨', relevantFor: ['fair','light','medium','olive','brown','dark'] },
          { slug: 'outfit-guide', title: 'How to Choose the Perfect Outfit', emoji: '👔', relevantFor: ['fair','light','medium','olive','brown','dark'] },
          { slug: 'ai-fashion', title: 'How AI is Changing Fashion', emoji: '🤖', relevantFor: ['fair','light','medium','olive','brown','dark'] },
          { slug: 'wardrobe-essentials', title: 'Wardrobe Essentials Every Indian Should Own', emoji: '👗', relevantFor: ['fair','light','medium','olive','brown','dark'] },
          { slug: 'accessorizing-guide', title: 'The Art of Accessorizing', emoji: '✨', relevantFor: ['fair','light','medium','olive','brown','dark'] },
        ];
        const relevant = blogs.filter(b => b.relevantFor.includes(skinTone)).slice(0, 3);
        if (!relevant.length) return null;
        return (
          <div className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>📖 Read More</p>
            <div className="space-y-2">
              {relevant.map((blog) => (
                <a
                  key={blog.slug}
                  href={`/blog/${blog.slug}`}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all hover:border-purple-500/40 ${isDark ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-gray-50 border-gray-100 hover:bg-purple-50'}`}
                >
                  <span className="text-xl">{blog.emoji}</span>
                  <p className={`text-sm font-semibold flex-1 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>{blog.title}</p>
                  <span className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-500'}`}>→</span>
                </a>
              ))}
            </div>
          </div>
        );
      })()}

      {/* New photo button */}
      <button
        onClick={onReset}
        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-900/40"
      >
        📸 {t('analyzeNewPhoto')}
      </button>
    </div>
  );
}

export default ResultsDisplay;
