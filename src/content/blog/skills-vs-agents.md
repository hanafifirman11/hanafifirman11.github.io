---
title: "Skills vs Agents di Claude Code: Beda, dan Kapan Pakai Mana"
description: "Skills dan Agents adalah dua mekanisme extensibility di Claude Code yang sering dikira sama. Perbedaannya fundamental — dan salah pilih berarti tool yang salah untuk job yang salah."
publishedAt: 2026-04-23
category: ai-engineering
tags: ["ai", "claude-code", "agents", "skills", "mcp", "engineering"]
draft: false
---

Ketika pertama kali membaca dokumentasi Claude Code, Skills dan Agents terlihat seperti dua nama untuk hal yang sama — keduanya "meng-extend" kemampuan Claude, keduanya bisa dikonfigurasi per project, keduanya bisa dipanggil saat sesi kerja.

Kenyataannya, keduanya bekerja dengan cara yang fundamental berbeda. Dan menggunakan yang salah untuk task yang salah menghasilkan experience yang frustrasi — entah karena AI tidak "ingat" konteks yang sudah diberikan, atau karena task yang seharusnya autonomous malah terus minta konfirmasi.

---

## Perbedaan Paling Fundamental

Cara paling mudah memahami perbedaannya: **di mana mereka berjalan dan apa yang mereka ingat**.

**Skill** berjalan di dalam conversation yang sama. Dia bisa melihat seluruh history conversation — semua yang sudah dibahas, semua yang sudah dijawab, semua konteks yang sudah diberikan. Dia multi-turn: bisa tanya beberapa pertanyaan, ingat jawabannya, dan generate output berdasarkan jawaban-jawaban tersebut.

**Agent** berjalan di context window yang terpisah dan terisolasi. Dia tidak melihat conversation history. Dia menerima satu task, bekerja secara autonomous, dan mengembalikan hasil. Setelah selesai, dia tidak "ingat" apapun — instance-nya berakhir.

Visualisasi sederhana:

```
Main Conversation
├── History: [seluruh percakapan]
├── Skill System Prompt
├── Conversation Q&A
└── ← Skill berjalan di sini, lihat semua ↑

vs.

Main Conversation
└── spawns → [Agent Context Window]
                ├── Task description only
                ├── Allowed tools: [terbatas]
                └── Tidak lihat main conversation history
```

---

## Kapan Pakai Skill

Skill adalah pilihan yang tepat ketika:

**Output berbeda tergantung project/stack.** Skill yang generate integration layer untuk banking partner perlu tahu: framework apa yang dipakai (WebFlux? MVC? Play Framework?), Java version berapa, package base apa. Informasi ini berbeda per project dan perlu di-discover secara interaktif.

**Task butuh multi-turn Q&A.** Skill bisa tanya "Framework mana yang dipakai?" → tunggu jawaban → "Java version berapa?" → tunggu jawaban → generate output berdasarkan semua jawaban tersebut. Ini tidak bisa dilakukan Agent karena Agent tidak multi-turn.

**Perlu akses ke conversation history.** Kalau task bergantung pada konteks yang sudah dibahas sebelumnya dalam sesi ("generate test untuk service yang baru kita buat tadi"), Skill adalah pilihan yang tepat karena dia bisa lihat history tersebut.

**Shared across teams via registry.** Skills diinstall dari git registry dan bisa dishare antar engineer. Ini memastikan semua engineer di tim menggunakan prompt template yang sama untuk task berulang.

**Contoh Skills yang kami punya:**

`rem-bank-connector` — Sebelum generate, skill ini tanya: framework (WebFlux/MVC/Play), Java version, package base, auth pattern yang dipakai. Lalu generate boilerplate yang konsisten dengan integrasi bank lain yang sudah ada di codebase.

`service-test-generator` — Generate Cucumber scenarios + Testcontainers setup dari spesifikasi atau CSV. Skill ini tanya pattern test yang dipakai di project sebelum generate, sehingga output langsung fit dengan infrastruktur test yang ada.

---

## Kapan Pakai Agent

Agent adalah pilihan yang tepat ketika:

**Task autonomous dan well-defined.** Generate CRUD untuk entity `Transaction` dengan field [X, Y, Z] — ini task yang bisa fully specified upfront. Agent menerima instruksi, bekerja, selesai. Tidak perlu bolak-balik tanya.

**Input bisa fully specified di awal.** Tidak ada discovery yang perlu dilakukan. Semua informasi yang dibutuhkan bisa diberikan di task description.

**Perlu tool isolation.** Agent bisa dibatasi hanya menggunakan tools tertentu — misalnya hanya bisa baca file, tidak bisa write. Ini berguna untuk task yang perlu constraint keamanan, atau untuk menghindari Agent secara tidak sengaja memodifikasi hal yang tidak seharusnya.

**Bisa run parallel.** Karena Agent berjalan di context terpisah, multiple agents bisa dijalankan secara parallel untuk task yang independent. Ini tidak bisa dilakukan dengan Skill.

**Cara define Agent:** Buat file `.md` di `.claude/agents/` — tidak perlu installation. Cukup commit ke repository, semua yang clone repo tersebut sudah punya Agent yang sama.

Contoh:

```markdown
---
name: spring-crud-generator
description: Generate CRUD boilerplate untuk Spring Boot entity
allowed-tools: Read, Write, Bash
---

Generate CRUD boilerplate untuk entity yang diberikan.
Stack: Java 21, Spring Boot 3, R2DBC, PostgreSQL.
Ikuti pattern dari TransactionService yang sudah ada.

Input yang dibutuhkan:
- Entity name
- Field list dengan type
- Package base

Generate: Entity, DTO, Repository, Service, Controller, Unit Tests.
```

---

## Decision Framework

Pertanyaan kunci yang selalu kami pakai:

> **"Apakah output-nya berbeda per project/framework/stack, DAN perlu di-discover secara interaktif?"**

```
Ya → Skill
Tidak → Agent
```

Tabel perbandingan untuk kasus yang lebih spesifik:

| Karakteristik Task | Skill | Agent |
|---|---|---|
| Butuh multi-turn Q&A | ✓ | ✗ |
| Perlu ingat jawaban sebelumnya | ✓ | ✗ |
| Task autonomous, fire-and-forget | ✗ | ✓ |
| Input bisa fully specified upfront | ✗ | ✓ |
| Perlu tool isolation/restriction | ✗ | ✓ |
| Bisa run parallel | ✗ | ✓ |
| Shared via git registry | ✓ | via repo commit |

---

## Perbandingan: Claude Code vs Codex CLI vs Gemini CLI

Karena sering ditanya perbandingannya, ini overview singkat dari ekosistem yang lebih luas:

| Feature | Claude Code | Codex CLI | Gemini CLI |
|---|---|---|---|
| Interactive Skills (Q&A plugin) | ✅ Native | ❌ | ❌ (web Gems only) |
| Agent persona files (.md) | ✅ Native | ⚠️ SDK-based | ✅ via Extensions |
| Plugin/extension marketplace | ✅ Native | ❌ | ✅ Extension Gallery |
| Multi-agent orchestration | ✅ Native | ✅ Agents SDK | ✅ via Extensions |
| MCP tool support | ✅ | ✅ | ✅ |
| Project instructions file | CLAUDE.md | AGENTS.md | GEMINI.md |
| Tool restriction per agent | ✅ | ❌ | ❌ |

MCP adalah common ground — semua tiga tool mendukungnya. Tapi untuk Skills (interactive Q&A plugin) dan tool restriction per agent, Claude Code saat ini punya ekosistem yang paling mature.

Ini bukan pernyataan bahwa Claude Code "terbaik" secara absolut — ekosistem AI coding tools bergerak cepat dan situasi bisa berubah. Tapi untuk tim yang investasi di Skills dan Agents ecosystem, Claude Code punya fondasi yang paling kuat saat ini.

---

## Membangun Skills dan Agents untuk Tim

Untuk SA atau Tech Lead yang ingin membangun internal Skills dan Agents library:

**Build a Skill when:**
- Output berbeda per project (framework, stack, konvensi)
- Butuh discovery Q&A sebelum generate
- Tim perlu consistency — semua engineer generate dengan pattern yang sama
- Akan di-share via registry ke multiple project

**Build an Agent when:**
- Task repetitif dengan input yang well-defined
- Bisa fully autonomous — tidak butuh konfirmasi
- Perlu tool isolation untuk keamanan
- Bisa diparallelkan dengan agent lain

Teams share Agents dengan commit `.claude/agents/` ke project repository — langsung available untuk semua yang clone repo tersebut.

Teams share Skills via git registry — engineer install dengan satu command, update otomatis ketika ada versi baru.

---

## Kesimpulan Seri

Ini adalah artikel terakhir dari seri **AI-Assisted Software Development**. Kalau ada satu hal yang perlu di-take away dari seluruh seri ini:

**AI paling efektif bukan ketika dipakai secara ad-hoc, tapi ketika diintegrasikan ke dalam workflow yang terstruktur dengan clear ownership dan checkpoint yang jelas.**

PRD yang baik → PID yang detail → Solution design yang solid → Spec yang eksplisit → Code generation yang incremental. Setiap tahap saling bergantung. Shortcut di satu tahap akan membayar mahal di tahap berikutnya.

Skills dan Agents adalah cara untuk mengkodifikasi pengetahuan ini — mengubah "cara kita bekerja" dari dokumen yang tidak dibaca menjadi tool yang dipakai setiap hari.

Selamat mencoba, dan semoga useful.

---

*Firman Hanafi adalah Solution Architect di perusahaan payment gateway Indonesia, fokus pada financial core systems, microservices architecture, dan AI-assisted engineering practices.*

*Seri lengkap: [01 - Kenapa AI di PRD?] · [02 - Serena + MCP] · [03 - Solution Design] · [04 - Spec Before Code] · [05 - Structured Code Generation] · [06 - Token Efficiency] · [07 - Skills vs Agents]*
