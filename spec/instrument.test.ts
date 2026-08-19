import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

// This week's brief: a browser-native instrument, synthesised client-side,
// playable without instructions. Aurora Keys builds its pads at runtime (a
// jsdom parse of the built HTML can't see them — there's no AudioContext or
// pointer/keyboard gesture to drive), so what's checkable here is the shell
// the runtime script depends on: the mount point, the no-instructions hint,
// and that nothing pre-empts a fail state or a score. The instrument's actual
// playability is a person-at-a-real-browser question — see spec/README.md.

const doc = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8")).window.document;

describe("Aurora Keys shell", () => {
  it("names the instrument in its title", () => {
    expect(doc.title.toLowerCase()).toContain("aurora keys");
  });

  it("mounts a stage for the runtime to populate with pads", () => {
    expect(doc.querySelector("#stage")).toBeTruthy();
  });

  it("offers a gesture hint instead of instructions", () => {
    const hint = doc.querySelector("#hint");
    expect(hint?.textContent?.trim()).toBeTruthy();
    // "instructions" would name specific controls; a hint just invites a touch.
    expect(hint?.textContent?.toLowerCase()).not.toMatch(/instructions|how to play|rules/);
  });

  it("declares no score or fail state anywhere in the shipped markup", () => {
    const text = doc.body.textContent?.toLowerCase() ?? "";
    expect(text).not.toMatch(/score|game over|you (win|lose|failed)/);
  });

  it("ships a module script, so synthesis runs in the player's own browser rather than a server", () => {
    expect(doc.querySelector("script[type='module']")).toBeTruthy();
  });

  // The brief: "sound is made live in the page by the player, not played
  // back." A pre-recorded sample would satisfy every other check here while
  // failing this one, so it needs its own assertion.
  it("has no <audio>/<video> element or pre-recorded audio asset — sound is synthesised, not played back", () => {
    expect(doc.querySelectorAll("audio, video").length).toBe(0);
    const shipped = readdirSync(resolve("dist"), { recursive: true }) as string[];
    const samples = shipped.filter((name) => /\.(mp3|wav|ogg|m4a|flac|aac|webm)$/i.test(name));
    expect(samples).toEqual([]);
  });
});
