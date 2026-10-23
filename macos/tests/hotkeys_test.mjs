// Checks for the macOS hotkeys script (#125, owners in #114).
// Runs macos/hotkeys.sh against a scratch plist, never the live prefs.
// Run: node macos/tests/hotkeys_test.mjs
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
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

// Modifier masks as macOS stores them in com.apple.symbolichotkeys.
const cmd = 0x100000;
const meh = 0x20000 | 0x40000 | 0x80000; // ctrl+alt+shift
const hyper = meh | 0x100000;

const scratch = mkdtempSync(join(tmpdir(), "hotkeys-"));
const domain = join(scratch, "symbolichotkeys"); // defaults adds .plist
const plist = `${domain}.plist`;

const run = () =>
  execFileSync("sh", [join(root, "macos/hotkeys.sh")], { env: { ...process.env, HOTKEYS_DOMAIN: domain } });
const hotkeys = () =>
  JSON.parse(execFileSync("plutil", ["-convert", "json", "-o", "-", plist], { encoding: "utf8" })).AppleSymbolicHotKeys;
function expect(id, enabled, params) {
  const { enabled: on, value } = hotkeys()[id];
  eq(`${on} ${value.type} ${value.parameters}`, `${enabled} standard ${params}`, `hotkey ${id}`);
}

// Entries the script doesn't own, to check they survive: 98, and Desktop 1
// on ⌘1, which the user sets by hand.
const desktop1 = "<dict><key>enabled</key><true/><key>value</key><dict><key>parameters</key><array><integer>49</integer><integer>18</integer><integer>1048576</integer></array><key>type</key><string>standard</string></dict></dict>";
execFileSync("defaults", ["write", domain, "AppleSymbolicHotKeys", "-dict-add", "98", "<dict><key>enabled</key><true/></dict>"]);
execFileSync("defaults", ["write", domain, "AppleSymbolicHotKeys", "-dict-add", "118", desktop1]);
run();

test("input source (60) on cmd+Space, Spotlight (64) off", () => {
  expect("60", true, [32, 49, cmd]);
  eq(hotkeys()["64"].enabled, false, "hotkey 64 enabled");
});

test("screenshots on Hyper+3 / 4 / 5", () => {
  expect("28", true, [51, 20, hyper]);
  expect("30", true, [52, 21, hyper]);
  expect("184", true, [53, 23, hyper]);
});

test("Desktop 1-10 (118-127) are the user's: left alone", () => {
  expect("118", true, [49, 18, cmd]);
  for (let id = 119; id <= 127; id++) eq(hotkeys()[String(id)], undefined, `hotkey ${id}`);
});

test("Move focus to next window (27) off", () => {
  eq(hotkeys()["27"].enabled, false, "hotkey 27 enabled");
});

test("entries the script doesn't own are left alone", () => {
  eq(JSON.stringify(hotkeys()["98"]), JSON.stringify({ enabled: true }), "hotkey 98");
});

test("a second run changes nothing", () => {
  const before = readFileSync(plist);
  run();
  eq(readFileSync(plist).equals(before), true, "plist unchanged");
});

rmSync(scratch, { recursive: true });

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
