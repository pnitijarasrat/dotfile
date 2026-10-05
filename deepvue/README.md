# Deepvue

Deepvue's charts in the **Vintage theme** ([#50](https://github.com/pnitijarasrat/dotfile/issues/50)). Deepvue keeps its settings in the account, not in a file, so this is a checklist to type in by hand. The chart pane is a **Work surface**; see the Deepvue row in `docs/theme-spec.md`.

## Settings

1. App settings: keep **light mode**. If you switch between light and dark, answer **No** to the reset prompt, or the chart colors below are replaced by Deepvue's defaults.
2. Chart settings, chart type candles:

| Setting | Hex | Role |
|---|---|---|
| Background | `#FFFFFF` | `work_bg` |
| Grid lines | `#C0C0C0` | `work_grid` |
| Scale text | `#808080` | `work_line_number` |
| Candle up: body, wick, border | `#008000` | `frame_data_green` |
| Candle down: body, wick, border | `#800000` | `frame_data_red` |
| Volume up | `#008000` | `frame_data_green` |
| Volume down | `#800000` | `frame_data_red` |
| Crosshair | `#808080` | `work_line_number` |

3. Indicators:

| Indicator | Hex | Role |
|---|---|---|
| EMA 10 | `#000080` | `work_fg` |
| EMA 21 | `#008080` | `syntax_function` |
| SMA 50 | `#800080` | `syntax_number` |
| SMA 200 | `#000000` | `ansi_0` |
| RS line | `#804000` | `syntax_constant` |

4. Save it as a chart template so new charts start from it.

A new indicator takes the next unused dark VGA color from the spec's Syntax roles (`syntax_keyword` `#808000` is free). Keep green and red for up and down only.
