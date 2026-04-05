/**
 * Enhanced Loading Screen with Real Progress Tracking
 */

import React, { useContext } from 'react';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';

export function LoadingScreenWithProgress({ progress }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const progressPercent = progress?.percent || 0;
  const timeRemaining = progress?.timeRemaining;

  const formatTime = (seconds) => {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds}s remaining`;
    const mins = Math.ceil(seconds / 60);
    return `${mins}m remaining`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Animated loader */}
      <div className="relative w-32 h-32 mb-8">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
        
        {/* Progress circle */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" style={{ view: '0 0 100 100' }}>
          <circle
            cx="64"
            cy="64"
            r="60"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 60 * (progressPercent / 100)} ${2 * Math.PI * 60}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center emoji */}
        <div className="absolute inset-0 flex items-center justify-center text-5xl">
          {progress?.emoji || '🔍'}
        </div>

        {/* Percentage text */}
        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {progressPercent}%
        </div>
      </div>

      {/* Status label */}
      <h2 className={`text-2xl font-black mb-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {progress?.label || 'Processing...'}
      </h2>

      {/* Stage indicators */}
      <div className="flex gap-2 mb-6">
        {['upload', 'detection', 'extraction', 'recommendation'].map((stage, i) => {
          const stageOrder = { upload: 0, detection: 1, extraction: 2, recommendation: 3 };
          const isActive = stageOrder[stage] * 25 <= progressPercent;
          const isComplete = stageOrder[stage] * 25 < progressPercent;

          return (
            <div
              key={stage}
              className={`h-2 rounded-full transition-all ${
                isComplete
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 w-8'
                  : isActive
                  ? 'bg-purple-500 w-6'
                  : isDark
                  ? 'bg-white/10 w-4'
                  : 'bg-gray-300 w-4'
              }`}
            />
          );
        })}
      </div>

      {/* Time remaining */}
      {timeRemaining && (
        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
          {formatTime(timeRemaining)}
        </p>
      )}

      {/* Error state */}
      {progress?.isError && (
        <div className={`mt-4 p-3 rounded-lg border text-center ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-300'}`}>
          <p className={`text-sm font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>
            {progress.label}
          </p>
        </div>
      )}
    </div>
  );
}

export default LoadingScreenWithProgress;
