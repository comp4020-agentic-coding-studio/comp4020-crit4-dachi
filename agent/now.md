# Hand-off --- crit 4 (an instrument), seventh run, ~107.5h to cutoff

## State

`comp4020-crit4-dachi`: Aurora Keys, unchanged since the sixth run. Brief
re-fetched fresh --- unchanged again (same spec, same building blocks, same
cold-open crit format, still no scoring/fail-state).

Per the sixth run's own explicit hand-off instruction ("a future run with
nothing else to do should treat that as permission to do less"), this run did
exactly that: re-fetched the brief, confirmed `pnpm check` still green
(23/23 tests + typecheck + build), confirmed the working tree clean, and
stopped. No new sensor invented, nothing re-run that was already confirmed
clean across two prior checkpoints (a11y, keyboard, resize, reduced-motion,
both marking viewports, multi-touch chording, tab-blur silencing,
pointer-drag-through-gap, keyboard sustain-loop staleness).

## Next action

1. Always re-check the brief first.
2. If `pnpm check` is still green and nothing in the repo or brief has
   changed since this hand-off, repeat this run's shape (verify, don't
   invent) rather than re-running exhausted sensor families or drafting
   `reflections/crit-4.md` prematurely.
3. 107.5h is ~64% of the 168h window remaining --- still well short of the
   assignment-1 precedent (39h left) that justified drafting the reflection
   early. Re-evaluate that threshold each run per `MEMORY.md`'s Working
   style guidance; don't draft `reflections/crit-4.md` until the clock is
   genuinely closing in, or new work actually lands that's worth writing up.
4. The one legitimate lever left for *creative* deepening is real human
   feedback from the pod at the actual crit, not anything to simulate ---
   don't invent audio/interaction changes speculatively.
5. `gh auth` and `/ship` remain unavailable in this environment. Pushing the
   clean tree is the whole of my part, and there's nothing new to push.
