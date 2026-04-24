import { ui, defaultLang, type UiKey } from './ui';

export type Lang = 'id' | 'en';

export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/');
  if (first === 'en') return 'en';
  return 'id';
}

export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    return (ui[lang] as Record<string, string>)[key] ?? (ui[defaultLang] as Record<string, string>)[key] ?? key;
  };
}

/**
 * Given the current pathname and target lang, return the equivalent path.
 * Examples:
 *   /blog/some-post  en  →  /en/blog/some-post
 *   /en/blog/some-post  id  →  /blog/some-post
 *   /about  en  →  /en/about
 *   /  en  →  /en
 *   /en  id  →  /
 */
export function getLocalizedPath(pathname: string, targetLang: Lang): string {
  // Strip trailing slash except root
  const clean = pathname.replace(/\/$/, '') || '/';

  if (targetLang === 'en') {
    // Current is already /en/... — no change needed
    if (clean.startsWith('/en')) return clean;
    // Root → /en
    if (clean === '/') return '/en';
    // /foo/bar → /en/foo/bar
    return `/en${clean}`;
  } else {
    // targetLang === 'id' — strip /en prefix
    if (clean === '/en') return '/';
    if (clean.startsWith('/en/')) return clean.slice(3);
    return clean;
  }
}
