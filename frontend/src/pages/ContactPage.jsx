import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export default function ContactPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-[#02040a] text-white" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <SEOHead
        title="Contact – StyleGuru AI"
        description="Get in touch with the StyleGuru AI team."
      />

      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-pink-700/20 blur-[120px] pointer-events-none z-0" />

      <nav className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-lg">
        <div className="flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-black shadow-lg shadow-purple-500/20">S</div>
            <span className="text-xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">StyleGuru AI</span>
          </Link>
          <Link to="/" className="text-gray-400 hover:text-white transition text-sm font-medium">← {t('navHome') || 'Home'}</Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
            Support Center
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Let's Talk Style.
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Have questions about your skin tone analysis or need custom fashion advice? Our experts are here to help you shine.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Contact Info */}
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-sm">
              <h2 className="text-2xl font-black mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl">✉️</div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-1">Email Us</p>
                    <a href="mailto:styleguruai.in.gmail@gmail.com" className="text-lg font-bold hover:text-purple-400 transition-colors">styleguruai.in.gmail@gmail.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl">🤝</div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Partnerships</p>
                     <p className="text-gray-300 font-medium">styleguruai.in.gmail@gmail.com</p>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-[2.5rem] p-8">
              <h3 className="text-xl font-black mb-2">Fast Response</h3>
              <p className="text-sm text-purple-200/70 leading-relaxed font-medium">
                We're currently scaling our AI model. Support response times are under 24 hours. Your feedback helps us build the future of Indian fashion.
              </p>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-sm">
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Name</label>
                  <input type="text" placeholder="Your Name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500/50 transition-all text-sm font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Topic</label>
                  <select className="w-auto bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500/50 transition-all text-sm font-medium appearance-none">
                    <option className="bg-gray-900">Style Analysis</option>
                    <option className="bg-gray-900">Technical Issue</option>
                    <option className="bg-gray-900">Business</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Message</label>
                <textarea rows="4" placeholder="How can we help you?" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500/50 transition-all text-sm font-medium" />
              </div>
              <button className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95 transition-all">
                Send Message ✨
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
