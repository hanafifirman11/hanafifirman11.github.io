---
title: "Checklist Review Skeleton: Yang Harus Di-catch Sebelum AI Nulis Body"
description: "Daftar konkret yang gw cek pas AI generate skeleton class, sebelum biarin dia produce implementasi. Step 5-menit yang nyimpen paling banyak waktu downstream."
publishedAt: 2026-05-11
category: ai-engineering
tags: ["ai", "claude-code", "engineering-workflow", "code-review"]
draft: false
---

Ini versi yang lebih dalem dari step 4 di [post AI workflow](/blog/ai-workflow-that-survives-review/). Skeleton review itu checkpoint termurah di loop dan yang paling sering di-skip engineer. Post ini checklist konkret yang gw jalanin.

---

## Skeleton kelihatan kayak apa

Pas gw prompt AI buat generate skeleton, gw minta class signature, method signature, dan test method signature aja. No body. Output-nya kira-kira begini:

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

No body, no logic. Cuma shape-nya.

Ini output paling murah yang model bisa produce, dan di sini mayoritas misunderstanding muncul duluan. Catch di sini biaya 5 menit. Catch di setelah implementasi biaya satu jam lebih.

---

## Checklist-nya

Ini hal yang gw cek, urut. Tiap satu makan waktu 30 detik.

### 1. Method signature match sama spec

Model nge-name method-nya kayak yang kamu minta? Dia accept parameter yang kamu spesifikasiin? Tipe parameter-nya bener?

Kalau spec-mu bilang `refresh(String refreshToken) -> Mono<AccessToken>` dan skeleton ngasih `refreshToken(String token) -> AccessToken`, ada misunderstanding. Fix sekarang.

### 2. Return type match sama style reactive codebase

Kalau codebase-mu reactive end-to-end (`Mono`, `Flux`), skeleton harus reflect itu. Kalau model balikin `AccessToken` bukan `Mono<AccessToken>`, berarti spec-mu nggak nge-state constraint reactive secara explicit, atau model nyontek dari file non-reactive.

Either way, fix sebelum body ditulis. Refactor body sync ke reactive nanti lebih banyak kerjaan daripada minta shape yang bener dari awal.

### 3. Nama test method cover failure mode di spec

Walk through failure mode di spec-mu. Buat tiap satu, cari test method yang exercise itu.

Kalau spec-mu list tiga failure mode dan skeleton cuma punya test buat dua, model drop satu. Yang sering ke-drop: idempotency requirement, concurrency requirement, edge-case validation rule.

### 4. Style dependency injection consistent

Skeleton pakai constructor injection? Field-level `@Autowired`? Lombok `@RequiredArgsConstructor`?

Pilih yang match konvensi codebase existing dan reject sisanya. Default AI itu apa yang model paling sering lihat di training data, yang mungkin atau mungkin nggak match cara tim-mu.

### 5. Nggak ada surprise dependency

Lihat constructor parameter-nya. Ada `RestTemplate` yang kamu nggak minta? `JpaRepository` di project yang pakai `DatabaseClient`? `ObjectMapper` yang di-inject padahal calling code udah serialize di tempat lain?

Surprise dependency biasanya model reach for pattern familiar dari training data. Either remove dari skeleton atau tanya kenapa dia butuh sebelum biarin body ditulis.

### 6. Exception match sama error model project

Kalau project-mu punya domain exception dengan error code (misal `InvalidTokenException` dengan code `REFRESH_NOT_FOUND`), skeleton harus reference itu di test signature atau method documentation.

Kalau skeleton pakai `IllegalArgumentException` atau `RuntimeException`, model nggak lihat error model-mu. Tambah satu kalimat ke spec atau CLAUDE.md dan regenerate.

### 7. Reference pattern di-follow

Kalau spec-mu bilang "see PaymentService for the reactive service-layer pattern", cek shape class skeleton match sama shape `PaymentService`. Kalau `PaymentService` pakai package-private constructor dan skeleton pakai public, reference-nya nggak kebaca.

Ini tempat reference pattern fail silently. Model accept reference-nya tapi nggak baca. Re-prompt dengan file di-paste ke context kalau kamu curiga.

### 8. Nggak ada body yang ngumpet di comment

Beberapa model curang dan taro implementasi di dalam comment, dengan wrapper "TODO", padahal kamu minta skeleton only. Cek itu. Kalau ada, model salah paham request, dan kamu bakal dapet implementasi setengah-setengah pas minta body.

---

## Pas skeleton kelihatan bener

Kalau delapan check pass, kamu safe. Approve skeleton dan minta body, layer by layer.

Waktu yang kamu spend di review ini compound. Tiap implementasi yang dateng habis itu dapet shape yang bener, error model yang bener, dependency yang bener. Kamu balik ke review logic, bukan struktur.

---

## Pas skeleton salah

Kalau banyak check yang fail, jangan coba fix skeleton di kepala kamu terus minta body. Model nggak paham request awal. Update spec atau CLAUDE.md buat address gap-nya, dan regenerate skeleton.

Skeleton yang di-regenerate dari spec yang lebih bagus lebih cepet daripada skeleton yang di-correct manual dari model yang bingung. Waktu lebih baik di-spend di spec daripada di first guess model.

---

## Di mana ini collapse

Dua pattern yang defeat checklist ini.

**Skip total.** Godaan bilang "udah fine, langsung lihat body" itu kuat. Body yang dateng kelihatan plausible dan lulus review surface-level. Bug-nya ada di asumsi yang kamu nggak catch di skeleton. Kamu nemu di production.

**Treat as rubber stamp.** Jalanin 8 item dalem 10 detik tanpa baca. Checklist ini cuma work kalau kamu sungguh-sungguh baca skeleton, bukan kalau kamu scan.

5-menit investment di step ini menit dengan leverage paling tinggi di AI workflow. Worth taking the 5 menit-nya.
