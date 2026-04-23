export const SITE = {
  name: 'Firman Hanafi',
  title: 'Firman Hanafi — Solutions Architect',
  description:
    'Solutions Architect with 11+ years in software development. Expert in payment systems architecture, microservices, and AI-assisted engineering.',
  author: 'Firman Hanafi',
  url: 'https://hanafifirman.dev',
  locale: 'id-ID',
  social: {
    github: 'https://github.com/hanafifirman11',
    linkedin: 'https://www.linkedin.com/in/firman-h-032352118/',
    email: 'mailto:hanafi.fh.firman@gmail.com',
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
