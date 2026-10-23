// Generates each tool's theme files from the Theme source files in themes/ (#132).
// Run: node themes/generate.mjs
// Generated files are committed; themes/tests/generate_test.mjs fails if one is stale.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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

// Ghostty's theme for a Theme: the Work surface and ANSI colors, then the
// window's shape from its Theme rules (#151), each line commented with its
// role or rule name (Ghostty has no trailing comments). A theme file can set
// any option, so the window settings live here, not in ghostty/config.
export function ghostty(id, theme) {
  if (!theme.rules) throw new Error(`${theme.name} has no Theme rules`);
  const role = roles(theme);
  const line = (key, name, value = role(name)) => `# ${name}\n${key} = ${value}`;
  const palette = (n) => line("palette", `ansi_${n}`, `${n}=${role(`ansi_${n}`)}`);
  const { opacity, blur, radius } = theme.rules;
  // Ghostty can't set a corner radius. Rounded corners keep macOS's window
  // frame and hide its title bar; square ones drop the frame altogether.
  const rounded = radius > 0;
  return [
    `# ${theme.name} theme: Work surface (${theme.work_description})`,
    `# Roles from docs/theme-spec.md, values from themes/${id}.json`,
    "# Ghostty has no trailing comments, so each role or rule name is on the line above its value",
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
    "# Window shape, from the Theme rules",
    line("background-opacity", "opacity", opacity),
    line("background-blur", "blur", blur),
    line("window-decoration", `radius: ${rounded ? "rounded corners, no title bar" : "square corners, no window frame"}`, rounded ? "auto" : "none"),
    line("macos-titlebar-style", "radius", rounded ? "hidden" : "transparent"),
    "",
  ].join("\n");
}

// SketchyBar's Frame palette for a Theme, which JankyBorders shares (#136):
// shell variables named after their roles, as 0xAARRGGBB. It ends with
// JankyBorders' options (#152), so bordersrc reads them instead of asking
// which Theme is active, then the bar's opacity and blur from the Theme's
// bar (#169), and its border and corners from the active window's ring (#183).
export function sketchybar(id, theme) {
  if (!theme.rules) throw new Error(`${theme.name} has no Theme rules`);
  if (!theme.borders) throw new Error(`${theme.name} has no borders for JankyBorders`);
  if (!theme.bar) throw new Error(`${theme.name} has no bar for SketchyBar`);
  const role = roles(theme);
  const { width, active, inactive } = theme.borders;
  const { opacity, blur } = theme.bar;
  const { radius } = theme.rules;
  for (const name of [active, inactive]) {
    if (!theme.palettes.frame?.[name]) throw new Error(`${theme.name}'s border color ${name} isn't one of its Frame roles`);
  }
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
    "# JankyBorders: style from the radius rule, width and colors from the Theme's borders.",
    `export border_style="${radius > 0 ? "round" : "square"}"`,
    `export border_width="${width.toFixed(1)}"`,
    `export border_active_color="$${active}"`,
    `export border_inactive_color="$${inactive}"`,
    "",
    "# SketchyBar: the opacity and blur of a Theme's own bar (#169), from its source",
    "# file's bar. The alpha is opacity as two hex digits, for 0xAARRGGBB colors.",
    "# The bar wears the active window's ring (#183): JankyBorders' active color and",
    "# width, and corners that curve like the ring's outline, the radius rule plus",
    "# the width; square Themes stay square. Popups keep the window corners, the",
    "# radius rule.",
    `export bar_alpha="${Math.round(opacity * 255).toString(16).padStart(2, "0")}"`,
    `export bar_blur="${blur}"`,
    `export bar_border_color="$${active}"`,
    `export bar_border_width="${width}"`,
    `export bar_radius="${radius > 0 ? radius + width : 0}"`,
    `export popup_radius="${radius}"`,
    "",
  ].join("\n");
}

// VSCode's color theme for a Theme: themes/templates/vscode-color-theme.jsonc,
// which is Vintage's with each value a {{role}}, plus {{name}} and {{type}}.
// Its prose comments describe Vintage. Lines set to {{no_shadow}} turn a shadow
// off; a Theme with shadows drops them and keeps VSCode's own. $selection is
// the role the Theme's vscode.selection chooses for the editor selection, match
// highlights and matched completion letters (ADR 0011).
export function vscode(theme) {
  if (typeof theme.shadows !== "boolean") throw new Error(`${theme.name} doesn't say whether it has shadows`);
  const selection = theme.vscode?.selection;
  if (!selection) throw new Error(`${theme.name} doesn't say which role VSCode's selection takes`);
  const role = roles(theme);
  const vars = { name: JSON.stringify(theme.name).slice(1, -1), type: vscodeType(theme), no_shadow: "#00000000" };
  return template("vscode-color-theme.jsonc")
    .split("\n")
    .filter((line) => !(theme.shadows && line.includes("{{no_shadow}}")))
    .join("\n")
    .replaceAll("$selection", selection)
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

// Chrome's theme extension for a Theme: themes/templates/chrome-manifest.json,
// which is Vintage's with each color a {{role}}, plus {{name}}. Chrome only
// takes [r, g, b] arrays, so the manifest has no hex and no role comments.
export function chrome(theme) {
  const role = roles(theme);
  const rgb = (name) => `[${role(name).match(/\w\w/g).map((hex) => parseInt(hex, 16)).join(", ")}]`;
  const vars = { name: JSON.stringify(theme.name).slice(1, -1) };
  return template("chrome-manifest.json").replace(/\{\{(\w+)\}\}/g, (_, name) => vars[name] ?? rgb(name));
}

// Starship's segment symbols: the plain word, and the Nerd Font icon a Theme
// whose rules allow icons shows in its place.
const starshipSymbols = [
  ["c", "C ", "\ue61e "],
  ["dart", "dart ", "\ue798 "],
  ["dotnet", ".NET ", "\u{f0aae} "],
  ["git_branch", "git ", "\uf418 "],
  ["golang", "go ", "\ue627 "],
  ["java", "java ", "\ue256 "],
  ["lua", "lua ", "\ue620 "],
  ["nodejs", "nodejs ", "\ue718 "],
  ["php", "php ", "\ue608 "],
  ["python", "py ", "\ue235 "],
];

// Starship's prompt for a Theme (#154): the same segments for every Theme, in
// named ANSI colors so Ghostty's theme colors them. A Theme whose rules allow
// icons gets Nerd Font icons on the directory, branch and runtimes; one that
// doesn't gets words, and keeps Starship's own directory.
export function starship(id, theme) {
  const icons = theme.rules?.icons;
  if (typeof icons !== "boolean") throw new Error(`${theme.name} doesn't say in its Theme rules whether it has icons`);
  return [
    `# ${theme.name} theme's Starship prompt (#154): named ANSI colors, inherited from Ghostty.`,
    `# Generated from themes/${id}.json; icons follow its rules.icons.`,
    "add_newline = true",
    "",
    "[character]",
    'success_symbol = "[>](bold green)"',
    'error_symbol = "[>](bold red)"',
    'vimcmd_symbol = "[<](bold green)"',
    "",
    ...(icons
      ? ["[directory]", 'format = "[\uf07c $path]($style)[$read_only]($read_only_style) "', 'read_only = " \u{f033e}"', ""]
      : []),
    "[git_commit]",
    `tag_symbol = "${icons ? " \uf412 " : " tag "}"`,
    "",
    "[git_status]",
    'ahead = ">"',
    'behind = "<"',
    'diverged = "<>"',
    'renamed = "r"',
    'deleted = "x"',
    "",
    "[os.symbols]",
    "",
    "[package]",
    "disabled = true",
    "",
    ...starshipSymbols.flatMap(([module, word, icon]) => [`[${module}]`, `symbol = "${icons ? icon : word}"`, ""]),
  ].join("\n");
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
    ...all.map(({ id, theme }) => ({ path: `chrome/${id}-theme/manifest.json`, text: chrome(theme) })),
    ...all.map(({ id, theme }) => ({ path: `starship/themes/${id}.toml`, text: starship(id, theme) })),
  ];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  for (const { path, text } of generate(root)) {
    // A new Theme's Chrome extension needs its own folder.
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
    console.log(`wrote ${path}`);
  }
}
