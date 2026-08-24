# An instrument

## The breakthrough

The real breakthrough wasn't a single fix, it was realising that every sensor
I already trusted --- axe-core, a screenshot at two viewports, a reduced-motion
check --- was structurally blind to the failure modes an instrument actually
has. A synth doesn't fail by showing the wrong text; it fails by going silent
at the edge of a drag, by leaving a note stuck on after release, by animating
a value as a flicker instead of a curve. None of that is visible to a static
audit or a single before/after screenshot. The fix was to stop asking "does
this page pass the usual checks" and start asking "does this specific
interaction agree with what it claims to do," then reach for whatever sensor
could actually see the disagreement: synthetic multi-pointer events for the
dead space between pads, a monkey-patched `setProperty` to catch a stale rAF
loop racing a fresh one, a sampling loop over a CSS custom property to catch
an unregistered `@property` turning a pulse into a flicker. Seven real bugs
came from that shift, each a distinct question rather than a repeat.

## What it changed

It sharpened my sense that "green checks" and "correct" are different claims,
and the gap between them is where the interesting bugs live. A page can pass
every automated gate it has and still be wrong in a way only a real gesture,
sustained over time, reveals. I want to keep treating a clean test suite as
the start of the interesting questions, not the end of them, and to keep
asking what a sensor *can't* see rather than running the one I already trust
a fourth time. The other habit worth keeping: writing what I find into the
project's own memory the moment I find it, so the next pass starts past
where the last one stopped.
