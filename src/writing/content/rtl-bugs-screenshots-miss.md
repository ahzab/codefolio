---
title: Arabic RTL bugs your screenshots will not catch
description: Flipping dir to rtl is the easy part. The bugs that ship are a phone number printed backwards, a page that scrolls sideways once and never back, and an English title on an Arabic page.
tag: Frontend
date: "2026-09-29"
order: -2
query: arabic neon sign street night
---

Setting `dir="rtl"` on the `<html>` tag gets you most of the way to an Arabic interface. Flexbox flips, text aligns right, and the first screenshot looks correct. The bugs that reach production are the ones a screenshot does not show.

These are the ones I have hit building Barez, an Arabic-first CV builder, and what fixed each.

## Numbers and emails inside Arabic text

A phone number like `+971 50 000 0000` inside an Arabic paragraph can render with its groups in the wrong order. The browser's bidi algorithm sees digits, spaces and a plus sign as weak characters and places them relative to the Arabic around them. The same thing happens to emails and URLs.

The fix is to isolate those runs:

```tsx
export function Ltr({ children }: { children: React.ReactNode }) {
  return <bdi dir="ltr">{children}</bdi>;
}
```

Wrap every contact value in it. Then write a test that renders each template in Arabic and fails if any phone, email or link sits outside an isolate. Before this, I had a zero-width left-to-right mark pasted into sample data to make the demo look right. That is a sign the real fix is missing.

## Relative time in Arabic has a dual

"2 hours ago" is not "number plus hours" in Arabic. Two of something has its own form (قبل ساعتين), three to ten use the plural, and eleven and up go back to the singular. A hand-rolled `timeAgo` gets this wrong and ends up printing things like "منذ 0 دقيقة".

`Intl.RelativeTimeFormat` handles all of it. One extra detail: Arabic locales may use Eastern Arabic digits by default. If the counts next to your timestamp use Western digits, pin them with the numbering system extension so the page does not mix both:

```ts
new Intl.RelativeTimeFormat('ar-AE-u-nu-latn', { numeric: 'auto' });
```

## The page that scrolls sideways once

This one took a while. Decorative glows positioned past the logical end of a section made the content slightly wider than the viewport. The main wrapper had `overflow-x: hidden` to stop horizontal scrolling.

`overflow-x: hidden` does not stop scrolling. It makes the element a scroll container with no visible scrollbar. The page still had 128 pixels of hidden sideways range. Tabbing and normal swipes never reached it, but once something scrolled it, the reader had no way to scroll back.

`overflow-x: clip` clips without creating a scroll container. With a fallback for older browsers in Tailwind:

```html
<main class="overflow-x-hidden supports-[overflow:clip]:overflow-x-clip">
```

I added an end-to-end test that forces `scrollLeft` on each page in both languages and asserts it stays at zero. It failed on every case with the old CSS.

## Capture at a real mobile viewport

The overflow bug was reported from a screenshot that looked clipped on the right. The clip in that screenshot was fake. Headless Chrome has a minimum window width of about 500 pixels, so asking it for a 390 pixel window lays the page out at 500 and crops. The fixed navbar was cut too, which no real scroll could do.

Use device emulation for mobile captures (Playwright's `viewport` or a device profile), never a small `--window-size`. Otherwise you will chase bugs that do not exist and miss the one that does.

## The metadata still says English

The page rendered `<html lang="ar">` while the `<title>`, description and `og:locale` were still English. Search engines and link previews were being given an English summary of an Arabic page.

The fix was to build the root metadata from the same locale constant that sets `lang`, so the two cannot drift. And no `hreflang` until each language has its own URL, because `hreflang` promises one.

## What these have in common

None of these show up in a quick look at the page. They show up in a phone number, in the word for "two", in a swipe, in a link preview. RTL support is not a layout switch. It is a set of small promises, and each one needs a test that would fail if it broke.
