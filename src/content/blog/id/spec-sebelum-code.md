---
title: "Spec Sebelum Code: 4 Skenario yang Perlu Kamu Tahu"
description: "Garbage in, garbage out. Kualitas output AI berbanding lurus dengan kualitas spec yang kamu berikan. Ini 4 skenario spec yang berbeda dan cara pendekatannya."
publishedAt: 2026-04-23
category: ai-engineering
tags: ["ai", "claude-code", "spec", "code-generation", "engineering-workflow"]
draft: false
---

Ada satu prinsip yang berlaku konsisten di AI-assisted development:

> *Output Quality = f(Input Quality)*

Ini bukan metafora. Ini pengamatan empiris dari ratusan sesi Claude Code di codebase production kami.

Ketika engineer memberikan prompt yang spesifik dengan konteks yang jelas, output AI hampir selalu layak sebagai starting point yang solid. Ketika prompt-nya ambigu dan tanpa konteks, AI akan menebak — dan tebakan AI tentang stack teknologi, pattern yang dipakai, atau business logic spesifik hampir selalu salah.

Bayangkan kamu hire seorang kontraktor untuk renovasi rumah. Semakin detail brief yang kamu berikan — material, ukuran, constraint anggaran, preferensi estetika — semakin sedikit revisi yang diperlukan. AI bekerja dengan logika yang sama.

---

## CLAUDE.md: Kontrak Permanen dengan AI

Sebelum masuk ke 4 skenario, ada satu setup yang perlu dilakukan sekali dan berlaku permanen untuk seluruh project: **CLAUDE.md**.

CLAUDE.md adalah file yang dibaca Claude Code di awal setiap sesi. Isinya adalah konteks project yang tidak perlu diulang setiap kali prompt — tech stack, konvensi kode, pattern yang dipakai, dan hal-hal yang tidak boleh dilakukan AI tanpa persetujuan eksplisit.

Contoh CLAUDE.md untuk project Spring Boot kami:

```markdown
# Project: payment-service-api

## Tech Stack
- Java 21, Spring Boot 3 WebFlux, R2DBC, PostgreSQL, Kafka

## Conventions
- Gunakan DatabaseClient (bukan Spring Data repositories)
- Constructor injection only — jangan @Autowired field injection
- Semua public service method harus punya unit test

## Do Not
- Jangan tambahkan dependency baru tanpa persetujuan eksplisit
- Jangan gunakan Pageable — gunakan Flux<T> streaming
- Jangan ubah API contract yang sudah ada tanpa diskusi

## Reference Patterns
- Lihat PaymentService untuk pola reactive service layer
- Lihat TransferRepository untuk pola database query
```

Dengan CLAUDE.md, Claude Code tidak perlu diberi tahu setiap sesi bahwa project ini pakai WebFlux bukan MVC, atau bahwa kita tidak pakai Spring Data repositories. Konteks ini persisten.

Ini menghemat token yang signifikan dan — yang lebih penting — mengurangi kemungkinan Claude menghasilkan kode dengan pattern yang salah.

---

## Skenario A: Greenfield Project

Project baru dari nol adalah skenario yang paling open-ended, dan karena itu paling mudah salah arah kalau spec tidak jelas.

**Yang perlu didefinisikan sebelum generate kode:**

- Stack dan versi yang eksplisit: Java 21, Spring Boot 3.x, PostgreSQL 15, Kafka 3.x
- Folder structure dan package layout yang diinginkan
- Konvensi naming, error handling, dan logging format
- Module list dengan prioritas — apa yang dibangun pertama

**Prompt pattern yang efektif:**

```
Project: [nama project]
Stack: Java 21, Spring Boot 3, R2DBC, PostgreSQL, Kafka

Package structure:
com.company.service
  ├── domain/
  ├── infrastructure/
  │   ├── persistence/
  │   └── messaging/
  ├── application/
  └── api/

Conventions:
- Reactive: WebFlux + R2DBC
- No Spring Data repositories — gunakan DatabaseClient
- Constructor injection only

Step 1: Setup skeleton — buat struktur folder dan class kosong.
JANGAN mulai implementasi business logic dulu.
```

Kunci di sini adalah **"Step 1"** dan **"JANGAN mulai implementasi"**. Kalau tidak ada instruksi ini, Claude cenderung langsung generate kode implementation — yang terlihat produktif tapi berbahaya karena arah yang salah baru ketahuan setelah banyak kode ditulis.

Review skeleton dulu, konfirmasi arahnya benar, baru lanjut ke implementasi.

---

## Skenario B: Menambahkan Fitur Baru

Ini skenario yang paling sering terjadi di tim kami. Ada service yang sudah berjalan, dan perlu ditambahkan capability baru.

**Yang perlu didefinisikan:**

- Apa yang baru: endpoint baru, table baru, event baru
- Apa yang dimodifikasi: class atau table existing yang perlu berubah
- Apa yang dihapus atau deprecated
- Error scenarios: kondisi apa yang return error, HTTP code apa, error code internal apa

**Prompt pattern yang efektif:**

```
Feature: [nama fitur]
Reference: Lihat [NamaService] yang sudah ada sebagai referensi pattern

Yang baru:
- Endpoint POST /api/v1/[resource]
- Table baru: [nama_table] dengan kolom [list kolom]
- Kafka event: [TOPIC_NAME] dipublish setelah sukses

Yang dimodifikasi:
- [ExistingService]: tambah method [namaMethod]
- [ExistingTable]: tambah kolom [nama_kolom]

Error scenarios:
- [Kondisi A] → 400 ERR_XXX_001
- [Kondisi B] → 409 ERR_XXX_002

Constraint: Jangan ubah API contract yang sudah ada.
Backward compatible dengan versi sebelumnya.

Sebelum generate kode: tunjukkan change plan dulu.
Saya akan konfirmasi sebelum kamu mulai edit file.
```

Instruksi **"tunjukkan change plan dulu"** adalah yang paling penting di skenario ini. Claude akan list semua file yang akan dimodifikasi dan perubahan apa yang akan dilakukan — ini kesempatan untuk catch wrong assumptions sebelum kode ditulis.

---

## Skenario C: Bug Fix

Bug fix punya karakteristik yang berbeda: constraint-nya sangat ketat. Perbaikan harus minimally invasive, tidak boleh mengubah behavior yang sudah berjalan, dan tidak boleh mengubah API contract.

**Yang perlu didefinisikan:**

- Bug ID dan severity
- Reproduction steps yang eksplisit
- Expected behavior vs actual behavior
- Log atau stack trace yang relevan
- Constraint: seberapa "invasif" perbaikan yang diizinkan

**Prompt pattern yang efektif:**

```
Bug: [BUG-ID] - [deskripsi singkat]
Severity: [Critical/High/Medium/Low]

Reproduction steps:
1. [Step 1]
2. [Step 2]
3. [Result yang terjadi]

Expected: [apa yang seharusnya terjadi]
Actual: [apa yang terjadi]

Stack trace:
[paste stack trace di sini]

Constraint:
- Fix harus minimally invasive
- Jangan ubah API contract
- Jangan tambahkan dependency baru

Langkah: Berikan hypothesis dulu tentang root cause.
Saya akan konfirmasi hypothesis sebelum kamu propose fix.
```

"Berikan hypothesis dulu" adalah kunci di bug fix. AI yang langsung propose fix tanpa hypothesis biasanya memperbaiki symptom, bukan root cause. Dengan meminta hypothesis dan mengkonfirmasinya, kita memastikan kita fix masalah yang benar.

---

## Skenario D: Reverse Engineering

Ini skenario yang paling underrated — dan sangat berguna untuk tim yang punya legacy codebase.

Situasinya: ada kode yang sudah berjalan bertahun-tahun, tidak ada dokumentasi, engineer yang menulis sudah tidak ada, dan kamu perlu memahami bagaimana cara kerjanya sebelum melakukan refactoring atau menambahkan fitur.

**Use cases:**
- Onboarding engineer baru ke sistem yang kompleks
- Pre-refactoring analysis
- Security audit
- Membuat dokumentasi yang tidak pernah ada

**Prompt 1 — Architecture overview:**
```
Gunakan Serena untuk navigasi project ini.
Berikan arsitektur overview:
- Layer apa saja yang ada
- Pattern apa yang dipakai (MVC, hexagonal, dll)
- Entry points utama
- Dependency external yang penting
```

**Prompt 2 — Trace satu fitur:**
```
Trace alur [nama fitur] dari entry point sampai ke database.
Format: sequence diagram PlantUML.
Sertakan class name dan method name yang aktual dari codebase.
```

**Prompt 3 — Security audit:**
```
Review [NamaService] untuk potensi masalah keamanan:
- SQL injection
- Missing authentication/authorization
- Input validation yang lemah
- Sensitive data exposure

Format: list temuan dengan severity dan lokasi kode spesifik.
```

Output dari reverse engineering ini menjadi dokumentasi yang sebelumnya tidak ada — dan bisa langsung masuk ke repository sebagai bagian dari onboarding documentation.

---

## Anti-Pattern yang Harus Dihindari

Dari pengalaman kami, ini yang paling sering menyebabkan AI generate kode yang tidak berguna:

**Prompt terlalu pendek.** "Buatkan service untuk transfer uang" adalah instruksi yang terlalu open-ended untuk sistem payment production. AI tidak tahu tech stack kamu, pattern yang dipakai, constraint apa yang ada.

**Tidak ada referensi ke kode existing.** Kalau project sudah punya pattern yang established, selalu tunjukkan satu contoh ke AI. "Ikuti pattern yang sama seperti di PaymentService" menghasilkan output yang jauh lebih konsisten dengan codebase.

**Langsung minta semua sekaligus.** Minta AI generate seluruh feature sekaligus hampir selalu menghasilkan kode yang tidak konsisten. Incremental jauh lebih baik — skeleton dulu, review, baru implementasi layer per layer.

**Tidak memberi constraint.** Tanpa constraint eksplisit, AI membuat asumsi. Di sistem payment, asumsi yang salah bisa berujung ke financial loss atau compliance issue.

**Tidak review hypothesis sebelum fix.** Khusus untuk bug fix: selalu konfirmasi hypothesis root cause sebelum Claude mulai menulis kode perbaikan.

---

## Kesimpulan

Spec yang baik adalah investasi terbaik dalam AI-assisted development. Waktu yang dihabiskan untuk menulis spec yang detail akan kembali berlipat ganda dalam bentuk output yang langsung relevan, revisi yang lebih sedikit, dan kode yang konsisten dengan standar tim.

CLAUDE.md adalah fondasi yang cukup dibuat sekali. Empat skenario spec di atas adalah framework yang bisa langsung dipakai untuk hampir semua situasi development yang ditemui sehari-hari.

Artikel berikutnya: **structured code generation** — kenapa skeleton harus selalu datang sebelum implementasi, dan bagaimana checkpoint-based generation menghasilkan kode yang lebih konsisten dan lebih mudah di-review.

---

*Artikel ini bagian dari seri **AI-Assisted Software Development** — pengalaman lapangan menggunakan Claude Code di tim engineering payment fintech.*
