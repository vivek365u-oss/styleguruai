import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  const links = [
    { label: t('navHome'), to: '/' },
    { label: t('navAbout'), to: '/about' },
    { label: t('navPrivacy'), to: '/privacy' },
    { label: t('navContact'), to: '/contact' },
    { label: t('navTerms'), to: '/terms' },
    { label: t('navBlog'), to: '/blog' },
  ];

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
      <p className="text-gray-600 text-xs">{t('footerRights')}</p>
      <p className="text-gray-600 text-xs mt-2">
        {t('footerAffiliate')}
      </p>
    </footer>
  );
}
