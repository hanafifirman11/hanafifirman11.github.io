---
title: "Spring Boot 4 in Practice: What I Adopt First"
description: "The short list of Spring Boot 4 features that earn their migration cost: HTTP Service Clients, virtual thread integration, API versioning, JSpecify null-safety, RestTestClient."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["java", "spring-boot", "spring-boot-4", "engineering"]
draft: false
---

Spring Boot 4.0 GA shipped in late 2025 on top of Spring Framework 7, Spring Security 7, JUnit 6, Hibernate 7.1, and Jackson 3. The changelog is long. This post is the short list of what I'd adopt first if I were upgrading a Spring Boot 3.x project today, with the trade-offs that come with each.

This is part 3 of the series.

---

## HTTP Service Clients (interface-based)

The biggest practical change. Define an interface, get a client implementation generated for you:

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

Three things I find useful. The interface doubles as documentation. Retries and resilience policies attach to the bean rather than getting scattered through call sites. Tests get simpler because you mock an interface instead of stubbing a `WebClient`. If your codebase has hand-written `RestClient` boilerplate, this is the migration with the highest leverage-per-line.

---

## Virtual thread integration in HTTP clients

Spring Boot 4 wires virtual threads through the HTTP client stack by default when `spring.threads.virtual.enabled=true`. In practice: synchronous-style HTTP code now scales like async code without the callback chain.

The kind of code I'd write today:

```java
public List<EnrichedOrder> enrichOrders(List<String> orderIds) {
    return orderIds.parallelStream()
        .map(id -> orderApi.getOrder(id))   // blocks, but on a virtual thread
        .map(this::enrich)
        .toList();
}
```

This used to be a reactive chain. Now it can be a plain stream. The cognitive load drops noticeably for engineers who never enjoyed the Reactor learning curve.

---

## API versioning, first-class

Spring Boot 4 has built-in API versioning. Until 3.x you had to roll your own with URL prefixes, headers, or media types. Now:

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

The version source (URL, header, media type) is configured globally. The thing I appreciate: deprecating a version becomes a single annotation rather than a routing change.

---

## Null-safety with JSpecify

Spring Boot 4 takes JSpecify annotations (`@Nullable`, `@NonNull`) seriously across the framework. Your IDE catches more issues at compile time. The migration cost is real: existing code needs annotations to participate. The bug-prevention payoff shows up quickly in code review once you're in.

Practical adoption pattern: turn JSpecify on for new modules first. Leave existing modules unannotated for now. Don't try to retrofit a million lines in one go.

---

## RestTestClient

The new test client replaces a lot of `MockMvc` ceremony:

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

It reads more linearly than `MockMvc`, and the same client works for both Spring MVC and WebFlux applications. This is the change I'd recommend new tests use, even if existing tests stay on `MockMvc`.

---

## Modular codebase: the under-the-hood change

Spring Boot 4 splits its codebase into smaller modules. Most teams won't notice this directly, but two practical wins: faster startup (fewer auto-config classes loaded by default) and smaller GraalVM native images. If you're shipping AOT-compiled Spring Boot, the binary size drop is meaningful.

---

## Migration: where to start

A migration order that's worked when I've seen teams do it:

1. **Bump Spring Boot version**, fix the obvious compile errors, ship.
2. **Add JSpecify on one new module.** Get the team comfortable with the annotations before retrofitting.
3. **Migrate one external HTTP integration to Service Clients.** The diff makes the value obvious.
4. **Switch new tests to RestTestClient.** Don't rewrite existing.
5. **Enable virtual threads** as a config flag. Measure tail latency before and after.

The order matters less than not trying to do everything at once.

---

## What this isn't

This is a "what to adopt first" post, not a complete Spring Boot 4 tour. The full release notes cover dozens of smaller improvements (configuration property changes, test slice updates, observability defaults) that may or may not affect your codebase. Read those when you do the actual upgrade.

The next post in this series gets into Phase 3 of the parent roadmap: an AI-assisted workflow that holds up under code review, beyond just the spec-first one-liner.
