/**
 * useAnalysisProgress.js — Fixed: animation never gets stuck at 95%
 * 
 * FIX: After reaching 95%, continue slow heartbeat (0.1% per 600ms)
 * so the bar always looks alive until completeProgress() is called.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

const STAGES = [
  { label: 'Preparing your photo...',         percent: 0,  emoji: '📸', duration: 600  },
  { label: 'Detecting skin tone...',           percent: 18, emoji: '🔬', duration: 900  },
  { label: 'Reading color values...',          percent: 38, emoji: '🎨', duration: 1000 },
  { label: 'Matching your undertone...',       percent: 58, emoji: '🎭', duration: 800  },
  { label: 'Building outfit palette...',       percent: 76, emoji: '👔', duration: 700  },
  { label: 'Generating recommendations...',    percent: 88, emoji: '✨', duration: 500  },
];

export function useAnalysisProgress() {
  const [progress, setProgress] = useState({
    percent: 0,
    label: 'Starting...',
    emoji: '🔍',
    isError: false,
  });

  const intervalRef = useRef(null);
  const heartbeatRef = useRef(null);
  const startTimeRef = useRef(null);
  const isCompleted = useRef(false);

  const clearAll = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
  };

  const startProgress = useCallback(() => {
    clearAll();
    isCompleted.current = false;
    startTimeRef.current = Date.now();

    setProgress({ percent: 2, label: STAGES[0].label, emoji: STAGES[0].emoji, isError: false });

    let stageIdx = 0;
    const totalDuration = STAGES.reduce((s, st) => s + st.duration, 0);

    intervalRef.current = setInterval(() => {
      if (isCompleted.current) { clearInterval(intervalRef.current); return; }

      const elapsed = Date.now() - startTimeRef.current;
      let accTime = 0;
      let currentStage = STAGES[0];
      let nextStage = STAGES[1];

      for (let i = 0; i < STAGES.length; i++) {
        accTime += STAGES[i].duration;
        if (elapsed < accTime) {
          currentStage = STAGES[i];
          nextStage = STAGES[i + 1] || { percent: 95 };
          stageIdx = i;
          break;
        }
        if (i === STAGES.length - 1) {
          // All stages done — go to heartbeat mode
          clearInterval(intervalRef.current);

          // Heartbeat: slow crawl from current to max 94.9%
          heartbeatRef.current = setInterval(() => {
            if (isCompleted.current) { clearInterval(heartbeatRef.current); return; }
            setProgress(prev => ({
              ...prev,
              percent: Math.min(prev.percent + 0.1, 94.9),
              label: 'Almost ready...',
              emoji: '⏳',
            }));
          }, 600);
          return;
        }
      }

      const stageStart = accTime - currentStage.duration;
      const stageElapsed = elapsed - stageStart;
      const pctDiff = (nextStage.percent || 95) - currentStage.percent;
      const stageProgress = Math.min((stageElapsed / currentStage.duration) * pctDiff, pctDiff);
      const percent = Math.round(Math.min(currentStage.percent + stageProgress, 94.9));

      setProgress(prev => ({
        ...prev,
        percent,
        label: currentStage.label,
        emoji: currentStage.emoji,
      }));

      if (elapsed >= totalDuration) {
        clearInterval(intervalRef.current);
        setProgress(prev => ({ ...prev, percent: Math.min(prev.percent, 94), label: 'Almost ready...', emoji: '⏳' }));
        heartbeatRef.current = setInterval(() => {
          if (isCompleted.current) { clearInterval(heartbeatRef.current); return; }
          setProgress(prev => ({ ...prev, percent: Math.min(prev.percent + 0.1, 94.9) }));
        }, 600);
      }
    }, 80);
  }, []);

  const completeProgress = useCallback(() => {
    isCompleted.current = true;
    clearAll();
    setProgress({ percent: 100, label: 'Style profile ready!', emoji: '✅', isError: false });
  }, []);

  const setError = useCallback((msg = 'Analysis failed') => {
    isCompleted.current = true;
    clearAll();
    setProgress({ percent: 0, label: msg, emoji: '❌', isError: true });
  }, []);

  const reset = useCallback(() => {
    isCompleted.current = true;
    clearAll();
    setProgress({ percent: 0, label: 'Starting...', emoji: '🔍', isError: false });
  }, []);

  useEffect(() => () => clearAll(), []);

  return { progress, startProgress, completeProgress, setError, reset };
}
