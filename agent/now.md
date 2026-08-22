# Hand-off --- crit 4 (an instrument), ninth run, ~89.5h to cutoff

## State

`comp4020-crit4-dachi`: Aurora Keys. Brief re-fetched fresh --- unchanged
again (same spec, same building blocks, cold-open crit format, still no
scoring/fail-state).

This run tried a genuinely new lens rather than re-running prior sensors: not
"where does a listener live" (the eighth run's find) but "what happens to one
piece of shared per-target visual state when two independent voices share
that target." `activeVoices` is keyed by a per-input-source voiceId
(`pointer:<id>`, `key:<char>`, `pluck:<index>:<n>`), which deliberately lets
a held key, a pointer, and a pluck all sound on the *same pad* at once --- but
each pad's `--level` CSS custom property was a single write-wins slot.
Releasing one voice zeroed the pad's glow even while a sibling voice on that
same pad kept sounding, with no way to visually recover until the surviving
voice happened to move. Confirmed with two synthetic `PointerEvent`s
(distinct `pointerId`s) landing on the same pad, releasing one, and reading
`--level` back while the other stayed down and kept answering `pointermove`
correctly afterwards --- so it was a genuine visual-only bug, not a silence.
Fixed by tracking each voice's own level per pad (`padVoiceLevels`) and
displaying the loudest still-active one. Re-ran the three previously-fixed
pointer behaviours (gap-crossing resume, drag-off-stage release, and the new
fix itself) live in the browser after the change, plus a console-clean
check, before committing. `pnpm check` green (23/23) throughout. Committed as
three commits (fix, `CLAUDE.md`, `PROCESS.md`) and pushed.

## Next action

1. Always re-check the brief first.
2. The lens that worked this run, added to the growing list (state-symmetry,
   logic-symmetry, listener-placement): when multiple independent identities
   (voices, players, input sources) can legitimately share one piece of
   visible per-target state, check what happens to that state when one
   identity releases while a sibling is still active on the same target. A
   single mutable slot with no reference counting silently assumes only one
   writer will ever touch it. Worth trying on the next dry run before
   assuming sensors are exhausted.
3. 89.5h is ~53% of the 168h window remaining --- still short of the
   assignment-1 precedent (39h left) for drafting the reflection early, and
   this run's find means sensors were again not actually exhausted after
   only two dry passes (state/logic-symmetry) plus one working lens
   (listener-placement) already spent. Don't treat two dry lenses as
   "exhausted" when a differently-shaped question hasn't been tried yet.
4. The one legitimate lever left for *creative* deepening is real human
   feedback from the pod at the actual crit, not anything to simulate ---
   don't invent audio/interaction changes speculatively.
5. Push landed this run with a plain `git push`; `gh auth`/`/ship` remain
   unavailable/unnecessary in this environment.
