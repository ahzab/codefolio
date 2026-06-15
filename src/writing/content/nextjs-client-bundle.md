---
title: What actually ends up in your Next.js client bundle
description: NEXT_PUBLIC env vars and anything a client component imports ship to the browser. One import line can leak a secret. The server-only package makes it impossible.
tag: Next.js
date: "2025-08-05"
order: 7
---

In Next.js, the line between server and client is a real security boundary, and it is easy to cross by accident. The rule is simple: anything that reaches a client component reaches the browser.

That trips people up in two ways. Any env var prefixed with `NEXT_PUBLIC_` is inlined into the client bundle at build time, in plain text, for anyone to read. And any module a client component imports is bundled too, including the secrets that module happened to reference.

## The accidental leak

You write a helper that reads `process.env.STRIPE_SECRET_KEY`. Later you import a small utility from the same file into a `'use client'` component. Now your secret key is in the JavaScript you serve to every visitor, and nothing warned you.

## Make it impossible

Mark server-only modules with the `server-only` package. If a client component ever imports one, the build fails instead of leaking.

```ts
// lib/billing.ts
import "server-only"; // importing this from a client component fails the build

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
```

Two rules cover almost everything. Never prefix a secret with `NEXT_PUBLIC_`, and put `import "server-only"` at the top of any module that touches a secret. Then the build is your guard rail, not your memory.
