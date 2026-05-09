// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import expressiveCode from 'astro-expressive-code';

// ============================================================
// DEPLOYMENT CONFIG — ubah 2 variabel di bawah ini sesuai setup kamu
// ============================================================

// Skenario 1: Pakai GitHub Pages default (username.github.io/repo-name)
//   -> SITE = 'https://hanafifirman11.github.io'
//   -> BASE = '/hanafifirman-site'  (ganti sama nama repo kamu)
//
// Skenario 2: Pakai custom domain (hanafifirman.dev)
//   -> SITE = 'https://hanafifirman.dev'
//   -> BASE = '/'
//
// Skenario 3: Pakai username.github.io (repo name = username.github.io)
//   -> SITE = 'https://hanafifirman11.github.io'
//   -> BASE = '/'

const SITE = 'https://hanafifirman.dev';
const BASE = '/'; // custom domain — BASE tetap '/'

export default defineConfig({
  site: SITE,
  base: BASE,
  i18n: {
    defaultLocale: 'en',
    locales: ['id', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    expressiveCode({
      themes: ['github-dark', 'github-light'],
      themeCssSelector: (theme) => `[data-theme='${theme.name.includes('dark') ? 'dark' : 'light'}']`,
      styleOverrides: {
        borderRadius: '6px',
        codeFontFamily: "'JetBrains Mono', ui-monospace, monospace",
      },
    }),
    mdx(),
    sitemap(),
    tailwind({ applyBaseStyles: false }),
  ],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
});
