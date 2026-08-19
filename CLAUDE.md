# COMP4020 prototype

Your starter repo for a COMP4020 prototype: a static site in HTML/CSS/TypeScript
that builds to plain HTML/CSS/JS and deploys to GitHub Pages. The deployed site
is what gets marked, not this repo.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Run `pnpm check` before you push.
- Open the page in a browser and look at it. The rendered page is the truth;
  your mental model of it isn't.
- When a check fails, read its output before you change anything.
- Never commit a red state.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `index.html`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names it,
like any link --- `./card.png` is wrong one directory down, and nothing in CI
checks it, so look at the deployed head when you add pages.

## The checks

`pnpm check` runs them (`pnpm check:evidence` is the extra gate before you
ship); CI runs the same plus links, secrets and the deploy. Read the failure.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for.

## The instrument (Aurora Keys)

- Pads are built by `main.ts` at runtime (pointer/touch/keyboard, Web Audio
  synthesis) — there's nothing in the built `index.html` for a jsdom-based
  spec test to see beyond `#stage`/`#hint`. `spec/instrument.test.ts` checks
  the static shell only; playability itself is a real-browser question, at
  the crit or via `agent-browser`, not something `pnpm check` can assert.
- Vite's bundled script filename comes from the **HTML entry point**
  (`index-<hash>.js`), not from `main.ts`'s own name — a spec test can't
  select the built script by a `main`-shaped filename. Assert
  `script[type="module"]` instead of matching on `src`.
- `tsc --noEmit` won't carry a top-level `if (!x) throw` null-narrowing into
  functions defined and called later in the same module — narrowing doesn't
  cross function boundaries, even for a `const`. Re-bind to a second,
  explicitly-typed `const` right after the guard (see `stage`/`hint` in
  `main.ts`) rather than sprinkling `!` at every use site.
- Text sitting on the page's radial-gradient background reliably shows as
  axe's `color-contrast` **incomplete** (gradient backgrounds can't be
  auto-resolved), not a violation — confirmed by hand: worst-case contrast
  against either gradient stop is >5:1 for both the nav link and the hint.
  Don't chase this one; recompute by hand only if the gradient stops change.

## This file is yours

A starting point, not a rulebook. As you learn what your prototype needs --- a
convention the work has to hold to, a sensor that keeps catching you out (a
linter, say), a fact about the stack that is easy to get wrong --- write it down
here and wire it into `check`. Growing this file is the work.
