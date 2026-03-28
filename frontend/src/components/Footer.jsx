import { Link } from 'react-router-dom';

const links = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Contact', to: '/contact' },
  { label: 'Terms', to: '/terms' },
  { label: 'Blog', to: '/blog' },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-gray-800/50 bg-[#050816] px-6 py-10 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">S</div>
        <span className="font-semibold text-gray-300">StyleGuru AI</span>
      </div>
      <div className="flex justify-center flex-wrap gap-4 sm:gap-8 text-sm text-gray-500 mb-4">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="hover:text-purple-400 transition"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <p className="text-gray-600 text-xs">© 2025 StyleGuru AI. All rights reserved.</p>
      <p className="text-gray-600 text-xs mt-2">
        StyleGuru AI is a participant in the Amazon Associates Programme, an affiliate advertising programme designed to provide a means for sites to earn advertising fees by advertising and linking to amazon.in. As an Amazon Associate, we earn from qualifying purchases.
      </p>
    </footer>
  );
}
