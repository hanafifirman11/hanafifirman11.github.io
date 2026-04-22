/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter Tight', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#111111',
          muted: '#555555',
          soft: '#888888',
        },
        paper: {
          DEFAULT: '#fafaf7',
          soft: '#f3f2ed',
        },
        accent: {
          DEFAULT: '#c5501a',
          soft: '#e8a37a',
        },
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.ink.DEFAULT'),
            '--tw-prose-headings': theme('colors.ink.DEFAULT'),
            '--tw-prose-links': theme('colors.accent.DEFAULT'),
            '--tw-prose-code': theme('colors.ink.DEFAULT'),
            maxWidth: '68ch',
          },
        },
      }),
    },
  },
  plugins: [],
};
