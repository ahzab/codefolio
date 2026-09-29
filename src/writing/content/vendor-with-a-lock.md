---
title: I had the same 24 scripts in two repos. Not one matched.
description: Copy-pasting shared code between repos feels fine until you diff them. I moved mine into one library, vendored it with a hash lock, and made the lock fail the commit.
tag: Building
date: "2026-09-29"
order: -3
query: padlock chain metal close up
---

I run two repos that automate most of my working day. One handles my side products, the other my day-to-day engineering routine. They grew up side by side, and whenever one needed a helper the other already had, I copied it across.

When I finally diffed them, 24 scripts had the same name in both repos. Not one was byte-identical. Some fixes existed only in one copy and some only in the other. Nobody noticed, because each copy worked well enough on its own. Moving them surfaced bugs that had been there for months, like a logging helper that turned `C:\temp` into `C:` plus a tab and `emp`, but only from the second line in a section, so it looked random.

## Why copies drift both ways

A copied file has no owner. When you fix it, you fix the one in front of you, because that is the one with the bug you are looking at. The other copy does not fail loudly. It just keeps the bug until something else hits it, weeks later, in a context where you have forgotten there was a fix.

After enough of those, the two files are different programs with the same name.

## One library, copied in verbatim

I moved the shared scripts into one small library and pulled it into each repo as a vendored copy in its own folder. Each repo keeps a thin shim with its own settings (which state file, which keys are valid) and calls into the shared code.

The shared code is not allowed to know which repo it is running in. If it needs to behave differently, the difference is declared as data in the repo's config file. An `if` on the repo name inside the library is the thing I am trying to prevent.

## Why a copy and not a submodule

Submodules would keep the code in one place, but my scripts run headless from scheduled jobs on plain checkouts. An uninitialized or detached submodule does not fail with a clear error. The folder is just empty, and a scheduled run fails somewhere later in a way that looks unrelated. A committed copy is always there.

## The lock is what makes it work

A copy has one weakness: anyone can edit it in place, and then you are back where you started. So the pull step writes a lock file with a SHA-256 hash for every vendored file, and a pre-commit check re-hashes them. It fails on four things:

- a file edited in place
- a locked file that is missing
- a new file in the vendored folder that the lock does not list
- a tampered lock

Pulling a new version also refuses to overwrite a file that was edited locally. That local edit is exactly the drift the lock exists to catch, and overwriting it would destroy the evidence. The fix goes upstream into the library, then comes back down with the next pull.

## Ask the question every time

The last piece is a gate on new files. Every new script has to carry a one-line comment saying whether it belongs locally, in the shared library, or is a candidate to move there with a tracked task. A small tool measures it for me: does the other repo have a file with the same name, how many lines do they share, and does the code depend on things only this repo has.

I added that the day after I called the extraction finished. The other repo had just built a reminder scheduler that this repo needed too, out of pieces that were already shared, and nothing prompted anyone to check. Writing the rule down had not been enough. The rule held once something checked it on every commit.

## What I would tell someone starting out

If two repos share a file, one of them should own it. Copying is fine as a delivery method, as long as a hash says the copy is still a copy. Rules that live in a README drift. Rules that fail a commit do not.
