// ============================================================
// StyleGuru — Style Bot (Rule-based Fashion Chatbot)
// Floating chat button with conversational styling advice
// ============================================================
import { useState, useRef, useEffect, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

const getResponses = (t) => ({
  greeting: {
    patterns: ['hi', 'hello', 'hey', 'namaste', 'hlo', 'नमस्ते'],
    reply: t('botReplyGreeting'),
  },
  wedding: {
    patterns: ['wedding', 'shaadi', 'shadi', 'marriage', 'bridal', 'शादी'],
    reply: t('botReplyWedding'),
  },
  office: {
    patterns: ['office', 'work', 'formal', 'professional', 'interview', 'ऑफिस'],
    reply: t('botReplyOffice'),
  },
  date: {
    patterns: ['date', 'romantic', 'dinner', 'impress', 'girlfriend', 'boyfriend', 'डेट'],
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
  summer: {
    patterns: ['summer', 'hot', 'garmi', 'heat', 'गर्मी'],
    reply: t('botReplySummer'),
  },
  winter: {
    patterns: ['winter', 'cold', 'sardi', 'sweater', 'सर्दी'],
    reply: t('botReplyWinter'),
  },
  monsoon: {
    patterns: ['rain', 'monsoon', 'barish', 'rainy', 'बारिश'],
    reply: t('botReplyMonsoon'),
  },
  skinTone: {
    patterns: ['skin tone', 'skintone', 'my color', 'which color', 'what color', 'colour', 'त्वचा', 'रंग'],
    reply: t('botReplySkinTone'),
  },
  hair: {
    patterns: ['hair', 'hair color', 'baal', 'highlights', 'बाल'],
    reply: t('botReplyHair'),
  },
  accessories: {
    patterns: ['accessories', 'jewellery', 'jewelry', 'watch', 'sunglasses', 'गहने'],
    reply: t('botReplyAccessories'),
  },
  budget: {
    patterns: ['budget', 'cheap', 'affordable', 'sasta', 'price', 'under 500', 'under 1000', 'बजट'],
    reply: t('botReplyBudget'),
  },
  thanks: {
    patterns: ['thanks', 'thank', 'dhanyawad', 'shukriya', 'nice', 'great', 'awesome', 'धन्यवाद'],
    reply: t('botReplyThanks'),
  },
  help: {
    patterns: ['help', 'what can you', 'features', 'kya kar sakte', 'options', 'मदद'],
    reply: t('botHelp'),
  },
});

function StyleBot({ inline = false }) {
  const { theme } = useContext(ThemeContext);
  const { t } = useLanguage();
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(inline);
  const [messages, setMessages] = useState([
    { role: 'bot', text: t('botInitial') }
  ]);

  const RESPONSES = getResponses(t);

  const findResponse = (message) => {
    const lower = message.toLowerCase().trim();
    for (const [, data] of Object.entries(RESPONSES)) {
      if (data.patterns.some(p => lower.includes(p))) return data.reply;
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

  const quickActions = ['💍 Wedding', '💼 Office', '❤️ Date', '💇 Hair Color', '💰 Budget'];

  return (
    <>
      {/* Floating button (only if not inline) */}
      {!inline && (
        <button
          onClick={() => setOpen(!open)}
          className={`fixed bottom-24 right-4 z-40 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${open
              ? 'bg-gray-700 rotate-0'
              : 'bg-gradient-to-br from-purple-600 to-pink-600 animate-pulse'
            }`}
          style={{ boxShadow: open ? 'none' : '0 0 25px rgba(168,85,247,0.4)' }}
        >
          <span className="text-2xl">{open ? '✕' : '🤖'}</span>
        </button>
      )}

      {/* Chat panel */}
      {(open || inline) && (
        <div className={
          inline
            ? `flex-1 flex flex-col w-full h-full ${isDark ? 'bg-transparent' : 'bg-transparent'}`
            : `fixed bottom-40 right-4 z-40 w-[320px] max-h-[60vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${isDark ? 'bg-[#0f0a2e] border-purple-700/40' : 'bg-white border-gray-200'}`
        }>
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <p className="text-white text-sm font-bold">{t('botTitle')}</p>
              <p className="text-white/60 text-[10px]">{t('botSub')}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[300px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-sm'
                    : isDark ? 'bg-white/10 text-white/80 rounded-bl-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          <div className="px-3 pb-1 flex gap-1 overflow-x-auto scrollbar-hide">
            {quickActions.map(qa => (
              <button
                key={qa}
                onClick={() => { setInput(qa.split(' ').slice(1).join(' ')); setTimeout(sendMessage, 100); }}
                className={`flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-bold border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/50 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-800'
                  }`}
              >{qa}</button>
            ))}
          </div>

          {/* Input */}
          <div className={`p-2 flex gap-2 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={t('botPlaceholder')}
              className={`flex-1 px-3 py-2 rounded-xl text-xs border ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
                }`}
            />
            <button onClick={sendMessage}
              className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-all">
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default StyleBot;
