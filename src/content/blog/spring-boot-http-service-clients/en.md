---
title: "Spring Boot 4 HTTP Service Clients: Replacing RestClient Boilerplate"
description: "How interface-based HTTP clients work in Spring Boot 4, when to use them, and how to wire retries, timeouts, and tests around them."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["java", "spring-boot", "spring-boot-4", "http"]
draft: false
---

This is a deeper look at HTTP Service Clients from the [Spring Boot 4 in practice post](/blog/spring-boot-4-in-practice/). It's the migration with the highest leverage-per-line in the Spring Boot 4 release if your codebase has hand-rolled `RestClient` or `WebClient` calls.

---

## What the abstraction does

You declare an interface that describes the remote API. Spring generates the implementation:

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

Wired up with a factory bean:

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

That's the whole setup. The interface is your contract, the implementation is generated, and consumers see a clean Java type.

---

## Why this is worth migrating to

Three things you get for free.

**The interface is documentation.** Anyone reading the code sees the remote API at a glance: HTTP method, path, parameters, return type. There's no chasing through `WebClient.uri(...).retrieve(...)` chains to figure out what's being called.

**Cross-cutting concerns attach to the bean, not the call site.** Retries, circuit breakers, observability, default headers - all configured once at bean construction. The dozens of call sites stay clean.

**Testing gets simpler.** You mock an interface. The implementation that a test sees is a Mockito mock, not a real `WebClient` with stubbed responses. Test setup drops by half.

---

## Adding resilience around it

Resilience4j integrates cleanly. The pattern:

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

`CircuitBreakerProxy.wrap` is illustrative. The pattern is a dynamic proxy that wraps the generated client. Several libraries provide this. You can also write one yourself in 30 lines.

The point is that the call sites never know the wrapping exists. They see `paymentApi.getPayment(id)` and the resilience policy is invisible.

---

## Headers that change per call

For headers that are call-specific (idempotency keys, correlation IDs, tenant IDs), use a parameter:

```java
@PostExchange("/payments")
Payment create(
    @RequestBody CreatePaymentRequest request,
    @RequestHeader("Idempotency-Key") String idempotencyKey,
    @RequestHeader("X-Tenant-Id") String tenantId
);
```

For headers that are constant per service (auth tokens, version markers), use a `WebClient.Builder` filter:

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

The split keeps the interface focused on what's logically variable per call.

---

## Streaming responses and reactive return types

The interface supports reactive return types for streaming or non-blocking flows:

```java
public interface PaymentApi {

    @GetExchange("/payments/{id}")
    Mono<Payment> getPaymentReactive(@PathVariable String id);

    @GetExchange("/payments")
    Flux<Payment> listPayments(@RequestParam Map<String, String> filters);
}
```

In Spring Boot 4 with virtual threads enabled, the synchronous variants scale almost identically to the reactive ones for typical workloads. I'd default to synchronous unless you have a real backpressure or streaming requirement.

---

## Testing patterns

The interface mocks cleanly:

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

For integration tests where you want a real HTTP layer but a fake server, use WireMock and point the `WebClient.baseUrl` at the WireMock instance. The interface stays unchanged.

---

## Migration: from RestClient to Service Client

If you have existing `RestClient` code, the migration is mechanical:

1. **List the methods** of the existing client (read, write, list).
2. **Define the interface** with one method per existing method.
3. **Replace the configuration bean** with the proxy factory.
4. **Update consumers** to use the interface instead of the old client. Compile errors guide you.
5. **Remove the old client class.**

Per service, this is a 30-minute migration. The diff makes the value obvious.

---

## What the abstraction doesn't give you

It's still your responsibility to choose timeouts, retry policies, circuit-breaker thresholds, and the underlying `WebClient` configuration (connection pool size, SSL trust). The interface is the contract, not the policy.

If you want to standardise those defaults across a microservice fleet, build them into a shared `WebClient.Builder` configuration that all service clients depend on.
