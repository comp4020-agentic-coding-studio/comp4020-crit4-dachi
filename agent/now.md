# Hand-off --- crit 4 (an instrument), thirteenth run, 59.5h to cutoff

## State

`comp4020-crit4-dachi`: Aurora Keys. Brief re-fetched fresh --- unchanged
again (same spec, same building blocks, cold-open crit format, still no
scoring/fail-state). `git status` clean, HEAD still `4ed5603` (previous
run's `cffadfd` fix already on `origin/main`; the `4ed5603` snapshot commit
sits on top). No code changed this run.

This run closed out the two open questions the twelfth run's hand-off left,
plus tried one genuinely new sensor family. All three came back clean --- a
legitimate dry run, not a gap in effort:

1. **Shift+letter, precisely confirmed.** `Shift+F` really does produce
   `event.key === "F"`; `.toLowerCase()` folds it back to a scale key, the
   handler plays a note and calls `preventDefault()`. But Shift+letter alone
   isn't a live OS/browser shortcut the way Ctrl/Cmd/Alt+letter is (checked
   via real CDP `agent-browser press Shift+F`, not synthetic dispatch), so
   this is fine as-is --- no fix needed, matches the hand-off's own guess.
2. **A fresh DOM/ARIA-behaviour read**, distinct from axe's static-markup
   audit: pulled the real accessibility tree (`agent-browser snapshot -i
   --json`) and confirmed all eight pads expose as `button "play <note>"`
   with no stray nodes, and confirmed the focus-visible outline
   (`.pad:focus-visible { outline: 3px solid #fff }`) is real and clearly
   visible in a screenshot after `Tab`. Considered and rejected two
   speculative "gaps" as non-bugs: no `aria-live` announcement per note
   (would be intrusive chatter over an instrument meant to be heard, not
   narrated) and no `aria-pressed` toggle (momentary plucks don't map to a
   toggle state cleanly). Also reasoned through screen-reader browse-mode
   quick-nav keys (NVDA's bare `h`/`b`/`f` etc. collide with this scale's
   own letters) but concluded it isn't a blocking bug: Tab+Enter/Space
   already gives full keyboard operability independent of the letter
   shortcuts, which are a sighted/mouse-first enhancement, not the only
   path.
3. **Performance, checked for the first time on this repo** (assignment 1
   got this sensor, crit 4 hadn't yet): served `dist/` on a plain
   `python3 -m http.server`, read real Navigation Timing --- `domComplete`
   at ~15ms, JS+CSS bundle 6.24kB/2.39kB (gzip 2.54kB/1.14kB per the Vite
   build output). Comfortably clears any realistic slow-connection bar by
   size alone; no work needed here, same reasoning as assignment 1's
   equivalent check.

`pnpm check` reconfirmed green (23/23) at the top of the run before any of
the above.

## Next action

1. Always re-check the brief first.
2. Six real bugs found across thirteen runs (state-symmetry, logic-symmetry,
   listener-placement, per-target multi-writer state, CSS custom-property
   registration, app-vs-browser shortcut collision). Lenses now tried and
   gone dry: button-agnostic pointerdown, blur/visibilitychange stuck-note
   class, Shift+letter, DOM/ARIA accessibility-tree read, performance/
   Navigation Timing. That's a lot of independently-dry sensors stacking up
   --- worth noticing if the next run or two also comes back empty.
3. Nothing left on the "not yet tried" list from prior hand-offs. If a
   fourteenth run starts here, don't just re-run the same five dry lenses
   again for a fourth+ confirm each --- either find a genuinely new question
   (the six-bug track record suggests there may be one; past examples were
   "does it agree with itself," "does it agree with the browser/OS," "does
   it agree with the DOM/ARIA it claims," so a fourth axis is plausible but
   hasn't been found yet) or accept the well may be closer to actually dry
   than at any prior checkpoint and shift toward `PROCESS.md`/reflections
   prep once the clock genuinely warrants it.
4. The one legitimate lever left for *creative* deepening is real human
   feedback from the pod at the actual crit, not anything to simulate ---
   don't invent audio/interaction changes speculatively. This has been true
   for several runs running; still true.
5. `reflections/crit-4.md` correctly not yet written --- that's a
   final-run finishing step per doctrine, and 59.5h is not yet inside the
   24h "finish" window.
6. `gh auth`/`/ship` remain unavailable/unnecessary in this environment.
   Nothing to push this run (no commits made).
