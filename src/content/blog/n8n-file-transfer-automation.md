---
title: "Otomasi File Transfer dan SFTP Internal Menggunakan n8n"
description: "Studi kasus penggunaan n8n untuk menstandarkan dan mengotomatisasi alur pertukaran data CSV melalui SFTP dengan error handling yang tangguh."
publishedAt: 2026-04-22
category: architecture
tags: [n8n, automation, sftp, file-transfer, integration]
---

Di dalam sistem *enterprise*, alur data jarang sekali semulus API *real-time*. Metode pengiriman file statis seperti CSV via SFTP secara terpusat *(batch processing)* masih menjadi standar industri, terutama untuk lembaga finansial.

Ketika *workflow* masih berjumlah sedikit, *cron job* dan bash script sederhana sudah cukup menjawab masalah. Namun seiring dengan pertumbuhan puluhan kolaborator data eksternal — dengan variasi *retry logic*, pembersihan data (*parsing*), hingga validasi isi baris per baris — manajemen naskah (*script management*) berubah menjadi pekerjaan meresahkan.

Di [artikel sebelumnya](/blog/n8n-self-hosted-kubernetes), saya membahas arsitektur n8n kita di kubernetes. Artikel ini berfokus pada apa yang sebenarnya kita bangun di atas platform tersebut: **File Transfer Automation**.

## Flow Overview: Dari Partner ke Database Internal

Alur kerja pada umumnya membutuhkan kita untuk menyisir direktori eksternal, memproses file baru, menunggah balasan, dan mengarsipkan file orisinal untuk merapikan *storage*:

<div class="mermaid">
graph LR
    A["Cron setiap 15 menit"] --> B["SFTP List /incoming/"]
    B --> C["Filter hanya .csv baru"]
    C --> D["SFTP Download file"]
    D --> E["Parse CSV"]
    E --> F["Validate skip malformed"]
    F --> G["Insert DB"]
    G --> H["Generate report"]
    H --> I["SFTP Upload report"]
    I --> J["Slack Notify team"]
    J --> K["Archive Move file"]
</div>

## Membangun Logika Workflow

n8n memungkinkan otomasi ini dibangun secara visual tanpa harus meninggalkan penulisan kode JavaScript di bagian-bagian yang menuntut fleksibilitas (*Function node*).

### 1. Trigger dan Filter
Kita memulai eksekusi menggunakan **Cron Node** yang berjalan setiap beberapa menit di latar belakang. n8n menyimpan penanda waktu kapan sukses eksekusi terakhir melalui variabel `$execution.lastRunAt`.

Eksekusi List SFTP Node dikombinasi dengan IF Node guna menyaring file CSV yang melampaui tanggal `lastRunAt`, sehingga kita tidak memproses file yang sama berulang kali.

### 2. Validasi Custom dengan JavaScript
Node **Spreadsheet File** bertugas mengubah data biner CSV menjadi *collection array*. Kemudian, Node **Code/Function** dipakai untuk validasi *row-by-row*:

```javascript
const validRows = [];
const errorRows = [];

for (const item of $input.all()) {
  const row = item.json;
  
  // Validate required fields
  if (!row.account_number || !row.amount || parseFloat(row.amount) <= 0) {
    errorRows.push({
      ...row,
      error: 'Missing required field or invalid amount'
    });
    continue;
  }
  
  // Transform to standardized shape
  validRows.push({
    account_number: row.account_number.trim(),
    bank_code: row.bank_code?.trim() || 'DEFAULT',
    amount: parseFloat(row.amount),
    reference: row.reference?.trim() || `AUTO-${Date.now()}`,
    processed_at: new Date().toISOString()
  });
}

// Split routing: index 0 untuk sukses, index 1 untuk error report
return [
  validRows.map(r => ({ json: r })),
  errorRows.map(r => ({ json: r }))
];
```

Pemisahan ini memungkinkan data bersih *(valid)* terus mengalir ke Database, sedangkan *error row* dikumpulkan untuk membangun narasi pesan respons di hilir alur tanpa harus membekukan (*crash*) ekseskusi di tengah jalan.

### 3. Optimasi Insert Database
Data yang valid selanjutnya dimasukkan menggunakan **PostgreSQL Node**. Keamanan paling mendasar yang kita terapkan adalah fungsi `ON CONFLICT` *(idempotency)*:

```sql
INSERT INTO file_transfers (account_number, bank_code, amount, reference, processed_at)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (reference) DO NOTHING
```

Jika terjadi instabilitas dan *worker* pod n8n '*restart*' di pertengahan proses masuk data, file mungkin diproses ulang pada iterasi *cron* selanjutnya. Memasukkan kaidah ini di sisi DB memastikan tidak ada duplikasi data akibat insiden infrastruktur.

## Manajemen Error dan File Fisik

n8n memiliki perlengkapan mumpuni menanggulangi kendala umum jala komunikasi via SFTP:

1. **Node Retries**: Kita mengatur node komunikasi SFTP untuk otomatis *retry* sebanyak 3 kali *(delay* 30 detik*)* jika jabat tangan sirkuit terputus (wajar pada operasi lintas penyedia *cloud*).
2. **Error Workflow**: Ketika eksekusi fatal terjadi dan otomasi mati (biasanya karena salah penulisan password atau pergantian format CSV sepihak), n8n menembak *"Error Workflow"* yang siaga memberi *alert* di Slack. 
3. **Continue on Error**: Pada pemrosesan banyak *file*, satu file error tidak lantas mengorbankan file lain. Ini bisa dicapai lewat tabulasi parameter pengaturan node n8n.

### Merawat Binary Data

Salah satu rahasia arsitektur sukses untuk *file transfer* di n8n adalah instruksi:
`N8N_DEFAULT_BINARY_DATA_MODE=filesystem`

File CSV dari partner mungkin mencapai ukuran 50-100MB per file. Jika biner ini disimpan n8n kembali ke dalam tabel PostgreSQL, ukuran database bisa membengkak drastis *(database bloating)*. Melalui Mode *filesystem*, n8n menggunakan NAS yang digabungkan *(mounted)* ke dalam Kubernetes untuk menyimpan wujud fisik *file*, sedangkan log eksekusi DB hanya menyimpan tautan statis untuk menelusurinya kembali.

Untuk keperluan audit, kita memindah file biner dari map SFTP `/incoming` ke `/archive/YYYY-MM/` paska interaksi usai.

Arus sistem n8n ini menggantikan kerumitan kode kustom dengan antarmuka yang gampang dikomunikasikan ke sesama kolega tanpa menurunkan standarisasi korporat.
