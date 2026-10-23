// Checks for SketchyBar's choice of layout, which is per-Theme (#155, ADR 0011).
// Runs sketchybarrc in a scratch $HOME (scratch.mjs).
// Run: node sketchybar/tests/layout_test.mjs
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calls, padding, root, stub, switchTo, withScratch } from "./scratch.mjs";

const failures = [];
let passed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failures.push(`${name}: ${err.message}`);
  }
}

function eq(actual, expected, what) {
  if (actual !== expected) {
    throw new Error(`${what}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// The calls the XP taskbar made before layouts were per-Theme.
const before = (bar) => calls(bar, join(root, "sketchybar/tests/fixtures/before.sketchybarrc"));

// Fails at the first argument where two runs' calls differ.
function sameCalls(actual, expected) {
  const [a, e] = [actual.split("\n"), expected.split("\n")];
  const at = a.findIndex((line, i) => line !== e[i]);
  if (at !== -1 || a.length !== e.length) {
    const i = at === -1 ? Math.min(a.length, e.length) : at;
    throw new Error(`calls differ at argument ${i + 1}: expected ${JSON.stringify(e[i])}, got ${JSON.stringify(a[i])}`);
  }
}

// Fails unless the last run's yabai padding is exactly expected.
const samePadding = (bar, expected) => eq(JSON.stringify(padding(bar)), JSON.stringify(expected), "padding");

// A layout of a Theme's own that makes one call, so its running shows.
const ownLayout = "sketchybar --bar position=top\n";

test("a fresh checkout runs Vintage's taskbar, exactly as before", () => withScratch((bar) => {
  const taskbar = calls(bar);
  if (!taskbar.includes("position=bottom")) throw new Error("no taskbar at the bottom");
  sameCalls(taskbar, before(bar));
}));

test("a Switch to Vintage runs Vintage's taskbar, exactly as before", () => withScratch((bar) => {
  switchTo(bar, "vintage");
  sameCalls(calls(bar), before(bar));
}));

test("the active Theme's own layout runs in place of the taskbar", () => withScratch((bar) => {
  writeFileSync(join(bar.config, "layouts/marigold.sh"), ownLayout);
  switchTo(bar, "marigold");
  eq(calls(bar), "--bar\nposition=top\n--\n--update\n--\n", "calls");
}));

test("a Theme with no layout of its own runs Vintage's taskbar in its colors", () => withScratch((bar) => {
  // Marigold, as if it had no layout of its own: its palette is the one generated.
  rmSync(join(bar.config, "layouts/marigold.sh"));
  switchTo(bar, "marigold");
  const taskbar = calls(bar);
  const face = readFileSync(join(root, "sketchybar/themes/marigold.sh"), "utf8").match(/^export frame_face="(0x\w+)"/m)[1];
  if (!taskbar.includes(`color=${face}\n`)) throw new Error(`the bar isn't Marigold's frame_face ${face}`);
  sameCalls(taskbar, before(bar));
}));

test("a Theme whose palette was never generated runs Vintage's taskbar", () => withScratch((bar) => {
  writeFileSync(join(bar.config, "layouts/gone.sh"), ownLayout);
  switchTo(bar, "gone");
  sameCalls(calls(bar), before(bar));
}));

// Each layout reserves the bar's room in yabai (#166).
test("Vintage's taskbar has yabai leave top 8 and bottom 38", () => withScratch((bar) => {
  switchTo(bar, "vintage");
  calls(bar);
  samePadding(bar, { top: 8, bottom: 38 });
}));

// Its y_offset, height and window gap, as the Marigold spec settles them.
test("Marigold's bar has yabai leave top 44, clear of the bar, and bottom 8", () => withScratch((bar) => {
  switchTo(bar, "marigold");
  calls(bar);
  samePadding(bar, { top: 44, bottom: 8 });
}));

// Marigold's bar asks yabai to tell it when spaces change (#172); the taskbar
// needs no signals, so a Switch to Vintage removes them.
test("a Switch back to Vintage stops yabai signalling Marigold's bar", () => withScratch((bar) => {
  switchTo(bar, "vintage");
  calls(bar);
  const log = readFileSync(join(bar.home, "yabai.log"), "utf8").split("\n--\n").map((call) => call.split("\n"));
  for (const event of ["space_created", "space_destroyed", "display_added", "display_removed", "display_moved", "mission_control_exit"]) {
    if (!log.some((call) => call[2] === "--remove" && call[3] === `sketchybar_${event}`)) throw new Error(`the ${event} signal stays`);
  }
}));

for (const theme of ["vintage", "marigold"]) {
  test(`${theme}: the bar loads in full when yabai isn't running`, () => withScratch((bar) => {
    switchTo(bar, theme);
    const running = calls(bar);
    stub(bar, "yabai", 'echo "yabai-msg: failed to connect to socket.." >&2\nexit 1');
    sameCalls(calls(bar), running);
    samePadding(bar, {});
  }));
}

test("yabairc leaves top and bottom padding to the layouts", () => {
  const set = readFileSync(join(root, "yabai/yabairc"), "utf8").match(/^\s*yabai -m config (top|bottom)_padding.*/m);
  if (set) throw new Error(`yabairc sets ${set[0].trim()}`);
});

// A restarted yabai starts with no top or bottom padding.
test("yabairc reloads the bar, so a restarted yabai gets its padding back", () => {
  const lines = readFileSync(join(root, "yabai/yabairc"), "utf8").split("\n");
  if (!lines.some((line) => /^sketchybar --reload\b/.test(line))) throw new Error("yabairc doesn't run sketchybar --reload");
});

// The spec's "8 from the top and sides of the screen (yabai's window_gap)".
test("Marigold's bar is inset from the screen's sides by yabai's window_gap", () => withScratch((bar) => {
  switchTo(bar, "marigold");
  const margin = calls(bar).match(/^margin=(\d+)$/m)?.[1];
  const gap = readFileSync(join(root, "yabai/yabairc"), "utf8").match(/^yabai -m config window_gap (\d+)$/m)[1];
  eq(margin, gap, "margin");
}));

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
