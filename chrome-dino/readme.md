# Chrome Dino: one prompt, four models

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

> Create a modern stylish version of the Chrome Dino endless runner game (the one that appears when internet is lost) as a single HTML file using HTML5 Canvas. Use a wide horizontal canvas (800x400) for a side-view / front-facing running perspective.
> The player controls a cool modern T-Rex or futuristic dinosaur character with sleek animated running animation, jump, and duck. The character runs automatically to the right. Press space or up arrow to jump, down arrow to duck under obstacles.
> Graphics should be modern and vibrant: smooth high-quality pixel art or semi-realistic style, glowing effects, dynamic parallax background with futuristic city or neon desert landscape scrolling, nice clouds, mountains, and ground details. Add particle dust when running, nice jump arc with gravity physics.
> Obstacles include cacti, birds, and modern obstacles like broken robots or barriers. Collect glowing coins or energy orbs for score. Increasing speed over time. Show high score and current score at the top. Include a nice "No Internet" start screen with the dinosaur, game over screen with final score and restart button.
> Make the movement smooth with good physics, responsive controls, and overall polished addictive feel. Use requestAnimationFrame for 60fps. Output only the full working HTML code with everything inline.

## Models

| Model | Dir | $/MTok in/out | LOC | Re-rolls | Est. cost |
|---|---|---:|---:|:-:|---:|
| Muse Spark 1.1 (Meta) | `muse-spark-1.1/` | $1.25 / $4.25 | 911 | 2–3 | ~$0.10 |
| Fable 5 (Claude) | `fable-5/` | $10 / $50 | 938 | 1 (one-shot) | ~$0.38 |
| Grok 4.5 (xAI) | `grok-4.5/` | $2 / $6 | 1,270 | 2–3 | ~$0.15 |
| GPT-5.6 Sol (OpenAI) | `gpt-5.6-sol/` | $5 / $30 | 2,601 | 1 (one-shot) | ~$0.53 |

Cost is estimated as (kept file's output bytes ÷ 4) × published output price/MTok. Muse Spark 1.1 and Grok 4.5 needed 2–3 prompts to land on a working build, so their estimate is scaled for that re-roll cycle and locked to a single point estimate ($0.10 and $0.15) rather than shown as a range; Fable 5 and GPT-5.6 Sol were one-shot, so theirs is a single-generation cost with no multiplier. It only counts output tokens for the final kept file's size — no input tokens, no cost for the discarded re-roll attempts themselves — so treat all four as a floor, not a metered figure. GPT-5.6 Sol tops the table not because its per-token rate is highest (Fable 5's is, at $10/$50) but because its file is 2.4x longer than the next-biggest build (2,601 vs. 1,270 LOC).

## Method

**Hands-on playtest:** all four builds were actually played (via the `/design` command in Command Code), scored 1–10 across five parameters — dino speed, behavior, scoring, smoothness, and gameplay level — on the kept build per model.

**Static read:** all 5,720 lines across the four builds were also read directly, no skimming, to verify specific technical claims — physics timestep, resize handling, audio, persistence, touch wiring — each cited by file and line number below. The two methods agree on GPT-5.6 Sol as the strongest build overall, but disagree sharply on Muse Spark 1.1 and Fable 5.

## Findings

- **Hands-on play reverses the code-polish ranking for two of the four.** Muse Spark 1.1 has the best responsive-layout/touch/UI-polish story of any non-GPT build in the static read below, but played worst by far ("fast and hard," 6/10) once actually tested. Fable 5 has the worst technical hygiene of the four (frame-locked physics, no resize handling, no touch duck, no persisted high score) but played second-best ("fast," 8/10). Difficulty tuning and pacing — which don't show up in a code read — evidently matter more to how a build actually feels than the mobile/resize issues found below.
- **Physics timestep — only GPT-5.6 Sol scales gravity by real elapsed time.** `gameLoop` computes `dt` from `performance`-style timestamps (`gpt-5.6-sol/index.html:2588`) and integrates gravity as `player.velocityY += gravity * dt` with `gravity: 2050` in px/s² (`gpt-5.6-sol/index.html:182, 702`). The other three hardcode a per-frame constant with no `dt` term: Fable 5 defines `GRAV = 0.62` (`fable-5/index.html:139`) and applies it as `dino.vy += GRAV * (...)` (`fable-5/index.html:287`) — even though its own `update(dt)` takes a `dt` argument, gravity never uses it. Grok 4.5's `update()` (`grok-4.5/dino-runner.html:333`) and Muse Spark 1.1's `update()` (`muse-spark-1.1/index.html:492`) don't even accept a `dt` parameter — `player.vy += GRAVITY` (`grok-4.5/dino-runner.html:389`) and `dino.vy += ... 0.62` (`muse-spark-1.1/index.html:524`) both assume a steady 60fps tick. In practice, jump height and fall speed on those three will run faster or slower on displays with a different refresh rate; GPT-5.6 Sol is the only one immune to that.
- **Responsive layout — Fable 5 and Grok 4.5 never resize the canvas.** Both hardcode the canvas box at 800×400 with no CSS width, max-width, or `@media` query anywhere in the file (`fable-5/index.html:35-40`, `grok-4.5/dino-runner.html:26-31`), so on any viewport under 800px the canvas either overflows or gets clipped by the browser. Muse Spark 1.1 wraps the canvas in `width:100%;height:100%` inside an `aspect-ratio:2/1` container with a 640px breakpoint (`muse-spark-1.1/index.html:74, 211`), and GPT-5.6 Sol does the same with `width:min(100vw,1000px)` plus a dedicated mobile breakpoint (`gpt-5.6-sol/index.html:36, 93`). Both scale cleanly; the other two don't scale at all.
- **Touch duck only exists in two of the four builds.** Muse Spark 1.1 detects a swipe-down gesture via `touchmove` (`muse-spark-1.1/index.html:899`), and GPT-5.6 Sol ships a dedicated on-screen duck button (`gpt-5.6-sol/index.html:117`). Fable 5 and Grok 4.5 only wire `pointerdown` for jump (`fable-5/index.html:174`, `grok-4.5/dino-runner.html:124`) — on a touch-only device there is no way to duck at all, only the keyboard down-arrow works.
- **Fable 5 is the only build with any audio** — a small `AudioContext` synth with distinct jump/coin/duck/hit/milestone blips (`fable-5/index.html:91-112`). The other three ship silent.
- **High-score persistence is missing from the one model that has sound.** Fable 5 keeps score in a plain variable (`let score = 0, hiScore = 0` at `fable-5/index.html:117`) with no `localStorage` call anywhere in the file, so its high score resets on every reload. Grok 4.5 (`grok-4.5/dino-runner.html:72`), Muse Spark 1.1 (`muse-spark-1.1/index.html:336`), and GPT-5.6 Sol (`gpt-5.6-sol/index.html:149`) all persist via `localStorage`.
- All four independently converged on an 800×400 neon/synthwave runner with cacti, birds/drones, broken robots, and energy-orb pickups, despite the prompt only asking for "modern and vibrant" — none took the prompt in a meaningfully different visual direction.

## Scorecard

Design + gameplay, scored 1–10 by hands-on play across dino speed, behavior, scoring, smoothness, and gameplay level, judged on the kept build per model.

| Model | Feel | Score | Cost | Quality/$ |
|---|---|:-:|---:|---:|
| GPT-5.6 Sol | easy to play | **9/10** | $0.53 | ~17.0 |
| Fable 5 | fast | **8/10** | $0.38 | ~21.1 |
| Grok 4.5 | slow but hard | **7/10** | $0.15 | ~46.7 |
| Muse Spark 1.1 | fast and hard | **6/10** | $0.10 | ~60.0 |

## Verdict

**GPT-5.6 Sol is the clear winner on actual play** — "easy to play," the top score of the four — and this is one of the rare cases where the code read and the hands-on session fully agree: it's also the only build with real delta-time physics, a canvas that scales for mobile, and touch controls that can both jump and duck. It's also the most expensive build by far and lands last on quality-per-dollar (~17.0) — if budget matters, this is the one to think twice about.

**Fable 5** plays "fast" and lands second (8/10) despite being the least technically robust build in the code read — frame-locked physics, a canvas that never resizes, no way to duck on a touchscreen, and a high score that doesn't survive a reload. Its unique audio track and moment-to-moment pace apparently outweigh those issues once you're actually playing, even at the highest per-token rate of the four.

**Grok 4.5** plays "slow but hard" (7/10) — a pacing mismatch where a gentle speed ramp is paired with obstacle placement that still punishes. It's the second-cheapest build and lands mid-table on both feel and value.

**Muse Spark 1.1** has the best code-side story of the three non-GPT builds — the only one of them with a responsive canvas and touch-duck support, plus the most polished DOM-overlay UI — but plays "fast and hard" and comes in last (6/10). Its technical polish doesn't translate to how it actually plays. It's also the cheapest build by far and, on quality-per-dollar, the best value of the four despite being the least fun.

**Net:** for the best out-of-the-box experience with no budget constraint, GPT-5.6 Sol wins outright. For quality-per-dollar, Muse Spark 1.1 and Grok 4.5 both beat it by a wide margin — worth a look if cost matters more than polish.

## Limitations

- The hands-on scores (9/8/7/6) are a single aggregate 1–10 judgment per model, not a per-parameter breakdown. Dino speed, behavior, scoring, smoothness, and gameplay level were the stated review criteria, but only a descriptive tag ("fast," "slow but hard," etc.) and the final number were recorded per model, so it isn't possible to say which specific parameter drove any one score.
- n=1 human reviewer, n=1 kept build per model (with Muse Spark 1.1 and Grok 4.5 needing 2–3 prompts to reach that kept build) — no inter-rater or re-roll variance estimate.
- The static-read findings (physics timestep, resize CSS, touch wiring, audio, persistence) are verified directly from source and are independent of the play scores. Where the two disagree — Muse Spark 1.1 and Fable 5 — that's called out explicitly above rather than resolved one way; both readings are kept as-is.
- Cost figures are not metered: estimated from each kept file's output size and each model's published per-token API pricing, scaled for Muse Spark 1.1 and Grok 4.5's re-roll attempts and left unscaled for Fable 5 and GPT-5.6 Sol's one-shot generations. Input/prompt tokens and the discarded re-roll attempts' own output aren't counted, so real cost is likely somewhat higher than shown for all four.
