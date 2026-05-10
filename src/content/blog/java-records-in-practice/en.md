---
title: "Java Records in Practice: Validation, Withers, and JPA Caveats"
description: "What records do well, where they get awkward, and the patterns I'd use for compact constructor validation, copy-with-changes, and the JPA boundary."
publishedAt: 2026-05-10
category: ai-engineering
tags: ["java", "records", "spring-boot", "engineering"]
draft: false
---

This is a deeper look at the records pattern from the [modern Java patterns post](/blog/modern-java-production-patterns/). Records cover most of the DTOs and value objects you'll write, but there's a small set of patterns worth knowing before you reach for them everywhere.

---

## The anatomy

A record declares its components, gets a canonical constructor, accessors, `equals`, `hashCode`, and `toString` for free:

```java
public record Money(BigDecimal amount, Currency currency) {}

var fee = new Money(new BigDecimal("12.50"), Currency.getInstance("IDR"));
fee.amount();    // 12.50
fee.currency();  // IDR
fee.equals(other); // value-equal, no identity confusion
```

The accessor name is the component name. There's no `getAmount()`. Some teams find this jarring on day one. In my experience the team adapts within a sprint.

---

## Validation goes in the compact constructor

The compact constructor runs after the canonical constructor's argument binding but before the fields are assigned. It's the natural place for invariants:

```java
public record TransferRequest(
    String fromAccountId,
    String toAccountId,
    BigDecimal amount,
    Currency currency
) {
    public TransferRequest {
        Objects.requireNonNull(fromAccountId, "fromAccountId");
        Objects.requireNonNull(toAccountId, "toAccountId");
        Objects.requireNonNull(currency, "currency");
        if (amount == null || amount.signum() <= 0) {
            throw new IllegalArgumentException("amount must be positive");
        }
        if (fromAccountId.equals(toAccountId)) {
            throw new IllegalArgumentException("source and destination must differ");
        }
    }
}
```

A common mistake: trying to mutate `this.amount = amount.setScale(2)` inside the compact constructor. That isn't allowed. The compact constructor can only read and validate, not assign.

If you need normalisation (rounding, trimming, lowercasing), use the canonical constructor explicitly:

```java
public record Email(String value) {
    public Email {
        Objects.requireNonNull(value);
    }
    public Email(String raw) {
        this(raw.trim().toLowerCase(Locale.ROOT));  // wait, won't compile
    }
}
```

That second constructor doesn't compile because the canonical constructor is already declared via the compact form. The actual pattern:

```java
public record Email(String value) {
    public Email {
        value = value.trim().toLowerCase(Locale.ROOT);  // reassignment of parameter, allowed
        if (!value.contains("@")) {
            throw new IllegalArgumentException("invalid email");
        }
    }
}
```

You can reassign the parameters inside a compact constructor. They become the assigned field values. This is one of the non-obvious bits of records.

---

## Copy with changes (the "wither" pattern)

Records are immutable, so updating one field means producing a new record. The pattern that works:

```java
public record Customer(String id, String name, String email) {
    public Customer withName(String newName) {
        return new Customer(id, newName, email);
    }
    public Customer withEmail(String newEmail) {
        return new Customer(id, name, newEmail);
    }
}
```

It's verbose. There are libraries (like `record-builder`) that generate withers automatically, but for a record with 3-4 components I'd just write them. The verbosity stays bounded, and the explicitness is worth it.

For records with many components, a builder pattern starts paying off:

```java
public record OrderLine(
    String sku,
    int quantity,
    BigDecimal price,
    BigDecimal discount,
    String warehouse
) {
    public Builder toBuilder() {
        return new Builder()
            .sku(sku).quantity(quantity)
            .price(price).discount(discount)
            .warehouse(warehouse);
    }
    public static class Builder {
        // ... standard builder
        public OrderLine build() { /* ... */ }
    }
}
```

Manual builders inside a record feel slightly off, but they read fine and they avoid pulling in another dependency.

---

## Where records don't fit

**JPA entities.** The JPA spec requires a no-argument constructor and mutable fields. Records can't satisfy either. If your data layer is JPA, your entities are still classes. You can use records for the DTOs that flow in and out of those entities, just not for the entities themselves.

The pattern I'd use:

```java
@Entity
public class CustomerEntity {
    @Id Long id;
    String name;
    String email;
    // standard JPA boilerplate
    
    public Customer toDomain() {
        return new Customer(id.toString(), name, email);
    }
}

public record Customer(String id, String name, String email) {}
```

The entity is the framework boundary. The record is what your service layer works with.

**Anything that needs synthetic identity.** If you need two values to be `equals`-different despite having the same components (e.g. two events at different times that happen to carry identical payloads), records will collapse them. Add an explicit ID field, or use a regular class.

**Anything that needs inheritance beyond `implements`.** Records can implement interfaces but cannot extend other classes. That's almost always fine. The cases where it isn't (deep class hierarchies in legacy code) tend to be cases that benefit from refactoring anyway.

---

## Performance notes

Records aren't faster or slower than equivalent classes for typical use. The compiler generates the same bytecode shape: fields, accessors, `equals`/`hashCode`/`toString`. There's no boxing penalty, no reflection cost.

The one place records pay off measurably is in pattern matching for switch (covered in a different post), where the compiler can generate efficient deconstruction without intermediate object allocations.

---

## When I'd reach for a record

Defaulting to records for:

- DTOs flowing across service boundaries
- Value objects (Money, Email, ProductId, RiskScore)
- Result types when paired with sealed interfaces
- Configuration property classes (`@ConfigurationProperties` works on records since Spring Boot 3.2)
- Test data builders' output type

Defaulting to a regular class for:

- Anything mutable
- JPA entities
- Anything that needs synthetic identity beyond components
- Classes participating in a deep hierarchy

The split is roughly 80/20 in my experience. Records cover the common case. Classes handle the edge cases.
