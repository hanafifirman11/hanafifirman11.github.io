---
title: "Nulis ADR Pertamamu (dan Dua Puluh Berikutnya)"
description: "Apa itu Architecture Decision Record, kapan ditulis, format yang gw default, dan worked example buat keputusan non-trivial."
publishedAt: 2026-05-11
category: ai-engineering
tags: ["architecture", "documentation", "engineering", "adr"]
draft: false
---

Ini versi yang lebih dalem dari section ADR di [post architecture trade-offs](/blog/architecture-tradeoffs/). ADR salah satu pattern dokumentasi yang kelihatan overhead sampai pertama kali kamu join project yang punya itu, abis itu kamu mikir gimana dulu bisa kerja tanpa ini.

---

## Buat apa ADR

Architecture Decision Record capture satu keputusan: apa yang diputusin, kenapa, apa alternatif-nya, dan apa trade-off yang di-accept. Dokumen-nya pendek. Mikirannya yang masuk ke situ itu nilai-nya.

ADR bukan:

- Katalog semua arsitektur kamu (itu dokumentasi).
- Deskripsi state sekarang (itu system diagram).
- Retrospective apa yang work atau nggak (itu postmortem).

ADR itu decision point. Tiap satu capture momen pas keputusan non-obvious diambil dan reasoning di belakangnya.

---

## Kapan nulis satu

Bar yang gw default: tulis ADR pas keputusan-nya susah di-reverse, pas reasoning-nya bakal susah di-reconstruct nanti, atau pas kamu pengen joiner masa depan paham kenapa ini dilakuin bukan yang lain.

Konkretnya:

- **Pilihan tech stack** (database, message broker, language runtime).
- **Boundary arsitektur** (split microservice, hexagonal vs layered).
- **Pilihan data model** (event-sourced vs CRUD, normalised vs denormalised).
- **Keputusan API contract** (REST vs gRPC, versioning strategy).
- **Cross-cutting concern** (auth model, observability stack, deployment topology).

Jangan tulis ADR buat: dependency upgrade, library swap yang nggak ubah arsitektur, code style choice, atau apapun yang reversible dalam satu siang.

---

## Format-nya

Format ADR yang gw default (kadang disebut MADR format, dengan variasi kecil):

```markdown
# ADR-N: <Judul>

## Status
Proposed | Accepted | Superseded by ADR-X | Deprecated

## Context
Apa situasi yang butuh keputusan? Force apa yang main?

## Decision
Apa yang diputusin? State dengan jelas.

## Alternatives Considered
Opsi apa lagi yang on the table? Kenapa nggak dipilih?

## Consequences
Apa trade-off keputusan ini? Apa yang jadi lebih gampang? Apa yang jadi lebih susah?
```

Lima section. Mayoritas ADR muat satu halaman. Kalau punyamu jadi tiga halaman, keputusan-nya kemungkinan besar lebih dari satu keputusan.

---

## Worked example

Ini ADR buat keputusan yang sering gw lihat muncul:

```markdown
# ADR-007: Pake R2DBC bukan JPA buat payment service

## Status
Accepted

## Context

Payment service handle 800-1500 request per detik di peak hour, dengan mayoritas operation short read (transaction lookup) atau short write (status update). Tim udah pake JPA di tiga service sebelumnya. JPA udah jadi sumber bug N+1 query dan lazy-loading issue yang dikenal di code review.

Service jalan di virtual threads (Java 21+), jadi blocking I/O bukan concern scaling kayak dulu di thread pool tradisional.

Kita butuh decide antara:

- JPA dengan Hibernate (familiar buat tim)
- R2DBC dengan DatabaseClient (reactive, lower-level)
- Plain JDBC dengan thin mapper (paling explicit)

## Decision

Pake R2DBC dengan DatabaseClient. Map result manual pake record type sebagai output domain. Avoid Spring Data Repositories di service ini.

## Alternatives Considered

**JPA dengan Hibernate.** Opsi paling familiar. Reject karena pattern N+1 yang kita lihat di service sebelumnya consume lebih banyak waktu code-review daripada framework save. Lazy loading scoped-session JPA juga conflict sama preference kita ke service method stateless.

**Plain JDBC dengan thin mapper.** Paling explicit, abstraction cost paling rendah. Reject karena boilerplate per query tinggi cukup buat slow feature work measurable.

## Consequences

**Positive:**

- Query explicit. Nggak ada surprise lazy load. Code review catch lebih banyak issue lebih awal.
- Result type itu records, yang compose bersih sama service lain.
- Pipeline reactive end-to-end, jadi streaming response natural.

**Negative:**

- Tim perlu belajar API baru. Estimasi ramp: satu sprint.
- Nggak ada schema migration otomatis via Hibernate. Kita butuh Flyway atau Liquibase explicit (kita udah pake Flyway di service lain).
- Beberapa idiom umum di JPA (entity inheritance, embedded value object) perlu di-map manual.

**Open question:**

- Gimana kita mau handle transaction yang span multiple repository call? `TransactionalOperator` atau method-level `@Transactional`? Decide spike ini di week 1.
```

Itu seluruh ADR-nya. Sekitar 350 kata. Joiner baru enam bulan lagi baca ini dan paham bukan cuma apa yang kita pake tapi kenapa kita pilih itu.

---

## Kapan supersede ADR

Kalau keputusan berubah, jangan hapus ADR lama. Tambah satu baru yang supersede dia:

```markdown
# ADR-014: Pindah dari R2DBC ke JPA

## Status
Accepted (supersedes ADR-007)

## Context
[Delapan belas bulan setelah ADR-007, pengalaman tim shift. Dokumentasikan kenapa.]

## Decision
[Keputusan baru.]

## Consequences
[Trade-off baru.]
```

Dan update status ADR lama:

```markdown
# ADR-007: Pake R2DBC bukan JPA buat payment service

## Status
Superseded by ADR-014

## Context
[Konten asli nggak diubah.]
```

History-nya itu nilainya. Tim yang punya 20 ADR, tiga di antaranya udah di-supersede, punya knowledge institusional lebih banyak daripada tim yang punya 17 ADR current dan pura-pura yang lain nggak pernah ada.

---

## Di mana keep-nya

Dua pattern yang work bagus.

**Di repo, samping kode.** Folder `docs/adr/` dengan satu file per ADR (`0001-database-choice.md`, `0002-versioning-strategy.md`). PR yang ubah arsitektur include ADR di PR yang sama. Review ADR dan review kode happen bareng.

**Di wiki atau shared docs.** Lebih gampang di-discover buat non-engineering stakeholder. Lebih susah keep in sync sama kode actual. Gw default ke repo kecuali tim kerja deket sama non-engineer yang butuh baca.

---

## Siapa yang nulis

Orang yang bikin atau propose keputusan. ADR di-review bareng code change, sering sama reviewer yang sama, dan merge pas consensus tercapai.

Ini bukan pattern "tech lead nulis semua". Engineer junior nulis ADR pertamanya itu salah satu learning moment dengan leverage paling tinggi yang pernah gw lihat. Act nulis section alternatif dan consequence force jenis thinking yang susah di-teach lewat cara lain.

---

## What this isn't

Ini bukan strategi dokumentasi lengkap. ADR cover keputusan. Kamu tetep butuh system diagram, API reference, runbook, dan onboarding docs. ADR slot in samping itu, bukan ngegantiin.

Kalau kamu start dari nol, tulis tiga ADR pertama buat keputusan yang udah diambil, retroactive. Exercise reconstruct reasoning-nya useful, dan tim dapet feel format-nya sebelum keputusan real berikutnya muncul.
