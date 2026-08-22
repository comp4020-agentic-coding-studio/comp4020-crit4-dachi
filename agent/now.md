# Hand-off --- crit 4 (an instrument), tenth run, ~83.5h to cutoff

## State

`comp4020-crit4-dachi`: Aurora Keys. Brief re-fetched fresh --- unchanged again
(same spec, same building blocks, cold-open crit format, still no
scoring/fail-state).

This run tried yet another new lens: after two dry passes on the
JS/state-symmetry lenses (runs 7-8) and one working lens (per-target
multi-writer state, run 9), the next question moved out of `main.ts`
entirely and into `styles.css`. The idle "breathing" pulse animates
`--level` directly via `@keyframes`, but `--level` was never registered with
`@property` --- an unregistered custom property isn't known to be a number,
so CSS doesn't interpolate it when animated; it just flips discretely partway
through each keyframe interval. Confirmed by sampling
`getComputedStyle(pad).getPropertyValue('--level')` every 100ms across a
full 3.2s cycle via `agent-browser eval`: value sat flat at `0` or `.22` and
jumped between them, never anything in between --- a hard flicker where the
CSS reads like a smooth pulse. Invisible to a screenshot (both endpoint
values look plausible alone) and to the a11y/reduced-motion checks (neither
samples a value's trajectory over time). Fixed with `@property --level {
syntax: "<number>"; inherits: false; initial-value: 0; }`; re-sampled
afterwards and got a continuous curve (0.098 -> 0.22 -> 0.098 ...). Confirmed
JS-driven levels (pointer press, keyboard sustain) were never affected,
since those transition via `transform`/`box-shadow`/`background` (real
animatable properties) rather than via `--level` itself being animated.
Re-ran reduced-motion (still static 0.12, no animation) and a full a11y
audit (0 violations) after the change. `pnpm check` green (23/23)
throughout. Committed as three commits (fix, `CLAUDE.md`, `PROCESS.md`) and
pushed.

## Next action

1. Always re-check the brief first.
2. The lens that worked this run, added to the growing list (state-symmetry,
   logic-symmetry, listener-placement, per-target multi-writer state): check
   whether a CSS custom property that's animated *directly* by `@keyframes`
   (not just read inside a `calc()` by some other transitioning property) is
   registered via `@property`. If it isn't, the animation is silently a
   discrete toggle, not an interpolation --- only catchable by sampling a
   computed value's trajectory over time, never by a single screenshot.
3. 83.5h is still comfortably >24h and not yet at the assignment-1 precedent
   (39h) for drafting the reflection early. Five real bugs found across ten
   runs (three JS, one shared-state, one CSS) means this codebase keeps
   rewarding a fresh lens even when the previous two come back dry --- don't
   treat two dry passes as "exhausted."
4. The one legitimate lever left for *creative* deepening is real human
   feedback from the pod at the actual crit, not anything to simulate ---
   don't invent audio/interaction changes speculatively.
5. Push landed this run with a plain `git push`; `gh auth`/`/ship` remain
   unavailable/unnecessary in this environment.
