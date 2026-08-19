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
