# Space Shooter: one prompt, four models

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

> Create a vertical Galaxy Shooter game as a single HTML file using Canvas. Portrait mobile style canvas (400x700). Player controls a cool blue futuristic spaceship at the bottom that moves left and right with arrow keys or on-screen touch buttons. The ship shoots lasers upward automatically or with tap/space. Enemies (colorful alien ships) come down from the top in formations. Destroy enemies and avoid their shots. Add glowing effects, particle explosions, and starfield background that scrolls down. Collect power-ups. Show score at the top, lives (hearts), and level. Include start screen and game over screen with restart. Make it fun, smooth, and visually vibrant like classic vertical shooters. Output only the full code.

## Models

| Model | Dir | Context | $/MTok in/out | LOC | Est. cost |
|---|---|---:|---:|---:|---:|---:|
| Grok 4.5 | `Grok-4.5/` | 500K | $2 / $6 | 1983 | ~$0.09 |
| GPT-5.5 | `GPT-5.5/` | 1.05M | $5 / $30 | 734 | ~$0.11 |
| kimi-k3 | `kimi-k3/` | n/a | n/a (user-reported) | 821 | $0.030 |
| Fable 5 (Claude) | `Fable-5/` | 1M | $10 / $50 | 982 | ~$0.38 |

One prompt per model, no re-rolls (kimi-k3 was added later; re-roll count wasn't tracked for it). Cost for Grok 4.5, GPT-5.5, and Fable 5 is estimated from output size using published pricing, not a metered figure. kimi-k3's cost ($0.030) is user-reported directly, not derived from that formula — it's the cheapest build in the set.

## Verdict

**Grok 4.5 wins on actual play, no contest.** It's the best game, the second-cheapest, and the only one I actually played end to end. It felt great. That tracks: Grok 4.5 is xAI's first model built specifically for coding and agentic work, trained alongside Cursor on real developer session data ([announcement](https://x.ai/news/grok-4-5)). This game is a small proof of that positioning. On the code-read Scorecard below, though, kimi-k3 — added later and not hands-on played — edges it out; see its paragraph below.

**Grok 4.5.** Stayed on theme (dark space, alien ships, not a reskin). Five enemy archetypes, five formation patterns, scripted boss fights every fifth level. Real generative background music plus SFX. Saves high score across reloads. Uses a fixed-timestep loop, so it runs correctly on 90Hz and 120Hz phones instead of speeding up. Manual fire (tap/space) actually shortens the cooldown, so the "or" in the prompt means something. Its own collision check (`hit()` in `Grok-4.5/index.html:700`) is an axis-aligned box overlap, not a circle test — less exact than Fable 5's or kimi-k3's, though it clearly didn't hurt how it played.

**kimi-k3.** Stayed fully on theme — a blue futuristic ship with twin engine flames and wingtip nav lights, alien scouts/fighters/heavy cruisers in five formation patterns, a scrolling nebula-and-starfield background, screen shake, and a vignette. It independently fixes both of Fable 5's gaps below: its collision is the same true circle-circle distance check Fable 5 uses (`kimi-k3/index.html:353,374,387,400`, all `dx*dx+dy*dy < r*r` style tests), and it persists the best score via `localStorage.setItem('galaxyStrikerBest', ...)` (`kimi-k3/index.html:283`) — something Fable 5 never does. It also has a manual-fire path that actually works during play: tapping the canvas for under 250ms calls `manualFire()` (`kimi-k3/index.html:145-158`), on top of an unconditional auto-fire in `update()` (`kimi-k3/index.html:332`), so — like Grok 4.5 — the prompt's "or" means something here too. Touch is DOM pads for movement plus drag-anywhere plus tap-to-fire (`kimi-k3/index.html:133-158`), architecturally almost identical to Fable 5's touch setup. Its one prompt-fidelity gap: the prompt asks for a "speed boost" power-up, and kimi-k3 substitutes weapon buffs (triple shot, rapid fire, shield, extra life) instead — no literal speed boost. It's also the cheapest build in the set at $0.030, cheaper than Grok 4.5's $0.09.

**Fable 5 (Claude).** Reskinned the whole game into a daytime biplane game called "Sky Striker." Blue sky, clouds, a propeller plane instead of a futuristic ship, still not what was asked for. On the plus side it has the most mathematically exact collision detection of the group (true circle-circle checks — a distinction kimi-k3 now shares) and the most robust touch controls (real DOM buttons plus drag-anywhere — again, an approach kimi-k3 also converged on independently). But there's no working manual-fire path during play (`uiAction()` at `Fable-5/index.html:288-291` only handles the start/game-over transitions, never a mid-play shot) — it only auto-fires — and it never persists its best score to `localStorage` at all, keeping it in a plain variable instead (`Fable-5/index.html:294`).

**GPT-5.5.** Stayed on theme but is the thinnest build. One enemy archetype reused for every wave, one fixed grid formation, no audio at all, and no score persistence. It also has a function called `circleRectHit` that never actually reads the circle's radius, so the name is a lie even though the collision still works fine as a padded box check.

## Scorecard

| Model | Spec fidelity | Collision | Polish | Mobile/touch | Mean | Cost | Quality/$ |
|---|:-:|:-:|:-:|:-:|:-:|---:|---:|
| kimi-k3 | 5 | 5 | 5 | 5 | **5.00** | $0.030 | **~167** |
| Grok 4.5 | 5 | 4.5 | 5 | 4.5 | **4.75** | $0.09 | ~53 |
| Fable 5 | 3 | 5 | 4 | 5 | **4.25** | $0.38 | ~11 |
| GPT-5.5 | 4 | 3.5 | 2 | 3.5 | **3.25** | $0.11 | ~30 |

## Notes

- n=1 per model, no re-rolls. A regeneration could move any of this.
- Only Grok's build was actually played by hand. Fable 5's, GPT-5.5's, and kimi-k3's builds were checked by reading the code and running a headless smoke test, not by playing them — kimi-k3's Scorecard row is a code-read judgment on the same basis as those two, not a played impression, and it's untested whether its by-the-checklist thoroughness (matched collision precision, working manual-fire, persistence, touch) actually feels good to play the way Grok 4.5 did.
- Cost for Grok 4.5, GPT-5.5, and Fable 5 is a rough estimate (output bytes divided by 4, times the published output price per token), not billed usage. kimi-k3's cost is user-reported directly, on a different basis than that formula.
