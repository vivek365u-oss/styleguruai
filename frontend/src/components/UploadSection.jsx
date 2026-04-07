import { useState, useRef, useContext } from 'react';
import { analyzeImage, analyzeImageFemale, analyzeImageSeasonal } from '../api/styleApi';
import { ThemeContext } from '../context/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { LoadingScreenWithProgress } from './LoadingScreenWithProgress';
import { useAnalysisProgress } from '../hooks/useAnalysisProgress';

// ── Skin Tone Quiz ────────────────────────────────────────────
function SkinToneQuiz({ isDark, onResult, gender }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    {
      q: 'What is your skin tone?',
      key: 'tone',
      options: [
        { label: 'Fair / Very Light', value: 'fair', color: '#F5DEB3' },
        { label: 'Light', value: 'light', color: '#D2A679' },
        { label: 'Medium / Wheatish', value: 'medium', color: '#C68642' },
        { label: 'Olive / Dusky', value: 'olive', color: '#A0724A' },
        { label: 'Brown / Dark Brown', value: 'brown', color: '#7B4F2E' },
        { label: 'Very Dark', value: 'dark', color: '#4A2C0A' },
      ]
    },
    {
      q: 'What is your undertone?',
      key: 'undertone',
      options: [
        { label: '🌞 Warm (yellowish/golden veins)', value: 'warm' },
        { label: '❄️ Cool (bluish/purple veins)', value: 'cool' },
        { label: '⚖️ Neutral (mix of both)', value: 'neutral' },
      ]
    },
    {
      q: 'What is your body type?',
      key: 'bodyType',
      options: [
        { label: '🏃 Slim / Lean', value: 'slim' },
        { label: '💪 Athletic / Muscular', value: 'athletic' },
        { label: '⚖️ Average / Regular', value: 'average' },
        { label: '🌸 Plus Size / Curvy', value: 'plus' },
      ]
    },
    {
      q: 'What is your eye color?',
      key: 'eyeColor',
      options: [
        { label: '🟤 Brown / Dark Brown', value: 'brown' },
        { label: '⚫ Black / Very Dark', value: 'black' },
        { label: '🟢 Hazel / Green', value: 'hazel' },
        { label: '🔵 Blue / Grey', value: 'blue' },
      ]
    },
  ];

  // Static recommendation map
  const RECS = {
    fair:   { warm: { summary: 'Your fair warm skin glows in coral, peach, warm beige, and camel tones.', best_shirt_colors: [{name:'Coral',hex:'#FF7F50',reason:'Adds warmth'},{name:'Peach',hex:'#FFCBA4',reason:'Soft and flattering'},{name:'Warm Beige',hex:'#F5DEB3',reason:'Natural match'}], best_pant_colors: [{name:'Camel',hex:'#C19A6B',reason:'Earthy warmth'},{name:'Olive',hex:'#808000',reason:'Contrast'}], colors_to_avoid: [{name:'Neon Yellow',hex:'#FFFF00',reason:'Washes out'}], style_tips: ['Wear warm neutrals near your face','Avoid stark white — try off-white instead'], outfit_combinations: [{shirt:'Coral tee',pant:'Camel chinos',shoes:'White sneakers',occasion:'Casual'}], occasion_advice: {Office:'Warm beige shirt + navy pants',Casual:'Peach tee + white jeans'}, ethnic_wear: ['Ivory kurta with gold embroidery suits you perfectly'] },
           cool: { summary: 'Your fair cool skin shines in lavender, navy, rose pink, and icy blues.', best_shirt_colors: [{name:'Lavender',hex:'#E6E6FA',reason:'Cool tone match'},{name:'Navy Blue',hex:'#000080',reason:'Classic contrast'},{name:'Rose Pink',hex:'#FF007F',reason:'Vibrant pop'}], best_pant_colors: [{name:'Charcoal',hex:'#36454F',reason:'Cool neutral'},{name:'Navy',hex:'#000080',reason:'Timeless'}], colors_to_avoid: [{name:'Orange',hex:'#FFA500',reason:'Clashes with cool tone'}], style_tips: ['Blues and purples are your power colors','Silver jewellery over gold'], outfit_combinations: [{shirt:'Lavender shirt',pant:'Charcoal pants',shoes:'White sneakers',occasion:'Smart Casual'}], occasion_advice: {Office:'Navy shirt + grey pants',Casual:'Lavender tee + white jeans'}, ethnic_wear: ['Pastel blue or lilac kurta with silver work'] },
           neutral: { summary: 'Your fair neutral skin is versatile — both warm and cool tones work beautifully.', best_shirt_colors: [{name:'Dusty Rose',hex:'#DCAE96',reason:'Universally flattering'},{name:'Sage Green',hex:'#B2AC88',reason:'Soft and fresh'},{name:'Sky Blue',hex:'#87CEEB',reason:'Crisp and clean'}], best_pant_colors: [{name:'Beige',hex:'#F5F5DC',reason:'Neutral base'},{name:'Light Grey',hex:'#D3D3D3',reason:'Versatile'}], colors_to_avoid: [{name:'Muddy Brown',hex:'#8B4513',reason:'Dulls complexion'}], style_tips: ['You can wear almost any color','Experiment with both warm and cool palettes'], outfit_combinations: [{shirt:'Sage green tee',pant:'Beige chinos',shoes:'White sneakers',occasion:'Casual'}], occasion_advice: {Office:'Dusty rose shirt + grey pants',Casual:'Sky blue tee + white jeans'}, ethnic_wear: ['Mint or dusty rose kurta works beautifully'] } },
    light:  { warm: { summary: 'Your light warm skin looks stunning in terracotta, mustard, warm orange, and earthy tones.', best_shirt_colors: [{name:'Terracotta',hex:'#E2725B',reason:'Earthy warmth'},{name:'Mustard',hex:'#FFDB58',reason:'Warm glow'},{name:'Burnt Orange',hex:'#CC5500',reason:'Bold contrast'}], best_pant_colors: [{name:'Khaki',hex:'#C3B091',reason:'Earthy base'},{name:'Dark Brown',hex:'#654321',reason:'Rich contrast'}], colors_to_avoid: [{name:'Pale Yellow',hex:'#FFFFE0',reason:'Too close to skin'}], style_tips: ['Earth tones are your best friends','Try rust and terracotta for festive looks'], outfit_combinations: [{shirt:'Mustard polo',pant:'Khaki chinos',shoes:'Brown loafers',occasion:'Smart Casual'}], occasion_advice: {Office:'Terracotta shirt + dark pants',Casual:'Mustard tee + jeans'}, ethnic_wear: ['Rust or mustard kurta with copper accessories'] },
           cool: { summary: 'Your light cool skin glows in teal, cobalt blue, emerald, and berry tones.', best_shirt_colors: [{name:'Teal',hex:'#008080',reason:'Cool complement'},{name:'Cobalt Blue',hex:'#0047AB',reason:'Striking contrast'},{name:'Berry',hex:'#8E4585',reason:'Rich depth'}], best_pant_colors: [{name:'Navy',hex:'#000080',reason:'Classic'},{name:'Charcoal',hex:'#36454F',reason:'Sophisticated'}], colors_to_avoid: [{name:'Warm Orange',hex:'#FF8C00',reason:'Clashes with cool tone'}], style_tips: ['Jewel tones make you pop','Blue is your signature color'], outfit_combinations: [{shirt:'Teal shirt',pant:'Navy pants',shoes:'White sneakers',occasion:'Smart Casual'}], occasion_advice: {Office:'Cobalt blue shirt + charcoal pants',Casual:'Teal tee + dark jeans'}, ethnic_wear: ['Deep teal or cobalt kurta with silver work'] },
           neutral: { summary: 'Your light neutral skin suits a wide range — from warm earth tones to cool jewel tones.', best_shirt_colors: [{name:'Olive Green',hex:'#808000',reason:'Versatile earth tone'},{name:'Dusty Blue',hex:'#6699CC',reason:'Soft cool tone'},{name:'Warm Taupe',hex:'#8B7355',reason:'Neutral base'}], best_pant_colors: [{name:'Khaki',hex:'#C3B091',reason:'Earthy'},{name:'Navy',hex:'#000080',reason:'Classic'}], colors_to_avoid: [{name:'Neon Green',hex:'#39FF14',reason:'Too harsh'}], style_tips: ['Mix warm and cool tones freely','Olive and dusty blue are your power colors'], outfit_combinations: [{shirt:'Olive tee',pant:'Khaki pants',shoes:'White sneakers',occasion:'Casual'}], occasion_advice: {Office:'Dusty blue shirt + navy pants',Casual:'Olive tee + khaki jeans'}, ethnic_wear: ['Olive or dusty blue kurta with gold accessories'] } },
    medium: { warm: { summary: 'Your medium warm skin radiates in rust, forest green, teal, and warm gold tones.', best_shirt_colors: [{name:'Rust',hex:'#B7410E',reason:'Earthy warmth'},{name:'Forest Green',hex:'#228B22',reason:'Rich contrast'},{name:'Warm Gold',hex:'#FFD700',reason:'Radiant glow'}], best_pant_colors: [{name:'Dark Brown',hex:'#654321',reason:'Earthy depth'},{name:'Olive',hex:'#808000',reason:'Natural match'}], colors_to_avoid: [{name:'Pale Beige',hex:'#F5F5DC',reason:'Washes out'}], style_tips: ['Earthy and jewel tones are your power palette','Gold accessories enhance your glow'], outfit_combinations: [{shirt:'Rust polo',pant:'Dark brown chinos',shoes:'Tan loafers',occasion:'Smart Casual'}], occasion_advice: {Office:'Forest green shirt + dark pants',Casual:'Rust tee + olive jeans'}, ethnic_wear: ['Rust or forest green kurta with gold embroidery'] },
           cool: { summary: 'Your medium cool skin shines in royal blue, deep purple, magenta, and cool emerald.', best_shirt_colors: [{name:'Royal Blue',hex:'#4169E1',reason:'Striking contrast'},{name:'Deep Purple',hex:'#800080',reason:'Rich depth'},{name:'Magenta',hex:'#FF00FF',reason:'Bold pop'}], best_pant_colors: [{name:'Charcoal',hex:'#36454F',reason:'Cool neutral'},{name:'Black',hex:'#000000',reason:'Classic contrast'}], colors_to_avoid: [{name:'Warm Brown',hex:'#8B4513',reason:'Clashes with cool tone'}], style_tips: ['Bold jewel tones are your signature','Silver and platinum jewellery suits you best'], outfit_combinations: [{shirt:'Royal blue shirt',pant:'Charcoal pants',shoes:'Black sneakers',occasion:'Smart Casual'}], occasion_advice: {Office:'Deep purple shirt + black pants',Casual:'Royal blue tee + dark jeans'}, ethnic_wear: ['Royal blue or deep purple kurta with silver work'] },
           neutral: { summary: 'Your medium neutral skin is incredibly versatile — most colors work beautifully.', best_shirt_colors: [{name:'Teal',hex:'#008080',reason:'Universally flattering'},{name:'Burgundy',hex:'#800020',reason:'Rich depth'},{name:'Olive',hex:'#808000',reason:'Earthy warmth'}], best_pant_colors: [{name:'Navy',hex:'#000080',reason:'Classic'},{name:'Dark Brown',hex:'#654321',reason:'Earthy'}], colors_to_avoid: [{name:'Pale Pink',hex:'#FFB6C1',reason:'Too light for your tone'}], style_tips: ['You can pull off almost any color','Teal and burgundy are your standout shades'], outfit_combinations: [{shirt:'Teal shirt',pant:'Navy pants',shoes:'White sneakers',occasion:'Smart Casual'}], occasion_advice: {Office:'Burgundy shirt + dark pants',Casual:'Teal tee + navy jeans'}, ethnic_wear: ['Teal or burgundy kurta with gold or silver accessories'] } },
    olive:  { warm: { summary: 'Your olive warm skin glows in burnt orange, deep teal, warm brown, and gold.', best_shirt_colors: [{name:'Burnt Orange',hex:'#CC5500',reason:'Earthy warmth'},{name:'Deep Teal',hex:'#003333',reason:'Rich contrast'},{name:'Warm Gold',hex:'#FFD700',reason:'Radiant'}], best_pant_colors: [{name:'Dark Brown',hex:'#654321',reason:'Natural match'},{name:'Olive',hex:'#808000',reason:'Tonal look'}], colors_to_avoid: [{name:'Pale Yellow',hex:'#FFFFE0',reason:'Washes out'}], style_tips: ['Deep earthy tones are your power palette','Gold jewellery enhances your natural glow'], outfit_combinations: [{shirt:'Burnt orange tee',pant:'Dark brown chinos',shoes:'Tan sneakers',occasion:'Casual'}], occasion_advice: {Office:'Deep teal shirt + dark pants',Casual:'Burnt orange tee + olive jeans'}, ethnic_wear: ['Burnt orange or deep teal kurta with gold work'] },
           cool: { summary: 'Your olive cool skin shines in cobalt blue, deep purple, emerald, and cool burgundy.', best_shirt_colors: [{name:'Cobalt Blue',hex:'#0047AB',reason:'Striking contrast'},{name:'Emerald',hex:'#50C878',reason:'Rich jewel tone'},{name:'Cool Burgundy',hex:'#800020',reason:'Deep sophistication'}], best_pant_colors: [{name:'Black',hex:'#000000',reason:'Classic'},{name:'Charcoal',hex:'#36454F',reason:'Cool neutral'}], colors_to_avoid: [{name:'Warm Orange',hex:'#FF8C00',reason:'Clashes'}], style_tips: ['Jewel tones make your skin radiate','Deep colors are your signature'], outfit_combinations: [{shirt:'Cobalt blue shirt',pant:'Black pants',shoes:'White sneakers',occasion:'Smart Casual'}], occasion_advice: {Office:'Emerald shirt + charcoal pants',Casual:'Cobalt tee + black jeans'}, ethnic_wear: ['Cobalt blue or emerald kurta with silver accessories'] },
           neutral: { summary: 'Your olive neutral skin suits rich, saturated colors beautifully.', best_shirt_colors: [{name:'Forest Green',hex:'#228B22',reason:'Natural harmony'},{name:'Deep Navy',hex:'#000080',reason:'Classic contrast'},{name:'Rust',hex:'#B7410E',reason:'Earthy warmth'}], best_pant_colors: [{name:'Dark Brown',hex:'#654321',reason:'Earthy'},{name:'Charcoal',hex:'#36454F',reason:'Neutral'}], colors_to_avoid: [{name:'Pale Beige',hex:'#F5F5DC',reason:'Too light'}], style_tips: ['Rich saturated colors are your best bet','Avoid very light or washed-out tones'], outfit_combinations: [{shirt:'Forest green tee',pant:'Dark brown chinos',shoes:'Tan sneakers',occasion:'Casual'}], occasion_advice: {Office:'Deep navy shirt + charcoal pants',Casual:'Forest green tee + dark jeans'}, ethnic_wear: ['Forest green or rust kurta with gold accessories'] } },
    brown:  { warm: { summary: 'Your brown warm skin radiates in cobalt blue, fuchsia, gold, and bright white.', best_shirt_colors: [{name:'Cobalt Blue',hex:'#0047AB',reason:'Stunning contrast'},{name:'Fuchsia',hex:'#FF00FF',reason:'Bold and vibrant'},{name:'Bright White',hex:'#FFFFFF',reason:'Classic contrast'}], best_pant_colors: [{name:'Black',hex:'#000000',reason:'Classic'},{name:'Deep Navy',hex:'#000080',reason:'Rich contrast'}], colors_to_avoid: [{name:'Dark Brown',hex:'#654321',reason:'Too similar to skin'}], style_tips: ['Bold bright colors make you shine','White is your most powerful neutral'], outfit_combinations: [{shirt:'Cobalt blue shirt',pant:'Black pants',shoes:'White sneakers',occasion:'Smart Casual'}], occasion_advice: {Office:'Fuchsia shirt + black pants',Casual:'Cobalt tee + dark jeans'}, ethnic_wear: ['Cobalt blue or fuchsia kurta with gold accessories'] },
           cool: { summary: 'Your brown cool skin glows in royal purple, electric blue, hot pink, and silver.', best_shirt_colors: [{name:'Royal Purple',hex:'#7851A9',reason:'Regal contrast'},{name:'Electric Blue',hex:'#7DF9FF',reason:'Vibrant pop'},{name:'Hot Pink',hex:'#FF69B4',reason:'Bold statement'}], best_pant_colors: [{name:'Black',hex:'#000000',reason:'Classic'},{name:'Charcoal',hex:'#36454F',reason:'Cool neutral'}], colors_to_avoid: [{name:'Warm Brown',hex:'#8B4513',reason:'Too similar'}], style_tips: ['Bold jewel tones are your signature','Silver jewellery over gold'], outfit_combinations: [{shirt:'Royal purple shirt',pant:'Black pants',shoes:'White sneakers',occasion:'Smart Casual'}], occasion_advice: {Office:'Electric blue shirt + charcoal pants',Casual:'Hot pink tee + black jeans'}, ethnic_wear: ['Royal purple or electric blue kurta with silver work'] },
           neutral: { summary: 'Your brown neutral skin suits both warm and cool bold colors beautifully.', best_shirt_colors: [{name:'Emerald Green',hex:'#50C878',reason:'Rich contrast'},{name:'Bright Orange',hex:'#FF4500',reason:'Warm vibrancy'},{name:'Ivory White',hex:'#FFFFF0',reason:'Clean contrast'}], best_pant_colors: [{name:'Black',hex:'#000000',reason:'Classic'},{name:'Deep Navy',hex:'#000080',reason:'Rich'}], colors_to_avoid: [{name:'Muddy Brown',hex:'#8B4513',reason:'Blends in'}], style_tips: ['Bright and bold colors celebrate your skin tone','Ivory and white are your best neutrals'], outfit_combinations: [{shirt:'Emerald green tee',pant:'Black pants',shoes:'White sneakers',occasion:'Casual'}], occasion_advice: {Office:'Ivory shirt + black pants',Casual:'Emerald tee + dark jeans'}, ethnic_wear: ['Emerald green or bright orange kurta with gold accessories'] } },
    dark:   { warm: { summary: 'Your dark warm skin is stunning in vivid orange, bright yellow, gold, and warm white.', best_shirt_colors: [{name:'Vivid Orange',hex:'#FF4500',reason:'Spectacular contrast'},{name:'Bright Yellow',hex:'#FFD700',reason:'Radiant warmth'},{name:'Warm White',hex:'#FAF0E6',reason:'Classic elegance'}], best_pant_colors: [{name:'Black',hex:'#000000',reason:'Classic'},{name:'Deep Brown',hex:'#3D1C02',reason:'Tonal depth'}], colors_to_avoid: [{name:'Very Dark Navy',hex:'#000033',reason:'Reduces visibility'}], style_tips: ['Bright and warm colors celebrate your richness','Gold jewellery is your best accessory'], outfit_combinations: [{shirt:'Vivid orange tee',pant:'Black pants',shoes:'White sneakers',occasion:'Casual'}], occasion_advice: {Office:'Warm white shirt + black pants',Casual:'Bright yellow tee + dark jeans'}, ethnic_wear: ['Gold or vivid orange kurta with heavy gold accessories'] },
           cool: { summary: 'Your dark cool skin radiates in electric blue, hot pink, bright green, and silver white.', best_shirt_colors: [{name:'Electric Blue',hex:'#7DF9FF',reason:'Stunning contrast'},{name:'Hot Pink',hex:'#FF69B4',reason:'Bold vibrancy'},{name:'Bright Green',hex:'#00FF00',reason:'Vivid pop'}], best_pant_colors: [{name:'Black',hex:'#000000',reason:'Classic'},{name:'White',hex:'#FFFFFF',reason:'Striking contrast'}], colors_to_avoid: [{name:'Very Dark Purple',hex:'#1A0033',reason:'Too dark'}], style_tips: ['Bright cool tones make you radiate','White and silver are your power neutrals'], outfit_combinations: [{shirt:'Electric blue shirt',pant:'White pants',shoes:'White sneakers',occasion:'Smart Casual'}], occasion_advice: {Office:'Hot pink shirt + black pants',Casual:'Electric blue tee + white jeans'}, ethnic_wear: ['Electric blue or hot pink kurta with silver accessories'] },
           neutral: { summary: 'Your dark neutral skin is breathtaking in any bright, saturated color.', best_shirt_colors: [{name:'Bright Red',hex:'#FF0000',reason:'Powerful contrast'},{name:'Royal Blue',hex:'#4169E1',reason:'Regal look'},{name:'Pure White',hex:'#FFFFFF',reason:'Timeless elegance'}], best_pant_colors: [{name:'Black',hex:'#000000',reason:'Classic'},{name:'White',hex:'#FFFFFF',reason:'Bold contrast'}], colors_to_avoid: [{name:'Very Dark Colors',hex:'#1A1A1A',reason:'Reduces definition'}], style_tips: ['Any bright color looks spectacular on you','White is your most powerful statement color'], outfit_combinations: [{shirt:'Bright red tee',pant:'Black pants',shoes:'White sneakers',occasion:'Casual'}], occasion_advice: {Office:'Royal blue shirt + black pants',Casual:'Pure white tee + dark jeans'}, ethnic_wear: ['Bright red or royal blue kurta with gold or silver accessories'] } },
  };

  const BODY_TYPE_TIPS = {
    slim:     ['Layering adds visual bulk — try oversized tees over shirts', 'Horizontal stripes and bold patterns work great for you', 'Baggy jeans and cargo pants suit your frame perfectly', 'Avoid very tight fitted clothes — go for relaxed fits'],
    athletic: ['V-neck tees highlight your shoulders beautifully', 'Slim-fit or straight-cut pants balance your proportions', 'Avoid overly baggy clothes — they hide your physique', 'Polo shirts and fitted tees are your best friends'],
    average:  ['You can wear almost any silhouette — experiment freely', 'Straight-cut and regular-fit clothes work best', 'Monochromatic outfits create a sleek, elongated look', 'Both oversized and fitted styles suit you well'],
    plus:     ['Dark colors and vertical patterns create a slimming effect', 'Well-fitted clothes look better than very loose or very tight', 'A-line dresses and flowy tops are universally flattering', 'High-waist bottoms define your waist beautifully'],
  };

  const handleAnswer = (key, value) => {
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);
    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      // Generate result
      const tone = newAnswers.tone || 'medium';
      const undertone = newAnswers.undertone || 'neutral';
      const bodyType = newAnswers.bodyType || 'average';
      const rec = RECS[tone]?.[undertone] || RECS[tone]?.neutral || RECS.medium.neutral;
      const bodyTips = BODY_TYPE_TIPS[bodyType] || BODY_TYPE_TIPS.average;
      const mockResult = {
        gender,
        bodyType,
        eyeColor: newAnswers.eyeColor || 'brown',
        analysis: {
          skin_color: { hex: '#C68642', rgb: { r: 198, g: 134, b: 66 } },
          skin_tone: { category: tone, undertone, color_season: undertone === 'warm' ? 'Autumn' : undertone === 'cool' ? 'Winter' : 'Spring', confidence: 'medium', description: rec.summary },
        },
        recommendations: {
          summary: rec.summary,
          best_shirt_colors: rec.best_shirt_colors,
          best_pant_colors: rec.best_pant_colors,
          colors_to_avoid: rec.colors_to_avoid,
          style_tips: [...rec.style_tips, ...bodyTips],
          outfit_combinations: rec.outfit_combinations,
          occasion_advice: rec.occasion_advice,
          ethnic_wear: rec.ethnic_wear,
          accent_colors: [],
        },
        photo_quality: { warnings: [] },
      };
      onResult(mockResult);
      setOpen(false);
    }
  };

  const handleSkip = () => {
    // Skip to next question without answering
    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      // Generate result with only answered questions
      const tone = answers.tone || 'medium';
      const undertone = answers.undertone || 'neutral';
      const bodyType = answers.bodyType || 'average';
      const rec = RECS[tone]?.[undertone] || RECS[tone]?.neutral || RECS.medium.neutral;
      const bodyTips = BODY_TYPE_TIPS[bodyType] || BODY_TYPE_TIPS.average;
      const mockResult = {
        gender,
        bodyType,
        eyeColor: answers.eyeColor || 'brown',
        analysis: {
          skin_color: { hex: '#C68642', rgb: { r: 198, g: 134, b: 66 } },
          skin_tone: { category: tone, undertone, color_season: undertone === 'warm' ? 'Autumn' : undertone === 'cool' ? 'Winter' : 'Spring', confidence: 'medium', description: rec.summary },
        },
        recommendations: {
          summary: rec.summary,
          best_shirt_colors: rec.best_shirt_colors,
          best_pant_colors: rec.best_pant_colors,
          colors_to_avoid: rec.colors_to_avoid,
          style_tips: [...rec.style_tips, ...bodyTips],
          outfit_combinations: rec.outfit_combinations,
          occasion_advice: rec.occasion_advice,
          ethnic_wear: rec.ethnic_wear,
          accent_colors: [],
        },
        photo_quality: { warnings: [] },
      };
      onResult(mockResult);
      setOpen(false);
    }
  };

  const cardCls = isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-sm';
  const headingCls = isDark ? 'text-white' : 'text-gray-800';

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border text-sm font-semibold transition-all hover:border-purple-500/50 ${isDark ? 'bg-white/5 border-white/10 text-white/60 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:text-gray-800 shadow-sm'}`}
      >
        <span>🎯</span>
        <span>No photo? Take Skin Tone Quiz</span>
      </button>
    );
  }

  const q = questions[step];
  return (
    <div className={`${cardCls} rounded-2xl p-4`}>
      <div className="flex items-center justify-between mb-4">
        <p className={`font-black text-sm ${headingCls}`}>🎯 Skin Tone Quiz</p>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={`w-6 h-1.5 rounded-full transition-all ${i <= step ? 'bg-purple-500' : isDark ? 'bg-white/20' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>
      <p className={`text-sm font-semibold mb-4 ${headingCls}`}>{q.q}</p>
      <div className="space-y-2 mb-4">
        {q.options.map((opt) => {
          const isSelected = answers[q.key] === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleAnswer(q.key, opt.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all transform hover:scale-[1.02] ${
                isSelected
                  ? isDark 
                    ? 'bg-purple-600/30 border-purple-500 shadow-lg shadow-purple-500/20' 
                    : 'bg-purple-100 border-purple-500 shadow-lg shadow-purple-500/20'
                  : isDark
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-purple-500/30'
                    : 'bg-white border-gray-200 hover:bg-purple-50 hover:border-purple-300 shadow-sm'
              }`}
            >
              {opt.color && <div className="w-8 h-8 rounded-lg flex-shrink-0 border border-white/20 shadow-md" style={{ backgroundColor: opt.color }} />}
              <span className={`text-sm font-semibold flex-1 text-left ${headingCls}`}>{opt.label}</span>
              {isSelected && <span className="text-lg">✓</span>}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <button 
          onClick={handleSkip}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-white/10 hover:bg-white/15 text-white/60 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
        >
          ⏭️ Skip
        </button>
        <button 
          onClick={() => { setOpen(false); setStep(0); setAnswers({}); }}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'}`}
        >
          ✕ Cancel
        </button>
      </div>
    </div>
  );
}

function UploadSection({ onLoadingStart, onAnalysisComplete, onError, onImageSelected, onGenderChange, setUploadProgress }) {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useLanguage();
  const isDark = theme === 'dark';
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress_internal] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const { progress, startProgress, completeProgress } = useAnalysisProgress();
  const [gender, setGender] = useState('male');
  const [mode, setMode] = useState('normal');
  const [season, setSeason] = useState('summer');
  const [bodyType, setBodyType] = useState('average');
  const [occasion, setOccasion] = useState('casual');
  const [budget, setBudget] = useState('any');
  const [eyeColor, setEyeColor] = useState('brown');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(0); // 0: Body, 1: Eye, 2: Occasion, 3: Budget, 4: Upload

  // Couple Mode States
  const [partner1, setPartner1] = useState(null);
  const [partner2, setPartner2] = useState(null);
  const [partner1Gender, setPartner1Gender] = useState('female');
  const [partner2Gender, setPartner2Gender] = useState('male');
  const partner1Ref = useRef(null);
  const partner2Ref = useRef(null);

  // Sync progress to parent if provided
  const handleProgress = (progress) => {
    setUploadProgress_internal(progress);
    if (setUploadProgress) setUploadProgress(progress);
  };

  const handleGenderChange = (newGender) => {
    setGender(newGender);
    if (onGenderChange) onGenderChange(newGender);
  };

  const handleFile = async (file) => {
    // Coin checks removed
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) { onError('Only JPG, PNG, or WebP images are allowed.'); return; }
    if (file.size > 10 * 1024 * 1024) { onError('Image is too large. Maximum size is 10MB.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setPreview(e.target.result); onImageSelected(e.target.result); };
    reader.readAsDataURL(file);
    console.log("[UploadSection] Starting analysis for mode:", mode, "gender:", gender);
    onLoadingStart();
    setShowProgress(true);
    startProgress();
    // Map language code for backend (hinglish -> en, hi -> hi)
    const backendLang = language === 'hi' ? 'hi' : 'en';
    
    try {
      let res;
      if (mode === 'seasonal') {
        res = await analyzeImageSeasonal(file, season, backendLang, handleProgress);
      } else if (gender === 'female') {
        res = await analyzeImageFemale(file, backendLang, handleProgress);
      } else {
        res = await analyzeImage(file, backendLang, handleProgress);
      }
      
      console.log("[UploadSection] Analysis successful!");
      completeProgress();
      setTimeout(() => {
        const finalGender = mode === 'seasonal' ? 'seasonal' : gender;
        console.log("[UploadSection] Passing gender:", finalGender, "to ResultsDisplay");
        onAnalysisComplete({ ...res.data, gender: finalGender, seasonalGender: mode === 'seasonal' ? gender : 'male', bodyType, occasion, budget, eyeColor });
        setShowProgress(false);
      }, 800);
    } catch (err) {
      console.error("[UploadSection] Analysis error:", err);
      setShowProgress(false);
      if (err.code === 'ECONNABORTED') {
        onError('Analysis is taking too long. Server is busy, please try again later.');
      } else {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'object') onError(detail.message || 'Analysis failed.');
        else onError(detail || 'Could not connect to server. Is the backend running?');
      }
    }
  };

  const handleCoupleAnalysis = async () => {
    // Coin checks removed
    if (!partner1 || !partner2) {
      onError('Please select photos for both partners.');
      return;
    }
    const dataURLtoFile = (dataurl, filename) => {
      let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
          bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while(n--){ u8arr[n] = bstr.charCodeAt(n); }
      return new File([u8arr], filename, {type:mime});
    };
    
    onLoadingStart();
    setShowProgress(true);
    startProgress();
    // Map language code for backend
    const backendLang = language === 'hi' ? 'hi' : 'en';

    try {
      const file1 = dataURLtoFile(partner1, 'partner1.jpg');
      const file2 = dataURLtoFile(partner2, 'partner2.jpg');

      handleProgress(10);
      const res1 = partner1Gender === 'female' ? await analyzeImageFemale(file1, backendLang, () => {}) : await analyzeImage(file1, backendLang, () => {});
      handleProgress(50);
      const res2 = partner2Gender === 'female' ? await analyzeImageFemale(file2, backendLang, () => {}) : await analyzeImage(file2, backendLang, () => {});
      handleProgress(100);

      completeProgress();
      setTimeout(() => {
        onImageSelected([partner1, partner2]);
        onAnalysisComplete({
          type: 'couple',
          partner1: { ...res1.data, gender: partner1Gender },
          partner2: { ...res2.data, gender: partner2Gender },
          occasion
        });
        setShowProgress(false);
      }, 800);
    } catch (err) {
      console.error("[UploadSection] Couple analysis error:", err);
      setShowProgress(false);
      onError('Couple analysis failed. Ensure both photos have clear faces.');
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
      {showProgress && (
        <LoadingScreenWithProgress progress={progress} isDark={isDark} />
      )}
      
      {!showProgress && (
        <>
          {/* Hero */}
      <div className="text-center mb-8">
        <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 mb-4 border ${isDark ? 'bg-purple-500/20 border-purple-500/30' : 'bg-purple-100 border-purple-300 shadow-sm'}`}>
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
          <span className={`text-sm font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>AI-Powered • 95%+ Accuracy</span>
        </div>
        <h2 className={`text-3xl md:text-5xl font-black mb-3 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {t('discoverStyle')}
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"> {t('perfectStyle')} </span>
          {t('styleWord')}
        </h2>
        <p className={`text-lg max-w-xl mx-auto ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
          {t('uploadSubtitle')}
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center mb-6">
        <div className={`rounded-2xl p-1.5 flex gap-1 flex-wrap border ${isDark ? 'bg-white/10 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
          <button
            onClick={() => { setMode('normal'); handleGenderChange('male'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              mode === 'normal'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>👔</span> Normal
          </button>
          <button
            onClick={() => { setMode('seasonal'); handleGenderChange('male'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              mode === 'seasonal'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>🌍</span> Seasonal
          </button>
          <button
            onClick={() => { setMode('couple'); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              mode === 'couple'
                ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg'
                : isDark ? 'text-white/50 hover:text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>👩‍❤️‍👨</span> Couple
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
          <p className={`text-sm text-center mb-3 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{t('chooseSeason')}</p>
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
      <div className="text-center mb-4 text-sm font-medium">
        {mode === 'couple' ? (
          <span className={isDark ? 'text-rose-300' : 'text-rose-600'}>👩‍❤️‍👨 Couple mode: Harmonized colors & matching outfits!</span>
        ) : mode === 'seasonal' ? (
          <span className={isDark ? 'text-amber-300' : 'text-amber-600'}>
            {seasons.find(s => s.id === season)?.emoji} {gender === 'female' ? '👩 Female' : '👨 Male'} — Special recommendations for {seasons.find(s => s.id === season)?.label}!
          </span>
        ) : gender === 'female' ? (
          <span className={isDark ? 'text-pink-300' : 'text-pink-600'}>👗 Female mode: Dress, Saree, Suit & Makeup suggestions included!</span>
        ) : (
          <span className={isDark ? 'text-blue-300' : 'text-blue-600'}>👔 Male mode: Shirt, Pant & Ethnic wear suggestions included!</span>
        )}
      </div>

      {/* Wizard Flow: Step 0 - Body Type */}
      {currentStep === 0 && (
        <div className={`rounded-3xl p-6 mb-5 border animate-fadeIn ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>1. {t('bodyTypeTitle') || 'Body Type'}</h3>
            <span className="text-xs font-bold text-purple-500">Step 1/4</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'slim', label: '🏃 Slim', desc: 'Lean' },
              { value: 'athletic', label: '💪 Athletic', desc: 'Muscular' },
              { value: 'average', label: '⚖️ Average', desc: 'Regular' },
              { value: 'plus', label: '🌸 Plus', desc: 'Curvy' },
            ].map((bt) => (
              <button
                key={bt.value}
                onClick={() => { setBodyType(bt.value); setCurrentStep(1); }}
                className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
                  bodyType === bt.value
                    ? isDark
                      ? 'bg-purple-600/30 border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'bg-purple-100 border-purple-500 shadow-lg shadow-purple-500/20'
                    : isDark
                      ? 'bg-white/5 border-white/10 hover:border-purple-500/30'
                      : 'bg-white border-gray-200 hover:border-purple-300 shadow-sm'
                }`}
              >
                <span className={`text-sm font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{bt.label}</span>
                <span className={`text-[10px] font-bold uppercase opacity-50 ${isDark ? 'text-white' : 'text-gray-900'}`}>{bt.desc}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentStep(1)}
            className={`w-full py-3 rounded-xl font-bold text-sm border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
          >
            ⏭️ Skip
          </button>
        </div>
      )}

      {/* Wizard Flow: Step 1 - Eye Color */}
      {currentStep === 1 && (
        <div className={`rounded-3xl p-6 mb-5 border animate-fadeIn ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>2. {t('eyeColorTitle') || 'Eye Color'}</h3>
            <span className="text-xs font-bold text-purple-500">Step 2/4</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'brown', label: '🟤 Brown', desc: 'Dark' },
              { value: 'black', label: '⚫ Black', desc: 'Very Dark' },
              { value: 'hazel', label: '🟢 Hazel', desc: 'Green' },
              { value: 'blue', label: '🔵 Blue', desc: 'Grey' },
            ].map((ec) => (
              <button
                key={ec.value}
                onClick={() => { setEyeColor(ec.value); setCurrentStep(2); }}
                className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
                  eyeColor === ec.value
                    ? isDark
                      ? 'bg-purple-600/30 border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'bg-purple-100 border-purple-500 shadow-lg shadow-purple-500/20'
                    : isDark
                      ? 'bg-white/5 border-white/10 hover:border-purple-500/30'
                      : 'bg-white border-gray-200 hover:border-purple-300 shadow-sm'
                }`}
              >
                <span className={`text-sm font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{ec.label}</span>
                <span className={`text-[10px] font-bold uppercase opacity-50 ${isDark ? 'text-white' : 'text-gray-900'}`}>{ec.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentStep(0)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
            >
              ← Back
            </button>
            <button
              onClick={() => setCurrentStep(2)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
            >
              ⏭️ Skip
            </button>
          </div>
        </div>
      )}

      {/* Wizard Flow: Step 2 - Occasion */}
      {currentStep === 2 && (
        <div className={`rounded-3xl p-6 mb-5 border animate-fadeIn ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>3. {t('occasionTitle') || 'Occasion'}</h3>
            <span className="text-xs font-bold text-purple-500">Step 3/4</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'casual',  label: '😎 Casual',  desc: 'Daily' },
              { value: 'office',  label: '💼 Office',  desc: 'Work' },
              { value: 'wedding', label: '💍 Wedding', desc: 'Festive' },
              { value: 'party',   label: '🎉 Party',   desc: 'Night out' },
              { value: 'date',    label: '❤️ Date',    desc: 'Romantic' },
            ].map((oc) => (
              <button
                key={oc.value}
                onClick={() => { setOccasion(oc.value); setCurrentStep(3); }}
                className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
                  occasion === oc.value
                    ? isDark
                      ? 'bg-purple-600/30 border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'bg-purple-100 border-purple-500 shadow-lg shadow-purple-500/20'
                    : isDark
                      ? 'bg-white/5 border-white/10 hover:border-purple-500/30'
                      : 'bg-white border-gray-200 hover:border-purple-300 shadow-sm'
                }`}
              >
                <span className={`text-sm font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{oc.label}</span>
                <span className={`text-[10px] font-bold uppercase opacity-50 ${isDark ? 'text-white' : 'text-gray-900'}`}>{oc.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentStep(1)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
            >
              ← Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
            >
              ⏭️ Skip
            </button>
          </div>
        </div>
      )}

      {/* Wizard Flow: Step 3 - Budget */}
      {currentStep === 3 && (
        <div className={`rounded-3xl p-6 mb-5 border animate-fadeIn ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-purple-100 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>4. {t('budgetTitle') || 'Budget'}</h3>
            <span className="text-xs font-bold text-purple-500">Step 4/4</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: 'any',   label: 'Any',    desc: 'No limit' },
              { value: '500',   label: '₹500',   desc: 'Budget' },
              { value: '1000',  label: '₹1000',  desc: 'Mid' },
              { value: '2000',  label: '₹2000',  desc: 'Premium' },
            ].map((b) => (
              <button
                key={b.value}
                onClick={() => { setBudget(b.value); setCurrentStep(4); }}
                className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all transform hover:scale-[1.02] ${
                  budget === b.value
                    ? isDark
                      ? 'bg-purple-600/30 border-purple-500 shadow-lg shadow-purple-500/20'
                      : 'bg-purple-100 border-purple-500 shadow-lg shadow-purple-500/20'
                    : isDark
                      ? 'bg-white/5 border-white/10 hover:border-purple-500/30'
                      : 'bg-white border-gray-200 hover:border-purple-300 shadow-sm'
                }`}
              >
                <span className={`text-sm font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{b.label}</span>
                <span className={`text-[10px] font-bold uppercase opacity-50 ${isDark ? 'text-white' : 'text-gray-900'}`}>{b.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentStep(2)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
            >
              ← Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
            >
              ⏭️ Skip
            </button>
          </div>
        </div>
      )}

      {/* Wizard Flow: Step 4 - Upload Photo */}
      {currentStep === 4 && (
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>5. {t('uploadTitle') || 'Upload Photo'}</h3>
            <button
              onClick={() => setCurrentStep(0)}
              className="text-xs font-bold text-purple-500 hover:text-purple-400 transition"
            >
              🔄 Change Settings
            </button>
          </div>
          
          {mode === 'couple' ? (
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 1, file: partner1, setFile: setPartner1, gender: partner1Gender, setGender: setPartner1Gender, ref: partner1Ref, label: 'Partner 1' },
                { id: 2, file: partner2, setFile: setPartner2, gender: partner2Gender, setGender: setPartner2Gender, ref: partner2Ref, label: 'Partner 2' },
              ].map(p => (
                <div key={p.id} className={`flex flex-col items-center rounded-3xl p-4 border-2 border-dashed transition-all ${isDark ? 'border-rose-500/30 bg-rose-500/5' : 'border-rose-300 bg-rose-50'}`}>
                  <span className="font-bold text-sm mb-2 opacity-70">{p.label}</span>
                  <div className="flex gap-1 mb-3 bg-white/10 p-1 rounded-lg">
                    <button onClick={() => p.setGender('female')} className={`px-2 py-1 text-xs rounded-md ${p.gender === 'female' ? 'bg-pink-500 text-white' : 'text-gray-400'}`}>👩</button>
                    <button onClick={() => p.setGender('male')} className={`px-2 py-1 text-xs rounded-md ${p.gender === 'male' ? 'bg-blue-500 text-white' : 'text-gray-400'}`}>👨</button>
                  </div>
                  <input
                    ref={p.ref} type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const r = new FileReader();
                        r.onload = ev => p.setFile(ev.target.result);
                        r.readAsDataURL(f);
                      }
                    }}
                  />
                  {p.file ? (
                    <img src={p.file} className="w-24 h-24 object-cover rounded-xl border border-white/20 mb-2 cursor-pointer shadow-lg" onClick={() => p.ref.current?.click()} />
                  ) : (
                    <button onClick={() => p.ref.current?.click()} className="w-24 h-24 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-3xl mb-2 hover:bg-black/10 dark:hover:bg-white/10 transition pb-1">
                      📸
                    </button>
                  )}
                </div>
              ))}
              <div className="col-span-2 mt-2">
                <button 
                  onClick={handleCoupleAnalysis}
                  disabled={!partner1 || !partner2}
                  className={`w-full py-4 rounded-2xl font-black text-lg text-white shadow-xl transition-all hover:scale-[1.02] ${(!partner1 || !partner2) ? 'bg-gray-400 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-rose-500 to-pink-600 shadow-rose-500/30'}`}
                >
                  👩‍❤️‍👨 Match Outfits
                </button>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <p className="text-center text-xs mt-2 text-rose-500 animate-pulse">Analyzing both photos... {uploadProgress}%</p>
                )}
              </div>
            </div>
          ) : (
            <div
              className={`relative border-2 border-dashed rounded-3xl p-6 md:p-12 text-center cursor-pointer transition-all duration-300 ${
                dragActive
                  ? 'border-purple-400 bg-purple-500/10 scale-[1.01]'
                  : mode === 'seasonal'
                    ? isDark ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-400/50 hover:bg-amber-500/10' : 'border-amber-300 bg-amber-50 hover:border-amber-400 hover:bg-amber-100'
                    : gender === 'female'
                      ? isDark ? 'border-pink-500/30 bg-pink-500/5 hover:border-pink-400/50 hover:bg-pink-500/10' : 'border-pink-300 bg-pink-50 hover:border-pink-400 hover:bg-pink-100'
                      : isDark ? 'border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10' : 'border-purple-300 bg-slate-100 hover:border-purple-500 hover:bg-purple-50 shadow-sm'
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
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
    
              {preview ? (
                <div className="flex flex-col items-center">
                  <img src={preview} alt="Preview" className="w-40 h-40 object-cover rounded-2xl shadow-2xl mb-4 border-2 border-purple-500/30" />
                  <p className={`animate-pulse ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>{t('analyzingPhoto')}</p>
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
                  <p className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{t('dropSelfie')}</p>
                  <p className={`mb-6 ${isDark ? 'text-white/40' : 'text-gray-400'}`}>{t('orBrowse')}</p>
                  <span className={`inline-block px-8 py-3.5 text-white font-bold rounded-2xl shadow-lg transition-all hover:scale-105 ${
                    mode === 'seasonal'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30'
                      : gender === 'female'
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 shadow-pink-500/30'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-purple-500/30'
                  }`}>
                    📁 {t('choosePhoto')}
                  </span>
                  <div className="flex gap-3 justify-center mt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                      className={`md:hidden flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition
                        ${isDark
                          ? 'bg-purple-500/20 border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
                          : 'bg-purple-600 border-purple-600 text-white shadow-sm hover:bg-purple-700'}`}
                    >
                      📷 Camera
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition
                        ${isDark
                          ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                          : 'bg-gray-100 border-gray-300 text-gray-700 shadow-sm hover:bg-gray-200'}`}
                    >
                      🖼️ Gallery
                    </button>
                  </div>
                  <p className={`text-xs mt-4 ${isDark ? 'text-white/25' : 'text-gray-400'}`}>{t('photoNote')}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        {[
          { emoji: '☀️', title: t('naturalLight'), desc: t('naturalLightDesc') },
          { emoji: '🤳', title: t('faceForward'), desc: t('faceForwardDesc') },
          { emoji: '😊', title: t('clearFace'), desc: t('clearFaceDesc') },
        ].map((tip, i) => (
          <div key={i} className={`rounded-2xl p-4 flex items-center gap-3 transition border ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-slate-100 border-purple-200 hover:border-purple-400 shadow-sm'}`}>
            <span className="text-2xl">{tip.emoji}</span>
            <div>
              <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>{tip.title}</p>
              <p className={`text-xs ${isDark ? 'text-white/40' : 'text-gray-500'}`}>{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Skin Tones */}
      <div className={`mt-6 rounded-2xl p-5 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-purple-200 shadow-sm'}`}>
        <p className={`text-xs text-center mb-3 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{t('skinTones')}</p>
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

      {/* Skin Tone Quiz */}
      <SkinToneQuiz isDark={isDark} onResult={onAnalysisComplete} gender={gender} />
        </>
      )}
    </div>
  );
}

export default UploadSection;