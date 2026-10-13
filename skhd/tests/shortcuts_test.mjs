// Checks for the skhd Shortcuts and the yabai config (#124, #126, scheme in #113).
// Run: node skhd/tests/shortcuts_test.mjs
import { accessSync, constants, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (path) => readFileSync(join(root, path), "utf8");

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

// skhd's own modifier aliases, expanded so chords compare as sets.
const aliases = { hyper: ["cmd", "alt", "shift", "ctrl"], meh: ["alt", "shift", "ctrl"] };

// A chord as a canonical string: sorted modifiers, then the key ("ctrl+cmd-h").
function chord(mods, key) {
  const set = new Set(mods.flatMap((m) => aliases[m] ?? [m]));
  return `${[...set].sort().join("+")}-${key}`;
}

// skhdrc bindings as { chord, command }, skipping comments and blank lines.
function parse(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const m = line.match(/^(.*?)\s*-\s*(\S+)\s*:\s*(.*?)\s*$/);
      if (!m) throw new Error(`unparsed skhdrc line: ${line}`);
      const mods = m[1].split("+").map((s) => s.trim()).filter(Boolean);
      return { chord: chord(mods, m[2]), command: m[3].replace(/\s+#.*$/, "") };
    });
}

const bindings = parse(read("skhd/skhdrc"));
const commandFor = (mods, key) => bindings.find((b) => b.chord === chord(mods, key))?.command;

const directions = { h: "west", j: "south", k: "north", l: "east" };

test("focus window on ctrl+cmd+hjkl", () => {
  for (const [key, dir] of Object.entries(directions)) {
    eq(commandFor(["ctrl", "cmd"], key), `yabai -m window --focus ${dir}`, `ctrl + cmd - ${key}`);
  }
});

test("swap window on ctrl+alt+hjkl", () => {
  for (const [key, dir] of Object.entries(directions)) {
    eq(commandFor(["ctrl", "alt"], key), `yabai -m window --swap ${dir}`, `ctrl + alt - ${key}`);
  }
});

test("resize window on ctrl+shift+hjkl", () => {
  const resize = {
    h: "left:-40:0",
    j: "bottom:0:40",
    k: "top:0:-40",
    l: "right:40:0",
  };
  for (const [key, arg] of Object.entries(resize)) {
    eq(commandFor(["ctrl", "shift"], key), `yabai -m window --resize ${arg}`, `ctrl + shift - ${key}`);
  }
});

test("zoom, float + center and balance on Hyper+F / T / E", () => {
  eq(commandFor(["hyper"], "f"), "yabai -m window --toggle zoom-fullscreen", "hyper - f");
  eq(commandFor(["hyper"], "t"), "yabai -m window --toggle float --grid 4:4:1:1:2:2", "hyper - t");
  eq(commandFor(["hyper"], "e"), "yabai -m space --balance", "hyper - e");
});

test("no bare-alt, warp, display, rotate, mirror or restart bindings", () => {
  for (const b of bindings) {
    if (b.chord.startsWith("alt-")) throw new Error(`bare alt binding: ${b.chord}`);
    for (const banned of ["--warp", "--display", "--rotate", "--mirror", "--restart-service"]) {
      if (b.command.includes(banned)) throw new Error(`${b.chord} uses ${banned}`);
    }
  }
});

const digit = (n) => String(n % 10);

test("shift+cmd+1–0 send the focused window to space N without following it", () => {
  for (let n = 1; n <= 10; n++) {
    eq(commandFor(["shift", "cmd"], digit(n)), `yabai -m window --space ${n}`, `shift + cmd - ${digit(n)}`);
  }
});

test("Hyper+D opens, focuses or cycles Finder", () => {
  eq(commandFor(["hyper"], "d"), '~/.config/skhd/scripts/go.sh "Finder"', "hyper - d");
});

test("no go-to-space bindings: spaces are switched in Mission Control", () => {
  for (const b of bindings) {
    if (/^cmd-\d$/.test(b.chord)) throw new Error(`${b.chord} is bound`);
    if (b.command.includes("space --focus")) throw new Error(`${b.chord} uses space --focus`);
  }
});

test("yabairc pins no app to a space", () => {
  if (/space=\d/.test(read("yabai/yabairc"))) throw new Error("yabairc has a space= rule");
});

test("every binding is a window verb, a move-to-space binding or Finder", () => {
  // 4 focus + 4 swap + 4 resize + 3 layout + 10 move + Finder.
  eq(bindings.length, 26, "binding count");
  const chords = bindings.map((b) => b.chord);
  const dupes = chords.filter((c, i) => chords.indexOf(c) !== i);
  eq(dupes.join(", "), "", "duplicate chords");
});

test("yabairc is an executable shell script", () => {
  const path = join(root, "yabai/yabairc");
  accessSync(path, constants.X_OK);
  eq(read("yabai/yabairc").split("\n")[0], "#!/usr/bin/env sh", "shebang");
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
