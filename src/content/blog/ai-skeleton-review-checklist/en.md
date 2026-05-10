---
title: "The Skeleton Review Checklist: What to Catch Before AI Writes the Body"
description: "A specific list of things I check when an AI generates a class skeleton, before letting it produce the implementation. The 5-minute step that saves the most time downstream."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["ai", "claude-code", "engineering-workflow", "code-review"]
draft: false
---

This is the deeper version of step 4 from the [AI workflow post](/blog/ai-workflow-that-survives-review/). The skeleton review is the cheapest checkpoint in the loop and the one engineers skip most often. This post is the actual checklist I run through.

---

## What a skeleton looks like

When I prompt an AI to generate a skeleton, I ask for class signatures, method signatures, and test method signatures only. No bodies. The output is something like:

```java
@Service
public class TokenService {

    private final WebClient oauthClient;
    private final DatabaseClient db;

    public TokenService(WebClient oauthClient, DatabaseClient db) { /* ... */ }

    public Mono<AccessToken> refresh(String refreshToken) { /* ... */ }
    public Mono<AccessToken> issue(String userId) { /* ... */ }
    public Mono<Void> revoke(String accessToken) { /* ... */ }
}

@Test
class TokenServiceTest {
    @Test void refresh_validToken_returnsNewAccess() { /* ... */ }
    @Test void refresh_expiredToken_throwsInvalidToken() { /* ... */ }
    @Test void refresh_concurrentSameToken_returnsSameAccess() { /* ... */ }
}
```

No bodies, no logic. Just the shape.

This is the cheapest output the model can produce, and it's where the majority of misunderstandings show up first. Catching them here costs five minutes. Catching them after the implementation costs an hour or more.

---

## The checklist

These are the things I check, in order. Each one takes 30 seconds.

### 1. Method signatures match the spec

Did the model name the method what you asked for? Did it accept the parameters you specified? Are the parameter types correct?

If your spec said `refresh(String refreshToken) -> Mono<AccessToken>` and the skeleton says `refreshToken(String token) -> AccessToken`, there's a misunderstanding. Fix it now.

### 2. Return types match the codebase's reactive style

If your codebase is reactive end-to-end (`Mono`, `Flux`), the skeleton should reflect that. If the model returned `AccessToken` instead of `Mono<AccessToken>`, the spec didn't make the reactive constraint explicit, or the model latched onto a non-reactive example file.

Either way, fix it before the body is written. Trying to refactor a synchronous body to reactive after the fact is more work than just asking for the right shape.

### 3. Test method names cover the spec's failure modes

Walk through your spec's failure modes. For each one, find the test method that exercises it.

If your spec listed three failure modes and the skeleton has tests for two, the model dropped one. Common drops: idempotency requirements, concurrency requirements, edge-case validation rules.

### 4. Dependency injection style is consistent

Does the skeleton use constructor injection? Field-level `@Autowired`? Lombok's `@RequiredArgsConstructor`?

Pick one that matches the codebase's existing convention and reject the rest. AI defaults to whatever the model has seen most in training data, which may or may not match what your team uses.

### 5. No surprise dependencies

Look at the constructor parameters. Is there a `RestTemplate` you didn't ask for? A `JpaRepository` in a project that uses `DatabaseClient`? An `ObjectMapper` injected when the calling code already serialises elsewhere?

Surprise dependencies are usually the model reaching for a familiar pattern from training data. Either remove them from the skeleton or ask why they're needed before letting the body be written.

### 6. Exceptions match the project's error model

If your project has domain exceptions with error codes (e.g. `InvalidTokenException` with code `REFRESH_NOT_FOUND`), the skeleton should reference them in the test signatures or method documentation.

If the skeleton uses `IllegalArgumentException` or `RuntimeException`, the model didn't see your error model. Add a sentence to the spec or CLAUDE.md and regenerate.

### 7. Reference patterns are followed

If your spec said "see PaymentService for the reactive service-layer pattern", check that the skeleton's class shape matches PaymentService's shape. If `PaymentService` uses package-private constructors and the skeleton uses public, the reference wasn't read.

This is where reference patterns fail silently. The model accepts the reference but doesn't read it. Re-prompt with the file pasted into context if you suspect this.

### 8. No bodies hidden as comments

Some models cheat and put the implementation inside a comment, with a "TODO" wrapper, when you asked for skeleton only. Check for that. If it's there, the model misunderstood the request, and you'll get a half-baked implementation when you ask for the body.

---

## When the skeleton looks right

If the eight checks pass, you're in the clear. Approve the skeleton and ask for the body, layer by layer.

The time you spent in this review compounds. Every implementation that comes after gets the right shape, the right error model, the right dependencies. You're back to reviewing logic, not structure.

---

## When the skeleton is wrong

If multiple checks fail, don't try to fix the skeleton in your head and then ask for the body. The model didn't understand the original request. Update the spec or CLAUDE.md to address the gap, and regenerate the skeleton.

A regenerated skeleton from a better spec is faster than a hand-corrected skeleton from a confused model. The time is better spent on the spec than on the model's first guess.

---

## Where this falls down

Two patterns that defeat the checklist.

**Skipping it entirely.** The temptation to say "looks fine, let's see the body" is strong. The body that comes back is plausible-looking and passes the surface-level review. The bugs are in the assumptions you didn't catch in the skeleton. You'll find them in production.

**Treating it as a rubber stamp.** Going through the eight items in 10 seconds without reading. The checklist only works if you read the skeleton, not if you scan it.

The 5-minute investment in this step is the highest-leverage minute in the AI workflow. It's worth taking the 5 minutes.
