---
title: "File Transfer and Internal SFTP Automation Using n8n"
description: "A case study on using n8n to standardize and automate CSV data exchange flows via SFTP with robust error handling."
publishedAt: 2026-04-22
category: architecture
tags: [n8n, automation, sftp, file-transfer, integration]
---

In *enterprise* systems, data flows are rarely as smooth as a real-time API. Static file delivery methods like CSV via centralized SFTP *(batch processing)* remain an industry standard, especially for financial institutions.

When workflows are few, *cron jobs* and simple bash scripts are sufficient. But as dozens of external data collaborators grow — each with variations in *retry logic*, data cleansing (*parsing*), and row-by-row validation — *script management* becomes an uncomfortable chore.

In [the previous article](/en/blog/n8n-self-hosted-kubernetes), I covered our n8n architecture on Kubernetes. This article focuses on what we actually built on top of that platform: **File Transfer Automation**.

## Flow Overview: From Partner to Internal Database

A typical workflow requires us to scan an external directory, process new files, upload a response, and archive the original files to clean up *storage*:

<div class="mermaid">
graph LR
    A["Cron every 15 minutes"] --> B["SFTP List /incoming/"]
    B --> C["Filter only new .csv files"]
    C --> D["SFTP Download file"]
    D --> E["Parse CSV"]
    E --> F["Validate skip malformed"]
    F --> G["Insert DB"]
    G --> H["Generate report"]
    H --> I["SFTP Upload report"]
    I --> J["Slack Notify team"]
    J --> K["Archive Move file"]
</div>

## Building the Workflow Logic

n8n lets us build this automation visually without sacrificing the flexibility of writing JavaScript where needed (*Function node*).

### 1. Trigger and Filter
We kick off execution using a **Cron Node** that runs every few minutes in the background. n8n stores a timestamp of when the last successful execution ran via the `$execution.lastRunAt` variable.

The SFTP List Node execution is combined with an IF Node to filter CSV files that are newer than `lastRunAt`, so we don't process the same file twice.

### 2. Custom Validation with JavaScript
The **Spreadsheet File** node converts the binary CSV data into a *collection array*. Then, a **Code/Function** node handles *row-by-row* validation:

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

// Split routing: index 0 for success, index 1 for error report
return [
  validRows.map(r => ({ json: r })),
  errorRows.map(r => ({ json: r }))
];
```

This split allows clean *(valid)* data to continue flowing to the Database, while *error rows* are collected to build a response message narrative downstream — without freezing (*crashing*) execution midway.

### 3. Database Insert Optimization
Valid data is then inserted using the **PostgreSQL Node**. The most fundamental safety measure we apply is the `ON CONFLICT` function *(idempotency)*:

```sql
INSERT INTO file_transfers (account_number, bank_code, amount, reference, processed_at)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (reference) DO NOTHING
```

If an instability occurs and the n8n *worker* pod *restarts* mid-process, the file may be reprocessed on the next *cron* iteration. Adding this constraint on the DB side ensures no data duplication from infrastructure incidents.

## Error Management and Physical Files

n8n has solid tools for handling common SFTP communication issues:

1. **Node Retries**: We configure SFTP communication nodes to automatically *retry* 3 times *(30-second delay)* if the circuit handshake drops (common in cross-cloud-provider operations).
2. **Error Workflow**: When a fatal execution error occurs and automation dies (usually from a wrong password or unilateral CSV format change), n8n fires an *"Error Workflow"* that sends a *Slack alert*. 
3. **Continue on Error**: When processing multiple *files*, one file error doesn't sacrifice the rest. This can be achieved through the n8n node settings parameter.

### Handling Binary Data

One architectural secret for successful *file transfer* in n8n is the setting:
`N8N_DEFAULT_BINARY_DATA_MODE=filesystem`

CSV files from partners can reach 50–100 MB per file. If n8n stored these binaries back into PostgreSQL, the database size could balloon dramatically *(database bloating)*. Through *filesystem* mode, n8n uses a NAS *mounted* to Kubernetes to store the physical *file*, while the execution log DB only stores a static link to retrieve it later.

For audit purposes, we move binary files from the SFTP `/incoming` folder to `/archive/YYYY-MM/` after processing is complete.

This n8n system flow replaces the complexity of custom code with an interface that's easy to communicate to colleagues without lowering corporate standardization.
