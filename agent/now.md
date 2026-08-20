# Hand-off --- crit 4 (an instrument), fifth run, ~120.5h to cutoff

## State

`comp4020-crit4-dachi`: Aurora Keys was `pnpm check` green and pushed at the
start of this run. Brief re-fetched fresh from `crits/04-instrument.json` ---
unchanged again (same spec, same suggested building blocks, same crit format).

This run did the fresh `main.ts` read the last hand-off named as the one open
thread: does `pluckCounter`'s reused-voiceId pattern (in the click/pluck
handler) share the same staleness shape as the `sustainKey` rAF-loop bug fixed
last run? Answer: no, and it's a clean confirm, not a bug. Each pluck's
`setTimeout` closure captures its own specific `voice`/`voiceId` directly and
fires once, unconditionally --- there's no recurring reschedule with a
shared-state exit check for a fast re-trigger to race against. The staleness
bug class needs both a recurring reschedule *and* an exit check that reads
shared state instead of a per-invocation token; pluck has neither. No other
new asymmetry turned up (checked pointer/keyboard release-on-blur, keydown/
keyup case-folding under simultaneous shift, double-release guards, pad
indexing bounds --- all fine).

Given that confirm-only result, and per the prior hand-off's own stated
trigger ("if this pass also turns up only a confirm... draft
reflections/crit-4.md and PROCESS.md's update"), updated `PROCESS.md` with a
third "moment that mattered" documenting both the pointer-gap and
sustain-loop bugs and the two verification techniques that caught them
(synthetic `PointerEvent` dispatch at the gap boundary; monkey-patching
`style.setProperty` to see every write, not just the final one) ---
`926b04d`, pushed. **Deliberately did not** write `reflections/crit-4.md`
this run: 120.5h to cutoff is ~28% into the full 168h window, doctrine lists
the reflection as a final-run finishing step, and the assignment 1 precedent
for drafting it early had only 39h left, not 120.5h. Wrote up this
distinction in `MEMORY.md`'s Working style section so a future run doesn't
over-read "sensors exhausted" alone as license to draft the reflection
whenever the clock still has most of a week on it.

`pnpm check` green (23/23 + typecheck + build) both before and after this
run's PROCESS.md-only change (no source touched). Working tree clean, pushed.
`pnpm check:evidence` still fails on exactly one thing: no
`reflections/crit-4.md` yet --- correct and expected at this point in the
week, not a gap to close yet.

## Next action

1. Always re-check the brief first, even though it keeps not changing.
2. Sensors/asymmetry threads now exhausted at least once, all confirmed
   clean or fixed: a11y, keyboard, resize, reduced-motion, both marking
   viewports, multi-touch chording, tab-blur silencing, pointer-drag-
   through-gap (fixed), keyboard sustain-loop staleness (fixed), and now
   pluckCounter-vs-sustainKey staleness-shape comparison (confirmed safe).
   Don't re-run any of these identically --- only revisit one if a future
   code change actually touches that area.
3. No further specific asymmetry thread is currently flagged as open. A
   future run with still-substantial time left should do one more fresh
   read of `main.ts` and `styles.css` end to end for a genuinely new angle
   before assuming there's nothing left; if that also comes back a pure
   confirm, that's a stronger signal (not yet reached) that the sensor
   well may be running dry for real, at which point the clock check in
   `MEMORY.md`'s Working style section should govern whether it's early
   enough to keep deepening or time to start drafting the reflection.
4. `gh auth` and `/ship` remain unavailable in this environment (not
   re-checked this run; no reason to expect it changed). Pushing the clean
   tree is the whole of my part.
