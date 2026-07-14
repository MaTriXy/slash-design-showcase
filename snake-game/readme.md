# Snake Game: one prompt, four models

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

## Prompt

> Create a classic Snake game as a single HTML file using Canvas. Grid-based movement, arrow keys or on-screen touch buttons to steer, snake grows as it eats food, game ends on wall or self collision. Neon glow visual style, score display, high score, and a start screen plus game over screen with restart. Make it feel smooth and satisfying to play on both desktop and mobile. Output only the full code.

## Models

| Model | Dir | $/MTok in/out | LOC | Est. cost |
|---|---|---:|---:|---:|
| Muse Spark 1.1 (Meta) | `muse-spark-1.1/` | $1.25 / $4.25 | 885 | ~$0.06–$0.09 |
| Fable 5 (Claude) | `fable-5/` | $10 / $50 | 609 | ~$0.44–$0.66 |
| Grok 4.5 (xAI) | `grok-4.5/` | $2 / $6 | 597 | ~$0.05–$0.08 |
| GPT-5.6 Sol (OpenAI) | `gpt-5.6-sol/` | $5 / $30 | 630 | ~$0.40–$0.60 |

Each model was prompted 2–3 times before landing on the kept build (re-rolls, not a controlled A/B). Cost is a rough estimate: (kept file's output bytes ÷ 4) × published output price/MTok, then scaled ×2–×3 for the extra attempts. It only counts output tokens for the final generation's file size — no input tokens, no cost for the discarded re-roll attempts themselves — so treat it as a floor, not a metered figure.

## Method

This round is judged by hands-on play, not a static line-by-line code read: all four builds were played side by side on desktop and mobile. A quick code check confirms a few of the gameplay impressions below — it's a sanity check, not the basis for the verdict.

- **Muse Spark 1.1** is the only build with both an `AudioContext` SFX layer and real touch controls (6 touch-event bindings), which lines up with it feeling the most complete on mobile. It also independently landed on a neon/cyberpunk look (title `NEON • SNAKE`), same as two of the other three.
- **GPT-5.6 Sol** runs a `particles`/`trailParticles` system that fires on every food pickup — this is the "sparkle effect" that reads well on desktop but crowds a small mobile viewport.
- **Grok 4.5** and **Fable 5** ship neither audio nor `localStorage` high-score persistence in this generation — score resets on reload for both.
- All four converged on a 600×600 canvas and a neon aesthetic despite the prompt not mandating a specific color theme.

## Findings

- **Muse Spark 1.1** looks and plays the best of the four — best game feel and visual polish — but leans hardest into the cyberpunk look, which wasn't asked for outright.
- **Fable 5** is the smoothest-moving snake, but its turn handling while collecting points feels off — direction changes near food pickups aren't as clean as the other three.
- **Grok 4.5** is solid and correct but the least polished visually of the four.
- **GPT-5.6 Sol** adds a sparkle/particle burst on every point eaten; on mobile it briefly overwhelms the screen and hurts readability.

## Scorecard

Design + gameplay, scored 1–10 by hands-on play after 2–3 re-rolls per model, judged on the kept build.

| Model | Score |
|---|:-:|
| Muse Spark 1.1 | **9/10** |
| Fable 5 | **8/10** |
| Grok 4.5 | **7/10** |
| GPT-5.6 Sol | **7/10** |

## Verdict

**Muse Spark 1.1 wins.** Going in, GPT-5.6 Sol looked like the favorite — it's been strong on design lately — with Grok 4.5 and Fable 5 also expected to be competitive. Side by side, Muse Spark 1.1 stood out on both looks and moment-to-moment gameplay, at the cost of defaulting hard to a cyberpunk aesthetic rather than a more neutral neon treatment. Fable 5 is a close second: very smooth, held back only by rough turn handling around food pickups. Grok 4.5 is a dependable, correct build that simply isn't as polished. GPT-5.6 Sol's sparkle effect on eating is a nice idea that needs to be toned down for mobile, where it currently hurts readability.

## Limitations

- Each model was re-rolled 2–3 times; only the kept build per model was scored and reviewed, not every attempt. No variance estimate across attempts.
- Scores are a subjective design + gameplay judgment from hands-on play, not a measured benchmark like collision-detection or resize-robustness checks in other games in this repo.
- Cost figures are not metered: they're estimated from the kept file's output size and each model's published per-token API pricing, scaled ×2–×3 for the re-roll attempts, not billed usage. Input/prompt tokens and the discarded attempts' own output aren't separately counted, so real cost is likely somewhat higher than shown.
