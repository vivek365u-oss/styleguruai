import React, { useEffect, useRef, useState } from 'react';
import SEOHead from './SEOHead';
import Footer from './Footer';
import { useLanguage } from '../i18n/LanguageContext';
import AdSense from '../AdSense';
import { FashionIcons, IconRenderer } from './Icons';

const floatingItems = [
  FashionIcons.Dress,
  FashionIcons.Shirt,
  FashionIcons.Watch,
  FashionIcons.Heels,
  FashionIcons.Accessories,
  FashionIcons.Hoodie
];

const testimonials = [
  { 
    name: 'Priya S.', 
    location: 'Mumbai', 
    skin: 'Medium Warm', 
    review: 'The accuracy is insane! Finally found the perfect shade of emerald that actually makes my skin glow.', 
    img: 'file:///C:/Users/VIVEK/.gemini/antigravity/brain/f643caa6-9b6c-46d3-9d2b-2ee6d34e56f1/priya_mumbai_testimonial_1775823367230.png'
  },
  { 
    name: 'Rahul K.', 
    location: 'Delhi', 
    skin: 'Wheatish', 
    review: 'Used this for my cousin\'s wedding planning. The outfit combos saved me so much time shopping.', 
    img: 'file:///C:/Users/VIVEK/.gemini/antigravity/brain/f643caa6-9b6c-46d3-9d2b-2ee6d34e56f1/rahul_delhi_testimonial_1775823385096.png'
  },
  { 
    name: 'Ananya M.', 
    location: 'Bangalore', 
    skin: 'Fair Cool', 
    review: 'This AI is a game changer for online shopping. No more returning clothes because the color looks "off".', 
    img: 'file:///C:/Users/VIVEK/.gemini/antigravity/brain/f643caa6-9b6c-46d3-9d2b-2ee6d34e56f1/ananya_bangalore_testimonial_1775823402459.png'
  }
];

export default function LandingPage({ onGetStarted, onLoginClick }) {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.3 + 0.1,
    }));

    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 85, 247, ${p.alpha})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <SEOHead
        title={t('landingHeroTitle') + " " + t('landingHeroSub')}
        description={t('landingTagline').replace('{perfectColors}', t('perfectColors'))}
      />

      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Hero Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-pink-600/10 blur-[120px] pointer-events-none z-0" />

      {/* Floating items */}
      {floatingItems.map((item, i) => (
        <div
          key={i}
          className="fixed w-12 h-12 pointer-events-none z-0 opacity-[0.05]"
          style={{
            left: `${(i * 13 + 7) % 95}%`,
            top: `${(i * 17 + 12) % 90}%`,
            animation: `float${i % 3} ${5 + i % 2}s ease-in-out infinite`,
          }}
        >
          <IconRenderer icon={item} />
        </div>
      ))}

      {/* Navbar */}
      <nav className="relative z-[100] border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-black text-white shadow-lg">S</div>
            <span className="text-xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">StyleGuru AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <button onClick={onLoginClick} className="opacity-60 hover:opacity-100 transition text-sm font-medium">{t('login')}</button>
            <button onClick={onGetStarted} className="bg-white text-black hover:scale-105 transition-all px-6 py-2.5 rounded-full text-sm font-bold shadow-xl active:scale-95">
              {t('tryNow')}
            </button>
          </div>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10">
            {isMenuOpen ? "✕" : "☰"}
          </button>
        </div>
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-2xl border-b border-white/10 p-6 md:hidden flex flex-col gap-4 z-[101]">
            <button onClick={() => { setIsMenuOpen(false); onLoginClick(); }} className="w-full py-4 text-center opacity-70 font-bold border-b border-white/10">{t('login')}</button>
            <button onClick={() => { setIsMenuOpen(false); onGetStarted(); }} className="w-full py-4 bg-white text-black rounded-2xl text-center font-bold">{t('tryNow')}</button>
          </div>
        )}
      </nav>

      {/* Main Hero */}
      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 py-20 md:py-32 max-w-7xl mx-auto gap-16">
        <div className="flex-[1.2] text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Empowering Personal Style Through AI
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-[88px] mb-8">
            Elevate Your <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">Fashion Aura</span>
          </h1>
          <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            StyleGuru AI analyzes your unique skin typology to discover the precise colors that amplify your presence.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
            <button onClick={onGetStarted} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] transition-all px-12 py-5 rounded-3xl text-lg font-black text-white shadow-2xl">
              Get Started Free →
            </button>
            <button onClick={onLoginClick} className="glass-card-premium px-10 py-5 rounded-3xl text-lg font-black hover:bg-white/10">
              Returning Member
            </button>
          </div>
        </div>

        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 blur-3xl rounded-full scale-110" />
            <div className="relative w-64 md:w-72 bg-gray-950 rounded-[3.5rem] p-1.5 border-4 border-white/5 shadow-2xl">
              <div className="bg-black h-full w-full rounded-[3.2rem] overflow-hidden flex flex-col">
                <div className="h-6 w-full bg-black flex justify-center pt-3"><div className="w-16 h-4 bg-gray-800 rounded-full" /></div>
                <div className="flex-1 p-5 space-y-4">
                  <div className="glass-card-premium p-4 rounded-2xl border border-white/10">
                    <p className="text-[10px] text-purple-400 font-bold mb-2">Style Analysis</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                      <div><p className="text-sm font-black">Medium Warm</p><p className="text-[10px] opacity-40">Confidence: 98%</p></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {['#000080','#008080','#800000','#FFFDD0','#556B2F','#FF7F50','#FFDB58','#B7410E'].map(c => (
                      <div key={c} className="aspect-square rounded-lg shadow-inner" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5"><p className="text-[10px] opacity-40 mb-1">Top Pick</p><p className="text-xs font-bold">Midnight Navy Dinner Suit</p></div>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 glass-card-premium px-4 py-2 rounded-2xl text-[10px] font-black animate-bounce">AI Verified ✨</div>
          </div>
        </div>
      </main>

      {/* Visual Proof Section */}
      <section className="relative z-10 px-6 md:px-12 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black mb-4">Trusted by 10,000+ Fashionistas</h2>
          <p className="text-gray-500">Real users. Real results. Instant transformation.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="glass-card-premium p-8 rounded-[2.5rem] flex flex-col gap-6 group hover:-translate-y-2">
              <div className="flex items-center gap-1 text-yellow-500 text-xs">★★★★★</div>
              <p className="text-gray-300 italic flex-1">"{t.review}"</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-purple-500/30">
                  <img src={t.img} alt={t.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                </div>
                <div>
                  <p className="font-black text-white">{t.name}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t.location} • {t.skin}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 px-6 md:px-12 py-24 bg-white/[0.02] border-y border-white/5 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {[
            { icon: FashionIcons.Analysis, title: 'Skin Tone Precision', desc: 'Analyzes 100+ facial data points to pinpoint your color season with 98% accuracy.' },
            { icon: FashionIcons.Wardrobe, title: 'Smart Wardrobe', desc: 'Build your virtual closet and get weather-aware outfit daily briefings.' },
            { icon: FashionIcons.Bulb, title: 'Expert Style BOT', desc: 'Interact with our AI Personal Shopper for instant accessory and fitting advice.' },
            { icon: FashionIcons.Global, title: 'Shop with Confidence', desc: 'Auto-find items on Amazon, Myntra, and Flipkart that match your unique DNA.' }
          ].map((f, i) => (
            <div key={i} className="group">
              <div className="w-12 h-12 mb-6 text-purple-500 group-hover:scale-110 transition-transform"><IconRenderer icon={f.icon} /></div>
              <h3 className="text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Empty Space / AdSense */}
      <section className="px-6 py-20 max-w-7xl mx-auto flex flex-col items-center">
        <div className="w-full max-w-4xl glass-card-premium p-10 rounded-[3rem] text-center">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6">Promoted Style Advice</p>
          <div className="min-h-[200px] flex items-center justify-center bg-black/20 rounded-2xl border border-white/5">
            <AdSense />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card-premium rounded-2xl overflow-hidden mb-3">
      <button onClick={() => setOpen(!open)} className="w-full px-6 py-5 text-left flex justify-between items-center">
        <span className="font-bold text-sm">{q}</span>
        <span className={`text-purple-500 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <div className="px-6 pb-5 border-t border-white/5 pt-4 text-sm text-gray-500 leading-relaxed">{a}</div>}
    </div>
  );
}
