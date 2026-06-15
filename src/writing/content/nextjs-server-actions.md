---
title: Your Next.js Server Action is a public endpoint
description: A server action looks like a function call, but it compiles to a public POST endpoint anyone can hit with any arguments. Authenticate and validate inside it.
tag: Next.js
date: 2026
order: 6
---

Server Actions make mutations feel like calling a function. You write `'use server'`, import it into a component, and call it. It is easy to forget what it actually is: a public HTTP endpoint.

Next.js compiles each action into a POST route with a generated id. Anyone who can load your app can invoke that route directly, with any arguments they want. The clean function signature is a convenience for you, not a contract the caller has to honor.

## Treat it like an API route

Two things have to happen inside every action, every time. Authenticate, because you cannot assume the caller is the logged-in user you had in mind. And validate, because you cannot trust the arguments until you have parsed them.

```ts
"use server";
import { z } from "zod";
import { auth } from "@/lib/auth";

const Input = z.object({ projectId: z.string().uuid() });

export async function deleteProject(raw: unknown) {
  const user = await auth();
  if (!user) throw new Error("unauthorized");

  const { projectId } = Input.parse(raw);

  // and confirm this user owns projectId before deleting
}
```

The mental model that keeps you safe: a server action is a route handler with nicer ergonomics. Everything you would do to secure a public POST endpoint, you still do here. Nothing about the syntax does it for you.
