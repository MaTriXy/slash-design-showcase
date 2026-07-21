# Brick Breaking: one prompt, five models

> ### Try this benchmark yourself — with Command Code
> This benchmark was built in one-shot with [`/design`](https://commandcode.ai/docs/slash-commands/design) in [Command Code](https://commandcode.ai).
>
> **How to run this exact benchmark:**
> 1. Install Command Code:
>    ```bash
>    npm i -g command-code
>    ```
>    Quickstart: [commandcode.ai/docs/quickstart](https://commandcode.ai/docs/quickstart) · npm: [command-code](https://www.npmjs.com/package/command-code) · [`/design` command](https://commandcode.ai/docs/slash-commands/design)
> 2. Start Command Code (`cmd` on mac/linux, `cmdc` on windows, or `commandcode` anywhere), then run `/design` and paste the prompt below
> 3. Use Command Code to generate and compare — same prompt, one shot per model
>
> Built with [Command Code](https://x.com/CommandCodeAI)
> Showcase: [CommandCodeAI/slash-design-showcase](https://github.com/CommandCodeAI/slash-design-showcase)
> Docs: [commandcode.ai/docs/slash-commands/design](https://commandcode.ai/docs/slash-commands/design)
>
> **Seen on X — Game UX Tests (from main README):**
> - [DeepSeek V4 Pro vs GLM 5.2 vs Fable 5](https://x.com/MrAhmadAwais/status/2074536879308026031)
> - [DeepSeek V4 Pro vs GLM 5.2 vs Fable 5](https://x.com/naymur_dev/status/2073059979834331206)
> - [Fable 5 vs GPT-5.5 vs GLM 5.2 vs DeepSeek V4 Pro](https://x.com/naymur_dev/status/2074533456709825022)

## Prompt

> Create a complete single HTML file for a neon breakout / brick breaker game using Canvas. Neon cyberpunk aesthetic with glowing bricks, mouse or touch to move paddle, ball with trail effect, particle explosions on brick break, score, lives, start and game over screens. Make it visually striking with glow effects and smooth gameplay. Output only the full code.

## Models

| Model | Dir | Cost/gen | LOC |
|---|---|---:|---:|
| DeepSeek V4 Pro | `DeepSeek-V4-Pro/` | est. $0.0017 | 575 |
| Fable 5 (Claude) | `Fable-5/` | est. $0.60 | 513 |
| GLM 5.2 | `GLM-5.2/` | est. $0.03 | 592 |
| GPT-5.5 | `GPT-5.5/` | est. $0.35 | 400 |
| Kimi K3 | `Kimi-K3/` | est. $0.10 | 953 |
| GPT-5.6 Sol (OpenAI) | `GPT-5.6-sol/` | est. $0.52 | 768 |
| Gemini 3.6 Flash | `gemini-3.6-flash/` | est. $0.45 (~5 prompts) | 1311 |

Single generation per model, one prompt, no re-rolls. Cost figures are estimates from published API pricing applied to output length plus `/design` overhead. Gemini 3.6 Flash is the exception: it did not produce a playable game in one shot, soI its figure is a cumulative estimate across ~4-5 follow-up prompts (Gemini 3.6 Flash pricing: $1.50 / $7.50 per 1M input/output tokens). Kimi K3's estimate uses the same formula as the others here (kept file's output bytes ÷ 4 × its published $15.00/MTok output rate, the same rate cited elsewhere in this repo): `Kimi-K3/index.html` is 953 LOC / 27,853 bytes → 6,963 tokens × $15/MTok = **$0.1044**.

**GPT-5.5 ($0.35) and GPT-5.6 Sol ($0.52) are both above the formula-based floor for their real files** (`GPT-5.5/index.html`: 400 LOC/8,285 bytes → floor $0.0621; `GPT-5.6-sol/index.html`: 768 LOC/25,449 bytes → floor $0.1909), the same gap seen elsewhere in this repo between a pure output-token floor and real generation cost once reasoning and input tokens are counted. GPT-5.6 Sol costing more than GPT-5.5 here is consistent with both the floor ordering and with it being the larger, newer build (768 vs. 400 LOC).

Like the other non-Gemini figures in this table, all of these are one-shot floors — output tokens for the kept file only, no reasoning or input tokens counted, so real cost is likely somewhat higher across the board.

## Method

Same benchmark harness as the other game benchmarks: one prompt, one shot per model, static read + playtest comparison.

## Verdict

Five implementations of the same neon breakout brief. Same pattern as the other game benchmarks: try the same prompt yourself with [Command Code](https://commandcode.ai) `/design` — [commandcode.ai/docs/slash-commands/design](https://commandcode.ai/docs/slash-commands/design) — and compare.

**Gemini 3.6 Flash** took a different path: the one-shot output from the prompt above wasn't playable, and it took 4-5 follow-up prompts to land a working build — the only model in this set that needed real iteration to get there. What it landed on is genuinely unique, though: falling coin power-ups dropped from broken bricks, including one that widens the paddle and one that boosts ball speed. No other model in this benchmark added a coin-drop power-up system at all.

## How to Play

- Move mouse to control paddle
- Click to launch ball / start / continue
- Break all bricks to win, don't let the ball fall

All demos are fully offline-safe, single HTML files.
