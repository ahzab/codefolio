---
title: Finding what users ask for in app reviews
description: Counting words in reviews tells you what the category is about, not what users want. Match the asks, then score phrases by lift.
tag: Research
date: "2026-09-29"
order: -3
query: hand holding phone typing message blur
---

When I look for a small product to build, app store reviews are one of the best places to start. People write down exactly what they wish an app did, often with "I would pay for this" attached. The problem is volume. A popular app has thousands of reviews, and reading them is how you lose an afternoon without a conclusion.

So I wrote a small tool that pulls reviews and finds the repeated asks. The obvious way to do that is wrong in a useful way.

## Word counts find the category, not the need

The obvious approach is to count the most common phrases in low-star reviews. On four grocery list apps, the top results were "list", "item", "store" and "recipe". True, and useless. Every review of a grocery app mentions lists and items, happy or not.

What I wanted was the phrases that show up when someone is asking for something. That took two steps.

## Step one: only read the asks

First, keep only the sentences that are requests. In English that is a set of patterns: "please add", "I wish it", "would be nice if", "there is no way to", "can't export", "would pay for". Some need care. "It doesn't have" is an ask, but "I don't have to worry about it" is praise, so the pattern only matches when the subject is the app.

## Step two: score by lift

Then, for each phrase, compare how often it appears in the asking reviews with how often it appears in all reviews. That ratio is lift. A phrase that every review uses scores around 1. A phrase that appears mostly when people are asking scores well above.

On the grocery apps, "list", "item", "store" and "recipe" came out between 0.4 and 0.7. "Undo" scored 6.3, "Siri" 3.4, and "price history" 11. Those are features people wanted and did not have. I now drop anything under 1.5 and count a phrase only when it repeats across several reviews, and across more than one app when possible, which says it is a gap in the market and not one app's missing button.

## What it is and is not

This does not replace reading reviews. It tells me which twenty to read out of three thousand, and which asks repeat enough to be worth a closer look. A score is a shortlist, and the decision still comes from reading what people actually wrote.
