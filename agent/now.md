# Hand-off --- crit 4 (an instrument), twelfth run, 65.5h to cutoff

## State

`comp4020-crit4-dachi`: Aurora Keys. Brief re-fetched fresh --- unchanged
again (same spec, same building blocks, cold-open crit format, still no
scoring/fail-state).

This run tried a fresh lens after the eleventh run's dry pass: not "does the
instrument's own logic agree with itself" (five bugs found that way already)
but "does it agree with the browser and OS around it." Found and fixed a
sixth real bug: the keydown handler plays a note and unconditionally
`preventDefault()`s for any of the eight scale letters (`a s d f g h j k`)
with no check on `ctrlKey`/`metaKey`/`altKey`. `event.key` for a letter is
unchanged by those modifiers, so `Ctrl+F` (find), `Ctrl+A` (select all),
`Ctrl+S` (save), `Cmd+D` (bookmark), `Ctrl+H`, `Ctrl+J`, `Ctrl+K`, `Ctrl+G`
all matched a scale key, ate the real browser shortcut, and played an
unrequested note. Confirmed live with a real CDP `agent-browser press
Control+f` (not synthetic dispatch --- needed genuine shortcut arbitration):
`defaultPrevented` came back `true` and the hint went quiet before the fix,
`false` and silent after. Fix: one guard
(`if (event.ctrlKey || event.metaKey || event.altKey) return;`) ahead of the
scale-key lookup in `main.ts`. Re-confirmed a bare `f` still plays.
`pnpm check` green (23/23), a11y re-audit clean (0 violations, same two
known `incomplete` shapes as always). Committed as three commits (fix,
CLAUDE.md, PROCESS.md) and pushed --- `cffadfd` is HEAD on `origin/main`.

## Next action

1. Always re-check the brief first.
2. Lenses confirmed to find real bugs across twelve runs: state-symmetry,
   logic-symmetry, listener-placement, per-target multi-writer state, CSS
   custom-property registration, and now app-vs-browser shortcut collision
   --- six real bugs total. Lenses tried and gone dry: button-agnostic
   pointerdown, blur/visibilitychange stuck-note class.
3. Not yet tried, worth a look next run if this codebase keeps yielding:
   whether Shift+letter (which does change `event.key`, e.g. Shift+f is
   still "f" since these are lowercase letters already --- actually check
   this precisely, Shift+a on a US layout still gives event.key "A" not
   "a", and the handler does `.toLowerCase()`, so Shift+scale-letter still
   plays a note; is that a problem? Shift+letter isn't a live OS/browser
   shortcut on its own the way Ctrl/Cmd/Alt are, so probably fine, but
   worth a two-minute confirm rather than assuming). Also not yet checked:
   whether holding a scale key down while the OS IME/dead-key composition
   is active does anything unexpected (very likely irrelevant for ASCII
   letter keys, low priority).
4. 65.5h is still comfortably >24h. A dry run is a legitimate outcome; this
   run wasn't dry. Keep trying genuinely fresh questions before concluding
   the codebase is exhausted --- "does it agree with itself" and "does it
   agree with its environment" are two different question families, and
   there may be a third (e.g. "does it agree with what the DOM/ARIA claims
   about it" was partly covered by a11y audits already, but a fresh
   screen-reader-behaviour read, not just axe's static-markup check, has
   never been done here).
5. The one legitimate lever left for *creative* deepening is real human
   feedback from the pod at the actual crit, not anything to simulate ---
   don't invent audio/interaction changes speculatively.
6. `gh auth`/`/ship` remain unavailable/unnecessary in this environment;
   push (plain `git push`) is this agent's own job when there's something
   to push --- done this run.
