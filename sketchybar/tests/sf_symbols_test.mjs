// Checks for sketchybar/sf_symbols.sh (#168), the SF Symbols characters the
// Marigold theme's bar draws its status items with. make_sf_symbols.swift
// generates it; this checks what it wrote, not how.
// Run: node sketchybar/tests/sf_symbols_test.mjs
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { root } from "./scratch.mjs";

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

// Every variable the bar needs, as #168 lists them.
const names = [
  "clock",
  "battery_100", "battery_75", "battery_50", "battery_25", "battery_0", "battery_charging",
  "wifi", "wifi_off", "lock", "check",
  "volume", "volume_low", "volume_off",
  "cpu", "memory",
  "music", "play", "pause", "next", "previous",
  "sun", "partly_cloudy", "cloud", "fog", "rain", "snow", "storm",
  "globe", "keyboard",
].map((name) => `sf_${name}`);

// Each variable's value after sourcing the file, or undefined if it's unset.
const script = `source "$1" || exit 1; shift; for v in "$@"; do [ -n "\${!v+set}" ] && printf '%s=%s\\0' "$v" "\${!v}"; done; exit 0`;
const run = spawnSync("bash", ["-c", script, "bash", join(root, "sketchybar/sf_symbols.sh"), ...names], { encoding: "utf8" });
const values = Object.fromEntries(run.stdout.split("\0").filter(Boolean).map((pair) => pair.split(/=(.*)/s).slice(0, 2)));

test("the file sources cleanly", () => {
  if (run.status !== 0) throw new Error(run.stderr.trim() || `bash exited ${run.status}`);
});

for (const name of names) {
  test(`${name} is one SF Symbols character`, () => {
    const value = values[name];
    if (value === undefined) throw new Error("isn't set");
    if (!/^[\u{100000}-\u{10fffd}]$/u.test(value)) throw new Error(`${JSON.stringify(value)} isn't one character in U+100000–U+10FFFD`);
  });
}

test("no two variables are the same character", () => {
  const seen = new Map();
  for (const name of names) {
    const value = values[name];
    if (value === undefined) continue;
    if (seen.has(value)) throw new Error(`${name} and ${seen.get(value)} are both U+${value.codePointAt(0).toString(16).toUpperCase()}`);
    seen.set(value, name);
  }
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
