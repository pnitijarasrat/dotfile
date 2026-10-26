// Checks that sketchybar/icon_map.sh and fonts/sketchybar-app-font.ttf, the
// font fonts/install.sh installs for the Marigold theme's app icons, come from
// the same sketchybar-app-font release (#175). A map from another release can
// name glyphs the font doesn't have.
// Run: node sketchybar/tests/app_font_test.mjs
import { existsSync, readFileSync } from "node:fs";
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

const fontPath = join(root, "fonts/sketchybar-app-font.ttf");

// The release the vendored map's header names, as "3.0.13".
function mapRelease() {
  const header = readFileSync(join(root, "sketchybar/icon_map.sh"), "utf8").split("### START-OF-ICON-MAP")[0];
  const match = header.match(/releases\/tag\/v(\d+\.\d+\.\d+)/);
  if (!match) throw new Error("icon_map.sh's header names no release");
  return match[1];
}

// The font's version string (name ID 5), as "Version 3.0.13". A TrueType font
// opens with a 12-byte header, then a 16-byte record per table (tag, checksum,
// offset, length). The name table holds a count, where its strings start, and
// 12-byte records (platform, encoding, language, name ID, length, offset).
// Only the Mac record (platform 1) is read, as its string is plain Latin-1;
// svg2ttf, which builds this font, writes one.
function fontVersion(path) {
  const font = readFileSync(path);
  for (let i = 0; i < font.readUInt16BE(4); i++) {
    const record = 12 + i * 16;
    if (font.toString("latin1", record, record + 4) !== "name") continue;
    const table = font.readUInt32BE(record + 8);
    const strings = table + font.readUInt16BE(table + 4);
    for (let j = 0; j < font.readUInt16BE(table + 2); j++) {
      const [platform, , , id, length, offset] = [0, 2, 4, 6, 8, 10].map((k) => font.readUInt16BE(table + 6 + j * 12 + k));
      if (id !== 5 || platform !== 1) continue;
      return font.toString("latin1", strings + offset, strings + offset + length);
    }
  }
  throw new Error("the font has no version string");
}

test("fonts/ holds sketchybar-app-font, so fonts/install.sh installs it", () => {
  if (!existsSync(fontPath)) throw new Error("fonts/sketchybar-app-font.ttf is missing");
});

test("the vendored icon map is from the font's release", () => {
  const release = mapRelease();
  const version = fontVersion(fontPath);
  if (version !== `Version ${release}`) throw new Error(`icon_map.sh is from v${release}, the font says ${JSON.stringify(version)}`);
});

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
