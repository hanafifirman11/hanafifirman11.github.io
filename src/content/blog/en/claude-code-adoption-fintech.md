---
title: "Real-World Claude Code Adoption in an Engineering Team: Not Hype, Here's the Data"
description: "110,172 lines accepted, 99.5% accept rate. An honest story about adopting Claude Code in a payment fintech engineering team — what worked, what didn't, and lessons from the field."
publishedAt: 2026-04-23
category: ai-engineering
tags: ["ai", "claude-code", "engineering", "fintech", "developer-tools"]
draft: false
---

I'm not someone who gets easily excited by *AI tools hype*. Too many tools have arrived with revolutionary claims only to wither before they ever reached a production environment.

But this number made me stop for a moment:

> **110,172 lines of code accepted. 99.5% suggestion accept rate.**

That's data from our engineering team over one month — not a benchmark, not a demo environment. A production codebase, payment fintech, Java + Spring Boot + microservices.

Here's the honest story.

---

## Context: Who We Are

We're an engineering team at a payment gateway company handling millions of transactions per day. Our primary stack: Java (7 through 21, yes all those versions coexist), Spring Boot, PostgreSQL, Kafka, Kubernetes on Alibaba Cloud.

Not a greenfield startup with a clean codebase. We have legacy systems that have been running for over a decade, integrations with dozens of banks and payment networks, and PCI DSS compliance standards that cannot be compromised.

Conditions that aren't ideal for experimenting with AI coding tools — and that's exactly what makes the data interesting.

---

## Why We Started Using Claude Code

Not because we were following a trend. We had real problems:

1. **Slow velocity on repetitive tasks** — generating unit tests, creating new service boilerplate, internal documentation. All manual, all consuming engineer time that should be focused on problem solving.

2. **Inefficient knowledge transfer** — old codebase with undocumented logic. Onboarding new engineers took weeks just to understand basic flows.

3. **Code review bottleneck** — SAs and Tech Leads became bottlenecks because reviewers were limited.

Claude Code came in as an experiment — not a top-down mandate, but from our own curiosity.

---

## What We Did First

The right first step: **build an internal skill marketplace**.

Instead of letting engineers use Claude Code without guidance, we built a collection of `SKILL.md` files — instruction files that gave Claude Code specific context about our codebase. One plugin per use case:

- `service-test-generator` — generate unit tests following our Spring Boot patterns
- `api-contract-reviewer` — review OpenAPI specs against internal standards
- `migration-helper` — help convert JPQL to native PostgreSQL queries

This was a game changer. Claude Code without domain context is smart but generic. With the right SKILL.md, the output becomes immediately relevant to our specific codebase.

---

## The Data: One Month of Usage

From our Claude Team analytics dashboard:

| Metric | Value |
|---|---|
| Lines of code accepted | 110,172 |
| Suggestion accept rate | 99.5% |
| Active members | 5 out of 10 |

The 99.5% accept rate is the most interesting number. It means that out of every 200 suggestions Claude Code gave, only 1 was rejected by an engineer.

Does this mean Claude Code is always correct? No.

It means our engineers have learned **how to ask the right questions**. Garbage in, garbage out still applies. But when the prompt is specific and the context is clear, the output is consistently worth accepting.

---

## What Actually Helped

**1. Unit test generation**

This was the most significant impact. Engineers who previously needed 2–3 hours to write a comprehensive test suite for a service can now finish in 30–45 minutes. Not because Claude Code writes everything — but because the initial draft is already 70% correct and only needs refinement.

**2. Debugging legacy code**

Feeding Claude Code a piece of undocumented Java 7 code and asking for an explanation of the flow. Consistently produces accurate explanations. This is extremely helpful for new engineers during onboarding.

**3. Boilerplate for repeating patterns**

We have standard patterns for creating Kafka consumers, REST clients with retry logic, or DTO mappers. Claude Code with SKILL.md context can generate these following our internal standards.

---

## What Didn't Work (Or Hasn't Yet)

**1. Complex business logic in the payment domain**

QRIS reconciliation flows, settlement calculations with edge cases specific to certain banks, fee calculations with merchant-specific rules — these cannot be handed off to Claude Code blindly. The output looks correct but subtle errors in payment business logic can lead to financial loss.

Lesson: Claude Code is a *thought partner*, not a *decision maker* for critical domains.

**2. Half the team doesn't use it**

5 out of 10 members were active. The other 5: zero usage. Not because it was forbidden — but because adoption didn't happen organically on its own. It requires active effort to onboard, not just granting access.

**3. Context window limits on legacy monoliths**

For large, tightly coupled codebases, Claude Code sometimes loses context mid-task. It needs help by having the right files open, not an expectation that Claude Code "figures it out on its own."

---

## Lessons for SAs / Tech Leads

If you're responsible for AI tool adoption on your team:

**Don't let go of the wheel.** Engineers need to be taught effective prompting, how to validate output, and when not to trust AI.

**Build guardrails first, then open access.** Our SKILL.md files are guardrails — providing constraints and context so output stays aligned with team standards.

**Measure the right things.** High accept rate doesn't always mean high productivity. Also measure: did the bug rate change? Did PR cycle time improve?

**Adoption isn't automatic.** 50% of our team was still zero usage after one month. This is a PR problem, not a tools problem.

---

## Conclusion

110,172 lines accepted isn't a number worth celebrating blindly. But it's enough to convince me that Claude Code is worth investing in further — with clear notes about its capability limits.

In the payment fintech industry, trust is everything. We won't hand critical decisions to AI. But for accelerating engineering work that is repetitive and well-defined, the data has spoken.

The experiment continues.

---

*Firman Hanafi is a Solutions Architect at an Indonesian payment gateway company with a focus on financial core systems, microservices architecture, and AI-assisted engineering practices.*
