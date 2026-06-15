---
title: Cut your LLM bill with prompt caching
description: Most AI features resend the same large prompt every call and pay full price for it. Cache the stable prefix and pay a fraction on every reuse.
tag: Applied AI
date: "2025-11-24"
order: 3
---

If you call an LLM with the same large system prompt on every request, you are overpaying. Most AI features send the same instructions, context, and tool definitions every single call, and pay full input price for all of it every time. The stable part is the expensive part, and it never changes.

## How caching helps

Prompt caching lets you mark that stable prefix once. The provider stores it. Your first call writes the cache, and every call after reads it back for a fraction of the input price, often around 90% cheaper on the cached portion. Same model, same output, lower bill.

With the Anthropic SDK it is one field on the part you want to cache:

```ts
const msg = await client.messages.create({
  model: "claude-opus-4-8",
  max_tokens: 1024,
  system: [{
    type: "text",
    text: largeSystemPrompt,            // stable, reused every call
    cache_control: { type: "ephemeral" },
  }],
  messages: [{ role: "user", content: userQuestion }],
});

// check it worked
console.log(msg.usage.cache_read_input_tokens); // greater than 0 means a hit
```

Two things to get right. Put the stable content first and the changing content (the user's message) last, because the cached prefix has to be identical every time to get a hit. And the cache expires after a few minutes by default, so it pays off most for steady or bursty traffic, less for a single call once an hour.

## How to verify

Read `usage.cache_read_input_tokens` on the response. If it is zero across repeated requests with the same prefix, something is quietly changing the prompt: a timestamp in the system prompt, an unsorted JSON blob, or a tool list that varies per request. Fix that and the hits come back.

If you ship LLM features and have not turned this on, it is usually the biggest cost win available with no downside.
