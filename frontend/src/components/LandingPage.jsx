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

export default function LandingPage({ onGetStarted, onLoginClick }) {
  const { t } = useLanguage();
  const canvasRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [quizStep, setQuizStep] = useState(0); // 0: Hero, 1: Gender, 2: Occasion, 3: Vibe
  const [quizData, setQuizData] = useState({ gender: 'male', occasion: 'wedding', vibe: 'traditional' });

  const startQuiz = () => setQuizStep(1);
  const handleQuizNext = (field, value) => {
    const updated = { ...quizData, [field]: value };
    setQuizData(updated);
    if (quizStep < 3) {
      setQuizStep(quizStep + 1);
    } else {
      onGetStarted(updated);
    }
  };

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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 overflow-x-hidden selection:bg-purple-500/30" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <SEOHead
        title={t('landingHeroTitle') + " " + t('landingHeroSub')}
        description={t('landingTagline').replace('{perfectColors}', t('perfectColors'))}
      />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Glow blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-pink-600/10 blur-[120px] pointer-events-none z-0" />

      {/* Floating fashion items */}
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

      <navbar className="relative z-[100] border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/80 backdrop-blur-xl block">
        <div className="flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-purple-500/20">S</div>
            <span className="text-xl font-black bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent tracking-tight">StyleGuru AI</span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={onLoginClick} className="opacity-60 hover:opacity-100 transition text-sm font-medium">{t('login')}</button>
            <button
              onClick={() => startQuiz()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-105 transition-all px-6 py-2.5 rounded-full text-sm font-bold text-white shadow-lg shadow-purple-500/20 active:scale-95"
            >
              {t('tryNow')}
            </button>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--bg-accent)] border border-[var(--border-primary)]"
          >
            {isMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[var(--bg-primary)]/95 backdrop-blur-2xl border-b border-[var(--border-primary)] p-6 md:hidden animate-fade-in flex flex-col gap-4 shadow-2xl z-[101]">
            <button onClick={() => { setIsMenuOpen(false); onLoginClick(); }} className="w-full py-4 text-center opacity-70">{t('login')}</button>
            <button onClick={() => { setIsMenuOpen(false); startQuiz(); }} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-center text-white font-bold">{t('tryNow')}</button>
          </div>
        )}
      </navbar>

      {/* Hero / Quiz Section */}
      <section className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 py-16 md:py-24 max-w-7xl mx-auto gap-16 lg:gap-12">
        <div className="flex-[1.2] text-center lg:text-left min-h-[500px] flex flex-col justify-center">
          {quizStep === 0 ? (
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                Wedding Fashion DNA Specialist
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-black leading-[1.1] mb-8">
                StyleGuru <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">Wedding DNA</span>
              </h1>
              <p className="text-[var(--text-secondary)] text-lg md:text-xl mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                {t('tagline')}
              </p>
              <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                <button onClick={startQuiz} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-[1.02] transition-all px-10 py-5 rounded-3xl text-lg font-black text-white shadow-2xl">
                  🧬 Discover Your Style DNA
                </button>
                <button onClick={onLoginClick} className="border border-[var(--border-primary)] hover:border-purple-500/50 px-10 py-5 rounded-3xl text-lg font-black">
                  {t('loginArrow')}
                </button>
              </div>
            </div>
          ) : quizStep === 1 ? (
             <div className="animate-fade-in">
                <h2 className="text-4xl md:text-6xl font-black mb-10">Step 1: Your <span className="text-purple-500">Identity</span></h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0">
                  <button onClick={() => handleQuizNext('gender', 'male')} className="p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-purple-600/20 transition-all text-xl font-bold flex flex-col items-center gap-3">
                    <span className="text-4xl">👨</span> Male
                  </button>
                  <button onClick={() => handleQuizNext('gender', 'female')} className="p-8 rounded-3xl border border-white/10 bg-white/5 hover:bg-pink-600/20 transition-all text-xl font-bold flex flex-col items-center gap-3">
                    <span className="text-4xl">👩</span> Female
                  </button>
                </div>
                <button onClick={() => setQuizStep(0)} className="mt-8 opacity-40 hover:opacity-100 font-bold transition">← Reset</button>
             </div>
          ) : quizStep === 2 ? (
            <div className="animate-fade-in">
               <h2 className="text-4xl md:text-6xl font-black mb-10">Step 2: The <span className="text-pink-500">Occasion</span></h2>
               <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto lg:mx-0">
                 {['Wedding', 'Cocktail', 'Haldi', 'Mehendi'].map(occ => (
                    <button key={occ} onClick={() => handleQuizNext('occasion', occ.toLowerCase())} className="p-6 rounded-3xl border border-white/10 bg-white/5 hover:border-purple-500 transition-all text-lg font-black">
                      {occ}
                    </button>
                 ))}
               </div>
               <button onClick={() => setQuizStep(1)} className="mt-8 opacity-40 hover:opacity-100 font-bold transition">← Previous</button>
            </div>
          ) : (
            <div className="animate-fade-in">
               <h2 className="text-4xl md:text-6xl font-black mb-10">Final Step: Your <span className="text-emerald-500">Vibe</span></h2>
               <div className="grid grid-cols-1 gap-4 max-w-md mx-auto lg:mx-0">
                 {['Traditional Elite', 'Modern Fusion', 'Minimal Chic'].map(vibe => (
                    <button key={vibe} onClick={() => handleQuizNext('vibe', vibe.toLowerCase())} className="p-6 rounded-3xl border border-white/10 bg-white/5 hover:border-emerald-500 transition-all text-lg font-black text-left flex items-center justify-between">
                      {vibe}
                      <span className="text-emerald-500">→</span>
                    </button>
                 ))}
               </div>
               <button onClick={() => setQuizStep(2)} className="mt-8 opacity-40 hover:opacity-100 font-bold transition">← Previous</button>
            </div>
          )}
        </div>

        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 blur-3xl rounded-full scale-110" />
            <div className="relative w-64 md:w-72 bg-gray-900 rounded-[3rem] border-2 border-purple-700/50 shadow-2xl overflow-hidden">
              <div className="flex justify-center pt-4 pb-2"><div className="w-20 h-5 bg-gray-800 rounded-full" /></div>
              <div className="px-4 pb-6 space-y-3">
                <div className="bg-gradient-to-br from-purple-900/60 to-pink-900/60 rounded-2xl p-4 border border-purple-700/30">
                  <div className="text-xs text-purple-300 mb-2 font-medium">Skin Analysis</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
                    <div className="text-sm font-semibold">Medium Warm</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['#000080','#008080','#800000','#FFFDD0','#556B2F','#FF7F50','#FFDB58','#B7410E'].map(c => (
                    <div key={c} className="w-full aspect-square rounded-xl" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="bg-gray-800/60 rounded-2xl p-3 border border-gray-700/30 text-xs font-medium">
                  Top Outfit Combo: Navy shirt + Beige chinos
                </div>
              </div>
              <div className="flex justify-center pb-3"><div className="w-24 h-1 bg-gray-600 rounded-full" /></div>
            </div>
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl px-3 py-2 text-xs font-bold shadow-lg">AI Powered ✨</div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-6 md:px-12 py-20 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <IconRenderer icon={FashionIcons.Analysis} />, title: t('featureSkinTitle'), desc: t('featureSkinDesc') },
            { icon: <IconRenderer icon={FashionIcons.Wardrobe} />, title: t('featureOutfitTitle'), desc: t('featureOutfitDesc') },
            { icon: <IconRenderer icon={FashionIcons.Star} />, title: t('featureAdviceTitle'), desc: t('featureAdviceDesc') },
            { icon: <IconRenderer icon={FashionIcons.Global} />, title: t('featureEaseTitle'), desc: t('featureEaseDesc') },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-purple-600/60 transition-all">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2 text-white">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 md:px-12 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-10"><h2 className="text-3xl md:text-4xl font-bold text-white">Frequently Asked <span className="text-purple-500">Questions</span></h2></div>
        <div className="space-y-3">
          {[
            { q: t('faq1Q'), a: t('faq1A') },
            { q: t('faq2Q'), a: t('faq2A') },
            { q: t('faq3Q'), a: t('faq3A') },
            { q: t('faq4Q'), a: t('faq4A') },
          ].map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      <section className="relative z-10 px-6 md:px-12 py-12 max-w-7xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center min-h-[200px] flex items-center justify-center">
           <AdSense />
        </div>
      </section>

      <Footer />
      <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-600/40 transition-all">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-white font-semibold text-sm">{q}</span>
        <span className={`text-purple-400 text-lg transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <div className="px-5 pb-4 border-t border-gray-800/50"><p className="text-gray-400 text-sm pt-3">{a}</p></div>}
    </div>
  );
}
