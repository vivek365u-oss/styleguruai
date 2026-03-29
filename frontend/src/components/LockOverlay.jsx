import { useContext } from 'react';
import { ThemeContext } from '../App';

function LockOverlay({ onUpgrade }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl"
      style={{ background: isDark ? 'rgba(5,8,22,0.7)' : 'rgba(255,255,255,0.75)', backdropFilter: 'blur(2px)' }}>
      <span className="text-3xl mb-2">🔒</span>
      <p className={`text-xs font-bold mb-3 text-center px-4 ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
        Pro feature
      </p>
      <button
        onClick={onUpgrade}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-black px-4 py-2 rounded-xl transition-all hover:scale-105 shadow-lg"
      >
        Upgrade ₹31/month
      </button>
    </div>
  );
}

export default LockOverlay;
