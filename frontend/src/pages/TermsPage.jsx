import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <SEOHead
        title="Terms of Use – StyleGuru AI"
        description="Read the StyleGuru AI terms of use before using the service."
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
              <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Terms & Conditions</h1>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Last Modified: January 2025</p>
            </div>
            <div className="px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-xl text-pink-300 text-[10px] font-black uppercase tracking-widest">
              Standard Service Agreement
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white">1. Acceptance of Terms</h2>
            <p className="text-gray-400 leading-relaxed text-sm">
              By accessing or using StyleGuru AI, you agree to be bound by these Terms and Conditions. Our platform provides AI-driven fashion advice, skin tone analysis, and shopping recommendations tailored for Indian complexions. If you do not agree to these terms, please discontinue use of the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white">2. Service Accuracy & Limitation</h2>
            <p className="text-gray-400 leading-relaxed text-sm">
              While our AI models use advanced engineering to provide high-accuracy style advice, recommendations are for informational and aesthetic purposes only. Final fashion choices, including purchases through affiliate links, are at the user's discretion. StyleGuru AI is not liable for dissatisfaction with external products or analysis variance due to lighting/photo quality.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white">3. Intellectual Property</h2>
            <p className="text-gray-400 leading-relaxed text-sm">
              The algorithms, UI design, branding, and generated content within StyleGuru AI are the exclusive property of our founders. You may use our style analysis for personal use but are prohibited from reverse-engineering or commercializing our AI recommendations without written consent.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-black text-white">4. User Responsibility</h2>
            <p className="text-gray-400 leading-relaxed text-sm">
              Users are responsible for the quality of images uploaded. Clear, well-lit photos provide the most accurate ITA calculations. Any misuse of the platform or attempts to disrupt our AI services will result in immediate termination of access.
            </p>
          </section>

          <div className="pt-6 border-t border-white/5">
             <p className="text-gray-500 text-[10px] italic">StyleGuru AI reserves the right to update these terms at any time. Your continued use constitutes acceptance of the latest version.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
