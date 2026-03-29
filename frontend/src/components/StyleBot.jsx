// ============================================================
// StyleGuru — Style Bot (Rule-based Fashion Chatbot)
// Floating chat button with conversational styling advice
// ============================================================
import { useState, useRef, useEffect, useContext } from 'react';
import { ThemeContext } from '../App';

const RESPONSES = {
  greeting: {
    patterns: ['hi', 'hello', 'hey', 'namaste', 'hlo'],
    reply: 'Hey! 👋 I\'m your StyleGuru AI assistant. Ask me about colors, outfits, or styling tips! What do you need help with?',
  },
  wedding: {
    patterns: ['wedding', 'shaadi', 'shadi', 'marriage', 'bridal'],
    reply: '💍 For a wedding:\n\n👨 Men: Go for a sherwani in gold, maroon, or royal blue. Pair with mojari shoes and a brooch.\n\n👩 Women: A silk saree in jewel tones (emerald, ruby red, royal purple) with gold jewellery is classic.\n\n💡 Tip: Match your outfit to the wedding\'s color theme for photos!',
  },
  office: {
    patterns: ['office', 'work', 'formal', 'professional', 'interview'],
    reply: '💼 Office Style Guide:\n\n👨 Men: Solid color shirt (navy, white, light blue) + dark trousers. Avoid loud patterns.\n\n👩 Women: A well-fitted kurti with straight pants, or a blazer with trousers.\n\n💡 Tip: Your skin tone\'s neutral colors work best for formal settings!',
  },
  date: {
    patterns: ['date', 'romantic', 'dinner', 'impress', 'girlfriend', 'boyfriend'],
    reply: '❤️ Date Night Tips:\n\n👨 Men: Dark jeans + solid polo or henley in your best color. Brown loafers.\n\n👩 Women: A dress or coord set in your power color. Minimal jewelry.\n\n💡 Tip: Wear the color that scores highest in your Virtual Try-On!',
  },
  party: {
    patterns: ['party', 'club', 'night out', 'celebration', 'birthday'],
    reply: '🎉 Party Outfit:\n\n👨 Men: Black jeans + bold colored shirt or oversized graphic tee. Chunky sneakers.\n\n👩 Women: Statement dress or coord set. Bold lipstick + statement earrings.\n\n💡 Tip: This is when you go BOLD with your best colors!',
  },
  casual: {
    patterns: ['casual', 'daily', 'everyday', 'relax', 'weekend', 'college'],
    reply: '😎 Casual Style:\n\nKeep it simple but intentional:\n- Oversized tee + joggers/jeans\n- Your best color polo + chinos\n- Coord set for an effortless put-together look\n\n💡 Tip: Even casual outfits look 10x better in your skin tone\'s colors!',
  },
  summer: {
    patterns: ['summer', 'hot', 'garmi', 'heat'],
    reply: '☀️ Summer Dressing:\n\n- Light cotton & linen fabrics\n- Pastel and light colors reflect heat\n- Avoid dark colors (absorb heat)\n- Loose fits for air circulation\n\n💡 Best summer colors for most Indian skin tones: sky blue, mint, peach, white!',
  },
  winter: {
    patterns: ['winter', 'cold', 'sardi', 'sweater'],
    reply: '❄️ Winter Style:\n\n- Layer up: tee → hoodie → jacket\n- Dark colors absorb warmth (navy, burgundy, forest green)\n- Accessorize: muffler, beanie, gloves\n- Invest in a good quality jacket\n\n💡 Rich jewel tones look amazing in winter light!',
  },
  monsoon: {
    patterns: ['rain', 'monsoon', 'barish', 'rainy'],
    reply: '🌧️ Monsoon Style:\n\n- Quick-dry fabrics (avoid cotton — takes forever to dry)\n- Dark colors hide splash marks\n- Waterproof footwear\n- Carry a compact umbrella\n\n💡 Navy, charcoal, and dark green are best for rainy days!',
  },
  skinTone: {
    patterns: ['skin tone', 'skintone', 'my color', 'which color', 'what color', 'colour'],
    reply: '🎨 To find your best colors:\n\n1. Upload a selfie on the Analyze page\n2. AI detects your exact skin tone, undertone, and season\n3. Get 10+ personalized colors + outfits!\n\n💡 Tap the "Analyze" tab to start — it takes just 10 seconds!',
  },
  hair: {
    patterns: ['hair', 'hair color', 'baal', 'highlights'],
    reply: '💇 Hair Color Tips by Skin Tone:\n\n🟡 Warm undertone: Caramel, honey, copper highlights\n🔵 Cool undertone: Ash brown, burgundy, plum\n🟢 Neutral: You can pull off almost anything!\n\n💡 Indian skin tones look amazing with subtle highlights over full color!',
  },
  accessories: {
    patterns: ['accessories', 'jewellery', 'jewelry', 'watch', 'sunglasses'],
    reply: '✨ Accessory Guide:\n\n🟡 Warm skin: Gold jewelry, brown leather, amber sunglasses\n🔵 Cool skin: Silver jewelry, black leather, grey sunglasses\n🟠 Medium/olive: Both gold and silver work!\n\n💡 Rule of thumb: Warm undertone = gold, Cool undertone = silver!',
  },
  budget: {
    patterns: ['budget', 'cheap', 'affordable', 'sasta', 'price', 'under 500', 'under 1000'],
    reply: '💰 Budget Shopping Tips:\n\n- Meesho: Best for under ₹500 finds\n- Amazon: Good deals with ₹500-1000 range\n- Myntra: Sales have great steals\n- Flipkart: Budget + quality combo\n\n💡 Use the budget filter in your results — tap ₹500/₹1000/₹2000!',
  },
  thanks: {
    patterns: ['thanks', 'thank', 'dhanyawad', 'shukriya', 'nice', 'great', 'awesome'],
    reply: '🙏 You\'re welcome! Happy to help with your style journey.\n\nRemember: Confidence is the best accessory! 💪\n\nAnything else you want to know?',
  },
  help: {
    patterns: ['help', 'what can you', 'features', 'kya kar sakte', 'options'],
    reply: '🤖 I can help with:\n\n👔 Outfit suggestions for any occasion\n🎨 Color advice based on your skin tone\n💇 Hair color recommendations\n✨ Accessory matching tips\n☀️ Season-specific styling\n💰 Budget-friendly shopping\n📷 How to use the color scanner\n\nJust type your question!',
  },
};

const DEFAULT_REPLY = '🤔 I\'m not sure about that one! Try asking about:\n\n- Wedding outfits\n- Office style\n- Date night looks\n- Best colors for you\n- Accessories\n- Budget shopping\n\nOr type "help" to see all options!';

function findResponse(message) {
  const lower = message.toLowerCase().trim();
  for (const [, data] of Object.entries(RESPONSES)) {
    if (data.patterns.some(p => lower.includes(p))) return data.reply;
  }
  return DEFAULT_REPLY;
}

function StyleBot() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hey! 👋 I\'m your StyleGuru assistant.\n\nAsk me about outfits, colors, accessories, or type "help" to see what I can do!' }
  ]);
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
    }, 400 + Math.random() * 600);
  };

  const handleKey = (e) => { if (e.key === 'Enter') sendMessage(); };

  const quickActions = ['💍 Wedding', '💼 Office', '❤️ Date', '💇 Hair Color', '💰 Budget'];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-24 right-4 z-40 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
          open
            ? 'bg-gray-700 rotate-0'
            : 'bg-gradient-to-br from-purple-600 to-pink-600 animate-pulse'
        }`}
        style={{ boxShadow: open ? 'none' : '0 0 25px rgba(168,85,247,0.4)' }}
      >
        <span className="text-2xl">{open ? '✕' : '🤖'}</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div className={`fixed bottom-40 right-4 z-40 w-[320px] max-h-[60vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
          isDark ? 'bg-[#0f0a2e] border-purple-700/40' : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <p className="text-white text-sm font-bold">StyleGuru Bot</p>
              <p className="text-white/60 text-[10px]">Your AI fashion assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[300px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
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
                className={`flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-bold border transition-all ${
                  isDark ? 'bg-white/5 border-white/10 text-white/50 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-800'
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
              placeholder="Type your style question..."
              className={`flex-1 px-3 py-2 rounded-xl text-xs border ${
                isDark ? 'bg-white/5 border-white/10 text-white placeholder-white/30' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'
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
