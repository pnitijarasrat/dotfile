// Generates each tool's theme files from the Theme source files in themes/ (#132).
// Run: node themes/generate.mjs
// Generated files are committed; themes/tests/generate_test.mjs fails if one is stale.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Every role the Theme defines, with its hex. Throws on a role the Theme lacks.
function roles(theme) {
  const all = Object.assign({}, ...Object.values(theme.palettes));
  return (name) => {
    if (!all[name]) throw new Error(`${theme.name} has no role ${name}`);
    return all[name];
  };
}

// Ghostty's theme for a Theme: the Work surface and ANSI colors, each line
// commented with its role name (Ghostty has no trailing comments).
export function ghostty(id, theme) {
  const role = roles(theme);
  const line = (key, name, value = role(name)) => `# ${name}\n${key} = ${value}`;
  const palette = (n) => line("palette", `ansi_${n}`, `${n}=${role(`ansi_${n}`)}`);
  return [
    `# ${theme.name} theme: Work surface (${theme.work_description})`,
    `# Roles from docs/theme-spec.md, values from themes/${id}.json`,
    "# Ghostty has no trailing comments, so each role name is on the line above its value",
    line("background", "work_bg"),
    line("foreground", "work_fg"),
    "",
    line("cursor-color", "work_cursor"),
    line("cursor-text", "work_cursor_text"),
    line("selection-background", "work_selection"),
    line("selection-foreground", "work_selection_text"),
    "",
    "# Normal colors (0-7)",
    ...[0, 1, 2, 3, 4, 5, 6, 7].map(palette),
    "",
    "# Bright colors (8-15)",
    ...[8, 9, 10, 11, 12, 13, 14, 15].map(palette),
    "",
  ].join("\n");
}

// Every Theme source file in themes/, as { id, theme }, where id is its file
// name without .json.
export function themes(root) {
  return readdirSync(join(root, "themes"))
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => ({
      id: file.replace(/\.json$/, ""),
      theme: JSON.parse(readFileSync(join(root, "themes", file), "utf8")),
    }));
}

// Every generated file, as { path, text } with path relative to root.
export function generate(root) {
  return themes(root).map(({ id, theme }) => ({ path: `ghostty/themes/${id}`, text: ghostty(id, theme) }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  for (const { path, text } of generate(root)) {
    writeFileSync(join(root, path), text);
    console.log(`wrote ${path}`);
  }
}
