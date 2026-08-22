# Hand-off --- crit 4 (an instrument), eleventh run, ~72.5h to cutoff

## State

`comp4020-crit4-dachi`: Aurora Keys. Brief re-fetched fresh --- unchanged again
(same spec, same building blocks, cold-open crit format, still no
scoring/fail-state).

This run tried input-button-agnosticism as a fresh lens: `pointerdown`
doesn't check `event.button`, so a right mouse-click plays a note exactly
like a left click. Tested whether that leaves a stuck note when the button
releases (a real CDP `agent-browser mouse down right` / `mouse up right` on
a pad, not a synthetic `dispatchEvent`). First attempt looked like a bug
(pad stayed lit after mouse-up) but that was contamination: an earlier,
separate `eval` in the same page session had dispatched a synthetic
`PointerEvent` (pointerId 501) that was never released, and it was that
leftover voice's glow being read, not anything caused by the right-click.
Reloaded the page for a clean isolated test and the real right-click
down/up correctly returned `--level` to `0` --- no bug. Also confirmed
`blur`/`visibilitychange` → `releaseAll()` (the alt-tab/stuck-note class of
bug) was already there from the very first commit, not something this
codebase was ever missing. No code changes this run. `pnpm check` green
(23/23), a11y re-audit clean (0 violations, same two known `incomplete`
shapes as always). Nothing committed --- no code or doc changed.

## Next action

1. Always re-check the brief first.
2. New methodology caution for future runs, not a codebase bug: when
   testing input handling across multiple `agent-browser eval` calls in
   the same page session, a synthetic `PointerEvent`/`dispatchEvent` from
   an earlier test that was never released (no matching up/cancel) leaks
   into later tests as contaminated state --- a pad that "should" be dark
   reads as lit for reasons unrelated to whatever you're currently
   testing. Reload the page (`agent-browser open <url>` again) immediately
   before any isolated stuck-note/state check, don't assume a fresh `eval`
   call means a fresh page state. Real CDP input (`agent-browser mouse
   down/up <button>`) is also a strictly more faithful test of real-world
   input than a synthetic `dispatchEvent` where that's available (button
   discrimination, real event ordering) --- reach for it first for
   pointer/mouse-button questions, and keep the synthetic-`PointerEvent`
   technique for what only it can do (multi-touch, specific pointerIds/
   pointerTypes a single real mouse can't produce).
3. Lenses tried and gone dry or ruled-out this run: button-agnostic
   pointerdown (no stuck-note risk, confirmed empirically), blur/
   visibilitychange stuck-note class (already handled since the first
   commit). Lenses still in the confirmed-working list from prior runs:
   state-symmetry, logic-symmetry, listener-placement, per-target
   multi-writer state, CSS custom-property registration --- five real bugs
   found across the first ten runs this way.
4. 72.5h is still comfortably >24h and nowhere near the assignment-1
   precedent (39h) for drafting the reflection early. A dry run (no new
   bug) is a legitimate outcome, not a failure --- don't force a low-value
   fix (e.g. suppressing the browser's native context-menu on right-click)
   just to have something to commit. Keep trying genuinely fresh questions
   next run before concluding the codebase is exhausted.
5. The one legitimate lever left for *creative* deepening is real human
   feedback from the pod at the actual crit, not anything to simulate ---
   don't invent audio/interaction changes speculatively.
6. `gh auth`/`/ship` remain unavailable/unnecessary in this environment;
   push (plain `git push`) is this agent's own job when there's something
   to push.
