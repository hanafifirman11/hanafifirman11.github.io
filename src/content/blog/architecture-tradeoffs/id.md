---
title: "Trade-off Arsitektur yang Bisa Kamu Pertanggungjawabin"
description: "Keputusan arsitektur yang paling sering muncul di Java backend. Event-driven vs request-response, CQRS, hexagonal, kapan split microservice, REST vs gRPC vs GraphQL, ADR."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["java", "architecture", "system-design", "engineering"]
draft: false
---

[Parent roadmap post](/blog/java-roadmap-ai-era/) bilang signal kamu senior di era AI itu trade-off yang bisa kamu artikulasikan tanpa googling. Post ini short list trade-off itu di Java backend, dengan cara gw default mikirin masing-masing.

Ini opinion-heavy. Anggep starting point buat argumen kamu sendiri, bukan jawaban final. Bagian 6 dari seri.

---

## Event-driven vs request-response

Default ke request-response. Event itu tool yang bener kalau kamu memang butuh decoupling, ordering guarantee across consumer, atau processing async buat operasi lambat. Mostly keputusan "yuk kita event-driven aja" yang gw lihat itu sebenernya soal menghindari sync call ke service yang lambat, dan itu lebih baik di-solve pakai queue plus API yang lebih cepat ketimbang full event-sourcing.

Kapan event itu pilihan yang bener:

- Banyak consumer butuh event yang sama, dan producer-nya nggak mau tau soal mereka.
- Pekerjaan-nya emang async (notifikasi fan-out, ETL, audit logging).
- Ordering across service penting dan queue nggak bisa kasih itu.

Kapan event itu pilihan yang salah:

- "Mungkin nanti butuh." Gak bakal, dan operational cost nge-jalanin Kafka dengan bener bukan nol.

---

## CQRS, kapan dan kapan jangan

Mostly, jangan. CQRS bener pas read sama write workload punya scaling characteristic yang sungguh-sungguh beda, pas kamu butuh data shape beda buat read vs write, atau pas mau add read-only replica tanpa nyentuh write path.

CQRS salah pas alasan-nya "kita pengen pakai CQRS". Split-nya nambahin operational complexity (event store, replica health, read/write lag) yang harus dibayar sama divergence nyata antara dua path itu.

Buat service CRUD biasa, kamu nggak butuh CQRS. Boring `@Service` plus `DatabaseClient` bakal scale lebih jauh dari yang orang kira.

---

## Hexagonal architecture: business logic kamu nggak perlu import Spring

Argumen pro hexagonal (ports-and-adapters): business logic punya zero framework dependency, test jalan tanpa application context, swap infrastructure (database, queue, HTTP framework) jadi single-adapter change. Argumen kontra: kamu nulis lebih banyak kode, dan boundary interface jadi satu hal lagi yang junior harus navigate.

Kompromi yang gw default di 2026: keep domain layer Spring-free, tapi jangan extend disiplin ini ke setiap controller dan repository. Disiplin-nya pay off di tempat business logic-nya kaya dan sering berubah. Nggak pay off di adapter CRUD biasa.

Sinyal kamu kelewatan: nambah field baru butuh nyentuh tujuh file. Sinyal kamu kurang jauh: ganti database berarti rewrite service layer.

---

## Kapan split microservice

Default monolith. Split kalau ada boundary nyata, alih-alih cuma logical. Ciri boundary nyata:

- Dua bagian punya release cycle beda (satu rilis tiap minggu, satunya tiap kuartal).
- Dua bagian punya failure mode beda yang mau kamu isolate.
- Tim yang own dua bagian itu betul-betul terpisah, punya roadmap masing-masing.

Ciri boundary palsu, di mana kamu sebaiknya nggak split:

- "Module ini berasa kebesaran" tanpa problem yang measurable.
- Conway's Law diaplikasikan prematur, sebelum tim-nya kepecah.
- "Microservice itu best practice" jadi satu-satunya alasan.

Split tanpa boundary nyata bikin distributed monolith, yang punya semua operational cost microservice tanpa benefit autonomy-nya.

---

## API design: REST vs gRPC vs GraphQL

REST default. gRPC pilihan yang bener buat komunikasi service-to-service di mana kamu kontrol kedua sisi, butuh strong typing, dan peduli sama latency atau bandwidth. GraphQL pilihan yang bener buat API client-facing pas client-nya beragam dan pengen shape query mereka sendiri.

Kesalahan yang paling sering gw lihat:

- gRPC buat public API. Mostly third-party developer nggak punya tooling gRPC siap pakai. REST aja.
- GraphQL buat internal service-to-service call. Fleksibilitas-nya bayar di observability (tiap query unik) dan rate-limiting jadi lebih susah.
- REST buat semua-nya pas typed contract bakal catch bug. Kalau udah pakai OpenAPI spec, kamu udah 80% di nilai yang gRPC kasih.

---

## Data modeling: boring sering jawaban yang bener

Event sourcing nggak selalu bener. Append-only log nggak selalu bener. CRUD biasa dengan schema jelas itu jawaban yang bener lebih sering dari yang orang mau akui.

Pattern yang gw default:

- **CRUD plus relational database** buat mostly data yang di-own service. Postgres cover 95% kasus.
- **Append-only event log** kalau kamu memang butuh audit trail atau temporal query.
- **Document store** kalau shape data variasi banyak per record dan kamu jarang query across document.

Kalau kamu nggak bisa artikulasikan kenapa data kamu butuh sesuatu yang lebih eksotis dari CRUD, kemungkinan besar emang nggak butuh.

---

## Architecture Decision Records

Tulis ADR. Format yang gw default:

```markdown
# ADR-N: <Keputusan>

## Status
Accepted / Superseded by ADR-X

## Context
Apa situasi yang butuh keputusan?

## Decision
Apa yang diputusin?

## Consequences
Apa trade-off keputusan ini?
```

ADR bukan buat jelasin apa yang kamu lakuin. Dia buat jelasin kenapa, biar future-you (atau new joiner) bisa decide apakah keputusan-nya masih applicable. Pattern ADR yang paling underrated: pas kamu supersede ADR, link ke yang baru tapi keep yang lama. History-nya itu nilainya.

---

## What this isn't

Ini bukan katalog pattern arsitektur lengkap. Ini short list keputusan yang paling sering muncul di Java backend, dan di mana gw rasa default answer-nya sebaliknya dari yang lagi ngetrend.

Arsitektur yang bisa kamu pertanggungjawabin itu yang kamu bisa artikulasikan biaya tiap pilihan-nya. Kalau nggak bisa artikulasikan biaya-nya, kamu milih based on vibe, dan pilihan itu bakal jatuh pertama kali stress-test.

Ini nutup seri 5-post follow-up dari parent Java roadmap. Kalau ada gap yang mau di-fill, kasih tau.
