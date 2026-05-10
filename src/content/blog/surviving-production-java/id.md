---
title: "Survive di Production: Wiring yang Earn Space-nya"
description: "Short list yang gw bakal wire ke service Java sebelum dia masuk production. OpenTelemetry, Micrometer business metrics, JFR, Resilience4j, dan operational chops yang nggak bisa difit ke code sample."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["java", "spring-boot", "production", "observability", "engineering"]
draft: false
---

Kode di production behave-nya beda sama kode di test. Skill-nya bisa baca jarak itu. Post ini short list dari yang gw bakal wire ke service Java sebelum dia masuk production, urut dari yang paling sering gw lihat earn space-nya.

Ini bagian 5 dari seri.

---

## OpenTelemetry, di-setup sebelum first deployment

OpenTelemetry tracing tool production paling useful yang pernah gw kerjain bareng. Setup-nya kecil, payoff-nya gede.

Spring Boot 3.x dan 4.x punya support OTel first-class. Config minimum yang useful:

```yaml
management:
  tracing:
    sampling:
      probability: 1.0   # 100% di dev/staging, lebih kecil di prod
  otlp:
    tracing:
      endpoint: http://otel-collector:4318/v1/traces

logging:
  pattern:
    level: "%5p [%X{traceId:-},%X{spanId:-}]"
```

Tiga hal yang dilakuin di luar auto-instrumentation:

1. **Tambah custom span buat business operation.** `@Observed` dari Micrometer bikin ini cuma dua annotation.
2. **Propagate trace context across async boundary** (Kafka, message queue). Auto-instrumentation handle HTTP. Sisanya kamu yang handle.
3. **Include trace ID di error response.** Pas customer report error, trace ID itu bedanya investigasi 30 menit sama 30 detik.

---

## Custom Micrometer metrics buat business event

JVM metrics generic itu baseline. Business metrics tempat observability earn space-nya. Pattern yang gw default:

```java
@Service
class PaymentService {
    private final Counter paymentsApproved;
    private final Timer paymentLatency;
    private final MeterRegistry registry;

    PaymentService(MeterRegistry registry) {
        this.registry = registry;
        this.paymentsApproved = registry.counter("payments.approved");
        this.paymentLatency = registry.timer("payments.latency");
    }

    public PaymentResult process(PaymentRequest req) {
        return paymentLatency.record(() -> {
            var result = doProcess(req);
            switch (result) {
                case Approved a -> paymentsApproved.increment();
                case Declined d -> Counter.builder("payments.declined")
                    .tag("reason", d.code().name())
                    .register(registry).increment();
                case NeedsReview n -> {}
            }
            return result;
        });
    }
}
```

Dashboard yang dibangun di atas metric ini yang dicek duluan pas ada yang "off". CPU sama memory kasih tau JVM-nya sehat. Business metric kasih tau aplikasi-nya sehat.

---

## JFR (Java Flight Recorder) buat profiling

JFR built-in di JVM dan ship recording zero-cost. Enable di production pakai flag continuous-recording, dan kamu punya data buat investigate latency atau memory issue setelah kejadian:

```
-XX:StartFlightRecording=duration=0,filename=/var/log/jfr/recording.jfr,maxsize=500m
```

Pas ada yang salah, kamu pull file JFR-nya dan analisis pakai JDK Mission Control atau async-profiler. Pertama kali kamu fix p99 latency dari flame graph, ada threshold kecil yang kelewat.

JFR jago di: GC pause, hot method, lock contention, allocation profiling. Yang dia bukan: distributed-system debugging (pakai trace) dan business-logic bug (pakai log dan breakpoint).

---

## Resilience pattern di setiap external call

Resilience4j library yang gw default. Pattern yang earn space-nya:

- **Circuit breaker** di setiap external HTTP call. Default config (50% failure rate over 100 calls, 30-second open state) starting point yang reasonable.
- **Bulkhead** per call category. Jangan biarin third-party API yang lambat ngabisin semua worker thread.
- **Timeout** di setiap external call. Default 30 detik salah. Pilih angka yang nyata berdasarkan SLA dependency-nya.
- **Idempotency key** di operasi yang di-retry. Tanpa ini, "retry on failure" bisa berarti "double-charge customer".

Kesalahan paling umum: stack semua decorator Resilience4j tanpa mikir urutan-nya. Order decorator penting. Circuit-breaker di luar retry behave beda dari retry di luar circuit-breaker.

---

## Operational chops: bagian yang nggak glamour

Skill yang nggak fit di code sample:

- **Baca log across pod.** Kalau log-mu nggak di-aggregate ke tempat yang bisa di-query, fix itu duluan.
- **Query Prometheus langsung.** Dashboard suka bohong soal yang dia tampilin. PromQL itu source of truth.
- **Nulis runbook yang useful.** "If alert X fires, do Y" lebih valuable dari diagram arsitektur. Runbook seharusnya muat di satu halaman.

Layer ini paling sedikit dibantu AI. Production debugging itu reasoning di tengah ketidakpastian soal sistem spesifik, dan jawaban generic biasanya nggak applicable.

---

## Adoption order

Kalau lagi wire ini buat pertama kali, urutan yang gw default:

1. **Logging dengan trace ID.** Perubahan termurah, utility immediate paling tinggi.
2. **OpenTelemetry tracing.** Single config block, visibility immediate.
3. **Business-event Micrometer metrics.** Pilih tiga KPI yang service-mu harus report.
4. **JFR continuous recording.** Gratis, tinggal nyalain.
5. **Resilience4j di setiap external call.** Terakhir karena butuh design thought lebih banyak.

---

## What this isn't

Ini bukan checklist production lengkap. Nggak cover deployment, secret management, blue-green strategy, database migration, atau capacity planning. Setiap itu body of work terpisah.

Post terakhir di seri ini masuk ke Phase 5 dari parent roadmap: trade-off arsitektur yang muncul setelah dasar-dasar production udah ter-wire.
