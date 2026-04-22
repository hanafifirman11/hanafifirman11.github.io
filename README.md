# Hanafi Firman — Personal Site & Blog

Personal site dan technical blog dibangun dengan [Astro](https://astro.build/), di-deploy ke GitHub Pages. Konten berfokus pada solution architecture, AI engineering, dan engineering leadership.

## Tech stack

- **Astro 5** — static site generator
- **Tailwind CSS** — styling
- **MDX** — Markdown + komponen
- **Shiki / Expressive Code** — syntax highlighting
- **GitHub Actions + GitHub Pages** — CI/CD & hosting

## Struktur project

```
.
├── .github/workflows/deploy.yml   # auto-deploy ke GitHub Pages
├── public/                        # static assets (favicon, images)
├── src/
│   ├── components/                # Astro components (Header, Footer, dll)
│   ├── content/
│   │   ├── blog/                  # ← tulis artikel di sini (.md atau .mdx)
│   │   └── config.ts              # frontmatter schema
│   ├── layouts/                   # page layouts
│   ├── pages/
│   │   ├── index.astro            # homepage
│   │   ├── blog/
│   │   │   ├── index.astro        # blog listing
│   │   │   └── [slug].astro       # dynamic blog detail
│   │   ├── portfolio.astro
│   │   ├── about.astro
│   │   └── rss.xml.js             # RSS feed
│   ├── styles/global.css          # global styles & tema
│   └── consts.ts                  # site-wide config
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

---

## Setup awal (first time)

### 1. Install dependencies

```bash
npm install
```

### 2. Jalankan di local

```bash
npm run dev
```

Buka `http://localhost:4321` — site akan live-reload tiap kamu edit file.

### 3. Build production

```bash
npm run build
npm run preview   # preview hasil build di local
```

---

## Konfigurasi deployment

**Penting:** Sebelum deploy, edit `astro.config.mjs`. Ada 2 variabel yang harus disesuaikan:

```js
// astro.config.mjs
const SITE = 'https://hanafifirman11.github.io';
const BASE = '/hanafifirman-site';  // ← nama repo kamu
```

### Skenario konfigurasi

**A. Pakai repo biasa (misal repo bernama `blog`):**
```js
const SITE = 'https://hanafifirman11.github.io';
const BASE = '/blog';
```
URL akan jadi: `https://hanafifirman11.github.io/blog`

**B. Pakai repo `username.github.io` (repo-nya bernama persis `hanafifirman11.github.io`):**
```js
const SITE = 'https://hanafifirman11.github.io';
const BASE = '/';
```
URL akan jadi: `https://hanafifirman11.github.io` (tanpa path)

**C. Pakai custom domain (misal `hanafifirman.dev`):**
```js
const SITE = 'https://hanafifirman.dev';
const BASE = '/';
```
Plus setup DNS di registrar + custom domain di GitHub Settings → Pages.

---

## Deploy ke GitHub Pages — step by step

### 1. Bikin repo baru di GitHub

Login ke github.com, klik "New repository". Recommended nama: `hanafifirman-site` atau `blog` (terserah kamu, tapi ingat sesuaikan `BASE` di config).

### 2. Push code ke repo

```bash
git init
git add .
git commit -m "Initial commit: site skeleton"
git branch -M main
git remote add origin https://github.com/hanafifirman11/NAMA-REPO.git
git push -u origin main
```

### 3. Enable GitHub Pages

Di repo GitHub:
1. Buka **Settings** → **Pages**
2. Di bagian "Build and deployment", pilih source: **GitHub Actions**
3. Save

### 4. Workflow akan auto-jalan

Begitu kamu push ke `main`, GitHub Actions akan build dan deploy otomatis. Cek progressnya di tab **Actions** di repo. Sekitar 1-2 menit selesai.

Site kamu live di: `https://hanafifirman11.github.io/NAMA-REPO/`

---

## Nulis artikel baru

### 1. Bikin file baru di `src/content/blog/`

Nama file jadi slug URL. Misal `arsitektur-event-driven.md` → URL jadi `/blog/arsitektur-event-driven`.

### 2. Isi frontmatter (wajib)

```markdown
---
title: "Judul artikel kamu"
description: "Ringkasan singkat buat meta description dan listing."
publishedAt: 2026-04-22
category: architecture    # architecture | ai-engineering | leadership | poc | notes
tags: [event-driven, microservices]
draft: false              # true = nggak di-publish
---

Tulis konten di sini, pakai Markdown biasa.
```

### 3. Preview di local

```bash
npm run dev
```

Buka `http://localhost:4321/blog/NAMA-FILE`.

### 4. Publish

```bash
git add .
git commit -m "Post: judul artikel"
git push
```

GitHub Actions auto-deploy. Live dalam 1-2 menit.

---

## Fitur yang tersedia

### Syntax highlighting

Tulis code block dengan bahasa, otomatis ter-highlight:

````markdown
```js
const hello = "world";
```
````

### Dark mode

Toggle di header. Preference disimpan di `localStorage`, otomatis respect `prefers-color-scheme` OS kamu.

### MDX (advanced)

Buat artikel dengan komponen interaktif, ganti ekstensi ke `.mdx`:

```mdx
---
title: "Interactive post"
...
---

import MyComponent from '../../components/MyComponent.astro';

Regular markdown here.

<MyComponent />
```

### RSS feed

Auto-generated di `/rss.xml`. Link sudah ada di footer.

### SEO

Open Graph, Twitter Card, sitemap — semua auto-generated. Cuma pastikan `description` di frontmatter diisi dengan baik.

---

## Customization checklist

Setelah clone, ganti hal-hal ini sesuai info kamu:

- [ ] `src/consts.ts` — nama, URL social media, email, nama site
- [ ] `astro.config.mjs` — `SITE` dan `BASE` URL
- [ ] `src/pages/portfolio.astro` — daftar project dan skill kamu
- [ ] `src/pages/about.astro` — bio dan konten About
- [ ] `public/favicon.svg` — favicon (sekarang pakai "h." default)
- [ ] Hapus atau edit artikel contoh di `src/content/blog/building-this-blog.md`

---

## Troubleshooting

**Build error "Cannot find module"**
Jalankan `npm install` lagi. Kalau masih error, hapus `node_modules` dan `package-lock.json`, terus `npm install` ulang.

**Deploy berhasil tapi site 404**
- Cek `BASE` di `astro.config.mjs` — harus match dengan nama repo kamu
- Cek Settings → Pages → Source: harus "GitHub Actions", bukan "Deploy from branch"

**CSS nggak apply di production**
Biasanya karena `BASE` salah. Path asset jadi ngaco kalau `BASE` nggak sesuai.

**Dark mode flash (FOUC)**
Script di `BaseLayout.astro` udah handle ini. Kalau masih flash, pastikan script `is:inline` nggak kamu hapus.

---

## Command reference

| Command                 | Aksi                                    |
| ----------------------- | --------------------------------------- |
| `npm install`           | Install dependencies                    |
| `npm run dev`           | Local dev server di `localhost:4321`    |
| `npm run build`         | Build ke `./dist/`                      |
| `npm run preview`       | Preview production build di local       |

---

## License

Konten artikel: © Hanafi Firman. Source code: MIT.
