import { useParams, Navigate, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import Footer from '../components/Footer';
import { blogPosts } from '../data/blogPosts';

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) return <Navigate to="/404" replace />;

  return (
    <div className="min-h-screen bg-[#050816] text-white" style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <SEOHead
        title={`${post.title} – StyleGuru AI`}
        description={post.description}
      />

      <div className="fixed top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-pink-700/20 blur-[120px] pointer-events-none z-0" />

      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-5 max-w-7xl mx-auto border-b border-gray-800/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">S</div>
          <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">StyleGuru AI</span>
        </Link>
        <Link to="/blog" className="text-gray-400 hover:text-white transition text-sm">← Blog</Link>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-16">
        <div className="inline-block bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs px-4 py-2 rounded-full mb-6">Fashion Blog</div>

        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-white leading-tight">
          {post.title}
        </h1>

        <p className="text-purple-400 text-sm mb-10">
          {new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        <article className="space-y-8">
          {post.sections.map((section, i) => (
            <section key={i} className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
              <h2 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full inline-block flex-shrink-0" />
                {section.heading}
              </h2>
              <p className="text-gray-300 leading-relaxed text-base">{section.body}</p>
            </section>
          ))}
        </article>

        {/* CTA Banner */}
        <div className="mt-12 relative bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-700/40 rounded-3xl p-8 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 blur-2xl pointer-events-none" />
          <div className="relative z-10">
            <div className="text-4xl mb-3">✨</div>
            <h3 className="text-2xl font-extrabold text-white mb-2">Try StyleGuru AI — It's Free!</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              Upload your selfie and get instant AI-powered outfit recommendations based on your skin tone.
            </p>
            <a
              href="https://www.styleguruai.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all px-8 py-3 rounded-full text-white font-bold text-sm shadow-lg shadow-purple-900/50 hover:scale-105"
            >
              🚀 Visit styleguruai.in
            </a>
            <p className="text-gray-600 text-xs mt-4">No credit card required • Instant results</p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link to="/blog" className="text-purple-400 hover:text-purple-300 transition text-sm font-semibold">
            ← Back to Blog
          </Link>
          <a
            href="https://www.styleguruai.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition px-6 py-3 rounded-full text-sm font-semibold text-white"
          >
            Try StyleGuru AI Free ✨
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
