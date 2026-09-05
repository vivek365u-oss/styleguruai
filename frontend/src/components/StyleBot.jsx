// StyleGuruAI — Style Bot (Rule-based Fashion Chatbot)
// Floating chat button with conversational styling advice
// Updated: 2026-04-09 (Expert Edition v1.1)
// ============================================================
import { useState, useRef, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  auth, 
  loadPrimaryProfile, 
  getWardrobe, 
  loadStyleInsights 
} from '../api/styleApi';
import { FashionIcons, IconRenderer } from './Icons';

const getResponses = (t, profile, wardrobe, insights) => {
  const isMale = (profile?.gender_mode || profile?.gender || 'female').toLowerCase().includes('male');
  const itemsCount = wardrobe?.length || 0;
  const skinTone = profile?.skin_tone || profile?.skinTone || 'Discovering...';
  const celebrity = insights?.celebrity_match || 'a fashion icon';

  return {
    greeting: {
      patterns: ['hi', 'hello', 'hey', 'namaste', 'hlo', 'नमस्ते'],
      reply: t('botReplyGreeting'),
    },
    calendar: {
      patterns: ['calendar', 'schedule', 'planning', 'daily drop', 'weather', 'कैलेंडर'],
      reply: t('botReplyCalendarExpert'),
    },
    dna: {
      patterns: ['dna', 'skin', 'permanent', 'gender', 'setting', 'lock', 'डीएनए'],
      reply: t('botReplyDNAExpert') + `\n\n💡 *As your stylist:* I see your DNA is locked as ${isMale ? 'Male' : 'Female'} with a ${skinTone} tone. I've tuned the entire app to match this fingerprint!`,
    },
    wardrobe: {
      patterns: ['wardrobe', 'closet', 'sync', 'harmony', 'synergy', 'owned', 'अलमारी'],
      reply: t('botReplyWardrobeExpert') + `\n\n💡 *Stylist Note:* You currently have ${itemsCount} items synced. Let's aim for 15+ to reach perfect Harmony!`,
    },
    scanner: {
      patterns: ['scanner', 'camera', 'point', 'shop', 'fabric', 'स्कैनर'],
      reply: t('botReplyScannerExpert'),
    },
    checker: {
      patterns: ['checker', 'score', 'match', 'compatibility', 'चेकर'],
      reply: t('botReplyCheckerExpert'),
    },
    navigator: {
      patterns: ['navigator', 'daily', 'shop', 'gaps', 'dashboard', 'नेविगेटर'],
      reply: t('botReplyNavigatorExpert'),
    },
    wedding: {
      patterns: ['wedding', 'shaadi', 'shadi', 'marriage', 'bridal', 'शादी'],
      reply: t('botReplyWedding') + `\n\n🌟 Since you match with ${celebrity}, aim for the same high-contrast jewel tones they wear!`,
    },
    office: {
      patterns: ['office', 'work', 'formal', 'professional', 'interview', 'ऑफिस'],
      reply: t('botReplyOffice'),
    },
    date: {
      patterns: ['date', 'romantic', 'dinner', 'impress', 'gf', 'dating', 'biet', 'डेट'],
      reply: t('botReplyDate'),
    },
    party: {
      patterns: ['party', 'club', 'night out', 'celebration', 'birthday', 'पार्टी'],
      reply: t('botReplyParty'),
    },
    casual: {
      patterns: ['casual', 'daily', 'everyday', 'relax', 'weekend', 'college', 'कैजुअल'],
      reply: t('botReplyCasual'),
    },
    skinTone: {
      patterns: ['skin tone', 'undertone', 'skin color', 'who match', 'त्वचा', 'रंग'],
      reply: t('botReplySkinTone') + `\n\n💡 *Did you know?* You share a style DNA with ${celebrity}!`,
    },
    thanks: {
      patterns: ['thanks', 'thank', 'dhanyawad', 'shukriya', 'nice', 'great', 'awesome', 'धन्यवाद'],
      reply: t('botReplyThanks'),
    },
    help: {
      patterns: ['help', 'what can you', 'features', 'kya kar sakte', 'options', 'मदद'],
      reply: t('botHelp'),
    },
  };
};

function StyleBot({ inline = false }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(inline);
  const [messages, setMessages] = useState([
    { role: 'bot', text: t('botInitial') }
  ]);
  const [profile, setProfile] = useState(null);
  const [wardrobe, setWardrobe] = useState([]);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    const fetchContext = async () => {
      if (!auth.currentUser) return;
      try {
        const uid = auth.currentUser.uid;
        const [p, w, i] = await Promise.all([
          loadPrimaryProfile(uid),
          getWardrobe(uid),
          loadStyleInsights(uid)
        ]);
        setProfile(p);
        setWardrobe(w);
        setInsights(i);
      } catch (err) {
        console.warn('[StyleBot] Context fetch failed', err);
      }
    };
    fetchContext();
  }, []);

  const RESPONSES = getResponses(t, profile, wardrobe, insights);

  const findResponse = (message) => {
    const lower = message.toLowerCase().trim();
    
    // HUMAN-PERSONA: Initial stylistic touches
    const stylistPhrases = [
      "As your personal stylist, here is my take:",
      "I've analyzed your style DNA. You'll love this:",
      "Great question! Here's the professional advice:",
      "Based on ToneFit's expert logic:"
    ];
    const prefix = stylistPhrases[Math.floor(Math.random() * stylistPhrases.length)];

    for (const [key, data] of Object.entries(RESPONSES)) {
      if (data.patterns.some(p => lower.includes(p))) {
        if (['greeting', 'thanks', 'help'].includes(key)) return data.reply;
        return `${prefix}\n\n${data.reply}`;
      }
    }
    return t('botDefault');
  };
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

    // Simulate typing
    setTimeout(() => {
      const reply = findResponse(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
    }, 600);
  };

  const handleKey = (e) => { if (e.key === 'Enter') sendMessage(); };

  const quickActions = [
    { label: 'Style DNA', icon: FashionIcons.Analysis },
    { label: 'Calendar', icon: FashionIcons.Accuracy },
    { label: 'Wardrobe', icon: FashionIcons.Wardrobe },
    { label: 'Checker', icon: FashionIcons.Analysis },
    { label: 'Scanner', icon: FashionIcons.Camera },
    { label: 'Wedding', icon: FashionIcons.Dress }
  ];

  return (
    <>
      {/* Floating button (only if not inline & not open) */}
      {!inline && !open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Style Guru Assistant"
          className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
            isDark 
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border border-white/10 shadow-violet-900/30' 
              : 'bg-slate-900 text-white shadow-slate-900/20 border border-slate-800'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <IconRenderer icon={FashionIcons.AI} />
          </div>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
        </button>
      )}

      {/* Chat panel */}
      {(open || inline) && (
        <div className={
          inline
            ? `flex-1 flex flex-col w-full h-full ${isDark ? 'bg-transparent' : 'bg-transparent'}`
            : `fixed bottom-20 sm:bottom-20 right-3 sm:right-6 z-50 w-[calc(100%-1.5rem)] sm:w-[350px] max-h-[72vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl ${
                isDark 
                  ? 'bg-[#111827]/95 border-white/10 text-slate-100 shadow-black/60' 
                  : 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-400/20'
              }`
        }>
          {/* Header */}
          <div className={`px-4 py-3 border-b flex items-center justify-between ${
            isDark ? 'bg-slate-900/80 border-white/10' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <span className="w-4 h-4"><IconRenderer icon={FashionIcons.AI} /></span>
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">{t('botTitle')}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{t('botSub')}</p>
              </div>
            </div>
            {!inline && (
              <button 
                onClick={() => setOpen(false)} 
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-xs font-bold"
              >✕</button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[300px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-br-xs font-medium'
                    : isDark 
                      ? 'bg-slate-800 text-slate-200 border border-white/5 rounded-bl-xs' 
                      : 'bg-slate-100 text-slate-800 border border-slate-200/60 rounded-bl-xs'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {quickActions.map(qa => (
              <button
                key={qa.label}
                onClick={() => { setInput(qa.label); setTimeout(sendMessage, 100); }}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all flex items-center gap-1.5 ${
                  isDark 
                    ? 'bg-slate-800/80 border-white/10 text-slate-300 hover:text-white hover:bg-slate-700' 
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <span className="w-3 h-3"><IconRenderer icon={qa.icon} /></span>
                {qa.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className={`p-2.5 flex gap-2 border-t ${isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t('botPlaceholder')}
              className={`flex-1 px-3 py-2 rounded-xl text-xs border outline-hidden transition-all ${
                isDark 
                  ? 'bg-slate-800 border-white/10 text-white placeholder-slate-400 focus:border-violet-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-violet-500'
              }`}
            />
            <button 
              onClick={sendMessage}
              className="px-3.5 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-500 active:scale-95 transition-all shadow-xs"
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default StyleBot;
