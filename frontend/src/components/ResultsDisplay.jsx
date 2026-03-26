// ============================================================
// StyleGuru — Production Grade Results Display
// ============================================================

function ShoppingLinks({ colorName, category = "shirt" }) {
  const query = encodeURIComponent(`${colorName} ${category}`);
  const links = [
    { name: "Amazon", url: `https://www.amazon.in/s?k=${query}`, icon: "🛒", bg: "bg-orange-500/20 hover:bg-orange-500/40 border-orange-500/30 text-orange-300" },
    { name: "Flipkart", url: `https://www.flipkart.com/search?q=${query}`, icon: "🏪", bg: "bg-blue-500/20 hover:bg-blue-500/40 border-blue-500/30 text-blue-300" },
    { name: "Myntra", url: `https://www.myntra.com/${encodeURIComponent(colorName.toLowerCase())}-${category}`, icon: "👗", bg: "bg-pink-500/20 hover:bg-pink-500/40 border-pink-500/30 text-pink-300" },
  ];
  return (
    <div className="flex gap-2 flex-wrap mt-2">
      {links.map((link) => (
        <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all hover:scale-105 ${link.bg}`}>
          <span>{link.icon}</span><span>{link.name}</span>
        </a>
      ))}
    </div>
  );
}

function ColorSwatch({ color, showReason = true, category = "shirt" }) {
  return (
    <div className="group bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-purple-500/40 transition-all duration-300 hover:scale-[1.01]">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl shadow-lg border border-white/20 group-hover:scale-110 transition-transform duration-300 flex-shrink-0" style={{ backgroundColor: color.hex }} />
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold text-sm">{color.name}</p>
          <p className="text-white/30 text-xs font-mono mt-0.5">{color.hex}</p>
          {showReason && color.reason && <p className="text-white/50 text-xs mt-1 leading-relaxed">{color.reason}</p>}
        </div>
      </div>
      <ShoppingLinks colorName={color.name} category={category} />
    </div>
  );
}

function Section({ title, emoji, children, className = "", gradient = false }) {
  return (
    <div className={`relative rounded-3xl p-6 border transition-all duration-300 ${gradient ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20" : "bg-white/5 border-white/10 hover:border-white/20"} ${className}`}>
      <h3 className="text-white font-black text-lg mb-5 flex items-center gap-2">
        <span className="text-2xl">{emoji}</span><span>{title}</span>
      </h3>
      {children}
    </div>
  );
}

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
  const topItem = combo.shirt || combo.top || "";
  const bottomItem = combo.pant || combo.bottom || "";
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 hover:scale-[1.01] transition-all duration-300`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1">
          <p className="text-white font-bold text-sm mb-2">{topItem}</p>
          <div className="flex flex-wrap gap-3 text-xs">
            {bottomItem && <span className="flex items-center gap-1 text-white/60"><span>👖</span>{bottomItem}</span>}
            {combo.shoes && <span className="flex items-center gap-1 text-white/60"><span>👟</span>{combo.shoes}</span>}
            {combo.dupatta && combo.dupatta !== "-" && <span className="flex items-center gap-1 text-white/60"><span>🧣</span>{combo.dupatta}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="inline-block bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full border border-white/10 font-medium">{combo.occasion}</span>
          <p className="text-white/30 text-xs mt-1.5 italic">{combo.vibe}</p>
        </div>
      </div>
    </div>
  );
}

function ResultsDisplay({ data, uploadedImage, onReset }) {
  const { analysis, recommendations, photo_quality } = data;
  const isFemale = data.gender === "female";
  const isSeasonal = data.gender === "seasonal";

  const toneColors = {
    fair: "#F5DEB3", light: "#D2A679", medium: "#C68642",
    olive: "#A0724A", brown: "#7B4F2E", dark: "#4A2C0A",
  };

  const shirtCategory = isFemale ? "dress" : isSeasonal ? "top" : "shirt";
  const pantCategory = isFemale ? "bottom" : "pant";

  const outfits = isSeasonal
    ? (recommendations.male_outfits || [])
    : isFemale
    ? (recommendations.outfit_combos || [])
    : (recommendations.outfit_combinations || recommendations.outfit_combos || []);

  const shirtColors = isSeasonal
    ? (recommendations.seasonal_colors || recommendations.base_shirt_colors || [])
    : isFemale
    ? (recommendations.best_dress_colors || recommendations.best_top_colors || [])
    : (recommendations.best_shirt_colors || []);

  const pantColors = recommendations.best_pant_colors || recommendations.base_pant_colors || [];
  const avoidColors = recommendations.colors_to_avoid || [];
  const styleTips = isSeasonal ? (recommendations.outfit_tips || []) : (recommendations.style_tips || []);
  const occasionAdvice = recommendations.occasion_advice || {};
  const accentColors = recommendations.accent_colors || [];
  const sareeSuggestions = recommendations.saree_suggestions || [];
  const makeupSuggestions = recommendations.makeup_suggestions || [];
  const accessories = recommendations.accessories || [];
  const ethnicWear = recommendations.ethnic_wear || sareeSuggestions;

  return (
    <div className="space-y-6 mt-4 pb-12">

      {/* Top Bar */}
      
      <div className="flex justify-between items-center flex-wrap gap-2">
  <button onClick={onReset} className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all text-sm border border-white/10">
    ← New Photo
  </button>
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-xs font-semibold">
            {isSeasonal ? `${recommendations.title || 'Seasonal'} Analysis` : isFemale ? "👩 Female Analysis" : "👨 Male Analysis"} Complete
          </span>
        </div>
      </div>

      {/* Photo Quality Warning */}
      {photo_quality?.warnings?.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
          <p className="text-yellow-300 text-sm font-semibold mb-2">💡 Photo Tips:</p>
          {photo_quality.warnings.map((w, i) => <p key={i} className="text-yellow-300/60 text-xs">• {w.message} → {w.fix}</p>)}
        </div>
      )}

      {/* Hero Profile Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ backgroundColor: toneColors[analysis.skin_tone.category] }} />
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {uploadedImage && (
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-3xl blur-xl opacity-40" style={{ backgroundColor: toneColors[analysis.skin_tone.category] }} />
              <img src={uploadedImage} alt="Your photo" className="relative w-32 h-32 object-cover rounded-3xl border-2 border-white/20 shadow-2xl" />
              <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full border-2 border-slate-900 shadow-xl" style={{ backgroundColor: toneColors[analysis.skin_tone.category] }} />
            </div>
          )}
          <div className="flex-1 text-center md:text-left">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
              {isSeasonal ? `${recommendations.title || '🌍 Seasonal'} Style Profile` : isFemale ? "👩 Female Style Profile" : "👨 Male Style Profile"}
            </p>
            <h2 className="text-white text-4xl font-black mb-3 capitalize">
              {analysis.skin_tone.category}<span className="text-white/40 font-light"> Skin</span>
            </h2>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
              <span className="bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs px-3 py-1.5 rounded-full font-medium capitalize">{analysis.skin_tone.undertone} undertone</span>
              <span className="bg-pink-500/20 border border-pink-500/30 text-pink-200 text-xs px-3 py-1.5 rounded-full font-medium">🍂 {analysis.skin_tone.color_season}</span>
              <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${analysis.skin_tone.confidence === "high" ? "bg-green-500/20 border-green-500/30 text-green-300" : "bg-yellow-500/20 border-yellow-500/30 text-yellow-300"}`}>
                {analysis.skin_tone.confidence === "high" ? "✓ High Confidence" : "~ Medium Confidence"}
              </span>
            </div>
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg" style={{ backgroundColor: analysis.skin_color.hex }} />
              <div>
                <p className="text-white/30 text-xs">Detected Skin Color</p>
                <p className="text-white/60 text-xs font-mono">{analysis.skin_color.hex} • RGB({analysis.skin_color.rgb.r}, {analysis.skin_color.rgb.g}, {analysis.skin_color.rgb.b})</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative mt-6 bg-white/5 rounded-2xl p-5 border border-white/10">
          <div className="absolute -top-3 left-6 bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-semibold">Style Summary</div>
          <p className="text-white/70 leading-relaxed text-sm mt-1">{recommendations.summary || recommendations.description}</p>
        </div>
      </div>

      {/* ── SEASONAL SPECIFIC ── */}
      {isSeasonal && (
        <>
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-6">
            <h3 className="text-amber-200 font-black text-xl mb-2">{recommendations.title}</h3>
            <p className="text-amber-100/60 text-sm mb-4">{recommendations.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-green-500/10 rounded-2xl p-4 border border-green-500/20">
                <p className="text-green-300 font-bold text-sm mb-2">✅ Best Fabrics</p>
                {(recommendations.fabrics_recommended || []).map((f, i) => (
                  <span key={i} className="inline-block bg-green-500/20 text-green-200 text-xs px-2 py-1 rounded-full mr-1 mb-1">{f}</span>
                ))}
              </div>
              <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/20">
                <p className="text-red-300 font-bold text-sm mb-2">❌ Avoid Fabrics</p>
                {(recommendations.fabrics_avoid || []).map((f, i) => (
                  <span key={i} className="inline-block bg-red-500/20 text-red-200 text-xs px-2 py-1 rounded-full mr-1 mb-1">{f}</span>
                ))}
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <p className="text-white font-bold text-sm mb-2">💡 Season Style Tips:</p>
              {(recommendations.outfit_tips || []).map((tip, i) => (
                <div key={i} className="flex items-start gap-2 mb-1">
                  <span className="text-amber-400 flex-shrink-0">✦</span>
                  <p className="text-white/70 text-xs">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {(recommendations.seasonal_colors || []).length > 0 && (
            <Section title="Season Best Colors" emoji="🎨" gradient>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.seasonal_colors.map((color, i) => <ColorSwatch key={i} color={color} category={shirtCategory} />)}
              </div>
            </Section>
          )}

          <Section title="Season Outfit Ideas — Male" emoji="👔">
            <div className="space-y-3">
              {(recommendations.male_outfits || []).map((combo, i) => <OutfitCard key={i} combo={combo} index={i} />)}
            </div>
          </Section>

          <Section title="Season Outfit Ideas — Female" emoji="👗">
            <div className="space-y-3">
              {(recommendations.female_outfits || []).map((combo, i) => <OutfitCard key={i} combo={combo} index={i} />)}
            </div>
          </Section>
        </>
      )}

      {/* ── NORMAL COLOR SECTIONS ── */}
      {!isSeasonal && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title={isFemale ? "Best Dress & Top Colors" : "Best Shirt Colors"} emoji={isFemale ? "👗" : "👔"} gradient>
              <div className="space-y-3">
                {shirtColors.map((color, i) => <ColorSwatch key={i} color={color} category={shirtCategory} />)}
              </div>
            </Section>
            <Section title="Best Pant Colors" emoji="👖" gradient>
              <div className="space-y-3">
                {pantColors.length > 0
                  ? pantColors.map((color, i) => <ColorSwatch key={i} color={color} category={pantCategory} />)
                  : <p className="text-white/40 text-sm">No pant colors available</p>}
              </div>
            </Section>
          </div>

          <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6">
            <h3 className="text-red-300 font-black text-lg mb-5 flex items-center gap-2">
              <span className="text-2xl">🚫</span> Colors to Avoid
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {avoidColors.map((color, i) => <ColorSwatch key={i} color={color} category={shirtCategory} />)}
            </div>
          </div>

          <Section title="Complete Outfit Ideas" emoji="🧥">
            <div className="space-y-3">
              {outfits.map((combo, i) => <OutfitCard key={i} combo={combo} index={i} />)}
            </div>
          </Section>

          <Section title="Style Tips Just For You" emoji="💡">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {styleTips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                  <span className="text-purple-400 text-lg flex-shrink-0">✦</span>
                  <p className="text-white/70 text-sm leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </Section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Section title="What to Wear & When?" emoji="📅">
              <div className="space-y-3">
                {Object.keys(occasionAdvice).length > 0
                  ? Object.entries(occasionAdvice).map(([occasion, advice], i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500/30 transition">
                      <p className="text-purple-300 text-xs font-bold uppercase tracking-wide mb-1">{occasion}</p>
                      <p className="text-white/60 text-sm">{advice}</p>
                    </div>
                  ))
                  : <p className="text-white/40 text-sm">No occasion advice available</p>}
              </div>
            </Section>

            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-6">
              <h3 className="text-amber-200 font-black text-lg mb-5 flex items-center gap-2">
                <span className="text-2xl">🪷</span>{isFemale ? "Saree & Ethnic Wear" : "Ethnic Wear"}
              </h3>
              <div className="space-y-3">
                {ethnicWear.length > 0
                  ? ethnicWear.map((s, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-amber-400 text-lg flex-shrink-0">★</span>
                      <p className="text-amber-100/70 text-sm leading-relaxed">
                        {typeof s === "string" ? s : `${s.type}: ${s.colors} — ${s.occasion}`}
                      </p>
                    </div>
                  ))
                  : <p className="text-amber-200/40 text-sm">No ethnic wear suggestions</p>}
              </div>
            </div>
          </div>

          {/* Female Specific */}
          {isFemale && (
            <>
              {sareeSuggestions.length > 0 && (
                <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-3xl p-6">
                  <h3 className="text-pink-200 font-black text-lg mb-5 flex items-center gap-2">
                    <span className="text-2xl">🥻</span> Saree & Suits Suggestions
                  </h3>
                  <div className="space-y-3">
                    {sareeSuggestions.map((item, i) => (
                      <div key={i} className="bg-white/5 rounded-2xl p-4 border border-pink-500/20">
                        <div className="flex items-start justify-between flex-wrap gap-2">
                          <div>
                            <p className="text-pink-200 font-bold text-sm">{item.type}</p>
                            <p className="text-white/60 text-xs mt-1">🎨 {item.colors}</p>
                            <p className="text-white/50 text-xs mt-0.5">{item.reason}</p>
                          </div>
                          <span className="bg-pink-500/20 text-pink-300 text-xs px-2 py-1 rounded-full border border-pink-500/20">{item.occasion}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {makeupSuggestions.length > 0 && (
                <div className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-3xl p-6">
                  <h3 className="text-rose-200 font-black text-lg mb-5 flex items-center gap-2">
                    <span className="text-2xl">💄</span> Makeup Suggestions
                  </h3>
                  <div className="space-y-3">
                    {makeupSuggestions.map((item, i) => (
                      <div key={i} className="bg-white/5 rounded-2xl p-4 border border-rose-500/20">
                        <p className="text-rose-200 font-bold text-sm mb-1">{item.product}</p>
                        <p className="text-white/60 text-xs">{item.shade || item.shades}</p>
                        {item.brands && <p className="text-white/40 text-xs mt-0.5">Brands: {item.brands}</p>}
                        <p className="text-white/50 text-xs mt-1 italic">💡 {item.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {accessories.length > 0 && (
                <Section title="Accessories & Jewellery" emoji="👜">
                  <div className="space-y-4">
                    {accessories.map((item, i) => (
                      <div key={i} className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-purple-500/30 transition">
                        <p className="text-purple-300 font-bold text-sm">{item.type}</p>
                        <p className="text-white/60 text-xs mt-1">{item.suggestion || item.colors}</p>
                        <p className="text-white/40 text-xs mt-0.5">{item.reason}</p>
                        <ShoppingLinks colorName={item.suggestion || item.colors || item.type} category="accessories" />
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}

          {!isFemale && accentColors.length > 0 && (
            <Section title="Accessories Colors" emoji="⌚">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accentColors.map((color, i) => <ColorSwatch key={i} color={color} category="accessories" />)}
              </div>
            </Section>
          )}
        </>
      )}

      {/* CTA */}
      <div className="text-center py-6">
        <button onClick={onReset} className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-2xl shadow-purple-500/30 hover:scale-105 text-base">
          🔄 Analyze New Photo
        </button>
        <p className="text-white/25 text-xs mt-3">Each selfie gives better results!</p>
      </div>
    </div>
  );
}

export default ResultsDisplay;