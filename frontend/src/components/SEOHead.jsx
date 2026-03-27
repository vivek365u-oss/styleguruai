import { useEffect } from 'react';

export default function SEOHead({ title, description }) {
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

  return null;
}
