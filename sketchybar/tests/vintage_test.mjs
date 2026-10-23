// Checks for each Theme's SketchyBar Frame palette, which JankyBorders shares (#136).
// Run: node sketchybar/tests/vintage_test.mjs
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { themes } from "../../themes/generate.mjs";

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

// Every $frame_* variable the bar and JankyBorders use.
const users = [
  "sketchybar/sketchybarrc",
  ...readdirSync(join(root, "sketchybar/layouts")).map((file) => `sketchybar/layouts/${file}`),
  "sketchybar/bevel.sh",
  ...readdirSync(join(root, "sketchybar/plugins")).map((file) => `sketchybar/plugins/${file}`),
  "borders/bordersrc",
];
const used = new Set(users.flatMap((path) => [...read(path).matchAll(/\$\{?(frame_\w+)/g)].map((m) => m[1])));

for (const { id, theme } of themes(root)) {
  const path = `sketchybar/themes/${id}.sh`;
  // Every role the Theme defines, with its hex, from its Theme source file.
  const roles = Object.assign({}, ...Object.values(theme.palettes));
  const palette = new Map([...read(path).matchAll(/^export (\w+)="(0x\w+)"/gm)].map((m) => [m[1], m[2]]));

  test(`${id}: each variable is its role's color, opaque, as 0xAARRGGBB`, () => {
    for (const [name, value] of palette) {
      if (!roles[name]) throw new Error(`${name} isn't a role of ${theme.name}`);
      eq(value, `0xff${roles[name].slice(1).toLowerCase()}`, name);
    }
  });

  test(`${id}: defines every role the bar and JankyBorders use`, () => {
    const missing = [...used].filter((name) => !palette.has(name));
    if (missing.length) throw new Error(`not in ${path}: ${missing.join(", ")}`);
  });
}

// Each Theme's JankyBorders, as its spec sets them: Vintage's in
// docs/theme-spec.md (#15), Marigold's in docs/theme-spec-marigold.md (#152).
const specs = {
  vintage: { style: "square", width: 4, active: "frame_face", inactive: "frame_shadow" },
  marigold: { style: "round", width: 2, active: "frame_selection", inactive: "frame_shadow" },
};

for (const [id, { style, ...borders }] of Object.entries(specs)) {
  test(`${id}: its Theme source file's borders are its spec's`, () => {
    const theme = themes(root).find((t) => t.id === id).theme;
    eq(JSON.stringify(theme.borders), JSON.stringify(borders), `themes/${id}.json borders`);
  });
}

for (const { id, theme } of themes(root)) {
  test(`${id}: JankyBorders' style, width and colors are its Theme's (#152)`, () => {
    const options = new Map([...read(`sketchybar/themes/${id}.sh`).matchAll(/^export (border_\w+)="([^"]*)"/gm)].map((m) => [m[1], m[2]]));
    const { width, active, inactive } = theme.borders;
    eq(options.get("border_style"), specs[id]?.style, `${id} border_style`);
    eq(options.get("border_width"), width.toFixed(1), `${id} border_width`);
    eq(options.get("border_active_color"), `$${active}`, `${id} border_active_color`);
    eq(options.get("border_inactive_color"), `$${inactive}`, `${id} border_inactive_color`);
  });

  test(`${id}: defines every border option bordersrc uses, and every role they name`, () => {
    const text = read(`sketchybar/themes/${id}.sh`);
    const defined = new Set([...text.matchAll(/^export (\w+)=/gm)].map((m) => m[1]));
    const needed = [...read("borders/bordersrc").matchAll(/\$\{?(border_\w+)/g)].map((m) => m[1]);
    const named = [...text.matchAll(/^export border_\w+="\$(\w+)"/gm)].map((m) => m[1]);
    const missing = [...needed, ...named].filter((name) => !defined.has(name));
    if (missing.length) throw new Error(`not in sketchybar/themes/${id}.sh: ${missing.join(", ")}`);
  });
}

test("bordersrc takes every option but hidpi from the active Theme's palette, not a Theme's name", () => {
  const bordersrc = read("borders/bordersrc");
  for (const option of ["style", "width", "active_color", "inactive_color"]) {
    if (!bordersrc.includes(`${option}="$border_${option}"`)) throw new Error(`bordersrc doesn't set ${option} from $border_${option}`);
  }
  for (const { id } of themes(root)) {
    if (bordersrc.includes(id)) throw new Error(`bordersrc names the ${id} Theme`);
  }
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
