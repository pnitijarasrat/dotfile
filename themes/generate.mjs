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

// SketchyBar's Frame palette for a Theme, which JankyBorders shares (#136):
// shell variables named after their roles, as 0xAARRGGBB.
export function sketchybar(id, theme) {
  const role = roles(theme);
  const line = (name, comment) => {
    const assignment = `export ${name}="0xff${role(name).slice(1).toLowerCase()}"`;
    // Comments line up one space past the longest assignment.
    return comment ? `${assignment.padEnd(37)} # ${comment}` : assignment;
  };
  return [
    "#!/bin/sh",
    "",
    `# ${theme.name} theme Frame palette, shared with JankyBorders (borders/bordersrc). Variable names`,
    "# are the Theme spec's role names (#8); one hex can play several roles.",
    `# Roles from docs/theme-spec.md, values from themes/${id}.json`,
    line("frame_face"),
    line("frame_highlight", "outer top-left bevel"),
    line("frame_light", "inner top-left bevel; pushed-in button face"),
    line("frame_shadow", "inner bottom-right bevel"),
    line("frame_dark_shadow", "outer bottom-right bevel"),
    line("frame_text"),
    line("frame_gray_text"),
    line("frame_selection"),
    line("frame_selection_text"),
    "",
    "# Frame data colors: data on grey, where Work surface brights are unreadable.",
    ...["red", "green", "yellow", "blue", "magenta", "cyan", "orange"].map((color) => line(`frame_data_${color}`)),
    "",
  ].join("\n");
}

// VSCode's color theme for a Theme: themes/templates/vscode-color-theme.jsonc,
// which is Vintage's with each value a {{role}}, plus {{name}} and {{type}}.
// Its prose comments describe Vintage. Lines set to {{no_shadow}} turn a shadow
// off; a Theme with shadows drops them and keeps VSCode's own.
export function vscode(theme) {
  if (typeof theme.shadows !== "boolean") throw new Error(`${theme.name} doesn't say whether it has shadows`);
  const role = roles(theme);
  const vars = { name: JSON.stringify(theme.name).slice(1, -1), type: vscodeType(theme), no_shadow: "#00000000" };
  return template("vscode-color-theme.jsonc")
    .split("\n")
    .filter((line) => !(theme.shadows && line.includes("{{no_shadow}}")))
    .join("\n")
    .replace(/\{\{(\w+)\}\}/g, (_, name) => vars[name] ?? role(name));
}

// The workbench is mostly Frame, so a Theme is light or dark by its frame_face.
function vscodeType(theme) {
  const [r, g, b] = roles(theme)("frame_face").match(/\w\w/g).map((hex) => parseInt(hex, 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 127 ? "light" : "dark";
}

// The local VSCode extension's package.json, contributing every Theme's color
// theme under the Theme's name.
export function vscodeExtension(all) {
  const entry = ({ id, theme }) =>
    [
      "      {",
      `        "label": ${JSON.stringify(theme.name)},`,
      `        "uiTheme": "${vscodeType(theme) === "light" ? "vs" : "vs-dark"}",`,
      `        "path": "./themes/${id}-color-theme.json"`,
      "      }",
    ].join("\n");
  return template("vscode-package.json").replace("{{themes}}", all.map(entry).join(",\n"));
}

function template(file) {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "templates", file), "utf8");
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
  const all = themes(root);
  return [
    ...all.map(({ id, theme }) => ({ path: `ghostty/themes/${id}`, text: ghostty(id, theme) })),
    ...all.map(({ id, theme }) => ({ path: `sketchybar/themes/${id}.sh`, text: sketchybar(id, theme) })),
    ...all.map(({ id, theme }) => ({ path: `vscode/vintage-theme/themes/${id}-color-theme.json`, text: vscode(theme) })),
    { path: "vscode/vintage-theme/package.json", text: vscodeExtension(all) },
  ];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  for (const { path, text } of generate(root)) {
    writeFileSync(join(root, path), text);
    console.log(`wrote ${path}`);
  }
}
