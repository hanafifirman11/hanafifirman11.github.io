---
title: "Reference Pattern Resilience4j: Circuit Breaker, Bulkhead, Retry, Timeout"
description: "Apa yang tiap pattern Resilience4j lakuin, kapan dipakai, default config sebagai starting point, dan kenapa urutan decorator penting."
publishedAt: 2026-05-11
category: ai-engineering
tags: ["java", "spring-boot", "resilience4j", "production"]
draft: false
---

Ini versi yang lebih dalem dari section Resilience4j di [post surviving production](/blog/surviving-production-java/). Tiap pattern di Resilience4j punya failure mode spesifik yang dia handle. Stack mereka tanpa paham mode mana yang tiap pattern address itu kesalahan paling sering gw lihat.

---

## Lima pattern yang worth diketahui

Resilience4j ship beberapa decorator. Lima yang penting buat service Spring Boot typical:

- **Circuit Breaker**, stop kirim traffic ke dependency yang lagi fail
- **Retry**, coba ulang call yang gagal
- **Timeout**, bound berapa lama call boleh nunggu
- **Bulkhead**, limit call concurrent
- **Rate Limiter**, limit frekuensi call

Tiap satu solve problem beda. Nggak ada satu pun yang solve semua-nya.

---

## Circuit Breaker

**Apa yang dia lakuin.** Track success/failure rate call ke dependency. Kalau failure cross threshold, breaker buka dan reject call tanpa coba. Setelah cooldown, dia allow beberapa call test (half-open) buat lihat apakah dependency udah recover.

**Kapan dipakai.** Di setiap call ke external system yang kamu nggak kontrol. Failure mode yang dia cegah: dependency lambat atau fail yang nyeret latency atau thread pool kamu.

**Config starting point yang reasonable:**

```yaml
resilience4j.circuitbreaker:
  instances:
    payment-api:
      failureRateThreshold: 50
      slowCallDurationThreshold: 2s
      slowCallRateThreshold: 50
      waitDurationInOpenState: 30s
      slidingWindowSize: 100
      minimumNumberOfCalls: 20
      permittedNumberOfCallsInHalfOpenState: 3
```

Config itu buka breaker kalau 50% dari 100 call terakhir fail atau slow (lebih dari 2s), nunggu 30 detik sebelum test lagi, dan allow 3 test call pas recovery.

**Kesalahan umum.** Set `slidingWindowSize` terlalu kecil. Window 10 berarti breaker react ke noise. Window 100+ smooth out signal-nya.

---

## Retry

**Apa yang dia lakuin.** Coba ulang call yang fail sampai N kali, optional pake backoff antar attempt.

**Kapan dipakai.** Di call yang punya peluang reasonable buat transient failure: HTTP timeout, connection reset, 503 response. Failure mode yang dia address: temporary unavailability yang resolve sendiri.

**Config starting point yang reasonable:**

```yaml
resilience4j.retry:
  instances:
    payment-api:
      maxAttempts: 3
      waitDuration: 500ms
      enableExponentialBackoff: true
      exponentialBackoffMultiplier: 2
      retryExceptions:
        - java.net.SocketTimeoutException
        - org.springframework.web.client.HttpServerErrorException
      ignoreExceptions:
        - com.example.ValidationException
```

Config itu retry sampai 3 kali pake exponential backoff, tapi cuma buat exception type yang di-list.

**Kesalahan umum.** Retry di semua exception, termasuk business validation error. Retry 400 response tiga kali nggak bikin dia jadi 200. Pakai `ignoreExceptions` buat exclude yang nggak bakal change.

**Kesalahan umum lainnya.** Retry tanpa idempotency key. Kalau payment call timeout dan kamu retry, customer bisa kena charge dua kali. Pasang retry sama idempotency key di call site.

---

## Timeout

**Apa yang dia lakuin.** Bound berapa lama call boleh nunggu sebelum throw timeout exception.

**Kapan dipakai.** Di setiap external call. Failure mode yang dia address: call yang hang nahan worker thread infinite.

**Config starting point yang reasonable:**

```yaml
resilience4j.timelimiter:
  instances:
    payment-api:
      timeoutDuration: 5s
      cancelRunningFuture: true
```

5 detik itu placeholder. Angka yang bener tergantung SLA actual dependency-nya. Jangan terima default 30 detik tanpa mikirin dulu.

**Kesalahan umum.** Set semua timeout ke nilai sama. Timeout buat endpoint "list customers" harusnya beda sama timeout buat endpoint "approve payment". Per-endpoint timeout worth overhead config-nya.

---

## Bulkhead

**Apa yang dia lakuin.** Limit berapa banyak call concurrent yang bisa in-flight ke dependency tertentu. Call di luar limit either nunggu atau di-reject.

**Kapan dipakai.** Pas kamu punya beberapa downstream dependency dan kamu mau cegah satu dependency lambat ngabisin semua worker thread kamu. Failure mode yang dia address: thread-pool exhaustion yang bikin service cepat nggak bisa respond karena service lambat hogging pool.

**Config starting point yang reasonable:**

```yaml
resilience4j.bulkhead:
  instances:
    payment-api:
      maxConcurrentCalls: 25
      maxWaitDuration: 100ms
```

Config itu allow 25 call concurrent ke `payment-api`, dengan call baru nunggu sampai 100ms sebelum di-reject.

**Kesalahan umum.** Skip bulkhead karena asumsi virtual threads bikin dia nggak butuh. Virtual threads handle problem thread-pool di JVM level, tapi bulkhead masih matter buat limit load ke dependency downstream sendiri.

---

## Rate Limiter

**Apa yang dia lakuin.** Limit berapa banyak call per window waktu ke dependency.

**Kapan dipakai.** Pas dependency punya documented rate limit yang harus kamu respect, atau pas kamu mau protect dependency lambat dari burst-mu sendiri. Failure mode yang dia address: ke-rate-limit sama upstream provider.

**Config starting point yang reasonable:**

```yaml
resilience4j.ratelimiter:
  instances:
    third-party-api:
      limitForPeriod: 100
      limitRefreshPeriod: 1s
      timeoutDuration: 50ms
```

Config itu allow 100 call per detik, dengan call baru nunggu 50ms sebelum di-reject.

**Kesalahan umum.** Treat rate-limiting sebagai problem yang sama sama bulkhead. Nggak sama. Bulkhead control concurrency. Rate limiter control frequency. Kamu bisa punya concurrency rendah dengan frequency tinggi, atau sebaliknya.

---

## Urutan decorator penting

Kalau kamu stack beberapa decorator Resilience4j, urutan compose-nya ngubah behavior. Spring Boot starter apply mereka di urutan default ini, dari outermost ke innermost:

1. Bulkhead
2. TimeLimiter
3. RateLimiter
4. CircuitBreaker
5. Retry

Urutan itu artinya: bulkhead admission jalan duluan, terus time-limit apply ke seluruh chain (termasuk retry), terus rate limiter, terus circuit breaker check state, terus retry happen di sekitar call yang sesungguhnya.

Implikasi: **retry happen di dalem circuit breaker, bukan di luar**. Kalau circuit open, retry nggak fire. Itu hampir selalu yang kamu mau.

Kalau kamu compose decorator manual pakai `Decorators.ofSupplier(...)`, kamu harus mikir urutan sendiri. Default order itu starting point yang reasonable. Jangan ubah tanpa alasan.

---

## Kapan pake yang mana

Decision tree kasar:

- **Call external service apapun:** Circuit Breaker + Timeout, selalu.
- **External service punya known transient failure:** Tambah Retry.
- **External service punya published rate limit:** Tambah Rate Limiter.
- **Kamu punya beberapa downstream service dan satu mungkin lambat:** Tambah Bulkhead per dependency.

Minimum yang gw bakal ship: Circuit Breaker + Timeout. Sisanya contextual.

---

## What this isn't

Ini bukan reference Resilience4j lengkap. Nggak cover integrasi metric, API event publisher, cache decorator, atau pattern fallback. Docs official cover itu bagus.

Pattern di atas itu yang gw reach for duluan pas lagi wire resilience ke service Spring Boot baru. Sisanya contextual.
