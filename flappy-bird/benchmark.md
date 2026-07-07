# Flappy Bird — one prompt, three models

## Prompt

> Create a complete single HTML file for a cute Flappy Bird style game using Canvas. Smooth gravity, flapping animation, parallax background, score, pipe obstacles, game over screen

## Models

| Model | Dir | Cost/gen | LOC (light / dark) |
|---|---|---:|---:|
| Fable 5 (Claude) | `claude/` | $0.4200 | 641 / 927 |
| GLM 5.2 | `glm/` | $0.0480 | 799 / 839 |
| DeepSeek | `deepseek/` | $0.0008 | 748 / 876 |

Each model produced a `light-version` and a later `dark-version`. Cost is per generation, as reported by the user; not independently metered.

## Method

Read all 4,830 lines directly, no skimming. Tried real headless-Chrome testing via `agent-browser`; blocked in this sandbox (missing `libasound.so.2`, no passwordless `sudo`). Substituted a Node `vm` shim (stubbed `window`/`canvas`/`localStorage`/`requestAnimationFrame`) that executes each file's actual script through 600 simulated frames of play — start, flap, die, restart — and counts canvas calls as a rendering-cost proxy. **All six ran clean: 0 load errors, 0 runtime exceptions.** This confirms the logic executes end-to-end; it does not confirm pixel-perfect visuals or real device performance.

## Findings

- **`dark-version` is a reskin, not a fresh sample.** All physics constants (gravity, flap velocity, gap, pipe width, speed) are byte-identical light↔dark for all three models. Whole-file text similarity: Fable5 76.5%, DeepSeek 61.3%, GLM 39.8% (GLM rewrote the most rendering code while touching the least game logic).
- **Collision math, ranked by actual correctness:** GLM (`glm/index.html:294-299`, both versions) does a textbook clamped circle-vs-rect distance test — the only exact implementation. Fable5 (`claude/index.html:285-292`) approximates the circle as an inscribed, shrunk AABB — cheap and fine. DeepSeek (`deepseek/index.html:221-234`) uses the bird's full visual bounding box with no forgiveness margin — correct but the least tuned.
- **Confirmed bug, DeepSeek (both versions):** canvas backing store is fixed at 420×640 (`index.html:68-70`), no `resize` listener anywhere, but its own CSS switches the wrapper to `100vw/100dvh` under 440px width. Any modern phone (aspect ≈0.46) stretches the fixed 0.656-aspect canvas non-uniformly. GLM and Fable5 both letterbox correctly on resize.
- **Perf smell, DeepSeek dark only:** `drawCitySilhouette()` recomputes a per-window lit/unlit trig pattern with a nested pixel loop every frame instead of caching it — measured at 817 draw calls/frame vs. 496–603 for everything else.
- **Only GLM shipped audio** — synthesized in-code via `AudioContext` oscillators, plus a mute button and medal tiers. Only Fable5 shipped adaptive difficulty (speed ramps with score). Fable5 never persists best score (only the day/night theme choice is saved); DeepSeek and GLM both do via `localStorage`.
- Fable5 and GLM both pull a Google Fonts stylesheet over the network; DeepSeek is the only fully offline-safe file of the three.

## Scorecard

1–5 per axis, averaged across light+dark since both share the same underlying engine.

| Model | Spec/cute | Collision | Architecture | Resize robustness | Polish | Offline-safe | **Mean** | Cost | **Quality/$** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---:|---:|
| GLM 5.2 | 5 | 5 | 5 | 5 | 5 | 4 | **4.83** | $0.0480 | ~101 |
| Fable 5 | 5 | 4 | 5 | 5 | 3.5 | 4 | **4.42** | $0.4200 | ~10.5 |
| DeepSeek | 4 | 3 | 3.5 | 2 | 4 | 5 | **3.58** | $0.0008 | **~4,475** |

## Verdict

On quality alone: **GLM > Fable 5 > DeepSeek**, decided mainly by GLM's exact collision math and its unprompted audio system. But price collapses that ordering — DeepSeek is 60× cheaper than GLM and 525× cheaper than Fable 5, while landing at 74% of GLM's quality score and 81% of Fable 5's. Its one real defect (the resize bug) is a five-minute fix, not a design flaw. If the axis is quality-per-dollar, DeepSeek wins by almost two orders of magnitude; if the axis is best game with no budget constraint, GLM wins outright; Fable 5 is the most expensive of the three and isn't first on any axis except tied polish.

## Limitations

- n=1 per model — no re-rolls, no variance estimate. A single regeneration could move any score.
- The Node `vm` shim proves the logic runs; it isn't a real browser, so nothing here confirms actual frame pacing, touch input, or that GLM's audio truly plays.
- "Spec/cute" and "Polish" are disclosed aesthetic judgment, not measurements, unlike the collision-math and resize findings, which are.
