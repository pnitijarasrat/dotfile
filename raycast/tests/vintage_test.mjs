// Checks for the Raycast Vintage theme (#21).
// Run: node raycast/tests/vintage_test.mjs
import { readFileSync } from "node:fs";
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

// Every role the spec defines, with its hex, from the tables in
// docs/theme-spec.md (`role` | `#hex`).
const roles = Object.fromEntries(
  [...read("docs/theme-spec.md").matchAll(/`([a-z0-9_]+)`\s*\|?\s*`(#[0-9A-F]{6})`/g)].map((m) => [m[1], m[2]]),
);

const themePath = "raycast/vintage.rctheme.json";
let theme = {};
test("theme is strict JSON", () => {
  theme = JSON.parse(read(themePath));
});
const colors = theme.colors ?? {};

// Every Raycast color slot, with the spec role it takes.
const slotRoles = {
  background: "frame_face",
  text: "frame_text",
  selection: "frame_selection",
  // Win95 progress bars fill with the selection navy.
  loading: "frame_selection",
  red: "frame_data_red",
  orange: "frame_data_orange",
  yellow: "frame_data_yellow",
  green: "frame_data_green",
  blue: "frame_data_blue",
  // No frame_data_purple: purple is drawn as frame_data_magenta (see Deviations).
  purple: "frame_data_magenta",
  magenta: "frame_data_magenta",
};

test("is a light theme named Vintage", () => {
  eq(theme.$schema, "https://www.raycast.com/schemas/theme.json", "$schema");
  eq(theme.name, "Vintage", "name");
  eq(theme.appearance, "light", "appearance");
});

test("launcher is Frame grey with black text and navy selection; data slots use the Frame data colors", () => {
  for (const [slot, role] of Object.entries(slotRoles)) {
    if (!roles[role]) throw new Error(`role ${role} is not in the spec`);
    eq(colors[slot], roles[role], `${slot} (${role})`);
  }
});

test("sets every Raycast slot and nothing else", () => {
  eq(Object.keys(colors).sort().join(","), Object.keys(slotRoles).sort().join(","), "color slots");
});

test("purple deviation is recorded in the spec", () => {
  if (!/^\| Raycast \| purple data slot \|/m.test(read("docs/theme-spec.md"))) {
    throw new Error("no Raycast purple row in the spec's Deviations table");
  }
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
