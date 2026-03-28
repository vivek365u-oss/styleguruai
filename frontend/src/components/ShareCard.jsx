import { useRef, useState } from 'react';
import { logShareEvent, auth } from '../api/styleApi';

function ShareCard({ analysisData, userName, theme }) {
  const canvasRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(null);

  const isDark = theme === 'dark';
  const firstName = userName?.split(' ')[0] || 'Your';

  const generateCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Background
    const bg = isDark ? '#1e1b4b' : '#ffffff';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1080);

    // Gradient overlay
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    if (isDark) {
      grad.addColorStop(0, 'rgba(139, 92, 246, 0.15)');
      grad.addColorStop(1, 'rgba(236, 72, 153, 0.10)');
    } else {
      grad.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
      grad.addColorStop(1, 'rgba(236, 72, 153, 0.05)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    const textColor = isDark ? '#ffffff' : '#1f2937';
    const mutedColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)';
    const accentColor = '#a855f7';

    // Title — "{firstName}'s Style Profile"
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${firstName}'s Style Profile`, 540, 100);

    // Skin tone swatch — 200x200 at x=100, y=180
    const skinHex = analysisData?.analysis?.skin_color?.hex || '#C68642';
    const skinTone = analysisData?.analysis?.skin_tone?.category || 'medium';
    const undertone = analysisData?.analysis?.skin_tone?.undertone || 'warm';
    const colorSeason = analysisData?.analysis?.skin_tone?.color_season || '';

    ctx.beginPath();
    ctx.roundRect(100, 180, 200, 200, 20);
    ctx.fillStyle = skinHex;
    ctx.fill();
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Skin tone labels alongside swatch
    ctx.textAlign = 'left';
    ctx.fillStyle = mutedColor;
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText('Skin Tone', 340, 230);

    ctx.fillStyle = textColor;
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.fillText(`${skinTone.charAt(0).toUpperCase() + skinTone.slice(1)} Warm`, 340, 290);

    ctx.fillStyle = mutedColor;
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText('Season', 340, 340);

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillText(colorSeason || 'Autumn', 340, 385);

    ctx.fillStyle = mutedColor;
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText('Undertone', 340, 430);

    ctx.fillStyle = textColor;
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText(`${undertone.charAt(0).toUpperCase() + undertone.slice(1)}`, 340, 470);

    // Divider
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 520);
    ctx.lineTo(1000, 520);
    ctx.stroke();

    // Best Colors label
    ctx.fillStyle = mutedColor;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Best Colors', 80, 570);

    // Up to 5 color swatches — 120x120 each
    const bestColors = analysisData?.recommendations?.best_shirt_colors?.slice(0, 5) ||
                       analysisData?.recommendations?.best_dress_colors?.slice(0, 5) || [];
    const swatchSize = 120;
    const swatchGap = 30;
    const totalWidth = Math.min(bestColors.length, 5) * (swatchSize + swatchGap) - swatchGap;
    const startX = (1080 - totalWidth) / 2;

    bestColors.slice(0, 5).forEach((color, i) => {
      const x = startX + i * (swatchSize + swatchGap);
      const y = 600;

      ctx.beginPath();
      ctx.roundRect(x, y, swatchSize, swatchSize, 12);
      ctx.fillStyle = color.hex;
      ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Hex code below swatch
      ctx.fillStyle = mutedColor;
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(color.hex, x + swatchSize / 2, y + swatchSize + 28);
    });

    // Branding at bottom
    ctx.textAlign = 'center';
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText('StyleGuru AI', 540, 920);

    ctx.fillStyle = mutedColor;
    ctx.font = '26px Arial, sans-serif';
    ctx.fillText('Find your style at styleguruai.in', 540, 960);

    return canvas;
  };

  const shareCard = async () => {
    setSharing(true);
    setError(null);
    try {
      const canvas = generateCard();
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/png');
      });
      const file = new File([blob], 'style-profile.png', { type: 'image/png' });

      // Try Web Share API with file support
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${firstName}'s Style Profile`,
            text: 'Check out my AI style profile from StyleGuru AI!',
          });
        } catch (err) {
          if (err.name === 'AbortError') {
            setSharing(false);
            return; // User cancelled — silently re-enable
          }
          throw err;
        }
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'style-profile.png';
        a.click();
        URL.revokeObjectURL(url);
      }

      // Log share event
      const uid = auth.currentUser?.uid;
      const skinTone = analysisData?.analysis?.skin_tone?.category || '';
      if (uid) {
        logShareEvent(uid, skinTone).catch(() => {}); // non-blocking
      }
    } catch (err) {
      console.error('ShareCard error:', err);
      setError('Could not generate card. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button
        onClick={shareCard}
        disabled={sharing}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
          isDark
            ? 'bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
            : 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100 shadow-sm'
        }`}
      >
        {sharing ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <span>✨</span>
            <span>Share My Style</span>
          </>
        )}
      </button>
      {error && (
        <p className={`text-xs mt-1 text-center ${isDark ? 'text-red-400' : 'text-red-500'}`}>{error}</p>
      )}
    </div>
  );
}

export default ShareCard;
