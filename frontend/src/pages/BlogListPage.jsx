import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { blogPosts } from '../data/blogPosts';

const C = { text: '#F0EDE6', muted: '#6B6B6B', border: '#242424', surface: '#141414', surface2: '#1A1A1A', gold: '#C9A96E' };

export default function BlogListPage() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 24px 80px' }}>
      <SEOHead
        title="Fashion Blog — StyleGuru AI"
        description="Read fashion tips, skin tone guides, and AI styling articles on the StyleGuru AI blog."
      />

      {/* Header */}
      <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, marginBottom: 12, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
        Fashion Blog
      </p>
      <h1 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 'clamp(30px,5vw,52px)', fontWeight: 300, color: C.text, lineHeight: 1.15, marginBottom: 16 }}>
        Style & Fashion Tips
      </h1>
      <p style={{ fontSize: '15px', color: C.muted, lineHeight: '1.7', marginBottom: 40, maxWidth: 480, fontFamily: "'Plus Jakarta Sans','Inter',sans-serif" }}>
        Expert advice on skin tones, outfit selection, and how AI is transforming the fashion industry.
      </p>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1, background: C.border }}>
        {blogPosts.map((post) => (
          <article
            key={post.slug}
            style={{ background: C.surface, padding: '28px', display: 'flex', flexDirection: 'column', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = C.surface2}
            onMouseLeave={e => e.currentTarget.style.background = C.surface}
          >
            <p style={{ fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>
              {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', fontWeight: 400, color: C.text, lineHeight: 1.4, marginBottom: 12, flex: 1 }}>
              {post.title}
            </h2>
            <p style={{ fontSize: '13px', color: C.muted, lineHeight: '1.7', marginBottom: 20, fontFamily: "'Inter',sans-serif" }}>
              {post.excerpt}
            </p>
            <Link
              to={`/blog/${post.slug}`}
              style={{ fontSize: '11px', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Inter',sans-serif", fontWeight: 500 }}
            >
              Read Article →
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
