---
title: "Architecture Trade-offs You Can Defend"
description: "The architecture decisions that come up most often in Java backend work. Event-driven vs request-response, CQRS, hexagonal, when to split a microservice, REST vs gRPC vs GraphQL, ADRs."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["java", "architecture", "system-design", "engineering"]
draft: false
---

The [parent roadmap post](/blog/java-roadmap-ai-era/) said the signal you're senior in the AI era is the trade-offs you can articulate without googling. This post is the short list of those trade-offs in Java backend architecture, with the way I'd default to thinking about each one.

This is opinion-heavy. Take it as a starting point for your own argument, not a final answer. This is part 6 of the series.

---

## Event-driven vs request-response

Default to request-response. Events are the right tool when you genuinely need decoupling, ordering guarantees across consumers, or async processing of slow operations. Most "let's make this event-driven" decisions I see are about avoiding a sync call to a slow service, which is better solved with a queue and a faster API than with full event-sourcing.

When events are the right call:

- Multiple consumers need the same event, and you don't want the producer to know about them.
- The work is genuinely async (notification fan-out, ETL, audit logging).
- Cross-service ordering matters and a queue can't provide it.

When events are the wrong call:

- "We might need it later." You won't, and the operational cost of running Kafka well is not zero.

---

## CQRS, when and when not

Mostly, not. CQRS is right when read and write workloads have genuinely different scaling characteristics, when you need different data shapes for reads vs writes, or when you want to add read-only replicas without touching the write path.

CQRS is wrong when "we want to use CQRS" is the reason. The split adds operational complexity (event store, replica health, read/write lag) that needs to be paid for by a real divergence between the two paths.

For a typical CRUD service, you don't need CQRS. Boring `@Service` with `DatabaseClient` will scale further than people expect.

---

## Hexagonal architecture: your business logic shouldn't import Spring

The case for hexagonal (ports-and-adapters): business logic has zero framework dependencies, tests run without an application context, swapping infrastructure (database, queue, HTTP framework) becomes a single-adapter change. The case against: you write more code, and the interface boundary is one more thing for a junior to navigate.

The compromise I'd default to in 2026: keep the domain layer Spring-free, but don't extend the discipline to every controller and repository. The discipline pays off where the business logic is rich and changes often. It doesn't pay off in CRUD adapters.

The signal you've gone too far: when adding a new field requires touching seven files. The signal you haven't gone far enough: when changing the database means rewriting your service layer.

---

## When to split a microservice

Default to monolith. Split when you have a real boundary, not a logical one. The signs of a real boundary:

- The two halves have different release cycles (one ships weekly, the other quarterly).
- The two halves have different failure modes you want to isolate.
- The teams owning the two halves are genuinely separate, with their own roadmaps.

The signs of a fake boundary, where you should not split:

- "This module feels too big" without a measurable problem.
- Conway's Law applied prematurely, before the team is split.
- "Microservices are best practice" as the only justification.

A split that doesn't have a real boundary creates a distributed monolith, which has all of the operational costs of microservices and none of the autonomy benefits.

---

## API design: REST vs gRPC vs GraphQL

REST is the default. gRPC is the right call for service-to-service communication where you control both ends, want strong typing, and care about latency or bandwidth. GraphQL is the right call for client-facing APIs where the clients are diverse and want to shape their own queries.

The mistakes I see most often:

- gRPC for a public API. Most third-party developers don't have gRPC tooling at hand. REST stays.
- GraphQL for an internal service-to-service call. The flexibility costs you observability (every query is unique) and rate-limiting becomes harder.
- REST for everything when a typed contract would catch bugs. If you're already using OpenAPI specs, you're 80% of the way to the value gRPC provides.

---

## Data modelling: boring is often correct

Event sourcing isn't always right. Append-only logs aren't always right. Boring CRUD with a clear schema is the right call more often than people want to admit.

The patterns I'd default to:

- **CRUD with a relational database** for most service-owned data. Postgres covers 95% of cases.
- **Append-only event log** when you genuinely need an audit trail or temporal queries.
- **Document store** when the data shape varies a lot per record and you don't query across documents often.

If you can't articulate why your data needs anything more exotic than CRUD, it probably doesn't.

---

## Architecture Decision Records

Write ADRs. The format I'd default to:

```markdown
# ADR-N: <Decision>

## Status
Accepted / Superseded by ADR-X

## Context
What's the situation that requires a decision?

## Decision
What did we decide?

## Consequences
What are the trade-offs of this decision?
```

The ADR isn't for explaining what you did. It's for explaining why, so future-you (or a new joiner) can decide whether the decision still applies. The most underrated ADR pattern: when you supersede an ADR, link to the new one but keep the old one. The history is the value.

---

## What this isn't

This isn't a complete catalog of architecture patterns. It's the short list of decisions that come up most often in Java backend work and where I think the default answer is opposite to what's most fashionable.

The architecture you can defend is the one where you can articulate the cost of each choice. If you can't articulate the cost, you're choosing on vibes, and the choice will fall over the first time it's stress-tested.

This concludes the five-post follow-up series to the parent Java roadmap. If there are gaps you want filled, let me know.
