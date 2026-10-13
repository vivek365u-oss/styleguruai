import React from 'react';
import SEOHead from '../components/SEOHead';
import { CONTACT_EMAIL, APP_NAME, SITE_CANONICAL } from '../constants/contact';

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

function PolicySection({ num, title, children }) {
  return (
    <section className="mb-10 pb-8 border-b" style={{ borderColor: C.border }}>
      <h2
        className="text-xl md:text-2xl font-serif font-normal mb-4"
        style={{ color: C.text, fontFamily: "'Playfair Display', serif" }}
      >
        <span style={{ color: C.gold }} className="mr-2 font-sans text-sm font-semibold tracking-wider">
          {num}.
        </span>
        {title}
      </h2>
      <div
        className="text-sm md:text-base leading-relaxed space-y-4"
        style={{ color: C.muted, fontFamily: "'Inter', sans-serif" }}
      >
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  const lastUpdated = 'October 13, 2026';

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ background: C.bg, color: C.text }}>
      <SEOHead
        title="Privacy Policy — StyleGuru AI"
        description="Comprehensive Privacy Policy for StyleGuru AI. Learn how we handle your data, our Google AdSense and DoubleClick cookie policies, Firebase authentication, and photo analysis privacy."
      />

      <main className="max-w-3xl mx-auto">
        {/* Breadcrumb / Category Tag */}
        <div className="flex items-center gap-2 mb-4 text-xs font-semibold tracking-widest uppercase" style={{ color: C.gold }}>
          <span>Legal & Compliance</span>
          <span>•</span>
          <span>Privacy</span>
        </div>

        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-light mb-4"
          style={{ fontFamily: "'Playfair Display', serif", color: C.text, lineHeight: 1.2 }}
        >
          Privacy Policy
        </h1>

        <p className="text-xs sm:text-sm mb-10 pb-6 border-b" style={{ color: C.muted, borderColor: C.border }}>
          Last Updated: <strong style={{ color: C.text2 }}>{lastUpdated}</strong> · Transparent Privacy Standards
        </p>

        {/* Executive Summary Callout */}
        <div
          className="p-6 rounded-2xl mb-12 border"
          style={{ background: C.surfaceHighlight, borderColor: 'rgba(168, 85, 247, 0.2)' }}
        >
          <h3 className="text-base font-semibold mb-2" style={{ color: C.text }}>
            Summary of Our Privacy Commitment
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: C.muted }}>
            At {APP_NAME} (<a href={SITE_CANONICAL} className="underline hover:text-white" style={{ color: C.accent }}>{SITE_CANONICAL}</a>), we respect your personal privacy. We process your facial photos transiently in memory solely to analyze skin undertones and compute fashion color palettes—we never store or sell your raw photos. This policy explains how we collect, store, and safeguard your data, and how third-party services like Google AdSense and Firebase operate on our platform.
          </p>
        </div>

        {/* Section 1: Information We Collect */}
        <PolicySection num="1" title="Information We Collect">
          <p>
            When you interact with {APP_NAME}, we collect specific categories of information to deliver our personalized fashion recommendations and maintain user accounts:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong style={{ color: C.text2 }}>Account & Profile Information:</strong> If you register or authenticate via Firebase Authentication (using Google Sign-In or email/password), we receive your display name, email address, profile picture URL, and a unique Firebase User ID (UID).
            </li>
            <li>
              <strong style={{ color: C.text2 }}>Uploaded Images for Fashion & Tone Analysis:</strong> When you upload a selfie or outfit photo to analyze your skin tone or outfit harmony, the image is transmitted securely over HTTPS and processed in-memory using our computer vision algorithms (ITA angle, RGB undertone, and face-shape extraction). Raw facial images are strictly processed in a transient state and are not permanently archived or shared with advertisers.
            </li>
            <li>
              <strong style={{ color: C.text2 }}>Style Preferences & Wardrobe Items:</strong> Saved favorite colors, capsule wardrobe selections, and seasonal outfit preferences stored within your account.
            </li>
            <li>
              <strong style={{ color: C.text2 }}>Device & Log Information:</strong> Standard technical information such as your browser type, operating system, IP address, device model, referral source, and timestamps, gathered automatically to ensure application security and prevent fraudulent access.
            </li>
          </ul>
        </PolicySection>

        {/* Section 2: How We Use Your Information */}
        <PolicySection num="2" title="How We Use Your Information">
          <p>
            We use the collected information exclusively for the following operational, personalized, and administrative purposes:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>To compute individual skin tone undertones (warm, cool, neutral, deep, wheatish, olive) and generate matching fabric color recommendations.</li>
            <li>To maintain your secure session, authenticate your identity via Firebase, and restore your saved wardrobe history across devices.</li>
            <li>To monitor system performance, optimize page loading speed, diagnose technical glitches, and protect against security breaches.</li>
            <li>To provide timely customer support when you contact us regarding fashion queries, account management, or technical troubleshooting.</li>
          </ul>
          <p>
            <strong style={{ color: C.text2 }}>We Do Not Sell Personal Data:</strong> Under no circumstances do we sell, rent, monetize, or trade your personal information, email address, or uploaded images to third parties or marketing brokers.
          </p>
        </PolicySection>

        {/* Section 3: Google AdSense, DoubleClick Cookie & Third-Party Advertising */}
        <PolicySection num="3" title="Google AdSense & DoubleClick Cookies">
          <p>
            We use <strong style={{ color: C.text2 }}>Google AdSense</strong> to display advertisements across our public pages in order to support and keep our AI styling advisory services free for users across India.
          </p>
          <p>
            Google, as a third-party vendor, uses cookies to serve ads on our site:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Google's use of advertising cookies (including the DoubleClick cookie) enables it and its advertising partners to serve ads to our users based on their prior visits to {APP_NAME} and/or other websites across the Internet.
            </li>
            <li>
              Third-party vendors and ad networks may also place and read cookies on your browser, or use web beacons and IP data to measure ad efficacy and deliver non-personalized or personalized advertising.
            </li>
          </ul>
          <div className="p-4 rounded-xl mt-4 border" style={{ background: C.surface, borderColor: C.border }}>
            <p className="text-sm font-semibold mb-2" style={{ color: C.text }}>
              How You Can Opt Out of Personalized Advertising:
            </p>
            <p className="text-xs leading-relaxed">
              You can opt out of personalized Google advertising at any time by visiting{' '}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium hover:text-white"
                style={{ color: C.gold }}
              >
                Google Ads Settings (https://www.google.com/settings/ads)
              </a>
              .
            </p>
            <p className="text-xs leading-relaxed mt-2">
              Alternatively, you can opt out of third-party vendor cookies for personalized interest-based advertising by visiting{' '}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium hover:text-white"
                style={{ color: C.gold }}
              >
                AboutAds Choices (https://www.aboutads.info)
              </a>{' '}
              or the Network Advertising Initiative opt-out page.
            </p>
          </div>
        </PolicySection>

        {/* Section 4: Firebase Authentication & Infrastructure */}
        <PolicySection num="4" title="Firebase Authentication & Cloud Storage">
          <p>
            User authentication and profile storage are powered by Google Firebase (Firebase Auth and Google Cloud Firestore). 
            When you sign in using Google OAuth:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Authentication tokens are securely exchanged directly between your browser and Google’s identity servers.</li>
            <li>We do not have access to, nor do we ever handle, your private Google account password.</li>
            <li>All communication between your client and Firebase servers is encrypted using Transport Layer Security (TLS/HTTPS).</li>
          </ul>
        </PolicySection>

        {/* Section 5: Cookies and Tracking Technologies */}
        <PolicySection num="5" title="Cookies & Local Storage">
          <p>
            Our website utilizes cookies and browser local storage to maintain session continuity, remember your visual theme preference (dark/light mode), preserve language selection, and monitor web traffic analytics.
          </p>
          <p>
            You can configure your browser to reject all cookies or notify you whenever a cookie is placed. However, disabling cookies may prevent certain functional elements of the website (such as staying signed in) from performing as intended.
          </p>
        </PolicySection>

        {/* Section 6: Data Retention & User Deletion Rights */}
        <PolicySection num="6" title="Data Retention & Deletion Requests">
          <p>
            We retain account data (name, email, and saved color preferences) only for as long as your account remains active or as required to fulfill legal compliance obligations.
          </p>
          <p>
            <strong style={{ color: C.text2 }}>Your Right to Erasure:</strong> You have the absolute right to request the complete deletion of your account and any associated personal data at any time. To request complete data erasure:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Send an email from your registered account address to <a href={`mailto:${CONTACT_EMAIL}`} className="underline" style={{ color: C.gold }}>{CONTACT_EMAIL}</a> with the subject line <em>"Data Deletion Request"</em>.</li>
            <li>Our administrative team will permanently purge your user profile, saved preferences, and auth records from our Firestore database within 7 business days, confirming completion in writing.</li>
          </ul>
        </PolicySection>

        {/* Section 7: Children's Online Privacy */}
        <PolicySection num="7" title="Children's Privacy">
          <p>
            {APP_NAME} is intended for general audiences interested in personal fashion and color styling. We do not knowingly solicit or collect personal identification information from children under the age of 13 (or under 18 without parental consent where mandated by Indian law). If we discover that personal data has been submitted by an unsupervised minor, we will immediately delete that information from our records.
          </p>
        </PolicySection>

        {/* Section 8: Changes to This Privacy Policy */}
        <PolicySection num="8" title="Updates to This Policy">
          <p>
            We may revise this Privacy Policy periodically to reflect enhancements in our AI technology, regulatory updates, or operational adjustments. Any updates will be posted directly to this page with an updated "Last Updated" date at the top. We encourage you to review this policy periodically.
          </p>
        </PolicySection>

        {/* Section 9: Contact Information */}
        <PolicySection num="9" title="Contacting Our Privacy Officer">
          <p>
            If you have any questions, concerns, or legal notices regarding this Privacy Policy, your rights, or our data handling practices, please contact our designated privacy representative at:
          </p>
          <div className="p-6 rounded-2xl mt-4 border space-y-2" style={{ background: C.surface, borderColor: C.border }}>
            <p className="font-semibold text-white">{APP_NAME} Privacy & Support Desk</p>
            <p className="text-sm">
              Email:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-mono text-sm underline hover:text-white" style={{ color: C.gold }}>
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="text-sm">Website: <a href={SITE_CANONICAL} className="underline" style={{ color: C.muted }}>{SITE_CANONICAL}</a></p>
            <p className="text-xs text-slate-400 mt-2">
              We respond to all verified privacy and data deletion inquiries within 24 to 48 business hours.
            </p>
          </div>
        </PolicySection>
      </main>
    </div>
  );
}
