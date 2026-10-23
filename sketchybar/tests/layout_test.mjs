// Checks for SketchyBar's choice of layout, which is per-Theme (#155, ADR 0011).
// Runs sketchybarrc in a scratch $HOME (scratch.mjs).
// Run: node sketchybar/tests/layout_test.mjs
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { calls, root, switchTo, withScratch } from "./scratch.mjs";

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

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
