---
title: The agent writes the diff. Plain code decides if it ships.
description: I let a coding agent take GitHub issues to merged PRs. The trick was not a better prompt. It was keeping the agent away from every decision that reaches production.
tag: Applied AI
date: "2026-09-27"
order: 0
featured: true
query: assembly line conveyor factory machine
---

A coding agent is good at writing the change. It is not the thing you want deciding whether that change reaches production.

I ship my own products next to a full-time job, so the time between "I know what this issue needs" and "it is live" is the time I do not have. I wanted an agent to take an issue all the way to a merged PR. What I did not want was a model with push rights and an opinion about when it was done.

So I split the job in two. The agent writes the diff. Everything after the diff is plain code with rules you can read. That split became [ship-loop](https://github.com/ahzab/ship-loop), an open-source CLI that takes a GitHub issue to a verified preview, and to a merge only when every gate allows it.

## The agent never touches git

The agent gets a brief made from the issue: the description, the checkbox acceptance criteria, and the rules of the job. One of those rules is that it does not commit, push or change branches. ship-loop does all of that itself.

This sounds like paranoia until you think about what a model with push rights can do on a bad run. It can push the wrong branch. It can commit a half-finished file. It can decide a failing test is flaky and move on. None of those are model bugs. They are the model doing what the prompt allowed. The fix is to not allow it.

Every run also works in its own git worktree, cut from a freshly fetched `origin/main`. Branching in my working copy would move my HEAD, stack the new work on whatever I had checked out, and let a `git add -A` sweep up my half-written files. A separate checkout makes all three impossible.

## Gates, with a budget

After the agent is done, the gates run: typecheck, tests, build, anything the repo configures. If one fails, its output goes back to the agent for another try. Up to three rounds, then the run stops.

That limit matters more than it looks. An agent in an unbounded fix loop will keep trying, burning tokens and CI minutes on a problem that needs a person. Every loop in ship-loop has a limit: the fix loop, the wait for a preview, the wait for CI. When one runs out, the run stops and writes the reason on the PR. Nothing retries forever.

## "All checks passed" is not a merge condition

This was the most useful thing I learned building it.

"All checks passed" is true of a PR with no checks at all. It is also true of a PR whose only checks are the hosting provider's deploy statuses, green while nothing ran the tests. If your merge rule is "everything green", an empty pipeline merges.

So ship-loop refuses to auto-merge unless you name one CI check that must be present and green. With no checks at all, it refuses. When it does merge, it merges pinned to the exact commit it verified, so a push that lands a second later cannot slip in behind the check.

Previews have the same trap. Vercel and Netlify protect preview URLs by redirecting to a login page, and a naive "did it return 200" check calls that a success. ship-loop reports it as protected, says so on the PR, and will not merge on it.

## Risk decides who looks, not whether it is good

Every diff gets a risk score based on what it touches. Migrations, auth code, middleware and CI workflows are high. Lockfiles, env files, deploy config, deleted files, or source changes with no test changes are medium. Everything else is low. The PR lists the files that raised each factor.

The score is not a quality verdict. It answers one question: can this merge while I am asleep? A high-risk change never merges unattended, whatever the gates say. It gets a `needs-review` label and waits for me.

## Refusals are answers

When the merge gate says no, ship-loop comments the reason and exits. It does not look for another way in.

That is the part I would copy into any agent setup, with or without this tool. An agent that treats "no" as a problem to route around will eventually find the route. The pipeline around it should treat "no" as the result.

## What a run looks like

The demo repo has [a real issue](https://github.com/ahzab/ship-loop-demo/issues/1) with five acceptance criteria: add a CSV export. ship-loop took it to [a PR](https://github.com/ahzab/ship-loop-demo/pull/2). Claude Code wrote the export and its tests in an isolated worktree, typecheck and tests passed on the first attempt, the diff scored low risk, and the PR carries the criteria, the gate results and the risk report.

Each phase is written to a small state file inside `.git`, so an interrupted run resumes where it stopped. It never pushes twice, opens a second PR, or redeploys.

## The rule for next time

Give the model the part it is good at, and nothing else. Writing the change is that part. Deciding whether the change is safe to ship is a rule, and rules belong in code you can read, test, and blame.

ship-loop is [on GitHub](https://github.com/ahzab/ship-loop), MIT licensed, with no runtime dependencies beyond Node 20 and git.
