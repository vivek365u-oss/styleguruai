import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { blogPosts } from '../data/blogPosts';

const CATEGORIES = [
  { id: 'all', label: 'All Articles' },
  { id: 'science', label: '🧬 Skin Tone Science' },
  { id: 'color', label: '🎨 Color Theory & Palettes' },
  { id: 'styling', label: '👗 Outfits & Styling' },
  { id: 'shopping', label: '🛍️ Shopping & Wardrobe' },
];

function getCategory(post) {
  const text = `${post.slug} ${post.title} ${post.excerpt || ''}`.toLowerCase();
  if (text.includes('melanin') || text.includes('fitzpatrick') || text.includes('scientifi') || text.includes('biological') || text.includes('skin tone')) {
    return 'science';
  }
  if (text.includes('undertone') || text.includes('palette') || text.includes('color') || text.includes('contrast') || text.includes('warm') || text.includes('cool')) {
    return 'color';
  }
  if (text.includes('shop') || text.includes('wardrobe') || text.includes('buy') || text.includes('budget') || text.includes('store')) {
    return 'shopping';
  }
  return 'styling';
}

function getReadTime(post) {
  const words = post.sections ? post.sections.reduce((acc, s) => acc + (s.body || '').split(/\s+/).length, 0) : 600;
  return Math.max(3, Math.ceil(words / 200));
}

export default function BlogListPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const GRAD = 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)';

  const filteredPosts = useMemo(() => {
    return blogPosts.filter((post) => {
      const cat = getCategory(post);
      const matchesCat = selectedCategory === 'all' || cat === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery = !query || 
        post.title.toLowerCase().includes(query) || 
        (post.excerpt && post.excerpt.toLowerCase().includes(query));
      return matchesCat && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  const featuredPost = blogPosts[0];

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-900 font-sans antialiased selection:bg-violet-500 selection:text-white">
      <SEOHead
        title="Style & Color Intelligence Journal — StyleGuru AI Blog"
        description="Scientific guides on Indian skin tones, color palettes, outfit harmony, and AI fashion styling. Curated by StyleGuru AI."
      />

      {/* ─── Top Floating Navigation Bar ─── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 no-underline group">
              <div className="w-9 h-9 rounded-xl p-0.5 bg-gradient-to-tr from-violet-600 to-pink-500 shadow-sm shadow-violet-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                <div className="w-full h-full bg-white rounded-[9px] flex items-center justify-center overflow-hidden">
                  <img src="/logo.png" alt="StyleGuru AI" className="w-7 h-7 object-contain" />
                </div>
              </div>
              <span className="font-serif font-black text-lg tracking-tight text-slate-900">
                StyleGuru <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent font-sans text-xs uppercase tracking-widest font-bold ml-0.5">AI</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-4 text-xs font-bold text-slate-600">
              <span className="text-slate-300">/</span>
              <span className="text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-200">
                Fashion & Science Journal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="text-xs font-bold text-slate-700 hover:text-violet-600 transition-colors no-underline hidden sm:inline-block px-3 py-1.5"
            >
              ← Back to Home
            </Link>

            <Link
              to="/"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm shadow-violet-500/20 hover:shadow-md transition-all transform hover:-translate-y-0.5 active:translate-y-0 no-underline cursor-pointer"
              style={{ background: GRAD }}
            >
              Analyze My Skin Free →
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <header className="relative pt-16 pb-12 px-6 sm:px-10 max-w-7xl mx-auto text-center">
        {/* Background ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-200/30 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs font-bold uppercase tracking-wider shadow-xs">
            <span>📚</span>
            <span>StyleGuru AI Knowledge Hub</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 font-serif tracking-tight leading-[1.15]">
            The Science of Looking <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-500 bg-clip-text text-transparent italic">Flawless</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
            Deep-dive fashion intelligence, skin tone colorimetry, and outfit matching guides calibrated for Indian complexions.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-md mx-auto">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics (e.g. Wheatish, Undertone, Kurta, Wedding)..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer border-none"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Category Filter Pills ─── */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 mb-10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-none ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {cat.label} {cat.id === 'all' ? `(${blogPosts.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Featured Post Spotlight (When on 'All' and no search) ─── */}
      {selectedCategory === 'all' && !searchQuery && featuredPost && (
        <section className="max-w-7xl mx-auto px-6 sm:px-10 mb-16">
          <Link
            to={`/blog/${featuredPost.slug}`}
            className="group block bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-950 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-2xl shadow-violet-900/20 no-underline transition-transform hover:-translate-y-1"
          >
            {/* Ambient pattern */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-0 p-8 opacity-10 font-serif text-9xl font-black pointer-events-none">
              01
            </div>

            <div className="max-w-2xl relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500 text-white">
                  Featured Pillar Guide
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  ⏱️ {getReadTime(featuredPost)} min read
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-white group-hover:text-pink-300 transition-colors leading-tight">
                {featuredPost.title}
              </h2>

              <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                {featuredPost.excerpt}
              </p>

              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-pink-400 group-hover:translate-x-1 transition-transform">
                <span>Read Full Scientific Guide</span>
                <span>→</span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ─── Articles Grid ─── */}
      <main className="max-w-7xl mx-auto px-6 sm:px-10 pb-24">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-10 max-w-lg mx-auto">
            <span className="text-4xl mb-3 block">🔍</span>
            <h3 className="text-lg font-bold text-slate-900">No articles found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Try searching with different keywords or switch back to "All Articles".
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 cursor-pointer border-none"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => {
              const readTime = getReadTime(post);
              const catId = getCategory(post);
              const catObj = CATEGORIES.find((c) => c.id === catId);

              return (
                <article
                  key={post.slug}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-violet-300 transition-all duration-300 flex flex-col justify-between group overflow-hidden"
                >
                  <div className="p-7 space-y-3.5">
                    {/* Metadata Header */}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold">
                        {catObj ? catObj.label : '👗 Styling'}
                      </span>
                      <span>⏱️ {readTime} min read</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold font-serif text-slate-900 leading-snug group-hover:text-violet-600 transition-colors">
                      <Link to={`/blog/${post.slug}`} className="no-underline text-inherit">
                        {post.title}
                      </Link>
                    </h3>

                    {/* Excerpt */}
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="px-7 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="text-xs font-bold text-violet-600 group-hover:text-violet-700 flex items-center gap-1 no-underline"
                    >
                      <span>Read Guide</span>
                      <span>→</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Bottom High-Converting CTA Banner ─── */}
      <section className="bg-gradient-to-br from-violet-50 via-white to-pink-50/50 border-t border-slate-200 py-16 px-6 sm:px-10 text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <span className="text-3xl block">✨</span>
          <h2 className="text-2xl sm:text-3xl font-black font-serif text-slate-900">
            Stop Guessing Your Skin Tone. Find Your Exact Palette in 10 Seconds.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Join thousands across India discovering their true colors and outfits with AI precision. Zero photos stored.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-white font-bold text-xs shadow-lg shadow-violet-500/25 transition-all transform hover:-translate-y-0.5 no-underline"
              style={{ background: GRAD }}
            >
              Analyze My Skin Free →
            </Link>
            <span className="text-xs text-slate-400 font-medium">100% Free Forever • Made in India 🇮🇳</span>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-500 bg-white">
        <p className="m-0">
          © 2026 StyleGuru AI. All rights reserved. Created by Vivek Kumar (Founder) 🇮🇳
        </p>
      </footer>
    </div>
  );
}
