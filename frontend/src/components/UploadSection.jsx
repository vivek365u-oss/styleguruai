import { useState, useRef } from 'react';
import { analyzeImage } from '../api/styleApi';

function UploadSection({ onLoadingStart, onAnalysisComplete, onError, onImageSelected }) {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      onError('Sirf JPG, PNG, ya WebP image upload karo.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      onError('Image bahut badi hai. Maximum 10MB upload karo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      onImageSelected(e.target.result);
    };
    reader.readAsDataURL(file);

    onLoadingStart();
    try {
      const res = await analyzeImage(file, setUploadProgress);
      onAnalysisComplete(res.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'object') {
        onError(detail.message || 'Analysis fail hui.');
      } else {
        onError(detail || 'Server se connect nahi ho pa raha. Backend chal raha hai?');
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="mt-4">

      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-4">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
          <span className="text-purple-300 text-sm font-medium">AI-Powered • 95%+ Accuracy</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
          Apna Perfect
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Style </span>
          Discover Karo
        </h2>
        <p className="text-white/50 text-lg max-w-xl mx-auto">
          Ek selfie upload karo — hum tumhare skin tone ke hisaab se best colors aur outfits suggest karenge
        </p>
      </div>

      {/* Upload Box */}
      <div
        className={`relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? 'border-purple-400 bg-purple-500/10 scale-[1.01]'
            : 'border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10'
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
            <img src={preview} alt="Preview" className="w-40 h-40 object-cover rounded-2xl shadow-2xl shadow-purple-500/20 mb-4 border-2 border-purple-500/30" />
            <p className="text-purple-300 animate-pulse">Analyzing tumhari photo...</p>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-3 w-48 bg-white/10 rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
              <span className="text-4xl">📸</span>
            </div>
            <p className="text-white text-xl font-bold mb-2">Selfie Drop Karo Yahan</p>
            <p className="text-white/40 mb-6">ya click karke browse karo</p>
            <span className="inline-block px-8 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all">
              📁 Photo Choose Karo
            </span>
            <p className="text-white/25 text-xs mt-4">JPG, PNG, WebP • Max 10MB • Photo store nahi hoti</p>
          </>
        )}
      </div>

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[
          { emoji: '☀️', title: 'Natural Light', desc: 'Window ke paas selfie lo — best results', color: 'yellow' },
          { emoji: '🤳', title: 'Seedha Dekho', desc: 'Camera ko directly face karo', color: 'blue' },
          { emoji: '😊', title: 'Chehra Clear Ho', desc: 'Sunglasses ya mask mat pehno', color: 'green' },
        ].map((tip, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-white/10 transition">
            <span className="text-2xl">{tip.emoji}</span>
            <div>
              <p className="text-white font-semibold text-sm">{tip.title}</p>
              <p className="text-white/40 text-xs">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sample skin tones */}
      <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-5">
        <p className="text-white/50 text-xs text-center mb-3">Hum in sabhi skin tones ke liye kaam karte hain 🇮🇳</p>
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
              <span className="text-white/40 text-xs">{tone.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default UploadSection;