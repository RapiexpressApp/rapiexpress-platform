# Landing — Agent Rules

App-specific rules for `@rapiexpress/landing`. The root `AGENTS.md` still
applies (language, commits, guardrails, pnpm); this file only covers what is
specific to the landing and overrides the root where it is more precise.
This file is "alive", can change depending of the decisions with the pass of the time.

## Stack

- **Astro 7.2.9**, static output. No adapter, no SSR.
- **Tailwind v4.3.3, CSS-first.** There is no `tailwind.config.*` and there
  never should be — configuration lives in `@theme` inside
  `src/styles/globals.css`. Tailwind is wired as a Vite plugin, not as an
  Astro integration.
- TypeScript extends `astro/tsconfigs/strict`.
- **Zero client-side JavaScript.** No React, Vue or Svelte. No framework
  islands. Adding the first one is a decision to be discussed, not an
  implementation detail.
- There is no test runner and no CI. Verification is manual — see
  "Definition of done".

### Commands

Run the dev server in background mode:

```
astro dev --background
```

Manage it with `astro dev stop`, `astro dev status`, and `astro dev logs`.
From the repo root: `pnpm dev:landing`.

Full documentation: https://docs.astro.build — consult it before working on
routing, content collections, styling or i18n. Do not rely on memory for
framework APIs.

## Component architecture

A section stops being a file and becomes a folder once it exceeds
**~120 lines of markup** or contains **3 or more distinct visual blocks**.
When it does, the required layout is:

```
src/components/<Section>/
  <Section>.astro         # orchestrator: data + layout only
  <Section><Part>.astro   # children, prefixed with the section name
```

`src/components/Hero/` is the reference implementation.

- The **orchestrator owns the data** and passes it down through typed props.
  Children never fetch or declare their own data.
- Export the item interface (`export interface Stat`), keep `interface Props`
  local. The orchestrator must import the exported interface and type its
  literals against it — an untyped literal defeats the purpose of the export.
- Components shared across sections live at the root of `src/components/`
  (e.g. `Navbar.astro`).
- Pages in `src/pages/` are **composition only**: imports and ordering. No
  markup, no logic, no data.
- Once a data array exceeds ~10 items, or is used by more than one section,
  extract it to a typed `src/data/<name>.ts`. Use content collections for
  editorial content.
- Files are PascalCase `.astro`; stylesheets are lowercase `.css`.

## Styles

Follow this cascade in order. Do not skip a step.

1. **Tailwind utilities** — the default for everything.
2. **`@theme` in `src/styles/globals.css`** — design tokens: colors, font,
   radii. A raw hex value in markup is a bug; add a token instead.
3. **`@utility` in `globals.css`** — for a class combination repeated in 3+
   places.
4. **`src/styles/<section>.css`** — keyframes and complex selectors scoped to
   one section. Prefix every class with the section name
   (`hero-animate-fade-up`, `hero-delay-3`) and import the file from the
   section orchestrator, never from the layout.

### Forbidden, without exception

- The `style="..."` attribute.
- `<style>` blocks — including Astro's scoped ones. Astro extracts them
  correctly, but splitting CSS between `.astro` and `.css` files makes it
  impossible to audit in one place. All CSS lives in `src/styles/`.
- `is:inline` on styles.

### Hard rules

- **Tailwind v4 only.** Utilities removed in v4 fail silently — they produce
  no CSS and no warning. Never use `ring-opacity-*`, `bg-opacity-*`,
  `text-opacity-*`, `flex-shrink-0`. Use slash opacity (`ring-amber-400/20`)
  and `shrink-0`. Renamed utilities still work as deprecated aliases, which
  is worse than failing — write the v4 name: `bg-linear-to-b`, not
  `bg-gradient-to-b`.
- `transition-*` must cover **every** property that changes on `:hover` or
  `:focus`. `transition-colors` next to `hover:-translate-y-0.5` means the
  translation snaps instead of animating.
- Animate **only** `transform` and `opacity` — they run on the compositor.
  Never animate `width`, `height`, `top` or `left`.
- Any `.css` file that declares an animation **must** end with a
  `@media (prefers-reduced-motion: reduce)` block that neutralises it.
  `src/styles/hero.css` is the model.
- Use the `--radius-*` tokens (`rounded-card`, `rounded-button`,
  `rounded-input`, `rounded-modal`) instead of bare `rounded-xl` /
  `rounded-2xl`.

## SEO

Not optional, and not a task for later. Every page ships with it.

- `title` and `description` are **required props** on `Layout`. The build
  fails without them — that is intentional.
- `Layout` always emits: meta description, canonical link, full Open Graph,
  Twitter card, `og:locale`, and JSON-LD.
- Exactly one `<h1>` per page. Heading levels never skip.
- Semantic landmarks: `<header>`, `<nav aria-label>`, `<main id="main">`,
  `<footer>`. A `<div>` is not a section.
- Descriptive link text. No `href="#"` reaches production.
- `site` in `astro.config.mjs` is what makes canonical URLs and sitemaps
  work. Keep it accurate.
- Every new page must be reachable from the sitemap once one exists.

## Accessibility

- Decorative SVG: `aria-hidden="true"` + `focusable="false"`. Informative
  SVG: `role="img"` + a `<title>` child. A decorative map whose `<text>`
  labels get announced out of context is a defect.
- Contrast: **4.5:1** for normal text, **3:1** for large text (24px and up,
  or 18.66px and up when bold) and UI components. On white, `text-slate-500`
  is the floor — `text-slate-400` (#94a3b8) is ~2.9:1 and is not allowed for
  text. When using an opacity modifier over a tinted background, compute the
  composited ratio; `/60` on a mid-tone almost always fails.
- `focus-visible:ring-2` on **every** interactive element, not just the
  primary CTA. A partially focusable navbar is worse than none.
- Touch targets >= 44x44 px.
- A skip link to `#main` is the first focusable element in `<body>`.
- Every image carries an intentional `alt` (`alt=""` when decorative).
- Mockups and placeholder data are illustration: mark them
  `aria-hidden="true"`. Reading "Amazon.com RE-2026-0847" aloud as if it
  were real content misleads the user.

## Optimisation

Use the platform first. Escalate only when the current step genuinely cannot
do the job, and say why in the PR.

1. **Native HTML/CSS** — Popover API, `<details>`, `<dialog>`, CSS
   animations, `content-visibility`, `scroll-behavior`.
2. **Astro built-ins** — `astro:assets` (`<Image>`, `<Font>`), the `fonts`
   config, view transitions, prefetch.
3. **A minimal vanilla script** with an explicit `client:*` directive.
4. **A library** — last resort. Any new entry in `dependencies` requires a
   written justification.

Concretely:

- Client-side JS budget: **0 KB**. Hold it as long as possible.
- Raster images go through `astro:assets` from `src/assets/`. A raw `<img>`
  pointing at `public/` skips format conversion and responsive sizing.
  This needs `sharp`, Astro's default image service, installed as a
  devDependency — it runs at build time only and ships nothing to the client.
  Keep `public/` for files that must keep a stable URL (favicons, `robots.txt`,
  the logo referenced from JSON-LD and Open Graph).
- Fonts are self-hosted through Astro's Fonts API. A `<link>` to
  `fonts.googleapis.com` is render-blocking and leaks users to a third
  party — never add one back.
- Always set explicit `width`/`height` (CLS). Below the fold:
  `loading="lazy"` + `decoding="async"`. For the LCP image:
  `loading="eager"` + `fetchpriority="high"`.
- **Lazy has a floor: skip it when a whole section's images weigh under
  ~50 KB.** Deferring costs a visible flash of `alt` text — the box is
  reserved by `width`/`height`, and the browser fills it with the alt string
  until the fetch it deliberately delayed comes back. Below the floor there is
  nothing worth deferring, so the flash buys nothing. Use `loading="eager"` +
  `fetchpriority="low"`: the images ride the initial load behind the font and
  the LCP, and are decoded before the reader scrolls to them. The store logo
  wall in `Stores.astro` is the case this rule came from — 13 logos, 26 KB
  total. Weigh the built output (`dist/_astro/*.webp`), not the source files.
- **`<Image>` defaults to `loading="lazy"`.** Deleting the prop does not make
  it eager, it falls back to the default and the emitted HTML is unchanged.
  Write `loading="eager"` explicitly and confirm in `dist/index.html` — this
  one fails silently in exactly the way a diff makes look correct.
- The few comments that survive the root comment rule go in the frontmatter
  (`//`) or in `{/* */}`. Astro ships `<!-- -->` to the client on every page
  load; the other two are stripped at build.

## Language

UI copy in Spanish (LatAm / Ecuador). Code, identifiers and **all comments,
including CSS comments**, in English.

## Definition of done

Before calling a task finished:

- [ ] `pnpm --filter @rapiexpress/landing build` passes.
- [ ] `grep -rn 'style=' src/` and `grep -rn '<style' src/` return nothing.
- [ ] `grep -rEn 'ring-opacity|bg-opacity|text-opacity|flex-shrink' src/`
      returns nothing.
- [ ] The page has one `<h1>`, a `<main>`, and `title` + `description` passed
      to `Layout`.
- [ ] Every new interactive element is reachable by keyboard and shows a
      focus ring.
- [ ] New decorative SVG is `aria-hidden`.
- [ ] Any new animation has a `prefers-reduced-motion` escape, verified with
      DevTools > Rendering > Emulate CSS media feature.
- [ ] Every new `<Image>` was checked in `dist/index.html`, not in the source:
      `grep -o '<img[^>]*>' dist/index.html`. The `loading` attribute is the
      one you intended, and no scroll-in section flashes `alt` text.
- [ ] No new client-side JS, or a written reason why it was unavoidable.
- [ ] Edge cases and race conditions listed, per the root rules.

## Known debt — do not assume tooling catches this

- **`.astro` files are not linted at all.** `@rapiexpress/eslint-config` has
  no `eslint-plugin-astro` or `astro-eslint-parser`, so `eslint .` in this
  app only checks `astro.config.mjs` and `eslint.config.mjs`. There is also
  no `eslint-plugin-jsx-a11y`. Every accessibility rule above depends on
  human review. Wiring these up is the highest-value tooling improvement
  available.
- **`@rapiexpress/config` is orphaned**: nothing imports it, and its
  `exports` map still points at a `theme.css` that was deleted. Importing it
  fails today. Either fix it or remove it.
- **Prettier cannot parse `.astro` files.** `prettier-plugin-astro` is not
  installed, so `prettier --check` errors out on every component instead of
  checking it. Combined with the point above, `.astro` files are currently
  neither linted nor formatted. On top of that, the shared config sets
  `singleQuote: true` while much of the codebase uses double quotes, and the
  repo root has no `prettier` key, so non-landing files format with Prettier
  defaults.
- **`pnpm format:check` cannot pass on Windows, repo-wide.** `core.autocrlf`
  is `true`, so git writes CRLF on checkout, while the shared Prettier config
  demands `endOfLine: "lf"` and there is no `.gitattributes` to settle it.
  Every file fails the check, including ones nobody has edited. Running
  `format --write` only flips the line endings back until the next checkout.
  The fix is a root `.gitattributes` with `* text=auto eol=lf`, which
  renormalises the whole tree in one commit.
- **`globals.css` comments are in Spanish**, against the rule above.
- The comment "Estados de paquete — compartidos con portal y backoffice" is
  no longer true: those tokens became app-local when
  `packages/config/theme.css` was deleted. Revisit when a second app needs
  them.
- No CI, no tests, no git hooks.
