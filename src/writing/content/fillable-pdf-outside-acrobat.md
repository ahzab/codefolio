---
title: A fillable PDF that works outside Acrobat
description: Most people fill forms in Preview, a browser, or a phone app, not Acrobat. Building PDF forms from HTML and fixing three reader bugs made mine fill everywhere.
tag: Building
date: "2026-09-29"
order: -2
query: filling out paper form pen clipboard
---

I sell a few printable and fillable PDFs as digital products. The first rule I learned: your buyer does not have Acrobat. They open the file in macOS Preview, in a browser tab, or in whatever their phone picked. A form that only behaves in Acrobat is a support ticket waiting to happen.

The biggest one I built has 1,538 text fields and 233 checkboxes across many pages. Placing those by hand in a PDF editor was never going to happen, and every layout change would have meant placing them again. So I let the browser do it.

## Let the browser measure the fields

Every blank in the HTML is a link with a made-up address that carries the field's name and type:

```html
<a class="blank" href="https://f.local/full_name?t=text"></a>
<a class="blank" href="https://f.local/notes?t=area"></a>
<a class="check" href="https://f.local/has_will?t=check"></a>
```

CSS sizes and positions each one like any other box. When Chrome prints the page to PDF, every link becomes a link annotation with a rectangle at that box's exact place on the page. A small Python script then walks the PDF and replaces each of those annotations with a real form field at the same rectangle.

The browser does all the measuring. Change the paper size, the font or the spacing, rebuild, and every field lands in the right place again. The build also refuses duplicate field names and fails if a page overflows onto an extra one, because both break silently otherwise.

## Three reader bugs, three fixes

Getting fields into the file was the easy part. Getting them to behave in four different readers took the rest.

**Use a fixed font size, never auto.** PDF forms let you set the text size to auto, which sounds ideal. Acrobat shrinks auto text to fit the box. Poppler, and several free readers built on similar code, scale it up instead, so a single typed word filled the whole field and ran over the label above it. A fixed 10pt for single lines and 9pt for multi-line fields looks the same everywhere.

**Set the tab order explicitly.** Chrome marks each page to tab in structure order, but the new fields are not part of that structure, so the tab order was undefined. Pressing Tab jumped around the page. Setting each page's tab order to rows makes it move left to right, top to bottom, like a reader expects.

**Draw only the tick.** A checkbox field normally draws its own border. The HTML had already printed a styled square, so a second border drawn by the reader would sit on top of it, slightly offset. The fix was a custom appearance: nothing when unchecked, since the square is already printed, and just a tick when checked. No border, no font, nothing for a reader to render differently.

## Test in the readers people use

I check every build in Chromium, macOS Preview, a poppler render and Acrobat Reader, with a sample filled in by a script so I can see real text in the fields. That last part matters. An empty form looks fine in every reader. The bugs only show up once there is text in it.

The general lesson goes beyond PDFs. When a format has one reference app and several free readers, the free readers are what your users have. Test there first.
