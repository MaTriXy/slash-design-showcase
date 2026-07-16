# Third-View Car Racing: one prompt, four models

> ### Try this benchmark yourself with Command Code
> This benchmark was built in one-shot with [`/design`](https://commandcode.ai/docs/slash-commands/design) in [Command Code](https://commandcode.ai).
>
> **How to run this exact benchmark:**
> 1. Install Command Code:
>    ```bash
>    npm i -g command-code
>    ```
>    Quickstart: [commandcode.ai/docs/quickstart](https://commandcode.ai/docs/quickstart) · npm: [command-code](https://www.npmjs.com/package/command-code) · [`/design` command](https://commandcode.ai/docs/slash-commands/design)
> 2. Start Command Code (`cmd` on mac/linux, `cmdc` on windows, or `commandcode` anywhere), then run `/design` and paste the prompt below
> 3. Use Command Code to generate and compare: same prompt, one shot per model
>
> Built with [Command Code](https://x.com/CommandCodeAI)
> Showcase: [CommandCodeAI/slash-design-showcase](https://github.com/CommandCodeAI/slash-design-showcase)
> Docs: [commandcode.ai/docs/slash-commands/design](https://commandcode.ai/docs/slash-commands/design)

## Prompt

> Create a complete single HTML file for a fun modern car racing game using HTML5 Canvas with a wide canvas (700x700). The game should have modern clean graphics with a bright blue detailed player car that has glowing headlights and taillights, red and yellow enemy cars, realistic road perspective with white dashed lines, textured asphalt, road borders, and scrolling scenery like grass, trees and city elements. Add particle tire smoke during drifting, sparks on collisions, dust, and glowing collectible coins. Implement realistic car physics including acceleration, deceleration, braking, smooth steering with momentum and realistic drifting when turning at high speed. The player controls the car using arrow keys or WASD with up to accelerate, down to brake or reverse, and left/right to steer. The road scrolls forward continuously, the player collects glowing coins for points and power-ups for temporary speed boost or shield, while avoiding or overtaking enemy cars coming from the front. Increase difficulty by adding more enemies and higher speed as the score rises. Show score at the top, a speedometer, and lives system. Include a nice start screen with title and press space to start, pause with P key, and game over screen with final score and restart option. Use requestAnimationFrame for smooth 60fps gameplay, add simple Web Audio API sound effects for engine, coin collect, and crash. Make the entire game polished, responsive, addictive, and visually satisfying. Forza Horizon style third-person view behind the car.

## Models

| Model | Dir | Context | $/MTok in/out | LOC | Re-rolls | Est. cost |
|---|---|---:|---:|---:|:-:|---:|
| Muse Spark 1.1 (Meta) | `muse-spark-1.1/` | 1M | $1.25 / $4.25 | 658 | 4–5 | ~$0.22 |
| Fable 5 (Claude) | `fable-5/` | 1M | $10 / $50 | 1,189 | 2–3 | ~$0.80 |
| Grok 4.5 (xAI) | `grok-4.5/` | 500K | $2 / $6 | 1,289 | 4–5 | ~$0.31 |
| GPT-5.6 Sol (OpenAI) | `gpt-5.6-sol/` | 1.05M | $5 / $30 | 263 | 2–3 | ~$0.42 |

One prompt, one kept build per model. Per the user, Muse Spark 1.1 and Grok 4.5 needed 4–5 tries to land on the kept build; Fable 5 and GPT-5.6 Sol needed 2–3. Cost is estimated as (kept file's output bytes ÷ 4) × each model's published output price/MTok (the same per-model pricing used in this repo's chrome-dino benchmark, which used the same four models), then scaled by the midpoint of each model's re-roll count. Muse Spark 1.1, Grok 4.5, and GPT-5.6 Sol use that formula directly (4.5× for the first two, 2.5× for GPT-5.6 Sol); Fable 5's ~$0.80 is a user-adjusted figure, since the formula's raw output (~$1.30 at a 2.5× multiplier) read as too high for a 2–3 re-roll cycle. It only counts output tokens for the kept file's final size: no input tokens, and no separate accounting for each discarded attempt's own (likely similar-sized) output, so treat all four as a floor, not a metered figure. Context is each model's maximum published context window (how much source/prompt it can ingest in one call), not tokens actually used for this generation. It isn't a factor in the cost estimate above.

## Method

**Static read:** all 3,399 lines across the four builds were read directly, no skimming. Every claim below is cited by file and line number.

**Automated smoke test:** each file's `<script>` was also run through a Node `vm` shim (fake canvas, DOM, `AudioContext`, `localStorage`, `requestAnimationFrame`) for 300 simulated frames of input. All four ran clean, 0 errors. This only confirms the code doesn't crash, not how any of them feel to actually drive.

**Manual playtest:** we ran a test for a more realistic car game using the `/design` command. The results are impressively good. Every model did its best on behavior, scoring, gameplay loop, and smoothness.

Scored on design + gameplay:

| Model | Score |
|---|:-:|
| Fable 5 | **9/10** |
| GPT-5.6 Sol | **9/10** |
| Grok 4.5 | **7/10** |
| Muse Spark 1.1 | **6/10** |

## Findings

- **Muse Spark 1.1 breaks two parts of the spec.** It renders on a 600×600 canvas instead of the requested 700×700 (`muse-spark-1.1/index.html:70`), and it deliberately freezes the entire world (time, road curve, enemies, coins, trees) whenever the player isn't actively accelerating (`isMoving` gate, `muse-spark-1.1/index.html:236,239-244,302-303`), which contradicts the prompt's "road scrolls forward continuously." The start-screen copy documents this as an intentional "Road fix" for an earlier auto-drift bug (`muse-spark-1.1/index.html:90`). Shipping developer bug-fix notes as player-facing UI text reads as unpolished, even if the underlying fix is reasonable.
- **Fable 5 is the only build with fully frame-locked physics.** `update()` (`fable-5/fable.html:285`) never receives or uses a delta-time argument, and the main loop calls it unconditionally every animation frame with no timing guard (`fable-5/fable.html:1180-1185`). Its forward speed floor of 25 units (`fable-5/fable.html:298`) does keep the car creeping forward at all times (arguably the closest of the four to "scrolls forward continuously"), but the whole simulation will run faster or slower depending on the display's refresh rate.
- **Touch controls split 2-2, and not along the polish you'd guess.** GPT-5.6 Sol wires a full quadrant touch scheme: `pointerdown`/`pointermove` map screen position to accelerate/brake/steer (`gpt-5.6-sol/index.html:257-259`), and Muse Spark 1.1 wires real swipe-to-steer plus a hold-to-accelerate zone (`muse-spark-1.1/index.html:646-653`). Fable 5 and Grok 4.5 have zero touch event listeners anywhere in their files: keyboard only, despite both scaling their canvas responsively via CSS, so a phone visitor sees a correctly-sized game they can't actually drive.
- **Persistence is 3-1.** GPT-5.6 Sol, Grok 4.5, and Muse Spark 1.1 all read/write a best score via `localStorage` (`gpt-5.6-sol/index.html:37,103`; `grok-4.5/car-racing.html:175,1199`; `muse-spark-1.1/index.html:431-432`). Fable 5 keeps `best` as a plain in-memory variable (`fable-5/fable.html:88`) updated on game over (`fable-5/fable.html:278-282`) but never written to storage, so its high score resets on every reload.
- **Fable 5 is the only build with road hazards beyond traffic**: a cone slalom and hard lane-blocking barriers (`fable-5/fable.html:196-220`), laid over a hand-authored track (explicit `addSection()` calls building S-curves, a hairpin, and a long sweeper, `fable-5/fable.html:63-72`) rather than a procedural curve. The other three all generate their curve from a formula instead (e.g. `grok-4.5/car-racing.html:157-169`; Muse Spark 1.1's curve is disabled entirely per the finding above).
- **Grok 4.5 has the most complete steering model of the four**: a speed-scaled steer rate, an explicit "center assist" that gently self-centers the car when not hard-steering (`grok-4.5/car-racing.html:355-360`), and a soft-wall bounce-back at the road edges instead of a hard clamp (`grok-4.5/car-racing.html:387-399`). It's also one of the two builds with zero touch support (see above), a real gap given how arcade-friendly the rest of its physics reads.
- **Only GPT-5.6 Sol ships a crash guard.** A global `window.addEventListener("error", ...)` handler swaps in a friendly in-page error card instead of a blank canvas if anything throws (`gpt-5.6-sol/index.html:18-28`). None of the other three builds has any equivalent safety net.
- **Muse Spark 1.1 is the only build with a network dependency**: it pulls three Google Fonts families over a `<link>` tag (`muse-spark-1.1/index.html:7`), while the other three use system font stacks only and make zero network calls, a step away from the "single HTML file" self-contained spirit of the prompt, though the page still renders offline via font fallback.
- **Mute is also a 2-2 split, independent of the touch split.** GPT-5.6 Sol (`gpt-5.6-sol/index.html:254`) and Muse Spark 1.1 (`muse-spark-1.1/index.html:634`) both wire a working `M`-key mute toggle; Fable 5 and Grok 4.5 have no mute control at all.

## Scorecard

1–5 per axis, single kept build per model (Muse Spark 1.1 and Grok 4.5 needed 4–5 tries to reach theirs, Fable 5 and GPT-5.6 Sol needed 2–3), scored from the static read and smoke test above, not a played impression.

| Model | Spec fidelity | Physics/feel | Touch/Mobile | Persistence | Polish | Offline-safe | **Mean** | Cost | **Quality/$** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|---:|---:|
| GPT-5.6 Sol | 5 | 4.5 | 4.5 | 5 | 4 | 5 | **4.67** | $0.42 | ~11.1 |
| Grok 4.5 | 5 | 5 | 1 | 5 | 5 | 5 | **4.33** | $0.31 | ~14.0 |
| Muse Spark 1.1 | 3.5 | 3.5 | 4.5 | 5 | 4 | 2 | **3.75** | $0.22 | ~17.0 |
| Fable 5 | 5 | 3 | 1 | 1 | 5 | 5 | **3.33** | $0.80 | ~4.2 |

## Verdict

The static read and the actual playtest don't agree. On code alone, **GPT-5.6 Sol** and **Grok 4.5** lead (4.67 vs 4.33), **Muse Spark 1.1** is third, and **Fable 5** is last, dragged down by no delta-time physics, no touch input, and no persisted score, despite having the richest scene of the four. Played by hand, **Fable 5** ties **GPT-5.6 Sol** for first (9/10), **Grok 4.5** takes 7/10, and **Muse Spark 1.1** takes 6/10. Fable 5's code gaps just don't seem to hurt how it actually plays.

On price, **Muse Spark 1.1** (~$0.22) and **Grok 4.5** (~$0.31) stay cheapest even after their extra re-rolls; **GPT-5.6 Sol** (~$0.42) and **Fable 5** (~$0.80) cost more. Weighing play score against price, **GPT-5.6 Sol** looks like the strongest all-around pick, tied for the best play score at less than half of Fable 5's cost. **Fable 5** plays just as well but is the most expensive build here. **Grok 4.5** and **Muse Spark 1.1** are the budget picks, at a real drop in how they play.

## Limitations

- n=1 kept build per model (Muse Spark 1.1/Grok 4.5 needed 4–5 tries, Fable 5/GPT-5.6 Sol needed 2–3); no variance estimate across attempts.
- The Scorecard's axes are read from code, not played; the manual playtest scores are the actual played impression, and the two disagree on Fable 5 (see Verdict).
- Cost is a rough estimate, not metered: bytes ÷ 4 × published price, scaled by re-roll count; Fable 5's figure is hand-adjusted rather than formula output. Treat all four as a floor.
- Context-window figures are each model's max published context, not tokens used here; informational only, not part of the cost estimate.
