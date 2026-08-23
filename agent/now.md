# Hand-off --- crit 4 (an instrument), fourteenth run, 48.5h to cutoff

## State

`comp4020-crit4-dachi`: Aurora Keys. Brief re-fetched fresh --- unchanged
again. Found and fixed a **seventh real bug**, pushed to `origin/main`
(`f0f837f..4e9f492`). `pnpm check` green (23/23) after the fix. `git status`
clean.

The thirteenth run's hand-off flagged five independently-dry lenses (state/
logic-symmetry, listener-placement, Shift+letter, DOM/ARIA snapshot,
performance) and asked for a genuinely new question rather than a fourth+
re-confirm of any of those. Found one: **does the page unnecessarily disable
a browser-native accessibility feature (pinch-zoom) beyond what the
interaction actually needs?**

`styles.css` had `touch-action: none` on `body` --- added so a drag across
the pads wouldn't also trigger page scroll/zoom. `touch-action` isn't
inherited the normal CSS way: its real effect on a touch is the
*intersection* of the touched element's value with every ancestor's value,
resolved by the browser's gesture recognizer, not something
`getComputedStyle` on a descendant reveals (every child still read back
`auto`, both before and after the bug --- this is why it evaded every prior
`getComputedStyle`-based check). Because `body` wraps the whole page, that
one declaration silently killed pinch-zoom everywhere --- the header link,
the hint text, all of it --- not just over the instrument, and axe-core's
`meta-viewport` rule never caught it since it only checks the viewport
`<meta>` tag, not CSS `touch-action`. Confirmed via `getComputedStyle(el)
.touchAction` on `body`/`header a` before and after (`none` → `auto`), plus
a synthetic two-pointer drag across two pads afterwards proving the stage's
own drag-without-page-scroll behaviour was unaffected. Fixed by moving the
declaration from `body` to `.stage` alone. Documented in this repo's own
`CLAUDE.md` and `PROCESS.md` (new "Sensor-lens ledger" section there
summarising all seven bugs by which question found them).

## Next action

1. Always re-check the brief first.
2. Seven real bugs found across fourteen runs now, each via a distinct
   question: state-symmetry, logic-symmetry, listener-placement, per-target
   multi-writer state, CSS custom-property registration, app-vs-browser
   keyboard-shortcut collision, and (this run) app-vs-browser touch/zoom-
   gesture collision. Lenses tried and gone dry: button-agnostic
   pointerdown, blur/visibilitychange cleanup, Shift+letter, DOM/ARIA
   accessibility-tree read, Navigation Timing performance.
3. The pattern across bugs 6 and 7 --- "does the page fight the browser's
   own input/gesture handling, in a way a static audit tool (axe) doesn't
   check" --- may not be exhausted yet. Worth asking once more before
   assuming it's dry too: e.g. does anything else on the page override a
   browser default a stranger would expect (right-click context menu,
   double-tap-to-zoom on a specific element, drag-and-drop of an image/
   text selection inside the stage, `user-select` on pad text)? Checked
   right-click already (fine, prior run). Haven't specifically checked
   text-selection/drag-of-content within `.pad`/`.pad__key`.
4. `reflections/crit-4.md` correctly not yet written --- 48.5h is not yet
   inside the 24h "finish" window, and a fresh bug this run means the story
   still has road left to run before it's worth locking in.
5. The one legitimate lever for *creative* deepening remains real human
   feedback from the pod at the actual crit, not anything to simulate ---
   still true, still not the move to make solo.
6. `gh auth`/`/ship` remain unavailable/unnecessary in this environment.
   This run's fix was pushed directly with `git push origin main`.
