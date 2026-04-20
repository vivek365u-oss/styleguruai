import SEOHead from '../components/SEOHead';

const C = { text: '#F0EDE6', muted: '#6B6B6B', border: '#242424', surface: '#141414', gold: '#C9A96E' };

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 24px 80px' }}>
      <SEOHead
        title="About — StyleGuru AI"
        description="StyleGuru AI is an AI-powered fashion advisor that helps users choose the best outfits based on their skin tone."
      />

      {/* Header */}
      <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>
        About Us
      </p>
      <h1 style={{
        fontFamily: "'Playfair Display',Georgia,serif",
        fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 300,
        color: C.text, lineHeight: 1.2, marginBottom: 24,
      }}>
        About StyleGuru AI
      </h1>

      <div style={{ height: 1, background: C.border, width: 64, marginBottom: 40 }} />

      {/* Intro */}
      <p style={{ fontSize: '18px', color: C.text, lineHeight: '1.7', marginBottom: 20, fontFamily: "'Inter',sans-serif", fontWeight: 400 }}>
        StyleGuru AI is an AI-powered fashion intelligence engine designed to eliminate the guesswork from your wardrobe.
      </p>
      <p style={{ fontSize: '16px', color: C.muted, lineHeight: '1.8', marginBottom: 40, fontFamily: "'Inter',sans-serif" }}>
        We combine advanced color science with deep learning to help you discover the exact palettes and styles that celebrate your unique skin tone.
      </p>

      {/* The Problem & Solution Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, marginBottom: 56 }}>
        <div>
          <h3 style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, marginBottom: 16, fontFamily: "'Inter',sans-serif" }}>
            The Shopping Maze
          </h3>
          <p style={{ fontSize: '14px', color: C.muted, lineHeight: '1.8', fontFamily: "'Inter',sans-serif" }}>
            Today's fashion landscape is a game of chance. Millions of shoppers browse platforms like Myntra, Flipkart, and Meesho, buying items randomly without knowing if a color truly suits them. This lead to a frustrating cycle of "buy-and-return," wasting your most precious resource: <strong>Time</strong>.
          </p>
        </div>
        <div>
          <h3 style={{ fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.gold, marginBottom: 16, fontFamily: "'Inter',sans-serif" }}>
            The Precision Solution
          </h3>
          <p style={{ fontSize: '14px', color: C.muted, lineHeight: '1.8', fontFamily: "'Inter',sans-serif" }}>
            StyleGuru AI replaces guesswork with scientific certainty. Our AI maps your skin's unique parameters to provide a personalized roadmap for your style journey. No more disappointment, no more wasted money—just confident, high-quality fashion choices delivered with curated shopping links.
          </p>
        </div>
      </div>


      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, background: C.border, marginBottom: 48 }}>
        {[
          { icon: '🎨', title: 'Skin Tone Analysis', desc: 'Advanced AI color science using ITA angle calculation' },
          { icon: '👔', title: 'Outfit Recommendations', desc: 'Personalized color palettes and shopping links' },
          { icon: '✨', title: 'Style Confidence', desc: 'Expert tips to ensure you never look dull again' },
        ].map(item => (
          <div key={item.title} style={{ background: C.surface, padding: '28px 24px' }}>
            <div style={{ fontSize: '28px', marginBottom: 14 }}>{item.icon}</div>
            <p style={{ fontSize: '14px', fontWeight: 500, color: C.text, marginBottom: 8, fontFamily: "'Inter',sans-serif" }}>{item.title}</p>
            <p style={{ fontSize: '12px', color: C.muted, lineHeight: '1.65', fontFamily: "'Inter',sans-serif" }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div style={{ padding: '32px', background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.gold}` }}>
        <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>
          Our Mission
        </p>
        <p style={{ fontSize: '15px', color: C.text, lineHeight: '1.8', fontFamily: "'Inter',sans-serif" }}>
          Our mission is to democratize high-end fashion intelligence for everyone. We believe that everyone deserves to shop with confidence and build a wardrobe that reflects their true self, without the frustration of the modern retail maze.
        </p>
      </div>
    </div>
  );
}
