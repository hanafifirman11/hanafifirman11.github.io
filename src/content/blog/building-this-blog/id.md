---
title: "Membangun blog ini: trade-off yang saya pilih"
description: "Kenapa saya pilih Astro + GitHub Pages, dan apa yang saya korbankan dengan keputusan itu. Sebuah catatan arsitektur dalam skala kecil."
publishedAt: 2026-04-22
category: architecture
tags: [astro, personal-site, trade-offs, github-pages]
---

Keputusan arsitektur terkecil pun selalu punya trade-off. Membangun blog personal itu bukan proyek enterprise, tapi prinsipnya sama: ada hal yang kamu pilih, dan ada hal yang kamu korbankan.

Ini catatan tentang pilihan yang saya ambil buat site ini, dan kenapa.

## Konteks masalah

Yang saya butuhkan sederhana:

- Tempat nulis artikel teknis tentang arsitektur dan AI engineering
- Bisa embed diagram, code snippet, dan sesekali komponen interaktif
- Loading cepat, pembaca teknis nggak sabar sama site yang lambat
- Total biaya operasional minimal, ini hobi, bukan bisnis
- Saya yang kontrol domain, konten, dan data

## Alternatif yang saya pertimbangkan

Tiga opsi utama yang saya evaluasi:

**Platform siap pakai** (Medium, Hashnode, Dev.to), cepat setup, ada audience built-in. Tapi saya nggak suka platform yang bisa ubah algoritma atau monetisasi unilateral. Lock-in risk-nya nggak sebanding buat content yang niatnya long-lived.

**WordPress self-hosted**: powerful, matang, ekosistem plugin besar. Tapi butuh hosting bayar, database, dan maintenance rutin. Buat blog personal, overhead-nya nggak sepadan.

**Static site generator**: gratis, cepat, full control. Butuh commit via Git, tapi ini nggak jadi masalah karena saya developer.

Pilihan saya jatuh ke static site generator, spesifiknya Astro.

## Kenapa Astro

```js
// astro.config.mjs
export default defineConfig({
  integrations: [mdx(), sitemap(), tailwind()],
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
```

Astro punya beberapa properti yang pas buat use case saya:

1. **Zero JS by default**: output-nya HTML statis. Interaktivitas dibuat opt-in via "islands". Buat blog teks-heavy, ini berarti Lighthouse score 95+ tanpa effort.

2. **MDX support yang rapi**: saya bisa nulis Markdown dengan React/Vue/Svelte component di dalamnya kalau butuh.

3. **Content collections**: frontmatter artikel divalidasi pakai Zod schema. Ini catch typo di field penting sebelum build.

4. **Build speed reasonable**: untuk 100+ artikel, build masih di bawah beberapa detik.

## Apa yang saya korbankan

Setiap keputusan arsitektur punya biaya, dan ini jujur-jujuran:

- **Nggak ada admin UI**. Saya nulis di VS Code, commit via Git. Kalau lagi di HP, nggak bisa nulis. Trade-off yang saya terima karena mostly saya di laptop.
- **Nggak ada komentar built-in**. Kalau mau, saya bisa tambah Giscus (pake GitHub Discussions). Buat sekarang, belum prioritas.
- **Nggak ada newsletter**. Kalau mau, nanti tambah platform terpisah kayak Buttondown atau ConvertKit.

> Prinsip yang saya pegang: optimize untuk kasus yang saya tahu akan sering terjadi, jangan over-engineer untuk kasus yang mungkin nggak pernah datang.

## Deployment: GitHub Pages

Hosting di GitHub Pages, gratis, SSL otomatis (via Let's Encrypt), CI/CD via GitHub Actions. Total biaya: cuma domain (kalau pakai custom domain), sekitar Rp 200rb/tahun.

Dibandingkan setup enterprise yang saya kerjakan sehari-hari, dengan load balancer, multiple availability zone, dan gateway berlapis, ini arsitektur yang sangat sederhana. Dan itu memang intinya. **Kompleksitas harus earned, bukan default.**

## Apa yang akan saya ubah nanti

Beberapa evolusi yang saya antisipasi, tapi belum saya bangun sekarang:

- **Custom domain** (`hanafifirman.dev`), begitu saya konsisten nulis beberapa minggu.
- **Komentar via Giscus**: kalau ada pembaca yang butuh diskusi.
- **Page untuk `/lab`**: showcase POC yang saya kerjakan.
- **Newsletter**: kalau ada cukup subscribers yang minta.

Semua ini bisa ditambahkan nanti tanpa migrasi besar. Itulah salah satu keuntungan dari foundation yang simple.

---

Kalau kamu baca sampai sini dan lagi mikirin bikin blog sendiri: mulai aja dengan yang simple. Kamu bakal belajar lebih banyak dari artikel pertama kamu daripada dari setup yang sempurna.
