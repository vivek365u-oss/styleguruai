import { useParams, Navigate, Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import SEOHead from '../components/SEOHead';
import { blogPosts } from '../data/blogPosts';
import { trackBlogRead, trackBlogScroll, trackCTAClick } from '../utils/analytics';

const C = { text: '#F0EDE6', muted: '#6B6B6B', border: '#242424', surface: '#141414', gold: '#C9A96E' };

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);
  const scrollTracked = useRef({ 50: false, 75: false, 100: false });

  // Track blog read on mount
  useEffect(() => {
    if (post) {
      trackBlogRead(post.slug, post.title);
      scrollTracked.current = { 50: false, 75: false, 100: false };
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
      [50, 75, 100].forEach(threshold => {
        if (pct >= threshold && !scrollTracked.current[threshold]) {
          scrollTracked.current[threshold] = true;
          trackBlogScroll(post.slug, threshold);
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [post?.slug]);

  if (!post) return <Navigate to="/404" replace />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '56px 24px 80px' }}>
      <SEOHead
        title={`${post.title} — StyleGuruAI`}
        description={post.description}
      />

      {/* Back link */}
      <Link
        to="/blog"
        style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32, fontFamily: "'Inter',sans-serif", transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = C.gold}
        onMouseLeave={e => e.currentTarget.style.color = C.muted}
      >
        ← Back to Blog
      </Link>

      {/* Post header */}
      <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>
        Fashion Blog
      </p>
      <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 'clamp(24px,4vw,40px)', fontWeight: 300, color: C.text, lineHeight: 1.25, marginBottom: 16 }}>
        {post.title}
      </h1>
      <p style={{ fontSize: '11px', color: C.muted, letterSpacing: '0.1em', marginBottom: 48, fontFamily: "'Inter',sans-serif" }}>
        {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      {/* Divider */}
      <div style={{ height: 1, background: C.border, marginBottom: 48 }} />

      {/* Sections */}
      <article>
        {post.sections.map((section, i) => (
          <div key={i} style={{ marginBottom: 40, paddingBottom: 40, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 2, height: '100%', background: C.gold, flexShrink: 0, alignSelf: 'stretch', minHeight: 24, marginTop: 3 }} />
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', fontWeight: 400, color: C.text, lineHeight: 1.3 }}>
                {section.heading}
              </h2>
            </div>
            <p style={{ fontSize: '15px', color: C.muted, lineHeight: '1.85', fontFamily: "'Inter',sans-serif", paddingLeft: 16 }}>
              {section.body}
            </p>
          </div>
        ))}
      </article>

      {/* CTA Banner */}
      <div style={{ marginTop: 16, padding: '36px', background: C.surface, border: `1px solid ${C.border}`, textAlign: 'center' }}>
        <p style={{ fontSize: '24px', marginBottom: 12 }}>✨</p>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '22px', fontWeight: 300, color: C.text, marginBottom: 8 }}>
          Try StyleGuruAI — It's Free
        </h3>
        <p style={{ fontSize: '13px', color: C.muted, lineHeight: '1.7', marginBottom: 24, fontFamily: "'Inter',sans-serif" }}>
          Upload your selfie and get instant AI-powered outfit recommendations based on your skin tone.
        </p>
        <Link
          to="/"
          onClick={() => trackCTAClick('analyze_my_style', 'blog_post')}
          style={{ display: 'inline-block', padding: '14px 32px', background: C.gold, color: '#0A0A0A', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', fontWeight: 600, fontFamily: "'Inter',sans-serif", transition: 'opacity 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Analyze My Style →
        </Link>
      </div>
    </div>
  );
}
