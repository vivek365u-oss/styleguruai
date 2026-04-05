// ============================================================
// StyleGuru — Premium Feature Guard
// Wraps premium-only features with upgrade prompt
// ============================================================
import { useContext } from 'react';
import { ThemeContext } from '../App';
import { usePlan } from '../context/PlanContext';

function PremiumFeatureGuard({ children, featureName = 'Feature', onUpgradeClick, lock = true }) {
  const { theme } = useContext(ThemeContext);
  const { isPro } = usePlan();
  const isDark = theme === 'dark';

  // If premium or feature is unlocked, show children
  if (isPro || !lock) {
    return children;
  }

  // Otherwise show lock overlay
  return (
    <div className="relative">
      {/* Blurred child */}
      <div className="blur-sm pointer-events-none opacity-60">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl backdrop-blur-sm z-10">
        <div className={`p-6 rounded-2xl text-center ${isDark ? 'bg-black/60 border border-white/10' : 'bg-white/60 border border-gray-200'}`}>
          <div className="text-4xl mb-2">🔒</div>
          <p className={`text-sm font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Premium Feature
          </p>
          <p className={`text-xs mb-3 ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
            {featureName} is available for Premium members
          </p>
          <button
            onClick={onUpgradeClick}
            className="text-xs font-black px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105 transition-transform"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default PremiumFeatureGuard;
