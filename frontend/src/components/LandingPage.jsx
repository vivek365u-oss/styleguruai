import React, { useEffect, useRef } from 'react';
import SEOHead from './SEOHead';
import Footer from './Footer';

const features = [
  { icon: '🎨', title: 'Skin Tone Detection', desc: 'AI-powered analysis using advanced CIELAB color science.' },
  { icon: '👔', title: 'Outfit Recommendations', desc: 'Personalized color palettes for shirts, pants & accessories.' },
  { icon: '✨', title: 'Fashion Advice', desc: 'Style tips, occasion advice & ethnic wear suggestions.' },
  { icon: '📱', title: 'Easy to Use', desc: 'Upload a selfie — get instant results in seconds.' },
];

const floatingItems = ['👗', '👔', '👠', '🧣', '💍', '👒', '🧥', '👜'];

export default function LandingPage({ onGetStarted }) {
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
        title="StyleGuru AI – AI-Powered Fashion Advisor"
        description="Get personalized outfit recommendations based on your skin tone using AI. Upload a selfie and discover your perfect colors."
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
          <button onClick={onGetStarted} className="text-gray-400 hover:text-white transition text-sm">Login</button>
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition px-5 py-2 rounded-full text-sm font-medium"
            style={{ animation: 'glow 3s ease-in-out infinite' }}
          >
            Try Now
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
              Smart Fashion
            </span>
            <br />
            <span className="text-white">Advisor</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Get outfit recommendations based on your skin tone using AI.
            Upload a selfie and discover your <span className="text-purple-400 font-medium">perfect colors</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              onClick={onGetStarted}
              className="relative group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all px-8 py-4 rounded-full text-lg font-semibold overflow-hidden"
              style={{ animation: 'glow 3s ease-in-out infinite' }}
            >
              <span className="relative z-10">✨ Try Now — It's Free</span>
            </button>
            <button
              onClick={onGetStarted}
              className="border border-purple-600/60 hover:border-purple-400 hover:bg-purple-900/20 transition-all px-8 py-4 rounded-full text-lg font-semibold backdrop-blur-sm"
            >
              Login →
            </button>
          </div>

          <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start text-sm text-gray-500">
            <span>✓ No credit card</span>
            <span>✓ Instant results</span>
            <span>✓ 100% free</span>
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
              <span className="text-green-400">●</span> 98% Accuracy
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 md:px-12 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-block bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs px-4 py-2 rounded-full mb-4">Features</div>
          <h2 className="text-3xl md:text-5xl font-bold">
            Why <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">StyleGuru AI?</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-purple-600/60 hover:bg-gray-900/80 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-900/20 hover:-translate-y-1"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2 text-white">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 md:px-12 py-20 max-w-4xl mx-auto text-center">
        <div className="inline-block bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs px-4 py-2 rounded-full mb-4">How It Works</div>
        <h2 className="text-3xl md:text-5xl font-bold mb-12">3 Simple Steps</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          {[
            { step: '01', icon: '📸', title: 'Upload Selfie', desc: 'Take or upload a clear photo' },
            { step: '02', icon: '🔬', title: 'AI Analysis', desc: 'Skin tone detected instantly' },
            { step: '03', icon: '🎨', title: 'Get Colors', desc: 'Personalized recommendations' },
          ].map((s, i) => (
            <React.Fragment key={s.step}>
              <div className="flex-1 bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-purple-600/50 transition-all backdrop-blur-sm">
                <div className="text-xs text-purple-400 font-bold mb-3">{s.step}</div>
                <div className="text-4xl mb-3">{s.icon}</div>
                <div className="font-semibold mb-1">{s.title}</div>
                <div className="text-gray-400 text-sm">{s.desc}</div>
              </div>
              {i < 2 && <div className="text-purple-600 text-2xl hidden md:block">→</div>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 md:px-12 py-20 max-w-4xl mx-auto text-center">
        <div className="relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-700/40 rounded-3xl p-12 md:p-16 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 blur-2xl" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Start your fashion journey today</h2>
            <p className="text-gray-400 text-lg mb-10">Join thousands discovering their perfect style with AI.</p>
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all px-12 py-4 rounded-full text-lg font-semibold shadow-2xl shadow-purple-900/50 hover:scale-105"
              style={{ animation: 'glow 3s ease-in-out infinite' }}
            >
              Get Started — Free ✨
            </button>
          </div>
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
            { slug: 'skin-tone-colors', title: 'Best Colors for Your Skin Tone', excerpt: 'Discover which colors complement your skin tone — from fair to dark, find your perfect palette.', emoji: '🎨', date: 'Jan 15, 2025' },
            { slug: 'outfit-guide', title: 'How to Choose the Perfect Outfit', excerpt: 'Master outfit selection based on occasion, color coordination, and seasonal trends.', emoji: '👔', date: 'Jan 20, 2025' },
            { slug: 'ai-fashion', title: 'How AI is Changing Fashion', excerpt: 'Explore how AI is revolutionizing fashion with personalized styling and smart recommendations.', emoji: '🤖', date: 'Jan 25, 2025' },
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
              <p className="text-purple-400 text-xs mt-4 font-semibold group-hover:text-purple-300">Read More →</p>
            </a>
          ))}
        </div>
        <div className="text-center mt-8">
          <a href="/blog" className="inline-block border border-purple-600/60 hover:border-purple-400 hover:bg-purple-900/20 transition-all px-8 py-3 rounded-full text-sm font-semibold text-white">
            View All Articles →
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
