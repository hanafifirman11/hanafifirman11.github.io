---
title: "Why AI Belongs in PRDs & Solution Design, Not Just in Code"
description: "Most engineers use AI only to write code. But the biggest bottleneck sits far earlier — in PRDs, solution design, and technical specifications."
publishedAt: 2026-04-23
category: ai-engineering
tags: ["ai", "claude-code", "solution-design", "prd", "engineering-workflow"]
draft: false
---

There's a pattern I keep seeing across engineering teams: AI is used to generate code, but not for the things that happen *before* code is written.

PRDs are still written manually. Solution designs are still thought through entirely from scratch. Sequence diagrams are still drawn by hand. Technical specifications are still produced without any help.

Then when the code is done and turns out to be heading the wrong direction, everyone blames the AI.

The problem isn't the AI. The problem is *where* AI is being used.

---

## The Real Bottleneck Is Upstream

Try counting how much time gets consumed before the first engineer writes the first line of code:

| Activity | Without AI | With AI |
|---|---|---|
| Drafting PRD | 2–4 days | 2–4 hours |
| Solution Design | 3–5 days | 1–2 days |
| Boilerplate Code | 1–2 days | 2–4 hours |

These aren't marketing claims — they're estimates from real workflows in our team at DOKU, a payment gateway company handling millions of transactions per day.

If you only use AI to generate code but your PRD still takes 4 days, you're only optimizing 20% of the total time. The rest is still manual.

---

## AI Isn't a Replacement for Engineers — AI Eliminates Boring Work

This is an important framing that's often misunderstood.

AI doesn't replace architectural decisions. AI doesn't replace domain knowledge in payment fintech built over many years. AI doesn't replace the judgment of a Solutions Architect or Tech Lead.

What AI eliminates is *the boring but necessary work*:
- Writing PRD templates from scratch
- Creating sequence diagrams from specs that already live in your head
- Generating boilerplate services following predictable patterns
- Documenting legacy code that has no documentation

This is valuable work, but it's not where engineers should be spending most of their time.

---

## The Workflow We Use: PRD → PID → Code

At DOKU, we've built a workflow that involves AI from the very earliest stages:

```
PRD  →  PID  →  Solution Design  →  Spec  →  Code  →  Tests
```

Not just throwing prompts at AI and hoping the output is good. But a structured workflow where each stage has the right tool and a different interaction pattern.

**PRD (Product Requirements Document)** is about *what will be built* — for PMs and stakeholders. AI helps with drafting, iteration, and ensuring all user stories and acceptance criteria are covered.

**PID (Project Implementation Document)** is about *how it works technically* — for engineers and QA. More specific: API contracts, sequence diagrams, NFRs with concrete numbers, dependencies on other services.

**Solution Design** is the bridge between the two — taking the PID and translating it into implementable architecture, including C4 diagrams and validation against existing architectural patterns.

Only after all of that does code get written.

---

## The Right Tool for Each Stage

This is often overlooked: not every stage fits the same tool.

**Claude Web** (chat interface) is better suited for:
- Ideation and early brainstorming
- Uploading Figma wireframes or PDF requirements
- Iterating on long PRD documents
- Final reviews with stakeholders

**Claude Code** (CLI/IDE) is better suited for:
- Converting PRD → PID because it can access the existing codebase via Serena
- Generating solution designs that are aware of the existing architectural context
- Validating against patterns already in use in the codebase

Using Claude Code for early PRD drafting is like using a screwdriver to hammer a nail — possible, but not the right tool.

---

## Why Solution Design Is the Most Critical Checkpoint

Among all stages, solution design is the most important one to not skip or rush.

This is where all assumptions must be resolved before a single line of code is written. If a wrong assumption is caught here, the cost is revising a sequence diagram and a document. If a wrong assumption is only discovered after code is done, the cost is far higher.

AI helps with solution design not by making architectural decisions — that remains the responsibility of the SA or Tech Lead. AI helps by:

- Generating sequence diagrams from already-defined specifications
- Identifying negative scenarios that were missed
- Composing API contracts consistently
- Producing C4 component diagrams as a starting point

Review is still done by humans. Validation is still done by humans. But the draft doesn't need to be produced from scratch.

---

## Anti-Patterns That Frequently Occur

From our observations, here are the patterns that most often cause AI-assisted workflows to fail at upstream stages:

**Prompts that are too short.** "Create a PRD for a money transfer feature" produces generic, unusable output. AI needs context: what platform, which user, what constraints, what tech stack.

**Asking for the final document directly.** Output quality is much better when iterated — draft first, review, add edge cases, add error scenarios, then finalize.

**Not providing constraints.** Without explicit constraints, AI will make assumptions. For production payment systems, wrong assumptions can lead to expensive rework. Always provide constraints: "Don't propose a rewrite. Stay backward-compatible. Stack is Java 17 + Spring Boot."

**Not reviewing AI output.** This is the most dangerous. Hallucinations at the PRD or solution design level that go undetected will become bugs at the code level.

---

## Conclusion

AI is most powerful not when used to write code — but when used from the very beginning of the engineering workflow, from PRD all the way to code.

If you're only using AI to generate code, you're leaving the biggest untapped potential behind. The biggest bottleneck in most software development processes lies *before* code is written.

This article series will cover each stage in detail: from how to use Serena for token efficiency in large codebases, to how to generate solution designs properly, to structured code generation that produces consistent output aligned with team patterns.

Starting with the most fundamental: how AI can accurately read your codebase without exhausting all available tokens.

---

*This article is part of the **AI-Assisted Software Development** series — field experience using Claude Code in a payment fintech engineering team.*
