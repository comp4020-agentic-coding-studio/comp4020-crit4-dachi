# MEMORY

Durable self-knowledge, curated run by run; ephemeral state belongs in
`now.md`, not here.

## Environment

- `mise` refuses to run until its config is trusted in a fresh environment:
  `mise ERROR Config files in ~/.config/mise/config.local.toml are not
  trusted` blocks every `pnpm`/`mise exec` call. Fix once per environment
  with `mise trust /home/ben/.config/mise/config.local.toml` --- it only
  marks an existing file as trusted, doesn't change its content.
- `agent-browser` (installed to `~/.bun/bin/agent-browser`, real home)
  works well for the two-viewport check the course wants: `agent-browser
  set viewport 1920 1080` / `390 844`, then `open`/`screenshot`. Real
  evidence beats assuming the CSS does what you think. In a fresh
  environment Chrome isn't installed: run `agent-browser install` once
  (downloads Chrome for Testing), and pass `--args "--no-sandbox"` on
  every subsequent `agent-browser` invocation --- headless Chrome's
  zygote sandbox check fails otherwise (`No usable sandbox!`) and
  `--with-deps` isn't needed to fix it. Invoke it as the bare
  `agent-browser` (it's on `$PATH` via `~/.bun/bin`), never as a
  literal `~/.bun/bin/agent-browser` path --- the sandbox remaps `$HOME`
  to the agents dir, not the real home, so tilde-expansion resolves to
  a nonexistent file even though the real binary and `$PATH` entry are
  fine.
- `agent-browser a11y <url> --json` runs a real axe-core audit --- worth
  reaching for on every crit, since none of the course's own checks
  (`pnpm check`) test accessibility or performance; that's explicitly left
  as the student's own sensor to wire up. On crit 1 it caught three real
  WCAG AA contrast failures (a text/background color pair reused in
  opposite fg/bg roles elsewhere in the page, so the same numeric ratio
  failed twice) that looked fine by eye and passed every other check.
  `agent-browser set media reduced-motion` (or `dark`/`light`) similarly
  lets you check a `prefers-*` media query actually fires, by reading
  `getComputedStyle(el).animationName` (or similar) live rather than just
  trusting the CSS reads correctly.
- A 320 CSS px viewport (`agent-browser set viewport 320 690`) is a cheap,
  reusable WCAG 1.4.10 reflow check --- 320px is the standard equivalence
  for "400% zoom on a 1280px display," and it's a genuinely different
  sensor from the two marking viewports (390×844, 1920×1080) and from
  resizing between them, since neither of those ever renders the page
  this narrow. Check `document.documentElement.scrollWidth` stays equal
  to the viewport width (no horizontal overflow) both on load and after
  driving whatever the core interaction is, not just a static screenshot.
  First run on assignment 1 (clean; confirmed
  [`46dca1a`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-dachi/commit/46dca1a)),
  worth reaching for on any future deliverable once the standard sensors
  (a11y, keyboard, resize, walkthrough) stop turning up anything new.
- The sandbox pins cwd to the deliverable repo: `cd /tmp/whatever && ...`
  silently resets back to the repo root on the next command rather than
  erroring. Scratch experiments (a throwaway script, a temporary `pnpm add`
  to test a package) have to happen inside the tracked tree and be cleaned
  up (`rm` the file, verify `git status` clean) rather than off to one
  side in `/tmp`.
- axe-core's `color-contrast` rule needs real layout/paint to resolve
  computed foreground/background --- jsdom doesn't do either, so running
  axe-core against a jsdom-loaded `dist/*.html` (e.g. to make the a11y
  audit a repeatable `spec/*.test.ts` instead of a manual
  `agent-browser a11y` pass) silently can't catch the contrast failures
  that matter most; only `agent-browser`'s real headless Chrome can. Not
  worth wiring into vitest --- a green check that can't see the main
  failure mode is worse than no check.
- `agent-browser a11y`'s JSON separates `violations` (real WCAG failures)
  from `incomplete` (axe couldn't auto-resolve, not a failure). Two
  recurring `incomplete` `color-contrast` shapes are non-issues, not gaps
  to chase: (1) `aria-hidden="true"` decorative elements still get
  evaluated even though real screen readers never see them; (2) text over
  a CSS gradient background, where axe can't pick a single background
  colour. For (2), don't leave it unresolved --- compute the WCAG
  contrast ratio by hand against the gradient's actual stop colours (the
  formula is short enough to inline in a `python3 -c`) to confirm the
  worst case still clears AA before moving on.
- A third recurring `incomplete` shape, distinct from the two
  `color-contrast` ones above: `aria-prohibited-attr` on a plain `<div
  aria-labelledby="...">` with no role --- axe correctly treats
  `aria-labelledby` on a non-landmark, non-widget element as unreliably
  supported by screen readers even though it isn't a hard WCAG violation.
  Caught on assignment 1 across three divs (two grouped columns plus a
  panel, each labelled by an adjacent heading). Fix is cheap and durable:
  add `role="group"` (or another appropriate role) alongside
  `aria-labelledby` whenever labelling a `div`/`span` container by a
  heading id, rather than leaving it as an unresolved `incomplete`.
- `agent-browser` has no Lighthouse-equivalent command, but its `eval`
  reaches the real Navigation Timing API, which is enough of a
  performance sensor for a static site: serve the actual `dist/` build
  (`python3 -m http.server`), then `agent-browser eval
  "JSON.stringify(performance.getEntriesByType('navigation')[0])"` (add
  `getEntriesByType('resource')` for byte counts) per page. On crit 1,
  six no-JS pages with one shared stylesheet all loaded under 50ms at
  under 5KB transfer --- confirms there's no optimisation work needed
  rather than assuming it from the stack choice. Same "wire it yourself,
  nothing in `pnpm check` covers it" gap as accessibility above; only
  worth re-running once a page picks up real weight (images, more CSS).
- `agent-browser` has no bandwidth/latency-throttling command (checked
  `agent-browser skills get core --full`, grepped for "emulate"/"throttle"/
  "delay" --- only `set offline on/off` and `network route --abort/--body`,
  neither of which simulates a slow link). Assignment 1's artefact rubric
  names "a slow connection" as an HD-band use case alongside keyboard and
  resize, and the honest way to satisfy it without hand-rolling raw CDP
  `Network.emulateNetworkConditions` calls is the same Navigation Timing
  check above: if the built site's total transfer size is a few KB with no
  images/fonts, it clears any realistic throttle by size alone, so the
  check is "read the byte count," not "simulate the packet loss." Only
  reach for real CDP-level throttling if a future page's payload is large
  enough that byte count alone doesn't settle it.
- `agent-browser open <url>` printing "✓ <title>" is not reliable proof
  the DOM is actually there to screenshot or `eval` against a moment
  later --- against one flaky external host (ffmpeg.org, on crit 2) a
  reported success was followed by a same-session `eval
  "location.href"` reading `about:blank` on the very next command, and
  a screenshot taken right after a genuine load still came back blank.
  This was specific to one slow-handshake host, not a general
  `agent-browser` bug (against the site's own `dist/` build and
  ordinary external hosts, "success" has always meant success). But
  the failure mode --- trusting the success message instead of
  checking state --- generalises: before screenshotting anything just
  navigated to (especially an external, previously-flaky, or
  slow-loading host), confirm with a cheap `eval` (`location.href`,
  `document.readyState`) rather than assuming the open command's own
  report is sufficient.

- `agent-browser`'s CLI has no multi-touch input primitive --- `mouse`/`click`
  only ever drive one pointer, and the only real multi-touch path is the raw
  WebSocket streaming protocol's `input_touch` with a `touchPoints` array,
  which isn't exposed as a CLI command. For verifying an app's own
  multi-pointer bookkeeping (e.g. a `Map<pointerId, ...>` meant to track
  independent simultaneous touches), `agent-browser eval` can dispatch
  synthetic `PointerEvent`s with distinct `pointerId`s and
  `pointerType: 'touch'` directly at the target element, then read back
  whatever DOM/CSS side effect the app produces per pointer (a class, a CSS
  custom property) to confirm two pointers are tracked independently rather
  than one clobbering the other. This is a legitimate live check of the
  app's real event-handling code (not a jsdom mock) --- it only synthesises
  the one input primitive the CLI itself can't produce (a second
  simultaneous touch point), everything downstream of `dispatchEvent` is the
  real page. Confirmed working on crit 4's `comp4020-crit4-dachi`.
- The same synthetic-`PointerEvent`-via-`eval` technique above is also the
  right sensor for a logic-symmetry pass over pointer/drag code, not just
  multi-touch: on crit 4, reading `main.ts`'s `pointermove` handler fresh
  (a pass flagged as not-yet-done in two prior hand-offs) found a real bug
  a browser screenshot or an a11y/keyboard/resize sweep would never catch
  --- any interaction with designed-in dead space between adjacent targets
  (here, the stage's CSS `gap` between pads) needs its `pointermove` handler
  checked specifically at the boundary, not just on-target. The bug: "no
  target under the pointer" and "gesture ended" were conflated into one
  branch that deleted the pointer's tracking outright, so a drag that
  briefly crossed the gap never resumed on the far side without a fresh
  pointerdown, even with the button still held. Confirmed with the
  down-on-target/move-to-gap/move-to-next-target/read-back-state sequence
  before touching source, then re-ran the identical sequence after the fix
  to prove it. General lesson: dead space between drag targets (a gap, a
  border, an inset hit-area) is a distinct test case from "on-target" and
  "gesture ended," worth checking explicitly any time a pointer handler
  hit-tests by element-under-pointer rather than by capture.
- A third technique in the same family, needed when a bug's symptom is
  masked by write ordering rather than absent: on crit 4, a recurring rAF
  loop (a keyboard key's sustain ramp) had a stale, never-terminating
  duplicate spawned by fast release-and-re-press, but polling the DOM value
  it wrote showed nothing wrong, because the stale loop and the fresh one
  both wrote every frame and the fresh one's write always landed last
  (rAF callbacks fire in registration order; the older loop always
  re-registers itself before the newer one within a shared frame).
  Monkey-patching the target element's own `style.setProperty` via
  `agent-browser eval` (wrap it, log every call with a timestamp, call the
  original) surfaced the truth: paired writes a fraction of a millisecond
  apart right after the re-press, one stale-and-climbing, one correct.
  General lesson: when a suspected duplicate-writer bug could be
  self-masking because of a deterministic "last write wins" ordering,
  polling the final value is the wrong sensor --- intercept the write call
  itself (not just its eventual DOM/CSS result) to see every write, not
  just the one that happened to be visible after the fact. Root cause was a
  loop whose "keep going" check read shared mutable state (a key string)
  rather than a token stamped at the specific invocation's own start; the
  fix (a per-press generation counter the loop checks before rescheduling)
  is the same shape as `NONE_HIT` above --- give a piece of shared,
  reused-identity state a way to distinguish "still current" from "stale"
  instead of only checking presence/absence.
- A follow-up pass on crit 4 asked whether a sibling code path (`main.ts`'s
  pluck-on-click handler, which also reuses an index-keyed id via a
  `pluckCounter`) shared that same staleness risk, and confirmed it
  doesn't: a fixed-duration `setTimeout` whose closure captures its own
  specific voice/id directly is not exposed the same way a conditional
  rAF/interval loop is, because there's nothing to *re-check* against
  shared mutable state before deciding whether to continue --- it just
  fires once, unconditionally, for the exact voice it was given. The
  staleness bug class above needs both ingredients: a recurring
  reschedule, and an exit check that reads shared state instead of an
  invocation-specific token. One ingredient missing (here, no reschedule
  at all) means the pattern doesn't apply, and confirming that by reading
  the code is legitimate, not a wasted pass.
- A fourth technique in the same family, found only after both the
  state-symmetry and logic-symmetry lenses above had gone dry twice on
  crit 4: ask where a listener is *attached*, not just what it does. An
  interaction that deliberately skips pointer/mouse capture (to let a drag
  retarget across sibling elements, as `NONE_HIT` above enables) needs its
  release/cancel listeners on `window`/`document`, not the interactive
  element itself --- without capture, a bubbled event only reaches a
  listener if the pointer is currently over that element's subtree, so
  releasing outside the element's bounds (trivial when the element is a
  small region with page chrome around it, not the full viewport) never
  fires anything, leaving whatever "gesture ended" cleanup was meant to run
  never running. Confirmed with the same synthetic-`PointerEvent`-via-`eval`
  technique above: drag from the target onto a page element well outside
  its bounding rect, release there, read back whatever state the release
  handler was meant to reset. General lesson: whenever code explicitly
  chooses not to use pointer/mouse capture, check every listener meant to
  observe "gesture ended" (up, cancel, and to a lesser extent leave/out) is
  bound to a target guaranteed to receive the event regardless of where the
  pointer physically ends up --- `pointerdown`/`start` can stay scoped to
  the interactive element since a gesture still has to originate there, but
  `up`/`cancel` can't.
- A fifth technique in the same family, found on crit 4's ninth run after the
  listener-placement lens above had already found and fixed its one bug and
  gone dry on a repeat pass: ask what happens to one piece of shared
  per-target visual state when two independent identities (voices, players,
  input sources) legitimately act on the same target at once. Aurora Keys
  keys its active voices by a per-input-source id (`pointer:<pointerId>`,
  `key:<char>`, `pluck:<index>:<n>`), which deliberately lets a held key and
  a pointer, or two touches, sound on the *same pad* simultaneously --- but
  each pad's `--level` CSS custom property was one write-wins slot, set
  unconditionally by whichever voice pressed, moved, or released last.
  Releasing one voice zeroed the pad's glow even while a sibling voice on
  that same pad kept sounding, invisible until the surviving voice happened
  to move. Confirmed with two synthetic `PointerEvent`s (distinct
  `pointerId`s) landing on one pad, releasing one, and reading `--level`
  back while the other stayed down and kept answering `pointermove`
  correctly afterwards --- proving the dark pad was a pure visual bug, not
  a dropped voice. Fixed by tracking each voice's own level per target and
  displaying an aggregate (here, the loudest still-active one) instead of a
  single mutable slot. General lesson: a state-symmetry pass usually asks
  "do this function's own tests/branches agree with each other"; this is
  the multi-writer variant --- whenever an id scheme is deliberately widened
  to let several independent things act on one shared target (a namespaced
  voiceId, a per-user cursor, a per-tab lock), check every place that target
  has a single piece of mutable state written by more than one of those
  ids, and ask what the last writer clobbers when it isn't the only one
  still active.
- A sixth technique in the same family, found on crit 4's tenth run after two
  prior JS/state-symmetry lenses had gone dry: when browser-level and
  logic-level sensors both stop finding anything in the script, move the same
  "does this actually do what it visually claims" question into the
  stylesheet, specifically animated CSS custom properties. A `@keyframes`
  block that sets a custom property (e.g. `--level: 0.22` at 50%) only
  interpolates smoothly if that property is registered via `@property` with a
  numeric `syntax`; unregistered, the browser treats it as an opaque token and
  the animation becomes a discrete flip partway through each keyframe
  interval instead of a tween. This is invisible to a single screenshot
  (both endpoint values look plausible alone) and to a11y/reduced-motion
  checks (neither samples a value's shape over time) --- the only sensor that
  catches it is polling `getComputedStyle(el).getPropertyValue('--x')` every
  ~100ms across a full animation cycle via `agent-browser eval` and checking
  for intermediate values, not just the two extremes. Confirmed on Aurora
  Keys' idle "breathing" pulse (flat `0`/`.22` toggle, no values between),
  fixed with `@property --level { syntax: "<number>"; inherits: false;
  initial-value: 0; }`, re-confirmed with a continuous curve after. General
  lesson: whenever a stylesheet animates a custom property directly with
  `@keyframes` (not just reads it inside a `calc()` that some other
  transitioning property depends on), check it's `@property`-registered ---
  otherwise "animate" silently means "toggle," and a computed-value time
  series is the only sensor built for this codebase's other checks that can
  actually see it.
- A methodology caution, not a new technique: the synthetic-`PointerEvent`-
  via-`eval` family above is only trustworthy against a page state you know
  is clean. On crit 4's eleventh run, testing whether a right mouse-click
  (pointerdown fires for any button, not just the primary one, since the
  app never checks `event.button`) leaves a stuck note looked like a real
  bug on the first attempt --- the pad stayed lit after mouse-up --- but
  that was contamination from an earlier, separate `eval` in the *same*
  page session that had dispatched a synthetic `PointerEvent` and never
  sent a matching up/cancel for it; the lit pad was that orphaned voice,
  unrelated to the right-click under test. Reloading the page
  (`agent-browser open <url>` again) immediately before the isolated test
  gave the true (clean) result: right-click down/up correctly zeroed
  `--level`, no bug. General lesson: before trusting any "state looks
  wrong" reading from a multi-step `eval` investigation, ask whether an
  earlier step in the *same* session left an un-released synthetic event
  behind, and reload for a clean slate before the check that actually
  matters --- don't assume each `eval` call implies a fresh page. Separately,
  for plain pointer-button questions (as opposed to multi-touch, which
  needs synthetic events because the CLI can't drive two real pointers),
  a real CDP `agent-browser mouse down/up <button>` is a strictly more
  faithful sensor than `dispatchEvent`d `PointerEvent`s --- it exercises
  genuine browser event sourcing (button field, ordering) rather than
  values the test author chose by hand.
- A seventh technique, found on crit 4's twelfth run after the state-symmetry
  and logic-symmetry lenses had gone dry the previous run: when a codebase's
  own logic keeps confirming clean, stop asking "does it agree with itself"
  and ask "does it agree with the browser/OS environment around it." A
  keydown handler that matches on bare letter keys spanning most of a QWERTY
  row (here, `a s d f g h j k` as Aurora Keys' scale) and calls
  `preventDefault()` unconditionally is exactly the shape that silently
  hijacks real OS/browser shortcuts, because `event.key` for a letter is
  unchanged by Ctrl/Meta/Alt --- only the modifier flags distinguish "the
  bare letter" from "the letter plus a live shortcut." `Ctrl+F` (find),
  `Ctrl+A` (select all), `Ctrl+S` (save), `Cmd+D` (bookmark), `Ctrl+H`
  (history), `Ctrl+J` (downloads), `Ctrl+K` (address-bar search), and
  `Ctrl+G` (find next) all matched Aurora Keys' scale letters and got eaten
  along with an unrequested note. Confirmed with a real CDP
  `agent-browser press Control+f` (genuine browser shortcut arbitration,
  not a synthetic `dispatchEvent` --- a synthetic `KeyboardEvent` wouldn't
  exercise the actual OS/browser-level shortcut contention this bug is
  about) and a same-page bubble-phase listener reading back
  `event.defaultPrevented`: `true` before the fix, `false` after a one-line
  modifier guard. General lesson: whenever a keydown handler binds bare
  letter/digit keys across a keyboard region and calls `preventDefault()`
  without checking `ctrlKey`/`metaKey`/`altKey`, check it against whichever
  modifier+key combos are live shortcuts on that same row before calling the
  input scheme done --- this is a distinct question family from the
  six state/logic-symmetry techniques above, worth reaching for once those
  have gone dry rather than assuming a clean internal-logic pass means the
  page has no more bugs.
- No `/ship` skill and no `gh auth` are available to me in this environment
  (confirmed on crit 2: `gh auth status` reports not logged in, and no
  ship-shaped skill appears in the session's skill listing). A prior hand-off
  note for a different repo listed "push, run `/ship`" as a next action, but
  that was this agent guessing at a step, not something actually available to
  run --- doctrine.md says outright "you never receive its GitHub
  credential." The routine's step 6 is just "push the clean tree"; flipping
  a repo from private to public and triggering the CI sweep is the trusted
  harness's job, done separately from any run of mine, not a command I issue.
  Don't plan a next action around running `/ship`.

## Local checks vs CI's linkinator

Correction to an earlier belief in this section: `pnpm dlx linkinator
./dist --silent` (no `--recurse`) **does** request external `https://`
hrefs found in the markup --- on crit 2 it consistently flagged a real,
required `https://ffmpeg.org` link as broken in this sandbox. Diagnosed
via `curl -v` timing, raw `node -e "fetch(...)"` tests, and DNS/IPv6
checks: ffmpeg.org's host does a genuinely slow (8--12s) TLS handshake,
and Node's fetch/undici stack (what linkinator and `WebFetch` both use)
times out or `ECONNRESET`s where `curl` (no default timeout) succeeds;
this sandbox also has no IPv6 route (`ENETUNREACH`), which broke a
second link (gyan.dev) the same way. Other hosts (example.com,
wikipedia.org, github.com) were fine via Node fetch in the same
sandbox --- this looks host- and sandbox-specific, not a general
linkinator limitation. Practical upshot: a local linkinator failure on
an external link is not proof the link is actually dead --- cross-check
with a plain `curl -L` (which has no default timeout and tolerates slow
handshakes) before concluding a required, real link needs to be
dropped, and treat a genuinely slow-but-live source as an accepted risk
to confirm against the real CI run post-push rather than something to
route around by removing the citation. Separately, before linking to
any external site at all, `curl -s -o /dev/null -w "%{http_code}" -L -A
"Mozilla/5.0" <url>` it directly first --- sites with bot protection
(Smarthistory, the Met) returned 403/429 even to a real UA, and would
have broken the CI-gated links check. Prefer stable, crawler-friendly
sources (Wikipedia has never bounced a plain GET) over richer but
bot-guarded ones, except where the source itself (e.g. the actual
organisation's site in a redesign crit) is the point and can't be
swapped out.

A clean 200 from that `curl -L` check is necessary but not sufficient: it
follows redirects silently, so a specific article page that's been
retired can 301 to its section's generic homepage and still return 200
--- the link resolves, just not to what you meant to cite. Caught this on
crit 1 trying to add a UNESCO Silk Roads essay URL: `curl -L` said 200,
`WebFetch`-ing the same URL showed it had landed on a generic hub page,
not the article. Read what a candidate link actually renders (WebFetch or
a browser), not just its status code, before citing it as a specific
source.

## The static-prototype template

Two stack facts from `comp4020-crit4-dachi`, likely to recur on any future
deliverable built on this same Vite/TS static template:

- A spec test that wants to assert "the page ships client-side JS" can't
  select the built bundle by a filename pattern derived from the source file
  (e.g. `script[src*="main"]`) --- Vite names the built script chunk after
  the **HTML entry point**, not `main.ts`, so it comes out `index-<hash>.js`.
  Assert `script[type="module"]` instead.
- `tsc --noEmit` (strict mode) does not carry a top-level
  `if (!x) throw` null-narrowing into functions *defined and called later* in
  the same module, even for a `const` --- narrowing doesn't cross function
  boundaries. Fix is to re-bind the checked value to a second,
  explicitly-typed `const` right after the guard, once, rather than adding
  `!` at every later use site.

## Working style

- The doctrine's "more than 24h: plan/build/deepen, inside 24h: finish"
  split is worth taking literally --- don't write `PROCESS.md`'s final
  citations or the week's `reflections/` entry until the commit history
  that they'd cite is actually close to settled. Writing them early just
  means rewriting them later.
- Commit in small, logically separate chunks even when a run produces a
  lot of new content in one sitting (e.g. delete-the-JS-scaffold,
  theme-CSS, home-page, content-pages, links-page as five separate commits
  rather than one dump) --- the process trail is graded, not just the
  final state.
- When content and checks are both already exhausted (nothing new to
  build, nothing new to verify) but the clock still has more than 24h on
  it, don't default to a fourth identical re-verification pass. Check
  whether the deliverable repo's own `CLAUDE.md` has actually grown
  --- on crit 1, three runs of re-verification produced real lessons
  (no-JS forcing CSS-only animation, the reduced-motion live-check
  method, contrast fixes) that all landed only in this global memory,
  while the project's own `CLAUDE.md` was still the unmodified starter
  template. The doctrine and the starter repo's own text both call this
  out as process evidence a marker reads directly, so writing project
  lessons into the deliverable's `CLAUDE.md` (not just here) is
  legitimate deepening work, not busywork.
- Sensor exhaustion is also a cue to draft `PROCESS.md` and the
  deliverable's `reflections/` entry early, not just to grow `CLAUDE.md`.
  On assignment 1, once every independent sensor family (logic-symmetry,
  DOM-completeness, full browser sweep, reduced-motion, copy-precision,
  response-to-brief scoping) had each gone dry on a repeat pass, the next
  run drafted both evidence files with 39h still on the clock rather than
  running a further re-verification pass or waiting for <24h --- the
  commit history was already rich and settled, so writing early meant
  writing once, and left room for the doctrine's own "more than 24h:
  plan/build/deepen" reading to still apply if a later logic fix ever
  displaces one of the chosen `PROCESS.md` moments. Don't treat ">24h to
  cutoff" as a blanket reason to keep re-verifying once every sensor
  family the project has invented has independently confirmed clean more
  than once.
- That said, "sensors exhausted" and "clock nearly out" are two separate
  conditions, and the assignment 1 precedent above had both (39h left,
  itself well inside a much shorter remaining runway than a full week).
  On crit 4's fourth run, sensors were similarly exhausted (a fresh
  asymmetry pass over `main.ts` turned up only a confirm) but 120.5h ---
  most of the full 168h window --- was still on the clock, only ~28% of
  the week elapsed. Chose to update `PROCESS.md` (already an incrementally
  -maintained artefact, safe to extend) but held off on drafting
  `reflections/crit-4.md` --- that file is explicitly a "final run"
  finishing step in the doctrine, and locking in "the breakthrough" this
  early risks describing a story the rest of the week's work outgrows.
  Weigh both signals before drafting the reflection early: sensor
  exhaustion alone, at hour 28 of a 168-hour week, is not yet the same
  situation as sensor exhaustion with only a handful of hours left.
- **My available sensors can verify correctness and accessibility, but cannot
  evaluate aesthetic/creative "feel" --- don't invent speculative creative
  changes to compensate for a dry bug-hunting well.** On crit 4's sixth run,
  a fresh full read of `main.ts`/`styles.css` plus a live browser interaction
  check (real synthetic `PointerEvent` gesture, console watch, a11y re-audit)
  both came back clean for the second consecutive checkpoint --- a genuinely
  dry sensor well, with still >100h on the clock. The obvious next lever,
  "deepen the instrument's expressiveness" (e.g. map pointer x-position to
  pan/vibrato, reshape an envelope), was considered and rejected: browser
  automation, a11y audits, and console logs can confirm a gesture doesn't
  crash and reaches WCAG bars, but none of them can tell me whether a sound
  *feels* better --- that judgement needs human ears, and the brief for this
  particular crit says so outright ("Latency, feel... none of that shows up
  in a test suite"). Making an unverifiable creative change on spec risks
  making the instrument worse with no way to notice. General lesson beyond
  this one crit: when doctrine's "deepen" step is otherwise open-ended, check
  whether the deepening actually needed is something your sensors can judge
  before inventing new sensor-checkable work as a proxy for it --- if the
  real judge is a human audience the prompt hasn't given you access to yet
  (a pod's live crit, a stakeholder's review), the correct move is to do
  *less* this run and wait for that feedback to actually arrive, not to
  manufacture a substitute.
- When a single edit pass touches a shared partial across several files
  (e.g. adding one new page's link to every page's nav) alongside an
  unrelated content edit on one of those same files, `git add
  <that-file>` for the content commit silently pulls the nav change in
  too --- the diff no longer matches what the commit message describes.
  Check `git diff --staged` against the intended commit message before
  committing, not just `git status`, whenever a cross-cutting change
  (nav, footer, shared partial) overlaps a per-page content edit in the
  same run.
- A11y audit and reduced-motion check aren't the only sensors worth
  running once and not repeating: an actual `agent-browser screenshot`
  pass at both marked viewports (390×844 and 1920×1080) across every
  page is a distinct check from either --- it catches wrap/overflow
  layout regressions that axe-core and `getComputedStyle` don't look
  for at all. On crit 1, once content and both a11y/motion sensors were
  already confirmed clean with >24h still on the clock, this was the
  one genuinely new (not-yet-run) sensor left, rather than a fourth
  identical re-verification pass. Like the others, run it once per
  content-stable period, not every run.
- Two more sensors in the same family, distinct from a11y/reduced-motion/
  screenshot: keyboard-only operation and mid-interaction resize. Neither
  is exercised by an axe audit (static markup properties) or a plain
  screenshot (a single fixed state). `agent-browser press Tab` repeated
  N times plus reading `document.activeElement` after each confirms
  actual tab order (not just that elements are theoretically focusable);
  `press Enter` on a focused control confirms it's keyboard-activatable,
  not just clickable. `agent-browser set viewport <a> <b>` after already
  interacting with the page (not on a fresh load) confirms state survives
  a resize, not just that each viewport looks fine in isolation. Assembly
  1's marking rubric names both explicitly for its top artefact band
  ("holds up under use it wasn't designed for: the keyboard, a resize
  mid-interaction"), which is what surfaced these as worth checking
  --- likely worth doing on any interactive prototype, not just when a
  rubric says so. Same rule as the others: once per content-stable
  period.
- When every browser-level sensor (a11y, keyboard, resize, full walkthrough,
  slow-connection sizing) is already exhausted and re-running any of them
  would just repeat a prior run's exact result, look for an *asymmetry* in
  the core logic's own test coverage before concluding there's nothing left
  to build. On assignment 1, `context.test.ts`/`interaction.test.ts` covered
  shrinking the context window (eviction) thoroughly but never asserted the
  reverse --- widening it after eviction to bring a message back into view,
  which the code already handled correctly (`reconcileList` in `main.ts` is
  symmetric) but which no test named. Found by re-reading the actual
  render/reconcile code with fresh eyes rather than re-running any browser
  check, then added both a pure-logic test (`buildContext` with a widening
  window) and a DOM-wired one (`select` → `change` event flips recall back
  from forgotten to known) in
  [`38999e4`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-dachi/commit/38999e4).
  General lesson: "nothing new to verify" should mean re-reading the pure
  logic and its test file side by side for asymmetric coverage, not just
  re-running the same external sensors again.
- That asymmetry hunt generalises past the pure logic module to any
  DOM-observable side effect the render function itself produces. A second
  pass over `main.ts`'s `render()` (not just `context.ts`) found two more:
  the token meter's `is-warn`/`is-full` classes (a real colour change per
  the stylesheet) and the `aria-live` eviction announcement's singular/
  plural wording --- both real "visitor does something that changes what
  they see" behaviour, neither named by any test. Added five DOM-wired
  tests driving the composer with precisely-sized text (character count is
  a direct lever on token count via the `ceil(length/4)` approximation) to
  land the meter at exact known percentages, in
  [`0855fe0`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-dachi/commit/0855fe0).
  Doing this surfaced a distinct, more general bug class below.
- **A shared-DOM test fixture leaks mutated element state across tests
  unless every test resets everything it can touch, not just what the
  app's own reset control clears.** A test file that imports the app once
  in `beforeAll` and reuses one `document` across all `it()`s, clearing
  state via a `beforeEach` click on the app's own reset button, only
  resets what that button resets. On assignment 1, the reset button
  intentionally leaves a `<select>` (window size) untouched, matching real
  UI behaviour --- so an earlier test that changed the select's value
  leaked that value into every later test in the file, invisibly, until a
  new test happened to assert against the default. Fix was cheap
  (explicitly reset the select in `beforeEach` too) but the bug was
  latent for as long as no test depended on the leaked-over default.
  General lesson: when writing this shared-fixture-plus-reset-button test
  pattern, enumerate every piece of mutable DOM state a test can touch and
  reset all of it in `beforeEach`, not just what the app's own reset does
  --- test isolation and app-reset behaviour are two different contracts,
  and conflating them hides order-dependence bugs until a coincidence
  exposes them.
- **The sharpest version of asymmetry hunting is checking whether two
  functions meant to *agree* on a predicate actually agree, not just
  whether each is individually tested.** On assignment 1, `main.ts` had a
  "has this fact ever been stated" gate and `context.ts` had a `canRecall`
  check that only runs once that gate passes --- the two exist specifically
  to cooperate. The gate matched case-sensitively; the recall check
  lowercased both sides. Both functions already had test coverage, so a
  naive "is X tested" pass would have called this done --- the bug only
  surfaced by asking "if I feed the same untested input class (lowercase
  free text) to both, do they still agree," which no single function's own
  tests would ever ask. Worth making this an explicit second question after
  "what's untested" in any future asymmetry pass over a codebase with
  cooperating predicates: for every pair of functions/branches meant to
  agree on the same fact, do they normalise their shared input
  (case, whitespace, trimming, rounding) the same way?
- **A sixth asymmetry-hunting pass (assignment 1) found a bug that lived
  inside a single function, not between two cooperating ones.**
  `buildContext`'s eviction loop looked FIFO but was actually "skip whatever
  doesn't individually fit the remaining budget, keep trying older items
  against the same leftover space." Every existing test used uniform-sized
  messages, which always coincidentally produced a contiguous prefix and
  hid the bug through five prior passes. Real mixed sizes could evict a
  newer, larger message while keeping an older, smaller one visible ---
  backwards from the demo's own "oldest first" claim. Caught by asking a
  new question, not by re-running the previous ones: for a function whose
  test fixtures all share some unexamined property (here, uniform size),
  what happens when that property is varied? Confirmed with a throwaway
  `node -e` reproduction before touching source. General lesson for future
  asymmetry passes: after "do two functions/branches agree," also ask "do
  this function's own tests all share a property that could be masking a
  whole behaviour branch" --- uniform input size, all-ASCII text,
  all-positive numbers, inputs drawn only from a fixed set rather than free
  text, etc. Full writeup and fix in `comp4020-ass1-dachi`'s own
  `CLAUDE.md` (commit `6020844`).
- **Not every asymmetry pass finds a bug, and that's not a wasted pass.**
  A seventh pass on assignment 1 checked the two candidates the sixth
  pass had flagged as untested but plausible-looking, and both turned
  out fine: a single message alone bigger than the whole window (a real,
  reachable branch no fixture had varied) evicts correctly per the
  contiguous-oldest-first invariant, and a `Math.max(1, ...)` floor
  turned out to be genuinely dead code (never engages for any reachable
  input) rather than a live edge case. Confirmed both with a `node -e`
  repro before writing anything. Lesson: writing the test that proves a
  suspicious-looking edge case is actually fine, and removing code that
  turns out to never fire, is itself legitimate deepening work --- don't
  treat "confirmed correct" as a null result that should have been
  skipped. It's also a signal, not noise: when a pass over the same
  pair of files starts turning up confirmations instead of defects, the
  seam is thinning and it may be time to look elsewhere (browser
  sensors, PROCESS.md prep) rather than force an eighth identical pass.
- **That signal can still be wrong --- an eighth pass on assignment 1
  found a real bug by asking a question per *side effect*, not per
  function.** A render function that fans one state transition out into
  several DOM-observable side effects (here: transcript membership, a
  meter's CSS classes, an `aria-live` announcement's text) can have one
  side effect thoroughly tested for a given direction of that transition
  while a sibling side effect is never asked the same question. Assignment
  1's widening test proved messages come back into view when the window
  grows; nothing asked whether the *announcement* handled that same
  reversal, and it didn't --- it only ever updated on new evictions, so
  widening left a stale, false "N messages just fell out" sentence sitting
  in a screen-reader-visible (`sr-only`, not `aria-hidden`) region.
  Fixed by adding the symmetric branch and a regression test, confirmed
  live in a real browser before calling it done. Full writeup in
  `comp4020-ass1-dachi`'s own `CLAUDE.md` (commit `275c3b2`). General
  lesson: when a function has already had its coverage checked
  side-effect-by-side-effect once, the next asymmetry pass shouldn't ask
  "is anything still untested" again but "does each side effect handle
  every direction of the shared transition, not just the one a prior test
  happened to exercise" --- particularly for any control (like a
  window/size selector) that makes an otherwise one-way transition
  reversible.
- **When logic-symmetry asymmetry hunting over a page's core state
  functions goes two-for-two on confirms-only (no bug found), the next
  reusable lens isn't a harder version of the same question --- it's a
  different question about the same control: does a reset/clear button
  actually reset *every* piece of mutable DOM state on the page, or only
  what the core render function redraws from its own state every cycle?**
  On assignment 1, nine passes over `context.ts`/`main.ts`'s eviction and
  recall logic (the last two confirming no bug) never asked this about the
  page's Reset button, because it's a different kind of question ---
  "what does this control forget to clear," not "do these two functions
  agree." Enumerating every element with mutable state (not just the ones
  `render()` writes each cycle) found a real one: an unsent composer
  draft and its live token-count preview survived Reset, sitting stale
  next to a freshly-zeroed transcript and meter. Confirmed live in a real
  browser before touching source. Full writeup in
  `comp4020-ass1-dachi`'s own `CLAUDE.md` (commit `2b38115`). Worth
  reaching for this lens specifically once a project's own state-symmetry
  asymmetry hunting has gone quiet, rather than assuming quiet
  logic-symmetry checks mean the page has no more bugs to find.
