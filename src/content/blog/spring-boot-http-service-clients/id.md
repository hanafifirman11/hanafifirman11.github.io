---
title: "HTTP Service Clients di Spring Boot 4: Ngeganti Boilerplate RestClient"
description: "Cara HTTP client interface-based work di Spring Boot 4, kapan dipakai, dan cara wire retry, timeout, plus test di sekitarnya."
publishedAt: 2026-05-11
category: ai-engineering
tags: ["java", "spring-boot", "spring-boot-4", "http"]
draft: false
---

Ini versi yang lebih dalem dari section HTTP Service Clients di [post Spring Boot 4 in practice](/blog/spring-boot-4-in-practice/). Ini migration dengan leverage-per-line paling tinggi di release Spring Boot 4, kalau codebase-mu masih banyak `RestClient` atau `WebClient` call yang ditulis tangan.

---

## Apa yang abstraksi ini lakuin

Kamu declare interface yang describe remote API. Spring generate implementasi-nya:

```java
public interface PaymentApi {

    @GetExchange("/payments/{id}")
    Payment getPayment(@PathVariable String id);

    @PostExchange("/payments")
    Payment create(@RequestBody CreatePaymentRequest request);

    @DeleteExchange("/payments/{id}")
    void cancel(@PathVariable String id, @RequestHeader("Idempotency-Key") String key);
}
```

Di-wire pakai factory bean:

```java
@Configuration
class HttpClientConfig {

    @Bean
    PaymentApi paymentApi(WebClient.Builder builder) {
        WebClient client = builder
            .baseUrl("https://payment-svc.internal/")
            .defaultHeader("X-Service", "billing")
            .build();
        return HttpServiceProxyFactory.builder()
            .clientAdapter(WebClientAdapter.create(client))
            .build()
            .createClient(PaymentApi.class);
    }
}
```

Itu seluruh setup-nya. Interface kontrakmu, implementasi di-generate, consumer lihat tipe Java yang bersih.

---

## Kenapa migrate worth it

Tiga hal yang kamu dapet gratis.

**Interface jadi dokumentasi.** Siapapun baca kode bisa lihat remote API di pandang sekilas: method HTTP, path, parameter, return type. Nggak ada lagi tracing `WebClient.uri(...).retrieve(...)` chain buat tau apa yang lagi di-call.

**Cross-cutting concern nempel ke bean, alih-alih ke call site.** Retry, circuit breaker, observability, default header, semua di-config sekali di construction bean. Puluhan call site stay clean.

**Test jadi simpel.** Kamu mock interface. Implementasi yang test lihat adalah Mockito mock, alih-alih `WebClient` asli yang di-stub response-nya. Setup test turun separuh.

---

## Nambahin resilience di sekitarnya

Resilience4j integrate dengan bersih. Pattern-nya:

```java
@Bean
PaymentApi paymentApi(WebClient.Builder builder, CircuitBreakerRegistry cbRegistry) {
    WebClient client = builder.baseUrl("https://payment-svc.internal/").build();

    PaymentApi raw = HttpServiceProxyFactory.builder()
        .clientAdapter(WebClientAdapter.create(client))
        .build()
        .createClient(PaymentApi.class);

    return CircuitBreakerProxy.wrap(raw, cbRegistry.circuitBreaker("payment-api"));
}
```

`CircuitBreakerProxy.wrap` itu illustrative. Pattern-nya dynamic proxy yang wrap client yang di-generate. Beberapa library kasih ini. Kamu juga bisa nulis sendiri dalam 30 baris.

Point-nya: call site nggak pernah tau wrapping-nya ada. Mereka lihat `paymentApi.getPayment(id)` dan resilience policy invisible.

---

## Header yang beda per-call

Buat header yang call-specific (idempotency key, correlation ID, tenant ID), pakai parameter:

```java
@PostExchange("/payments")
Payment create(
    @RequestBody CreatePaymentRequest request,
    @RequestHeader("Idempotency-Key") String idempotencyKey,
    @RequestHeader("X-Tenant-Id") String tenantId
);
```

Buat header yang konstan per service (auth token, version marker), pakai filter `WebClient.Builder`:

```java
WebClient client = builder
    .baseUrl("https://payment-svc.internal/")
    .defaultHeader("Authorization", () -> "Bearer " + tokenSource.current())
    .filter((request, next) -> {
        var enriched = ClientRequest.from(request)
            .header("X-Trace-Id", MDC.get("traceId"))
            .build();
        return next.exchange(enriched);
    })
    .build();
```

Split-nya keep interface fokus ke apa yang logically variable per call.

---

## Streaming response dan reactive return type

Interface support reactive return type buat streaming atau non-blocking flow:

```java
public interface PaymentApi {

    @GetExchange("/payments/{id}")
    Mono<Payment> getPaymentReactive(@PathVariable String id);

    @GetExchange("/payments")
    Flux<Payment> listPayments(@RequestParam Map<String, String> filters);
}
```

Di Spring Boot 4 dengan virtual threads enabled, variant synchronous scale hampir identik sama reactive buat workload typical. Gw default ke synchronous kecuali ada requirement backpressure atau streaming yang sungguhan.

---

## Pattern test

Interface gampang di-mock:

```java
@SpringBootTest
class BillingServiceTest {

    @MockBean
    PaymentApi paymentApi;

    @Autowired
    BillingService billingService;

    @Test
    void chargesCustomerOnApproval() {
        when(paymentApi.create(any())).thenReturn(
            new Payment("pay_123", "APPROVED", BigDecimal.valueOf(100)));

        var result = billingService.charge("cust_1", BigDecimal.valueOf(100));

        assertThat(result.status()).isEqualTo("CHARGED");
        verify(paymentApi).create(argThat(req -> req.amount().equals(BigDecimal.valueOf(100))));
    }
}
```

Buat integration test di mana kamu mau HTTP layer asli tapi server-nya fake, pakai WireMock dan arahin `WebClient.baseUrl` ke instance WireMock. Interface stay unchanged.

---

## Migration: dari RestClient ke Service Client

Kalau kamu punya kode `RestClient` existing, migration-nya mechanical:

1. **List method** dari client existing (read, write, list).
2. **Define interface** dengan satu method per method existing.
3. **Replace config bean** dengan proxy factory.
4. **Update consumer** pake interface, alih-alih client lama. Compile error nge-guide kamu.
5. **Hapus class client lama.**

Per service, migration ini sekitar 30 menit. Diff-nya bikin value-nya kelihatan.

---

## Yang abstraksi ini nggak kasih

Tanggung jawab kamu sendiri buat pilih timeout, retry policy, threshold circuit-breaker, dan config `WebClient` underlying (connection pool size, SSL trust). Interface itu kontrak, sementara policy tetap urusan kamu.

Kalau mau standardize default-default itu di seluruh microservice fleet, build ke shared `WebClient.Builder` config yang semua service client depend.
