# Flappy Bird: one prompt, five models

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

> Create a complete single HTML file for a cute Flappy Bird style game using Canvas. Smooth gravity, flapping animation, parallax background, score, pipe obstacles, game over screen

## Models

| Model | Dir | Cost/gen | LOC (light / dark) |
|---|---|---:|---:|
| Fable 5 (Claude) | `Fable-5/` | $0.4200 | 641 / 927 |
| GLM 5.2 | `GLM-5.2/` | $0.0480 | 799 / 839 |
| kimi-k3 | `kimi-k3/` | $0.0240 | 880 / — |
| GPT-5.6 Sol | `gp-5.6-sol/` | ~$0.1500 | 631 / — |
| DeepSeek | `DeepSeek-V4-Pro/` | $0.0008 | 748 / 876 |

Each of Fable 5, GLM 5.2, and DeepSeek produced a `light-version` and a later `dark-version` reskin (paths are `light-version/<Dir>/index.html` and `dark-version/<Dir>/index.html`). kimi-k3 and GPT-5.6 Sol were added later and currently only have a `light-version` build, so the light↔dark similarity comparison below doesn't apply to them.

Cost for Fable 5, GLM 5.2, and DeepSeek is per generation as reported by the user, not independently metered. kimi-k3's cost ($0.0240) is likewise user-reported. GPT-5.6 Sol's cost is not user-reported; it's estimated here the same way this repo's chrome-dino and third-view-car-game benchmarks estimate it — (kept file's output bytes ÷ 4) × $30/MTok output (GPT-5.6 Sol's published output rate), one-shot, no re-roll multiplier — so treat it as a floor, not a metered figure.

## Method

**Static read:** all 6,341 lines across all eight files (five light-version builds, three of which also have a dark-version reskin) read directly, no skimming. Every claim below is cited by file and line number.

**Manual playtest (Fable 5, GLM 5.2, DeepSeek only):** each of these six files was actually played, not just read: flapping with both the Space/Arrow keys and tap/click, deliberately flying into pipes and into the ground to trigger death, running the restart flow, and checking how each one behaves when the browser window is resized.

**Automated crash check (Fable 5, GLM 5.2, DeepSeek):** an attempt was made to drive all six through real headless Chrome (`agent-browser`), which failed in this sandbox (missing `libasound.so.2`, no passwordless `sudo`). As a fallback, a Node `vm` shim (stubbed `window`/`canvas`/`localStorage`/`requestAnimationFrame`) executed each file's actual script through 600 simulated frames of play, and counted canvas calls as a rendering-cost proxy. All six ran clean: 0 load errors, 0 runtime exceptions.

**Automated crash check (kimi-k3, GPT-5.6 Sol):** the same Node `vm` shim approach was repeated for these two when they were added, run for ~330 simulated frames (including simulated flap key-presses partway through to exercise the play state, not just the idle start screen). Both ran clean, 0 load errors, 0 runtime exceptions. GPT-5.6 Sol averaged ~261 canvas draw calls/frame; kimi-k3 averaged ~541/frame, roughly double, consistent with its heavier particle/parallax/medal-UI rendering. Neither of these two was hand-played in a real browser for this update — see Limitations.

This only proves the logic doesn't crash; it isn't a substitute for an actual hands-on playtest.

## Findings

- **`dark-version` is a reskin, not a fresh sample — but this only applies to the three models that have one.** All physics constants (gravity, flap velocity, gap, pipe width, speed) are byte-identical light↔dark for Fable 5, GLM 5.2, and DeepSeek. Whole-file text similarity: Fable5 76.5%, DeepSeek 61.3%, GLM 39.8% (GLM rewrote the most rendering code while touching the least game logic). kimi-k3 and GPT-5.6 Sol have no dark-version yet, so there's nothing to compare for them.
- **Collision math is now a 3-2 split in favor of the exact test.** GLM (`GLM-5.2/index.html:294-299`), GPT-5.6 Sol (`gp-5.6-sol/index.html:185-191`), and kimi-k3 (`kimi-k3/index.html:179-184`) all independently converged on the same textbook clamped circle-vs-rect distance test — the only exact implementation, and GPT-5.6 Sol and kimi-k3 both apply their own forgiveness margin on top of it (GPT-5.6 Sol shrinks the bird's collision radius by 5px at `gp-5.6-sol/index.html:252-253`; kimi-k3 hardcodes a hitbox radius of 14 against a ~18px visual radius, `kimi-k3/index.html:73`, with a comment explicitly calling it "forgiving on purpose"). Fable5 (`Fable-5/index.html:285-292`) approximates the circle as an inscribed, shrunk AABB (cheap and fine). DeepSeek (`DeepSeek-V4-Pro/index.html:221-234`) uses the bird's full visual bounding box with no forgiveness margin: correct, but the least tuned.
- **Confirmed bug, DeepSeek (both versions):** canvas backing store is fixed at 420×640 (`DeepSeek-V4-Pro/index.html:68-70`), no `resize` listener anywhere, but its own CSS switches the wrapper to `100vw/100dvh` under 440px width. Any modern phone (aspect ≈0.46) stretches the fixed 0.656-aspect canvas non-uniformly.
- **Resize handling is now a spread, not a tie.** Fable5, GLM, and DeepSeek all read `devicePixelRatio` once, but only Fable5 and GLM re-run their fit/resize function on a `resize` listener (`Fable-5/index.html:75`, `GLM-5.2/index.html:75`), so both letterbox correctly on an actual resize. kimi-k3 does the same thing more thoroughly: a virtual-resolution `resize()` (`kimi-k3/index.html:50-63`) scales the canvas backing store by `devicePixelRatio` *and* remaps drawing coordinates via `ctx.setTransform`, and it's the only one of the five that also resets its frame-timing reference on `visibilitychange` (`kimi-k3/index.html:283`) so returning to a backgrounded tab doesn't cause a giant simulated-physics jump on the next frame. GPT-5.6 Sol takes a different route entirely: no JS resize listener and no `devicePixelRatio` scaling at all, relying purely on a CSS `aspect-ratio: 9/16` wrapper plus a stretched `width:100%/height:100%` canvas (`gp-5.6-sol/index.html:23-37`). That avoids DeepSeek's distortion bug (the aspect ratio can't drift, since it's locked by CSS, not by JS math), but the 540×960 backing store never gets sharper on a high-DPI or larger display, so it will look softer than the other four when stretched up.
- **Only GLM and kimi-k3 shipped audio**, both synthesized in-code via `AudioContext` oscillators (GLM: 4 effect functions at `GLM-5.2/index.html:108-129`; kimi-k3: 5, at `kimi-k3/index.html:88-115`). Only GLM added a mute toggle (`GLM-5.2/index.html:689,775`) — kimi-k3's sound has no in-game way to turn it off. GPT-5.6 Sol has no audio at all: no `AudioContext`, no sound calls anywhere in the file, the only one of the five that's fully silent. Only Fable5 shipped adaptive difficulty (speed ramps with score) among the original three; GPT-5.6 Sol and kimi-k3 both also ramp pipe speed/gap with score (`gp-5.6-sol/index.html:144,240,243`; `kimi-k3/index.html:224-225`).
- **Persistence is 4-1.** GLM, DeepSeek, GPT-5.6 Sol, and kimi-k3 all persist a best score via `localStorage` (`gp-5.6-sol/index.html:76,181`; `kimi-k3/index.html:122,250`). Fable5 is the only one of the five that never persists a best score — it only saves the day/night theme choice.
- **kimi-k3 has a harmless dead-code leftover.** Its `dead` state loop includes `for (const p of pipes) p.x -= 0; // world freezes on death` (`kimi-k3/index.html:378`) — subtracting zero does nothing, and pipes already don't move in that state because the pipe-scroll logic only runs under `if (state === 'play')` (`kimi-k3/index.html:342-356`). It reads like a stale artifact of an earlier draft rather than a bug with any visible effect.
- **Offline-safety is now 2-3.** Fable5, GLM, and kimi-k3 all pull a Google Fonts stylesheet over the network (`kimi-k3/index.html:7-9` loads "Baloo 2", the same family Fable5 uses). DeepSeek and GPT-5.6 Sol are the only fully offline-safe files of the five — no external requests, system font stacks only.

## Scorecard

1–5 per axis. Fable 5, GLM 5.2, and DeepSeek are averaged across light+dark since both share the same underlying engine; kimi-k3 and GPT-5.6 Sol are scored on their single light-version build.

| Model | Spec/cute | Collision | Architecture | Resize robustness | Polish | Offline-safe | **Mean** | Cost | **Quality/$** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---:|---:|
| GLM 5.2 | 5 | 5 | 5 | 5 | 5 | 4 | **4.83** | $0.0480 | ~101 |
| kimi-k3 | 5 | 5 | 5 | 5 | 4.5 | 4 | **4.75** | $0.0240 | ~198 |
| GPT-5.6 Sol | 5 | 5 | 5 | 4 | 4 | 5 | **4.67** | ~$0.1500 | ~31 |
| Fable 5 | 5 | 4 | 5 | 5 | 3.5 | 4 | **4.42** | $0.4200 | ~10.5 |
| DeepSeek | 4 | 3 | 3.5 | 2 | 4 | 5 | **3.58** | $0.0008 | **~4,475** |

## Verdict

On quality alone, the ranking is now **GLM 5.2 > kimi-k3 > GPT-5.6 Sol > Fable 5 > DeepSeek**, and the top three are close (4.83 / 4.75 / 4.67) — GLM's edge is its mute toggle and exact collision math paired with real audio, kimi-k3 loses a little for shipping audio with no way to mute it, and GPT-5.6 Sol loses a little for shipping no audio at all despite otherwise-flawless physics and collision.

Price reshuffles that ordering hard. **kimi-k3 is the story here**: at $0.024 it's the second-cheapest build in the whole set, and it lands second on raw quality — its quality-per-dollar (~198) beats GLM's (~101) by roughly 2x and Fable 5's (~10.5) by nearly 19x, while giving up almost nothing on the scorecard. **GPT-5.6 Sol** (~$0.15 estimated, ~31 quality/$) is the most expensive of the non-Fable5 builds and the only one of the five that's completely silent — a real gap for a "cute" flappy bird, whatever its collision math gets right. **DeepSeek** still wins quality-per-dollar outright at ~4,475, same as before, at the cost of the resize bug and least-tuned collision box. If the axis is best game with no budget constraint, GLM 5.2 wins outright; if it's quality-per-dollar with a real quality floor, kimi-k3 is now the pick to beat.

## Limitations

- n=1 per model, no re-rolls, no variance estimate. A single regeneration could move any score.
- The Node `vm` shim proves the logic runs; it isn't a real browser, so nothing here confirms actual frame pacing, touch input, or that any model's audio truly plays.
- kimi-k3 and GPT-5.6 Sol were evaluated by static read and the automated `vm` smoke test only for this update — unlike Fable 5, GLM 5.2, and DeepSeek, neither was hand-played in an actual browser, so their Scorecard rows reflect code-level judgment, not a played impression. That's the same caveat the third-view-car-game benchmark in this repo flags for its static-read-only scores.
- GPT-5.6 Sol's cost (~$0.15) is a formula estimate (bytes ÷ 4 × published output price), not user-reported like the other four; treat it as a floor, not a metered figure.
- "Spec/cute", "Architecture", and "Polish" are disclosed aesthetic/code judgment, not measurements, unlike the collision-math, resize, audio, and persistence findings, which are cited directly from source.
