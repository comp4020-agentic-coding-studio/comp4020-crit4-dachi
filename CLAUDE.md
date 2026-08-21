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
- Multi-touch chording (two fingers, two independent pads sounding at once)
  can't be driven by `agent-browser`'s CLI input commands — `mouse`/`click`
  only ever move one pointer. Verified it anyway by dispatching two synthetic
  `PointerEvent`s with distinct `pointerId`s (`pointerType: 'touch'`) straight
  at `#stage` via `agent-browser eval`, then reading each pad's `--level` CSS
  custom property back: two pads went non-zero together, and lifting one
  `pointerId` left the other still sounding. This exercises the app's own
  `pointerPad: Map<pointerId, index>` bookkeeping for real (`pointermove`
  re-hit-testing still runs) — it's synthesising the one input primitive (a
  second simultaneous touch point) the CLI has no command for, not mocking
  the app's logic.
- Found and fixed a real bug this way, not just a confirm: the stage's CSS
  `gap` between pads means a real drag routinely passes through a strip that
  is over no pad at all. The old `pointermove` handler treated "no pad under
  the pointer" as `pointerPad.delete(pointerId)` — dropping that pointer's
  tracking outright, so a later move back onto any pad, while the button was
  still held, never retriggered `pressPad` (the handler's own early-return
  guard sees `pointerPad.get(id) === undefined` and bails before hit-testing
  again). That directly undercut the "single drag across the row plays a
  run" behaviour the code's adjacent comment claims. Confirmed with the same
  synthetic-`PointerEvent` technique above (down on pad 0, move into the
  gap midpoint, move onto pad 1, read `--level` back at each step) before
  touching source. Fix: a `NONE_HIT` sentinel value in `pointerPad` marks
  "pointer down, currently over no pad" instead of deleting the entry, so
  hit-testing keeps running on every subsequent move and a return onto a pad
  revives sound; only `pointerup`/`pointercancel` actually deletes the map
  entry. General lesson: whenever an interaction has designed-in dead space
  (a CSS gap, a border, an inset hit-target) between adjacent targets, check
  what a `pointermove` handler does at the boundary, not just on-target —
  "no target under the pointer" and "gesture ended" are different states,
  and conflating them (deleting tracking on either) breaks resumption.
- Found a second real bug the same way, this time in the keyboard sustain
  path: `sustainKey`'s rAF loop only checks `activeKeys.has(key)` and
  `activeVoices.has(voiceId)` to decide whether to keep rescheduling itself,
  and both are keyed by the bare key string, not by which press started the
  loop. Release a key and re-press it before the old loop happens to observe
  the key as briefly absent (trivial with fast, drum-like re-triggering,
  exactly the kind of play this brief invites) and the old loop never sees
  a false condition — it runs forever alongside the new one, computing an
  ever-growing stale elapsed time that saturates at max level and calls
  `Voice.setLevel` every frame. It's invisible by eye or by polling
  `--level`: rAF callbacks fire in registration order and the old loop
  always re-registers itself before the new one within a shared frame, so
  the new (correct) write always lands last and wins visibly. Confirmed by
  monkey-patching `pad.style.setProperty` to log every `--level` write with
  a timestamp via `agent-browser eval`, then release-and-immediately-re-press:
  the log showed paired writes a fraction of a millisecond apart after the
  re-press, one climbing toward a stale saturated value, one on the correct
  fresh ramp — a symptom a simple before/after read would never catch since
  it's overwritten within the same frame. Fix: a per-press token
  (`keyPressToken`, bumped on every keydown) that the loop checks against
  before rescheduling, the same disambiguation role `pluckCounter` already
  plays for reused pluck voice ids elsewhere in the file. General lesson:
  when a recurring rAF/interval loop's exit condition is a shared mutable
  key (a string, an id) rather than a token unique to the specific
  invocation that started it, a fast release-and-retrigger on that same key
  can leave the old loop believing it's still the current one forever —
  check this whenever a loop's "should I keep going" test reads shared
  state instead of comparing against something stamped at its own start.
- Found a third real bug in the same pointer-input area, this time about
  *where* the listeners live rather than what they do: `pointermove`,
  `pointerup` and `pointercancel` were attached to `#stage`, and no pointer
  capture is used (deliberately, so a drag can retarget across pads). But
  without capture, a bubbled event only reaches a listener if the pointer
  is currently over that element or one of its descendants — and `#stage`
  is a small region (`height: min(48vh, 26rem)`) with page chrome (header,
  margins) all around it, so a real drag routinely leaves it. Dragging off
  the stage and releasing the mouse/finger out there never fired
  `endPointerGesture`: the voice kept sounding and the pad stayed lit
  forever, since nothing on the page received the up/cancel event at all.
  Confirmed with the same synthetic-`PointerEvent` technique (down on a
  pad, move to a point over the header far outside `#stage`'s bounding
  rect, release there, read `--level` back — it stayed at its pressed
  value indefinitely) before touching source. Fix: move the three
  listeners from `stage` to `window`, which is always in the bubble path
  regardless of where the pointer physically is; `pointerdown` stays on
  `stage` since a gesture still has to start on a pad, and each handler
  already no-ops for any `pointerId` it doesn't recognise, so listening
  globally added no new behaviour for pointers that never touched a pad.
  General lesson: when an interaction deliberately skips pointer capture,
  the *release-and-cancel* listeners still need a target that's guaranteed
  to receive the event no matter where the pointer ends up — that's
  `window`/`document`, not the interactive region itself, since the whole
  point of the interactive region being small is that gestures escape it.

## This file is yours

A starting point, not a rulebook. As you learn what your prototype needs --- a
convention the work has to hold to, a sensor that keeps catching you out (a
linter, say), a fact about the stack that is easy to get wrong --- write it down
here and wire it into `check`. Growing this file is the work.
