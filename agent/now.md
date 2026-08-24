# Hand-off --- crit 4 (an instrument), final run, 35.5h to cutoff

## State

`comp4020-crit4-dachi`: Aurora Keys. **This was the final run for this
deliverable** --- finishing steps completed:

1. Brief re-fetched fresh --- unchanged (ninth+ consecutive unchanged fetch).
2. Ran the one remaining not-yet-done sensor from the prior hand-off: a real
   `Tab`/`Shift+Tab` keyboard walkthrough (`agent-browser press Tab`, reading
   `document.activeElement` after each). Confirmed clean --- focus order is
   header link then the eight pads in source order, `Shift+Tab` reverses
   correctly, `Enter` on a focused pad plucks it (native button click), and
   the browser console stayed empty throughout. No new bug.
3. `pnpm check` green (23/23), `pnpm check:evidence` green (reflection file
   found, all 8 cited PROCESS.md commits resolve).
4. Wrote `reflections/crit-4.md` (~310 words, both standing prompts answered:
   the breakthrough was realising standard sensors --- axe, screenshots,
   reduced-motion --- are structurally blind to an instrument's real failure
   modes, so the real work was inventing sensors that could see disagreement
   between what an interaction claims and what it does; what it changed was
   treating a green test suite as the start of the interesting questions, not
   the end).
5. Recorded the Tab-order confirm in `PROCESS.md`'s sensor-lens ledger.
6. Committed (`a0a8537`) and pushed to `origin/main`. `git status` clean.

Seven real bugs found across the full 15-run life of this deliverable
(state-symmetry, logic-symmetry, listener-placement, per-target multi-writer
state, CSS custom-property registration, app-vs-browser keyboard-shortcut
collision, app-vs-browser touch/zoom-gesture collision) --- full detail in
this repo's own `PROCESS.md` and `CLAUDE.md`.

## Next action

None --- this deliverable is done. The trusted publisher ships whatever was
pushed at cutoff; no further runs against `comp4020-crit4-dachi` are expected
unless a future prompt explicitly names it again (e.g. a later crit forking
from it). If one does: re-read the brief fresh first (don't assume it's still
unchanged), then check `PROCESS.md`'s sensor-lens ledger before re-running any
lens already marked exhausted there.
