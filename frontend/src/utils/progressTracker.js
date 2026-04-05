/**
 * Real Progress Tracker for Image Analysis
 * Maps API events to actual progress percentage
 */

export class AnalysisProgressTracker {
  constructor(onProgressChange) {
    this.onProgressChange = onProgressChange;
    this.stages = [
      { name: 'upload', label: 'Uploading image...', start: 0, end: 15, emoji: '📤' },
      { name: 'detection', label: 'Detecting face...', start: 15, end: 40, emoji: '👤' },
      { name: 'extraction', label: 'Analyzing skin tone...', start: 40, end: 70, emoji: '🎨' },
      { name: 'recommendation', label: 'Generating recommendations...', start: 70, end: 95, emoji: '✨' },
      { name: 'complete', label: 'Complete!', start: 95, end: 100, emoji: '🎉' },
    ];
    this.currentStage = 0;
    this.currentProgress = 0;
    this.startTime = Date.now();
  }

  // Update progress within current stage
  updateStageProgress(percent) {
    const stage = this.stages[this.currentStage];
    const stageRange = stage.end - stage.start;
    const progress = stage.start + (stageRange * percent) / 100;
    this.setProgress(progress, stage);
  }

  // Move to next stage
  nextStage() {
    if (this.currentStage < this.stages.length - 1) {
      this.currentStage++;
      const stage = this.stages[this.currentStage];
      this.setProgress(stage.start, stage);
    }
  }

  // Set specific progress
  setProgress(progress, stage) {
    this.currentProgress = Math.min(progress, this.stages[this.currentStage].end);
    
    const elapsed = (Date.now() - this.startTime) / 1000;
    let timeRemaining = null;
    
    if (this.currentProgress > 0 && this.currentProgress < 100) {
      const rate = this.currentProgress / elapsed;
      const remainingPercent = 100 - this.currentProgress;
      timeRemaining = Math.ceil(remainingPercent / rate);
    }

    this.onProgressChange({
      percent: Math.round(this.currentProgress),
      label: stage?.label || this.stages[this.currentStage].label,
      emoji: stage?.emoji || this.stages[this.currentStage].emoji,
      timeRemaining,
      stage: stage?.name || this.stages[this.currentStage].name,
    });
  }

  // Get current progress state
  getState() {
    return {
      percent: Math.round(this.currentProgress),
      label: this.stages[this.currentStage].label,
      emoji: this.stages[this.currentStage].emoji,
      stage: this.stages[this.currentStage].name,
    };
  }

  // Complete analysis
  complete() {
    this.currentStage = this.stages.length - 1;
    this.currentProgress = 100;
    this.setProgress(100, this.stages[this.currentStage]);
  }

  // Handle error
  error(errorMessage) {
    this.onProgressChange({
      percent: this.currentProgress,
      label: `Error: ${errorMessage}`,
      emoji: '❌',
      isError: true,
      stage: 'error',
    });
  }
}

export default AnalysisProgressTracker;
