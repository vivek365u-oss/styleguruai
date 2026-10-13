import React, { useState } from 'react';
import SEOHead from '../components/SEOHead';
import { CONTACT_EMAIL, APP_NAME, SITE_CANONICAL } from '../constants/contact';

const C = {
  bg: '#0B0F1A',
  text: '#F9FAFB',
  text2: '#E5E7EB',
  muted: '#9CA3AF',
  border: 'rgba(255, 255, 255, 0.08)',
  surface: 'rgba(255, 255, 255, 0.03)',
  surface2: 'rgba(255, 255, 255, 0.06)',
  surfaceHighlight: 'rgba(168, 85, 247, 0.06)',
  accent: '#A855F7',
  gold: '#C9A96E',
};

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    category: 'General Inquiry',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    // Construct mailto link safely
    const subject = encodeURIComponent(`[${APP_NAME} Contact] ${form.category} from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nCategory: ${form.category}\n\nMessage:\n${form.message}\n\n---\nSent via ${SITE_CANONICAL}/contact`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: C.bg, color: C.text }}>
      <SEOHead
        title="Contact Us — StyleGuru AI | Support & Inquiries"
        description="Have questions about skin tone analysis, color palettes, or feature partnerships? Contact the StyleGuru AI team directly. We respond within 24 to 48 hours."
      />

      <main className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-4 text-xs font-semibold tracking-widest uppercase" style={{ color: C.gold }}>
          <span>Support & Helpdesk</span>
          <span>•</span>
          <span>Contact</span>
        </div>

        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-light mb-4"
          style={{ fontFamily: "'Playfair Display', serif", color: C.text, lineHeight: 1.2 }}
        >
          Get in Touch with Our Team
        </h1>

        <p className="text-sm sm:text-base leading-relaxed mb-10 pb-6 border-b" style={{ color: C.muted, borderColor: C.border }}>
          Whether you have feedback on outfit recommendations, want to report a bug, have questions about data privacy, or are exploring partnerships, we are here to help.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Direct Contact Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl border" style={{ background: C.surface, borderColor: C.border }}>
              <h2 className="text-lg font-serif mb-4" style={{ color: C.text, fontFamily: "'Playfair Display', serif" }}>
                Official Communication Channel
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed mb-6" style={{ color: C.muted }}>
                We believe in direct, reliable support. Please send any inquiries to our primary email desk below:
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border flex items-start gap-3" style={{ background: C.surface2, borderColor: C.border }}>
                  <span className="text-2xl">✉️</span>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: C.gold }}>
                      Primary Email
                    </p>
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="text-sm font-medium underline break-all hover:text-white"
                      style={{ color: C.text2 }}
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </div>
                </div>

                <div className="p-4 rounded-xl border flex items-start gap-3" style={{ background: C.surface2, borderColor: C.border }}>
                  <span className="text-2xl">⏱️</span>
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: C.gold }}>
                      Typical Response Time
                    </p>
                    <p className="text-xs" style={{ color: C.muted }}>
                      Within 24 to 48 business hours (Monday – Saturday, IST)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border" style={{ background: C.surfaceHighlight, borderColor: 'rgba(168, 85, 247, 0.2)' }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: C.text }}>
                Privacy & Data Deletion
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                Need your account or uploaded history removed? Email{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline font-medium hover:text-white" style={{ color: C.accent }}>
                  {CONTACT_EMAIL}
                </a>{' '}
                with <em>"Data Deletion Request"</em> in the subject line, and we will purge your profile within 7 business days.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl border" style={{ background: C.surface, borderColor: C.border }}>
              <h2 className="text-xl font-serif mb-2" style={{ color: C.text, fontFamily: "'Playfair Display', serif" }}>
                Send Us a Direct Message
              </h2>
              <p className="text-xs mb-6" style={{ color: C.muted }}>
                Fill out the form below. Clicking submit will open your email client pre-filled with your details.
              </p>

              {submitted ? (
                <div className="p-6 rounded-xl border text-center space-y-3" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                  <div className="text-3xl">✅</div>
                  <h3 className="text-base font-semibold text-emerald-400">Email Client Opened!</h3>
                  <p className="text-xs text-slate-300">
                    If your email app didn't automatically launch, you can send your message directly to{' '}
                    <strong className="text-white">{CONTACT_EMAIL}</strong>.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-3 text-xs underline text-slate-400 hover:text-white cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: C.text2 }}>
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors"
                      style={{ background: C.surface2, borderColor: C.border, color: C.text }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: C.text2 }}>
                      Your Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors"
                      style={{ background: C.surface2, borderColor: C.border, color: C.text }}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: C.text2 }}>
                      Inquiry Category *
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors"
                      style={{ background: '#1A1E2E', borderColor: C.border, color: C.text }}
                    >
                      <option value="General Inquiry">General Inquiry / Feedback</option>
                      <option value="Style Advice Question">Style or Skin Tone Question</option>
                      <option value="Bug Report">Bug Report / Technical Glitch</option>
                      <option value="Privacy / Data Request">Privacy or Data Deletion</option>
                      <option value="Partnership / Business">Partnership or Media Inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: C.text2 }}>
                      Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Describe your inquiry, question, or feedback in detail..."
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl text-sm border outline-none transition-colors"
                      style={{ background: C.surface2, borderColor: C.border, color: C.text }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 rounded-xl text-white font-semibold text-sm transition-all shadow-lg hover:opacity-95 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)' }}
                  >
                    Send Message via Email →
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions */}
        <section className="p-8 rounded-3xl border mb-8" style={{ background: C.surface, borderColor: C.border }}>
          <h2 className="text-xl font-serif mb-6" style={{ color: C.text, fontFamily: "'Playfair Display', serif" }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-6 text-sm">
            <div>
              <h3 className="font-semibold text-white mb-1">Is {APP_NAME} free to use?</h3>
              <p style={{ color: C.muted }} className="leading-relaxed">
                Yes! All core features—including selfie skin tone analysis, palette generation, and capsule wardrobe recommendations—are completely free for users.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">Do you store my uploaded photos?</h3>
              <p style={{ color: C.muted }} className="leading-relaxed">
                No. Images uploaded for analysis are processed transiently in server memory to calculate color coordinates and are not permanently saved on our servers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">How can I suggest a new feature or festival outfit palette?</h3>
              <p style={{ color: C.muted }} className="leading-relaxed">
                We love hearing from our community! Simply use the form above with the subject "Style Advice Question" or email {CONTACT_EMAIL}.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">How accurate is the AI skin tone and undertone detection?</h3>
              <p style={{ color: C.muted }} className="leading-relaxed">
                Our computer vision model uses Individual Typology Angle (ITA) calculations and RGB hue mapping calibrated specifically for diverse Indian complexions. For the most accurate classification, upload a clear selfie taken in indirect natural daylight without camera filters, heavy sunglasses, or harsh indoor artificial lighting.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">How quickly will I receive a reply from customer support?</h3>
              <p style={{ color: C.muted }} className="leading-relaxed">
                Our team monitors the {CONTACT_EMAIL} desk from Monday through Saturday (10:00 AM – 7:00 PM IST). We provide an initial email acknowledgment within 24 business hours and aim to resolve all style queries and technical bug reports within 48 business hours.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
