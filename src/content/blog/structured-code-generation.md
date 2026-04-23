---
title: "Structured Code Generation: Skeleton First, Always"
description: "Minta AI generate semua kode sekaligus hampir selalu menghasilkan output yang tidak konsisten. Ini framework checkpoint-based generation yang kami pakai di production."
publishedAt: 2026-04-23
category: ai-engineering
tags: ["ai", "claude-code", "code-generation", "engineering", "best-practices"]
draft: false
---

Ada godaan yang hampir tidak bisa dihindari ketika pertama kali pakai Claude Code: minta AI generate seluruh feature sekaligus.

Prompt-nya terlihat efisien: "Buatkan service lengkap untuk fitur X beserta controller, service, repository, dan unit test-nya."

Hasilnya? Kode yang terlihat lengkap, compile tanpa error, tapi:
- Pattern-nya tidak konsisten dengan kode lain di project
- Edge case yang penting tidak di-handle
- Unit test yang ditulis test happy path saja
- Bug tersembunyi yang baru ketahuan setelah di-run

Masalahnya bukan AI-nya. Masalahnya adalah pendekatan "semua sekaligus" yang tidak memberi ruang untuk review dan koreksi di titik-titik kritis.

---

## The Code Generation Hierarchy

Cara yang lebih efektif adalah berpikir tentang code generation sebagai hierarki — dari yang paling abstrak ke yang paling detail:

```
Level 4: Review & Refinement
      ↑
Level 3: Method / Function Implementation
      ↑
Level 2: Component / Class
      ↑
Level 1: Overview / Skeleton
```

Prinsipnya: **selalu mulai dari atas, turun ke bawah secara incremental**.

Kenapa ini lebih baik? Karena kesalahan arah yang dideteksi di Level 1 (skeleton) cost-nya hampir nol — kamu hanya perlu revisi class signature. Kesalahan arah yang dideteksi di Level 3 (setelah ratusan baris ditulis) cost-nya jauh lebih mahal.

---

## Workflow: 5 Step Code Generation

Ini workflow yang kami pakai secara konsisten:

**Step 1: Set Context**

Berikan solution design + constraint + referensi ke kode existing yang relevan. Ini input yang menentukan kualitas semua output selanjutnya.

```
Context:
- Lihat PaymentService sebagai referensi pattern service layer
- Tech stack: Java 21, Spring Boot 3 WebFlux, R2DBC
- Solution design: [paste sequence diagram atau API spec]
- Constraint: [paste dari CLAUDE.md yang relevan]
```

**Step 2: Generate Skeleton**

Minta class signatures dan method signatures saja — tanpa implementasi.

```
Generate skeleton untuk TransferService:
- Class signature dengan constructor injection
- Method signatures sesuai solution design di atas
- Anotasi yang relevan (@Service, @Transactional, dll)
- Import statements
JANGAN isi implementasi method. Kembalikan hanya signature.
```

**Step 3: Review Skeleton — STOP**

Ini titik paling penting yang paling sering diskip.

Review skeleton yang dihasilkan: apakah method signature-nya masuk akal? Apakah parameter types-nya benar? Apakah ada method yang missing? Apakah dependency injection-nya sesuai pattern tim?

Memperbaiki skeleton di sini cost-nya minimal. Memperbaiki setelah implementasi sudah ditulis cost-nya jauh lebih tinggi.

**Step 4: Generate per Layer**

Setelah skeleton disetujui, implementasi layer per layer — jangan sekaligus.

```
Repository layer dulu → review → run tests
Service layer → review → run tests  
Controller layer → review → run tests
```

**Step 5: Generate Tests**

Unit test dan integration test di-generate bersamaan dengan production code — bukan sesudahnya. Ini memastikan test coverage tidak menjadi afterthought.

---

## Checkpoint-Based Generation

Kami pakai struktur checkpoint yang lebih formal untuk feature yang cukup kompleks:

| Checkpoint | Deliverable | Gate |
|---|---|---|
| CP1 | Domain model (entity, DTO) | Review → commit |
| CP2 | Repository layer | Review → run unit tests |
| CP3 | Service layer | Review → run unit tests |
| CP4 | Controller + API | Review → run unit tests |
| CP5 | Integration tests | Review → PR |

**Rule yang tidak bisa dikompromikan: zero tolerance untuk regression.**

Setiap checkpoint, jalankan seluruh test suite — bukan hanya test untuk kode baru. Kalau ada test yang failing yang sebelumnya passing, itu harus di-fix di checkpoint yang sama sebelum lanjut ke checkpoint berikutnya.

---

## Claude Skills: Prompt Template yang Bisa Di-install

Di luar prompt yang ditulis manual, kami menggunakan **Claude Skills** — prompt template yang sudah dikonfigurasi untuk task berulang dan bisa di-install sebagai plugin.

Cara kerjanya:
- Skills disimpan di git registry internal
- Engineer install dengan: `claude plugin install nama-skill@registry`
- Trigger otomatis: Claude mendeteksi task yang cocok dan aktifkan skill yang relevan
- Atau trigger manual: "Gunakan `service-test-generator` untuk generate test suite"

Contoh skills yang kami punya di DOKU:

**`rem-bank-connector`** — Scaffold integration layer baru ke banking partner. Skill ini akan tanya: framework apa (WebFlux/MVC/Play), Java version, package base, pattern auth yang dipakai. Lalu generate boilerplate yang konsisten dengan integrasi bank lain yang sudah ada.

**`service-test-generator`** — Generate test scenarios dari CSV atau spesifikasi. Output: Cucumber scenarios + Testcontainers setup yang sesuai dengan infrastruktur test kami.

Benefit utama skills: **konsistensi**. Engineer junior yang baru join bisa generate kode dengan pola yang sama seperti engineer senior — karena pattern-nya sudah dikodifikasi dalam skill.

---

## Anti-Pattern Code Generation

**Minta semua sekaligus.** Output terlihat lengkap tapi inconsistent dan bug-prone. Selalu incremental.

**Tidak memberikan referensi ke kode existing.** Tanpa referensi, AI tidak tahu pattern tim. Hasilnya: kode yang technically correct tapi stylistically asing di codebase.

**Skip skeleton review.** Kesalahan arah yang ditemukan di level skeleton cost-nya kecil. Setelah implementasi? Mahal.

**Tidak jalankan tests di setiap checkpoint.** Regressions yang tidak terdeteksi di checkpoint awal akan terakumulasi dan makin sulit di-debug di checkpoint selanjutnya.

**Membiarkan AI assume tech stack.** Tanpa CLAUDE.md atau context yang eksplisit, AI mungkin generate kode untuk Spring MVC padahal kamu pakai WebFlux, atau pakai JPA padahal kamu pakai R2DBC. Hasilnya tidak akan compile.

---

## Bagaimana ini Berbeda dari "Vibe Coding"

Ada istilah yang belakangan populer: *vibe coding* — biarkan AI generate apapun, kita tinggal accept dan iterate.

Untuk proyek personal atau prototype, itu fine. Untuk sistem payment production yang menangani transaksi finansial jutaan pengguna, itu bukan option.

Yang membedakan structured code generation dari vibe coding:

1. **Review di setiap checkpoint** — bukan accept secara blind
2. **Test di setiap layer** — sebelum lanjut ke layer berikutnya
3. **Konteks yang eksplisit** — AI tahu persis constraint dan pattern yang berlaku
4. **Engineer yang bertanggung jawab** — AI adalah tool, bukan decision maker

Data dari tim kami: dengan structured approach, accept rate suggestion memang tinggi (99.5%) — tapi karena engineer sudah tahu *kapan* dan *bagaimana* meminta AI untuk menghasilkan sesuatu yang langsung bisa diterima. Bukan karena accept semua tanpa review.

---

## Kesimpulan

Structured code generation bukan tentang mengontrol AI — tapi tentang menggunakan AI dengan cara yang menghasilkan output yang paling berguna.

Skeleton first bukan tentang kurang percaya pada AI. Ini tentang memberi kesempatan untuk koreksi arah sebelum investasi waktu terlalu dalam.

Checkpoint-based generation bukan tentang lambat. Ini tentang memastikan setiap layer solid sebelum membangun layer berikutnya di atasnya.

Kode yang dihasilkan dengan structured approach lebih mudah di-review, lebih konsisten dengan standar tim, dan lebih jarang punya bug tersembunyi yang baru ketahuan di production.

Artikel berikutnya: **token efficiency** — cara kerja hemat tapi akurat, dan kenapa ini penting untuk sesi kerja yang panjang dengan Claude Code.

---

*Artikel ini bagian dari seri **AI-Assisted Software Development** — pengalaman lapangan menggunakan Claude Code di tim engineering payment fintech.*
