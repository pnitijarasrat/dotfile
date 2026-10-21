// Checks for the Theme generator, themes/generate.mjs (#132).
// Run: node themes/tests/generate_test.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generate, ghostty } from "../generate.mjs";

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

// A small Theme with only the roles Ghostty takes, and its Ghostty theme
// written by hand.
const tiny = JSON.parse(read("themes/tests/fixtures/tiny.json"));

test("generates a Ghostty theme for any Theme source file", () => {
  eq(ghostty("tiny", tiny), read("themes/tests/fixtures/tiny.ghostty"), "ghostty/themes/tiny");
});

test("refuses a Theme missing a role Ghostty takes", () => {
  const { work_cursor, ...work } = tiny.palettes.work;
  const broken = { ...tiny, palettes: { ...tiny.palettes, work } };
  let message = "";
  try {
    ghostty("tiny", broken);
  } catch (err) {
    message = err.message;
  }
  if (!message.includes("work_cursor")) throw new Error(`expected an error naming work_cursor, got ${JSON.stringify(message)}`);
});

test("every committed generated file is what the generator produces", () => {
  const files = generate(root);
  if (!files.some((f) => f.path === "ghostty/themes/vintage")) throw new Error("generator doesn't produce ghostty/themes/vintage");
  for (const { path, text } of files) {
    if (read(path) !== text) throw new Error(`${path} is stale: run node themes/generate.mjs`);
  }
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
