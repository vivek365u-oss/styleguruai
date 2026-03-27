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
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Terms &amp; Conditions
        </h1>

        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 space-y-6 backdrop-blur-sm">
          <p className="text-gray-400 text-sm">Last updated: January 2025</p>

          {[
            { heading: 'Responsible Use', text: 'By using this website, you agree to use the service responsibly.' },
            { heading: 'Informational Purposes', text: 'All recommendations are for informational purposes only.' },
            { heading: 'Liability', text: 'We are not responsible for decisions made based on suggestions.' },
          ].map((section) => (
            <div key={section.heading} className="border-l-2 border-purple-500/50 pl-4">
              <h2 className="text-white font-semibold text-lg mb-2">{section.heading}</h2>
              <p className="text-gray-300 leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
