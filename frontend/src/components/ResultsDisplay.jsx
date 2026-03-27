// ============================================================
// StyleGuru — Tab-Based Results Display (App-like UX)
// ============================================================
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

// ── Shopping Links ───────────────────────────────────────────
function ShoppingLinks({ colorName, category = "shirt", gender = "male" }) {
  const isFemale = gender === "female";
  const colorLower = colorName.toLowerCase().replace(/\s+/g, '+');
  const colorDisplay = colorName.toLowerCase().replace(/\s+/g, ' ');
  const AMAZON_TAG = 'styleguruai-21';

  const categoryConfig = {
    dress:      { amzKw: `${colorDisplay} women maxi dress western`,       amzNode: '1968024031', fkCat: 'women-western-wear',      myntra: `https://www.myntra.com/dresses?rawQuery=${colorLower}+maxi+dress`,          meesho: `${colorDisplay} women dress` },
    top:        { amzKw: `${colorDisplay} women crop top coord set`,       amzNode: '1968024031', fkCat: 'women-tops-tshirts',      myntra: `https://www.myntra.com/tops?rawQuery=${colorLower}+crop+top`,              meesho: `${colorDisplay} women crop top` },
    kurti:      { amzKw: `${colorDisplay} women kurti casual cotton`,      amzNode: '1968024031', fkCat: 'women-kurtas-and-suits',  myntra: `https://www.myntra.com/kurtas?rawQuery=${colorLower}+kurti`,               meesho: `${colorDisplay} women kurti` },
    lehenga:    { amzKw: `${colorDisplay} women lehenga choli wedding`,    amzNode: '1968024031', fkCat: 'women-lehenga-cholis',    myntra: `https://www.myntra.com/lehenga-cholis?rawQuery=${colorLower}+lehenga`,     meesho: `${colorDisplay} women lehenga` },
    saree:      { amzKw: `${colorDisplay} women saree georgette silk`,     amzNode: '1968024031', fkCat: 'women-sarees',            myntra: `https://www.myntra.com/sarees?rawQuery=${colorLower}+saree`,               meesho: `${colorDisplay} women saree` },
    bottom:     { amzKw: `${colorDisplay} women baggy jeans palazzo`,      amzNode: '1968024031', fkCat: 'women-jeans',             myntra: `https://www.myntra.com/jeans?rawQuery=${colorLower}+baggy+wide+leg`,       meesho: `${colorDisplay} women palazzo jeans` },
    handbag:    { amzKw: `${colorDisplay} women sling bag tote`,           amzNode: '1953539031', fkCat: 'women-handbags',          myntra: `https://www.myntra.com/handbags?rawQuery=${colorLower}+sling`,             meesho: `${colorDisplay} women handbag` },
    jewellery:  { amzKw: `${colorDisplay} women jewellery set oxidised`,   amzNode: '1953557031', fkCat: 'women-jewellery',         myntra: `https://www.myntra.com/jewellery?rawQuery=${colorLower}+oxidised`,         meesho: `${colorDisplay} women jewellery` },
    dupatta:    { amzKw: `${colorDisplay} women dupatta stole`,            amzNode: '1968024031', fkCat: 'women-dupatta',           myntra: `https://www.myntra.com/dupattas?rawQuery=${colorLower}`,                   meesho: `${colorDisplay} women dupatta` },
    watch:      { amzKw: isFemale ? `${colorDisplay} women analog watch fashion` : `${colorDisplay} men analog watch casual`,  amzNode: '1350380031', fkCat: isFemale ? 'women-watches' : 'men-watches',       myntra: isFemale ? `https://www.myntra.com/watches?rawQuery=${colorLower}+women` : `https://www.myntra.com/watches?rawQuery=${colorLower}+men`,             meesho: isFemale ? `${colorDisplay} women watch` : `${colorDisplay} men watch` },
    wallet:     { amzKw: isFemale ? `${colorDisplay} women wallet clutch` : `${colorDisplay} men slim wallet`,                    amzNode: '1953539031', fkCat: isFemale ? 'women-wallets' : 'men-wallets',         myntra: isFemale ? `https://www.myntra.com/wallets?rawQuery=${colorLower}+women` : `https://www.myntra.com/wallets?rawQuery=${colorLower}+men`,           meesho: isFemale ? `${colorDisplay} women wallet` : `${colorDisplay} men wallet` },
    sunglasses: { amzKw: isFemale ? `${colorDisplay} women sunglasses trendy` : `${colorDisplay} men sunglasses trendy`,         amzNode: '1350380031', fkCat: isFemale ? 'women-sunglasses' : 'men-sunglasses',   myntra: isFemale ? `https://www.myntra.com/sunglasses?rawQuery=${colorLower}+women+trendy` : `https://www.myntra.com/sunglasses?rawQuery=${colorLower}+men+trendy`, meesho: isFemale ? `${colorDisplay} women sunglasses` : `${colorDisplay} men sunglasses` },
    accessories:{ amzKw: isFemale ? `${colorDisplay} women accessories jewellery` : `${colorDisplay} men accessories cap belt`,    amzNode: isFemale ? '1953557031' : '1968024031', fkCat: isFemale ? 'women-jewellery' : 'men-accessories', myntra: isFemale ? `https://www.myntra.com/jewellery?rawQuery=${colorLower}` : `https://www.myntra.com/accessories?rawQuery=${colorLower}+men`, meesho: isFemale ? `${colorDisplay} women accessories` : `${colorDisplay} men accessories` },
    bag:        { amzKw: isFemale ? `${colorDisplay} women sling bag tote` : `${colorDisplay} men backpack sling bag`,            amzNode: '1953539031', fkCat: isFemale ? 'women-handbags' : 'men-bags-backpacks', myntra: isFemale ? `https://www.myntra.com/handbags?rawQuery=${colorLower}+sling` : `https://www.myntra.com/backpacks?rawQuery=${colorLower}+men`,       meesho: isFemale ? `${colorDisplay} women bag` : `${colorDisplay} men backpack` },
    shoes:      { amzKw: isFemale ? `${colorDisplay} women sneakers heels` : `${colorDisplay} men sneakers casual`,               amzNode: '1983518031', fkCat: isFemale ? 'women-footwear' : 'men-sports-shoes',   myntra: isFemale ? `https://www.myntra.com/sneakers?rawQuery=${colorLower}+women` : `https://www.myntra.com/sneakers?rawQuery=${colorLower}+men`,         meesho: isFemale ? `${colorDisplay} women shoes` : `${colorDisplay} men sneakers` },
    footwear:   { amzKw: isFemale ? `${colorDisplay} women sneakers heels sandals` : `${colorDisplay} men sneakers loafers`,      amzNode: '1983518031', fkCat: isFemale ? 'women-footwear' : 'men-sports-shoes',   myntra: isFemale ? `https://www.myntra.com/sneakers?rawQuery=${colorLower}+women` : `https://www.myntra.com/sneakers?rawQuery=${colorLower}+men`,         meesho: isFemale ? `${colorDisplay} women footwear` : `${colorDisplay} men footwear` },
    shirt:      { amzKw: isFemale ? `${colorDisplay} women crop top coord set` : `${colorDisplay} men oversized t-shirt polo`, amzNode: '1968024031', fkCat: isFemale ? 'women-tops-tshirts' : 'men-tshirts', myntra: isFemale ? `https://www.myntra.com/tops?rawQuery=${colorLower}+crop+top` : `https://www.myntra.com/tshirts?rawQuery=${colorLower}+men+oversized`, meesho: isFemale ? `${colorDisplay} women top` : `${colorDisplay} men tshirt` },
    pant:       { amzKw: isFemale ? `${colorDisplay} women baggy jeans palazzo` : `${colorDisplay} men cargo pants joggers`, amzNode: '1968024031', fkCat: isFemale ? 'women-jeans' : 'men-jeans', myntra: isFemale ? `https://www.myntra.com/jeans?rawQuery=${colorLower}+baggy` : `https://www.myntra.com/cargos?rawQuery=${colorLower}+cargo`, meesho: isFemale ? `${colorDisplay} women palazzo` : `${colorDisplay} men cargo pants` },
    belt:       { amzKw: `${colorDisplay} men belt casual`, amzNode: '1968024031', fkCat: 'men-belts', myntra: `https://www.myntra.com/belts?rawQuery=${colorLower}+men`, meesho: `${colorDisplay} men belt` },
  };

  const cfg = categoryConfig[category] || { amzKw: `${colorDisplay} ${isFemale ? 'women' : 'men'} ${category}`, amzNode: '1968024031', fkCat: isFemale ? 'women-western-wear' : 'men-tshirts', myntra: `https://www.myntra.com/fashion?rawQuery=${colorLower}+${isFemale ? 'women' : 'men'}`, meesho: `${colorDisplay} ${isFemale ? 'women' : 'men'} ${category}` };

  const links = [
    { name: 'Amazon',   url: `https://www.amazon.in/s?k=${encodeURIComponent(cfg.amzKw)}&rh=n%3A${cfg.amzNode}&sort=review-rank&tag=${AMAZON_TAG}`, icon: '🛒', bg: 'bg-orange-500/20 hover:bg-orange-500/40 border-orange-500/30 text-orange-300' },
    { name: 'Flipkart', url: `https://www.flipkart.com/${cfg.fkCat}?q=${encodeURIComponent(colorDisplay)}&sort=popularity`, icon: '🏪', bg: 'bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/30 text-blue-300' },
    { name: 'Myntra',   url: cfg.myntra, icon: '👗', bg: 'bg-pink-500/20 hover:bg-pink-500/40 border-pink-500/30 text-pink-300' },
    { name: 'Meesho',   url: `https://meesho.com/search?q=${encodeURIComponent(cfg.meesho)}`, icon: '🛍️', bg: 'bg-purple-500/20 hover:bg-purple-500/40 border-purple-500/30 text-purple-300' },
  ];

  return (
    <div className="flex gap-1.5 flex-wrap mt-2">
      {links.map((link) => (
        <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:scale-105 ${link.bg}`}>
          <span>{link.icon}</span><span>{link.name}</span>
        </a>
      ))}
    </div>
  );
}

// ── Color Card (compact, tap to expand) ─────────────────────
function ColorCard({ color, category, gender }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-purple-500/40"
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-center gap-3 p-3 cursor-pointer">
        <div className="w-12 h-12 rounded-xl flex-shrink-0 shadow-lg border border-white/10" style={{ backgroundColor: color.hex }} />
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{color.name}</p>
          <p className="text-white/30 text-xs font-mono">{color.hex}</p>
        </div>
        <span className={`text-white/30 text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>▼</span>
      </div>
      {expanded && (
        <div className="px-3 pb-3 border-t border-white/5 pt-2" onClick={e => e.stopPropagation()}>
          {color.reason && <p className="text-white/50 text-xs mb-2 leading-relaxed">{color.reason}</p>}
          <ShoppingLinks colorName={color.name} category={category} gender={gender} />
        </div>
      )}
    </div>
  );
}

// ── Outfit Card ──────────────────────────────────────────────
function OutfitCard({ combo, index }) {
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
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-4`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1">
          <p className="text-white font-bold text-sm mb-1">{topItem}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {bottomItem && <span className="text-white/60">👖 {bottomItem}</span>}
            {combo.shoes && <span className="text-white/60">👟 {combo.shoes}</span>}
            {combo.dupatta && combo.dupatta !== "-" && <span className="text-white/60">🧣 {combo.dupatta}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="bg-white/10 text-white/80 text-xs px-2 py-1 rounded-full">{combo.occasion}</span>
          {combo.vibe && <p className="text-white/30 text-xs mt-1 italic">{combo.vibe}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Profile Hero Card ────────────────────────────────────────
function ProfileCard({ analysis, recommendations, uploadedImage, isFemale, isSeasonal }) {
  const toneColors = { fair: "#F5DEB3", light: "#D2A679", medium: "#C68642", olive: "#A0724A", brown: "#7B4F2E", dark: "#4A2C0A" };
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-2xl p-4">
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: toneColors[analysis.skin_tone.category] }} />
      <div className="flex items-center gap-4">
        {uploadedImage && (
          <div className="relative flex-shrink-0">
            <img src={uploadedImage} alt="Your photo" className="w-20 h-20 object-cover rounded-2xl border-2 border-white/20 shadow-xl" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-slate-900" style={{ backgroundColor: toneColors[analysis.skin_tone.category] }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-0.5">
            {isSeasonal ? 'Seasonal' : isFemale ? '👩 Female' : '👨 Male'} Profile
          </p>
          <h2 className="text-white text-2xl font-black capitalize">{analysis.skin_tone.category} <span className="text-white/40 font-light text-lg">Skin</span></h2>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs px-2 py-0.5 rounded-full capitalize">{analysis.skin_tone.undertone}</span>
            <span className="bg-pink-500/20 border border-pink-500/30 text-pink-200 text-xs px-2 py-0.5 rounded-full">🍂 {analysis.skin_tone.color_season}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${analysis.skin_tone.confidence === "high" ? "bg-green-500/20 border-green-500/30 text-green-300" : "bg-yellow-500/20 border-yellow-500/30 text-yellow-300"}`}>
              {analysis.skin_tone.confidence === "high" ? "✓ High" : "~ Medium"}
            </span>
          </div>
        </div>
      </div>
      {(recommendations.summary || recommendations.description) && (
        <div className="mt-3 bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-white/60 text-xs leading-relaxed">{recommendations.summary || recommendations.description}</p>
        </div>
      )}
    </div>
  );
}

// ── Colors Tab ───────────────────────────────────────────────
function ColorsTab({ recommendations, isFemale, isSeasonal, effectiveGender, shirtCategory, pantCategory }) {
  const avoidColors = recommendations.colors_to_avoid || [];

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
          {seasonalColors.map((color, i) => <ColorCard key={i} color={color} category={shirtCategory} gender={effectiveGender} />)}
        </div>
      </div>
    );
  }

  if (isFemale) {
    const sections = [
      { title: '👗 Dress Colors', colors: recommendations.best_dress_colors || [], cat: 'dress' },
      { title: '👚 Top Colors', colors: recommendations.best_top_colors || [], cat: 'top' },
      { title: '🥻 Kurti Colors', colors: recommendations.best_kurti_colors || [], cat: 'kurti' },
      { title: '✨ Lehenga Colors', colors: recommendations.best_lehenga_colors || [], cat: 'lehenga' },
      { title: '👖 Bottom Colors', colors: recommendations.best_bottom_colors || recommendations.best_pant_colors || [], cat: 'bottom' },
    ].filter(s => s.colors.length > 0);

    return (
      <div className="space-y-5">
        {sections.map((sec) => (
          <div key={sec.title}>
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">{sec.title}</p>
            <div className="grid grid-cols-1 gap-2">
              {sec.colors.map((color, i) => <ColorCard key={i} color={color} category={sec.cat} gender="female" />)}
            </div>
          </div>
        ))}
        {avoidColors.length > 0 && (
          <div>
            <p className="text-red-400/70 text-xs font-semibold uppercase tracking-wide mb-2">🚫 Avoid These</p>
            <div className="grid grid-cols-1 gap-2">
              {avoidColors.map((color, i) => <ColorCard key={i} color={color} category="dress" gender="female" />)}
            </div>
          </div>
        )}
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
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">👕 T-Shirt / Top Colors</p>
          <div className="grid grid-cols-1 gap-2">
            {shirtColors.map((color, i) => <ColorCard key={i} color={color} category="shirt" gender="male" />)}
          </div>
        </div>
      )}
      {pantColors.length > 0 && (
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">👖 Pants / Cargo Colors</p>
          <div className="grid grid-cols-1 gap-2">
            {pantColors.map((color, i) => <ColorCard key={i} color={color} category="pant" gender="male" />)}
          </div>
        </div>
      )}
      {avoidColors.length > 0 && (
        <div>
          <p className="text-red-400/70 text-xs font-semibold uppercase tracking-wide mb-2">🚫 Avoid These</p>
          <div className="grid grid-cols-1 gap-2">
            {avoidColors.map((color, i) => <ColorCard key={i} color={color} category="shirt" gender="male" />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Outfits Tab ──────────────────────────────────────────────
function OutfitsTab({ recommendations, isFemale, isSeasonal, seasonalGender, styleTips, occasionAdvice, ethnicWear, sareeSuggestions }) {
  let outfits = [];
  if (isSeasonal) outfits = seasonalGender === 'female' ? (recommendations.female_outfits || []) : (recommendations.male_outfits || []);
  else if (isFemale) outfits = recommendations.outfit_combos || [];
  else outfits = recommendations.outfit_combinations || recommendations.outfit_combos || [];

  return (
    <div className="space-y-5">
      {/* Outfit combos */}
      {outfits.length > 0 && (
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">🧥 Outfit Combos</p>
          <div className="space-y-2">
            {outfits.map((combo, i) => <OutfitCard key={i} combo={combo} index={i} />)}
          </div>
        </div>
      )}

      {/* Occasion advice */}
      {Object.keys(occasionAdvice).length > 0 && (
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">📅 What to Wear When</p>
          <div className="space-y-2">
            {Object.entries(occasionAdvice).map(([occasion, advice], i) => (
              <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-purple-300 text-xs font-bold uppercase tracking-wide mb-1">{occasion}</p>
                <p className="text-white/60 text-sm">{advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Style tips */}
      {styleTips.length > 0 && (
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">💡 Style Tips</p>
          <div className="space-y-2">
            {styleTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-purple-400 flex-shrink-0">✦</span>
                <p className="text-white/70 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ethnic wear */}
      {ethnicWear.length > 0 && (
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">🪷 Ethnic Wear</p>
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2">
            {ethnicWear.map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-amber-400 flex-shrink-0">★</span>
                <p className="text-amber-100/70 text-sm">{typeof s === "string" ? s : `${s.type}: ${s.colors} — ${s.occasion}`}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saree suggestions (female) */}
      {sareeSuggestions.length > 0 && (
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">🥻 Saree & Suits</p>
          <div className="space-y-2">
            {sareeSuggestions.map((item, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-3 border border-pink-500/20">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-pink-200 font-bold text-sm">{item.type}</p>
                    <p className="text-white/50 text-xs mt-0.5">🎨 {item.colors}</p>
                    <p className="text-white/40 text-xs">{item.reason}</p>
                  </div>
                  <span className="bg-pink-500/20 text-pink-300 text-xs px-2 py-0.5 rounded-full border border-pink-500/20">{item.occasion}</span>
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
function AccessoriesTab({ recommendations, isFemale, makeupSuggestions }) {
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

  return (
    <div className="space-y-5">
      {/* Female accessories */}
      {isFemale && accessories.length > 0 && (
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">👜 Accessories & Jewellery</p>
          <div className="space-y-2">
            {accessories.map((item, i) => {
              const typeLC = (item.type || '').toLowerCase();
              const cat = getAccCat(typeLC, true);
              const searchTerm = item.suggestion || item.colors || item.type;
              return (
                <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-purple-300 font-bold text-sm">{item.type}</p>
                  <p className="text-white/50 text-xs mt-0.5">{item.suggestion || item.colors}</p>
                  {item.reason && <p className="text-white/30 text-xs">{item.reason}</p>}
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
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">⌚ Accessories For You</p>
          <div className="space-y-2">
            {accentColors.map((item, i) => {
              const typeLC = (item.type || '').toLowerCase();
              const cat = getAccCat(typeLC, false);
              const searchTerm = item.suggestion || item.name || item.type;
              return (
                <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <p className="text-purple-300 font-bold text-sm">{item.type}</p>
                  <p className="text-white/50 text-xs mt-0.5">{item.name}</p>
                  {item.reason && <p className="text-white/30 text-xs">{item.reason}</p>}
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
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-2">💄 Makeup Suggestions</p>
          <div className="space-y-2">
            {makeupSuggestions.map((item, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-3 border border-rose-500/20">
                <p className="text-rose-200 font-bold text-sm">{item.product}</p>
                <p className="text-white/50 text-xs mt-0.5">{item.shade || item.shades}</p>
                {item.brands && <p className="text-white/30 text-xs">Brands: {item.brands}</p>}
                {item.tip && <p className="text-white/40 text-xs mt-1 italic">💡 {item.tip}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isFemale && accentColors.length === 0 && (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">⌚</p>
          <p className="text-white/40 text-sm">No accessories data available</p>
        </div>
      )}
    </div>
  );
}

// ── Main ResultsDisplay ──────────────────────────────────────
function ResultsDisplay({ data, uploadedImage, onReset }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('colors');
  const { analysis, recommendations, photo_quality } = data;
  const isFemale = data.gender === "female";
  const isSeasonal = data.gender === "seasonal";
  const seasonalGender = data.seasonalGender || "male";
  const effectiveGender = isSeasonal ? seasonalGender : (isFemale ? 'female' : 'male');
  const shirtCategory = effectiveGender === 'female' ? "dress" : "shirt";
  const pantCategory = effectiveGender === 'female' ? "bottom" : "pant";
  const styleTips = isSeasonal ? (recommendations.outfit_tips || []) : (recommendations.style_tips || []);
  const occasionAdvice = recommendations.occasion_advice || {};
  const sareeSuggestions = recommendations.saree_suggestions || [];
  const makeupSuggestions = recommendations.makeup_suggestions || [];
  const ethnicWear = recommendations.ethnic_wear || sareeSuggestions;

  const tabs = [
    { id: 'colors',    label: 'Colors',    emoji: '🎨' },
    { id: 'outfits',   label: 'Outfits',   emoji: '👔' },
    { id: 'accessories', label: 'Accessories', emoji: '✨' },
  ];

  return (
    <div className="space-y-4 pb-4 bg-[#050816] rounded-3xl p-3 text-white">
      {/* Photo quality warning */}
      {photo_quality?.warnings?.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
          <p className="text-yellow-300 text-xs font-semibold mb-1">💡 Photo Tips:</p>
          {photo_quality.warnings.map((w, i) => <p key={i} className="text-yellow-300/60 text-xs">• {w.message} → {w.fix}</p>)}
        </div>
      )}

      {/* Profile card */}
      <ProfileCard
        analysis={analysis}
        recommendations={recommendations}
        uploadedImage={uploadedImage}
        isFemale={isFemale}
        isSeasonal={isSeasonal}
      />

      {/* Tab bar */}
      <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'colors' && (
          <ColorsTab
            recommendations={recommendations}
            isFemale={isFemale}
            isSeasonal={isSeasonal}
            effectiveGender={effectiveGender}
            shirtCategory={shirtCategory}
            pantCategory={pantCategory}
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
          />
        )}
        {activeTab === 'accessories' && (
          <AccessoriesTab
            recommendations={recommendations}
            isFemale={isFemale}
            makeupSuggestions={makeupSuggestions}
          />
        )}
      </div>

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
