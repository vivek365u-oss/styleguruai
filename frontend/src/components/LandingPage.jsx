import React, { useEffect, useRef, useState } from 'react';
import SEOHead from './SEOHead';
import Footer from './Footer';
import { useLanguage } from '../i18n/LanguageContext';
import AdSense from '../AdSense';

// FAQ items and Features are now handled inside the component to allow for dynamic translations.

const floatingItems = ['👗', '👔', '👠', '🧣', '💍', '👒', '🧥', '👜'];

export default function LandingPage({ onGetStarted, onLoginClick }) {
  const { t } = useLanguage();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
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
    <div className="min-h-screen bg-[#050816] text-white overflow-x-hidden" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <SEOHead
        title={t('landingHeroTitle') + " " + t('landingHeroSub')}
        description={t('landingTagline').replace('{perfectColors}', t('perfectColors'))}
      />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Glow blobs */}
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-pink-700/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-indigo-900/20 blur-[100px] pointer-events-none z-0" />

      {/* Floating fashion items */}
      {floatingItems.map((item, i) => (
        <div
          key={i}
          className="fixed text-2xl pointer-events-none z-0 opacity-10"
          style={{
            left: `${(i * 13 + 5) % 95}%`,
            top: `${(i * 17 + 10) % 90}%`,
            animation: `float${i % 3} ${4 + i % 3}s ease-in-out infinite`,
            filter: 'blur(0.5px)',
          }}
        >
          {item}
        </div>
      ))}

      <style>{`
        @keyframes float0 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-15px)} }
        @keyframes float1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-25px)} }
        @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(168,85,247,0.5)} 50%{box-shadow:0 0 40px rgba(236,72,153,0.8)} }
      `}</style>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">S</div>
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">StyleGuru AI</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onLoginClick} className="text-gray-400 hover:text-white transition text-sm">{t('login')}</button>
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition px-5 py-2 rounded-full text-sm font-medium"
            style={{ animation: 'glow 3s ease-in-out infinite' }}
          >
            {t('tryNow')}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-6 md:px-12 py-16 max-w-7xl mx-auto gap-12">
        {/* Left */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-purple-900/40 border border-purple-700/50 text-purple-300 text-xs px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            AI-Powered Fashion Advisor
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            <span className="text-white">StyleGuru AI</span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              {t('landingHeroTitle')}
            </span>
            <br />
            <span className="text-white">{t('landingHeroSub')}</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {t('landingTagline').split('{perfectColors}').map((part, index, array) => (
              <React.Fragment key={index}>
                {part}
                {index < array.length - 1 && <span className="text-purple-400 font-medium">{t('perfectColors')}</span>}
              </React.Fragment>
            ))}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={onGetStarted}
              className="relative group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all px-8 py-4 rounded-full text-lg font-semibold overflow-hidden"
              style={{ animation: 'glow 3s ease-in-out infinite' }}
            >
              <span className="relative z-10">✨ {t('tryNowFree')}</span>
            </button>
            <button
              onClick={onLoginClick}
              className="border border-purple-600/60 hover:border-purple-400 hover:bg-purple-900/20 transition-all px-8 py-4 rounded-full text-lg font-semibold backdrop-blur-sm"
            >
              {t('loginArrow')}
            </button>
          </div>

          <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start text-sm text-gray-500">
            <span>✓ {t('noCreditCard')}</span>
            <span>✓ {t('instantResults')}</span>
            <span>✓ {t('fullyFree')}</span>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col gap-6 mt-10">
            <div className="flex items-center gap-4 justify-center lg:justify-start flex-wrap">
              <div className="flex items-center gap-2 bg-purple-900/30 border border-purple-700/30 rounded-full px-4 py-2">
                <div className="flex -space-x-2">
                  {['#F5DEB3','#C68642','#7B4F2E','#4A2C0A'].map((c,i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-purple-900" style={{backgroundColor:c}} />
                  ))}
                </div>
                <span className="text-purple-300 text-xs font-semibold">10,000+ users</span>
              </div>
              <div className="flex items-center gap-1.5 bg-green-900/20 border border-green-700/30 rounded-full px-4 py-2">
                <span className="text-green-400 text-xs">⭐⭐⭐⭐⭐</span>
                <span className="text-green-300 text-xs font-semibold">4.9/5 rating</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-900/20 border border-blue-700/30 rounded-full px-4 py-2">
                <span className="text-blue-300 text-xs font-semibold">🇮🇳 {t('madeForIndia')}</span>
              </div>
            </div>
            
            <div className="max-w-xl text-xs text-white/30 leading-relaxed text-center lg:text-left">
              Our advanced AI engineering analyzes individual skin complexions against thousands of global fashion data points. 
              By calculating ITA (Individual Typology Angle) and matching it with seasonal color theories, StyleGuru provides 
              highly accurate recommendations for shirts, sarees, and accessories specifically optimized for the unique range of Indian skin tones.
            </div>
          </div>
        </div>

        {/* Right — Phone mockup */}
        <div className="flex-1 flex justify-center lg:justify-end">
          <div className="relative">
            {/* Glow behind phone */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/30 to-pink-600/30 blur-3xl rounded-full scale-110" />

            {/* Phone */}
            <div className="relative w-64 md:w-72 bg-gray-900 rounded-[3rem] border-2 border-purple-700/50 shadow-2xl shadow-purple-900/50 overflow-hidden">
              {/* Notch */}
              <div className="flex justify-center pt-4 pb-2">
                <div className="w-20 h-5 bg-gray-800 rounded-full" />
              </div>

              {/* Screen content */}
              <div className="px-4 pb-6 space-y-3">
                <div className="bg-gradient-to-br from-purple-900/60 to-pink-900/60 rounded-2xl p-4 border border-purple-700/30">
                  <div className="text-xs text-purple-300 mb-2 font-medium">Skin Analysis</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30" />
                    <div>
                      <div className="text-sm font-semibold">Medium Warm</div>
                      <div className="text-xs text-gray-400">ITA: 28.4° · High confidence</div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 font-medium px-1">Best Colors For You</div>
                <div className="grid grid-cols-4 gap-2">
                  {['#000080','#008080','#800000','#FFFDD0','#556B2F','#FF7F50','#FFDB58','#B7410E'].map(c => (
                    <div key={c} className="w-full aspect-square rounded-xl shadow-lg" style={{ backgroundColor: c }} />
                  ))}
                </div>

                <div className="bg-gray-800/60 rounded-2xl p-3 border border-gray-700/30">
                  <div className="text-xs text-gray-400 mb-1">Top Outfit Combo</div>
                  <div className="text-sm font-medium">Navy shirt + Beige chinos</div>
                  <div className="text-xs text-purple-400">Office / Interview ✓</div>
                </div>
              </div>

              {/* Home bar */}
              <div className="flex justify-center pb-3">
                <div className="w-24 h-1 bg-gray-600 rounded-full" />
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl px-3 py-2 text-xs font-bold shadow-lg shadow-purple-900/50">
              AI Powered ✨
            </div>
            <div className="absolute -bottom-4 -left-4 bg-gray-900 border border-purple-700/50 rounded-2xl px-3 py-2 text-xs shadow-lg">
              <span className="text-green-400">●</span> 98% {t('accuracy')}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 md:px-12 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-block bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs px-4 py-2 rounded-full mb-4">Features</div>
          <h2 className="text-3xl md:text-5xl font-bold">
            {t('whyToneFit').split('StyleGuru AI').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">StyleGuru AI</span>}
              </React.Fragment>
            ))}
          </h2>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { value: '10K+', label: t('happyUsers'), emoji: '👥' },
            { value: '95%+', label: t('accuracy'), emoji: '🎯' },
            { value: '6', label: t('skinToneCategories'), emoji: '🎨' },
            { value: '100%', label: t('fullyFree'), emoji: '✨' },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-4 text-center backdrop-blur-sm">
              <p className="text-2xl mb-1">{stat.emoji}</p>
              <p className="text-white font-black text-xl">{stat.value}</p>
              <p className="text-gray-400 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '🎨', title: t('featureSkinTitle'), desc: t('featureSkinDesc') },
            { icon: '👔', title: t('featureOutfitTitle'), desc: t('featureOutfitDesc') },
            { icon: '✨', title: t('featureAdviceTitle'), desc: t('featureAdviceDesc') },
            { icon: '📱', title: t('featureEaseTitle'), desc: t('featureEaseDesc') },
          ].map((f) => (
            <div
              key={f.title}
              className="group bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-purple-600/60 hover:bg-gray-900/80 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-900/20 hover:-translate-y-1 card-hover"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2 text-white">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — Visual Demo */}
      <section className="relative z-10 px-6 md:px-12 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs px-4 py-2 rounded-full mb-4">{t('howItWorks')}</div>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            {t('howItWorksSubTitle').split('{perfectStyle}').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t('perfectStyle')}</span>}
              </React.Fragment>
            ))}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '01', icon: '📸', title: t('step1Title'), desc: t('step1Desc'), color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30', badge: 'bg-purple-500' },
            { step: '02', icon: '🔬', title: t('step2Title'), desc: t('step2Desc'), color: 'from-pink-500/20 to-pink-600/10 border-pink-500/30', badge: 'bg-pink-500' },
            { step: '03', icon: '🎨', title: t('step3Title'), desc: t('step3Desc'), color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30', badge: 'bg-blue-500' },
          ].map((s, i) => (
            <div key={s.step} className={`relative bg-gradient-to-br ${s.color} border rounded-3xl p-6 hover:-translate-y-1 transition-all duration-300`}>
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${s.badge} text-white text-xs font-black mb-4`}>{s.step}</div>
              <div className="text-5xl mb-4">{s.icon}</div>
              <h3 className="text-white font-black text-lg mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              {i < 2 && <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-purple-600 text-2xl z-10">→</div>}
            </div>
          ))}
        </div>

        {/* Visual result preview */}
        <div className="mt-10 bg-gray-900/60 border border-gray-800 rounded-3xl p-6 backdrop-blur-sm">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wide text-center mb-4">{t('whatYouGet')}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🎨', label: t('colorPalette'), desc: t('colorPaletteDesc') },
              { icon: '👔', label: t('outfitCombos'), desc: t('outfitCombosDesc') },
              { icon: '🛍️', label: t('shopLinks'), desc: t('shopLinksDesc') },
              { icon: '💡', label: t('styleTips'), desc: t('styleTipsDesc') },
            ].map((item) => (
              <div key={item.label} className="text-center p-3 bg-white/5 rounded-2xl border border-white/10">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-white font-bold text-xs">{item.label}</p>
                <p className="text-gray-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-12 py-20 max-w-4xl mx-auto text-center">
        <div className="relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-700/40 rounded-3xl p-12 md:p-16 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 blur-2xl" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">{t('startJourneyToday')}</h2>
            <p className="text-gray-400 text-lg mb-10">{t('joinThousands')}</p>
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all px-12 py-4 rounded-full text-lg font-semibold shadow-2xl shadow-purple-900/50 hover:scale-105"
              style={{ animation: 'glow 3s ease-in-out infinite' }}
            >
              {t('getStartedFree')}
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs px-4 py-2 rounded-full mb-4">Reviews</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {t('whatUsersSay').split('{areSaying}').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t('areSaying')}</span>}
              </React.Fragment>
            ))}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Priya S.', location: 'Mumbai', skin: 'Medium Warm', review: 'Finally an app that understands Indian skin tones! The color recommendations are spot on. I wore the suggested teal kurta to a wedding and got so many compliments.', rating: 5, emoji: '🥻' },
            { name: 'Rahul K.', location: 'Delhi', skin: 'Wheatish', review: 'The outfit checker feature is amazing. I uploaded my shirt and it told me exactly which pants would look good. Saved me from a fashion disaster!', rating: 5, emoji: '👔' },
            { name: 'Ananya M.', location: 'Bangalore', skin: 'Fair Cool', review: 'I never knew my undertone was cool until StyleGuru AI told me. Now I understand why navy and purple always looked better on me than orange. Game changer!', rating: 5, emoji: '✨' },
            { name: 'Vikram T.', location: 'Chennai', skin: 'Dark Warm', review: 'As someone with dark skin, I always struggled to find colors that suited me. This app recommended cobalt blue and white — and wow, the difference is incredible!', rating: 5, emoji: '🎨' },
            { name: 'Sneha R.', location: 'Pune', skin: 'Olive Neutral', review: 'The lehenga color recommendations for my sister\'s wedding were perfect. I went with the suggested deep burgundy and everyone loved it. Highly recommend!', rating: 5, emoji: '💃' },
            { name: 'Arjun P.', location: 'Hyderabad', skin: 'Light Warm', review: 'The body type tips combined with skin tone recommendations are super helpful. I\'m slim and the app suggested horizontal stripes — looks great on me!', rating: 5, emoji: '👕' },
          ].map((t, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-purple-600/40 transition-all backdrop-blur-sm">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(t.rating)].map((_, j) => <span key={j} className="text-yellow-400 text-sm">⭐</span>)}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.review}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg">{t.emoji}</div>
                <div>
                  <p className="text-white font-bold text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.location} · {t.skin} skin</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs px-4 py-2 rounded-full mb-4">FAQ</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            {t('faqTitle').split('{questions}').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{t('questions')}</span>}
              </React.Fragment>
            ))}
          </h2>
        </div>
        <div className="space-y-3">
          {[
            { q: t('faq1Q'), a: t('faq1A') },
            { q: t('faq2Q'), a: t('faq2A') },
            { q: t('faq3Q'), a: t('faq3A') },
            { q: t('faq4Q'), a: t('faq4A') },
            { q: t('faq5Q'), a: t('faq5A') },
            { q: t('faq6Q'), a: t('faq6A') },
            { q: t('faq7Q'), a: t('faq7A') },
            { q: t('faq8Q'), a: t('faq8A') },
          ].map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* Blog Section */}
      <section className="relative z-10 px-6 md:px-12 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-block bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs px-4 py-2 rounded-full mb-4">Fashion Blog</div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Style Tips & <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Fashion Guides</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { slug: 'skin-tone-colors', title: t('blog1Title'), excerpt: t('blog1Excerpt'), emoji: '🎨', date: 'Jan 15, 2025' },
            { slug: 'outfit-guide', title: t('blog2Title'), excerpt: t('blog2Excerpt'), emoji: '👔', date: 'Jan 20, 2025' },
            { slug: 'ai-fashion', title: t('blog3Title'), excerpt: t('blog3Excerpt'), emoji: '🤖', date: 'Jan 25, 2025' },
          ].map((post) => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-purple-600/60 hover:bg-gray-900/80 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-900/20 hover:-translate-y-1 flex flex-col"
            >
              <div className="text-3xl mb-3">{post.emoji}</div>
              <p className="text-purple-400 text-xs mb-2">{post.date}</p>
              <h3 className="text-white font-bold text-base mb-2 group-hover:text-purple-300 transition-colors">{post.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-1">{post.excerpt}</p>
              <p className="text-purple-400 text-xs mt-4 font-semibold group-hover:text-purple-300">{t('readMore') || 'Read More →'}</p>
            </a>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href="/blog" className="inline-block border border-purple-600/60 hover:border-purple-400 hover:bg-purple-900/20 transition-all px-8 py-3 rounded-full text-sm font-semibold text-white">
            {t('viewAllArticles') || 'View All Articles →'}
          </a>
        </div>
      </section>

      {/* AdSense Partner Block - For Google AdSense Readiness */}
      <section className="relative z-10 px-6 md:px-12 py-12 max-w-7xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-md text-center">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">Official StyleGuru AI Partner Content</p>
          <div className="min-h-[200px] flex items-center justify-center border border-white/5 bg-black/20 rounded-2xl">
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
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-600/40 transition-all">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <span className="text-white font-semibold text-sm pr-4">{q}</span>
        <span className={`text-purple-400 text-lg flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-gray-800/50">
          <p className="text-gray-400 text-sm leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}
