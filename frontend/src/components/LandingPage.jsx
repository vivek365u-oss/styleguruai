import React from 'react';

const features = [
  {
    icon: '🎨',
    title: 'Skin Tone Detection',
    desc: 'AI-powered skin tone analysis from your selfie using advanced color science.',
  },
  {
    icon: '👔',
    title: 'Outfit Recommendations',
    desc: 'Get personalized shirt, pant, and accessory color suggestions that suit you.',
  },
  {
    icon: '✨',
    title: 'Personalized Fashion Advice',
    desc: 'Style tips, occasion advice, and ethnic wear suggestions tailored for you.',
  },
  {
    icon: '📱',
    title: 'Easy to Use',
    desc: 'Just upload a selfie — get instant results in seconds. No expertise needed.',
  },
];

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          StyleGuru AI
        </span>
        <button
          onClick={onGetStarted}
          className="bg-purple-600 hover:bg-purple-700 transition px-5 py-2 rounded-full text-sm font-medium"
        >
          Login
        </button>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 py-24 max-w-4xl mx-auto">
        <div className="inline-block bg-purple-900/40 text-purple-300 text-xs px-4 py-1 rounded-full mb-6 border border-purple-700">
          AI-Powered Fashion Advisor
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
          StyleGuru AI –{' '}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Smart Fashion Advisor
          </span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          Get outfit recommendations based on your skin tone using AI. Upload a selfie and discover your perfect colors.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition px-8 py-3 rounded-full text-lg font-semibold shadow-lg shadow-purple-900/50"
          >
            Try Now
          </button>
          <button
            onClick={onGetStarted}
            className="border border-purple-600 hover:bg-purple-900/30 transition px-8 py-3 rounded-full text-lg font-semibold"
          >
            Login
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why{' '}
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            StyleGuru AI?
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-600 hover:shadow-lg hover:shadow-purple-900/30 transition"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Demo */}
      <section className="px-6 py-16 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">See How It Works</h2>
        <p className="text-gray-400 mb-10">Upload → Analyze → Get Recommendations</p>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 flex flex-col md:flex-row gap-6 items-center justify-center">
          {['📸 Upload Selfie', '🔬 AI Analysis', '🎨 Get Colors'].map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded-full bg-purple-900/50 border border-purple-700 flex items-center justify-center text-2xl">
                  {step.split(' ')[0]}
                </div>
                <span className="text-sm text-gray-300">{step.split(' ').slice(1).join(' ')}</span>
              </div>
              {i < 2 && <div className="text-purple-500 text-2xl hidden md:block">→</div>}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-800 rounded-3xl max-w-2xl mx-auto p-12">
          <h2 className="text-3xl font-bold mb-4">Start your fashion journey today</h2>
          <p className="text-gray-400 mb-8">Join thousands of users discovering their perfect style.</p>
          <button
            onClick={onGetStarted}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition px-10 py-3 rounded-full text-lg font-semibold shadow-lg"
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500 text-sm">
        <p className="font-semibold text-gray-300 mb-3">StyleGuru AI</p>
        <div className="flex justify-center gap-6">
          <button onClick={() => {}} className="hover:text-purple-400 transition">Home</button>
          <button onClick={onGetStarted} className="hover:text-purple-400 transition">Login</button>
          <button onClick={() => {}} className="hover:text-purple-400 transition">Privacy</button>
        </div>
        <p className="mt-4">© 2025 StyleGuru AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
