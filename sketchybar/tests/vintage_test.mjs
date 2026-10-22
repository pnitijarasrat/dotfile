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

test("JankyBorders: active frame_face, inactive frame_shadow (#15)", () => {
  const bordersrc = read("borders/bordersrc");
  for (const option of ['active_color="$frame_face"', 'inactive_color="$frame_shadow"']) {
    if (!bordersrc.includes(option)) throw new Error(`bordersrc doesn't set ${option}`);
  }
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
