# Hand-off --- crit 4 (an instrument), first build, ~157h to cutoff

## State

`comp4020-crit4-dachi`: this run's the first real work on the repo (was still
the unmodified starter template). Brief fetched fresh from
`crits/04-instrument.json`: "turn the browser into a musical instrument ---
something a stranger can pick up and play," Web Audio, client-side synth
only, no score/fail state, an inviting silent opening, playable by mouse,
keyboard and touch.

Built **Aurora Keys**: eight pads across a C-major-pentatonic scale (so no
combination is a wrong note), synthesised live (triangle + detuned-octave
shimmer through a lowpass, into a synthesised convolution reverb, no
samples). Mouse/touch drag across the row for a glissando (deliberately no
`setPointerCapture`, so `pointermove` re-hit-tests and can leave the pad it
started on) and vertically within a pad for brightness; keyboard (A S D F G H
J K) plucks on press and swells brighter the longer a key is held. Idle pads
breathe gently (`prefers-reduced-motion` disables it) to invite the first
touch instead of instructions; the hint text fades permanently on first
interaction.

`pnpm check` green (22/22 + typecheck + build), `linkinator` on `dist/` clean
(3 internal links), a11y audit zero violations (one `incomplete` --- gradient-
background text, hand-confirmed >5:1 contrast in both directions, see
`CLAUDE.md`), reduced-motion live-checked, keyboard tab order + Enter-to-play
live-checked, both marking viewports (1920×1080, 390×844) screenshotted with
no overflow. `public/card.png` replaced with a real screenshot of the
instrument (was the starter's dashed-border placeholder). Working tree clean,
pushed to `origin/main` (`b421b42`). `pnpm check:evidence` fails on exactly
one thing: no `reflections/crit-4.md` yet --- expected and correct this early,
not a bug.

## What I did this run

1. Read `memory/now.md` (found it stale --- described a different, already-
   shipped deliverable --- and the course source, fresh).
2. Confirmed via `git log`/`ls` this repo was still the bare starter template:
   no prior work to continue.
3. Designed and built Aurora Keys end to end (`index.html`, `styles.css`,
   `main.ts`), replacing `spec/starter.test.ts` with `spec/instrument.test.ts`
   (69812d7).
4. Verified live in a real headless Chrome via `agent-browser`: click,
   keyboard, Tab+Enter, reduced-motion, a11y audit, both viewports, console
   clean throughout.
5. Replaced the placeholder `card.png` with a real screenshot (c7373c6).
6. Recorded two stack gotchas hit along the way in the project's own
   `CLAUDE.md` (c0b08ad) and in this file's `MEMORY.md` (reusable across
   future weeks on the same template, not just this repo).
7. Wrote a real `PROCESS.md` (266 words, two moments, both cited) (b421b42).
   Deliberately did *not* write `reflections/crit-4.md` yet --- 157h out is
   plan/build/deepen territory, and this project's own accumulated lesson is
   that the reflection reads better written once the work has actually
   settled, not this early.

## Next action

Nothing broken, nothing urgent. With this much runway, a future run should
treat this as "deepen," not "re-verify the same thing":

1. Always re-check the brief first, even though it's very unlikely to change.
2. Genuinely new sensors/deepening still worth doing, in roughly this order:
   - Multi-touch: confirm two simultaneous touches on a touch-emulated
     viewport actually sound as an independent chord, not just single-touch
     drag (only single-pointer interaction has been live-tested so far).
   - Consider whether the keyboard's swell-while-held and the pointer's
     drag-for-brightness are legible to someone who's never been told the
     mapping exists ("uninstructed" is the brief's own bar) --- maybe a
     first-touch-only subtitle animation, or accept that discovery-through-
     play is the point and resist adding a label.
   - `spec/instrument.test.ts` only checks the static shell (see `CLAUDE.md`
     for why); there may be more mechanically-checkable spec lines from the
     brief worth adding even given that ceiling (e.g. does every page still
     carry exactly one `<h1>`, alt text, etc. --- already covered by
     `spec/invariants.test.ts`, so check for real gaps before adding more).
   - Once a few more runs have passed with nothing new to add, that's the
     signal to draft `reflections/crit-4.md` (150--300 words, the two
     standing prompts) --- not before.
3. `gh auth` and `/ship` remain unavailable in this environment (confirmed
   again implicitly --- didn't even try, per last crit's finding). Pushing the
   clean tree is the whole of my part; the repo is still private, as
   expected, until `/ship` runs (not mine to trigger).
