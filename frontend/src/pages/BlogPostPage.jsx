import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { blogPosts } from '../data/blogPosts';
import { trackBlogRead, trackBlogScroll, trackCTAClick } from '../utils/analytics';

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);
  const scrollTracked = useRef({ 50: false, 75: false, 100: false });

  // Interactive widget state
  const [selectedUndertone, setSelectedUndertone] = useState('warm');
  const [copied, setCopied] = useState(false);

  const GRAD = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)';

  // Track blog read on mount
  useEffect(() => {
    if (post) {
      trackBlogRead(post.slug, post.title);
      scrollTracked.current = { 50: false, 75: false, 100: false };
      window.scrollTo(0, 0);
    }
  }, [post?.slug]);

  // Track scroll depth (50%, 75%, 100%)
  useEffect(() => {
    if (!post) return;
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((scrollTop / docHeight) * 100);
      [50, 75, 100].forEach((threshold) => {
        if (pct >= threshold && !scrollTracked.current[threshold]) {
          scrollTracked.current[threshold] = true;
          trackBlogScroll(post.slug, threshold);
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post?.slug]);

  // Related articles
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    const currentIndex = blogPosts.findIndex((p) => p.slug === post.slug);
    const related = [];
    for (let i = 1; i <= 3; i++) {
      const nextIndex = (currentIndex + i) % blogPosts.length;
      related.push(blogPosts[nextIndex]);
    }
    return related;
  }, [post]);

  if (!post) return <Navigate to="/404" replace />;

  const words = post.sections
    ? post.sections.reduce((acc, s) => acc + (s.body || '').split(/\s+/).length, 0)
    : 600;
  const readTime = Math.max(3, Math.ceil(words / 200));

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = `${post.title} — StyleGuru AI`;

  const copyToClipboard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const undertoneData = {
    warm: {
      label: 'Warm Undertone',
      accent: 'Golden, Peach, Honey',
      swatches: [
        { name: 'Terracotta', hex: '#C2410C' },
        { name: 'Mustard', hex: '#D97706' },
        { name: 'Olive Green', hex: '#4D7C0F' },
        { name: 'Warm Coral', hex: '#F43F5E' },
      ],
      tip: 'Flattered by earth tones, warm gold jewelry, rich rusts, and warm greens.'
    },
    cool: {
      label: 'Cool Undertone',
      accent: 'Pink, Ruby, Bluish',
      swatches: [
        { name: 'Royal Sapphire', hex: '#1D4ED8' },
        { name: 'Emerald', hex: '#047857' },
        { name: 'Deep Plum', hex: '#7E22CE' },
        { name: 'Magenta', hex: '#BE185D' },
      ],
      tip: 'Flattered by jewel tones, silver jewelry, crisp ice whites, and berry reds.'
    },
    neutral: {
      label: 'Neutral Undertone',
      accent: 'Olive Honey, Balanced',
      swatches: [
        { name: 'Teal Blue', hex: '#0F766E' },
        { name: 'Dusty Rose', hex: '#BE123C' },
        { name: 'Soft Navy', hex: '#1E3A8A' },
        { name: 'Sage Green', hex: '#15803D' },
      ],
      tip: 'Flattered by soft, muted shades from both warm and cool palettes.'
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 font-sans antialiased selection:bg-violet-500 selection:text-white">
      <SEOHead
        title={`${post.title} — StyleGuru AI`}
        description={post.description}
      />

      {/* ─── Sticky Top Navigation ─── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/blog"
              className="text-xs font-bold text-slate-600 hover:text-violet-600 transition-colors no-underline flex items-center gap-1.5"
            >
              <span>←</span>
              <span>All Articles</span>
            </Link>

            <span className="text-slate-300 hidden sm:inline">|</span>

            <Link to="/" className="flex items-center gap-2 no-underline group hidden sm:flex">
              <div className="w-7 h-7 rounded-lg p-0.5 bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain rounded-md bg-white" />
              </div>
              <span className="font-serif font-black text-sm tracking-tight text-slate-900">
                StyleGuru <span className="text-violet-600 font-sans text-[10px] uppercase font-bold">AI</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              onClick={() => trackCTAClick('analyze_my_style', 'blog_top_nav')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm shadow-violet-500/20 hover:shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 no-underline cursor-pointer flex items-center gap-1.5"
              style={{ background: GRAD }}
            >
              <span>✨</span>
              <span>Analyze My Skin Free</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Article Container ─── */}
      <main className="max-w-3xl mx-auto px-6 sm:px-8 pt-12 pb-24">
        
        {/* Category Pill & Reading Time */}
        <div className="flex items-center gap-3 mb-4 text-xs font-bold">
          <span className="px-3 py-1 rounded-full bg-violet-100 text-violet-800 uppercase tracking-wider text-[10px]">
            🧬 Skin Tone & Color Science
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500 font-medium">⏱️ {readTime} min read</span>
        </div>

        {/* Main Article Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif text-slate-900 tracking-tight leading-[1.18] mb-6">
          {post.title}
        </h1>

        {/* Byline and Date */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-200/80 mb-10 text-xs text-slate-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 p-0.5 flex-shrink-0 shadow-sm">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center font-bold text-violet-700 text-sm">
                V
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-900 m-0 leading-tight">Vivek Kumar</p>
              <p className="text-slate-500 m-0 text-[11px] leading-tight">Founder & AI Stylist • StyleGuru AI</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <span>
              {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* ─── Social Share Bar ─── */}
        <div className="flex items-center gap-2 mb-10 pb-6 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Share:</span>
          
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareTitle + ' — ' + shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1.5 transition-colors no-underline"
          >
            <span>💬</span> <span>WhatsApp</span>
          </a>

          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors no-underline"
          >
            <span>𝕏</span> <span>Post</span>
          </a>

          <button
            onClick={copyToClipboard}
            className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border-none"
          >
            <span>🔗</span>
            <span>{copied ? 'Link Copied! ✓' : 'Copy Link'}</span>
          </button>
        </div>

        {/* ─── Article Body with In-Content Conversion Hooks ─── */}
        <article className="space-y-12">
          {post.sections.map((section, idx) => {
            return (
              <React.Fragment key={idx}>
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full bg-gradient-to-b from-violet-600 to-pink-500 flex-shrink-0" />
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 leading-snug">
                      {section.heading}
                    </h2>
                  </div>

                  <p className="text-slate-700 text-[16px] sm:text-[17px] leading-[1.85] font-sans">
                    {section.body}
                  </p>
                </section>

                {/* ── Hook 1: Interactive Undertone Teaser Widget (Inserted after Section 2) ── */}
                {idx === 1 && (
                  <div className="my-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-violet-50 via-white to-pink-50/40 border border-violet-200/80 shadow-lg relative overflow-hidden">
                    <div className="max-w-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-100 px-3 py-1 rounded-full inline-block mb-3">
                        ⚡ Interactive Reader Widget
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black font-serif text-slate-900 mb-2">
                        Quick Check: What's Your Indian Undertone?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed">
                        Tap your skin's sub-surface hue to preview which signature colors make you look vibrant:
                      </p>

                      {/* 3 Interactive Tabs */}
                      <div className="grid grid-cols-3 gap-2 mb-5">
                        {[
                          { id: 'warm', label: 'Warm (Golden)' },
                          { id: 'cool', label: 'Cool (Ruby/Pink)' },
                          { id: 'neutral', label: 'Neutral (Olive)' },
                        ].map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => setSelectedUndertone(u.id)}
                            className={`py-2 px-2 sm:px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              selectedUndertone === u.id
                                ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300'
                            }`}
                          >
                            {u.label}
                          </button>
                        ))}
                      </div>

                      {/* Dynamic Swatch Preview for selected undertone */}
                      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs mb-5">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-800">
                            {undertoneData[selectedUndertone].label} Signature Swatches:
                          </span>
                          <span className="text-[10px] text-violet-600 font-semibold">
                            {undertoneData[selectedUndertone].accent}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-2">
                          {undertoneData[selectedUndertone].swatches.map((sw, sIdx) => (
                            <div key={sIdx} className="text-center">
                              <div
                                className="w-full h-9 rounded-lg shadow-xs border border-black/10"
                                style={{ backgroundColor: sw.hex }}
                              />
                              <span className="text-[10px] font-semibold text-slate-600 block mt-1 truncate">
                                {sw.name}
                              </span>
                            </div>
                          ))}
                        </div>

                        <p className="text-[11px] text-slate-500 m-0 pt-1 leading-relaxed">
                          💡 {undertoneData[selectedUndertone].tip}
                        </p>
                      </div>

                      {/* Direct Tool CTA */}
                      <Link
                        to="/"
                        onClick={() => trackCTAClick('analyze_my_style', 'blog_inline_widget')}
                        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl text-white font-bold text-xs shadow-md shadow-violet-500/20 hover:shadow-lg transition-all no-underline"
                        style={{ background: GRAD }}
                      >
                        <span>📸 Analyze My Exact Undertone Free (Selfie)</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* ── Hook 2: Direct Smart Shopping Spotlight (Inserted after Section 3) ── */}
                {idx === 3 && (
                  <div className="my-10 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-lg space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-100 to-violet-100 text-pink-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
                        🛍️
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-pink-600 uppercase tracking-widest block">
                          Core Problem Solved
                        </span>
                        <h4 className="text-base sm:text-lg font-bold text-slate-900 font-serif">
                          Buy Clothes in Colors That Flatter Your Face & Body
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Knowing your skin tone is only half the battle. StyleGuru AI connects your analyzed tone to <strong>1-click direct shopping links on Myntra, Amazon India, Ajio & Nykaa</strong> — pre-filtered so you never waste money on clothes that wash out your complexion.
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <span>✓ Myntra</span>
                        <span>•</span>
                        <span>✓ Amazon</span>
                        <span>•</span>
                        <span>✓ Ajio</span>
                        <span>•</span>
                        <span>✓ Nykaa</span>
                      </div>

                      <Link
                        to="/#direct-shop"
                        className="text-xs font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 no-underline"
                      >
                        <span>Explore Direct Smart Shop</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </article>

        {/* ─── Author Profile Card ─── */}
        <div className="mt-16 p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-500 p-0.5 flex-shrink-0 shadow-md">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-bold text-violet-700 text-2xl font-serif">
              V
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h4 className="font-bold text-slate-900 text-base">Vivek Kumar</h4>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
                Founder & Creator 🇮🇳
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Founder of <strong>StyleGuru AI</strong>. Dedicated to replacing outdated Western color theory with inclusive, scientific colorimetry tailored specifically for the rich spectrum of Indian skin tones.
            </p>
            <div className="pt-1">
              <Link
                to="/#founder"
                className="text-xs font-bold text-violet-600 hover:underline no-underline"
              >
                Read Founder Story & Mission →
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Related Articles Section ─── */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold font-serif text-slate-900">
                Related Styling Guides
              </h3>
              <Link to="/blog" className="text-xs font-bold text-violet-600 hover:underline no-underline">
                View all 116 articles →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {relatedPosts.map((r) => (
                <Link
                  key={r.slug}
                  to={`/blog/${r.slug}`}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-violet-300 transition-all flex flex-col justify-between no-underline group"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider block">
                      Article
                    </span>
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-2 leading-snug">
                      {r.title}
                    </h5>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-violet-600 transition-colors pt-3 block">
                    Read Guide →
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ─── Bottom High-Impact Conversion Banner ─── */}
        <div className="mt-16 p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-950 text-white text-center shadow-2xl shadow-violet-950/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-60 h-60 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-md mx-auto relative z-10 space-y-4">
            <span className="text-3xl block">✨</span>
            <h3 className="text-2xl sm:text-3xl font-black font-serif text-white leading-tight">
              Ready to Discover Your True Palette?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Take the guesswork out of fashion. Upload a selfie and get scientific color recommendations tailored for you in 10 seconds.
            </p>
            <div className="pt-2">
              <Link
                to="/"
                onClick={() => trackCTAClick('analyze_my_style', 'blog_bottom_card')}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-xs shadow-xl shadow-pink-500/30 transition-all transform hover:-translate-y-0.5 no-underline"
                style={{ background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)' }}
              >
                <span>Analyze My Style Free (Selfie)</span>
                <span>→</span>
              </Link>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 m-0">
              100% Free Forever • Zero Photos Stored • Made in India 🇮🇳
            </p>
          </div>
        </div>

      </main>

      {/* ─── Minimal Blog Footer ─── */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500 bg-white">
        <p className="m-0">
          © 2026 StyleGuru AI. All rights reserved. Created by Vivek Kumar 🇮🇳
        </p>
      </footer>
    </div>
  );
}
