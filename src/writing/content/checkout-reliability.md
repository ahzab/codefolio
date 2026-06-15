---
title: What a high-traffic checkout taught me about reliability
description: Years on a production e-commerce checkout came down to a few hard rules. Make every operation idempotent, never trust the network, and degrade instead of failing.
tag: Scale
featured: true
date: "2025-05-27"
order: 10
query: online shopping payment checkout laptop
---

I have spent most of my career on a production e-commerce checkout that handles real traffic, including the spikes when a big sale goes live. The lessons that stuck are not about clever code. They are about what happens when things go wrong at the worst possible moment.

## Make every operation idempotent

A user taps "Pay", the request times out, and they tap again. Without protection you might charge them twice or create two orders. The fix is idempotency: every state-changing request carries a key, and the server treats a repeat with the same key as the same operation. Build this in from the start. Retrofitting it after a double-charge incident is painful.

## Never trust the network

A payment can succeed at the provider and still fail to reach you. So you cannot treat "no response" as "it failed". Reconcile against the source of truth, the payment provider or the order record, rather than guessing from a timeout. Assume any call can hang, return late, or arrive twice.

## Degrade, do not fail

When a non-critical service is down, recommendations, a promo banner, address autocomplete, the checkout must still complete. Wrap optional calls so a failure hides the feature instead of blocking the purchase. The order is the thing that matters; everything else is optional.

## Peak traffic finds every weak point

A sale launch is a load test you did not schedule. Cache aggressively, put slow work behind a queue, and add circuit breakers so one struggling dependency does not take the whole flow down. The systems that survive are the ones that shed load gracefully instead of trying to do everything at once.

None of this is glamorous. But a checkout that quietly handles the bad cases is worth more than any feature, because the bad cases are exactly when money is on the line.
