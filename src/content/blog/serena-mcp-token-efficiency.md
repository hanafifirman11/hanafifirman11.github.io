---
title: "Serena + MCP: Cara AI Baca Codebase Tanpa Boros Token"
description: "Tanpa Serena, Claude membaca file satu per satu seperti orang baca buku tanpa daftar isi. Dengan Serena, Claude navigasi codebase secara semantik — hemat 60–80% token."
publishedAt: 2026-04-23
category: ai-engineering
tags: ["ai", "claude-code", "serena", "mcp", "token-efficiency"]
draft: false
---

Ada pertanyaan yang sering muncul ketika engineer pertama kali pakai Claude Code di codebase yang besar:

*"Kok lambat? Kok boros token? Kok hasilnya kadang tidak sesuai konteks codebase kita?"*

Jawabannya hampir selalu sama: Claude tidak tahu *di mana harus melihat*.

Tanpa tool yang tepat, Claude akan membaca file satu per satu, memuat seluruh isi file meskipun yang dibutuhkan hanya satu method, dan menghabiskan context window dengan konten yang tidak relevan. Seperti orang yang disuruh cari satu paragraf di sebuah buku — tapi tidak dikasih daftar isi dan harus baca dari halaman pertama.

Serena adalah solusi untuk masalah ini.

---

## Apa Itu MCP dan Kenapa Penting

Sebelum masuk ke Serena, perlu pahami dulu fondasi teknisnya: **Model Context Protocol (MCP)**.

MCP adalah open protocol yang menjadi jembatan antara AI dan tools eksternal — codebase, database, API, apapun. Analoginya: kalau USB-C adalah standar universal untuk menghubungkan perangkat, MCP adalah standar universal untuk menghubungkan AI dengan tools.

```
Claude  ←→  MCP Server  ←→  Codebase / DB / API
```

Yang menarik: MCP bukan eksklusif untuk Claude. Codex CLI, Gemini CLI, dan AI lainnya juga bisa terhubung ke MCP server yang sama. Artinya investasi membuat MCP server yang bagus bisa dipakai lintas AI.

Claude Code sudah dilengkapi MCP support out of the box — tidak perlu setup tambahan yang rumit.

---

## Serena: IDE Intelligence untuk AI

Serena adalah MCP server yang membawa kemampuan navigasi semantik ke Claude Code. Intinya, Serena mengekspos kemampuan **Language Server Protocol (LSP)** kepada AI.

LSP adalah teknologi yang sudah lama dipakai IDE modern — itulah yang membuat IDE bisa "go to definition", "find all references", atau "show all implementations" secara akurat. Serena membawa kemampuan yang sama ke tangan Claude Code.

**Tanpa Serena:**
- Claude membaca file satu per satu
- Seluruh isi file dimuat meski hanya butuh 1 method
- Token usage tinggi
- Konteks hilang di codebase yang besar

**Dengan Serena:**
- Claude navigasi secara semantik: cari symbol, temukan referensi, baca hanya yang relevan
- Token usage turun **60–80%**
- Konsisten meski di codebase yang besar dan kompleks

Perbedaan ini bukan marginal — ini yang membedakan antara Claude Code yang "oke" dan Claude Code yang benar-benar berguna di production codebase.

---

## Bagaimana Serena Bekerja

```
Codebase  →  LSP (Language Server)  →  Serena MCP Server  →  Claude Code
```

Serena mengekspos beberapa tools utama yang bisa dipakai Claude:

| Tool | Fungsi |
|---|---|
| `find_symbol` | Langsung ke definisi class, method, atau variable |
| `get_symbols_overview` | Outline keseluruhan file — seperti daftar isi |
| `find_referencing_symbols` | Cari semua tempat di mana sebuah symbol dipakai |
| `search_for_pattern` | Global regex search di seluruh codebase |

Dengan tools ini, Claude bisa langsung tanya: "Di mana `PaymentService` didefinisikan?" dan langsung mendapat jawabannya — tanpa harus membaca setiap file satu per satu.

---

## Setup Serena

Setup Serena lebih sederhana dari yang terlihat. Berikut langkah-langkahnya:

**1. Install uv**

```bash
brew install uv
```

**2. Buat file `.mcp.json` di root project**

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--python", "3.13",
        "--from", "git+https://github.com/oraios/serena",
        "serena", "start-mcp-server",
        "--project", "/path/to/your/project",
        "--context", "claude-code",
        "--enable-web-dashboard", "true"
      ]
    }
  }
}
```

Ganti `/path/to/your/project` dengan path absolut project kamu.

**3. Restart Claude Code**

Setelah restart, Serena sudah aktif dan Claude Code bisa menggunakan tools semantik di codebase kamu.

---

## Serena Bekerja dengan Bahasa Apa Saja?

Serena mendukung bahasa yang punya LSP support yang mature:

- Java ✓
- Python ✓
- TypeScript / JavaScript ✓
- Go ✓
- Rust ✓
- Dan lebih banyak lagi

Untuk tim kami yang mayoritas pakai Java + Spring Boot, ini coverage yang sangat memadai.

---

## Contoh Nyata: Debugging dengan dan tanpa Serena

Bayangkan kamu punya microservice dengan 200+ file Java dan kamu minta Claude untuk melacak bagaimana sebuah transaksi diproses dari request masuk sampai ke database.

**Tanpa Serena**, Claude akan:
1. Baca `TransactionController.java` — seluruh file, 300 baris
2. Baca `TransactionService.java` — seluruh file, 500 baris
3. Baca `TransactionRepository.java` — seluruh file, 200 baris
4. Total: ~1000 baris, ~8,000 token hanya untuk trace satu flow

**Dengan Serena**, Claude akan:
1. `get_symbols_overview` pada controller — langsung tahu method mana yang relevan
2. `find_symbol` pada method yang spesifik — baca hanya 30 baris yang relevan
3. `find_referencing_symbols` untuk trace ke service dan repository
4. Total: ~100 baris, ~800 token — **10x lebih efisien**

Di codebase yang besar, perbedaan ini terakumulasi sangat signifikan.

---

## Serena Bukan Hanya untuk Claude

Karena Serena adalah MCP server standar, konfigurasi `.mcp.json` yang sama bisa dipakai oleh:

- **Claude Code** — primary tool kami
- **Codex CLI** — via MCP support
- **Gemini CLI** — via Extensions

Ini berarti kalau tim kamu bereksperimen dengan multiple AI tools, Serena tetap relevan. Satu investasi setup, bisa dipakai ke mana pun AI ecosystem-nya berkembang.

---

## Tips Praktis

**Aktifkan web dashboard.** Flag `--enable-web-dashboard true` memberikan interface visual untuk melihat apa yang Serena indexing dan tool apa yang dipanggil Claude. Berguna untuk debugging dan memahami apa yang terjadi di balik layar.

**Pastikan project di-index dulu.** Saat pertama kali dijalankan, Serena perlu waktu untuk mengindex codebase. Untuk project besar, ini bisa beberapa menit. Tunggu sampai indexing selesai sebelum mulai bekerja.

**Satu `.mcp.json` per project.** Simpan file ini di root project dan commit ke repository. Ini memastikan semua anggota tim dan CI/CD environment punya konfigurasi yang sama.

---

## Kesimpulan

Serena + MCP adalah fondasi yang membuat Claude Code benar-benar berguna di codebase production yang besar dan kompleks. Tanpanya, Claude bekerja buta — membaca file secara acak, boros token, dan sering kehilangan konteks.

Dengan Serena, Claude bisa navigasi codebase seperti engineer yang sudah bekerja berbulan-bulan di project tersebut — tahu di mana harus melihat, tahu apa yang relevan, dan tidak membuang waktu membaca hal-hal yang tidak perlu.

Setup-nya 15 menit. Benefitnya permanen di setiap sesi kerja.

Artikel berikutnya: bagaimana menggunakan Claude Code + Serena untuk menghasilkan solution design — sequence diagram, C4 model, dan API contract yang benar-benar sesuai dengan arsitektur existing.

---

*Artikel ini bagian dari seri **AI-Assisted Software Development** — pengalaman lapangan menggunakan Claude Code di tim engineering payment fintech.*
