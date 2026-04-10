import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { FashionIcons, IconRenderer } from './Icons';

const GURU_PICKS = [
    {
        id: 'gp1',
        title: 'Midnight Silk Sherwani',
        description: 'Perfect for a winter evening wedding. Pair with silver mojris.',
        image: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?q=80&w=300&h=400&auto=format&fit=crop',
        price: '₹12,499',
        link: 'https://www.myntra.com/sherwani'
    },
    {
        id: 'gp2',
        title: 'Pastel Mint Bandhgala',
        description: 'Elite daytime sangeet look. Modern cut with traditional soul.',
        image: 'https://images.unsplash.com/photo-1617130863731-50e58d92825c?q=80&w=300&h=400&auto=format&fit=crop',
        price: '₹8,999',
        link: 'https://www.myntra.com/bandhgala'
    },
    {
        id: 'gp3',
        title: 'Ruby Embroidered Saree',
        description: 'Karan\'s pick for bridesmaids who want to stand out.',
        image: 'https://images.unsplash.com/photo-1610030469609-08b233a1168f?q=80&w=300&h=400&auto=format&fit=crop',
        price: '₹14,200',
        link: 'https://www.myntra.com/saree'
    }
];

const GuruCollab = () => {
    const { theme } = useContext(ThemeContext);
    const { t } = useLanguage();
    const isDark = theme === 'dark';

    return (
        <div className="space-y-6">
            {/* Hero Card */}
            <div className={`relative overflow-hidden rounded-[2.5rem] p-8 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-xl'}`}>
                <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
                    <img src="/indian_fashion_influencer_collab_banner_1775822295934.png" alt="Collab Banner" className="w-full h-full object-cover" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isDark ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'}`}>
                            Limited Drop
                        </span>
                    </div>
                    <h2 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Karan's <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Elite Picks</span>
                    </h2>
                    <p className={`text-sm max-w-xs mb-6 font-medium ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                        Exclusive wedding curation by celebrity stylist Karan. Only for StyleGuru AI members.
                    </p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border-2 border-purple-500 overflow-hidden">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&h=100&auto=format&fit=crop" alt="Karan" />
                        </div>
                        <div>
                            <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Karan Sharma</p>
                            <p className="text-[10px] font-bold opacity-40 uppercase">Celebrity Stylist</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vertical Feed of Picks */}
            <div className="grid grid-cols-1 gap-4">
                {GURU_PICKS.map((item) => (
                    <motion.div
                        key={item.id}
                        whileHover={{ y: -5 }}
                        className={`flex gap-4 p-4 rounded-3xl border transition-all ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}
                    >
                        <div className="w-24 h-32 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                            <h4 className={`text-base font-black truncate mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                            <p className={`text-[11px] leading-relaxed mb-3 line-clamp-2 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>{item.description}</p>
                            <div className="flex items-center justify-between mt-auto">
                                <span className={`text-sm font-black ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{item.price}</span>
                                <button 
                                    onClick={() => window.open(item.link, '_blank')}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}
                                >
                                    Get It ⚡
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default GuruCollab;
