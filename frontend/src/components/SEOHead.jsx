import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEOHead({ title, description }) {
  const location = useLocation();
  const canonicalUrl = `https://www.styleguruai.in${location.pathname}`;

  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    return () => { document.title = prevTitle; };
  }, [title]);

  useEffect(() => {
    let meta = document.querySelector('meta[name="description"]');
    let created = false;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
      created = true;
    }
    const prevContent = meta.getAttribute('content');
    meta.setAttribute('content', description);
    return () => {
      if (created) {
        document.head.removeChild(meta);
      } else {
        meta.setAttribute('content', prevContent || '');
      }
    };
  }, [description]);

  // Canonical link — critical for Google indexing of SPA pages
  useEffect(() => {
    let link = document.querySelector('link[rel="canonical"]');
    let created = false;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
      created = true;
    }
    link.setAttribute('href', canonicalUrl);
    return () => {
      if (created && link.parentNode) {
        document.head.removeChild(link);
      }
    };
  }, [canonicalUrl]);

  // OG URL meta tag
  useEffect(() => {
    let ogUrl = document.querySelector('meta[property="og:url"]');
    let created = false;
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
      created = true;
    }
    ogUrl.setAttribute('content', canonicalUrl);
    return () => {
      if (created && ogUrl.parentNode) {
        document.head.removeChild(ogUrl);
      }
    };
  }, [canonicalUrl]);

  return null;
}
