# Process overview

## What I built

Aurora Keys: eight glowing pads across a pentatonic scale, played with a
mouse, a touchscreen, or the keyboard. Web Audio synthesises every note live
(triangle plus a quiet detuned-octave shimmer, through a lowpass, into a
synthesised reverb) — nothing is a recording. Because the scale is
pentatonic, any combination a stranger presses sounds intentional; there's
nothing to get wrong.

## The moments that mattered

**One instrument, three inputs, one shared knob.** The brief asks for mouse,
touch, and keyboard to each feel native, not for one to be a fallback for the
others. Pointer/touch drag a virtual cursor across the row (a glissando, via
`pointermove` re-hit-testing rather than pointer capture, so a slide can leave
the pad it started on) and vertically within a pad (brightness); a held key
swells the same brightness knob over about a second instead. Both land on the
identical `Voice.setLevel()` call, so "press harder" and "hold longer" are the
same gesture in different currencies
([`69812d7`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-dachi/commit/69812d7)).

**Checks that can't see the instrument.** `spec/*.test.ts` parses the built
`index.html` with jsdom — no `AudioContext`, no pointer events, so it can only
assert the static shell (`#stage`, `#hint`, a module script) exists, not that
the instrument plays. That gap is real, not a shortcut: playability got
verified instead with `agent-browser` — a real click, a real keydown, a real
a11y audit, reduced-motion and 390×844/1920×1080 screenshots — and the two
non-obvious stack facts that cost time along the way (Vite's bundle name, and
`tsc`'s null-narrowing not crossing function boundaries) went into
`CLAUDE.md` rather than getting re-discovered next run
([`c0b08ad`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-dachi/commit/c0b08ad)).

**Two bugs a screenshot would never catch.** Every browser-level sensor
(a11y, keyboard, resize, reduced-motion, both marking viewports, multi-touch
chording) came back clean, so the next question was whether the pointer and
keyboard *logic itself* agreed with what it claimed to do. It didn't, twice.
First, `pointermove`'s hit-testing deleted a pointer's tracking outright the
moment a drag crossed the CSS `gap` between pads, so a drag that dipped into
the gap and came back onto a pad never resumed sound — undercutting the
"single drag plays a run" behaviour the code's own comment claimed. Caught
and fixed by dispatching synthetic `PointerEvent`s at the gap's exact
midpoint via `agent-browser eval` and reading `--level` back at each step
([`25d70fd`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-dachi/commit/25d70fd)).
Second, `sustainKey`'s rAF loop checked only whether its key was still
"active" — a bare string, not a token unique to the press that started the
loop — so a fast release-and-repress left a stale loop running forever
alongside the fresh one, climbing toward a saturated level every frame. This
one was invisible to a before/after read of the final DOM value, because rAF
callbacks fire in registration order and the newer loop's write always
lands last within a shared frame; it only became visible by monkey-patching
`pad.style.setProperty` to log every write with a timestamp, which showed
two competing writes a fraction of a millisecond apart. Fixed with a
per-press token, the same role `pluckCounter` already played for reused
pluck ids elsewhere in the file
([`bcd5cf6`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-dachi/commit/bcd5cf6)).
A later pass checked whether `pluckCounter`'s own pattern shared the same
staleness risk and confirmed it doesn't: each pluck is a fixed 220ms
`setTimeout` closing over its own voice directly, not a loop re-reading
shared mutable state to decide whether to keep going.

**A third bug, this time about where a listener lives rather than what it
does.** With every browser sensor still green and the pointer/keyboard logic
itself re-read fresh, the next question was where `pointermove`/`pointerup`/
`pointercancel` were attached: `#stage`, deliberately without pointer
capture. Without capture, a bubbled event only reaches a listener if the
pointer is over that element's subtree — and `#stage` is a small region with
a header and page margins all around it, so a real drag routinely leaves it.
Releasing the mouse or finger out there never fired `endPointerGesture`: the
voice kept sounding and the pad stayed lit with no way to stop it short of
reloading. Confirmed by dispatching a synthetic `PointerEvent` drag from a
pad to a point over the header, well outside `#stage`'s bounding rect, and
reading `--level` back — it stayed at its pressed value indefinitely. Fixed
by moving the three listeners to `window`, which is always in the bubble
path regardless of where the pointer ends up; `pointerdown` stays on `stage`
since a gesture still has to start on a pad
([`51e7184`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-dachi/commit/51e7184)).

**A fourth bug, found by asking what happens when two voices share one pad.**
`activeVoices` is keyed by a per-input-source id (`pointer:<id>`, `key:<char>`,
`pluck:<index>:<n>`), which deliberately lets a held key and a pointer, or two
touches, sound on the *same* pad at once — but each pad's `--level` was one
shared CSS custom property, written unconditionally by whichever voice acted
last. Releasing one voice zeroed the pad's glow even while a sibling voice on
that same pad kept sounding, and nothing corrected it until the surviving
voice happened to move. Confirmed by dispatching two synthetic `PointerEvent`s
with distinct `pointerId`s onto the same pad, releasing one, and reading
`--level` back while the other stayed down and kept answering `pointermove`
correctly. Fixed by tracking each voice's own level per pad and displaying the
loudest still-active one, rather than a single write-wins value
([`59f7ae4`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit4-dachi/commit/59f7ae4)).
