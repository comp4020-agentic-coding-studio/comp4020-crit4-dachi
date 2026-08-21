# Hand-off --- crit 4 (an instrument), eighth run, ~96.5h to cutoff

## State

`comp4020-crit4-dachi`: Aurora Keys. Brief re-fetched fresh --- unchanged
again (same spec, same building blocks, cold-open crit format, still no
scoring/fail-state).

This run did not just verify-and-stop despite the seventh run's "sensors
exhausted" conclusion. Re-read `main.ts` fresh (not re-run any prior browser
sensor) and found a third real bug in the pointer-input area, distinct in
kind from the two found on the sixth run: `pointermove`/`pointerup`/
`pointercancel` were listening on `#stage`, and since the app deliberately
skips pointer capture (to let a drag retarget across pads), a bubbled event
only reaches a listener if the pointer is over that element's subtree.
`#stage` is a small region (`height: min(48vh, 26rem)`) with a header and
page margins all around it, so a real drag routinely leaves it entirely ---
and releasing the mouse/finger out there never fired `endPointerGesture`,
leaving the voice sounding and the pad lit forever with no recovery short of
reload. Confirmed live with a synthetic `PointerEvent` drag from a pad to a
point over the header (`--level` stayed at its pressed value indefinitely),
fixed by moving the three listeners to `window` (always in the bubble path;
`pointerdown` stays on `stage` since a gesture still has to start on a pad),
then re-confirmed the two previously-fixed behaviours (gap-crossing resume,
independent multi-touch chording) still work with listeners on `window`.
`pnpm check` green (23/23) throughout. Committed as three commits (fix,
`CLAUDE.md`, `PROCESS.md`) and pushed --- branch was 3 commits ahead of
origin before this run (prior runs' memory-tick commits hadn't been pushed
yet either); confirmed plain `git push` works fine in this environment even
though `gh auth`/`/ship` don't.

## Next action

1. Always re-check the brief first.
2. The lesson from this run: "every browser-level sensor came back clean"
   and "the pointer/keyboard logic agrees with its own claims" are *both*
   necessary but neither is sufficient --- this bug lived in neither
   category (not a UI-state check, not a same-function logic error) but in
   *where a listener is attached* relative to an element's real, page-context
   footprint. When the next asymmetry pass runs dry on state-symmetry and
   logic-symmetry questions, try a listener-placement question instead: for
   every event listener attached to a specific element rather than
   `window`/`document`, does the interaction it's part of ever legitimately
   move the pointer/focus/etc. outside that element's bounds while the
   gesture is still "live"? If yes, and there's no capture/window fallback,
   that's the shape to check.
3. Push landed this run; if a future run finds `git status`/`git log` show
   local commits origin doesn't have, plain `git push` is confirmed to work
   in this environment --- don't wait for a hypothetical `/ship` step.
4. 96.5h is ~57% of the 168h window remaining --- still short of the
   assignment-1 precedent (39h left) for drafting the reflection early, and
   this run's find means sensors were *not* actually exhausted, so don't
   treat "sensors exhausted" as settled without trying a genuinely new lens
   first.
5. The one legitimate lever left for *creative* deepening is real human
   feedback from the pod at the actual crit, not anything to simulate ---
   don't invent audio/interaction changes speculatively.
