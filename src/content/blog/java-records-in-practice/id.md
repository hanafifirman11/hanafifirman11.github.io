---
title: "Java Records di Lapangan: Validasi, Wither, dan Caveat JPA"
description: "Yang records bisa cover dengan baik, tempat di mana mereka jadi awkward, dan pattern yang gw default buat validasi compact constructor, copy-with-changes, dan boundary JPA."
publishedAt: 2026-05-11
category: ai-engineering
tags: ["java", "records", "spring-boot", "engineering"]
draft: false
---

Ini versi yang lebih dalem dari section records di [post modern Java patterns](/blog/modern-java-production-patterns/). Records cover mostly DTO sama value object yang kamu tulis, tapi ada beberapa pattern yang worth diketahui sebelum kamu reach for records di setiap tempat.

---

## Anatomi-nya

Record declare component-nya, otomatis dapet canonical constructor, accessor, `equals`, `hashCode`, dan `toString`:

```java
public record Money(BigDecimal amount, Currency currency) {}

var fee = new Money(new BigDecimal("12.50"), Currency.getInstance("IDR"));
fee.amount();    // 12.50
fee.currency();  // IDR
fee.equals(other); // value-equal, nggak ada identity confusion
```

Accessor name sesuai component name. Nggak ada `getAmount()`. Beberapa tim kerasa weird di hari pertama. Dari yang gw lihat, tim adapt dalam satu sprint.

---

## Validasi masuk di compact constructor

Compact constructor jalan setelah argument binding canonical constructor tapi sebelum field di-assign. Tempat natural buat invariant:

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

Salah satu kesalahan umum: coba `this.amount = amount.setScale(2)` di dalem compact constructor. Itu nggak allowed. Compact constructor cuma bisa baca dan validate, nggak bisa assign.

Kalau butuh normalisasi (rounding, trimming, lowercasing), pakai canonical constructor secara explicit:

```java
public record Email(String value) {
    public Email {
        Objects.requireNonNull(value);
    }
    public Email(String raw) {
        this(raw.trim().toLowerCase(Locale.ROOT));  // bentar, ini nggak compile
    }
}
```

Constructor kedua itu nggak compile karena canonical constructor udah declared via compact form. Pattern yang sebenernya:

```java
public record Email(String value) {
    public Email {
        value = value.trim().toLowerCase(Locale.ROOT);  // reassign parameter, allowed
        if (!value.contains("@")) {
            throw new IllegalArgumentException("invalid email");
        }
    }
}
```

Kamu bisa reassign parameter di dalem compact constructor. Mereka jadi nilai field yang ke-assign. Ini salah satu bagian records yang kurang obvious.

---

## Copy with changes (pattern "wither")

Records immutable, jadi update satu field artinya produce record baru. Pattern yang work:

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

Verbose. Ada library kayak `record-builder` yang generate wither otomatis, tapi buat record dengan 3-4 component, gw mending nulis sendiri aja. Verbosity-nya stay bounded, dan explicitness-nya worth it.

Buat record dengan banyak component, builder pattern mulai pay off:

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

Manual builder di dalem record kerasa agak off, tapi kebacanya fine dan kamu nggak perlu nambah dependency.

---

## Tempat records nggak cocok

**JPA entities.** Spec JPA butuh no-arg constructor dan mutable field. Records nggak bisa keduanya. Kalau data layer-mu JPA, entity-mu tetep class. Kamu bisa pakai records buat DTO yang flow in-out dari entity itu, cuma bukan entity itu sendiri.

Pattern yang gw pakai:

```java
@Entity
public class CustomerEntity {
    @Id Long id;
    String name;
    String email;
    // boilerplate JPA standar
    
    public Customer toDomain() {
        return new Customer(id.toString(), name, email);
    }
}

public record Customer(String id, String name, String email) {}
```

Entity itu boundary framework. Record itu yang service layer kamu kerjain.

**Apapun yang butuh synthetic identity.** Kalau kamu butuh dua nilai `equals`-different walaupun component-nya sama (misal dua event di waktu beda tapi payload identik), records bakal collapse keduanya. Tambahin ID field explicit, atau pakai class biasa.

**Apapun yang butuh inheritance di luar `implements`.** Records bisa implement interface tapi nggak bisa extend class lain. Hampir selalu fine. Kasus di mana ini issue (hierarchy class dalem di kode legacy) biasanya kasus yang justru benefit dari refactor.

---

## Catatan performance

Records nggak lebih cepat atau lebih lambat dari class equivalent buat use case typical. Compiler generate bytecode shape yang sama: field, accessor, `equals`/`hashCode`/`toString`. Nggak ada boxing penalty, nggak ada reflection cost.

Satu tempat di mana records pay off measurable adalah di pattern matching for switch (di-cover di post lain), di mana compiler bisa generate deconstruction yang efisien tanpa allocation object perantara.

---

## Kapan gw reach for record

Default ke records buat:

- DTO yang flow lintas service boundary
- Value object (Money, Email, ProductId, RiskScore)
- Result type pas dipasang sama sealed interface
- Configuration property class (`@ConfigurationProperties` work di records sejak Spring Boot 3.2)
- Output type dari test data builder

Default ke class biasa buat:

- Apapun yang mutable
- Entity JPA
- Apapun yang butuh synthetic identity di luar component
- Class yang ikut deep hierarchy

Split-nya kira-kira 80/20 dari pengalaman gw. Records cover common case. Class handle edge case.
