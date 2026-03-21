function ColorSwatch({ color, showReason = true }) {
    return (
      <div className="group relative bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 hover:border-purple-500/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div
              className="w-14 h-14 rounded-xl shadow-lg border border-white/20 group-hover:scale-110 transition-transform duration-300"
              style={{ backgroundColor: color.hex }}
            />
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ boxShadow: `0 0 20px ${color.hex}60` }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-sm">{color.name}</p>
            <p className="text-white/30 text-xs font-mono mt-0.5">{color.hex}</p>
            {showReason && color.reason && (
              <p className="text-white/50 text-xs mt-1 leading-relaxed">{color.reason}</p>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  function Section({ title, emoji, children, className = '', gradient = false }) {
    return (
      <div className={`relative rounded-3xl p-6 border transition-all duration-300 ${
        gradient
          ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20'
          : 'bg-white/5 border-white/10 hover:border-white/20'
      } ${className}`}>
        <h3 className="text-white font-black text-lg mb-5 flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <span>{title}</span>
        </h3>
        {children}
      </div>
    );
  }
  
  function OutfitCard({ combo, index }) {
    const colors = ['purple', 'pink', 'blue', 'emerald', 'amber'];
    const color = colors[index % colors.length];
    const colorMap = {
      purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
      pink: 'from-pink-500/20 to-pink-600/10 border-pink-500/30',
      blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
      emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
      amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
    };
    return (
      <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-5 hover:scale-[1.01] transition-all duration-300`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1">
            <p className="text-white font-bold text-sm mb-2">{combo.shirt}</p>
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="flex items-center gap-1 text-white/60">
                <span>👖</span> {combo.pant}
              </span>
              <span className="flex items-center gap-1 text-white/60">
                <span>👟</span> {combo.shoes}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="inline-block bg-white/10 text-white/80 text-xs px-3 py-1.5 rounded-full border border-white/10 font-medium">
              {combo.occasion}
            </span>
            <p className="text-white/30 text-xs mt-1.5 italic">{combo.vibe}</p>
          </div>
        </div>
      </div>
    );
  }
  
  function ResultsDisplay({ data, uploadedImage, onReset }) {
    const { analysis, recommendations, photo_quality } = data;
  
    const toneColors = {
      fair: '#F5DEB3', light: '#D2A679', medium: '#C68642',
      olive: '#A0724A', brown: '#7B4F2E', dark: '#4A2C0A',
    };
  
    const toneGradients = {
      fair: 'from-amber-200 to-yellow-300',
      light: 'from-amber-400 to-orange-300',
      medium: 'from-orange-500 to-amber-400',
      olive: 'from-amber-600 to-orange-500',
      brown: 'from-orange-800 to-amber-700',
      dark: 'from-stone-700 to-stone-600',
    };
  
    return (
      <div className="space-y-6 mt-4 pb-12">
  
        {/* Top Bar */}
        <div className="flex justify-between items-center">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all text-sm border border-white/10 hover:border-white/20"
          >
            ← Nayi Photo
          </button>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs font-semibold">Analysis Complete</span>
          </div>
        </div>
  
        {/* Quality Warning */}
        {photo_quality?.warnings?.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
            <p className="text-yellow-300 text-sm font-semibold mb-2">💡 Photo Tips:</p>
            {photo_quality.warnings.map((w, i) => (
              <p key={i} className="text-yellow-300/60 text-xs">• {w.message} → {w.fix}</p>
            ))}
          </div>
        )}
  
        {/* Hero Profile Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-8">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ backgroundColor: toneColors[analysis.skin_tone.category] }} />
  
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            {/* Photo */}
            {uploadedImage && (
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-3xl blur-xl opacity-40"
                  style={{ backgroundColor: toneColors[analysis.skin_tone.category] }} />
                <img
                  src={uploadedImage}
                  alt="Your photo"
                  className="relative w-32 h-32 object-cover rounded-3xl border-2 border-white/20 shadow-2xl"
                />
                <div
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full border-3 border-slate-900 shadow-xl"
                  style={{ backgroundColor: toneColors[analysis.skin_tone.category] }}
                />
              </div>
            )}
  
            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">Tumhara Style Profile</p>
              <h2 className="text-white text-4xl font-black mb-3 capitalize">
                {analysis.skin_tone.category}
                <span className="text-white/40 font-light"> Skin</span>
              </h2>
  
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                <span className="bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs px-3 py-1.5 rounded-full font-medium capitalize">
                  {analysis.skin_tone.undertone} undertone
                </span>
                <span className="bg-pink-500/20 border border-pink-500/30 text-pink-200 text-xs px-3 py-1.5 rounded-full font-medium">
                  🍂 {analysis.skin_tone.color_season}
                </span>
                <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
                  analysis.skin_tone.confidence === 'high'
                    ? 'bg-green-500/20 border-green-500/30 text-green-300'
                    : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
                }`}>
                  {analysis.skin_tone.confidence === 'high' ? '✓ High Confidence' : '~ Medium Confidence'}
                </span>
              </div>
  
              {/* Skin color display */}
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg"
                  style={{ backgroundColor: analysis.skin_color.hex }}
                />
                <div>
                  <p className="text-white/30 text-xs">Detected Skin Color</p>
                  <p className="text-white/60 text-xs font-mono">{analysis.skin_color.hex} • RGB({analysis.skin_color.rgb.r}, {analysis.skin_color.rgb.g}, {analysis.skin_color.rgb.b})</p>
                </div>
              </div>
            </div>
          </div>
  
          {/* Summary */}
          <div className="relative mt-6 bg-white/5 rounded-2xl p-5 border border-white/10">
            <div className="absolute -top-3 left-6 bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
              Style Summary
            </div>
            <p className="text-white/70 leading-relaxed text-sm mt-1">{recommendations.summary}</p>
          </div>
        </div>
  
        {/* Color Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Best Shirt Colors" emoji="👔" gradient>
            <div className="space-y-3">
              {recommendations.best_shirt_colors.map((color, i) => (
                <ColorSwatch key={i} color={color} />
              ))}
            </div>
          </Section>
  
          <Section title="Best Pant Colors" emoji="👖" gradient>
            <div className="space-y-3">
              {recommendations.best_pant_colors.map((color, i) => (
                <ColorSwatch key={i} color={color} />
              ))}
            </div>
          </Section>
        </div>
  
        {/* Colors to Avoid */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6">
          <h3 className="text-red-300 font-black text-lg mb-5 flex items-center gap-2">
            <span className="text-2xl">🚫</span> Yeh Colors Avoid Karo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.colors_to_avoid.map((color, i) => (
              <ColorSwatch key={i} color={color} />
            ))}
          </div>
        </div>
  
        {/* Outfit Combos */}
        <Section title="Complete Outfit Ideas" emoji="🧥">
          <div className="space-y-3">
            {recommendations.outfit_combinations.map((combo, i) => (
              <OutfitCard key={i} combo={combo} index={i} />
            ))}
          </div>
        </Section>
  
        {/* Style Tips */}
        <Section title="Style Tips Sirf Tumhare Liye" emoji="💡">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.style_tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/5 rounded-xl p-3 border border-white/10">
                <span className="text-purple-400 text-lg flex-shrink-0">✦</span>
                <p className="text-white/70 text-sm leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </Section>
  
        {/* Occasion + Ethnic side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Occasion */}
          <Section title="Kya Pehno Kab?" emoji="📅">
            <div className="space-y-3">
              {Object.entries(recommendations.occasion_advice).map(([occasion, advice], i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-purple-500/30 transition">
                  <p className="text-purple-300 text-xs font-bold uppercase tracking-wide mb-1">{occasion}</p>
                  <p className="text-white/60 text-sm">{advice}</p>
                </div>
              ))}
            </div>
          </Section>
  
          {/* Ethnic */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-6">
            <h3 className="text-amber-200 font-black text-lg mb-5 flex items-center gap-2">
              <span className="text-2xl">🪷</span> Ethnic Wear
            </h3>
            <div className="space-y-3">
              {recommendations.ethnic_wear.map((s, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-amber-400 text-lg flex-shrink-0">★</span>
                  <p className="text-amber-100/70 text-sm leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
  
        {/* Accent Colors */}
        <Section title="Accessories Ke Liye Colors" emoji="⌚">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.accent_colors.map((color, i) => (
              <ColorSwatch key={i} color={color} />
            ))}
          </div>
        </Section>
  
        {/* CTA */}
        <div className="text-center py-6">
          <button
            onClick={onReset}
            className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 text-base"
          >
            🔄 Nayi Photo Analyze Karo
          </button>
          <p className="text-white/25 text-xs mt-3">Har selfie mein better results aate hain!</p>
        </div>
      </div>
    );
  }
  
  export default ResultsDisplay;