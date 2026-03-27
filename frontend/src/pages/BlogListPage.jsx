import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import { blogPosts } from '../data/blogPosts';

export default function BlogListPage() {
  return (
    <div className="min-h-screen bg-[#050816] text-white" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <SEOHead
        title="Fashion Blog – StyleGuru AI"
        description="Read fashion tips, skin tone guides, and AI styling articles on the StyleGuru AI blog."
      />

      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-pink-700/20 blur-[120px] pointer-events-none z-0" />

      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto border-b border-gray-800/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">S</div>
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">StyleGuru AI</span>
        </Link>
        <Link to="/" className="text-gray-400 hover:text-white transition text-sm">← Home</Link>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <div className="inline-block bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs px-4 py-2 rounded-full mb-6">Fashion Blog</div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Style & Fashion Tips
        </h1>
        <p className="text-gray-400 text-lg mb-12 max-w-2xl">
          Expert advice on skin tones, outfit selection, and how AI is transforming the fashion industry.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="group bg-gray-900/60 border border-gray-800 rounded-2xl p-6 hover:border-purple-600/60 hover:bg-gray-900/80 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-900/20 hover:-translate-y-1 flex flex-col"
            >
              <div className="flex-1">
                <p className="text-purple-400 text-xs font-medium mb-3">
                  {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h2 className="text-white font-bold text-xl mb-3 group-hover:text-purple-300 transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">{post.excerpt}</p>
              </div>
              <Link
                to={`/blog/${post.slug}`}
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
              >
                Read Article <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </article>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
