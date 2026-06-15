---
title: The Supabase mistake that exposes your data
description: Filtering data in your queries and hiding it in the UI feels secure. Without Row Level Security, anyone with your public anon key can read the whole table.
tag: Stack
date: 2026
order: 3
---

Here is a mistake I see all the time. Your app filters data in the query and hides it in the UI, so it feels secure. But if Row Level Security is off, anyone with your public anon key can read the whole table directly.

The anon key ships in your client bundle. It is meant to be public. The thing standing between it and your data is not your React code or your query filters. It is Row Level Security, enforced at the database layer.

## The fix

Enable RLS on every table, and write policies that scope access with `auth.uid()`. A basic "users can only read their own rows" policy looks like this:

```sql
alter table profiles enable row level security;

create policy "own profile read"
on profiles for select
using ( auth.uid() = user_id );
```

Now a request with the anon key only returns rows the policy allows, no matter what query someone writes against it. Your UI filtering becomes a convenience, not the security boundary.

## The rule

Turn RLS on for every table the moment you create it, before you build the feature on top. A table with RLS off and a public anon key is readable by anyone who opens their network tab. Treat the database as the boundary, because that is what it is.
