---
title: "Building this blog: the trade-offs I chose"
description: "Why I chose Astro + GitHub Pages, and what I sacrificed with that decision. An architecture note at small scale."
publishedAt: 2026-04-22
category: architecture
tags: [astro, personal-site, trade-offs, github-pages]
---

Every architectural decision, no matter how small, involves trade-offs. Building a personal blog is not an enterprise project, but the principles are the same: there are things you choose, and things you sacrifice.

This is a note about the choices I made for this site, and why.

## The problem context

What I needed was simple:

- A place to write technical articles on architecture and AI engineering
- Ability to embed diagrams, code snippets, and occasionally interactive components
- Fast loading, technical readers have no patience for slow sites
- Minimal operational cost, this is a hobby, not a business
- I control the domain, content, and data

## Alternatives I considered

Three main options I evaluated:

**Ready-made platforms** (Medium, Hashnode, Dev.to), quick setup, built-in audience. But I don't like platforms that can unilaterally change their algorithm or monetization. The lock-in risk isn't worth it for content intended to be long-lived.

**Self-hosted WordPress**: powerful, mature, large plugin ecosystem. But it requires paid hosting, a database, and regular maintenance. For a personal blog, the overhead doesn't justify it.

**Static site generators**: free, fast, full control. Requires committing via Git, but that's not an issue since I'm a developer.

My choice fell on a static site generator, specifically Astro.

## Why Astro

```js
// astro.config.mjs
export default defineConfig({
  integrations: [mdx(), sitemap(), tailwind()],
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
  },
});
```

Astro has several properties that fit my use case:

1. **Zero JS by default**: the output is static HTML. Interactivity is opt-in via "islands". For a text-heavy blog, this means a 95+ Lighthouse score without extra effort.

2. **Clean MDX support**: I can write Markdown with React/Vue/Svelte components in it when needed.

3. **Content collections**: article frontmatter is validated with a Zod schema. This catches typos in important fields before build.

4. **Reasonable build speed**: for 100+ articles, the build still completes in a few seconds.

## What I gave up

Every architectural decision has costs, and here's the honest accounting:

- **No admin UI**. I write in VS Code, commit via Git. If I'm on my phone, I can't write. A trade-off I accept because I'm mostly on my laptop.
- **No built-in comments**. If I want them, I can add Giscus (using GitHub Discussions). For now, it's not a priority.
- **No newsletter**. If I want one, I'll add a separate platform like Buttondown or ConvertKit later.

> The principle I hold to: optimize for cases I know will happen often, don't over-engineer for cases that might never come.

## Deployment: GitHub Pages

Hosted on GitHub Pages, free, automatic SSL (via Let's Encrypt), CI/CD via GitHub Actions. Total cost: just the domain (if using a custom domain), around $14/year.

Compared to the enterprise setups I work on daily, with load balancers, multiple availability zones, and layered gateways, this is a very simple architecture. And that's exactly the point. **Complexity must be earned, not default.**

## What I'll change later

A few evolutions I anticipate, but haven't built yet:

- **Custom domain** (`hanafifirman.dev`), once I'm writing consistently for a few weeks.
- **Comments via Giscus**: if readers want discussion.
- **Page for `/lab`**: showcasing POCs I work on.
- **Newsletter**: if enough subscribers ask for it.

All of this can be added later without a major migration. That's one of the advantages of a simple foundation.

---

If you've read this far and are thinking about building your own blog: just start with something simple. You'll learn more from your first article than from a perfect setup.
