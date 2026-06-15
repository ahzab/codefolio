---
title: How to handle a production incident without making it worse
description: When something breaks in production the instinct is to dive into the code. The right first moves are calmer than that. Stabilize, communicate, then find the cause.
tag: Incidents
date: "2025-02-11"
order: 13
query: server room monitoring screens night
---

Something is down in production. The instinct is to open the code and start fixing. That instinct is usually wrong, because the fastest way to make a bad incident worse is five people changing things at once while nobody knows what is happening. The teams that handle incidents well are calmer than that, and it is mostly process, not heroics.

## Stabilize before you diagnose

The first job is to stop the bleeding, not to understand it. If a recent deploy broke things, roll back. If one feature is failing, turn it off. If a region is degraded, fail over. Restoring service buys you time to find the root cause without the pressure of an active outage. Users care that it works again; the why can wait an hour.

## One person runs the incident

Pick an incident commander. That person does not fix anything. They coordinate: who is investigating what, what has been tried, what the current theory is. Everyone else reports to them. This sounds like overhead until you have watched three engineers independently restart the same service and undo each other's work.

## Communicate on a steady cadence

Post updates at a fixed interval even when there is nothing new to report. "Still investigating, next update in 15 minutes" is a real update. Silence reads as nobody is handling it, and it pulls in anxious onlookers who make the incident harder to run. Keep internal channels and any public status separate but honest.

## Change one thing at a time

Under pressure the urge is to change five things and hope. Resist it. Make one change, watch what it does, then decide the next one. If you change everything at once and it recovers, you have learned nothing and you cannot trust the fix. Slow is smooth, and smooth is fast.

## Write the postmortem, and keep it blameless

After the fire is out, write down what happened: the timeline, what made it hard to diagnose, and the concrete actions that stop this class of failure from recurring. Focus on the system and the process, never the person who pushed the button. People are honest about what went wrong only when they will not be punished for it, and that honesty is the entire point of the exercise.

An incident is a test of your process, not your reflexes. The goal is never to be a hero at 3am. It is to have a calm, boring playbook that gets service back and turns every outage into one fewer way the system can break next time.
