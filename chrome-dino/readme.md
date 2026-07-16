# Chrome Dino: one prompt, five models

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
| kimi | `kimi/` | n/a (user-reported) | 1,045 | n/a | $0.038 |
| Fable 5 (Claude) | `fable-5/` | $10 / $50 | 938 | 1 (one-shot) | ~$0.38 |
| Grok 4.5 (xAI) | `grok-4.5/` | $2 / $6 | 1,270 | 2–3 | ~$0.15 |
| GPT-5.6 Sol (OpenAI) | `gpt-5.6-sol/` | $5 / $30 | 2,601 | 1 (one-shot) | ~$0.53 |

Cost for Muse Spark 1.1, Fable 5, Grok 4.5, and GPT-5.6 Sol is estimated as (kept file's output bytes ÷ 4) × published output price/MTok. Muse Spark 1.1 and Grok 4.5 needed 2–3 prompts to land on a working build, so their estimate is scaled for that re-roll cycle and locked to a single point estimate ($0.10 and $0.15) rather than shown as a range; Fable 5 and GPT-5.6 Sol were one-shot, so theirs is a single-generation cost with no multiplier. It only counts output tokens for the final kept file's size — no input tokens, no cost for the discarded re-roll attempts themselves — so treat these four as a floor, not a metered figure. GPT-5.6 Sol tops the table not because its per-token rate is highest (Fable 5's is, at $10/$50) but because its file is 2.4x longer than the next-biggest build (2,601 vs. 1,270 LOC). kimi's cost ($0.038) is user-reported directly, not derived from the bytes-÷-4 formula, since its per-token pricing and re-roll count for this generation weren't tracked the same way.

## Method

**Hands-on playtest (four of five):** Muse Spark 1.1, Fable 5, Grok 4.5, and GPT-5.6 Sol were actually played (via the `/design` command in Command Code), scored 1–10 across five parameters — dino speed, behavior, scoring, smoothness, and gameplay level — on the kept build per model.

**Static read:** all 6,765 lines across all five builds were read directly, no skimming, to verify specific technical claims — physics timestep, resize handling, audio, persistence, touch wiring — each cited by file and line number below. The hands-on and static-read methods agree on GPT-5.6 Sol as the strongest build overall among the original four, but disagree sharply on Muse Spark 1.1 and Fable 5.

**kimi (added later, code read + smoke test only):** kimi wasn't part of the original hands-on session — it was evaluated by the static read above plus a Node `vm` smoke test (same shim approach as the other benchmarks in this repo): the script ran clean for ~330 simulated frames, including simulated jump key-presses, 0 load errors, 0 runtime exceptions. It has no hands-on played score; see Limitations.

## Findings

- **Hands-on play reverses the code-polish ranking for two of the four.** Muse Spark 1.1 has the best responsive-layout/touch/UI-polish story of any non-GPT build in the static read below, but played worst by far ("fast and hard," 6/10) once actually tested. Fable 5 has the worst technical hygiene of the four (frame-locked physics, no resize handling, no touch duck, no persisted high score) but played second-best ("fast," 8/10). Difficulty tuning and pacing — which don't show up in a code read — evidently matter more to how a build actually feels than the mobile/resize issues found below.
- **Physics timestep — GPT-5.6 Sol and kimi are the only two that scale gravity by real elapsed time.** `gameLoop` computes `dt` from `performance`-style timestamps (`gpt-5.6-sol/index.html:2588`) and integrates gravity as `player.velocityY += gravity * dt` with `gravity: 2050` in px/s² (`gpt-5.6-sol/index.html:182, 702`). kimi's `loop(now)` does the same: it derives `dt` from `now - last`, clamps it to `1/30` (`kimi/index.html:1033-1036`), and every velocity update in `update(dt)` is `dt`-scaled, e.g. `dino.vy += GRAVITY * dt` with `GRAVITY = 2050` (`kimi/index.html:113, 336, 374`) — the same gravity constant GPT-5.6 Sol uses. The other three hardcode a per-frame constant with no `dt` term: Fable 5 defines `GRAV = 0.62` (`fable-5/index.html:139`) and applies it as `dino.vy += GRAV * (...)` (`fable-5/index.html:287`) — even though its own `update(dt)` takes a `dt` argument, gravity never uses it. Grok 4.5's `update()` (`grok-4.5/dino-runner.html:333`) and Muse Spark 1.1's `update()` (`muse-spark-1.1/index.html:492`) don't even accept a `dt` parameter — `player.vy += GRAVITY` (`grok-4.5/dino-runner.html:389`) and `dino.vy += ... 0.62` (`muse-spark-1.1/index.html:524`) both assume a steady 60fps tick. In practice, jump height and fall speed on those three will run faster or slower on displays with a different refresh rate; GPT-5.6 Sol and kimi are immune to that.
- **Responsive layout — Fable 5 and Grok 4.5 never resize the canvas.** Both hardcode the canvas box at 800×400 with no CSS width, max-width, or `@media` query anywhere in the file (`fable-5/index.html:35-40`, `grok-4.5/dino-runner.html:26-31`), so on any viewport under 800px the canvas either overflows or gets clipped by the browser. Muse Spark 1.1 wraps the canvas in `width:100%;height:100%` inside an `aspect-ratio:2/1` container with a 640px breakpoint (`muse-spark-1.1/index.html:74, 211`), GPT-5.6 Sol does the same with `width:min(100vw,1000px)` plus a dedicated mobile breakpoint (`gpt-5.6-sol/index.html:36, 93`), and kimi wraps its canvas in a `width:min(96vw,920px); aspect-ratio:2/1` box (`kimi/index.html:18-28`) while also re-deriving `devicePixelRatio` on a `resize` listener (`kimi/index.html:60-67`) for a crisper backing store. Three of five scale cleanly; Fable 5 and Grok 4.5 don't scale at all.
- **Touch duck exists in three of the five builds.** Muse Spark 1.1 detects a swipe-down gesture via `touchmove` (`muse-spark-1.1/index.html:899`), GPT-5.6 Sol ships a dedicated on-screen duck button (`gpt-5.6-sol/index.html:117`), and kimi detects the same swipe-down gesture as Muse Spark 1.1 via `pointermove` (`kimi/index.html:1022-1024`, triggering `duckHeld` once the pointer has moved down more than 26px from where it started). Fable 5 and Grok 4.5 only wire `pointerdown` for jump (`fable-5/index.html:174`, `grok-4.5/dino-runner.html:124`) — on a touch-only device there is no way to duck at all, only the keyboard down-arrow works.
- **Audio is now a 2-3 split, and the second build to have it also fixes the first build's persistence gap.** Fable 5 has a small `AudioContext` synth with distinct jump/coin/duck/hit/milestone blips (`fable-5/index.html:91-112`). kimi ships a comparable 5-effect synth — jump, milestone point, orb pickup, die, and land (`kimi/index.html:106-110`) — and, unlike Fable 5, also persists its high score (see next finding). Muse Spark 1.1, Grok 4.5, and GPT-5.6 Sol ship silent.
- **High-score persistence is missing from Fable 5, the only build with audio that doesn't also save.** Fable 5 keeps score in a plain variable (`let score = 0, hiScore = 0` at `fable-5/index.html:117`) with no `localStorage` call anywhere in the file, so its high score resets on every reload. Grok 4.5 (`grok-4.5/dino-runner.html:72`), Muse Spark 1.1 (`muse-spark-1.1/index.html:336`), GPT-5.6 Sol (`gpt-5.6-sol/index.html:149`), and kimi (`kimi/index.html:119, 208`, key `neonRexHi`) all persist via `localStorage`.
- All five independently converged on an 800×400 neon/synthwave runner with cacti, birds/drones, broken robots, and energy-orb pickups, despite the prompt only asking for "modern and vibrant" — none took the prompt in a meaningfully different visual direction. kimi's version ("NEON REX") adds a day/night cycle (`kimi/index.html:114, 350`) that inverts every 700 points and a parallax city skyline with flickering windows (`kimi/index.html:480-503`), on top of the same cactus/bird/robot/barrier/orb set the other four use.

## Scorecard

Design + gameplay, scored 1–10 by hands-on play across dino speed, behavior, scoring, smoothness, and gameplay level, judged on the kept build per model.

| Model | Feel | Score | Cost | Quality/$ |
|---|---|:-:|---:|---:|
| GPT-5.6 Sol | easy to play | **9/10** | $0.53 | ~17.0 |
| Fable 5 | fast | **8/10** | $0.38 | ~21.1 |
| Grok 4.5 | slow but hard | **7/10** | $0.15 | ~46.7 |
| Muse Spark 1.1 | fast and hard | **6/10** | $0.10 | ~60.0 |
| kimi | not played (code-read only, see Limitations) | — | $0.038 | — |

## Verdict

**GPT-5.6 Sol is the clear winner on actual play** — "easy to play," the top score of the four hands-on builds — and this is one of the rare cases where the code read and the hands-on session fully agree: it's also the only one of those four with real delta-time physics, a canvas that scales for mobile, and touch controls that can both jump and duck. It's also the most expensive build by far and lands last on quality-per-dollar (~17.0) among the played builds — if budget matters, this is the one to think twice about.

**Fable 5** plays "fast" and lands second (8/10) despite being the least technically robust build in the code read — frame-locked physics, a canvas that never resizes, no way to duck on a touchscreen, and a high score that doesn't survive a reload. Its unique audio track and moment-to-moment pace apparently outweigh those issues once you're actually playing, even at the highest per-token rate of the four.

**Grok 4.5** plays "slow but hard" (7/10) — a pacing mismatch where a gentle speed ramp is paired with obstacle placement that still punishes. It's the second-cheapest build and lands mid-table on both feel and value.

**Muse Spark 1.1** has the best code-side story of the three non-GPT builds — the only one of them with a responsive canvas and touch-duck support, plus the most polished DOM-overlay UI — but plays "fast and hard" and comes in last (6/10). Its technical polish doesn't translate to how it actually plays. It's also the cheapest build by far and, on quality-per-dollar, the best value of the four played builds despite being the least fun.

**kimi is the value story of the update, on paper.** It wasn't hands-on played, so it isn't ranked against the four Feel scores above, but the code read puts it ahead of every other build on technical hygiene: it's one of only two builds (with GPT-5.6 Sol) that scale gravity by real elapsed time instead of a per-frame constant, one of only three with touch duck, one of only two with any audio, and — unlike Fable 5, the only other build with audio — it also persists its high score. At $0.038 it's cheaper than all four originals, including Muse Spark 1.1 ($0.10). Whether that code-level thoroughness translates into "actually fun to play" the way GPT-5.6 Sol's did is untested here — see Limitations.

**Net:** for the best out-of-the-box experience with no budget constraint, GPT-5.6 Sol wins outright among the played builds. For quality-per-dollar among those four, Muse Spark 1.1 and Grok 4.5 both beat it by a wide margin. kimi undercuts all of them on price while matching or beating GPT-5.6 Sol's technical checklist — worth a hands-on look before drawing a final conclusion.

## Limitations

- The hands-on scores (9/8/7/6) are a single aggregate 1–10 judgment per model, not a per-parameter breakdown. Dino speed, behavior, scoring, smoothness, and gameplay level were the stated review criteria, but only a descriptive tag ("fast," "slow but hard," etc.) and the final number were recorded per model, so it isn't possible to say which specific parameter drove any one score.
- n=1 human reviewer, n=1 kept build per model (with Muse Spark 1.1 and Grok 4.5 needing 2–3 prompts to reach that kept build) — no inter-rater or re-roll variance estimate.
- The static-read findings (physics timestep, resize CSS, touch wiring, audio, persistence) are verified directly from source and are independent of the play scores. Where the two disagree — Muse Spark 1.1 and Fable 5 — that's called out explicitly above rather than resolved one way; both readings are kept as-is.
- **kimi was added after the original hands-on session and was not hands-on played.** Its row in the Scorecard has no Feel/Score entry because none was measured — filling one in would misrepresent a code read as a played impression. Its Findings citations are verified from source and its `vm` smoke test ran clean, but nothing here confirms how it actually feels to play, whether its audio works as intended in a real browser, or its actual frame pacing.
- kimi's cost ($0.038) is user-reported, not computed from the output-bytes formula used for the other four, so it isn't directly comparable to their "floor, not billed usage" caveat — treat it as a separate reporting basis.
- Cost figures are not metered: estimated from each kept file's output size and each model's published per-token API pricing, scaled for Muse Spark 1.1 and Grok 4.5's re-roll attempts and left unscaled for Fable 5 and GPT-5.6 Sol's one-shot generations. Input/prompt tokens and the discarded re-roll attempts' own output aren't counted, so real cost is likely somewhat higher than shown for all four.
