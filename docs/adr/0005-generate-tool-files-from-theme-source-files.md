# Generate tool files from Theme source files, and commit them

Supersedes the "no generator" verdict of #8.

#8 chose hand-written tool files with no generator: there was one look, its palette rarely changed, and a generator would only save re-typing hex values. **Themes** change that (ADR 0004). Each new Theme would need every tool's file written again by hand, and a **Switch** needs one file per Theme per tool. So `themes/generate.mjs` now writes each tool's files from every **Theme source file** in `themes/`, starting with Ghostty's (`ghostty/themes/<name>`, #132). Later tools join it one ticket at a time.

The generated files stay committed, so the repo works without running anything and a diff shows exactly what a Theme change does to each tool. `themes/tests/generate_test.mjs` fails if a committed file isn't what the generator produces, and checks the generator against a small fixture Theme. The output keeps the hand-written style: raw hex, each line commented with its role name. For Vintage the switch-over produced no diff.

## Considered options

- **Keep hand-writing each tool's file**: rejected; it scales with Themes × tools, and nothing catches a file drifting from its source file.
- **Generate at Switch time, not commit the output**: rejected; tools would read files that only exist after a Switch, and a diff would no longer show a Theme change's effect.

## Consequences

- Generated files aren't edited by hand: change the Theme source file and run `node themes/generate.mjs`.
- Each tool's test runs once per Theme, against that Theme's source file, independently of the generator's own mapping.
- Starship, ccstatusline and ranger take named ANSI colors from Ghostty, so they need no generated output.
