---
title: "Modern Java Patterns That Earn Their Keep"
description: "The Java patterns I'd reach for first when modernising a Spring Boot codebase. Records, sealed types, virtual threads, structured concurrency, with the trade-offs that come with each."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["java", "modern-java", "spring-boot", "loom", "engineering"]
draft: false
---

The [parent roadmap post](/blog/java-roadmap-ai-era/) said "stop writing 2018 Java." This is the more concrete version: the patterns I'd reach for first if I were modernising a Spring Boot codebase today, and where each one starts to fray at the edges.

This is part 2 of the series.

---

## Records: cheaper to write, harder to misuse

Records replace 90% of the DTOs and value objects I write. Validation goes in the compact constructor:

```java
public record TransferRequest(
    String fromAccountId,
    String toAccountId,
    BigDecimal amount,
    Currency currency
) {
    public TransferRequest {
        if (amount.signum() <= 0) {
            throw new IllegalArgumentException("amount must be positive");
        }
        if (fromAccountId.equals(toAccountId)) {
            throw new IllegalArgumentException("source and destination must differ");
        }
    }
}
```

What records aren't for: JPA entities (the spec requires mutability), classes that need synthetic identity, anything that would benefit from inheritance. Outside those cases I'd default to records.

Where they get awkward: when you want a "wither" that copies-with-one-field-changed, the boilerplate ends up not much shorter than just writing a regular class. The community has converged on compact constructors plus copy methods, but it's worth knowing this is one place records leave you slightly hanging.

---

## Sealed classes plus pattern matching: algebraic types you can compile-check

Sealed classes get useful when you pair them with pattern matching for switch. The pattern I deploy most often is a result type:

```java
public sealed interface PaymentResult permits Approved, Declined, NeedsReview {}

public record Approved(String authCode) implements PaymentResult {}
public record Declined(String reason, ErrorCode code) implements PaymentResult {}
public record NeedsReview(String caseId, RiskScore score) implements PaymentResult {}

public String summary(PaymentResult r) {
    return switch (r) {
        case Approved(var auth) -> "ok, auth=" + auth;
        case Declined(var reason, var code) -> "declined: " + reason + " (" + code + ")";
        case NeedsReview(var caseId, var score) -> "review: " + caseId + " score=" + score;
    };
}
```

Two reasons this earns its space. The switch is exhaustive at compile time, so adding a new variant fails the build until every consumer handles it. Deconstruction patterns let you pull fields out without writing a separate accessor call. The result type is the pattern I'd reach for first. State machines are a close second.

---

## Virtual threads: when, and when not

Loom is one of the cleaner upgrades I've seen in Java, but it's also where I see the most over-application. The rough rule I'd default to:

| Workload | Use virtual threads? |
|---|---|
| HTTP server handling many concurrent requests, mostly waiting on JDBC or HTTP | Yes |
| CPU-bound batch processing | No, use parallel streams or ForkJoin |
| Code that pins to native or holds long monitor locks | No, falls back to platform thread |
| Existing `CompletableFuture.thenApply` chains | Maybe, see structured concurrency below |

The painless adoption pattern: enable virtual threads for the web server only (`spring.threads.virtual.enabled=true` in Spring Boot 3.2+), and let the rest of the codebase stay as it was. The wins show up in concurrency under load without the team needing to learn anything new.

The thing that surprises people: virtual threads do not magically remove the need for backpressure. If your downstream is slower than you, you still need bounded queues somewhere.

---

## Structured concurrency: JEP 505 preview in Java 25

This is the one I've been waiting for. The structured-task-scope pattern replaces most of the manual `CompletableFuture` orchestration I've written:

```java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var customer = scope.fork(() -> customerService.find(id));
    var balance = scope.fork(() -> balanceService.snapshot(id));
    var risk = scope.fork(() -> riskService.score(id));

    scope.join().throwIfFailed();

    return new EnrichedCustomer(customer.get(), balance.get(), risk.get());
}
```

Three things working well there. Cancellation propagates up automatically. The scope ends when the block ends. The type-checker keeps you honest about which forks must succeed. The downside is that it's preview, so production adoption depends on your team's appetite for `--enable-preview` flags.

If your codebase has fan-out service calls written as `CompletableFuture.allOf(a, b, c).thenApply(...)`, this is a clean refactor target.

---

## Pattern matching for switch: stop writing instanceof cascades

Smaller improvement, but the one that touches the most existing code. If you have any of these patterns:

```java
if (event instanceof Created c) {
    handleCreated(c);
} else if (event instanceof Updated u) {
    handleUpdated(u);
} else if (event instanceof Deleted d) {
    handleDeleted(d);
} else {
    throw new IllegalStateException("unknown event");
}
```

Replace with:

```java
return switch (event) {
    case Created c -> handleCreated(c);
    case Updated u -> handleUpdated(u);
    case Deleted d -> handleDeleted(d);
};
```

If `event` is sealed, you can drop the throw because the compiler knows the cases are exhaustive. This pairs naturally with the sealed-class pattern earlier.

---

## Adoption order, if you're rolling these out

If you're putting these into an existing codebase, the order I'd default to:

1. **Records** first. Lowest blast radius, immediate readability gains.
2. **Pattern matching for switch** second. Mostly mechanical refactor of existing instanceof chains.
3. **Sealed classes** when a new domain type is being introduced. Don't retrofit unless there's a clear win.
4. **Virtual threads** at the web-server boundary. Single config flag, scales automatically.
5. **Structured concurrency** last. Pick this one up when JEP 505 leaves preview, or earlier if your team is comfortable with `--enable-preview`.

---

## What this isn't

This isn't a complete tour of every Java feature added since 17. There's a long tail of smaller improvements (text blocks, `var`, switch expressions) that I'm assuming are already in your codebase. If they aren't, those come before any of the above.

The next post in this series steps into Phase 2 of the parent roadmap: what's worth your time in Spring Boot 4, beyond the changelog summary.
