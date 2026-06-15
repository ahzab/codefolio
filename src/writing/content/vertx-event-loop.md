---
title: Why I reach for Vert.x on high-throughput services
description: A thread per request does not scale to thousands of concurrent connections. An event loop does. Vert.x on the JVM with Kotlin makes non-blocking services that stay fast under load.
tag: Backend
date: "2025-03-18"
order: 12
query: data center server racks technology
---

The default mental model for a backend is one thread per request. It is easy to reason about and fine until you have thousands of slow, concurrent connections, at which point you run out of threads and everything queues. For high-throughput services I reach for Vert.x on the JVM, with Kotlin.

## The event loop, not a thread pool

Vert.x runs your handlers on a small number of event-loop threads. Instead of blocking a thread while you wait on the database or another service, you register a callback (or suspend a coroutine) and the loop handles other work in the meantime. A handful of threads serve thousands of connections, because no thread sits idle waiting.

## The one rule: do not block the loop

The whole model breaks if you do blocking work on an event-loop thread. A synchronous database driver, a heavy computation, a sleep, and you stall every request that loop was serving. Use non-blocking clients, and push genuinely blocking work to a worker pool. This is the discipline the model demands in exchange for the throughput.

## Kotlin coroutines make it readable

Callback-based async turns into nested spaghetti quickly. Kotlin coroutines let you write non-blocking code that reads top to bottom, with suspend points instead of callbacks. You get the event loop's efficiency with code that still looks sequential.

## Backpressure is not optional

A fast producer and a slow consumer will exhaust memory if you let the queue grow forever. Streaming with backpressure, where the consumer signals when it is ready for more, keeps a service stable under load instead of falling over when a downstream slows down.

A thread-per-request service is simpler to write and the right call for plenty of workloads. But when the job is many concurrent connections and high throughput, an event loop with non-blocking IO is the model that stays fast, and Vert.x with Kotlin coroutines makes it pleasant to write.
