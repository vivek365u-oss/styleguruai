import SEOHead from '../components/SEOHead';

const C = { text: '#F0EDE6', muted: '#6B6B6B', border: '#242424', surface: '#141414', gold: '#C9A96E' };

const terms = [
  { title: 'Acceptance of Terms', body: "By accessing or using StyleGuru AI, you agree to be bound by these Terms and Conditions. Our platform provides AI-driven fashion advice, skin tone analysis, and shopping recommendations tailored for Indian complexions. If you do not agree to these terms, please discontinue use of the service." },
  { title: 'Service Accuracy & Limitation', body: "While our AI models use advanced engineering to provide high-accuracy style advice, recommendations are for informational and aesthetic purposes only. Final fashion choices, including purchases through affiliate links, are at the user's discretion. StyleGuru AI is not liable for dissatisfaction with external products or analysis variance due to lighting/photo quality." },
  { title: 'Intellectual Property', body: "The algorithms, UI design, branding, and generated content within StyleGuru AI are the exclusive property of our founders. You may use our style analysis for personal use but are prohibited from reverse-engineering or commercializing our AI recommendations without written consent." },
  { title: 'User Responsibility', body: "Users are responsible for the quality of images uploaded. Clear, well-lit photos provide the most accurate ITA calculations. Any misuse of the platform or attempts to disrupt our AI services will result in immediate termination of access." },
  { title: 'Affiliate Links', body: "StyleGuru AI earns commissions through affiliate links on Amazon, Myntra, and other retail partners. These commissions do not affect the pricing you pay, and we only recommend products we believe are relevant to your style profile." },
];

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 80px' }}>
      <SEOHead title="Terms & Conditions — StyleGuru AI" description="Read the StyleGuru AI terms of use before using the service." />

      <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>Legal</p>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,5vw,44px)', fontWeight: 300, color: C.text, lineHeight: 1.2, marginBottom: 8 }}>
        Terms & Conditions
      </h1>
      <p style={{ fontSize: '11px', color: C.muted, letterSpacing: '0.1em', marginBottom: 48, fontFamily: "'Inter',sans-serif" }}>
        Last Modified: January 2025 · Standard Service Agreement
      </p>

      {terms.map((t, i) => (
        <div key={i} style={{ marginBottom: 32, paddingBottom: 32, borderBottom: `1px solid ${C.border}` }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '18px', fontWeight: 400, color: C.text, marginBottom: 10 }}>
            {i + 1}. {t.title}
          </h2>
          <p style={{ fontSize: '14px', color: C.muted, lineHeight: '1.8', fontFamily: "'Inter',sans-serif" }}>{t.body}</p>
        </div>
      ))}

      <div style={{ padding: '20px 24px', background: C.surface, border: `1px solid ${C.border}` }}>
        <p style={{ fontSize: '12px', color: C.muted, lineHeight: '1.7', fontFamily: "'Inter',sans-serif", fontStyle: 'italic' }}>
          StyleGuru AI reserves the right to update these terms at any time. Your continued use constitutes acceptance of the latest version.
        </p>
      </div>
    </div>
  );
}
