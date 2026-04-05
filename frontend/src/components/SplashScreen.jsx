import { useEffect } from 'react';

export default function SplashScreen({ onComplete }) {
  useEffect(() => {
    // Show splash for 2.5 seconds then navigate
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#050816] via-purple-950 to-[#050816] overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-600 rounded-full opacity-30 blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-pink-600 rounded-full opacity-30 blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="animate-bounce">
          <div className="w-28 h-28 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl shadow-purple-500/40 flex items-center justify-center">
            <span className="text-white text-5xl font-black tracking-tighter">SG</span>
          </div>
        </div>

        {/* Branding */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-white tracking-widest">StyleGuru AI</h1>
          <p className="text-purple-300 text-lg font-semibold">Find Your Perfect Style</p>
        </div>

        {/* Tagline */}
        <p className="text-white/60 text-center max-w-xs text-sm leading-relaxed">
          Powered by AI • Color Analysis • Fashion Intelligence
        </p>

        {/* Loading animation */}
        <div className="mt-8 flex gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* Progress bar */}
        <div className="mt-8 w-48 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" style={{
            animation: 'slideRight 2.5s ease-in-out forwards'
          }}></div>
        </div>
      </div>

      {/* Loading text */}
      <div className="absolute bottom-12 text-white/40 text-xs font-semibold tracking-widest animate-pulse">
        Loading...
      </div>

      <style>{`
        @keyframes slideRight {
          0% { width: 0; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
