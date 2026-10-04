// Opens raycast/vintage.rctheme.json in Raycast's theme import (#21), using
// the same raycast://theme link as "Add to Raycast" on themes.ray.so.
// Run: node raycast/import.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const path = join(dirname(fileURLToPath(import.meta.url)), "vintage.rctheme.json");
const { version, name, appearance, colors } = JSON.parse(readFileSync(path, "utf8"));

// Raycast reads the colors by position, in this order.
const order = ["background", "backgroundSecondary", "text", "selection", "loader", "red", "orange", "yellow", "green", "blue", "purple", "magenta"];
const params = Object.entries({ version, name, appearance }).map(([k, v]) => `${k}=${encodeURIComponent(v)}`);
params.push(`colors=${order.map((slot) => encodeURIComponent(colors[slot])).join(",")}`);
const url = `raycast://theme?${params.join("&")}`;

console.log(url);
execFileSync("open", [url]);
