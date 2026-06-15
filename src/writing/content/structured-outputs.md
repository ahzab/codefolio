---
title: Stop parsing LLM text. Use tool calls.
description: Asking a model for JSON and parsing the text breaks in production. Define a typed tool, force the model to call it, and get validated structured data back.
tag: Applied AI
featured: true
date: 2026
order: 1
---

If you ship an AI feature that returns structured data, you have probably written this: prompt the model for JSON, hope it is valid, and parse the text with a try/catch and a regex for the times it is not.

It works until it does not. One day the model wraps the JSON in a code block, opens with "Sure, here you go:", or trails a comma, and your parser throws in production on a real user. "Return ONLY valid JSON" buys you time, not safety. You cannot fully prompt your way out of it.

## The fix

Stop asking for JSON in text. Define a tool (a function with a typed schema) and force the model to call it. The provider validates the arguments against your schema and hands you a structured object. No parsing, no regex, no hoping.

Here is the whole thing with the Anthropic SDK in TypeScript:

```ts
const msg = await client.messages.create({
  model: "claude-opus-4-8",
  max_tokens: 1024,
  tools: [{
    name: "extract_invoice",
    description: "Extract the invoice fields",
    input_schema: {
      type: "object",
      properties: {
        total: { type: "number" },
        due_date: { type: "string", format: "date" },
        vendor: { type: "string" },
      },
      required: ["total", "due_date", "vendor"],
    },
  }],
  tool_choice: { type: "tool", name: "extract_invoice" },
  messages: [{ role: "user", content: invoiceText }],
});

const block = msg.content.find(b => b.type === "tool_use");
const data = block.input; // validated, structured. no regex.
```

`tool_choice` forces the model to call your tool, so it cannot reply with prose instead. You always get back arguments that match your schema. Reliability goes from "usually parses" to "always structured", and an entire class of production bugs disappears.

## It is not Claude-specific

The same idea works on OpenAI (function calling and structured outputs) and most providers now. Switching an existing feature over takes about an hour. If you ship LLM features and you are still parsing the model's text with a regex, it is the highest-leverage hour you will spend this week.
