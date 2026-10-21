// Checks for `theme`, themes/theme.mjs, which makes a Switch (#133). Runs it
// against a scratch copy of the repo with Ghostty's reload stubbed, so no open
// window changes.
// Run: node themes/tests/theme_test.mjs
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../theme.mjs";

const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

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

// A scratch repo with two Themes, Vintage and the tiny fixture, and no Switch
// made yet.
function scratch() {
  const root = mkdtempSync(join(tmpdir(), "theme-"));
  mkdirSync(join(root, "themes"));
  mkdirSync(join(root, "ghostty/themes"), { recursive: true });
  copyFileSync(join(repo, "themes/vintage.json"), join(root, "themes/vintage.json"));
  copyFileSync(join(repo, "themes/tests/fixtures/tiny.json"), join(root, "themes/tiny.json"));
  copyFileSync(join(repo, "ghostty/themes/vintage"), join(root, "ghostty/themes/vintage"));
  copyFileSync(join(repo, "themes/tests/fixtures/tiny.ghostty"), join(root, "ghostty/themes/tiny"));
  return root;
}

// Runs `theme` with args in a scratch repo, counting Ghostty reloads.
function theme(root, ...args) {
  let reloads = 0;
  const result = run({ root, args, reload: () => reloads++ });
  return { ...result, reloads };
}

const read = (root, path) => (existsSync(join(root, path)) ? readFileSync(join(root, path), "utf8") : undefined);

test("switching records the active Theme, points Ghostty at it and reloads Ghostty", () => {
  const root = scratch();
  const result = theme(root, "tiny");
  eq(result.code, 0, "exit code");
  eq(read(root, "themes/active"), "tiny\n", "themes/active");
  eq(read(root, "ghostty/active-theme"), "theme = tiny\n", "ghostty/active-theme");
  eq(result.reloads, 1, "Ghostty reloads");
  rmSync(root, { recursive: true });
});

test("an unknown Theme changes nothing and lists the available Themes", () => {
  const root = scratch();
  theme(root, "tiny");
  const result = theme(root, "dracula");
  eq(result.code, 1, "exit code");
  eq(result.out, "No Theme named dracula. Available Themes:\n  tiny\n  vintage\n", "output");
  eq(read(root, "themes/active"), "tiny\n", "themes/active");
  eq(read(root, "ghostty/active-theme"), "theme = tiny\n", "ghostty/active-theme");
  eq(result.reloads, 0, "Ghostty reloads");
  rmSync(root, { recursive: true });
});

test("with no name, prints the active Theme and changes nothing", () => {
  const root = scratch();
  const before = theme(root);
  eq(before.code, 0, "exit code before any Switch");
  eq(before.out, "vintage\n", "active Theme before any Switch");
  eq(read(root, "themes/active"), undefined, "themes/active before any Switch");
  theme(root, "tiny");
  const after = theme(root);
  eq(after.out, "tiny\n", "active Theme after switching to tiny");
  eq(after.reloads, 0, "Ghostty reloads");
  rmSync(root, { recursive: true });
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
