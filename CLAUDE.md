# codefolio.dev — project instructions

Personal portfolio + markdown-driven `/writing` blog (Vite static site, deployed on Vercel).

## Writing confidentiality rule (hard constraint)

Blog posts may draw on real professional experience, but they are **public**. Every post about work, incidents, architecture, or engineering practice MUST stay at the level of generalizable, transferable lessons. Never include, paraphrase, or hint at:

- **PII** — names, emails, customer or colleague identities, account or order data.
- **Employer-private information** — anything specific to HSE (Home Shopping Europe) or any employer/client: internal system or service names, team or org structure, roadmaps, contracts, vendor names, internal metrics, traffic/revenue figures, incident specifics, dashboards, or ticket content.
- **Infrastructure details** — real topology, hostnames, IPs, cloud account structure, security controls, credentials, config, or anything that maps to a specific production system.

Write from the *lesson*, not the *instance*. "On a high-traffic checkout, idempotency matters because..." is fine. Naming the system, quoting a real outage, or citing an internal number is not. When in doubt, generalize it or leave it out, and ask Abdel before publishing anything that references real work closely.

## Content style

- **No em dashes.** Use commas, periods, or parentheses. Run a humanizer pass on every draft (kill "unlock / seamless / supercharge", rule-of-three, AI smell).
- One voice: direct, specific, opinionated. Hook in the first line.

## Blog pipeline (how `/writing` is built)

- Source of truth: `src/writing/content/*.md` with frontmatter `title, description, tag, date, order, featured?, image?, query?`. The `.html` output is generated and gitignored.
- **Dates:** live only in the md frontmatter as a quoted ISO string, e.g. `date: "2026-03-14"` (quotes matter — unquoted YAML parses it into a Date object). The ISO value feeds `<time datetime>`, SEO `article:published_time`, and schema `datePublished`; the visible date is formatted to `DD/MM/YY` for display only (`displayDate()` in the build). A **new post defaults to the real current date**; only backdate or randomize when asked. Existing posts are backfilled across 2025. Lower `order` = shown first, so give a newer post a lower `order` and a later date than the post above it.
- `scripts/build-writing.mjs` runs before `vite build` (via `yarn build`) and generates: article pages, homepage featured cards (`featured: true`, top 3 by `order`), the paginated `/writing` index, hero SVGs, and social meta tags.
- Hero images: `yarn images` fetches a Pexels photo per post (key in gitignored `.env.local`), optimized to 1200x627. A post uses, in order: frontmatter `image` > downloaded Pexels photo > generated SVG.
- Social cards: `og:image` / `twitter:image` resolve to the post's own hero (absolute `https://www.codefolio.dev/...`); `og:image:width/height` are emitted for LinkedIn. Use the canonical `www` host everywhere (apex 308-redirects).
- Don't commit secrets; `.env.local` and generated artifacts stay gitignored.
