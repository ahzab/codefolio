---
title: YAML turned my phone number into 384
description: YAML guesses types, and it guesses wrong on exactly the values config files are full of. Province codes become booleans, phone numbers become octal, dates become objects.
tag: Stack
date: "2026-09-29"
order: -1
featured: true
query: code editor screen dark close up
---

My resume is generated from a YAML file, and my phone number starts with `0600`. Left unquoted, the parser reads that as 384. Nothing crashes, no test fails, and the PDF looks perfectly normal apart from the number being wrong.

YAML does not store strings unless you ask it to. It reads each value and guesses a type, and some of its guesses are old rules most people have never heard of. I have run into four of them recently, all in small personal tools.

## A leading zero means octal

In YAML 1.1, which is what PyYAML and many other parsers still implement, a number with a leading zero is octal. `0600` is 6 × 64, which is 384. Phone numbers, postcodes, account numbers and anything padded with zeros are exposed to this.

The fix is to quote it: `phone: "0600 000 000"`. Better, make the code that reads the file refuse a phone field that arrives as a number. That turns a silent wrong value into a loud error the first time it happens.

## ON is a boolean

I keep a small catalogue of regions for a job search tool, each with a province code. Ontario's code is `ON`. The first run read it as `true`.

YAML 1.1 treats `yes`, `no`, `on`, `off`, `y` and `n`, in several capitalizations, as booleans. This is the same rule behind the famous "Norway problem", where the country code `NO` comes back as `false`. The data looks like plain text, so nobody thinks to quote it.

My fix there was to load that file with a loader that does no type guessing at all (`BaseLoader` in PyYAML), so every value arrives as a string and the code converts only what it expects to be a number.

## A key called on

Keys are not safe either. In another file I listed which pages each project should appear on, under a key named `on:`. The parser read the key as the boolean `true`, so looking up `on` found nothing.

I renamed the key to `surfaces:` and wrote the reason next to it, so the next person who thinks `on` reads better does not undo it. A test that loads the file and checks the expected keys exist would also have caught it.

## Unquoted dates become objects

This blog stores each post's date in YAML frontmatter. Unquoted, `date: 2026-09-29` is parsed as a date object, not a string, and then gets serialized in whatever format the language prefers, often with a time and a timezone attached. Quoted, it stays exactly what I wrote. Every post here uses the quoted form for that reason.

## What I do now

- **Quote anything that is an identifier, not a quantity.** Codes, phone numbers, versions, dates you want back verbatim. If you would never do arithmetic on it, it is a string.
- **Use a non-guessing loader for data files.** Type guessing is convenient for config you write by hand. For a data file with hundreds of entries, it is a source of bugs you will not see.
- **Validate after loading.** Check the types and keys you expect. The parser will not tell you it guessed. Your own check will.

YAML is pleasant to write, which is why it ends up holding data it was never careful with. The format is fine as long as you stop trusting it to know what your values mean.
