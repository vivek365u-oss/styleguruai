import SEOHead from '../components/SEOHead';

const C = { text: '#F0EDE6', muted: '#6B6B6B', border: '#242424', surface: '#141414', gold: '#C9A96E' };

function Section({ num, title, children }) {
  return (
    <div style={{ marginBottom: 36, paddingBottom: 36, borderBottom: `1px solid ${C.border}` }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', fontWeight: 400, color: C.text, marginBottom: 12 }}>
        {num}. {title}
      </h2>
      <p style={{ fontSize: '14px', color: C.muted, lineHeight: '1.8', fontFamily: "'Inter',sans-serif" }}>{children}</p>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 80px' }}>
      <SEOHead title="Privacy Policy — StyleGuru AI" description="Read the StyleGuru AI privacy policy. We do not store or share your uploaded images." />

      <p style={{ fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>Legal</p>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,5vw,44px)', fontWeight: 300, color: C.text, lineHeight: 1.2, marginBottom: 8 }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: '11px', color: C.muted, letterSpacing: '0.1em', marginBottom: 48, fontFamily: "'Inter',sans-serif" }}>
        Effective Date: January 01, 2025 · GDPR & ITA Compliant
      </p>

      <Section num="1" title="Data Collection & Usage">
        StyleGuru AI operates on a "Privacy First" architecture. When you upload an image for Skin Tone or Outfit analysis, our AI processes the visual data in a transient state. We do not store original raw images on our permanent servers after the analysis is complete, ensuring your visual identity remains yours.
      </Section>

      <Section num="2" title="Intelligence Processing">
        Our models analyze technical attributes such as ITA (Individual Typology Angle) and hex-code values to provide accurate fashion recommendations. This data is converted into anonymized style profiles to personalize your experience without identifying you personally.
      </Section>

      <Section num="3" title="Third-Party Integration">
        We partner with Google AdSense and various affiliate networks (Amazon, Myntra, etc.) to monetize our free services. These partners may use cookies to serve relevant advertisements. We recommend reviewing their respective privacy policies for more details on their data handling practices.
      </Section>

      <Section num="4" title="Your Rights">
        You have the right to access, delete, or modify any saved style preferences within your Dashboard. For any data-related queries or formal requests, please contact our Data Protection Officer at{' '}
        <a href="mailto:styleguruai.in.gmail@gmail.com" style={{ color: C.gold, textDecoration: 'none' }}>styleguruai.in.gmail@gmail.com</a>.
      </Section>

      <Section num="5" title="Cookies">
        We use essential cookies for authentication and preference persistence. Analytics cookies (anonymized) help us improve the product. You may disable non-essential cookies via your browser settings without affecting core functionality.
      </Section>

      <div style={{ padding: '20px 24px', background: C.surface, border: `1px solid ${C.border}` }}>
        <p style={{ fontSize: '12px', color: C.muted, lineHeight: '1.7', fontFamily: "'Inter',sans-serif", fontStyle: 'italic' }}>
          By continuing to use StyleGuru AI, you acknowledge and agree to the terms outlined in this Privacy Policy.
        </p>
      </div>
    </div>
  );
}
