/**
 * prerender.cjs — High-Performance Static Pre-Rendering Engine for StyleGuru AI
 * 
 * Generates static HTML for all public routes and 116 blog articles into /dist.
 * Ensures Googlebot, Bingbot, and AdSense review crawlers receive 100% real text,
 * semantic headings, metadata, and JSON-LD structured data without requiring JS execution.
 */
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist');
const BLOGS_DIR = path.join(__dirname, 'blogs');
const BASE_URL = 'https://www.styleguruai.in';

if (!fs.existsSync(DIST_DIR)) {
  console.error('Error: dist directory does not exist. Run "vite build" first.');
  process.exit(1);
}

const template = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseMd(content) {
  const lines = content.split(/\r?\n/);
  let title = '';
  let sections = [];
  let currentHeading = '';
  let currentBody = [];

  for (const line of lines) {
    if (line.trim() === '---') break;

    if (line.startsWith('# ') && !title) {
      title = line.replace(/^#\s+/, '').trim();
      continue;
    }

    if (line.startsWith('## ')) {
      if (currentHeading) {
        sections.push({
          heading: currentHeading,
          body: currentBody.join(' ').replace(/\s+/g, ' ').trim()
        });
      }
      currentHeading = line.replace(/^##\s+/, '').trim();
      currentBody = [];
      continue;
    }

    if (line.startsWith('### ')) {
      const subH = line.replace(/^###\s+/, '').trim();
      currentBody.push(`\n${subH}: `);
      continue;
    }

    const trimmed = line.trim();
    if (trimmed && currentHeading) {
      let clean = trimmed
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^[-*]\s+/, '• ');
      currentBody.push(clean);
    } else if (trimmed && !currentHeading && title) {
      if (!sections.length || sections[0].heading !== 'Introduction') {
        sections.unshift({ heading: 'Introduction', body: '' });
      }
      let clean = trimmed
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^[-*]\s+/, '• ');
      sections[0].body += (sections[0].body ? ' ' : '') + clean;
    }
  }

  if (currentHeading) {
    sections.push({
      heading: currentHeading,
      body: currentBody.join(' ').replace(/\s+/g, ' ').trim()
    });
  }

  return { title, sections };
}

function writePage(routePath, title, description, contentHtml, extraHead = '', ogType = 'website') {
  const targetDir = path.join(DIST_DIR, routePath);
  fs.mkdirSync(targetDir, { recursive: true });

  const canonicalUrl = `${BASE_URL}${routePath === '/' ? '' : routePath}`;

  let html = template;

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);

  // Replace Meta Description
  html = html.replace(
    /<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta name="description" content="${escapeHtml(description)}" />`
  );

  // Replace Canonical Link or add one
  if (html.includes('rel="canonical"')) {
    html = html.replace(/<link\s+rel=["']canonical["'].*?\/?>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`);
  }

  // Open Graph and Twitter Card tags
  const ogTags = [
    `<meta property="og:type" content="${ogType}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:url" content="${canonicalUrl}" />`,
    `<meta property="og:image" content="${BASE_URL}/og-image.svg" />`,
  ];

  const twitterTags = [
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    `<meta name="twitter:image" content="${BASE_URL}/og-image.svg" />`,
  ];

  // Strip pre-existing og/twitter tags to avoid duplicates
  html = html.replace(/<meta\s+property=["']og:(type|title|description|url|image)["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']twitter:(card|title|description|image|url)["'][^>]*>\s*/gi, '');

  const metaBlock = `  ${ogTags.join('\n  ')}\n  ${twitterTags.join('\n  ')}`;
  html = html.replace('</head>', `${metaBlock}\n${extraHead ? extraHead + '\n' : ''}</head>`);

  // Inject content inside <div id="root">
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${contentHtml}</div>`
  );

  fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf-8');
  if (routePath !== '/') {
    const cleanRel = routePath.replace(/^\//, '');
    const flatFile = path.join(DIST_DIR, `${cleanRel}.html`);
    fs.mkdirSync(path.dirname(flatFile), { recursive: true });
    fs.writeFileSync(flatFile, html, 'utf-8');
  }
}

// ── 1. Read All Blogs ──
const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md')).sort();
const posts = [];

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  const raw = fs.readFileSync(path.join(BLOGS_DIR, file), 'utf-8');
  const { title, sections } = parseMd(raw);
  if (!title) continue;

  const slug = slugify(title);
  const firstBody = sections[0]?.body || '';
  const description = firstBody.length > 160 ? firstBody.slice(0, 157) + '...' : firstBody;

  posts.push({ slug, title, file, sections, description });
}

console.log(`[Pre-render] Loaded ${posts.length} blog posts.`);

// ── 1b. Pre-render Homepage (/) ──
// The Vite build leaves dist/index.html as an empty shell (<div id="root"></div>).
// This block writes full crawler-visible HTML into dist/index.html so Googlebot
// and the AdSense review crawler see real content, not a blank page.
console.log('[Pre-render] Generating homepage (/) with full visible content...');

const skinTonesStatic = [
  { name: 'Fair Cool',       hex: '#F6E3D4', undertone: 'Cool (Bluish / Pinkish)',    bestColors: 'Navy Blue, Deep Teal, Royal Indigo, Rose Pink, Emerald, Pure White',   avoid: 'Mustard Yellow, Muddy Brown' },
  { name: 'Light Warm',      hex: '#E8C9A0', undertone: 'Warm (Golden / Peach)',       bestColors: 'Terracotta, Warm Amber, Olive Green, Sage Green, Warm Cream',           avoid: 'Icy Silver, Stark Black' },
  { name: 'Wheatish Neutral',hex: '#D4A574', undertone: 'Neutral / Olive',             bestColors: 'Forest Green, Cobalt Blue, Rich Maroon, Mustard Gold, Charcoal, Ivory', avoid: 'Pale Beige, Neon Yellow' },
  { name: 'Medium Warm',     hex: '#C68642', undertone: 'Warm Golden',                 bestColors: 'Rust Orange, Regal Wine, Deep Teal, Royal Gold, Dark Chocolate',         avoid: 'Pale Pastel Pink, Muddy Gray' },
  { name: 'Olive Dusky',     hex: '#A0785A', undertone: 'Subtle Green / Neutral',      bestColors: 'Vivid Coral, Deep Emerald, Cobalt Blue, Plum Purple, Mustard Ochre',    avoid: 'Olive Drab, Dull Tan' },
  { name: 'Dark Warm',       hex: '#6B3D2E', undertone: 'Deep Golden / Espresso',      bestColors: 'Royal Gold, Electric Cobalt, Hot Crimson, Vivid Turquoise, Fuchsia',    avoid: 'Very Dark Navy, Dull Charcoal' },
];

const skinToneCards = skinTonesStatic.map(t => `
  <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
    <div class="flex items-center gap-3 mb-2">
      <div class="w-10 h-10 rounded-full border-2 border-white shadow" style="background:${t.hex}"></div>
      <h3 class="text-base font-bold text-slate-900">${escapeHtml(t.name)}</h3>
    </div>
    <p class="text-xs text-slate-500 font-semibold uppercase tracking-wide">Undertone: <span class="text-violet-700 normal-case font-bold">${escapeHtml(t.undertone)}</span></p>
    <p class="text-xs text-slate-600 leading-relaxed"><strong class="text-slate-800">Best Colors:</strong> ${escapeHtml(t.bestColors)}</p>
    <p class="text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100"><strong>Avoid:</strong> ${escapeHtml(t.avoid)}</p>
  </div>`).join('\n');

const featureCards = [
  { icon: '🔬', label: 'Pillar 01', title: 'Skin & Undertone Analysis', desc: 'Upload a selfie. The app calculates your ITA angle and RGB undertone to classify whether you are warm, cool, or neutral — calibrated for Indian complexions.' },
  { icon: '💑', label: 'Pillar 02', title: 'Couple Colour Matching',   desc: 'Find harmonious colour pairings for couples — ideal for wedding sangeet, anniversary outfits, or coordinated festival wear for Diwali and Navratri.' },
  { icon: '👔', label: 'Pillar 03', title: 'Wardrobe Colour Manager',  desc: 'Build a personalised capsule wardrobe. Know which kurtas, sarees, sherwanis, and everyday casuals work best for your skin tone across every season.' },
  { icon: '📐', label: 'Pillar 04', title: 'Outfit Harmony Checker',   desc: 'Check whether a planned top-and-bottom pairing — say a cobalt kurta with cream trousers — creates contrast or clash on your specific complexion.' },
  { icon: '🌐', label: 'Pillar 05', title: 'Style Blog & Guides',      desc: 'Browse 115 in-depth articles on colour theory for Indian skin, seasonal palettes, festival styling, and makeup tips. Updated regularly.', link: '/blog' },
  { icon: '📊', label: 'Pillar 06', title: 'Personalised Style Score', desc: 'Receive a colour-harmony score after each analysis so you can track how your outfit choices evolve and improve over time.' },
].map(f => `
  <div class="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm flex flex-col gap-3">
    <div class="w-11 h-11 rounded-2xl bg-violet-50 flex items-center justify-center text-2xl">${f.icon}</div>
    <span class="text-[10px] font-bold text-violet-600 uppercase tracking-widest">${f.label}</span>
    <h3 class="text-lg font-bold text-slate-900 font-serif">${f.title}</h3>
    <p class="text-xs text-slate-600 leading-relaxed flex-1">${f.desc}</p>
    ${f.link ? `<a href="${f.link}" class="text-xs font-bold text-violet-600 hover:text-violet-800 mt-1">Read the Blog →</a>` : ''}
  </div>`).join('\n');

const recentArticles = posts.slice(0, 6).map(p => `
  <li>
    <a href="/blog/${p.slug}" class="text-sm font-semibold text-violet-700 hover:underline block">${escapeHtml(p.title)}</a>
    <p class="text-xs text-slate-500 mt-0.5 leading-snug">${escapeHtml(p.description.slice(0, 100))}…</p>
  </li>`).join('\n');

const sharedHeader = `
  <header class="w-full bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between flex-wrap gap-4" style="position:sticky;top:0;z-index:100;">
    <a href="/" class="flex items-center gap-2.5 no-underline">
      <img src="/logo.png" alt="StyleGuru AI Logo" width="36" height="36" class="rounded-xl" loading="eager" />
      <span class="text-lg font-black text-slate-900">StyleGuru <span style="background:linear-gradient(90deg,#6366F1,#8B5CF6,#EC4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">AI</span></span>
      <span class="text-[9px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md uppercase tracking-wide">Made in India 🇮🇳</span>
    </a>
    <nav class="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
      <a href="/"               class="hover:text-violet-600 no-underline text-slate-700">Home</a>
      <a href="/blog"           class="hover:text-violet-600 no-underline text-slate-700">Blog</a>
      <a href="/about"          class="hover:text-violet-600 no-underline text-slate-700">About</a>
      <a href="/contact"        class="hover:text-violet-600 no-underline text-slate-700">Contact</a>
      <a href="/privacy-policy" class="hover:text-violet-600 no-underline text-slate-700">Privacy Policy</a>
      <a href="/terms"          class="hover:text-violet-600 no-underline text-slate-700">Terms</a>
      <a href="/disclaimer"     class="hover:text-violet-600 no-underline text-slate-700">Disclaimer</a>
    </nav>
  </header>`;

const sharedFooter = `
  <footer class="bg-slate-900 text-slate-300 py-12 px-6 mt-16 border-t border-slate-800">
    <div class="max-w-5xl mx-auto">
      <div class="flex flex-wrap gap-8 justify-between mb-8">
        <div>
          <a href="/" class="flex items-center gap-2 no-underline mb-3">
            <img src="/logo.png" alt="StyleGuru AI Logo" width="32" height="32" class="rounded-lg" loading="lazy" />
            <span class="text-white font-bold text-lg">StyleGuru AI</span>
          </a>
          <p class="text-xs text-slate-400 max-w-xs leading-relaxed">AI-powered colour and fashion intelligence for every Indian skin tone. Free, privacy-first, made in India.</p>
        </div>
        <div>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Navigation</p>
          <ul class="space-y-2 text-xs list-none p-0 m-0">
            <li><a href="/"               class="hover:text-white no-underline text-slate-300">Home</a></li>
            <li><a href="/blog"           class="hover:text-white no-underline text-slate-300">Blog</a></li>
            <li><a href="/about"          class="hover:text-white no-underline text-slate-300">About</a></li>
            <li><a href="/contact"        class="hover:text-white no-underline text-slate-300">Contact</a></li>
          </ul>
        </div>
        <div>
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Legal &amp; Policies</p>
          <ul class="space-y-2 text-xs list-none p-0 m-0">
            <li><a href="/privacy-policy" class="hover:text-white no-underline text-slate-300">Privacy Policy</a></li>
            <li><a href="/terms"          class="hover:text-white no-underline text-slate-300">Terms</a></li>
            <li><a href="/disclaimer"     class="hover:text-white no-underline text-slate-300">Disclaimer</a></li>
          </ul>
        </div>
      </div>
      <div class="flex flex-wrap justify-between items-center text-xs text-slate-500 border-t border-slate-800 pt-6">
        <p class="m-0">&copy; 2024–2026 StyleGuru AI. All rights reserved. Founded by Vivek Kumar 🇮🇳.</p>
        <p class="m-0">Contact: <a href="mailto:styleguruai.in@gmail.com" class="underline text-slate-400">styleguruai.in@gmail.com</a></p>
      </div>
    </div>
  </footer>`;

const homepageNav = sharedHeader;
const homepageFooter = sharedFooter;

const homepageContent = `
${sharedHeader}
<main class="bg-[#FAFAFC] text-slate-900 font-sans" style="font-family:system-ui,sans-serif;">

  <!-- HERO -->
  <section class="py-20 px-6 max-w-5xl mx-auto text-center">
    <span class="inline-block text-xs font-bold text-violet-700 bg-violet-100 px-3 py-1 rounded-full border border-violet-200 mb-4 uppercase tracking-wide">🇮🇳 AI-Powered Fashion Intelligence — Made in India</span>
    <h1 class="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight font-serif mb-5">
      Stop Guessing. Wear Colors That Make You <span style="background:linear-gradient(90deg,#6366F1,#8B5CF6,#EC4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Radiate</span>.
    </h1>
    <p class="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8">
      Calibrated specifically for rich Indian skin tones. In 10 seconds, our AI calculates your exact ITA skin angle, undertone, and curates a personalized wardrobe guide.
    </p>
    <div class="flex flex-wrap items-center justify-center gap-3 mb-6">
      <a href="/login" class="px-8 py-4 rounded-2xl text-white font-bold text-sm shadow-lg no-underline" style="background:linear-gradient(135deg,#6366F1,#8B5CF6,#EC4899);">📷 Analyze My Style Free →</a>
      <a href="/blog"  class="px-7 py-4 rounded-2xl text-slate-800 font-bold text-sm bg-white border border-slate-200 hover:border-violet-300 shadow-sm no-underline">Read Fashion Guides</a>
    </div>
    <div class="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
      <span class="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">✓ 100% Free Forever</span>
      <span>✓ No Credit Card Needed</span>
      <span>✓ Privacy First (Zero Photos Stored)</span>
    </div>
  </section>

  <!-- CREDIBILITY STRIP -->
  <section class="border-y border-slate-200 bg-white py-6 px-6">
    <div class="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      <div><p class="text-2xl font-black text-slate-900 font-serif">ITA 45°</p><p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Colorimetry Science</p></div>
      <div><p class="text-2xl font-black text-slate-900 font-serif">468-Point</p><p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Facial Landmark Mesh</p></div>
      <div><p class="text-2xl font-black text-slate-900 font-serif">100% Free</p><p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">No Paywalls Ever</p></div>
      <div><p class="text-2xl font-black text-slate-900 font-serif">0 Files Saved</p><p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Zero-Storage Privacy</p></div>
    </div>
  </section>

  <!-- FEATURES (6 Pillars) -->
  <section id="features" class="py-20 px-6 max-w-5xl mx-auto">
    <div class="text-center mb-12">
      <span class="text-xs font-bold uppercase tracking-widest text-violet-700 bg-violet-100 px-3 py-1 rounded-full border border-violet-200">Engineered Capabilities</span>
      <h2 class="text-3xl sm:text-4xl font-black text-slate-900 font-serif mt-3 mb-3">Your Complete AI Fashion Ecosystem</h2>
      <p class="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">Everything you need to dress sharper, shop with confidence, and never ask &quot;does this suit me?&quot; again — built for India's wide range of skin tones.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      ${featureCards}
    </div>
  </section>

  <!-- DIRECT SMART SHOPPING (From React Landing Page) -->
  <section id="direct-shop" class="py-16 px-6 bg-slate-50 border-t border-slate-200">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-10">
        <span class="text-xs font-bold uppercase tracking-widest text-pink-700 bg-pink-100 px-3 py-1 rounded-full border border-pink-200">Direct Smart Shopping</span>
        <h2 class="text-3xl font-black text-slate-900 font-serif mt-3 mb-2">Buy Clothes That Make Your Face &amp; Body Glow</h2>
        <p class="text-sm text-slate-600 max-w-xl mx-auto">StyleGuru AI maps your facial undertone, contrast, and body proportions directly to curated clothes with 1-Click Buy links on India's top fashion stores — Myntra, Amazon India, Ajio, and Nykaa.</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p class="text-lg font-bold text-slate-900 mb-1">🎯 Face &amp; Complexion Harmony</p>
          <p class="text-xs text-slate-600">Eliminates colors that cause dullness, accentuating your natural radiance.</p>
        </div>
        <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p class="text-lg font-bold text-slate-900 mb-1">👗 Silhouette &amp; Fit Match</p>
          <p class="text-xs text-slate-600">Cuts, necklines, and fits tailored to flatter your exact physical proportions.</p>
        </div>
        <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p class="text-lg font-bold text-slate-900 mb-1">⚡ 1-Click Integrated Stores</p>
          <p class="text-xs text-slate-600">Direct buy links on Myntra, Amazon India, Ajio, Nykaa, and Flipkart.</p>
        </div>
        <div class="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p class="text-lg font-bold text-slate-900 mb-1">💰 Filter by Your Budget</p>
          <p class="text-xs text-slate-600">Find high-flattery styles under ₹999, everyday casuals, or festive luxury.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- SKIN TONE COLOUR GUIDE -->
  <section class="py-16 px-6 bg-white border-y border-slate-200">
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-10">
        <h2 class="text-3xl font-black text-slate-900 font-serif mb-2">Colour Guide by Indian Skin Tone</h2>
        <p class="text-sm text-slate-600 max-w-xl mx-auto">A reference for the six most common Indian complexion types — from fair cool to deep warm. Click &quot;Analyze My Style Free&quot; above for your personalised result.</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        ${skinToneCards}
      </div>
    </div>
  </section>

  <!-- HOW IT WORKS (3 Simple Steps from React Landing Page) -->
  <section id="how-it-works" class="py-20 px-6 max-w-4xl mx-auto">
    <div class="text-center mb-12">
      <span class="text-xs font-bold uppercase tracking-widest text-violet-700">Simple Process</span>
      <h2 class="text-3xl font-black text-slate-900 font-serif mt-2 mb-3">Three Steps to Your Style Guide</h2>
      <p class="text-sm text-slate-600 max-w-xl mx-auto">Three steps. Ten seconds. A personal colour guide built for your complexion.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div class="text-center p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div class="text-4xl mb-4">📸</div>
        <h3 class="text-lg font-bold text-slate-900 mb-2">1. Snap a Clear Selfie</h3>
        <p class="text-xs text-slate-600 leading-relaxed">Take a quick photo in natural daylight without heavy filters or makeup. Don't want to upload? You can also use our manual style quiz.</p>
      </div>
      <div class="text-center p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div class="text-4xl mb-4">🧬</div>
        <h3 class="text-lg font-bold text-slate-900 mb-2">2. AI Analyzes Your Tone</h3>
        <p class="text-xs text-slate-600 leading-relaxed">Our engine extracts facial landmarks, calculates your skin melanin density and undertone, and maps your profile to our scientific Indian color charts.</p>
      </div>
      <div class="text-center p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div class="text-4xl mb-4">✨</div>
        <h3 class="text-lg font-bold text-slate-900 mb-2">3. Get Your Style DNA</h3>
        <p class="text-xs text-slate-600 leading-relaxed">Receive your complete color palette, outfit pairings for top and bottom, colors to avoid, and direct budget shopping links tailored for you.</p>
      </div>
    </div>
  </section>

  <!-- MEET THE FOUNDER & MADE IN INDIA STORY (From React Landing Page) -->
  <section id="founder" class="py-20 px-6 max-w-5xl mx-auto">
    <div class="rounded-3xl p-8 sm:p-12 border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-pink-50 shadow-sm">
      <div class="flex flex-col md:flex-row gap-8 items-center">
        <div class="text-center md:text-left flex-shrink-0">
          <img src="/logo.png" alt="Vivek Kumar - Founder of StyleGuru AI" width="112" height="112" class="w-28 h-28 rounded-full mx-auto p-1 bg-gradient-to-tr from-violet-600 to-pink-500 bg-white object-contain shadow-lg" loading="lazy" />
          <h3 class="text-xl font-bold text-slate-900 font-serif mt-4 mb-0.5">Vivek Kumar</h3>
          <p class="text-xs font-semibold text-violet-700 m-0">Founder &amp; Creator, StyleGuru AI</p>
          <p class="text-[11px] text-slate-500 m-0">Engineered with pride in India 🇮🇳</p>
        </div>
        <div class="space-y-3">
          <span class="inline-block text-xs font-bold text-violet-800 bg-violet-100 px-3 py-1 rounded-full uppercase tracking-wide">Our Founding Mission</span>
          <h2 class="text-2xl sm:text-3xl font-black text-slate-900 font-serif leading-snug">
            &ldquo;Fashion Advice Shouldn't Cost ₹5,000 or Rely on Western Color Charts That Ignore Indian Skin Tones.&rdquo;
          </h2>
          <p class="text-sm text-slate-600 leading-relaxed">
            Most global fashion styling tools were built on European skin tone classifications that completely fail when applied to the rich, warm, and multifaceted spectrum of Indian complexions.
          </p>
          <p class="text-sm text-slate-600 leading-relaxed">
            I founded <strong>StyleGuru AI</strong> to bridge this gap. By combining computer vision with proven colorimetry (ITA individual typology angle), we built an algorithm that understands every Indian undertone — from Kashmir to Kanyakumari. Our promise is simple: <strong>high-tier style intelligence, zero subscription paywalls, and complete data privacy.</strong>
          </p>
          <div class="flex flex-wrap gap-3 pt-2 text-xs font-semibold text-slate-700">
            <span class="bg-white px-3 py-1.5 rounded-xl border border-slate-200">🎯 100% Free For Every Indian</span>
            <span class="bg-white px-3 py-1.5 rounded-xl border border-slate-200">🔒 Zero Photo Storage Policy</span>
            <span class="bg-white px-3 py-1.5 rounded-xl border border-slate-200">🚀 Constantly Evolving AI Model</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- RECENT BLOG ARTICLES -->
  <section class="py-16 px-6 bg-white border-y border-slate-200">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h2 class="text-2xl font-black text-slate-900 font-serif">Latest from the Fashion Blog</h2>
        <a href="/blog" class="text-xs font-bold text-violet-600 hover:text-violet-800 no-underline">View All ${posts.length} Articles →</a>
      </div>
      <ul class="grid grid-cols-1 sm:grid-cols-2 gap-6 list-none p-0">
        ${recentArticles}
      </ul>
    </div>
  </section>

</main>
${sharedFooter}`;

// Write the homepage. writePage() injects into <div id="root"> and patches all meta tags.
// We call it with routePath '/' — the function resolves this to dist/index.html.
(function writeHomepage() {
  const homepageSchemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'StyleGuru AI',
    url: BASE_URL,
    description: 'AI-powered colour and fashion intelligence for every Indian skin tone.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/blog?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  });
  const orgSchemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'StyleGuru AI',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    contactPoint: { '@type': 'ContactPoint', email: 'styleguruai.in@gmail.com', contactType: 'customer service' }
  });
  const extraHead = `  <script type="application/ld+json">${homepageSchemaJson}</script>\n  <script type="application/ld+json">${orgSchemaJson}</script>`;

  const canonicalUrl = BASE_URL + '/';
  let html = template;
  html = html.replace(/<title>.*?<\/title>/i, `<title>StyleGuru AI — AI Fashion &amp; Colour Intelligence for Every Indian Skin Tone</title>`);
  html = html.replace(
    /<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i,
    `<meta name="description" content="Discover your best outfit colours with AI skin tone analysis. Free, India-first, works for every complexion — fair, wheatish, olive, dark. Upload a selfie and get your personalised wardrobe guide." />`
  );
  // Canonical
  if (html.includes('rel="canonical"')) {
    html = html.replace(/<link\s+rel=["']canonical["'].*?\/?>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`);
  }
  // Strip old og/twitter from template then re-inject
  html = html.replace(/<meta\s+property=["']og:(type|title|description|url|image)["'][^>]*>\s*/gi, '');
  html = html.replace(/<meta\s+name=["']twitter:(card|title|description|image|url)["'][^>]*>\s*/gi, '');
  const ogBlock = [
    `  <meta property="og:type" content="website" />`,
    `  <meta property="og:title" content="StyleGuru AI — AI Fashion &amp; Colour Intelligence for Every Indian Skin Tone" />`,
    `  <meta property="og:description" content="Free AI skin tone analysis and personalised outfit colour guide for Indian complexions. Upload a selfie, get your wardrobe palette." />`,
    `  <meta property="og:url" content="${canonicalUrl}" />`,
    `  <meta property="og:image" content="${BASE_URL}/og-image.svg" />`,
    `  <meta name="twitter:card" content="summary_large_image" />`,
    `  <meta name="twitter:url" content="${canonicalUrl}" />`,
    `  <meta name="twitter:title" content="StyleGuru AI — AI Fashion &amp; Colour Intelligence" />`,
    `  <meta name="twitter:description" content="Free AI skin tone analysis and personalised outfit colour guide for Indian complexions." />`,
    `  <meta name="twitter:image" content="${BASE_URL}/og-image.svg" />`,
  ].join('\n');
  html = html.replace('</head>', `${ogBlock}\n${extraHead}\n</head>`);
  // Inject body content
  html = html.replace('<div id="root"></div>', `<div id="root">${homepageContent}</div>`);
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html, 'utf-8');
  console.log('[Pre-render] ✅ Homepage (/) written to dist/index.html');
})();

// ── 1c. Pre-render 404 Page (dist/404.html) ──
// Vercel serves 404.html when no route/file matches, with HTTP status 404.
console.log('[Pre-render] Generating 404.html...');
(function write404() {
  let html404 = template;
  html404 = html404.replace(/<title>.*?<\/title>/i, '<title>Page Not Found (404) — StyleGuru AI</title>');
  html404 = html404.replace(
    /<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i,
    '<meta name="description" content="The page you are looking for could not be found on StyleGuru AI." />'
  );
  html404 = html404.replace('</head>', '  <meta name="robots" content="noindex, nofollow" />\n</head>');
  // Strip og/twitter from template then do NOT add og tags (it is a 404)
  html404 = html404.replace(/<meta\s+property=["']og:(type|title|description|url|image)['"]\s.*?\/?\>\s*/gi, '');
  html404 = html404.replace(/<meta\s+name=["']twitter:(card|title|description|image|url)['"]\s.*?\/?\>\s*/gi, '');
  const content404 = `
    <div style="min-height:100vh;background:#0B0F1A;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem;font-family:system-ui,sans-serif;">
      <div style="width:64px;height:64px;border-radius:16px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:1rem;">🔍</div>
      <span style="font-size:0.75rem;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#a78bfa;display:block;margin-bottom:0.5rem;">Error 404</span>
      <h1 style="font-size:2.5rem;font-weight:900;margin:0 0 0.75rem;font-family:Georgia,serif;">Page Not Found</h1>
      <p style="font-size:0.875rem;color:#94a3b8;max-width:420px;line-height:1.6;margin-bottom:2rem;">
        The styling guide or page you are looking for may have moved or no longer exists. Explore our homepage or browse our fashion articles.
      </p>
      <div style="display:flex;flex-wrap:wrap;gap:0.75rem;justify-content:center;">
        <a href="/" style="padding:0.875rem 1.75rem;border-radius:0.75rem;background:linear-gradient(135deg,#6366F1,#8B5CF6,#EC4899);color:#fff;font-weight:700;font-size:0.75rem;text-decoration:none;">← Return to Homepage</a>
        <a href="/blog" style="padding:0.875rem 1.75rem;border-radius:0.75rem;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#e2e8f0;font-weight:700;font-size:0.75rem;text-decoration:none;">Browse Fashion Blog →</a>
      </div>
    </div>`;
  html404 = html404.replace('<div id="root"></div>', `<div id="root">${content404}</div>`);
  fs.writeFileSync(path.join(DIST_DIR, '404.html'), html404, 'utf-8');
  console.log('[Pre-render] ✅ 404.html written to dist/404.html');
})();

// ── 2. Pre-render Static Legal and Trust Pages (FULL COMPONENT TEXT) ──
console.log('[Pre-render] Generating static trust pages with FULL text...');

// 2a. /privacy-policy (Target: 600+ words)
writePage(
  '/privacy-policy',
  'Privacy Policy — StyleGuru AI',
  'Comprehensive Privacy Policy for StyleGuru AI. Disclosures regarding Google AdSense, DoubleClick cookies, Firebase authentication, and photo analysis privacy.',
  `<div class="public-prerender-content min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-slate-100" style="background:#0B0F1A;">
    <main class="max-w-3xl mx-auto">
      <div class="flex items-center gap-2 mb-4 text-xs font-semibold tracking-widest uppercase text-amber-300">
        <span>Legal & Compliance</span>
        <span>•</span>
        <span>Privacy</span>
      </div>
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-light mb-4 font-serif text-white">Privacy Policy</h1>
      <p class="text-xs sm:text-sm mb-10 pb-6 border-b border-white/10 text-slate-400">
        Last Updated: <strong class="text-slate-200">October 13, 2026</strong> &middot; Transparent Privacy Standards
      </p>

      <div class="p-6 rounded-2xl mb-12 border border-purple-500/20 bg-purple-500/5">
        <h3 class="text-base font-semibold mb-2 text-white">Summary of Our Privacy Commitment</h3>
        <p class="text-sm leading-relaxed text-slate-400">
          At StyleGuru AI (https://www.styleguruai.in), we respect your personal privacy. We process your facial photos transiently in memory solely to analyze skin undertones and compute fashion color palettes—we never store or sell your raw photos. This policy explains how we collect, store, and safeguard your data, and how third-party services like Google AdSense and Firebase operate on our platform.
        </p>
      </div>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">1.</span> Information We Collect</h2>
        <p class="text-sm md:text-base leading-relaxed">
          When you interact with StyleGuru AI, we collect specific categories of information to deliver our personalized fashion recommendations and maintain user accounts:
        </p>
        <ul class="list-disc pl-5 space-y-2 text-sm md:text-base leading-relaxed">
          <li><strong class="text-white">Account & Profile Information:</strong> If you register or authenticate via Firebase Authentication (using Google Sign-In or email/password), we receive your display name, email address, profile picture URL, and a unique Firebase User ID (UID).</li>
          <li><strong class="text-white">Uploaded Images for Fashion & Tone Analysis:</strong> When you upload a selfie or outfit photo to analyze your skin tone or outfit harmony, the image is transmitted securely over HTTPS and processed in-memory using our computer vision algorithms (ITA angle, RGB undertone, and face-shape extraction). Raw facial images are strictly processed in a transient state and are not permanently archived or shared with advertisers.</li>
          <li><strong class="text-white">Style Preferences & Wardrobe Items:</strong> Saved favorite colors, capsule wardrobe selections, and seasonal outfit preferences stored within your account.</li>
          <li><strong class="text-white">Device & Log Information:</strong> Standard technical information such as your browser type, operating system, IP address, device model, referral source, and timestamps, gathered automatically to ensure application security and prevent fraudulent access.</li>
        </ul>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">2.</span> How We Use Your Information</h2>
        <p class="text-sm md:text-base leading-relaxed">
          We use the collected information exclusively for operational, personalized, and administrative purposes:
        </p>
        <ul class="list-disc pl-5 space-y-2 text-sm md:text-base leading-relaxed">
          <li>To compute individual skin tone undertones (warm, cool, neutral, deep, wheatish, olive) and generate matching fabric color recommendations.</li>
          <li>To maintain your secure session, authenticate your identity via Firebase, and restore your saved wardrobe history across devices.</li>
          <li>To monitor system performance, optimize page loading speed, diagnose technical glitches, and protect against security breaches.</li>
          <li>To provide timely customer support when you contact us regarding fashion queries, account management, or technical troubleshooting.</li>
        </ul>
        <p class="text-sm md:text-base leading-relaxed font-semibold text-white">
          We Do Not Sell Personal Data: Under no circumstances do we sell, rent, monetize, or trade your personal information, email address, or uploaded images to third parties or marketing brokers.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">3.</span> Google AdSense & DoubleClick Cookies</h2>
        <p class="text-sm md:text-base leading-relaxed">
          We use <strong class="text-white">Google AdSense</strong> to display advertisements across our public pages in order to support and keep our AI styling advisory services free for users across India.
        </p>
        <p class="text-sm md:text-base leading-relaxed">
          Google, as a third-party vendor, uses cookies to serve ads on our site:
        </p>
        <ul class="list-disc pl-5 space-y-2 text-sm md:text-base leading-relaxed">
          <li>Google's use of advertising cookies (including the DoubleClick cookie) enables it and its advertising partners to serve ads to our users based on their prior visits to StyleGuru AI and/or other websites across the Internet.</li>
          <li>Third-party vendors and ad networks may also place and read cookies on your browser, or use web beacons and IP data to measure ad efficacy and deliver non-personalized or personalized advertising.</li>
        </ul>
        <div class="p-4 rounded-xl mt-4 border border-white/10 bg-white/5 space-y-2">
          <p class="text-sm font-semibold text-white">How You Can Opt Out of Personalized Advertising:</p>
          <p class="text-xs leading-relaxed text-slate-300">
            You can opt out of personalized Google advertising at any time by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" class="underline text-amber-300">Google Ads Settings (https://www.google.com/settings/ads)</a>.
          </p>
          <p class="text-xs leading-relaxed text-slate-300">
            Alternatively, you can opt out of third-party vendor cookies for personalized interest-based advertising by visiting <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" class="underline text-amber-300">AboutAds Choices (https://www.aboutads.info)</a> or the Network Advertising Initiative opt-out page.
          </p>
        </div>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">4.</span> Firebase Authentication & Cloud Storage</h2>
        <p class="text-sm md:text-base leading-relaxed">
          User authentication and profile storage are powered by Google Firebase (Firebase Auth and Google Cloud Firestore). When you sign in using Google OAuth:
        </p>
        <ul class="list-disc pl-5 space-y-2 text-sm md:text-base leading-relaxed">
          <li>Authentication tokens are securely exchanged directly between your browser and Google’s identity servers.</li>
          <li>We do not have access to, nor do we ever handle, your private Google account password.</li>
          <li>All communication between your client and Firebase servers is encrypted using Transport Layer Security (TLS/HTTPS).</li>
        </ul>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">5.</span> Cookies & Local Storage</h2>
        <p class="text-sm md:text-base leading-relaxed">
          Our website utilizes cookies and browser local storage to maintain session continuity, remember your visual theme preference (dark/light mode), preserve language selection, and monitor web traffic analytics.
        </p>
        <p class="text-sm md:text-base leading-relaxed">
          You can configure your browser to reject all cookies or notify you whenever a cookie is placed. However, disabling cookies may prevent certain functional elements of the website (such as staying signed in) from performing as intended.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">6.</span> Data Retention & Deletion Requests</h2>
        <p class="text-sm md:text-base leading-relaxed">
          We retain account data (name, email, and saved color preferences) only for as long as your account remains active or as required to fulfill legal compliance obligations.
        </p>
        <p class="text-sm md:text-base leading-relaxed">
          <strong class="text-white">Your Right to Erasure:</strong> You have the absolute right to request the complete deletion of your account and any associated personal data at any time. To request complete data erasure:
        </p>
        <ul class="list-disc pl-5 space-y-2 text-sm md:text-base leading-relaxed">
          <li>Send an email from your registered account address to <a href="mailto:styleguruai.in@gmail.com" class="underline text-amber-300">styleguruai.in@gmail.com</a> with the subject line <em>"Data Deletion Request"</em>.</li>
          <li>Our administrative team will permanently purge your user profile, saved preferences, and auth records from our Firestore database within 7 business days, confirming completion in writing.</li>
        </ul>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">7.</span> Children's Privacy</h2>
        <p class="text-sm md:text-base leading-relaxed">
          StyleGuru AI is intended for general audiences interested in personal fashion and color styling. We do not knowingly solicit or collect personal identification information from children under the age of 13 (or under 18 without parental consent where mandated by Indian law). If we discover that personal data has been submitted by an unsupervised minor, we will immediately delete that information from our records.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">8.</span> Updates to This Policy</h2>
        <p class="text-sm md:text-base leading-relaxed">
          We may revise this Privacy Policy periodically to reflect enhancements in our AI technology, regulatory updates, or operational adjustments. Any updates will be posted directly to this page with an updated "Last Updated" date at the top. We encourage you to review this policy periodically.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">9.</span> Contacting Our Privacy Officer</h2>
        <p class="text-sm md:text-base leading-relaxed">
          If you have any questions, concerns, or legal notices regarding this Privacy Policy, your rights, or our data handling practices, please contact our designated privacy representative at:
        </p>
        <div class="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-2">
          <p class="font-semibold text-white">StyleGuru AI Privacy & Support Desk</p>
          <p class="text-sm">Email: <a href="mailto:styleguruai.in@gmail.com" class="underline text-amber-300 font-mono">styleguruai.in@gmail.com</a></p>
          <p class="text-sm">Website: <a href="https://www.styleguruai.in" class="underline text-slate-400">https://www.styleguruai.in</a></p>
          <p class="text-xs text-slate-400 mt-2">We respond to all verified privacy and data deletion inquiries within 24 to 48 business hours.</p>
        </div>
      </section>
    </main>
  </div>`
);

// 2b. /about (Target: 500+ words)
writePage(
  '/about',
  'About Us — StyleGuru AI | Intelligent Fashion for Indian Skin Tones',
  'Learn about StyleGuru AI, founded by Vivek Kumar. Discover how our AI uses color science, ITA angles, and undertone classification to provide personalized outfit recommendations tailored for Indian complexions, climates, and budgets.',
  `<div class="public-prerender-content min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-slate-100" style="background:#0B0F1A;">
    <main class="max-w-4xl mx-auto">
      <div class="flex items-center gap-2 mb-4 text-xs font-semibold tracking-widest uppercase text-amber-300">
        <span>About StyleGuru AI</span>
        <span>•</span>
        <span>Our Vision & Technology</span>
      </div>
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-light mb-6 font-serif text-white">Democratizing Personal Styling for Every Indian Complexion</h1>
      <p class="text-lg sm:text-xl font-normal leading-relaxed mb-8 text-slate-200">
        StyleGuru AI was created out of a simple observation: conventional fashion advice and Western seasonal color palettes rarely work for the rich diversity of Indian skin tones, festive wardrobes, or regional climates.
      </p>
      <p class="text-sm sm:text-base leading-relaxed mb-12 text-slate-300">
        Founded by <strong class="text-white">Vivek Kumar</strong>, StyleGuru AI is an Indian artificial intelligence styling companion designed to help everyday shoppers make confident, flattering clothing decisions without spending thousands of rupees on celebrity personal stylists or getting trapped in endless returns on Myntra and Amazon.
      </p>

      <section class="mb-14 space-y-4 text-slate-300">
        <h2 class="text-2xl font-serif text-white">The Indian Wardrobe Dilemma</h2>
        <p class="text-sm sm:text-base leading-relaxed">
          In India, fashion is deeply intertwined with cultural diversity, varied geographic weather patterns, and rich ethnic celebrations—from grand Diwali and Eid family gatherings to royal wedding sangeets and corporate smart-casual workdays.
        </p>
        <p class="text-sm sm:text-base leading-relaxed">
          Yet, when shopping online or browsing retail racks, most Indians face a common hurdle: a kurta, shirt, or saree looks breathtaking on a studio model, but appears washed out, dull, or overwhelming when tried on at home. Why? Because traditional fashion advice relies heavily on European "4-season" color charts (Spring, Summer, Autumn, Winter) designed primarily for Caucasian undertones.
        </p>
        <p class="text-sm sm:text-base leading-relaxed">
          Indian complexions span a glorious spectrum—from fair and porcelain with peach undertones, to golden wheatish, warm olive, dusky bronze, and rich deep melanin tones. An olive-wheatish skin tone requires completely different complementary contrast ratios than a cool-toned fair complexion. When clothing colors clash with your natural undertone, skin can appear fatigued or uneven. When colors harmonize, your complexion instantly glows.
        </p>
      </section>

      <section class="mb-14 p-8 rounded-3xl border border-white/10 bg-white/5 space-y-6">
        <h2 class="text-2xl font-serif text-white">How the Technology Works: In Simple Terms</h2>
        <p class="text-sm sm:text-base leading-relaxed text-slate-300">
          We replace subjective guesswork with scientific color theory and computer vision algorithms. Here is what happens behind the scenes:
        </p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-2">
            <h3 class="text-base font-semibold text-amber-300">1. Facial Tone & ITA Analysis</h3>
            <p class="text-xs leading-relaxed text-slate-300">
              Using standard lighting compensation algorithms, our model evaluates the Individual Typology Angle (ITA) and RGB hue values to accurately classify your skin tone into clear tiers (fair, wheatish, olive, dusky, deep) without permanent image storage.
            </p>
          </div>
          <div class="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-2">
            <h3 class="text-base font-semibold text-amber-300">2. Undertone & Color Harmony</h3>
            <p class="text-xs leading-relaxed text-slate-300">
              We identify your underlying sub-pigmentation (warm, cool, or neutral). Warm undertones flourish in mustard yellows, rust oranges, and emerald greens; cool undertones shine in royal cobalt, jewel rubies, and crisp whites.
            </p>
          </div>
          <div class="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-2">
            <h3 class="text-base font-semibold text-amber-300">3. Cultural & Seasonal Context</h3>
            <p class="text-xs leading-relaxed text-slate-300">
              Our recommendation engine layers your palette with Indian occasion filters: everyday office wear, high-heat summer linens, monsoon breathable cottons, and opulent wedding silhouettes like sherwanis and silk sarees.
            </p>
          </div>
        </div>
      </section>

      <section class="mb-14 space-y-4 text-slate-300">
        <h2 class="text-2xl font-serif text-white">Our Core Mission & Ethics</h2>
        <p class="text-sm sm:text-base leading-relaxed">
          Our guiding mission is to <strong class="text-white">democratize confidence</strong>. Looking sharp and feeling well-dressed should not be a privilege reserved for those with disposable incomes for high-end boutique consultations.
        </p>
        <p class="text-sm sm:text-base leading-relaxed">
          Whether you are putting together an outfit for an engineering job interview in Bengaluru, selecting a festive kurta in Lucknow, or building a versatile 10-piece capsule wardrobe on a college student budget of ₹3,000, StyleGuru AI provides honest, unbiased, algorithmic style clarity.
        </p>
        <p class="text-sm sm:text-base leading-relaxed">
          We celebrate all skin tones equally. There are no "superior" or "inferior" skin complexions in our philosophy—only color palettes that complement your natural beauty and those that distract from it. Our tool exists to celebrate who you are, with no skin lightening filters or unrealistic retouching.
        </p>
      </section>

      <section class="p-8 rounded-3xl border border-purple-500/20 bg-purple-500/5 mb-14 space-y-3">
        <h2 class="text-xl font-serif text-white">Behind the Project</h2>
        <p class="text-sm leading-relaxed text-slate-300">
          StyleGuru AI is developed and maintained by <strong class="text-white">Vivek Kumar</strong> with a passion for computer vision, practical generative AI, and inclusive consumer technology in India.
        </p>
        <p class="text-xs leading-relaxed text-slate-400">
          Have ideas for improvements, feature requests, or partnership inquiries? Feel free to reach out directly to the team via our <a href="/contact" class="underline text-amber-300">Contact Page</a> or email us at <a href="mailto:styleguruai.in@gmail.com" class="underline text-purple-400">styleguruai.in@gmail.com</a>.
        </p>
      </section>

      <div class="text-center py-6">
        <a href="/" class="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl text-white font-medium text-sm no-underline shadow-lg" style="background:linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%);">
          Explore StyleGuru AI Homepage &rarr;
        </a>
      </div>
    </main>
  </div>`
);

// 2c. /terms (Target: 600+ words)
writePage(
  '/terms',
  'Terms & Conditions — StyleGuru AI',
  'Terms and Conditions of Use for StyleGuru AI. Review our service terms, intellectual property policies, user responsibilities, and limitation of liability.',
  `<div class="public-prerender-content min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-slate-100" style="background:#0B0F1A;">
    <main class="max-w-3xl mx-auto">
      <div class="flex items-center gap-2 mb-4 text-xs font-semibold tracking-widest uppercase text-amber-300">
        <span>Legal & Compliance</span>
        <span>•</span>
        <span>Terms of Service</span>
      </div>
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-light mb-4 font-serif text-white">Terms and Conditions</h1>
      <p class="text-xs sm:text-sm mb-10 pb-6 border-b border-white/10 text-slate-400">
        Last Modified: <strong class="text-slate-200">October 13, 2026</strong> &middot; Binding User Agreement
      </p>

      <div class="p-6 rounded-2xl mb-12 border border-purple-500/20 bg-purple-500/5">
        <p class="text-sm leading-relaxed text-slate-300">
          Welcome to StyleGuru AI (https://www.styleguruai.in). By accessing, browsing, registering an account, or uploading images to our platform, you agree to be legally bound by these Terms and Conditions. If you do not agree to all terms outlined herein, please discontinue using the service immediately.
        </p>
      </div>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">1.</span> Acceptance of Terms & Eligibility</h2>
        <p class="text-sm md:text-base leading-relaxed">
          By using this website, you represent and warrant that you are at least 13 years of age (or of legal age under Indian law or the jurisdiction of your residence to enter into a binding contract). If you are accessing StyleGuru AI on behalf of another entity, you represent that you possess the authority to bind that entity to these terms.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">2.</span> Description of Service</h2>
        <p class="text-sm md:text-base leading-relaxed">
          StyleGuru AI provides an artificial-intelligence powered personal fashion advisory platform. Our features include:
        </p>
        <ul class="list-disc pl-5 space-y-2 text-sm md:text-base leading-relaxed">
          <li>Automated skin tone and undertone classification (evaluating ITA coordinates and RGB color spectrums).</li>
          <li>Curated color palette recommendations matched to Indian complexions, cultural occasions, and regional climates.</li>
          <li>Wardrobe planning utilities, outfit harmony checkers, and links to relevant fashion products.</li>
        </ul>
        <p class="text-sm md:text-base leading-relaxed">
          We continually evolve our algorithms. We reserve the right to alter, upgrade, suspend, or discontinue any feature or service without prior liability.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">3.</span> Nature of Advice: Informational & Aesthetic Suggestions</h2>
        <p class="text-sm md:text-base leading-relaxed">
          <strong class="text-white">Suggestions Only:</strong> All color recommendations, wardrobe suggestions, and styling scores generated by StyleGuru AI are algorithmic aesthetic opinions designed purely for style inspiration. They do not constitute certified professional personal styling, dermatological, medical, or bespoke tailor advice.
        </p>
        <p class="text-sm md:text-base leading-relaxed">
          Lighting conditions, smartphone camera sensors, ambient shadows, and display calibration can cause variations in detected skin tones. We encourage users to treat our insights as an empowering guide while making purchasing choices according to their personal taste, comfort, and budget.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">4.</span> User Accounts & Security</h2>
        <p class="text-sm md:text-base leading-relaxed">
          When you create an account via Firebase Authentication (using Google OAuth or email sign-in), you are responsible for maintaining the confidentiality of your login credentials and all activities that occur under your account.
        </p>
        <p class="text-sm md:text-base leading-relaxed">
          You agree to notify us immediately at <a href="mailto:styleguruai.in@gmail.com" class="underline text-amber-300">styleguruai.in@gmail.com</a> if you detect any unauthorized access to your account. We will not be liable for any loss resulting from compromised credentials.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">5.</span> Acceptable Use & Image Upload Rules</h2>
        <p class="text-sm md:text-base leading-relaxed">
          When uploading photographs for fashion or tone analysis, you expressly agree that:
        </p>
        <ul class="list-disc pl-5 space-y-2 text-sm md:text-base leading-relaxed">
          <li>You own the copyright or have express authorization to upload the photo.</li>
          <li>You will not upload any content that is obscene, defamatory, unlawful, sexually suggestive, or depicts minors without parental consent.</li>
          <li>You will not use automated scrapers, bots, or extraction scripts to reverse-engineer our recommendation endpoints or overwhelm our server infrastructure.</li>
        </ul>
        <p class="text-sm md:text-base leading-relaxed">
          Any violation of these rules may lead to immediate suspension or termination of your account access without prior notice.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">6.</span> Intellectual Property Rights</h2>
        <p class="text-sm md:text-base leading-relaxed">
          All code, proprietary recommendation logic, user interface designs, logos, graphics, color harmonies, and articles published on StyleGuru AI are the exclusive intellectual property of StyleGuru AI and founder Vivek Kumar, protected under Indian and international copyright and trademark laws.
        </p>
        <p class="text-sm md:text-base leading-relaxed">
          You are granted a limited, revocable, non-exclusive license to use the service for personal, non-commercial fashion discovery. You may not copy, reproduce, resell, or distribute our platform assets without prior written consent.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">7.</span> Advertising & Third-Party Retail Links</h2>
        <p class="text-sm md:text-base leading-relaxed">
          Our website displays third-party advertisements served by <strong class="text-white">Google AdSense</strong>. We do not endorse or control the products, claims, or services advertised in third-party banners. Your interactions with advertisers are governed strictly by the advertiser's individual terms and privacy policies.
        </p>
        <p class="text-sm md:text-base leading-relaxed">
          StyleGuru AI may also display curated search terms or links to external retail platforms (such as Amazon, Myntra, or brand storefronts) to assist with style exploration. We do not charge referral fees, nor are we responsible for orders, product quality, returns, pricing changes, or shipping policies of third-party merchants.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">8.</span> Limitation of Liability</h2>
        <p class="text-sm md:text-base leading-relaxed">
          To the maximum extent permitted by applicable law, StyleGuru AI, its founder, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or satisfaction resulting from:
        </p>
        <ul class="list-disc pl-5 space-y-2 text-sm md:text-base leading-relaxed">
          <li>Your access to or inability to access the service.</li>
          <li>Any clothing purchases made based on AI style suggestions.</li>
          <li>Any technical downtime, server maintenance, or accuracy variance in analysis.</li>
        </ul>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">9.</span> Governing Law & Dispute Resolution</h2>
        <p class="text-sm md:text-base leading-relaxed">
          These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts in India.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">10.</span> Contact Us Regarding Terms</h2>
        <p class="text-sm md:text-base leading-relaxed">
          For any questions, legal notices, or inquiries regarding these Terms and Conditions, please contact us at:
        </p>
        <div class="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-2">
          <p class="font-semibold text-white">StyleGuru AI Legal Inquiries</p>
          <p class="text-sm">Email: <a href="mailto:styleguruai.in@gmail.com" class="underline text-amber-300 font-mono">styleguruai.in@gmail.com</a></p>
          <p class="text-xs text-slate-400 mt-2">Also review our companion <a href="/privacy-policy" class="underline text-purple-400">Privacy Policy</a> and <a href="/disclaimer" class="underline text-purple-400">Disclaimer</a>.</p>
        </div>
      </section>
    </main>
  </div>`
);

// 2d. /disclaimer (Target: 400+ words)
writePage(
  '/disclaimer',
  'Disclaimer — StyleGuru AI | Fashion Advisory Disclosures',
  'Official Disclaimer for StyleGuru AI. Important disclosures regarding AI style suggestions, skin tone detection variance, external shopping links, and non-medical fashion advisory.',
  `<div class="public-prerender-content min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-slate-100" style="background:#0B0F1A;">
    <main class="max-w-3xl mx-auto">
      <div class="flex items-center gap-2 mb-4 text-xs font-semibold tracking-widest uppercase text-amber-300">
        <span>Legal & Transparency</span>
        <span>•</span>
        <span>Disclaimer</span>
      </div>
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-light mb-4 font-serif text-white">General Disclaimer & Fashion Advisory Disclosures</h1>
      <p class="text-xs sm:text-sm mb-10 pb-6 border-b border-white/10 text-slate-400">
        Last Updated: <strong class="text-slate-200">October 13, 2026</strong> &middot; Transparency Declaration
      </p>

      <div class="p-6 rounded-2xl mb-12 border border-purple-500/20 bg-purple-500/5">
        <p class="text-sm leading-relaxed text-slate-300">
          The information, color palettes, and outfit recommendations provided on StyleGuru AI (https://www.styleguruai.in) are offered in good faith for general lifestyle, aesthetic inspiration, and wardrobe guidance. Please read this disclaimer carefully to understand the scope and limitations of our automated tools.
        </p>
      </div>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">1.</span> Aesthetic Suggestions & Subjectivity</h2>
        <p class="text-sm md:text-base leading-relaxed">
          Style is deeply personal. All color harmony ratings, contrast suggestions, fabric recommendations, and capsule wardrobe formulas generated by StyleGuru AI are algorithmic calculations based on color theory and machine learning models.
        </p>
        <p class="text-sm md:text-base leading-relaxed">
          They are intended as creative suggestions and style inspiration—not absolute rules or professional bespoke fashion consultations. What looks flattering or feels empowering depends on individual personality, cultural comfort, silhouette preference, and personal flair. We strongly encourage you to wear what makes you feel most confident.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">2.</span> Lighting, Sensor & Calibration Variance</h2>
        <p class="text-sm md:text-base leading-relaxed">
          Our computer vision model analyzes skin tone and undertones based on user-uploaded selfies. However, digital images are significantly influenced by external variables beyond our algorithmic control, including:
        </p>
        <ul class="list-disc pl-5 space-y-2 text-sm md:text-base leading-relaxed">
          <li>Ambient lighting (harsh fluorescent indoor bulbs vs. natural golden-hour daylight vs. backlighting).</li>
          <li>Smartphone camera sensor processing, automatic HDR retouching, and white balance calibration.</li>
          <li>Display screen calibration, brightness levels, and night-shift / blue-light filter settings on your device.</li>
        </ul>
        <p class="text-sm md:text-base leading-relaxed">
          Consequently, an analysis performed in dim yellow artificial lighting may produce different undertone metrics than one taken in indirect natural morning daylight. For best results, we always advise users to take photos in clear, indirect natural light without beauty filters.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">3.</span> Non-Medical / Non-Dermatological Advice</h2>
        <p class="text-sm md:text-base leading-relaxed">
          StyleGuru AI's skin tone classification (evaluating ITA angles and color RGB values) is strictly an aesthetic color-matching tool designed for clothing harmony.
        </p>
        <p class="text-sm md:text-base leading-relaxed">
          It is <strong class="text-white">not</strong> a clinical, medical, or dermatological diagnostic tool. It should not be used to assess skin health, conditions, pigmentation disorders, or medical needs. If you have concerns regarding your skin health, always consult a qualified healthcare professional or certified dermatologist.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">4.</span> External Product & Shopping Links</h2>
        <p class="text-sm md:text-base leading-relaxed">
          StyleGuru AI may display keyword suggestions or links to third-party retail platforms (such as Amazon India, Myntra, Flipkart, or partner fashion labels) solely to assist users in discovering fabrics, shades, and styles matching their recommended color palette.
        </p>
        <p class="text-sm md:text-base leading-relaxed">
          StyleGuru AI does not own, manufacture, sell, or ship any apparel or accessories. We do not charge users any referral fees, nor are we responsible for product quality, order fulfillment, delivery, pricing discrepancies, or return policies of third-party merchants.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">5.</span> Third-Party Advertising (Google AdSense)</h2>
        <p class="text-sm md:text-base leading-relaxed">
          This website displays third-party advertisements served through Google AdSense. These advertisements are labeled with "Advertisement" or similar disclosures. The presence of an advertisement on StyleGuru AI does not constitute an endorsement, recommendation, or warranty of the products or services offered by the advertiser.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">6.</span> External Links Disclaimer</h2>
        <p class="text-sm md:text-base leading-relaxed">
          StyleGuru AI may contain links to external websites that are not provided or maintained by or in any way affiliated with us. Please note that StyleGuru AI does not guarantee the accuracy, relevance, timeliness, or completeness of any information on external websites.
        </p>
      </section>

      <section class="mb-10 pb-8 border-b border-white/10 space-y-4 text-slate-300">
        <h2 class="text-xl md:text-2xl font-serif text-white"><span class="text-amber-300 mr-2 text-sm font-sans font-semibold">7.</span> Questions Regarding This Disclaimer</h2>
        <p class="text-sm md:text-base leading-relaxed">
          If you have any questions or require further clarification regarding our disclosures, website terms, or advice limitations, please contact:
        </p>
        <div class="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-2">
          <p class="font-semibold text-white">StyleGuru AI Transparency Desk</p>
          <p class="text-sm">Email: <a href="mailto:styleguruai.in@gmail.com" class="underline text-amber-300 font-mono">styleguruai.in@gmail.com</a></p>
          <p class="text-xs text-slate-400 mt-2">Learn more about our operational ethos on our <a href="/about" class="underline text-purple-400">About Us</a> page.</p>
        </div>
      </section>
    </main>
  </div>`
);

// 2e. /contact (Target: 300+ words)
writePage(
  '/contact',
  'Contact Us — StyleGuru AI | Support & Inquiries',
  'Have questions about skin tone analysis, color palettes, or feature partnerships? Contact the StyleGuru AI team directly. We respond within 24 to 48 hours.',
  `<div class="public-prerender-content min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-slate-100" style="background:#0B0F1A;">
    <main class="max-w-4xl mx-auto">
      <div class="flex items-center gap-2 mb-4 text-xs font-semibold tracking-widest uppercase text-amber-300">
        <span>Support & Helpdesk</span>
        <span>•</span>
        <span>Contact</span>
      </div>
      <h1 class="text-3xl sm:text-4xl md:text-5xl font-light mb-4 font-serif text-white">Get in Touch with Our Team</h1>
      <p class="text-sm sm:text-base leading-relaxed mb-10 pb-6 border-b border-white/10 text-slate-400">
        Whether you have feedback on outfit recommendations, want to report a bug, have questions about data privacy, or are exploring partnerships, we are here to help.
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        <div class="lg:col-span-5 space-y-6">
          <div class="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
            <h2 class="text-lg font-serif text-white">Official Communication Channel</h2>
            <p class="text-xs sm:text-sm leading-relaxed text-slate-400">
              We believe in direct, reliable support. Please send any inquiries to our primary email desk below:
            </p>
            <div class="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
              <p class="text-[10px] uppercase font-bold tracking-wider text-amber-300">Primary Email</p>
              <a href="mailto:styleguruai.in@gmail.com" class="text-sm font-medium underline break-all text-slate-200">
                styleguruai.in@gmail.com
              </a>
            </div>
            <div class="p-4 rounded-xl border border-white/10 bg-white/5 space-y-1">
              <p class="text-[10px] uppercase font-bold tracking-wider text-amber-300">Typical Response Time</p>
              <p class="text-xs text-slate-400">Within 24 to 48 business hours (Monday – Saturday, IST)</p>
            </div>
          </div>

          <div class="p-6 rounded-2xl border border-purple-500/20 bg-purple-500/5 space-y-2">
            <h3 class="text-sm font-semibold text-white">Privacy & Data Deletion</h3>
            <p class="text-xs leading-relaxed text-slate-400">
              Need your account or uploaded history removed? Email <a href="mailto:styleguruai.in@gmail.com" class="underline text-purple-400 font-medium">styleguruai.in@gmail.com</a> with <em>"Data Deletion Request"</em> in the subject line, and we will purge your profile within 7 business days.
            </p>
          </div>
        </div>

        <div class="lg:col-span-7">
          <div class="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/5 space-y-4">
            <h2 class="text-xl font-serif text-white">Direct Message Inquiries</h2>
            <p class="text-xs text-slate-400">
              You can reach out to our desk for any of the following topics:
            </p>
            <ul class="space-y-3 text-xs text-slate-300">
              <li class="p-3 rounded-xl bg-white/5 border border-white/10"><strong>General Inquiry / Feedback:</strong> Platform impressions, usability suggestions, or compliments.</li>
              <li class="p-3 rounded-xl bg-white/5 border border-white/10"><strong>Style or Skin Tone Question:</strong> Questions regarding color harmony, fabric textures, or undertone classification.</li>
              <li class="p-3 rounded-xl bg-white/5 border border-white/10"><strong>Bug Report / Glitch:</strong> Technical glitches encountered during camera scanning or account sync.</li>
              <li class="p-3 rounded-xl bg-white/5 border border-white/10"><strong>Partnership / Media:</strong> Collaborative projects, interviews, and brand synergies.</li>
            </ul>
            <p class="text-xs text-slate-400 pt-2">
              To send a direct message, email us at <a href="mailto:styleguruai.in@gmail.com" class="underline text-amber-300">styleguruai.in@gmail.com</a> with your details.
            </p>
          </div>
        </div>
      </div>

      <section class="p-8 rounded-3xl border border-white/10 bg-white/5 mb-8 space-y-6">
        <h2 class="text-xl font-serif text-white">Frequently Asked Questions</h2>
        <div class="space-y-4 text-sm text-slate-300">
          <div>
            <h3 class="font-semibold text-white mb-1">Is StyleGuru AI free to use?</h3>
            <p class="text-slate-400 leading-relaxed text-xs sm:text-sm">
              Yes! All core features—including selfie skin tone analysis, palette generation, and capsule wardrobe recommendations—are completely free for users.
            </p>
          </div>
          <div>
            <h3 class="font-semibold text-white mb-1">Do you store my uploaded photos?</h3>
            <p class="text-slate-400 leading-relaxed text-xs sm:text-sm">
              No. Images uploaded for analysis are processed transiently in server memory to calculate color coordinates and are not permanently saved on our servers.
            </p>
          </div>
          <div>
            <h3 class="font-semibold text-white mb-1">How can I suggest a new feature or festival outfit palette?</h3>
            <p class="text-slate-400 leading-relaxed text-xs sm:text-sm">
              We love hearing from our community! Simply email <a href="mailto:styleguruai.in@gmail.com" class="underline text-amber-300">styleguruai.in@gmail.com</a> with your suggestions.
            </p>
          </div>
          <div>
            <h3 class="font-semibold text-white mb-1">How accurate is the AI skin tone and undertone detection?</h3>
            <p class="text-slate-400 leading-relaxed text-xs sm:text-sm">
              Our computer vision model uses Individual Typology Angle (ITA) calculations and RGB hue mapping calibrated specifically for diverse Indian complexions. For the most accurate classification, upload a clear selfie taken in indirect natural daylight without camera filters, heavy sunglasses, or harsh indoor artificial lighting.
            </p>
          </div>
          <div>
            <h3 class="font-semibold text-white mb-1">How quickly will I receive a reply from customer support?</h3>
            <p class="text-slate-400 leading-relaxed text-xs sm:text-sm">
              Our team monitors the styleguruai.in@gmail.com desk from Monday through Saturday (10:00 AM – 7:00 PM IST). We provide an initial email acknowledgment within 24 business hours and aim to resolve all style queries and technical bug reports within 48 business hours.
            </p>
          </div>
        </div>
      </section>
    </main>
  </div>`
);

// ── 3. Pre-render Blog Index (/blog) ──
console.log('[Pre-render] Generating /blog index page...');
const blogListCards = posts
  .map(
    (p, idx) => `
    <article class="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3 flex flex-col justify-between">
      <div class="space-y-2">
        <span class="text-xs uppercase tracking-widest text-violet-600 font-bold block">Article #${idx + 1}</span>
        <h2 class="text-xl font-bold text-slate-900 leading-snug">
          <a href="/blog/${p.slug}" class="hover:text-violet-600 no-underline text-slate-900">${escapeHtml(p.title)}</a>
        </h2>
        <p class="text-sm text-slate-600 leading-relaxed">${escapeHtml(p.description)}</p>
      </div>
      <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs font-medium text-slate-400">Published guide</span>
        <a href="/blog/${p.slug}" class="text-xs font-bold text-violet-600 hover:text-violet-800 no-underline">Read Complete Guide &rarr;</a>
      </div>
    </article>`
  )
  .join('\n');

const blogCategoriesNav = `
  <nav class="max-w-5xl mx-auto px-6 mb-10 flex flex-wrap items-center justify-center gap-2 text-xs font-bold" aria-label="Blog Categories">
    <span class="px-4 py-2 rounded-full bg-slate-900 text-white">All Articles (${posts.length})</span>
    <span class="px-4 py-2 rounded-full bg-white text-slate-700 border border-slate-200">🧬 Skin Tone Science</span>
    <span class="px-4 py-2 rounded-full bg-white text-slate-700 border border-slate-200">🎨 Color Theory &amp; Palettes</span>
    <span class="px-4 py-2 rounded-full bg-white text-slate-700 border border-slate-200">👗 Outfits &amp; Styling</span>
    <span class="px-4 py-2 rounded-full bg-white text-slate-700 border border-slate-200">🛍️ Shopping &amp; Wardrobe</span>
  </nav>`;

const blogIndexContent = `
${sharedHeader}
<div class="public-prerender-content min-h-screen bg-[#FAFAFC] text-slate-900 font-sans">
  <header class="py-16 px-6 max-w-5xl mx-auto text-center">
    <span class="inline-block text-xs uppercase tracking-widest text-violet-700 bg-violet-100 px-3 py-1 rounded-full border border-violet-200 font-bold mb-3">StyleGuru AI Knowledge Hub</span>
    <h1 class="text-4xl md:text-5xl font-serif font-black text-slate-900 mb-4">Fashion &amp; Color Intelligence Blog</h1>
    <p class="text-slate-600 text-base max-w-2xl mx-auto leading-relaxed">
      ${posts.length} in-depth guides covering Indian skin tones, undertones, festival wear, wedding styling, and color coordination calibrated specifically for Indian complexions.
    </p>
  </header>
  ${blogCategoriesNav}
  <main class="max-w-5xl mx-auto px-6 pb-20">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      ${blogListCards}
    </div>
  </main>
</div>
${sharedFooter}`;

writePage(
  '/blog',
  'Fashion & Color Intelligence Blog — StyleGuru AI',
  `Explore comprehensive styling guides, color theory breakdowns, and wardrobe advice calibrated for Indian skin tones, festive occasions, and seasonal weather. Featuring ${posts.length} articles.`,
  blogIndexContent
);

// ── 4. Pre-render All Blog Article Pages (/blog/[slug]) ──
console.log(`[Pre-render] Generating ${posts.length} static blog post HTML files WITHOUT boilerplate...`);

for (let i = 0; i < posts.length; i++) {
  const p = posts[i];
  const related = [
    posts[(i + 1) % posts.length],
    posts[(i + 2) % posts.length],
    posts[(i + 3) % posts.length]
  ];

  const sectionsHtml = p.sections
    .map(
      s => `
      <section class="mb-8">
        <h2 class="text-2xl font-serif font-bold text-slate-900 mb-3">${escapeHtml(s.heading)}</h2>
        <p class="text-slate-700 leading-relaxed text-base">${escapeHtml(s.body)}</p>
      </section>
    `
    )
    .join('\n');

  const relatedHtml = related
    .map(
      r => `
      <li class="p-4 rounded-xl border border-slate-200 bg-slate-50 mb-3">
        <a href="/blog/${r.slug}" class="text-sm font-bold text-violet-700 hover:underline block">${escapeHtml(r.title)}</a>
        <p class="text-xs text-slate-600 mt-1">${escapeHtml(r.description)}</p>
      </li>
    `
    )
    .join('\n');

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.description,
    author: {
      '@type': 'Person',
      name: 'Vivek Kumar',
      jobTitle: 'Founder & AI Stylist'
    },
    publisher: {
      '@type': 'Organization',
      name: 'StyleGuru AI',
      url: BASE_URL,
      logo: `${BASE_URL}/logo.png`
    },
    mainEntityOfPage: `${BASE_URL}/blog/${p.slug}`
  });

  const extraHead = `  <script type="application/ld+json">${schemaJson}</script>`;

  const articleContentHtml = `
    ${sharedHeader}
    <div class="min-h-screen bg-[#FAFAFC] text-slate-900 font-sans py-12 px-6">
      <main class="max-w-3xl mx-auto">
        <nav class="mb-8 text-xs font-bold text-slate-500">
          <a href="/blog" class="text-violet-600 hover:underline">&larr; All Articles</a>
          <span class="mx-2">&bull;</span>
          <span>By Vivek Kumar (Founder, StyleGuru AI)</span>
        </nav>
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-black font-serif text-slate-900 tracking-tight leading-tight mb-6">
          ${escapeHtml(p.title)}
        </h1>
        <article class="prose max-w-none text-slate-800 space-y-6">
          ${sectionsHtml}
        </article>
        <section class="mt-12 pt-8 border-t border-slate-200">
          <h3 class="text-lg font-serif font-bold text-slate-900 mb-4">Related Fashion Articles</h3>
          <ul class="list-none p-0 space-y-2">
            ${relatedHtml}
          </ul>
        </section>
      </main>
    </div>
    ${sharedFooter}
  `;

  writePage(`/blog/${p.slug}`, `${p.title} — StyleGuru AI`, p.description, articleContentHtml, extraHead, 'article');
}

console.log(`✅ [Pre-render] Successfully generated all static pages and ${posts.length} blog articles into /dist!`);
