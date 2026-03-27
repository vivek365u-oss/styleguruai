import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <SEOHead
        title="About – StyleGuru AI"
        description="Learn about StyleGuru AI, the AI-powered fashion advisor that helps you choose outfits based on your skin tone."
      />

      {/* Glow blobs */}
      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-pink-700/20 blur-[120px] pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto border-b border-gray-800/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">S</div>
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">StyleGuru AI</span>
        </Link>
        <Link to="/" className="text-gray-400 hover:text-white transition text-sm">← Home</Link>
      </nav>

      {/* Content */}
      <main className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <div className="inline-block bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs px-4 py-2 rounded-full mb-6">About Us</div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          About Style Guru AI
        </h1>

        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-8 space-y-6 backdrop-blur-sm">
          <p className="text-gray-300 text-lg leading-relaxed">
            Style Guru AI is an AI-powered fashion advisor that helps users choose the best outfits based on their skin tone.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            Users can upload their photo and receive personalized recommendations for colors, outfits, and styling tips.
          </p>
          <p className="text-gray-300 text-lg leading-relaxed">
            Our goal is to simplify fashion decisions using AI.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {[
              { icon: '🎨', title: 'Skin Tone Analysis', desc: 'Advanced AI color science' },
              { icon: '👔', title: 'Outfit Recommendations', desc: 'Personalized for you' },
              { icon: '✨', title: 'Style Tips', desc: 'Expert fashion advice' },
            ].map((item) => (
              <div key={item.title} className="bg-purple-900/20 border border-purple-700/30 rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="font-semibold text-sm text-white">{item.title}</p>
                <p className="text-gray-400 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
