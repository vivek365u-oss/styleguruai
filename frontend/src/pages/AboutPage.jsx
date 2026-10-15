import React from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import { APP_NAME, CONTACT_EMAIL } from '../constants/contact';

const C = {
  bg: '#0B0F1A',
  text: '#F9FAFB',
  text2: '#E5E7EB',
  muted: '#9CA3AF',
  border: 'rgba(255, 255, 255, 0.08)',
  surface: 'rgba(255, 255, 255, 0.03)',
  surfaceHighlight: 'rgba(168, 85, 247, 0.06)',
  accent: '#A855F7',
  gold: '#C9A96E',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: C.bg, color: C.text }}>
      <SEOHead
        title="About Us — StyleGuru AI | Intelligent Fashion for Indian Skin Tones"
        description="Learn about StyleGuru AI, founded by Vivek Kumar. Discover how our AI uses color science, ITA angles, and undertone classification to provide personalized outfit recommendations tailored for Indian complexions, climates, and budgets."
      />

      <main className="max-w-4xl mx-auto">
        {/* Category Tag */}
        <div className="flex items-center gap-2 mb-4 text-xs font-semibold tracking-widest uppercase" style={{ color: C.gold }}>
          <span>About StyleGuru AI</span>
          <span>•</span>
          <span>Our Vision & Technology</span>
        </div>

        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-light mb-6"
          style={{ fontFamily: "'Playfair Display', serif", color: C.text, lineHeight: 1.2 }}
        >
          Democratizing Personal Styling for Every Indian Complexion
        </h1>

        <div style={{ height: 2, background: 'linear-gradient(90deg, #A855F7, #EC4899, transparent)', width: 96, marginBottom: 40 }} />

        {/* Lead In */}
        <p
          className="text-lg sm:text-xl font-normal leading-relaxed mb-8"
          style={{ color: C.text2, fontFamily: "'Inter', sans-serif" }}
        >
          {APP_NAME} was created out of a simple observation: conventional fashion advice and Western seasonal color palettes rarely work for the rich diversity of Indian skin tones, festive wardrobes, or regional climates.
        </p>

        <p className="text-sm sm:text-base leading-relaxed mb-12" style={{ color: C.muted, fontFamily: "'Inter', sans-serif" }}>
          Founded by <strong>Vivek Kumar</strong>, {APP_NAME} is an Indian artificial intelligence styling companion designed to help everyday shoppers make confident, flattering clothing decisions without spending thousands of rupees on celebrity personal stylists or getting trapped in endless returns on Myntra and Amazon.
        </p>

        {/* Section: The Challenge */}
        <section className="mb-14">
          <h2
            className="text-2xl font-serif font-normal mb-4"
            style={{ color: C.text, fontFamily: "'Playfair Display', serif" }}
          >
            The Indian Wardrobe Dilemma
          </h2>
          <div className="space-y-4 text-sm sm:text-base leading-relaxed" style={{ color: C.muted, fontFamily: "'Inter', sans-serif" }}>
            <p>
              In India, fashion is deeply intertwined with cultural diversity, varied geographic weather patterns, and rich ethnic celebrations—from grand Diwali and Eid family gatherings to royal wedding sangeets and corporate smart-casual workdays.
            </p>
            <p>
              Yet, when shopping online or browsing retail racks, most Indians face a common hurdle: a kurta, shirt, or saree looks breathtaking on a studio model, but appears washed out, dull, or overwhelming when tried on at home. Why? Because traditional fashion advice relies heavily on European "4-season" color charts (Spring, Summer, Autumn, Winter) designed primarily for Caucasian undertones.
            </p>
            <p>
              Indian complexions span a glorious spectrum—from fair and porcelain with peach undertones, to golden wheatish, warm olive, dusky bronze, and rich deep melanin tones. An olive-wheatish skin tone requires completely different complementary contrast ratios than a cool-toned fair complexion. When clothing colors clash with your natural undertone, skin can appear fatigued or uneven. When colors harmonize, your complexion instantly glows.
            </p>
          </div>
        </section>

        {/* Section: How Our Recommendation Technology Works */}
        <section className="mb-14 p-8 rounded-3xl border" style={{ background: C.surface, borderColor: C.border }}>
          <h2
            className="text-2xl font-serif font-normal mb-6"
            style={{ color: C.text, fontFamily: "'Playfair Display', serif" }}
          >
            How the Technology Works: In Simple Terms
          </h2>
          <p className="text-sm sm:text-base leading-relaxed mb-8" style={{ color: C.muted }}>
            We replace subjective guesswork with scientific color theory and computer vision algorithms. Here is what happens behind the scenes:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: C.border }}>
              <div className="text-3xl mb-3">📸</div>
              <h3 className="text-base font-semibold mb-2" style={{ color: C.gold }}>
                1. Facial Tone & ITA Analysis
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                Using automated photo quality checks and facial landmark sampling, our system calculates the Individual Typology Angle (ITA) in CIELAB color space to classify skin tone across inclusive tiers without permanent image storage.
              </p>
            </div>

            <div className="p-6 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: C.border }}>
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="text-base font-semibold mb-2" style={{ color: C.gold }}>
                2. Undertone & Color Harmony
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                We identify your underlying sub-pigmentation (warm, cool, or neutral). Warm undertones flourish in mustard yellows, rust oranges, and emerald greens; cool undertones shine in royal cobalt, jewel rubies, and crisp whites.
              </p>
            </div>

            <div className="p-6 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: C.border }}>
              <div className="text-3xl mb-3">👔</div>
              <h3 className="text-base font-semibold mb-2" style={{ color: C.gold }}>
                3. Cultural & Seasonal Context
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
                Our recommendation engine layers your palette with Indian occasion filters: everyday office wear, high-heat summer linens, monsoon breathable cottons, and opulent wedding silhouettes like sherwanis and silk sarees.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Our Mission */}
        <section className="mb-14">
          <h2
            className="text-2xl font-serif font-normal mb-4"
            style={{ color: C.text, fontFamily: "'Playfair Display', serif" }}
          >
            Our Core Mission & Ethics
          </h2>
          <div className="space-y-4 text-sm sm:text-base leading-relaxed" style={{ color: C.muted, fontFamily: "'Inter', sans-serif" }}>
            <p>
              Our guiding mission is to <strong style={{ color: C.text }}>democratize confidence</strong>. Looking sharp and feeling well-dressed should not be a privilege reserved for those with disposable incomes for high-end boutique consultations.
            </p>
            <p>
              Whether you are putting together an outfit for an engineering job interview in Bengaluru, selecting a festive kurta in Lucknow, or building a versatile 10-piece capsule wardrobe on a college student budget of ₹3,000, {APP_NAME} provides honest, unbiased, algorithmic style clarity.
            </p>
            <p>
              We celebrate all skin tones equally. There are no "superior" or "inferior" skin complexions in our philosophy—only color palettes that complement your natural beauty and those that distract from it. Our tool exists to celebrate who you are, with no skin lightening filters or unrealistic retouching.
            </p>
          </div>
        </section>

        {/* Section: About the Founder */}
        <section className="p-8 rounded-3xl border mb-14" style={{ background: C.surfaceHighlight, borderColor: 'rgba(168, 85, 247, 0.2)' }}>
          <h2
            className="text-xl font-serif font-normal mb-3"
            style={{ color: C.text, fontFamily: "'Playfair Display', serif" }}
          >
            Behind the Project
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: C.muted }}>
            {APP_NAME} is developed and maintained by <strong>Vivek Kumar</strong> with a passion for computer vision, applied machine learning, and inclusive consumer technology in India.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
            Have ideas for improvements, feature requests, or partnership inquiries? Feel free to reach out directly to the team via our{' '}
            <Link to="/contact" className="underline hover:text-white" style={{ color: C.gold }}>
              Contact Page
            </Link>{' '}
            or email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:text-white" style={{ color: C.accent }}>
              {CONTACT_EMAIL}
            </a>.
          </p>
        </section>

        {/* CTA */}
        <div className="text-center py-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl text-white font-medium text-sm transition-all hover:opacity-90 shadow-lg shadow-purple-500/25"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)' }}
          >
            Explore StyleGuru AI Homepage →
          </Link>
        </div>
      </main>
    </div>
  );
}
