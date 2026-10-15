const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../blogs');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.md')).sort();

let out = '| # | Slug / File | Words | H2s | First 8 Words of Closing CTA | Flagged Repetitive? |\n';
out += '|---|---|---|---|---|---|\n';

files.forEach((f, idx) => {
  const content = fs.readFileSync(path.join(dir, f), 'utf-8');
  const lines = content.split('\n');
  const h2Count = lines.filter(l => l.startsWith('## ')).length;
  const textOnly = content.replace(/#[^\n]*/g, '').trim();
  const words = textOnly.split(/\s+/).filter(Boolean).length;
  
  const bodyClean = content.split(/---\s*\n+###?\s*Social Media Snippets/i)[0].trim();
  const paragraphs = bodyClean.split('\n\n').filter(p => p.trim());
  const lastP = paragraphs[paragraphs.length - 1] || '';
  const first8 = lastP.replace(/[\r\n\[\]\(\)\*#]/g, ' ').replace(/\|/g, '/').trim().split(/\s+/).slice(0, 8).join(' ');
  const isRep = /StyleGuru AI|analyze your|stop guessing|unlock your|archaic tests|modern AI/i.test(lastP);
  
  out += `| ${idx + 1} | \`${f.replace('.md','')}\` | ${words} | ${h2Count} | ${first8} | ${isRep ? '⚠️ Yes' : 'No'} |\n`;
});

fs.writeFileSync(path.join(__dirname, 'audit_table.md'), out);
console.log('Successfully wrote audit_table.md with', files.length, 'articles.');
