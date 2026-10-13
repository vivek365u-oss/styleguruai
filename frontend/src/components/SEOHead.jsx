import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEOHead({ title, description, image = 'https://www.styleguruai.in/og-image.svg' }) {
  const location = useLocation();
  const canonicalUrl = `https://www.styleguruai.in${location.pathname}`;

  useEffect(() => {
    // 1. Title
    const prevTitle = document.title;
    document.title = title;

    // Helper to safely set or create a meta tag
    const setMetaTag = (attribute, attrValue, content) => {
      let element = document.querySelector(`meta[${attribute}="${attrValue}"]`);
      let created = false;
      const prevContent = element ? element.getAttribute('content') : null;

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, attrValue);
        document.head.appendChild(element);
        created = true;
      }
      element.setAttribute('content', content);

      return () => {
        if (created && element.parentNode) {
          document.head.removeChild(element);
        } else if (element && prevContent !== null) {
          element.setAttribute('content', prevContent);
        }
      };
    };

    // Helper to set or create a link tag
    const setLinkTag = (rel, href) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      let created = false;
      const prevHref = element ? element.getAttribute('href') : null;

      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
        created = true;
      }
      element.setAttribute('href', href);

      return () => {
        if (created && element.parentNode) {
          document.head.removeChild(element);
        } else if (element && prevHref !== null) {
          element.setAttribute('href', prevHref);
        }
      };
    };

    // Apply Meta Tags
    const cleanups = [
      setMetaTag('name', 'description', description || ''),
      setMetaTag('property', 'og:title', title),
      setMetaTag('property', 'og:description', description || ''),
      setMetaTag('property', 'og:url', canonicalUrl),
      setMetaTag('property', 'og:image', image),
      setMetaTag('name', 'twitter:title', title),
      setMetaTag('name', 'twitter:description', description || ''),
      setMetaTag('name', 'twitter:image', image),
      setLinkTag('canonical', canonicalUrl),
    ];

    return () => {
      document.title = prevTitle;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [title, description, canonicalUrl, image]);

  return null;
}
