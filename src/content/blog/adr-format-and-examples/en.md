---
title: "Writing Your First ADR (and the Next Twenty)"
description: "What an Architecture Decision Record is, when to write one, the format I'd default to, and a worked example for a non-trivial decision."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["architecture", "documentation", "engineering", "adr"]
draft: false
---

This is the deeper version of the ADR section in the [architecture trade-offs post](/blog/architecture-tradeoffs/). ADRs are one of those documentation patterns that look like overhead until the first time you join a project that has them, after which you wonder how you ever worked without them.

---

## What an ADR is for

An Architecture Decision Record captures one decision: what was decided, why, what the alternatives were, and what trade-offs were accepted. The document is short. The thinking that goes into it is the value.

ADRs aren't:

- A catalog of all your architecture (that's documentation).
- A description of the current state (that's a system diagram).
- A retrospective of what went well or poorly (that's a postmortem).

ADRs are decision points. Each one captures the moment a non-obvious choice was made and the reasoning behind it.

---

## When to write one

The bar I'd default to: write an ADR when the decision is hard to reverse, when the reasoning will be hard to reconstruct later, or when you'd want a future joiner to understand why this was done rather than something else.

Concretely:

- **Tech stack choices** (database, message broker, language runtime).
- **Architecture boundaries** (microservice splits, hexagonal vs layered).
- **Data model choices** (event-sourced vs CRUD, normalised vs denormalised).
- **API contract decisions** (REST vs gRPC, versioning strategy).
- **Cross-cutting concerns** (auth model, observability stack, deployment topology).

Don't write an ADR for: dependency upgrades, library swaps that don't change the architecture, code style choices, or anything reversible in an afternoon.

---

## The format

The ADR format I'd default to (sometimes called the MADR format, with small variations):

```markdown
# ADR-N: <Title>

## Status
Proposed | Accepted | Superseded by ADR-X | Deprecated

## Context
What's the situation that requires a decision? What forces are at play?

## Decision
What did we decide? State it clearly.

## Alternatives Considered
What other options were on the table? Why weren't they chosen?

## Consequences
What are the trade-offs of this decision? What becomes easier? What becomes harder?
```

Five sections. Most ADRs fit on one page. If yours runs to three pages, the decision is probably more than one decision.

---

## A worked example

Here's an ADR for a decision I see come up often:

```markdown
# ADR-007: Use R2DBC instead of JPA for the payment service

## Status
Accepted

## Context

The payment service handles 800-1500 requests per second during peak hours, with most operations being short reads (transaction lookup) or short writes (status updates). The team has used JPA on three prior services. JPA has become a known source of N+1 query bugs and lazy-loading issues during code review.

The service runs on virtual threads (Java 21+), so blocking I/O is no longer the scaling concern it was on traditional thread pools.

We need to decide between:

- JPA with Hibernate (familiar to the team)
- R2DBC with DatabaseClient (reactive, lower-level)
- Plain JDBC with a thin mapper (most explicit)

## Decision

Use R2DBC with DatabaseClient. Map results manually with record types as the domain output. Avoid Spring Data Repositories on this service.

## Alternatives Considered

**JPA with Hibernate.** Most familiar option. Rejected because the N+1 patterns we've seen on prior services consume more code-review time than the framework saves us. JPA's session-scoped lazy loading also conflicts with our preference for stateless service methods.

**Plain JDBC with a thin mapper.** Most explicit, lowest abstraction cost. Rejected because the boilerplate per query is high enough to slow new feature work measurably.

## Consequences

**Positive:**

- Queries are explicit. No surprise lazy loads. Code review catches more issues earlier.
- Result types are records, which compose cleanly with the rest of the service.
- Reactive pipeline is end-to-end, so streaming responses are natural.

**Negative:**

- The team needs to learn a new API. Estimated ramp: one sprint.
- No automatic schema migration via Hibernate. We'll need Flyway or Liquibase explicitly (we already use Flyway for other services).
- Some idioms common in JPA (entity inheritance, embedded value objects) need to be mapped manually.

**Open questions:**

- How do we want to handle transactions that span multiple repository calls? `TransactionalOperator` or method-level `@Transactional`? Decided to spike this in week 1.
```

That's the whole ADR. Roughly 350 words. A new joiner six months from now reads it and understands not just what we use but why we chose it.

---

## When to supersede an ADR

If a decision changes, don't delete the old ADR. Add a new one that supersedes it:

```markdown
# ADR-014: Move from R2DBC to JPA

## Status
Accepted (supersedes ADR-007)

## Context
[Eighteen months after ADR-007, the team's experience has shifted. Document why.]

## Decision
[New decision.]

## Consequences
[New trade-offs.]
```

And update the old one's status:

```markdown
# ADR-007: Use R2DBC instead of JPA for the payment service

## Status
Superseded by ADR-014

## Context
[Original content unchanged.]
```

The history is the value. A team that has 20 ADRs, three of which were superseded, has more institutional knowledge than a team that has 17 current ADRs and pretends the others never existed.

---

## Where to keep them

Two patterns work well.

**In the repo, alongside the code.** A `docs/adr/` directory with one file per ADR (`0001-database-choice.md`, `0002-versioning-strategy.md`). Pull requests that change architecture include an ADR in the same PR. The ADR review and the code review happen together.

**In a wiki or shared docs.** Easier to discover for non-engineering stakeholders. Harder to keep in sync with the actual code. I'd default to the repo unless the team works closely with non-engineers who need to read them.

---

## Who writes them

The person making or proposing the decision. The ADR is reviewed alongside the code change, often by the same reviewers, and merged when consensus is reached.

This isn't a "tech lead writes everything" pattern. Junior engineers writing their first ADR is one of the highest-leverage learning moments I've seen. The act of writing the alternatives and consequences sections forces a kind of thinking that's hard to teach any other way.

---

## What this isn't

This isn't a complete documentation strategy. ADRs cover decisions. You still need system diagrams, API references, runbooks, and onboarding docs. ADRs slot in alongside those, not in place of them.

If you're starting from zero, write your first three ADRs about decisions that have already been made, retroactively. The exercise of reconstructing the reasoning is useful, and the team gets a feel for the format before the next real decision shows up.
