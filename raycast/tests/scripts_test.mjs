// Checks for the Raycast Script Commands (#125).
// Run: node raycast/tests/scripts_test.mjs
import { accessSync, constants, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

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

for (const tool of ["yabai", "skhd"]) {
  const path = join(root, `raycast/scripts/restart-${tool}.sh`);

  test(`restart-${tool}.sh is a Script Command titled "Restart ${tool}"`, () => {
    accessSync(path, constants.X_OK);
    const text = readFileSync(path, "utf8");
    const meta = Object.fromEntries([...text.matchAll(/^# @raycast\.(\w+) (.*)$/gm)].map((m) => [m[1], m[2]]));
    eq(meta.schemaVersion, "1", "schemaVersion");
    eq(meta.title, `Restart ${tool}`, "title");
    eq(meta.mode, "silent", "mode");
    if (!text.includes(`/opt/homebrew/bin/${tool} --restart-service`)) {
      throw new Error(`doesn't run /opt/homebrew/bin/${tool} --restart-service`);
    }
  });
}

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
