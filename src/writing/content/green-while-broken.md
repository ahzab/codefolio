---
title: Everything was green and nothing was working
description: A cron that never started, a job that reported ok over a failed write, and a production app pointed at a paused database. None of it paged me. Here is what I check for now.
tag: Incidents
date: "2026-09-29"
order: -1
featured: true
query: dashboard warning light dark control panel
---

I found out my app had no working database by reading its runtime logs for an unrelated ticket. Nothing had alerted. The dashboards were green. The last scheduled job had reported `ok: true`.

This was Barez, the Arabic CV builder and Gulf job board I am building on the side. It is still pre-launch, so nobody got hurt. But every failure I found that week had the same shape: something stopped working and the signal that should have said so stayed quiet or, worse, said the opposite.

## Three failures, one pattern

**The cron that never started.** The job that refreshes the job feed runs on a schedule in GitHub Actions. A billing problem on the account meant every run after a certain date failed before its first step. No runner, zero steps, one annotation about failed payments. The workflow history showed red, but nobody reads workflow history for a job that has worked for months.

**The job that reported success over a failed write.** Before that, the last run that did execute returned `ok: true` and a count of the jobs it fetched. Fetching had worked. Saving had not, because the database was unreachable. The job measured the part that succeeded and reported that as the result.

**The app on a paused database.** Production's database URL pointed at a free-tier project that had been paused for inactivity. Search still returned jobs, because the code fell back to a live pull when the cache read failed. So the page looked fine. Sign-in, saving a CV and payments were all down behind it.

The fallback is the part worth sitting with. It was written to make the app resilient, and it did. It also hid the outage completely.

## What I check for now

Some of these are already fixed in the code. The rest are on the checklist every product has to pass before it ships.

**A health route that touches the database.** `/api/health` should do one trivial read and return 500 if it fails. A health check that only proves the server can answer HTTP would have been green the whole time. An uptime probe hitting this route would have caught the paused database on its first request.

**Heartbeats on success, not alerts on failure.** A job that never starts cannot report its own failure. So each scheduled job should ping a dead-man's switch when it finishes, with the alert firing when the ping does not arrive. Silence becomes the signal instead of the absence of one.

**Report the outcome, not the effort.** The refresh job now reports how many rows it wrote and how many writes failed, and it returns an error when the database write fails, even if the fetch worked. `ok` has to mean the thing the job exists to do actually happened.

**Unknown is not the same as fresh.** On error, the search API used to return a cache age of `0`, which means "just refreshed". It now returns `-1`, and the page shows nothing rather than claiming the data is new. When the data is old, the page says "Updated 9 hours ago" and shows a warning. Users can at least see what I could not.

**Name every fallback and log when it fires.** A fallback that runs silently turns a loud failure into a quiet one. Keep them, but make each one log that it was used, so "the cache is broken" is visible instead of absorbed.

## The rule underneath

A quiet dashboard should mean everything is fine. For that to be true, every check has to be able to tell "nothing happened" apart from "nothing went wrong", and every job has to measure the result it was built for.

None of these fixes needed new tools or new knowledge. They needed someone to ask, for each signal, what it would look like if the thing it watches had quietly stopped. Usually the answer was: exactly like it looks now.
