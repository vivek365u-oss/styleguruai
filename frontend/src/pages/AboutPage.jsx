import SEOHead from '../components/SEOHead';

const C = { text: '#F0EDE6', muted: '#6B6B6B', border: '#242424', surface: '#141414', gold: '#C9A96E' };

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 24px 80px' }}>
      <SEOHead
        title="About — StyleGuruAI"
        description="StyleGuruAI is an AI-powered fashion advisor that helps users choose the best outfits based on their skin tone."
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
        About StyleGuruAI
      </h1>
      <div style={{ height: 1, background: C.border, width: 64, marginBottom: 40 }} />

      {/* Intro */}
      <p style={{ fontSize: '16px', color: C.muted, lineHeight: '1.8', marginBottom: 16, fontFamily: "'Inter',sans-serif" }}>
        StyleGuruAI is an AI-powered fashion advisor that helps you choose the best outfits based on your unique skin tone.
      </p>
      <p style={{ fontSize: '16px', color: C.muted, lineHeight: '1.8', marginBottom: 40, fontFamily: "'Inter',sans-serif" }}>
        Upload your photo and receive personalized recommendations for colors, outfits, and styling tips — all powered by advanced color science and AI.
      </p>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, background: C.border, marginBottom: 48 }}>
        {[
          { icon: '🎨', title: 'Skin Tone Analysis', desc: 'Advanced AI color science using ITA angle calculation' },
          { icon: '👔', title: 'Outfit Recommendations', desc: 'Personalized color palettes for every occasion' },
          { icon: '✨', title: 'Style Intelligence', desc: 'Seasonal fashion tips based on your complexion' },
        ].map(item => (
          <div key={item.title} style={{ background: C.surface, padding: '28px 24px' }}>
            <div style={{ fontSize: '28px', marginBottom: 14 }}>{item.icon}</div>
            <p style={{ fontSize: '14px', fontWeight: 500, color: C.text, marginBottom: 8, fontFamily: "'Inter',sans-serif" }}>{item.title}</p>
            <p style={{ fontSize: '12px', color: C.muted, lineHeight: '1.65', fontFamily: "'Inter',sans-serif" }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div style={{ padding: '28px 32px', background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.gold}` }}>
        <p style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>
          Our Mission
        </p>
        <p style={{ fontSize: '15px', color: C.text, lineHeight: '1.8', fontFamily: "'Inter',sans-serif" }}>
          Our goal is to democratize fashion intelligence for every skin tone, especially the rich spectrum of Indian complexions
          that global fashion brands have historically underrepresented.
        </p>
      </div>
    </div>
  );
}
