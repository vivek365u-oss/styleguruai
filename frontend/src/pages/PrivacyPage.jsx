import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <SEOHead
        title="Privacy Policy – StyleGuru AI"
        description="Read the StyleGuru AI privacy policy. We do not store or share your uploaded images."
      />

      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-pink-700/20 blur-[120px] pointer-events-none z-0" />

      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto border-b border-gray-800/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">S</div>
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">StyleGuru AI</span>
        </Link>
        <Link to="/" className="text-gray-400 hover:text-white transition text-sm">← Home</Link>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <div className="inline-block bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs px-4 py-2 rounded-full mb-6">Legal</div>
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 space-y-10 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Privacy Policy</h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Effective Date: January 01, 2025</p>
            </div>
            <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300 text-[10px] font-black uppercase tracking-widest">
              GDPR & ITA Compliant
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white">1. Data Collection & Usage</h2>
            <p className="text-gray-400 leading-relaxed text-sm">
              StyleGuru AI operates on a "Privacy First" architecture. When you upload an image for Skin Tone or Outfit analysis, our AI processes the visual data in a transient state. We do not store original raw images on our permanent servers after the analysis is complete, ensuring your visual identity remains yours.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white">2. Intelligence Processing</h2>
            <p className="text-gray-400 leading-relaxed text-sm">
              Our models analyze technical attributes such as ITA (Individual Typology Angle) and hex-code values to provide accurate fashion recommendations. This data is converted into anonymized style profiles to personalize your experience without identifying you personally.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white">3. Third-Party Integration</h2>
            <p className="text-gray-400 leading-relaxed text-sm">
              We partner with Google AdSense and various affiliate networks (Amazon, Myntra, etc.) to monetize our free services. These partners may use cookies to serve relevant advertisements. We recommend reviewing their respective privacy policies for more details on their data handling practices.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white">4. Your Rights</h2>
            <p className="text-gray-400 leading-relaxed text-sm">
              You have the right to access, delete, or modify any saved style preferences within your Dashboard. For any data-related queries or formal requests, please contact our Data Protection Officer at <span className="text-purple-400 font-bold">privacy@styleguruai.online</span>.
            </p>
          </section>

          <div className="pt-6 border-t border-white/5">
             <p className="text-gray-500 text-[10px] italic">By continuing to use StyleGuru AI, you acknowledge and agree to the terms outlined in this Privacy Policy.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
