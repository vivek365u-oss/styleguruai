const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../blogs');

const batch1 = [
  { file: '008_why_cool_undertones_prefer_jewel_tones.md', title: 'Why Cool Undertones Prefer Jewel Tones', before: 503 },
  { file: '009_can_neutral_undertones_wear_all_colors.md', title: 'Can Neutral Undertones Wear All Colors Equally Well?', before: 522 },
  { file: '093_does_skin_tone_affect_sunglasses_frame_choice.md', title: 'Does Skin Tone Affect Sunglasses Frame Choice?', before: 523 },
  { file: '086_how_does_color_wheel_work_in_fashion.md', title: 'How Does the Color Wheel Work in Fashion?', before: 530 },
  { file: '026_how_ai_personalizes_fashion_recommendations.md', title: 'How Can AI Personalize Fashion Recommendations?', before: 532 },
  { file: '087_what_is_the_60_30_10_rule_of_fashion.md', title: 'What is the 60-30-10 Rule of Fashion?', before: 535 },
  { file: '092_how_skin_tone_influences_jewelry_selection.md', title: 'How Does Skin Tone Influence Jewelry Selection?', before: 551 },
  { file: '102_how_does_tanning_change_your_color_palette.md', title: 'How Does Tanning Change Your Color Palette?', before: 554 }
];

console.log('| # | Article Title | Slug / File | Before Words | After Words | Growth |');
console.log('|---|---|---|---|---|---|');

batch1.forEach((b, idx) => {
  const content = fs.readFileSync(path.join(dir, b.file), 'utf-8');
  const textOnly = content.replace(/#[^\n]*/g, '').trim();
  const words = textOnly.split(/\s+/).filter(Boolean).length;
  const growth = '+' + (words - b.before) + ' (' + Math.round(((words - b.before) / b.before) * 100) + '%)';
  console.log('| ' + (idx + 1) + ' | ' + b.title + ' | `' + b.file + '` | ' + b.before + ' | ' + words + ' | ' + growth + ' |');
});
