import SEOHead from '../components/SEOHead';
import { useState } from 'react';

const C = { text: '#F0EDE6', muted: '#6B6B6B', border: '#242424', surface: '#141414', surface2: '#1A1A1A', gold: '#C9A96E' };

const LABEL = { fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, marginBottom: 8, fontFamily: "'Inter',sans-serif" };

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', topic: 'Style Analysis', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px',
    background: C.surface2, border: `1px solid ${C.border}`,
    color: C.text, fontSize: '13px', fontFamily: "'Inter',sans-serif",
    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box',
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 24px 80px' }}>
      <SEOHead title="Contact — StyleGuruAI" description="Get in touch with the StyleGuruAI team." />

      <p style={LABEL}>Support</p>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(28px,5vw,48px)', fontWeight: 300, color: C.text, lineHeight: 1.2, marginBottom: 16 }}>
        Let's Talk Style
      </h1>
      <p style={{ fontSize: '14px', color: C.muted, lineHeight: '1.7', marginBottom: 48, fontFamily: "'Inter',sans-serif" }}>
        Questions about your skin tone analysis, feature suggestions, or partnerships? We respond within 24 hours.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40 }}>
        {/* Contact info */}
        <div style={{ padding: '28px', background: C.surface, border: `1px solid ${C.border}` }}>
          <p style={{ ...LABEL, marginBottom: 20 }}>Contact Information</p>
          {[
            { icon: '✉️', label: 'Email Us', value: 'StyleGuruAI.in.gmail@gmail.com', href: 'mailto:StyleGuruAI.in.gmail@gmail.com' },
            { icon: '🤝', label: 'Partnerships', value: 'StyleGuruAI.in.gmail@gmail.com', href: 'mailto:StyleGuruAI.in.gmail@gmail.com' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.gold, marginBottom: 4, fontFamily: "'Inter',sans-serif" }}>{item.label}</p>
                <a href={item.href} style={{ fontSize: '13px', color: C.text, textDecoration: 'none', fontFamily: "'Inter',sans-serif", wordBreak: 'break-all' }}
                  onMouseEnter={e => e.target.style.color = C.gold}
                  onMouseLeave={e => e.target.style.color = C.text}
                >{item.value}</a>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 24, padding: '16px', background: C.surface2, borderLeft: `3px solid ${C.gold}` }}>
            <p style={{ fontSize: '12px', color: C.muted, lineHeight: '1.65', fontFamily: "'Inter',sans-serif" }}>
              Response time is under 24 hours. Your feedback helps us build the future of Indian fashion.
            </p>
          </div>
        </div>

        {/* Contact form */}
        <div style={{ padding: '28px', background: C.surface, border: `1px solid ${C.border}` }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ fontSize: '40px', marginBottom: 16 }}>✓</p>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: '20px', color: C.text, marginBottom: 8 }}>Message Sent</p>
              <p style={{ fontSize: '13px', color: C.muted, fontFamily: "'Inter',sans-serif" }}>We'll reply within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ ...LABEL, marginBottom: 6 }}>Name</p>
                  <input type="text" required placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = C.gold}
                    onBlur={e => e.target.style.borderColor = C.border}
                  />
                </div>
                <div>
                  <p style={{ ...LABEL, marginBottom: 6 }}>Topic</p>
                  <select value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = C.gold}
                    onBlur={e => e.target.style.borderColor = C.border}
                  >
                    {['Style Analysis', 'Technical Issue', 'Partnership', 'Other'].map(o => <option key={o} style={{ background: '#141414' }}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p style={{ ...LABEL, marginBottom: 6 }}>Email</p>
                <input type="email" required placeholder="your@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = C.gold}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
              <div>
                <p style={{ ...LABEL, marginBottom: 6 }}>Message</p>
                <textarea rows={5} required placeholder="How can we help?" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
                  onFocus={e => e.target.style.borderColor = C.gold}
                  onBlur={e => e.target.style.borderColor = C.border}
                />
              </div>
              <button type="submit" style={{ padding: '14px', background: C.gold, color: '#0A0A0A', border: 'none', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600, fontFamily: "'Inter',sans-serif", transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Send Message →
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
