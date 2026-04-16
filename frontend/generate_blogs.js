import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace with your actual Gemini API Key, which you can get for free at Google AI Studio: https://aistudio.google.com/
const API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

if (API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
  console.error('ERROR: Please replace YOUR_GEMINI_API_KEY_HERE with your actual API key at the top of generate_blogs.js');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function generateBlog(question, index) {
  // Using gemini-1.5-flash for speed and lower rate-limits, you could also use gemini-1.5-pro
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

  const prompt = `
You are an expert fashion consultant and SEO writer for Indian demographics.
Write a deep, authoritative blog post solving the following question/topic:
"${question}"

Focus heavily on Trust Building and SEO (Search Engine Optimization). Write as much as needed to provide the absolute best, most highly-detailed answer possible. It should read like an industry-leading article. Break it down with clear headers, bullet points, and actionable tips.

IMPORTANT RULES FOR LINKING:
1. In the main text (for Medium/Quora), naturally insert a hyperlinked anchor text pointing to "https://www.styleguruai.in/". E.g., "Analyze your skin tone for free at [StyleGuru AI](https://www.styleguruai.in/)". Only use standard markdown [Link Text](URL) format. Do this naturally where it fits.
2. At the very bottom of the post, add a section exactly called: "### Social Media Snippets & Backlinks".
3. Inside "Social Media Snippets", provide:
   - Pinterest Pin Description: A short, catchy description with a clear CTA to "Save this pin and find your perfect colors at https://www.styleguruai.in/"
   - Instagram Reel Caption: A highly engaging caption with emojis, hashtags, and a clear directive: "Want to find your perfect colors? Link in bio ➡️ @StyleGuruAI (styleguruai.in)"
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Save to file
    const safeTitle = question.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 50);
    const fileName = `${index.toString().padStart(3, '0')}_${safeTitle}.md`;
    const outputDir = path.join(__dirname, 'blogs');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    fs.writeFileSync(path.join(outputDir, fileName), `# ${question}\n\n${text}`);
    console.log(`Generated: ${fileName}`);
    
    // Sleep for 5 seconds to avoid API rate limits
    await new Promise(r => setTimeout(r, 5000));
  } catch (err) {
    console.error(`Failed to generate: ${question}`, err.message);
  }
}

async function main() {
  const questionsPath = path.join(__dirname, 'questions.json');
  if (!fs.existsSync(questionsPath)) {
    console.error('questions.json not found! Make sure you run this script from the folder containing it.');
    return;
  }
  
  const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
  console.log(`Found ${questions.length} questions. Starting generation...`);
  
  const outputDir = path.join(__dirname, 'blogs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  console.log(`Blogs will be saved in: ${outputDir}`);
  
  for (let i = 0; i < questions.length; i++) {
    console.log(`\nProcessing ${i + 1}/${questions.length}: ${questions[i]}`);
    await generateBlog(questions[i], i + 1);
  }
  
  console.log('\nAll blogs generated successfully in the "blogs" folder!');
}

main();
