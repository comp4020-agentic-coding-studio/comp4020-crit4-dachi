// Aurora Keys — a pentatonic light-instrument. Every pad is a scale degree,
// so no combination a stranger presses is a wrong note; the instrument is in
// how loud, how bright, and how long, not which keys are "correct".

type PadDef = { note: string; freq: number; hue: number; key: string };

const SCALE: PadDef[] = [
  { note: "C4", freq: 261.63, hue: 262, key: "a" },
  { note: "D4", freq: 293.66, hue: 232, key: "s" },
  { note: "E4", freq: 329.63, hue: 200, key: "d" },
  { note: "G4", freq: 392.0, hue: 165, key: "f" },
  { note: "A4", freq: 440.0, hue: 130, key: "g" },
  { note: "C5", freq: 523.25, hue: 55, key: "h" },
  { note: "D5", freq: 587.33, hue: 25, key: "j" },
  { note: "E5", freq: 659.25, hue: 340, key: "k" },
];

const stageEl = document.querySelector<HTMLDivElement>("#stage");
const hintEl = document.querySelector<HTMLParagraphElement>("#hint");
if (!stageEl || !hintEl) throw new Error("Aurora Keys: #stage or #hint missing from index.html");
const stage: HTMLDivElement = stageEl;
const hint: HTMLParagraphElement = hintEl;

const pads = SCALE.map((def, index) => {
  const pad = document.createElement("button");
  pad.type = "button";
  pad.className = "pad is-idle";
  pad.style.setProperty("--hue", String(def.hue));
  pad.style.animationDelay = `${index * 0.18}s`;
  pad.setAttribute("aria-label", `play ${def.note}`);

  const keyLabel = document.createElement("span");
  keyLabel.className = "pad__key";
  keyLabel.textContent = def.key.toUpperCase();
  keyLabel.setAttribute("aria-hidden", "true");
  pad.append(keyLabel);

  stage.append(pad);
  return pad;
});

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

// --- audio graph -----------------------------------------------------------
// Built lazily on the first real user gesture: constructing an AudioContext
// before that leaves it suspended in every browser that matters here, and a
// suspended context is silent, not a delayed one.

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sendGain: GainNode | null = null;

function createReverbImpulse(ctx: AudioContext, duration = 2.8, decay = 3.2): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * duration);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
}

function ensureAudio(): AudioContext {
  if (audioCtx) {
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  }

  const ctx = new AudioContext();

  const master = ctx.createGain();
  master.gain.value = 0.85;
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -18;
  compressor.ratio.value = 6;
  master.connect(compressor);
  compressor.connect(ctx.destination);

  const send = ctx.createGain();
  send.gain.value = 0.4;
  const wet = ctx.createGain();
  wet.gain.value = 0.75;
  const convolver = ctx.createConvolver();
  convolver.buffer = createReverbImpulse(ctx);
  send.connect(convolver);
  convolver.connect(wet);
  wet.connect(master);

  audioCtx = ctx;
  masterGain = master;
  sendGain = send;
  return ctx;
}

// One voice per sounding note: a triangle fundamental plus a quiet detuned
// octave for shimmer, both through a lowpass whose cutoff is the one knob a
// player turns just by pressing harder, dragging higher, or holding longer.
class Voice {
  private readonly ctx: AudioContext;
  private readonly osc: OscillatorNode;
  private readonly shimmer: OscillatorNode;
  private readonly filter: BiquadFilterNode;
  private readonly gain: GainNode;

  constructor(ctx: AudioContext, freq: number, dry: GainNode, send: GainNode) {
    this.ctx = ctx;
    const now = ctx.currentTime;

    this.osc = ctx.createOscillator();
    this.osc.type = "triangle";
    this.osc.frequency.value = freq;

    this.shimmer = ctx.createOscillator();
    this.shimmer.type = "sine";
    this.shimmer.frequency.value = freq * 2.003;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.16;

    this.filter = ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.Q.value = 0.7;
    this.filter.frequency.value = 500;

    this.gain = ctx.createGain();
    this.gain.gain.value = 0;

    this.osc.connect(this.filter);
    this.shimmer.connect(shimmerGain);
    shimmerGain.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(dry);
    this.gain.connect(send);

    this.osc.start(now);
    this.shimmer.start(now);

    this.gain.gain.linearRampToValueAtTime(0.5, now + 0.015);
    this.filter.frequency.linearRampToValueAtTime(1800, now + 0.05);
  }

  setLevel(level: number): void {
    const now = this.ctx.currentTime;
    this.filter.frequency.setTargetAtTime(500 + level * 3800, now, 0.05);
    this.gain.gain.setTargetAtTime(0.28 + level * 0.4, now, 0.06);
  }

  release(): void {
    const now = this.ctx.currentTime;
    this.gain.gain.cancelScheduledValues(now);
    this.gain.gain.setTargetAtTime(0, now, 0.35);
    this.filter.frequency.setTargetAtTime(300, now, 0.4);
    const stopAt = now + 1.6;
    this.osc.stop(stopAt);
    this.shimmer.stop(stopAt);
    this.osc.onended = () => {
      this.filter.disconnect();
      this.gain.disconnect();
    };
  }
}

// --- shared playing state ----------------------------------------------------

const activeVoices = new Map<string, Voice>();

function setPadLevel(index: number, level: number): void {
  pads[index]?.style.setProperty("--level", String(level));
}

function firstInteraction(): void {
  if (hint.classList.contains("is-quiet")) return;
  hint.classList.add("is-quiet");
  for (const pad of pads) pad.classList.remove("is-idle");
}

function pressPad(index: number, voiceId: string, level: number): void {
  if (activeVoices.has(voiceId)) return;
  firstInteraction();
  const ctx = ensureAudio();
  if (!masterGain || !sendGain) return;
  const voice = new Voice(ctx, SCALE[index]!.freq, masterGain, sendGain);
  voice.setLevel(level);
  activeVoices.set(voiceId, voice);
  setPadLevel(index, level);
}

function movePad(index: number, voiceId: string, level: number): void {
  const voice = activeVoices.get(voiceId);
  if (!voice) return;
  voice.setLevel(level);
  setPadLevel(index, level);
}

function releasePad(index: number, voiceId: string): void {
  const voice = activeVoices.get(voiceId);
  if (!voice) return;
  voice.release();
  activeVoices.delete(voiceId);
  setPadLevel(index, 0);
}

function releaseAll(): void {
  for (const voice of activeVoices.values()) voice.release();
  activeVoices.clear();
  pointerPad.clear();
  activeKeys.clear();
  pads.forEach((_, index) => setPadLevel(index, 0));
}

window.addEventListener("blur", releaseAll);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) releaseAll();
});

// --- pointer input (mouse, touch, pen) ---------------------------------------
// No pointer capture: leaving that off lets a pointermove event retarget to
// whichever pad is now underneath, so a single drag across the row plays a
// run rather than just bending the one pad it started on. The stage has a
// CSS gap between pads, so a drag routinely passes over the gap between two
// of them; NONE_HIT marks "pointer still down, currently over no pad" rather
// than dropping the pointer's tracking outright, so a later move back onto a
// pad revives it instead of requiring a fresh pointerdown.

const NONE_HIT = -1;
const pointerPad = new Map<number, number>();

function padUnder(clientX: number, clientY: number): { index: number; el: HTMLButtonElement } | null {
  const el = document.elementFromPoint(clientX, clientY);
  const target = el instanceof Element ? el.closest<HTMLButtonElement>(".pad") : null;
  if (!target) return null;
  const index = pads.indexOf(target);
  return index === -1 ? null : { index, el: target };
}

function levelWithin(el: HTMLButtonElement, clientY: number): number {
  const rect = el.getBoundingClientRect();
  return clamp01(1 - (clientY - rect.top) / rect.height);
}

stage.addEventListener("pointerdown", (event) => {
  const hit = padUnder(event.clientX, event.clientY);
  if (!hit) return;
  event.preventDefault();
  pointerPad.set(event.pointerId, hit.index);
  pressPad(hit.index, `pointer:${event.pointerId}`, levelWithin(hit.el, event.clientY));
});

stage.addEventListener("pointermove", (event) => {
  const current = pointerPad.get(event.pointerId);
  if (current === undefined) return;
  const hit = padUnder(event.clientX, event.clientY);
  if (!hit) {
    if (current !== NONE_HIT) releasePad(current, `pointer:${event.pointerId}`);
    pointerPad.set(event.pointerId, NONE_HIT);
    return;
  }
  if (hit.index !== current) {
    if (current !== NONE_HIT) releasePad(current, `pointer:${event.pointerId}`);
    pointerPad.set(event.pointerId, hit.index);
    pressPad(hit.index, `pointer:${event.pointerId}`, levelWithin(hit.el, event.clientY));
    return;
  }
  movePad(current, `pointer:${event.pointerId}`, levelWithin(hit.el, event.clientY));
});

function endPointerGesture(event: PointerEvent): void {
  const current = pointerPad.get(event.pointerId);
  if (current === undefined) return;
  if (current !== NONE_HIT) releasePad(current, `pointer:${event.pointerId}`);
  pointerPad.delete(event.pointerId);
}
stage.addEventListener("pointerup", endPointerGesture);
stage.addEventListener("pointercancel", endPointerGesture);

// A click with detail 0 is a keyboard activation (Enter/Space on a focused
// button), not a pointer tap already handled above — Tab-and-Enter play too.
let pluckCounter = 0;
pads.forEach((pad, index) => {
  pad.addEventListener("click", (event) => {
    if (event.detail !== 0) return;
    firstInteraction();
    const ctx = ensureAudio();
    if (!masterGain || !sendGain) return;
    const voiceId = `pluck:${index}:${pluckCounter++}`;
    const voice = new Voice(ctx, SCALE[index]!.freq, masterGain, sendGain);
    voice.setLevel(0.6);
    activeVoices.set(voiceId, voice);
    setPadLevel(index, 0.6);
    setTimeout(() => {
      voice.release();
      activeVoices.delete(voiceId);
      setPadLevel(index, 0);
    }, 220);
  });
});

// --- keyboard input -----------------------------------------------------------
// A short press plucks; holding a key swells it brighter and louder over
// about a second, so the keyboard has its own kind of expression rather than
// just aping a mouse click.
//
// Releasing a key and re-pressing it before the old rAF loop's holding
// conditions go false (activeKeys/activeVoices are keyed by the key string
// itself, so a fast release-then-repress leaves both true throughout) let the
// old loop keep running forever alongside the new one, computing an
// ever-growing stale elapsed time. A per-press token, bumped on every
// keydown, gives a loop a way to notice a newer press has taken over its key
// and stop rescheduling itself, the same role pluckCounter plays for reused
// pluck voice ids above.

const keyToIndex = new Map(SCALE.map((def, index) => [def.key, index]));
const activeKeys = new Set<string>();
const keyPressToken = new Map<string, number>();

function sustainKey(key: string, index: number, token: number): void {
  const voiceId = `key:${key}`;
  const start = performance.now();
  const step = (): void => {
    if (keyPressToken.get(key) !== token) return;
    if (!activeKeys.has(key) || !activeVoices.has(voiceId)) return;
    const elapsed = (performance.now() - start) / 1000;
    movePad(index, voiceId, clamp01(0.4 + elapsed * 0.5));
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

window.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  const index = keyToIndex.get(key);
  if (index === undefined) return;
  event.preventDefault();
  activeKeys.add(key);
  pressPad(index, `key:${key}`, 0.4);
  const token = (keyPressToken.get(key) ?? 0) + 1;
  keyPressToken.set(key, token);
  sustainKey(key, index, token);
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  const index = keyToIndex.get(key);
  if (index === undefined) return;
  activeKeys.delete(key);
  releasePad(index, `key:${key}`);
});
