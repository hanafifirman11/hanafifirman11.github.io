export const languages = {
  id: 'Indonesian',
  en: 'English',
};

export const defaultLang = 'id';

export const ui = {
  id: {
    // Nav
    'nav.blog': 'Writing',
    'nav.portfolio': 'Portfolio',
    'nav.about': 'About',
    'nav.langToggle': 'EN',
    'nav.langToggleLabel': 'Switch to English',

    // Hero (homepage)
    'hero.eyebrow': 'Solutions Architect · AI Engineering · Notes',
    'hero.h1.line1': 'Scaling systems,',
    'hero.h1.line2': 'exploring trails,',
    'hero.h1.line3': 'and writing about it.',
    'hero.description':
      "Hi, I'm Firman Hanafi. I work as a Solutions Architect at DOKU — translating product needs into systems that engineers can actually build. This is where I write about architecture patterns, AI for software engineering, and lessons from real projects.",
    'hero.cta.blog': 'Read the blog →',
    'hero.cta.portfolio': 'See my work',
    'hero.stats.years': 'Years Experience',
    'hero.stats.payment': 'Years in Payment Tech',
    'hero.stats.oss': 'Open Source Projects',

    // Blog index
    'blog.eyebrow': 'Writing',
    'blog.h1': 'Essays & notes',
    'blog.description':
      'A running log of what I\'m learning — mostly about architecture, AI in engineering workflows, and the quiet trade-offs that shape real systems.',
    'blog.empty': 'No posts yet. The first one is being drafted.',
    'blog.allPosts': 'All posts →',
    'blog.recentWriting': 'Recent writing',

    // Post layout
    'post.backToBlog': '← Blog',
    'post.backToAllWriting': '← Back to all writing',
    'post.discussion': 'Diskusi',
    'post.updated': 'Updated',

    // Footer
    'footer.builtWith': 'Built with Astro.',
  },
  en: {
    // Nav
    'nav.blog': 'Writing',
    'nav.portfolio': 'Portfolio',
    'nav.about': 'About',
    'nav.langToggle': 'ID',
    'nav.langToggleLabel': 'Switch to Indonesian',

    // Hero (homepage)
    'hero.eyebrow': 'Solutions Architect · AI Engineering · Notes',
    'hero.h1.line1': 'Scaling systems,',
    'hero.h1.line2': 'exploring trails,',
    'hero.h1.line3': 'and writing about it.',
    'hero.description':
      "Hi, I'm Firman Hanafi. I work as a Solutions Architect at DOKU — translating product needs into systems that engineers can actually build. This is where I write about architecture patterns, AI for software engineering, and lessons from real projects.",
    'hero.cta.blog': 'Read the blog →',
    'hero.cta.portfolio': 'See my work',
    'hero.stats.years': 'Years Experience',
    'hero.stats.payment': 'Years in Payment Tech',
    'hero.stats.oss': 'Open Source Projects',

    // Blog index
    'blog.eyebrow': 'Writing',
    'blog.h1': 'Essays & notes',
    'blog.description':
      'A running log of what I\'m learning — mostly about architecture, AI in engineering workflows, and the quiet trade-offs that shape real systems.',
    'blog.empty': 'No posts yet. The first one is being drafted.',
    'blog.allPosts': 'All posts →',
    'blog.recentWriting': 'Recent writing',

    // Post layout
    'post.backToBlog': '← Blog',
    'post.backToAllWriting': '← Back to all writing',
    'post.discussion': 'Discussion',
    'post.updated': 'Updated',

    // Footer
    'footer.builtWith': 'Built with Astro.',
  },
} as const;

export type UiKey = keyof typeof ui[typeof defaultLang];
