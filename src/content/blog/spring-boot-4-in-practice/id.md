---
title: "Spring Boot 4 di Lapangan: Yang Gw Adopt Duluan"
description: "Short list fitur Spring Boot 4 yang earn migration cost-nya: HTTP Service Clients, virtual thread integration, API versioning, JSpecify null-safety, RestTestClient."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["java", "spring-boot", "spring-boot-4", "engineering"]
draft: false
---

Spring Boot 4.0 GA rilis akhir 2025 di atas Spring Framework 7, Spring Security 7, JUnit 6, Hibernate 7.1, dan Jackson 3. Changelog-nya panjang. Post ini short list dari yang gw adopt duluan kalau lagi upgrade project Spring Boot 3.x sekarang, plus trade-off masing-masing.

Ini bagian 3 dari seri.

---

## HTTP Service Clients (interface-based)

Perubahan paling praktis. Bikin interface, dapat client yang di-generate Spring:

```java
public interface PaymentApi {
    @GetExchange("/payments/{id}")
    Payment getPayment(@PathVariable String id);

    @PostExchange("/payments")
    Payment createPayment(@RequestBody CreatePaymentRequest request);
}

@Configuration
class HttpClientConfig {
    @Bean
    PaymentApi paymentApi(WebClient.Builder builder) {
        WebClient client = builder.baseUrl("https://payment-svc/").build();
        return HttpServiceProxyFactory.builder()
            .clientAdapter(WebClientAdapter.create(client))
            .build()
            .createClient(PaymentApi.class);
    }
}
```

Tiga hal yang gw rasa useful. Interface jadi double sebagai dokumentasi. Retry sama resilience policy nempel ke bean, nggak nyebar di call site. Test jadi simpel karena kamu mock interface, bukan stub `WebClient`. Kalau codebase-mu masih banyak `RestClient` boilerplate yang ditulis tangan, ini migration dengan leverage tertinggi per line.

---

## Virtual thread integration di HTTP client

Spring Boot 4 wire virtual thread ke seluruh HTTP client stack secara default kalau `spring.threads.virtual.enabled=true`. Praktisnya: kode synchronous-style sekarang scaling-nya kayak async tanpa rantai callback.

Kode yang gw bakal tulis sekarang:

```java
public List<EnrichedOrder> enrichOrders(List<String> orderIds) {
    return orderIds.parallelStream()
        .map(id -> orderApi.getOrder(id))   // blocking, tapi di virtual thread
        .map(this::enrich)
        .toList();
}
```

Ini dulu rantai reactive. Sekarang jadi plain stream. Cognitive load turun jelas buat engineer yang nggak pernah enjoy learning curve Reactor.

---

## API versioning, first-class

Spring Boot 4 punya built-in API versioning. Sebelum 3.x kamu harus roll-on sendiri pakai URL prefix, header, atau media type. Sekarang:

```java
@RestController
@RequestMapping("/api/payments")
class PaymentController {

    @GetMapping(value = "/{id}", version = "1")
    PaymentV1 getPaymentV1(@PathVariable String id) { /* ... */ }

    @GetMapping(value = "/{id}", version = "2")
    PaymentV2 getPaymentV2(@PathVariable String id) { /* ... */ }
}
```

Sumber version (URL, header, media type) di-config global. Yang gw appreciate: deprecate version cukup pakai satu annotation, bukan ngubah routing.

---

## Null-safety pakai JSpecify

Spring Boot 4 anggap serius annotation JSpecify (`@Nullable`, `@NonNull`) di seluruh framework. IDE catch lebih banyak issue di compile time. Migration cost-nya ada: kode existing butuh annotation buat ikut serta. Tapi payoff bug prevention-nya keluar cepat di code review pas udah masuk.

Adoption pattern yang praktis: nyalain JSpecify di module baru duluan. Module existing biarin un-annotated dulu. Jangan coba retrofit jutaan baris dalam satu sprint.

---

## RestTestClient

Test client baru ngeganti banyak ceremony `MockMvc`:

```java
@SpringBootTest
class PaymentControllerTest {

    @Autowired
    RestTestClient client;

    @Test
    void getPayment() {
        client.get().uri("/api/payments/123")
            .exchange()
            .expectStatus().isOk()
            .expectBody(Payment.class)
            .satisfies(p -> assertThat(p.id()).isEqualTo("123"));
    }
}
```

Kebacanya lebih linear daripada `MockMvc`, dan client yang sama jalan buat Spring MVC dan WebFlux. Ini perubahan yang gw saranin test baru pakai, walaupun test existing biarin di `MockMvc`.

---

## Modular codebase: perubahan under-the-hood

Spring Boot 4 split codebase-nya ke module yang lebih kecil. Mostly tim nggak bakal notice langsung, tapi ada dua practical wins: startup lebih cepat (auto-config class yang ke-load default lebih sedikit) dan native image GraalVM lebih kecil. Kalau kamu ship Spring Boot AOT-compiled, drop binary size-nya cukup berasa.

---

## Migration: mulai dari mana

Urutan migration yang udah gw lihat work pas tim ngerjain:

1. **Bump versi Spring Boot**, fix compile error yang kelihatan, ship.
2. **Tambah JSpecify di satu module baru.** Bikin tim nyaman dulu sama annotation-nya sebelum retrofit.
3. **Migrate satu external HTTP integration ke Service Clients.** Diff-nya bikin value-nya kelihatan.
4. **Switch test baru ke RestTestClient.** Jangan rewrite yang udah ada.
5. **Enable virtual threads** sebagai config flag. Measure tail latency before-after.

Urutan-nya less important than nggak coba semua sekaligus.

---

## What this isn't

Ini post "what to adopt first", bukan tour lengkap Spring Boot 4. Release notes lengkap cover puluhan improvement kecil (config property changes, test slice updates, observability defaults) yang mungkin kena codebase-mu, mungkin nggak. Baca itu pas kamu actual upgrade.

Post berikutnya di seri ini masuk ke Phase 3 dari parent roadmap: AI-assisted workflow yang nahan di code review, di luar one-liner spec-first.
