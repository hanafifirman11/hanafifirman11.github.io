---
title: "The CLAUDE.md Template I Keep Coming Back To"
description: "What goes in a CLAUDE.md that meaningfully changes AI output quality. The five sections, a working template, and how to keep it from going stale."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["ai", "claude-code", "spec", "spring-boot", "engineering-workflow"]
draft: false
---

After [the Java roadmap piece](/blog/java-roadmap-ai-era/), the question I get most often is: what does a working CLAUDE.md look like in practice? Most public examples are toy versions, three lines of tech stack and a pleasant be-helpful instruction, which isn't where the leverage lives. What moves the needle is the boring stuff. The domain terms your team uses but the rest of the world doesn't. The patterns you've already moved away from. The specific things you don't want generated. This post is the template I keep coming back to, with the parts I find easy to skip pulled out and labelled.

This is part 2 of the series. Part 1 was the [parent roadmap](/blog/java-roadmap-ai-era/). Future posts will dig into the Phase 1 (Modern Java) specifics.

---

## The five sections

A CLAUDE.md that earns its keep covers five things. Most teams I've seen ship one with the first two and call it done. The other three are where the AI output starts to feel like it has read your codebase.

### 1. Tech Stack

The easy section, and most teams stop here. Java 25, Spring Boot 4, Postgres 16, Kafka 3.x, with version pinning if it matters for your team. The reason to write this even though it feels redundant: AI doesn't always default to the right Java version when generating examples. You'll get suggestions for `var` patterns the LTS doesn't support, or for libraries that were renamed two releases ago, or for annotation packages that moved between Spring versions. Pinning the stack costs you 30 seconds and saves you a few wrong suggestions per week.

### 2. Conventions

Where most CLAUDE.md files start to vary. What we tend to put here: which DI style we use ("constructor injection only, no field-level `@Autowired`"), how to structure error responses, how transactions are declared, how database access is structured, how log messages carry correlation IDs. Write conventions as sentences, not as bare bullets, because AI reads conventions as much for tone as for content. A bullet that says "no field injection" tells the model less than a sentence that says "we use constructor injection because we want immutable dependencies and easier unit tests".

### 3. Do Not

The most underused section, and the one with the highest leverage I've measured. This is where you list patterns you've moved away from but the AI will keep generating because they're still the most common in training data. Examples we've used:

- Do not generate JPA repository interfaces, we use `DatabaseClient` with `Flux<T>`.
- Do not introduce `Pageable`, we stream.
- Do not add new dependencies without explicit approval.
- Do not change API contracts without writing a migration note first.
- Do not generate Mockito tests with PowerMock or static mocking helpers.

A "Do Not" line is worth roughly five "do" lines in my experience, because it removes a default the model would otherwise reach for unprompted.

### 4. Reference Patterns

Point the AI at one or two existing files in your codebase that represent the pattern you want followed. Something like "see `PaymentService` for the reactive service-layer pattern" or "see `TransferRepository` for how database queries are structured". This works because AI mirrors nearest-neighbor examples, and giving it a specific anchor file is more effective than describing the pattern in prose. The downside: if the reference file rots, your CLAUDE.md silently rots with it. We try to revisit reference choices once a quarter.

### 5. Glossary / Domain Terms

The section most teams skip, and the one that pays off most for any team in a regulated or domain-specific space. In payments, terms like "settlement", "reconciliation", "reversal", and "refund" have specific meanings inside our system that don't always match what AI assumes from public docs. A four-line glossary saves you from a dozen subtle business-logic bugs. If your team has internal jargon, write it down here. AI doesn't know what your jargon means until you tell it.

---

## A full template

This is the structure I keep coming back to. Adjust the contents to your stack, but the section list is what I'd start from.

```markdown
# Project: <name>

## Tech Stack
- Java 25, Spring Boot 4, Spring Framework 7
- PostgreSQL 16 via R2DBC (no JPA in this project)
- Kafka 3.x for inter-service events
- Resilience4j for retries and circuit breakers

## Conventions
- Constructor injection only, no field-level @Autowired.
- All public service methods must have a unit test.
- Error responses follow our internal Problem Details format (see ErrorResponse.java).
- Transactions are declared at the service boundary, not on repositories.
- All log messages include the correlation ID from the inbound request.

## Do Not
- Do not generate JPA repository interfaces. We use DatabaseClient with Flux<T>.
- Do not introduce Pageable. We stream.
- Do not add new dependencies without explicit approval.
- Do not change API contracts without writing a migration note first.
- Do not generate Mockito tests with PowerMock or static mocking helpers.

## Reference Patterns
- See PaymentService for the reactive service-layer pattern.
- See TransferRepository for query construction.
- See PaymentEventConsumer for Kafka consumer pattern.

## Glossary
- Settlement: the daily batch that finalises pending transactions for a merchant.
- Reconciliation: matching internal records against an external system's records.
- Reversal: a same-day cancellation of a transaction before settlement.
- Refund: a post-settlement return of funds, distinct from reversal.
- Dispute: a customer-initiated challenge that may result in a refund.

## Maintenance
- Owner: backend platform team
- Reviewed quarterly, or when a major dependency upgrade lands
- Last reviewed: <date>
```

---

## Before and after, on the same prompt

The clearest way to show what CLAUDE.md does is to run the same prompt twice, with and without it.

The team had been asked to add a method that refreshes an OAuth access token using a stored refresh token. Same model, same wording. The only difference between the two outputs is whether the project's CLAUDE.md was loaded into context.

**Without CLAUDE.md:**

```java
@Service
@RequiredArgsConstructor
public class TokenService {
    private final RestTemplate restTemplate;
    private final TokenRepository tokenRepository;

    public AccessToken refresh(String refreshToken) {
        Token existing = tokenRepository.findByRefreshToken(refreshToken);
        if (existing == null) {
            throw new IllegalArgumentException("invalid refresh token");
        }
        // call OAuth endpoint, save new token
        return new AccessToken(/* ... */);
    }
}
```

That output uses `RestTemplate` (which we don't), JPA-style repositories (which we'd already migrated off), a blocking flow (we're reactive end-to-end), and a generic `IllegalArgumentException` instead of a domain exception with an error code.

**With CLAUDE.md loaded:**

```java
@Service
public class TokenService {
    private final WebClient oauthClient;
    private final DatabaseClient db;

    public TokenService(WebClient oauthClient, DatabaseClient db) {
        this.oauthClient = oauthClient;
        this.db = db;
    }

    public Mono<AccessToken> refresh(String refreshToken) {
        return db.sql("SELECT * FROM tokens WHERE refresh_token = :rt")
            .bind("rt", refreshToken)
            .map(this::mapToken)
            .one()
            .switchIfEmpty(Mono.error(
                new InvalidTokenException("REFRESH_NOT_FOUND")
            ))
            .flatMap(this::callOAuthEndpoint);
    }
}
```

`WebClient`, `DatabaseClient` with reactive types, explicit constructor injection without Lombok (because the conventions section says so), a domain-specific exception with an error code, reactive end-to-end. Same prompt. Different output, because the CLAUDE.md told the model what kind of file we wanted to live next to `PaymentService` rather than what kind of file would compile in the most generic Spring project on Earth.

---

## Maintenance: the part that quietly breaks

Writing a CLAUDE.md is the easy part. Letting it rot is the part that bites.

We migrated one project from JPA to R2DBC over a couple of sprints, and forgot to remove the "we use Spring Data repositories" line from the CLAUDE.md. For about two weeks, every AI-generated piece of database access included a `JpaRepository` extension, and we kept rejecting them in code review without realising the spec itself was telling the model to do it. The fix was a five-second edit. Since then I treat CLAUDE.md updates as part of any architecture change, not as documentation that gets cleaned up later.

Two patterns that have helped:

- Tag every CLAUDE.md change in the commit message with `[claude-md]` so the change shows up in the next sprint review.
- Read CLAUDE.md aloud once a quarter. Bullets that no longer match how you work are easy to spot when you say them out loud.

This is also where the Reference Patterns section needs the most attention. A reference file that stops being canonical without anyone removing it from CLAUDE.md will quietly steer AI output for months.

---

## What this is and isn't

This template isn't a universal standard. It's the structure I've found stable for our payments work, where the domain terms matter and the patterns we've moved away from still dominate public training data. If your team works in a domain with less internal jargon, the Glossary section may not earn its space. If your team is on a single mainstream pattern, the Do Not section may stay short. I'd argue the section list still applies even when the contents thin out.

If you're using a CLAUDE.md structure that looks different from this and works well, I'd be curious what's in it. The next post in this series gets into Phase 1 of the parent roadmap, modern Java patterns in production, including how the Reference Patterns section in your CLAUDE.md should evolve as the team modernises the codebase.
