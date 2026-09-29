---
title: A test that passes when you undo the fix is not a test
description: A green suite after a bug fix tells you less than it looks like. Undo the fix, run the test again, and make sure it fails. Mine did not always.
tag: Stack
date: "2026-09-29"
order: -4
query: magnifying glass on paper documents
---

I fixed a bug, wrote a test for it, and the suite went green. Then I put the bug back and ran the test again. It was still green.

The test was supposed to prove that a cache reported its age correctly after an error. It compared two calls. Both calls ran within the same millisecond, so the elapsed time was zero either way, and the broken code and the fixed code gave the same answer. The test passed on both. It had never tested anything.

Since then, every bug fix on my projects has one extra step: undo the fix and watch the test fail.

## Why green is not enough

A test written after the fix has only ever run against the fixed code. It passes, which tells you the fixed code does what the test checks. It does not tell you the test checks the thing that was broken.

There are plenty of ways for that to go wrong without anyone noticing:

- the test sets up a case that never reaches the broken branch
- a mock returns the right answer no matter what the code does
- the timing or data makes the old and new behavior look identical, like my millisecond
- an earlier step fails quietly and the assertion runs on leftover state

In each case the test is green, the reviewer sees a test next to the fix, and the bug can come back without a single failure.

## Undo it and watch it fail

The check is simple. After the fix and the test are written:

1. revert only the fix, and keep the test
2. run the test and confirm it fails, for the reason you expect
3. put the fix back and confirm it passes

This is manual mutation testing, one mutation at a time, aimed at the exact line you changed. It takes a minute. Tools like Stryker automate the general version, but for a single bug fix the hand version is quicker and more targeted.

## What it caught

A few examples from the last month on Barez, the CV builder I am building on the side:

- **The same-millisecond test.** Reverting the fix left it green. It now moves the clock forward 30 seconds between the two calls, and fails on the old code.
- **A test that could pass off a stale call.** A test checked that a spoofed `Host` header could not redirect payment return URLs. If a route bailed out early, the assertion could still read a mock call left over from an earlier case. It now checks the response status and the number of calls, not just the last call's arguments.
- **A fix with three parts.** Page metadata was changed to follow the page's language. Reverting each part separately failed a different number of tests (seven, two and one), which showed every part was covered, not just the obvious one.
- **A CSS fix.** A new end-to-end spec for a sideways-scroll bug was run against the old CSS first. It failed all 24 cases. Only then did I trust it passing on the new CSS.

## Make it part of done

I now write the result into the notes for each fix: which revert I ran and how many tests failed. "Tests pass" on its own does not count as proof. "Tests pass, and undoing the fix fails 7 of 8" does.

It changes how you write tests, too. Once you know you will undo the fix, you stop writing tests that only check the happy path near the change. You write the one that goes straight at the line you edited, because that is the one that has to fail.
