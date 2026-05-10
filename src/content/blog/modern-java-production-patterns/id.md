---
title: "Pattern Modern Java yang Worth Dipakai di Production"
description: "Pattern Java yang gw default duluan kalau lagi modernize codebase Spring Boot. Records, sealed types, virtual threads, structured concurrency, plus trade-off masing-masing."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["java", "modern-java", "spring-boot", "loom", "engineering"]
draft: false
---

Di [parent roadmap post](/blog/java-roadmap-ai-era/) gw bilang "berhenti nulis Java gaya 2018." Post ini versi yang lebih konkret: pattern yang gw bakal pakai duluan kalau lagi modernize codebase Spring Boot, plus tempat-tempat di mana pattern itu mulai berasa kurang nyaman.

Ini bagian 2 dari seri.

---

## Records: lebih cepat ditulis, lebih susah disalahgunakan

Records nge-cover 90% DTO sama value object yang gw tulis. Validasi-nya ke compact constructor:

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

Records bukan buat: JPA entities (spec-nya butuh mutability), class yang butuh synthetic identity, atau apapun yang butuh inheritance. Di luar itu, gw default ke records.

Yang awkward: pas kamu butuh "wither" buat copy-with-one-field-changed, boilerplate-nya nggak jauh lebih pendek dari nulis class biasa. Komunitas konvergen ke pattern compact constructor + copy method, tapi worth tau ini salah satu tempat records kasih kamu setengah jalan.

---

## Sealed classes + pattern matching: algebraic types yang compile-checked

Sealed classes jadi useful pas dipasang sama pattern matching for switch. Pattern yang paling sering gw deploy adalah result type:

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

Dua alasan kenapa ini worth space-nya. Switch-nya exhaustive di compile time, jadi kalau ada variant baru, build gagal sampai semua consumer handle kasus itu. Deconstruction pattern ngebolehin kamu nge-pull field tanpa nulis accessor terpisah. Result type yang gw reach duluan. State machine close second.

---

## Virtual threads: kapan, dan kapan jangan

Loom salah satu upgrade Java paling rapi yang pernah gw lihat, tapi juga tempat paling sering gw lihat over-application. Rough rule yang gw default:

| Workload | Pakai virtual threads? |
|---|---|
| HTTP server handle banyak concurrent request, mostly nunggu JDBC atau HTTP | Ya |
| CPU-bound batch processing | Jangan, pakai parallel stream atau ForkJoin |
| Code yang pin ke native atau pegang monitor lock lama | Jangan, fallback ke platform thread |
| Existing `CompletableFuture.thenApply` chain | Mungkin, lihat structured concurrency di bawah |

Adoption pattern yang painless: enable virtual threads buat web server doang (`spring.threads.virtual.enabled=true` di Spring Boot 3.2+), biarin sisanya stay as is. Wins-nya keluar pas concurrency naik tanpa tim harus belajar hal baru.

Yang sering bikin orang surprise: virtual threads nggak ngilangin kebutuhan backpressure. Kalau downstream-mu lebih lambat dari kamu, kamu tetep butuh bounded queue di suatu tempat.

---

## Structured concurrency: JEP 505 preview di Java 25

Yang gw tunggu-tunggu. Pattern structured-task-scope nge-replace mostly orchestrasi `CompletableFuture` manual yang pernah gw tulis:

```java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    var customer = scope.fork(() -> customerService.find(id));
    var balance = scope.fork(() -> balanceService.snapshot(id));
    var risk = scope.fork(() -> riskService.score(id));

    scope.join().throwIfFailed();

    return new EnrichedCustomer(customer.get(), balance.get(), risk.get());
}
```

Tiga hal yang work bagus di situ. Cancellation propagate ke atas otomatis. Scope berakhir pas block berakhir. Type-checker keep kamu honest soal fork mana yang harus sukses. Downside-nya masih preview, jadi adoption ke production tergantung mood tim sama `--enable-preview` flag.

Kalau codebase-mu punya fan-out service call yang ditulis pakai `CompletableFuture.allOf(a, b, c).thenApply(...)`, ini target refactor yang bersih.

---

## Pattern matching for switch: stop nulis instanceof cascade

Improvement yang lebih kecil, tapi yang paling banyak nyentuh kode existing. Kalau kamu punya pattern kayak gini:

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

Replace pakai:

```java
return switch (event) {
    case Created c -> handleCreated(c);
    case Updated u -> handleUpdated(u);
    case Deleted d -> handleDeleted(d);
};
```

Kalau `event` sealed, kamu bisa drop throw-nya karena compiler tau case-nya udah exhaustive. Pasangan natural sama sealed-class pattern di atas.

---

## Adoption order kalau lagi roll-out

Kalau kamu lagi push pattern ini ke codebase existing, urutan yang gw default:

1. **Records** duluan. Blast radius paling kecil, readability gain langsung kerasa.
2. **Pattern matching for switch** kedua. Mostly mechanical refactor dari instanceof chain.
3. **Sealed classes** pas ada domain type baru yang mau ditambahin. Jangan retrofit kecuali ada win yang jelas.
4. **Virtual threads** di web-server boundary. Single config flag, scaling-nya otomatis.
5. **Structured concurrency** terakhir. Pick up pas JEP 505 keluar dari preview, atau lebih awal kalau tim nyaman sama `--enable-preview`.

---

## What this isn't

Ini bukan tour lengkap setiap fitur Java sejak 17. Ada tail panjang improvement-improvement kecil (text blocks, `var`, switch expressions) yang gw asumsi udah ada di codebase-mu. Kalau belum, itu duluan sebelum semua di atas.

Post berikutnya di seri ini masuk ke Phase 2 dari parent roadmap: yang worth waktu kamu di Spring Boot 4, di luar changelog summary.
