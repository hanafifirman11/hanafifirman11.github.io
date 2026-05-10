---
title: "Surviving Production: The Wiring That Pays Off"
description: "The short list of what I'd wire into a Java service before it reaches production. OpenTelemetry, Micrometer business metrics, JFR, Resilience4j, and the operational chops that don't fit in code samples."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["java", "spring-boot", "production", "observability", "engineering"]
draft: false
---

Code in production behaves differently from code in your tests. The skill is reading that gap. This post is the short list of what I'd wire into a Java service before it reaches production, ordered by how often I've seen each one earn its space.

This is part 5 of the series.

---

## OpenTelemetry, set up before the first deployment

OpenTelemetry tracing is the single most useful production tool I've worked with. The setup is small, the payoff is large.

Spring Boot 3.x and 4.x have first-class OTel support. The minimum useful config:

```yaml
management:
  tracing:
    sampling:
      probability: 1.0   # 100% in dev/staging, lower in prod
  otlp:
    tracing:
      endpoint: http://otel-collector:4318/v1/traces

logging:
  pattern:
    level: "%5p [%X{traceId:-},%X{spanId:-}]"
```

Three things to do beyond auto-instrumentation:

1. **Add custom spans for business operations.** `@Observed` from Micrometer makes this two annotations.
2. **Propagate trace context across async boundaries** (Kafka, message queues). Auto-instrumentation handles HTTP. You do this for everything else.
3. **Include trace IDs in error responses.** When a customer reports an error, the trace ID is the difference between a 30-minute investigation and a 30-second one.

---

## Custom Micrometer metrics for business events

Generic JVM metrics are a baseline. Business metrics are where production observability earns its keep. The pattern I'd default to:

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

The dashboards built on top of these metrics are what get checked first when something is "off". CPU and memory tell you the JVM is healthy. Business metrics tell you the application is healthy.

---

## JFR (Java Flight Recorder) for profiling

JFR is built into the JVM and ships zero-cost recording. Enable it on production with a continuous-recording flag and you have the data to investigate any latency or memory issue after the fact:

```
-XX:StartFlightRecording=duration=0,filename=/var/log/jfr/recording.jfr,maxsize=500m
```

When something goes wrong, you pull the JFR file and analyse it with JDK Mission Control or async-profiler. The first time you fix a p99 latency issue from a flame graph, you cross a small threshold.

What JFR is good at: GC pauses, hot methods, lock contention, allocation profiling. What it isn't: distributed-system debugging (use traces) and business-logic bugs (use logs and breakpoints).

---

## Resilience patterns at every external call

Resilience4j is the library I'd default to. The patterns that earn their space:

- **Circuit breakers** on every external HTTP call. The default config (50% failure rate over 100 calls, 30-second open state) is a reasonable starting point.
- **Bulkheads** on call categories. Don't let a slow third-party API consume all your worker threads.
- **Timeouts** on every external call. The default of 30 seconds is wrong. Pick a real number based on the dependency's SLA.
- **Idempotency keys** on retried operations. Without these, "retry on failure" can mean "double-charge the customer".

The mistake I see most often: stacking every Resilience4j decorator without thinking about the order. Decorator order matters. Circuit-breaker outside retry behaves differently from retry outside circuit-breaker.

---

## Operational chops: the unglamorous part

The skills that don't fit in a code sample:

- **Reading logs across pods.** If your logs aren't aggregated to somewhere queryable, fix that before anything else.
- **Querying Prometheus directly.** Dashboards lie about what they show. PromQL is the source of truth.
- **Writing a useful runbook.** "If alert X fires, do Y" is more valuable than any architecture diagram. Runbooks should fit on one page.

This is the layer where AI helps least. Production debugging is reasoning under uncertainty about a specific system, and generic answers don't apply.

---

## Adoption order

If you're wiring these in for the first time, the order I'd default to:

1. **Logging with trace IDs.** The cheapest change, the highest immediate utility.
2. **OpenTelemetry tracing.** Single config block, immediate visibility.
3. **Business-event Micrometer metrics.** Pick three KPIs your service should report.
4. **JFR continuous recording.** Free, just turn it on.
5. **Resilience4j on every external call.** Last because it requires more design thought.

---

## What this isn't

This isn't a complete production checklist. It doesn't cover deployment, secret management, blue-green strategies, database migrations, or capacity planning. Each of those is a separate body of work.

The last post in this series gets into Phase 5 of the parent roadmap: the architecture trade-offs that come up after the production basics are wired in.
