export const SITE = {
  name: 'Hanafi Firman',
  title: 'Hanafi Firman — Solution Architect',
  description:
    'Solution architecture, AI engineering, and notes on building software that lasts. Written by Hanafi Firman.',
  author: 'Hanafi Firman',
  url: 'https://hanafifirman11.github.io/hanafifirman-site',
  locale: 'id-ID',
  social: {
    github: 'https://github.com/hanafifirman11',
    linkedin: 'https://www.linkedin.com/in/hanafifirman',
    email: 'mailto:hello@example.com',
  },
};

export const NAV = [
  { label: 'Writing', href: '/blog' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'About', href: '/about' },
];

export const CATEGORIES: Record<string, { label: string; description: string }> = {
  architecture: {
    label: 'Architecture',
    description: 'Solution design, patterns, trade-offs.',
  },
  'ai-engineering': {
    label: 'AI Engineering',
    description: 'Applied AI, LLM tooling, POCs.',
  },
  leadership: {
    label: 'Leadership',
    description: 'Working with engineers, scoping, communication.',
  },
  poc: {
    label: 'POC',
    description: 'Experiments, prototypes, and benchmark notes.',
  },
  notes: {
    label: 'Notes',
    description: 'Shorter thoughts, reading notes, observations.',
  },
};
