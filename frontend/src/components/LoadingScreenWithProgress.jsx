/**
 * Enhanced Loading Screen — Real Multi-Stage Progress Animation
 * Production-level UX: staged steps, animated ring, fade-in/out
 */

import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from '../App';
import { useLanguage } from '../i18n/LanguageContext';

// Stage definitions shown as step pills
const STAGE_STEPS = [
  { key: 'upload',     emoji: '📤', label: 'Uploading...',        threshold: 0  },
  { key: 'detect',     emoji: '🔬', label: 'Detecting colors...',  threshold: 20 },
  { key: 'analyze',    emoji: '🎨', label: 'Analyzing skin tone...',threshold: 40 },
  { key: 'match',      emoji: '👔', label: 'Matching outfits...',  threshold: 70 },
  { key: 'finalize',   emoji: '✨', label: 'Generating results...', threshold: 90 },
];

export function LoadingScreenWithProgress({ progress }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [displayedPercent, setDisplayedPercent] = useState(0);

  // Normalize: support both object {percent, label} and raw number
  const rawPercent = typeof progress === 'number'
    ? progress
    : (progress?.percent ?? 0);
  const label = typeof progress === 'object' && progress !== null
    ? (progress.label || 'Analyzing your style...')
    : 'Analyzing your style...';
  const activeEmoji = typeof progress === 'object' && progress !== null
    ? (progress.emoji || '🔍')
    : '🔍';
  const isError = typeof progress === 'object' && progress !== null && progress.isError;

  // Smooth counter animation
  useEffect(() => {
    let frame;
    const animate = () => {
      setDisplayedPercent(prev => {
        if (prev < rawPercent) {
          const step = Math.max(1, Math.ceil((rawPercent - prev) / 6));
          return Math.min(prev + step, rawPercent);
        }
        return prev;
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [rawPercent]);

  // SVG circle progress (128x128, r=54)
  const RADIUS = 54;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE * (1 - displayedPercent / 100);

  // Active stage
  const activeStageIdx = STAGE_STEPS.reduce((acc, stage, i) => {
    return displayedPercent >= stage.threshold ? i : acc;
  }, 0);

  return (
    <div className={`flex flex-col items-center justify-center min-h-[65vh] px-6 py-8 animate-fadeIn`}>

      {/* Circular progress ring */}
      <div className="relative w-36 h-36 mb-6" style={{ filter: 'drop-shadow(0 0 20px rgba(168,85,247,0.35))' }}>
        {/* Background track */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={RADIUS} fill="none"
            stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}
            strokeWidth="8" />
        </svg>
        {/* Progress arc */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
          <defs>
            <linearGradient id="pgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <circle
            cx="64" cy="64" r={RADIUS}
            fill="none"
            stroke="url(#pgGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        {/* Center emoji + percent */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl mb-0.5 animate-bounce-subtle">{isError ? '❌' : activeEmoji}</span>
          <span className={`text-sm font-black tabular-nums ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {displayedPercent}%
          </span>
        </div>
      </div>

      {/* Title */}
      <h2 className={`text-xl font-black mb-1 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {isError ? 'Analysis Failed' : label}
      </h2>
      <p className={`text-sm mb-6 text-center ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
        {isError ? 'Please try again with a clearer photo' : 'StyleGuru AI is crafting your style profile...'}
      </p>

      {/* Stage step pills */}
      {!isError && (
        <div className="flex items-center gap-1.5 flex-wrap justify-center mb-6">
          {STAGE_STEPS.map((stage, i) => {
            const isDone    = i < activeStageIdx;
            const isActive  = i === activeStageIdx;
            const isPending = i > activeStageIdx;
            return (
              <div
                key={stage.key}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border transition-all duration-300 ${
                  isDone
                    ? isDark
                      ? 'bg-green-500/20 border-green-500/30 text-green-300'
                      : 'bg-green-100 border-green-400 text-green-700'
                    : isActive
                      ? isDark
                        ? 'bg-purple-500/30 border-purple-500/50 text-purple-200 scale-105 shadow-md shadow-purple-500/20'
                        : 'bg-purple-100 border-purple-500 text-purple-700 scale-105 shadow-sm'
                      : isDark
                        ? 'bg-white/5 border-white/10 text-white/30'
                        : 'bg-gray-100 border-gray-200 text-gray-400'
                }`}
              >
                <span>{isDone ? '✅' : isActive ? stage.emoji : '○'}</span>
                <span>{stage.label.replace('...', '')}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress bar (supplemental) */}
      {!isError && (
        <div className={`w-full max-w-xs h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${displayedPercent}%` }}
          />
        </div>
      )}

      {/* Error detail */}
      {isError && (
        <div className={`mt-4 px-4 py-3 rounded-2xl border text-center ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-300'}`}>
          <p className={`text-sm font-semibold ${isDark ? 'text-red-300' : 'text-red-600'}`}>
            {progress?.label || 'Analysis failed. Please try again.'}
          </p>
        </div>
      )}

      {/* Subtle pulse dots */}
      {!isError && (
        <div className="flex gap-2 mt-6">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-purple-500/60 animate-pulse"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default LoadingScreenWithProgress;
