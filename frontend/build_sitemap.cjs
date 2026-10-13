/**
 * build_sitemap.cjs
 * Auto-generates sitemap.xml from blogPosts.js data + static pages
 */
const fs = require('fs');
const path = require('path');

const BLOGS_DIR = path.join(__dirname, 'blogs');
const OUTPUT = path.join(__dirname, 'public', 'sitemap.xml');
const BASE = 'https://www.styleguruai.in';

// Static pages
const staticPages = [
  { loc: '/',               changefreq: 'weekly',  priority: '1.0' },
  { loc: '/about',          changefreq: 'monthly', priority: '0.8' },
  { loc: '/privacy-policy', changefreq: 'monthly', priority: '0.8' },
  { loc: '/contact',        changefreq: 'monthly', priority: '0.8' },
  { loc: '/terms',          changefreq: 'monthly', priority: '0.8' },
  { loc: '/disclaimer',     changefreq: 'monthly', priority: '0.8' },
  { loc: '/blog',           changefreq: 'daily',   priority: '0.9' },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Read all blog markdown files to extract titles -> slugs
const files = fs.readdirSync(BLOGS_DIR).filter(f => f.endsWith('.md')).sort();
const blogSlugs = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(BLOGS_DIR, file), 'utf-8');
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    blogSlugs.push(slugify(titleMatch[1].trim()));
  }
}

console.log(`Found ${blogSlugs.length} blog posts for sitemap.`);

// Build XML
const today = new Date().toISOString().slice(0, 10);

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

// Static pages
for (const page of staticPages) {
  xml += `  <url>
    <loc>${BASE}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
}

// Blog posts
for (const slug of blogSlugs) {
  xml += `  <url>
    <loc>${BASE}/blog/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;
}

xml += `</urlset>
`;

fs.writeFileSync(OUTPUT, xml, 'utf-8');
const DIST_OUTPUT = path.join(__dirname, 'dist', 'sitemap.xml');
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  fs.writeFileSync(DIST_OUTPUT, xml, 'utf-8');
}
console.log(`✅ Sitemap written with ${staticPages.length + blogSlugs.length} URLs to ${OUTPUT} and dist/`);
