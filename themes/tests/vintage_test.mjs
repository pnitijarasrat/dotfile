// Checks for the Vintage Theme source file (#131).
// Run: node themes/tests/vintage_test.mjs
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

const theme = JSON.parse(read("themes/vintage.json"));
const roles = Object.assign({}, ...Object.values(theme.palettes));
const spec = read("docs/theme-spec.md");

test("is the Vintage theme", () => {
  eq(theme.name, "Vintage", "name");
});

test("has no shadows (Purist fidelity)", () => {
  eq(theme.shadows, false, "shadows");
});

test("every role is an uppercase #RRGGBB", () => {
  for (const [role, hex] of Object.entries(roles)) {
    if (!/^#[0-9A-F]{6}$/.test(hex)) throw new Error(`${role} = ${JSON.stringify(hex)}`);
  }
});

test("no role is in two palettes", () => {
  const count = Object.values(theme.palettes).reduce((n, palette) => n + Object.keys(palette).length, 0);
  eq(count, Object.keys(roles).length, "role count");
});

test("holds every role the spec names, and no others", () => {
  // Roles are the first cell of the spec's role tables, and the `ansi_N` cells.
  const named = new Set([
    ...[...spec.matchAll(/^\| `([a-z0-9_]+)` \|/gm)].map((m) => m[1]),
    ...[...spec.matchAll(/`(ansi_\d+)`/g)].map((m) => m[1]),
  ]);
  const missing = [...named].filter((role) => !(role in roles));
  const extra = Object.keys(roles).filter((role) => !named.has(role));
  if (missing.length) throw new Error(`not in the source file: ${missing.join(", ")}`);
  if (extra.length) throw new Error(`not in the spec: ${extra.join(", ")}`);
});

test("the spec's tables hold no hex values, and point at the source file", () => {
  const hex = spec.match(/^\| `[a-z0-9_]+` \|.*#[0-9A-Fa-f]{6}.*$/m) ?? spec.match(/`ansi_\d+` `#[0-9A-Fa-f]{6}`/);
  if (hex) throw new Error(`spec still has a value: ${hex[0]}`);
  if (!spec.includes("`themes/vintage.json`")) throw new Error("spec doesn't reference themes/vintage.json");
});

test("Display roles are VGA colors already in the ANSI table", () => {
  eq(roles.display_bg, roles.ansi_0, "display_bg");
  eq(roles.display_fg, roles.ansi_14, "display_fg");
  eq(roles.display_ghost, roles.ansi_6, "display_ghost");
});

test("fonts are the ones the spec's Fonts section sets", () => {
  // Bold markers dropped: the spec bolds font names.
  const fonts = (spec.split("\n## Fonts")[1]?.split("\n## ")[0] ?? "").replaceAll("**", "");
  const { work, frame } = theme.fonts;
  const sets = (text, what) => {
    if (!fonts.includes(text)) throw new Error(`${what}: the spec's Fonts section doesn't set ${text}`);
  };
  sets(`Fallback | ${work.family.join(" → ")}`, "work family");
  sets(`font-size = ${work.ghostty_size}`, "work ghostty_size");
  sets(`editor.fontSize: ${work.vscode_size}`, "work vscode_size");
  sets(`${frame.family} Regular ${frame.size}`, "frame family and size");
  sets(`use ${frame.bold}`, "frame bold");
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
