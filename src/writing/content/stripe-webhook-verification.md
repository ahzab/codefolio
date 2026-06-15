---
title: Verify your Stripe webhooks, or anyone can grant themselves Pro
description: An unverified webhook endpoint is a public URL that upgrades accounts. Without signature verification, anyone can POST a fake checkout.session.completed and unlock your paid plan.
tag: Security
date: "2025-07-15"
order: 8
---

Your Stripe webhook is how a successful payment turns into an upgraded account. It is also a public URL. If you do not verify that a request really came from Stripe, anyone can POST a fake `checkout.session.completed` event to it and grant themselves your paid plan for free.

This is one of the most common solo-builder mistakes, because the happy path works perfectly without the check. Stripe sends real events, your handler upgrades the account, you ship. The hole only shows up when someone goes looking for it.

## Verify the signature

Stripe signs every webhook. Verify it against your endpoint secret, using the raw request body. The signature is computed over the exact bytes, so the parsed JSON will not match.

```ts
// app/api/webhooks/stripe/route.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text(); // raw body, not req.json()
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // Only now is the event safe to act on.
  if (event.type === "checkout.session.completed") {
    // upgrade the account
  }

  return new Response(null, { status: 200 });
}
```

The rule is short: never act on a webhook you have not verified. The endpoint secret is the only thing separating a real payment from a forged one.
