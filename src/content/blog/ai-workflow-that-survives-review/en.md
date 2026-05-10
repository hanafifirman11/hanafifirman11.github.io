---
title: "An AI Workflow That Holds Up in Code Review"
description: "The five-step loop I'd default to when generating code with AI: read, spec, skeleton, review, layered generation. The step engineers skip most often is the one with the highest leverage."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["ai", "claude-code", "engineering-workflow", "spec-first"]
draft: false
---

The [parent roadmap post](/blog/java-roadmap-ai-era/) sketched a "spec-first compounding loop" vs "vibe-coding death loop" diagram. This post is the more practical version, focused on what each step looks like in a real workflow and where engineers trip up most often.

This is part 4 of the series.

---

## The five-step loop

What works for me as a baseline:

1. **Read existing code first** (about 5 minutes).
2. **Write the spec** (5 to 15 minutes).
3. **Generate the skeleton** (1 to 2 minutes).
4. **Stop and review the skeleton** (5 minutes).
5. **Generate per layer with tests** (the rest).

The whole thing takes longer than typing into Cursor, and that's the point. The time you spend in steps 1 to 4 is time you'd spend later in code review and debugging anyway. Front-loading it is cheaper than back-loading it.

---

## Step 1: Read existing code

Before any prompt, you read enough of the codebase to know what patterns to ask the AI to follow. With a tool like Serena (semantic code navigation), this gets cheap. Without one, this is the step that gets skipped most often, and it's the one with the highest leverage for output quality.

Concretely: open the file most similar to what you're about to build, skim its structure, note the patterns. That's it. Five minutes.

---

## Step 2: Write the spec

The spec doesn't have to be long. It does have to be specific. A spec I'd write for a "refresh OAuth token" feature:

```
Add TokenService.refresh(String refreshToken) -> Mono<AccessToken>

Constraints:
- Reactive, no blocking calls
- Use DatabaseClient (existing repo pattern)
- New token is persisted before being returned
- If refresh token is invalid or expired, throw InvalidTokenException with code REFRESH_NOT_FOUND
- Idempotent: same refresh token submitted twice within the grace window returns the same access token

Reference files:
- See PaymentService for reactive service-layer pattern
- See OAuthClient for HTTP client setup

Tests:
- Happy path: valid refresh -> new access
- Expired refresh -> InvalidTokenException
- Concurrent refresh with same token within grace -> single new token
```

The spec named the failure modes, the reference patterns, and the idempotency requirement. That last one is the kind of constraint AI defaults to ignoring unless told.

---

## Step 3: Generate the skeleton

Ask the model to produce only the class and method signatures plus the test signatures. No bodies. That sounds like extra work, but it's the cheapest way to catch a wrong direction.

```
Generate the skeleton for TokenService.refresh per the spec above.
Class signature, method signatures with proper types, and test method
signatures only. No method bodies.
```

The skeleton tells you whether the model understood the request before it spends tokens on implementation.

---

## Step 4: Stop and review the skeleton

This is the step engineers skip most often. The temptation to say "looks fine, generate the bodies" is strong. Resist. A bad skeleton produces hours of bad bodies. A good skeleton produces hours of good bodies. The signal-to-noise ratio at this checkpoint is the highest in the whole loop.

What I check:

- Does the method signature match what the spec said?
- Are the parameter types right (e.g. `Mono<AccessToken>` rather than `AccessToken`)?
- Does the test signature cover the failure modes I listed?
- Is the dependency injection style consistent with the codebase?

Fix any of these here, before any body code is written. Fixing later costs roughly an order of magnitude more.

---

## Step 5: Generate per layer with tests

Once the skeleton is approved, generate one layer at a time: repository, service, controller. Each generation takes the previous one as context. Tests are generated alongside production code in the same pass.

The reason for layer-by-layer rather than all-at-once: smaller diffs are easier to review, the model produces more focused output when scoped tightly, and you can stop the loop if something goes wrong without throwing away an entire feature's worth of code.

---

## What review looks like

You're not the author anymore. You're the reviewer. That changes the questions you ask:

- Is the failure mode exercised by a test, or just compiled?
- Are there hidden N+1 queries (the most common AI mistake in data-access code)?
- Does the error code match the project's existing conventions?
- Are there `Object`-typed parameters where a domain type would have caught a bug at compile time?

A code review at this stage is faster than reviewing human-written code, because the structure tends to be cleaner. The bugs are subtler.

---

## Where this falls apart

Two failure modes I keep seeing.

The first is treating spec-first as a ritual rather than a tool. The point isn't to fill out a template. The point is to make the constraints explicit so the AI can satisfy them. A spec that says "follow our conventions" isn't a spec.

The second is skipping the skeleton review. It's the boring step. It's also the step where the time savings come from. Skip it and you're back to vibe-coding with extra ceremony.

---

## What this isn't

This isn't a workflow you adopt overnight. The first time through, it'll feel slower than just typing. The compounding shows up after a few weeks, when you notice you're doing fewer rounds of "fix this, fix that" in PR review.

The next post in this series gets into Phase 4 of the parent roadmap: production survival, the tools and patterns that pay off once your code is past code review.
