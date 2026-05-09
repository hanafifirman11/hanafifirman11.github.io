import { ui, defaultLang, type UiKey } from './ui';

export type Lang = 'id' | 'en';

export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/');
  if (first === 'id') return 'id';
  return 'en';
}

export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    return (ui[lang] as Record<string, string>)[key] ?? (ui[defaultLang] as Record<string, string>)[key] ?? key;
  };
}

/**
 * Given the current pathname and target lang, return the equivalent path.
 * Default lang is English (no prefix); Indonesian is prefixed with /id.
 * Examples:
 *   /blog/some-post  id  →  /id/blog/some-post
 *   /id/blog/some-post  en  →  /blog/some-post
 *   /about  id  →  /id/about
 *   /  id  →  /id
 *   /id  en  →  /
 */
export function getLocalizedPath(pathname: string, targetLang: Lang): string {
  const clean = pathname.replace(/\/$/, '') || '/';

  if (targetLang === 'id') {
    if (clean.startsWith('/id')) return clean;
    if (clean === '/') return '/id';
    return `/id${clean}`;
  } else {
    if (clean === '/id') return '/';
    if (clean.startsWith('/id/')) return clean.slice(3);
    return clean;
  }
}
