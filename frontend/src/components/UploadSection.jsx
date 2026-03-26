import { useState, useRef, useContext } from 'react';
import { analyzeImage, analyzeImageFemale, analyzeImageSeasonal } from '../api/styleApi';
import { ThemeContext } from '../App';

function UploadSection({ onLoadingStart, onAnalysisComplete, onError, onImageSelected, onGenderChange }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [gender, setGender] = useState('male');
  const [mode, setMode] = useState('normal');
  const [season, setSeason] = useState('summer');
  const fileInputRef = useRef(null);

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    if (onGenderChange) onGenderChange(newGender);
  };

  const handleFile = async (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) { onError('Only JPG, PNG, or WebP images are allowed.'); return; }
    if (file.size > 10 * 1024 * 1024) { onError('Image is too large. Maximum size is 10MB.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setPreview(e.target.result); onImageSelected(e.target.result); };
    reader.readAsDataURL(file);
    onLoadingStart();
    try {
      let res;
      if (mode === 'seasonal') {
        res = await analyzeImageSeasonal(file, season, setUploadProgress);
        onAnalysisComplete({ ...res.data, gender: 'seasonal', seasonalGender: gender });
      } else if (gender === 'female') {
        res = await analyzeImageFemale(file, setUploadProgress);
        onAnalysisComplete({ ...res.data, gender: 'female' });
      } else {
        res = await analyzeImage(file, setUploadProgress);
        onAnalysisComplete({ ...res.data, gender: 'male' });
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object') onError(detail.message || 'Analysis failed.');
      else onError(detail || 'Could not connect to server. Is the backend running?');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  const seasons = [
    { id: 'summer', label: 'Summer', emoji: '☀️', desc: 'March-June' },
    { id: 'monsoon', label: 'Monsoon', emoji: '🌧️', desc: 'July-Sept' },
    { id: 'winter', label: 'Winter', emoji: '❄️', desc: 'Oct-Feb' },
    { id: 'festive', label: 'Festive', emoji: '🎉', desc: 'Diwali/Eid' },
    { id: 'college', label: 'College', emoji: '🎓', desc: 'Campus Wear' },
  ];

  return (
    <div className="mt-4">

      {/* Hero */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 mb-4 border ${isDark ? 'bg-purple-500/20 border-purple-500/30' : 'bg-purple-50 border-purple-200 shadow-sm'}`}>
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
          <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>AI-Powered • 95%+ Accuracy</span>
        </div>
        <h2 className={`text-3xl md:text-5xl font-black mb-3 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Discover Your
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"> Perfect </span>
          Style
        </h2>
        <p className={`text-lg max-w-xl mx-auto ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
          Upload a selfie — get personalized fashion recommendations based on your skin tone
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center mb-6">
        <div className={`rounded-2xl p-1.5 flex gap-1 border ${isDark ? 'bg-white/10 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
          <button
            onClick={() => setMode('normal')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              mode === 'normal'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>👔</span> Normal
          </button>
          <button
            onClick={() => setMode('seasonal')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              mode === 'seasonal'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>🌍</span> Seasonal
          </button>
        </div>
      </div>

      {/* Normal Mode — Gender Toggle */}
      {mode === 'normal' && (
        <div className="flex justify-center mb-6">
          <div className={`rounded-2xl p-1.5 flex gap-1 border ${isDark ? 'bg-white/10 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
            <button
              onClick={() => handleGenderChange('male')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                gender === 'male'
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30'
                  : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>👨</span> Male
            </button>
            <button
              onClick={() => handleGenderChange('female')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                gender === 'female'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30'
                  : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span>👩</span> Female
            </button>
          </div>
        </div>
      )}

      {/* Seasonal Mode — Season Selector */}
      {mode === 'seasonal' && (
        <div className="mb-6">
          {/* Gender toggle for seasonal */}
          <div className="flex justify-center mb-4">
            <div className={`rounded-2xl p-1.5 flex gap-1 border ${isDark ? 'bg-white/10 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
              <button
                onClick={() => handleGenderChange('male')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                  gender === 'male'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30'
                    : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>👨</span> Male
              </button>
              <button
                onClick={() => handleGenderChange('female')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                  gender === 'female'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30'
                    : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span>👩</span> Female
              </button>
            </div>
          </div>
          <p className={`text-sm text-center mb-3 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Choose a season:</p>
          <div className="flex justify-center gap-3 flex-wrap">
            {seasons.map((s) => (
              <button
                key={s.id}
                onClick={() => setSeason(s.id)}
                className={`flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border font-medium text-sm transition-all duration-300 hover:scale-105 ${
                  season === s.id
                    ? 'bg-amber-500/30 border-amber-500/50 text-amber-600 shadow-lg shadow-amber-500/20'
                    : isDark
                      ? 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                      : 'bg-white border-purple-100 text-purple-400 hover:text-purple-700 hover:border-purple-300 shadow-sm'
                }`}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="font-bold">{s.label}</span>
                <span className="text-xs opacity-70">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode Info */}
      <div className="text-center mb-6 text-sm font-medium">
        {mode === 'seasonal' ? (
          <span className={isDark ? 'text-amber-300' : 'text-amber-600'}>
            {seasons.find(s => s.id === season)?.emoji} {gender === 'female' ? '👩 Female' : '👨 Male'} — Special recommendations for {seasons.find(s => s.id === season)?.label}!
          </span>
        ) : gender === 'female' ? (
          <span className={isDark ? 'text-pink-300' : 'text-pink-600'}>👗 Female mode: Dress, Saree, Suit & Makeup suggestions included!</span>
        ) : (
          <span className={isDark ? 'text-blue-300' : 'text-blue-600'}>👔 Male mode: Shirt, Pant & Ethnic wear suggestions included!</span>
        )}
      </div>

      {/* Upload Box */}
      <div
        className={`relative border-2 border-dashed rounded-3xl p-6 md:p-12 text-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? 'border-purple-400 bg-purple-500/10 scale-[1.01]'
            : mode === 'seasonal'
              ? isDark ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-400/50 hover:bg-amber-500/10' : 'border-amber-300 bg-amber-50 hover:border-amber-400 hover:bg-amber-100'
              : gender === 'female'
                ? isDark ? 'border-pink-500/30 bg-pink-500/5 hover:border-pink-400/50 hover:bg-pink-500/10' : 'border-pink-300 bg-pink-50 hover:border-pink-400 hover:bg-pink-100'
                : isDark ? 'border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10' : 'border-purple-200 bg-white/80 hover:border-purple-400 hover:bg-purple-50/50 shadow-sm shadow-purple-100/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />

        {preview ? (
          <div className="flex flex-col items-center">
            <img src={preview} alt="Preview" className="w-40 h-40 object-cover rounded-2xl shadow-2xl mb-4 border-2 border-purple-500/30" />
            <p className={`animate-pulse ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Analyzing your photo...</p>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className={`mt-3 w-48 rounded-full h-1.5 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 border ${
              mode === 'seasonal'
                ? isDark ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-white/10' : 'bg-amber-100 border-amber-200'
                : gender === 'female'
                  ? isDark ? 'bg-gradient-to-br from-pink-500/20 to-rose-500/20 border-white/10' : 'bg-pink-100 border-pink-200'
                  : isDark ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-white/10' : 'bg-purple-100 border-purple-200'
            }`}>
              <span className="text-4xl">
                {mode === 'seasonal' ? seasons.find(s => s.id === season)?.emoji : gender === 'female' ? '👩' : '🤳'}
              </span>
            </div>
            <p className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Drop Your Selfie Here</p>
            <p className={`mb-6 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>or click to browse</p>
            <span className={`inline-block px-8 py-3.5 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-105 ${
              mode === 'seasonal'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30'
                : gender === 'female'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/30'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/30'
            }`}>
              📁 Choose Photo
            </span>
            <p className={`text-xs mt-4 ${isDark ? 'text-white/25' : 'text-gray-400'}`}>JPG, PNG, WebP • Max 10MB • Photos are never stored</p>
          </>
        )}
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[
          { emoji: '☀️', title: 'Natural Light', desc: 'Take selfie near a window — best results' },
          { emoji: '🤳', title: 'Face Forward', desc: 'Look directly at the camera' },
          { emoji: '😊', title: 'Clear Face', desc: 'Remove sunglasses or mask' },
        ].map((tip, i) => (
          <div key={i} className={`rounded-2xl p-4 flex items-center gap-3 transition border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white/80 border-purple-100 hover:border-purple-300 shadow-sm shadow-purple-50'}`}>
            <span className="text-2xl">{tip.emoji}</span>
            <div>
              <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{tip.title}</p>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Skin Tones */}
      <div className={`mt-6 rounded-2xl p-5 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-purple-100 shadow-sm shadow-purple-50'}`}>
        <p className={`text-xs text-center mb-3 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>We support all skin tones 🌍</p>
        <div className="flex justify-center gap-3 flex-wrap">
          {[
            { name: 'Fair', color: '#F5DEB3' },
            { name: 'Light', color: '#D2A679' },
            { name: 'Medium', color: '#C68642' },
            { name: 'Olive', color: '#A0724A' },
            { name: 'Brown', color: '#7B4F2E' },
            { name: 'Dark', color: '#4A2C0A' },
          ].map((tone) => (
            <div key={tone.name} className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg" style={{ backgroundColor: tone.color }}></div>
              <span className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{tone.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UploadSection;