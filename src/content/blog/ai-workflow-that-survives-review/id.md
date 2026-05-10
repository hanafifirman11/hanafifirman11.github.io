---
title: "Workflow Bareng AI yang Lulus di Code Review"
description: "Loop lima-step yang gw default kalau lagi generate kode pakai AI: read, spec, skeleton, review, generate per-layer. Step yang paling sering di-skip engineer adalah yang leverage-nya paling tinggi."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["ai", "claude-code", "engineering-workflow", "spec-first"]
draft: false
---

[Parent roadmap post](/blog/java-roadmap-ai-era/) ada diagram "spec-first compounding loop" lawan "vibe-coding death loop". Post ini versi yang lebih praktis, fokus ke gimana setiap step kelihatan di workflow nyata, dan di mana engineer paling sering kepleset.

Ini bagian 4 dari seri.

---

## Loop lima-step

Yang work buat gw sebagai baseline:

1. **Baca kode existing dulu** (sekitar 5 menit).
2. **Tulis spec** (5 sampai 15 menit).
3. **Generate skeleton** (1 sampai 2 menit).
4. **Stop dan review skeleton** (5 menit).
5. **Generate per-layer + tests** (sisanya).

Total-nya lebih lama daripada langsung ngetik di Cursor, dan itu emang point-nya. Waktu yang kamu spend di step 1 sampai 4 itu waktu yang kalau nggak di sini, bakal kepake nanti di code review dan debugging. Front-load lebih murah dari back-load.

---

## Step 1: Baca kode existing

Sebelum prompt apapun, kamu baca codebase secukupnya buat tau pattern apa yang harus AI ikutin. Kalau punya tool kayak Serena (semantic code navigation), step ini jadi murah. Kalau nggak, ini step yang paling sering di-skip, dan yang paling tinggi leverage-nya buat output quality.

Konkretnya: buka file yang paling mirip sama yang mau kamu bangun, skim struktur-nya, catat pattern-nya. Udah. Lima menit.

---

## Step 2: Tulis spec

Spec-nya nggak harus panjang. Tapi harus spesifik. Spec yang gw tulis buat fitur "refresh OAuth token":

```
Add TokenService.refresh(String refreshToken) -> Mono<AccessToken>

Constraints:
- Reactive, no blocking calls
- Use DatabaseClient (existing repo pattern)
- New token is persisted before being returned
- If refresh token is invalid or expired, throw InvalidTokenException with code REFRESH_NOT_FOUND
- Idempotent: same refresh token submitted twice within the grace window returns the same access token

Reference files:
- See PaymentService for reactive service-layer pattern
- See OAuthClient for HTTP client setup

Tests:
- Happy path: valid refresh -> new access
- Expired refresh -> InvalidTokenException
- Concurrent refresh with same token within grace -> single new token
```

Spec ini sebut failure mode, reference pattern, dan idempotency requirement. Idempotency itu tipikal constraint yang AI default-nya bakal ignore kalau nggak di-told eksplisit.

---

## Step 3: Generate skeleton

Minta model produce class atau method signature plus test signature. No body. Kedengarannya extra work, tapi ini cara paling murah catch arah yang salah.

```
Generate the skeleton for TokenService.refresh per the spec above.
Class signature, method signatures with proper types, and test method
signatures only. No method bodies.
```

Skeleton kasih tau kamu apakah model paham request kamu sebelum dia spend token buat implementation.

---

## Step 4: Stop dan review skeleton

Step yang paling sering di-skip engineer. Godaan buat bilang "looks fine, lanjut generate body" itu kuat. Tahan. Skeleton buruk produce body buruk berjam-jam. Skeleton bagus produce body bagus berjam-jam. Signal-to-noise di checkpoint ini paling tinggi di seluruh loop.

Yang gw cek:

- Method signature match sama spec?
- Tipe parameter bener (misal `Mono<AccessToken>` bukan `AccessToken`)?
- Test signature cover failure mode yang gw list?
- Style dependency injection consisten sama codebase?

Fix di sini, sebelum body ditulis. Fix nanti biaya-nya kira-kira 10× lipat.

---

## Step 5: Generate per-layer + tests

Pas skeleton di-approve, generate satu layer at a time: repository, service, controller. Setiap generate take generate sebelumnya sebagai context. Test di-generate bareng production code, dalam pass yang sama.

Alasan layer-by-layer ketimbang all-at-once: diff yang lebih kecil lebih gampang di-review, model produce output yang lebih fokus pas scope-nya tight, dan kamu bisa stop loop kalau sesuatu salah tanpa buang seluruh fitur.

---

## Review kayak gimana

Posisi kamu udah bukan author lagi. Kamu reviewer. Itu ngubah pertanyaan yang kamu tanya:

- Failure mode-nya di-test, atau cuma di-compile?
- Ada hidden N+1 query (kesalahan AI paling umum di data-access code)?
- Error code match sama konvensi project?
- Ada parameter ber-tipe `Object` di mana domain type bakal catch bug di compile time?

Code review di stage ini lebih cepat dari review human-written code, karena struktur-nya cenderung lebih bersih. Bug-nya lebih halus.

---

## Di mana ini collapse

Dua failure mode yang gw lihat berulang.

Pertama: treat spec-first sebagai ritual ketimbang tool. Point-nya bukan ngisi template. Point-nya bikin constraint eksplisit biar AI bisa satisfy. Spec yang isinya "ikutin konvensi kita" itu bukan spec.

Kedua: skip skeleton review. Step yang membosankan. Juga step di mana time saving dateng. Kalau kamu skip, kamu balik ke vibe-coding dengan ceremony tambahan.

---

## What this isn't

Ini bukan workflow yang kamu adopt overnight. Pertama kali nyobain, bakal kerasa lebih lambat dari ngetik. Compounding-nya muncul setelah beberapa minggu, pas kamu sadar sudah lebih sedikit ronde "fix ini, fix itu" di PR review.

Post berikutnya di seri ini masuk ke Phase 4 dari parent roadmap: production survival, tool dan pattern yang earn space-nya pas kode kamu udah lewat code review.
