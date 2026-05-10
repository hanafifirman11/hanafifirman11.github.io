export const languages = {
  id: 'Indonesian',
  en: 'English',
};

export const defaultLang = 'en';

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
      "Halo, saya Firman Hanafi. Sehari-hari kerja sebagai Solutions Architect di DOKU, nerjemahin kebutuhan produk jadi sistem yang beneran bisa dibangun sama tim engineering. Di sini saya nulis soal architecture patterns, AI untuk software engineering, dan pelajaran dari project beneran.",
    'hero.cta.blog': 'Baca blog →',
    'hero.cta.portfolio': 'Lihat hasil kerjaan',
    'hero.stats.years': 'Tahun Pengalaman',
    'hero.stats.payment': 'Tahun di Payment Tech',
    'hero.stats.oss': 'Open Source Projects',

    // Blog index
    'blog.eyebrow': 'Writing',
    'blog.h1': 'Esai & catatan',
    'blog.description':
      'Catatan rutin tentang apa yang lagi saya pelajari, biasanya soal architecture, AI di engineering workflow, dan trade-off kecil yang ngebentuk sistem nyata.',
    'blog.empty': 'Belum ada post. Yang pertama lagi di-draft.',
    'blog.allPosts': 'Semua post →',
    'blog.recentWriting': 'Tulisan terbaru',

    // Post layout
    'post.backToBlog': '← Blog',
    'post.backToAllWriting': '← Balik ke semua tulisan',
    'post.discussion': 'Diskusi',
    'post.updated': 'Diperbarui',

    // About page
    'about.eyebrow': 'Tentang Saya',
    'about.h1.line1': 'Scaling Systems,',
    'about.h1.line2': 'Exploring Trails',
    'about.section.education': 'Pendidikan',
    'about.section.whySite': 'Kenapa Bikin Site Ini',
    'about.section.contact': 'Hubungi Saya',
    'about.contact.desc': 'Mau collab, butuh architecture consulting, atau cuma pengen ngobrolin teknologi sama kopi? Boleh banget langsung hubungin saya.',

    // Portfolio page
    'portfolio.eyebrow': 'Portfolio',
    'portfolio.h1': 'Selected Work',
    'portfolio.desc': 'Perjalanan dari Java Programmer ke Solutions Architect, ngebangun payment infrastructure di skala yang lumayan gede. Di bawah ini work experience, projects, dan technical expertise yang saya kumpulin selama jalan.',
    'portfolio.section.experience': 'Work Experience',
    'portfolio.section.projects': 'Projects',
    'portfolio.projects.desc': 'Kontribusi open source, inisiatif engineering internal, dan proyek pribadi yang saya bangun di waktu luang.',
    'portfolio.section.skills': 'Tech Stack & Skills',
    'portfolio.skills.desc': 'Daftar teknologi, tools, dan metodologi yang saya pakai sehari-hari.',
    'portfolio.tab.opensource': '🔓 Open Source',
    'portfolio.tab.notable': '🏢 Notable Work',
    'portfolio.tab.personal': '🧪 Personal',

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
      "A running log of what I'm learning — mostly about architecture, AI in engineering workflows, and the quiet trade-offs that shape real systems.",
    'blog.empty': 'No posts yet. The first one is being drafted.',
    'blog.allPosts': 'All posts →',
    'blog.recentWriting': 'Recent writing',

    // Post layout
    'post.backToBlog': '← Blog',
    'post.backToAllWriting': '← Back to all writing',
    'post.discussion': 'Discussion',
    'post.updated': 'Updated',

    // About page
    'about.eyebrow': 'About Me',
    'about.h1.line1': 'Scaling Systems,',
    'about.h1.line2': 'Exploring Trails',
    'about.section.education': 'Education',
    'about.section.whySite': 'Why this site',
    'about.section.contact': 'Get in Touch',
    'about.contact.desc': 'Interested in collaboration, architecture consulting, or just a conversation about technology and coffee? Feel free to reach out.',

    // Portfolio page
    'portfolio.eyebrow': 'Portfolio',
    'portfolio.h1': 'Selected work',
    'portfolio.desc': 'A journey from Java Programmer to Solutions Architect, building payment infrastructure at scale. Below are my work experience, projects, and technical expertise.',
    'portfolio.section.experience': 'Work Experience',
    'portfolio.section.projects': 'Projects',
    'portfolio.projects.desc': 'Open source contributions, internal engineering initiatives, and personal builds.',
    'portfolio.section.skills': 'Tech Stack & Skills',
    'portfolio.skills.desc': 'A curated collection of technologies, tools, and methodologies I work with daily.',
    'portfolio.tab.opensource': '🔓 Open Source',
    'portfolio.tab.notable': '🏢 Notable Work',
    'portfolio.tab.personal': '🧪 Personal',

    // Footer
    'footer.builtWith': 'Built with Astro.',
  },
} as const;

export type UiKey = keyof typeof ui[typeof defaultLang];
