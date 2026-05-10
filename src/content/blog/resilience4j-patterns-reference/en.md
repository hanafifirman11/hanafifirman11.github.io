---
title: "Resilience4j Patterns Reference: Circuit Breaker, Bulkhead, Retry, Timeout"
description: "What each Resilience4j pattern does, when to use it, the default configuration that's a reasonable starting point, and why decorator order matters."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["java", "spring-boot", "resilience4j", "production"]
draft: false
---

This is the deeper version of the Resilience4j section in the [surviving production post](/blog/surviving-production-java/). Each pattern in Resilience4j has a specific failure mode it's designed to handle. Stacking them without understanding which mode each one addresses is one of the most common mistakes I see.

---

## The five patterns worth knowing

Resilience4j ships several decorators. The five that matter for typical Spring Boot services:

- **Circuit Breaker** - stops sending traffic to a failing dependency
- **Retry** - re-attempts a failed call
- **Timeout** - bounds how long a call waits
- **Bulkhead** - limits concurrent calls
- **Rate Limiter** - limits call frequency

Each one solves a different problem. None of them solves all of them.

---

## Circuit Breaker

**What it does.** Tracks the success/failure rate of calls to a dependency. If failures cross a threshold, the breaker opens and rejects calls without attempting them. After a cool-down period, it allows a few test calls (half-open) to see if the dependency has recovered.

**When to use it.** On every call to an external system you don't control. The failure mode it prevents: a slow or failing dependency dragging down your own latency or thread pool.

**Reasonable starting config:**

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

That config opens the breaker if 50% of the last 100 calls fail or are slow (slower than 2s), waits 30 seconds before testing again, and allows 3 test calls during recovery.

**Common mistake.** Setting `slidingWindowSize` too small. A window of 10 means the breaker reacts to noise. A window of 100+ smooths out the signal.

---

## Retry

**What it does.** Re-attempts a failed call up to N times, with optional backoff between attempts.

**When to use it.** On calls that have a reasonable chance of transient failure: HTTP timeouts, connection resets, 503 responses. The failure mode it addresses: temporary unavailability that resolves on its own.

**Reasonable starting config:**

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

That config retries up to 3 times with exponential backoff, but only for the listed exception types.

**Common mistake.** Retrying on all exceptions, including business validation errors. Retrying a 400 response three times doesn't make it a 200. Use `ignoreExceptions` to exclude the ones that won't change.

**The other common mistake.** Retrying without an idempotency key. If a payment call times out and you retry, you might double-charge the customer. Pair retries with idempotency keys at the call site.

---

## Timeout

**What it does.** Bounds how long a call can wait before throwing a timeout exception.

**When to use it.** On every external call. The failure mode it addresses: a hung call holding a worker thread indefinitely.

**Reasonable starting config:**

```yaml
resilience4j.timelimiter:
  instances:
    payment-api:
      timeoutDuration: 5s
      cancelRunningFuture: true
```

5 seconds is a placeholder. The right number depends on the dependency's actual SLA. Don't accept the default 30 seconds without thinking about it.

**Common mistake.** Setting all timeouts to the same value. A timeout for a "list customers" endpoint should be different from a timeout for a "approve payment" endpoint. Per-endpoint timeouts are worth the configuration overhead.

---

## Bulkhead

**What it does.** Limits how many concurrent calls can be in flight to a particular dependency. Calls beyond the limit either wait or are rejected.

**When to use it.** When you have multiple downstream dependencies and you want to prevent one slow dependency from consuming all your worker threads. The failure mode it addresses: thread-pool exhaustion that makes a fast service unable to respond because a slow service is hogging the pool.

**Reasonable starting config:**

```yaml
resilience4j.bulkhead:
  instances:
    payment-api:
      maxConcurrentCalls: 25
      maxWaitDuration: 100ms
```

That config allows 25 concurrent calls to `payment-api`, with new calls waiting up to 100ms before being rejected.

**Common mistake.** Skipping bulkheads on the assumption that virtual threads make them unnecessary. Virtual threads handle the thread-pool problem at the JVM level, but bulkheads still matter for limiting load on the downstream dependency itself.

---

## Rate Limiter

**What it does.** Limits how many calls per time window can go to a dependency.

**When to use it.** When the dependency has a documented rate limit you must respect, or when you want to protect a slow dependency from your own bursts. The failure mode it addresses: getting yourself rate-limited by an upstream provider.

**Reasonable starting config:**

```yaml
resilience4j.ratelimiter:
  instances:
    third-party-api:
      limitForPeriod: 100
      limitRefreshPeriod: 1s
      timeoutDuration: 50ms
```

That config allows 100 calls per second, with new calls waiting 50ms before being rejected.

**Common mistake.** Treating rate-limiting as the same problem as bulkheads. They're not. Bulkheads control concurrency. Rate limiters control frequency. You can have low concurrency and high frequency, or vice versa.

---

## Decorator order matters

If you stack multiple Resilience4j decorators, the order you compose them in changes the behaviour. The Spring Boot starter applies them in this default order, from outermost to innermost:

1. Bulkhead
2. TimeLimiter
3. RateLimiter
4. CircuitBreaker
5. Retry

That order means: bulkhead admission happens first, then time-limit applies to the entire chain (including retries), then the rate limiter, then the circuit breaker checks state, then the retry happens around the actual call.

The implication: **retries happen inside the circuit breaker, not outside**. If the circuit is open, the retry doesn't fire. That's almost always what you want.

If you compose decorators manually with `Decorators.ofSupplier(...)`, you need to think about order yourself. The default order is a reasonable starting point. Don't change it without a reason.

---

## When to use which

A rough decision tree:

- **Calling any external service:** Circuit Breaker + Timeout, always.
- **External service has known transient failures:** Add Retry.
- **External service has a published rate limit:** Add Rate Limiter.
- **You have multiple downstream services and one might go slow:** Add Bulkhead per dependency.

The minimum I'd ship: Circuit Breaker + Timeout. Everything else is contextual.

---

## What this isn't

This isn't a complete Resilience4j reference. It doesn't cover the metrics integration, the event publisher API, the cache decorator, or the fallback patterns. The official docs cover those well.

The patterns above are what I reach for first when wiring resilience into a new Spring Boot service. The rest is contextual.
