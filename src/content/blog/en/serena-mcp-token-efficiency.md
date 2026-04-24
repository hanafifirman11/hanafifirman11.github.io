---
title: "Serena + MCP: How AI Reads a Codebase Without Burning Tokens"
description: "Without Serena, Claude reads files one by one like someone reading a book without a table of contents. With Serena, Claude navigates the codebase semantically — saving 60–80% of tokens."
publishedAt: 2026-04-23
category: ai-engineering
tags: ["ai", "claude-code", "serena", "mcp", "token-efficiency"]
draft: false
---

There's a question that frequently comes up when engineers first use Claude Code on a large codebase:

*"Why is it slow? Why is it burning tokens? Why does the output sometimes not match our codebase's context?"*

The answer is almost always the same: Claude doesn't know *where to look*.

Without the right tool, Claude will read files one by one, load the entire file contents even when only one method is needed, and exhaust the context window with irrelevant content. Like someone asked to find one paragraph in a book — but given no table of contents and told to start from page one.

Serena is the solution to this problem.

---

## What Is MCP and Why It Matters

Before getting into Serena, it's important to understand the technical foundation: **Model Context Protocol (MCP)**.

MCP is an open protocol that bridges AI and external tools — codebases, databases, APIs, anything. The analogy: if USB-C is the universal standard for connecting devices, MCP is the universal standard for connecting AI with tools.

```
Claude  ←→  MCP Server  ←→  Codebase / DB / API
```

What's interesting: MCP isn't exclusive to Claude. Codex CLI, Gemini CLI, and other AIs can also connect to the same MCP server. This means investing in building a good MCP server pays off across multiple AIs.

Claude Code comes with MCP support out of the box — no complicated additional setup required.

---

## Serena: IDE Intelligence for AI

Serena is an MCP server that brings semantic navigation capability to Claude Code. At its core, Serena exposes **Language Server Protocol (LSP)** capabilities to AI.

LSP is the technology that modern IDEs have long used — it's what lets an IDE do "go to definition", "find all references", or "show all implementations" accurately. Serena brings those same capabilities to Claude Code.

**Without Serena:**
- Claude reads files one by one
- Entire file contents are loaded even when only 1 method is needed
- High token usage
- Context is lost in large codebases

**With Serena:**
- Claude navigates semantically: find a symbol, locate references, read only what's relevant
- Token usage drops by **60–80%**
- Consistent even in large and complex codebases

This difference isn't marginal — it's what separates Claude Code that's "okay" from Claude Code that's genuinely useful on production codebases.

---

## How Serena Works

```
Codebase  →  LSP (Language Server)  →  Serena MCP Server  →  Claude Code
```

Serena exposes several core tools that Claude can use:

| Tool | Function |
|---|---|
| `find_symbol` | Go directly to a class, method, or variable definition |
| `get_symbols_overview` | Outline the entire file — like a table of contents |
| `find_referencing_symbols` | Find all places where a symbol is used |
| `search_for_pattern` | Global regex search across the entire codebase |

With these tools, Claude can directly ask: "Where is `PaymentService` defined?" and get the answer immediately — without reading every file one by one.

---

## Setting Up Serena

Setting up Serena is simpler than it looks. Here are the steps:

**1. Install uv**

```bash
brew install uv
```

**2. Create a `.mcp.json` file at the project root**

```json
{
  "mcpServers": {
    "serena": {
      "command": "uvx",
      "args": [
        "--python", "3.13",
        "--from", "git+https://github.com/oraios/serena",
        "serena", "start-mcp-server",
        "--project", "/path/to/your/project",
        "--context", "claude-code",
        "--enable-web-dashboard", "true"
      ]
    }
  }
}
```

Replace `/path/to/your/project` with the absolute path to your project.

**3. Restart Claude Code**

After restarting, Serena is active and Claude Code can use the semantic tools on your codebase.

---

## What Languages Does Serena Support?

Serena supports languages with mature LSP support:

- Java ✓
- Python ✓
- TypeScript / JavaScript ✓
- Go ✓
- Rust ✓
- And more

For our team that primarily uses Java + Spring Boot, this is more than adequate coverage.

---

## A Real Example: Debugging With and Without Serena

Imagine you have a microservice with 200+ Java files and you ask Claude to trace how a transaction is processed from incoming request to database.

**Without Serena**, Claude would:
1. Read `TransactionController.java` — the entire file, 300 lines
2. Read `TransactionService.java` — the entire file, 500 lines
3. Read `TransactionRepository.java` — the entire file, 200 lines
4. Total: ~1,000 lines, ~8,000 tokens just to trace one flow

**With Serena**, Claude would:
1. `get_symbols_overview` on the controller — immediately know which method is relevant
2. `find_symbol` on the specific method — read only the relevant 30 lines
3. `find_referencing_symbols` to trace to service and repository
4. Total: ~100 lines, ~800 tokens — **10x more efficient**

In a large codebase, this difference accumulates very significantly.

---

## Serena Isn't Just for Claude

Because Serena is a standard MCP server, the same `.mcp.json` configuration can be used by:

- **Claude Code** — our primary tool
- **Codex CLI** — via MCP support
- **Gemini CLI** — via Extensions

This means if your team is experimenting with multiple AI tools, Serena stays relevant. One setup investment, usable wherever the AI ecosystem evolves.

---

## Practical Tips

**Enable the web dashboard.** The `--enable-web-dashboard true` flag provides a visual interface to see what Serena is indexing and which tools Claude is calling. Useful for debugging and understanding what's happening behind the scenes.

**Let the project index first.** When first launched, Serena needs time to index the codebase. For large projects, this can take a few minutes. Wait until indexing is complete before starting work.

**One `.mcp.json` per project.** Store this file at the project root and commit it to the repository. This ensures all team members and CI/CD environments have the same configuration.

---

## Conclusion

Serena + MCP is the foundation that makes Claude Code genuinely useful on large, complex production codebases. Without it, Claude works blind — reading files randomly, burning tokens, and often losing context.

With Serena, Claude can navigate a codebase like an engineer who has been working on the project for months — knowing where to look, knowing what's relevant, and not wasting time reading things that don't matter.

Setup takes 15 minutes. The benefit is permanent across every working session.

Next article: how to use Claude Code + Serena to produce solution designs — sequence diagrams, C4 models, and API contracts that genuinely align with the existing architecture.

---

*This article is part of the **AI-Assisted Software Development** series — field experience using Claude Code in a payment fintech engineering team.*
