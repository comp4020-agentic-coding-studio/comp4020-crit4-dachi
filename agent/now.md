# Hand-off --- crit 4 (an instrument), fourth run, ~131.5h to cutoff

## State

`comp4020-crit4-dachi`: Aurora Keys was `pnpm check` green and pushed at the
start of this run, exactly matching the prior hand-off. Brief re-fetched fresh
from `crits/04-instrument.json` --- unchanged again.

This run did the keyboard-path asymmetry pass the last hand-off named as the
one genuinely open thread, and found a real bug, not a confirm:

1. **`sustainKey`'s rAF loop can outlive the press that started it.** Its
   only exit check is `activeKeys.has(key)` / `activeVoices.has(voiceId)`,
   both keyed by the bare key string. Release a key and re-press it before
   the old loop happens to observe the key as briefly absent (trivially easy
   with fast, drum-like re-triggering, which this instrument explicitly
   invites) and the old loop never sees a false condition --- it runs
   forever alongside the new one, computing an ever-growing stale elapsed
   time that saturates and calls `Voice.setLevel` every frame.
2. **This was invisible to a plain before/after `--level` read** --- rAF
   callbacks fire in registration order, and the old loop always
   re-registers itself before the new one within a shared frame, so the new
   (correct) write always lands last and wins visibly. Had to monkey-patch
   `pad.style.setProperty` via `agent-browser eval` to log every `--level`
   write with a timestamp; after a release-and-immediate-re-press the log
   showed paired writes a fraction of a millisecond apart (one climbing
   toward a stale saturated value, one on the correct fresh ramp) ---
   confirming two concurrent loops where a periodic sample of just the
   final DOM value showed nothing wrong.
3. Fix: a per-press token (`keyPressToken`, bumped every keydown) that the
   loop checks against before rescheduling --- the same disambiguation role
   `pluckCounter` already plays for reused pluck voice ids elsewhere in the
   file. Re-ran the identical monkey-patched reproduction after the fix:
   exactly one write per frame after the re-press, no stale pair. Pushed as
   two commits (`bcd5cf6` fix, `19c6843` CLAUDE.md writeup).
4. `pnpm check` stayed 23/23 green throughout (same as the pointer bug last
   run: this is runtime pointer/keyboard logic no jsdom spec test can see).

`pnpm check` green (23/23 + typecheck + build). Working tree clean, pushed.
`pnpm check:evidence` still fails on exactly one thing: no
`reflections/crit-4.md` yet --- still correct this early (131.5h out,
comfortably >24h).

## Next action

Both threads the last two hand-offs opened (pointer-drag-through-gap,
keyboard sustain-loop staleness) are now closed, each by the same method:
read the code fresh for an asymmetry, then live-verify with a targeted
synthetic-event technique before touching source, then again after the fix.

1. Always re-check the brief first, even though it keeps not changing.
2. Sensors now exhausted at least once: a11y, keyboard, resize,
   reduced-motion, both marking viewports, multi-touch chording, tab-blur
   silencing, pointer-drag-through-gap, and now keyboard sustain-loop
   staleness. Don't re-run any of these identically --- only re-run one if
   a future *code* change actually touches that area.
3. No further specific asymmetry thread is currently flagged. A future run
   should do one more fresh read of `main.ts` end to end looking for a new
   angle (candidates not yet checked: does `pluckCounter`'s reused-voiceId
   pattern have the same staleness shape as the fix just applied, given it
   never called with a check against anything --- but a pluck is a fixed
   220ms `setTimeout`, not a conditional rAF loop, so it may simply not be
   exposed the same way; worth confirming rather than assuming). If that
   pass also turns up only a confirm, that's the signal --- per the last two
   hand-offs' own prediction --- to draft `reflections/crit-4.md` (150--300
   words, the two standing prompts: the breakthrough, and what it changed
   about the developer I want to be) and `PROCESS.md`'s update, not before.
4. `gh auth` and `/ship` remain unavailable in this environment (not
   re-checked this run; no reason to expect it changed). Pushing the clean
   tree is the whole of my part.
