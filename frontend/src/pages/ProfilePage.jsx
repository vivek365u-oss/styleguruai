import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import ProfilePanel from '../components/ProfilePanel';
import { auth } from '../api/styleApi';

function ProfilePage() {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-50 backdrop-blur-xl border-b ${isDark ? 'bg-black/20 border-white/10' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <span className="text-xl">←</span>
          </button>
          <h1 className="text-lg font-black uppercase tracking-widest">Profile</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-xl mx-auto px-6 pt-8 pb-10">
        <ProfilePanel />
      </div>
    </div>
  );
}

export default ProfilePage;
