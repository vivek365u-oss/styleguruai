import { useRef, useState } from 'react';
import { logShareEvent, auth } from '../api/styleApi';

function ShareCard({ analysisData, userName, theme }) {
  const canvasRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState(null);
  const [format, setFormat] = useState('story'); // 'story' | 'square'

  const isDark = theme === 'dark';
  const firstName = userName?.split(' ')[0] || 'Your';

  // QR code generator — canvas-based, no library needed
  const drawQR = (ctx, x, y, size) => {
    // Simple branded box instead of actual QR (no library)
    const s = size;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x, y, s, s, 12);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Grid pattern to simulate QR
    const cell = s / 12;
    const pattern = [
      [1,1,1,1,1,1,0,1,0,1,1,1],
      [1,0,0,0,0,1,0,0,1,0,0,1],
      [1,0,1,1,0,1,0,1,1,0,1,1],
      [1,0,1,1,0,1,0,0,0,1,0,1],
      [1,0,0,0,0,1,0,1,0,0,0,1],
      [1,1,1,1,1,1,0,1,0,1,1,1],
      [0,0,0,0,0,0,0,0,1,0,0,0],
      [1,0,1,0,1,0,1,1,0,1,0,1],
      [0,1,0,1,1,0,0,0,1,0,1,0],
      [1,0,1,0,0,1,0,1,0,1,0,1],
      [1,1,0,1,0,0,1,0,1,1,1,1],
      [1,1,1,1,1,1,0,1,0,1,0,1],
    ];
    ctx.fillStyle = '#1e1b4b';
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 12; col++) {
        if (pattern[row]?.[col]) {
          ctx.fillRect(x + col * cell + 4, y + row * cell + 4, cell - 1, cell - 1);
        }
      }
    }

    // Center logo
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.roundRect(x + s/2 - 14, y + s/2 - 14, 28, 28, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SG', x + s/2, y + s/2 + 1);
  };

  const generateStoryCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');

    // Instagram Story: 1080×1920
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
    bg.addColorStop(0, '#1e1b4b');
    bg.addColorStop(0.3, '#0f0a2e');
    bg.addColorStop(0.7, '#1a0e3a');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative circles
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#a855f7';
    ctx.beginPath(); ctx.arc(200, 300, 250, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ec4899';
    ctx.beginPath(); ctx.arc(900, 1500, 300, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    const skinHex = analysisData?.analysis?.skin_color?.hex || '#C68642';
    const skinTone = analysisData?.analysis?.skin_tone?.category || 'medium';
    const undertone = analysisData?.analysis?.skin_tone?.undertone || 'warm';
    const colorSeason = analysisData?.analysis?.skin_tone?.color_season || 'Autumn';

    // ── TOP: Logo + Title ──
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ StyleGuru AI', 540, 120);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '28px Arial, sans-serif';
    ctx.fillText('styleguruai.in', 540, 170);

    // ── Name ──
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px Arial, sans-serif';
    ctx.fillText(`${firstName}'s Style Profile`, 540, 300);

    // ── Skin Tone Swatch (large circle) ──
    ctx.beginPath();
    ctx.arc(540, 500, 120, 0, Math.PI * 2);
    ctx.fillStyle = skinHex;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Skin tone label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Arial, sans-serif';
    ctx.fillText(`${skinTone.charAt(0).toUpperCase() + skinTone.slice(1)} Skin`, 540, 690);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '32px Arial, sans-serif';
    ctx.fillText(`${undertone.charAt(0).toUpperCase() + undertone.slice(1)} Undertone`, 540, 740);

    // Season badge
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.roundRect(380, 780, 320, 60, 30);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText(`🍂 ${colorSeason}`, 540, 818);

    // ── Best Colors ──
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText('BEST COLORS FOR YOU', 540, 930);

    const bestColors = analysisData?.recommendations?.best_shirt_colors?.slice(0, 6) ||
                       analysisData?.recommendations?.best_dress_colors?.slice(0, 6) || [];
    const swatchSize = 110;
    const swatchGap = 20;
    const totalW = Math.min(bestColors.length, 6) * (swatchSize + swatchGap) - swatchGap;
    const startX = (1080 - totalW) / 2;

    bestColors.slice(0, 6).forEach((color, i) => {
      const x = startX + i * (swatchSize + swatchGap);
      const y = 970;

      // Swatch
      ctx.beginPath();
      ctx.roundRect(x, y, swatchSize, swatchSize, 16);
      ctx.fillStyle = color.hex;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Color name
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '18px Arial, sans-serif';
      const maxLen = 10;
      const name = (color.name || '').length > maxLen ? color.name.slice(0, maxLen) + '..' : (color.name || '');
      ctx.fillText(name, x + swatchSize / 2, y + swatchSize + 25);
    });

    // ── Avoid Colors ──
    const avoidColors = analysisData?.recommendations?.colors_to_avoid?.slice(0, 4) || [];
    if (avoidColors.length > 0) {
      ctx.fillStyle = 'rgba(255,80,80,0.6)';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillText('🚫 COLORS TO AVOID', 540, 1200);

      const avoidSize = 70;
      const avoidGap = 15;
      const avoidTotal = avoidColors.length * (avoidSize + avoidGap) - avoidGap;
      const avoidStartX = (1080 - avoidTotal) / 2;

      avoidColors.forEach((color, i) => {
        const x = avoidStartX + i * (avoidSize + avoidGap);
        ctx.beginPath();
        ctx.roundRect(x, 1230, avoidSize, avoidSize, 12);
        ctx.fillStyle = color.hex;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,80,80,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // ── Style Score ──
    const confidence = analysisData?.analysis?.skin_tone?.confidence || 85;
    const scoreY = 1420;
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.roundRect(140, scoreY, 800, 120, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🎯 Analysis Accuracy', 180, scoreY + 50);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${confidence}%`, 900, scoreY + 55);

    // Progress bar
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(180, scoreY + 75, 720, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(180, scoreY + 75, 720 * (confidence / 100), 16, 8);
    ctx.fill();

    // ── QR Code ──
    ctx.textAlign = 'center';
    drawQR(ctx, 440, 1600, 200);

    // ── Footer ──
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '26px Arial, sans-serif';
    ctx.fillText('Scan to find YOUR style ↑', 540, 1850);

    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 30px Arial, sans-serif';
    ctx.fillText('styleguruai.in', 540, 1895);

    return canvas;
  };

  const generateSquareCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // Background
    const bg = isDark ? '#1e1b4b' : '#ffffff';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1080);

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

    const skinHex = analysisData?.analysis?.skin_color?.hex || '#C68642';
    const skinTone = analysisData?.analysis?.skin_tone?.category || 'medium';
    const undertone = analysisData?.analysis?.skin_tone?.undertone || 'warm';
    const colorSeason = analysisData?.analysis?.skin_tone?.color_season || '';

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${firstName}'s Style Profile`, 540, 100);

    ctx.beginPath();
    ctx.roundRect(100, 180, 200, 200, 20);
    ctx.fillStyle = skinHex;
    ctx.fill();
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 3;
    ctx.stroke();

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

    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(80, 520); ctx.lineTo(1000, 520); ctx.stroke();

    ctx.fillStyle = mutedColor;
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Best Colors', 80, 570);

    const bestColors = analysisData?.recommendations?.best_shirt_colors?.slice(0, 5) ||
                       analysisData?.recommendations?.best_dress_colors?.slice(0, 5) || [];
    const swatchSize = 120;
    const swatchGap = 30;
    const totalWidth = Math.min(bestColors.length, 5) * (swatchSize + swatchGap) - swatchGap;
    const startX = (1080 - totalWidth) / 2;

    bestColors.slice(0, 5).forEach((color, i) => {
      const x = startX + i * (swatchSize + swatchGap);
      ctx.beginPath();
      ctx.roundRect(x, 600, swatchSize, swatchSize, 12);
      ctx.fillStyle = color.hex;
      ctx.fill();
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = mutedColor;
      ctx.font = '20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(color.hex, x + swatchSize / 2, 600 + swatchSize + 28);
    });

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
      const canvas = format === 'story' ? generateStoryCard() : generateSquareCard();
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/png');
      });
      const file = new File([blob], format === 'story' ? 'style-story.png' : 'style-profile.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `${firstName}'s Style Profile`,
            text: 'Check out my AI style profile from StyleGuru AI! Try yours at styleguruai.in',
          });
        } catch (err) {
          if (err.name === 'AbortError') { setSharing(false); return; }
          throw err;
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = format === 'story' ? 'style-story.png' : 'style-profile.png';
        a.click();
        URL.revokeObjectURL(url);
      }

      const uid = auth.currentUser?.uid;
      const skinTone = analysisData?.analysis?.skin_tone?.category || '';
      if (uid) logShareEvent(uid, skinTone).catch(() => {});
    } catch (err) {
      console.error('ShareCard error:', err);
      setError('Could not generate card. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Format toggle */}
      <div className={`flex rounded-xl p-0.5 gap-0.5 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}>
        <button onClick={() => setFormat('story')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            format === 'story' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md' : isDark ? 'text-white/40' : 'text-gray-400'
          }`}>📱 Instagram Story</button>
        <button onClick={() => setFormat('square')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
            format === 'square' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md' : isDark ? 'text-white/40' : 'text-gray-400'
          }`}>📷 Square Post</button>
      </div>

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
            <span>{format === 'story' ? 'Share as Story' : 'Share My Style'}</span>
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
