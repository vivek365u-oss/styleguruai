/**
 * ISSUE 2 & 3 FIX: Proper Loading Progress with Fake Realistic Animation
 * This hook manages progress state w fake progressive loading
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const stages = [
  { label: 'Uploading image...', percent: 0, emoji: '📤', duration: 400 },
  { label: 'Detecting colors...', percent: 20, emoji: '🎨', duration: 800 },
  { label: 'Analyzing skin tone...', percent: 40, emoji: '🔬', duration: 1000 },
  { label: 'Extracting undertone...', percent: 60, emoji: '🎭', duration: 800 },
  { label: 'Matching outfits...', percent: 80, emoji: '👔', duration: 600 },
  { label: 'Generating recommendations...', percent: 90, emoji: '✨', duration: 1000 },
];

export function useAnalysisProgress() {
  const [progress, setProgress] = useState({
    percent: 0,
    label: 'Starting analysis...',
    emoji: '🔍',
    timeRemaining: null,
    isError: false,
    errorMessage: '',
  });

  const progressIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const totalDurationRef = useRef(4800); // Slightly longer simulation

  const startProgress = useCallback(() => {
    setProgress({
      percent: 0,
      label: 'Starting analysis...',
      emoji: '🔍',
      timeRemaining: Math.ceil(totalDurationRef.current / 1000),
      isError: false,
      errorMessage: '',
    });

    startTimeRef.current = Date.now();
    let stageIndex = 0;
    let elapsed = 0;

    // Simulate progressive loading through stages
    progressIntervalRef.current = setInterval(() => {
      const now = Date.now();
      elapsed = now - startTimeRef.current;
      const totalDuration = totalDurationRef.current;

      // Find current stage
      let currentStage = stages[0];
      let accumulatedTime = 0;

      for (let i = 0; i < stages.length; i++) {
        accumulatedTime += stages[i].duration;
        if (elapsed < accumulatedTime) {
          currentStage = stages[i];
          break;
        }
      }

      // Calculate percentage within current stage
      const stageStart = accumulatedTime - currentStage.duration;
      const nextPercent = stages[stageIndex + 1]?.percent || 95;
      const stageProgress = Math.min(
        ((elapsed - stageStart) / currentStage.duration) * (nextPercent - currentStage.percent),
        (nextPercent - currentStage.percent)
      );

      // Max out at 95%
      const currentPercent = Math.min(currentStage.percent + stageProgress, 95);
      // Min 1 second remaining until complete
      const timeRemaining = Math.max(Math.ceil((totalDuration - elapsed) / 1000), 1);

      setProgress(prev => ({
        ...prev,
        percent: Math.round(currentPercent),
        label: currentStage.label,
        emoji: currentStage.emoji,
        timeRemaining: timeRemaining,
      }));

      // Stop at 95% when duration exhausted, wait for completeProgress
      if (elapsed >= totalDuration) {
        clearInterval(progressIntervalRef.current);
        setProgress(prev => ({
          ...prev,
          percent: 95,
          label: 'Finalizing style profile...',
          emoji: '⏳',
          timeRemaining: 1,
        }));
      }
    }, 100);
  }, []);

  const completeProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setProgress(prev => ({
      ...prev,
      percent: 100,
      label: 'Complete!',
      emoji: '✅',
      timeRemaining: 0,
    }));
  }, []);

  const setError = useCallback((errorMessage) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setProgress(prev => ({
      ...prev,
      isError: true,
      errorMessage: errorMessage,
      label: 'Analysis failed',
      emoji: '❌',
    }));
  }, []);

  const reset = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    setProgress({
      percent: 0,
      label: 'Starting analysis...',
      emoji: '🔍',
      timeRemaining: null,
      isError: false,
      errorMessage: '',
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    progress,
    startProgress,
    completeProgress,
    setError,
    reset,
  };
}
