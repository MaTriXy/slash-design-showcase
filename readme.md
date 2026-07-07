# `/design`, Slash Design Showcase

> Real-world side-by-side evaluations of Command Code AI's `/design` agent across frontier models (Opus 4.8, Sonnet 5, GPT-5.5, Fable 5) and strong open-source models (GLM 5.2, DeepSeek V4 Pro, Kimi K2.7 Code).

📖 Docs: [commandcode.ai/docs/slash-commands/design](https://commandcode.ai/docs/slash-commands/design)

**Key takeaway:** GLM 5.2 repeatedly matches or beats top-tier closed models on design precision, motion quality, footer polish, section accuracy, and UX fidelity, while being dramatically cheaper. Open models like DeepSeek V4 Pro are closing the gap extremely fast on both UI *and* real product UX.

---

## Summary Stats

- **Total comparisons:** 20 videos
- **Models tested:** GLM 5.2 (and Fast variant), Opus 4.8, Sonnet 5, GPT-5.5, Fable 5, DeepSeek V4 Pro, Kimi K2.7 Code, "Open models"
- **Common prompt patterns:** `/design redesign`, `/design checkup`, `/design checkup, then fix what the report flags`
- **Focus areas:** Landing pages (SaaS, education, clothing, architecture, pet shops, real estate), dashboards, developer portfolios, interactive experiences (Flappy Bird UX tests), Linear-style taste, speed vs quality

---

## Video Gallery

### Interactive / Game UX Tests (New)

**dv-19**, [MrAhmadAwais](https://x.com/MrAhmadAwais/status/2074536879308026031)  
**Models:** DeepSeek V4 Pro vs GLM 5.2 vs Fable 5  
**Prompt:** `/design` (Flappy Bird style game, focus on real UX, interaction, flow, hierarchy and product decisions)  
**Description:** Same game, same prompt, three models. Fable 5 produced good UI but UX felt off (blinking issues, hard to track). GLM 5.2 and DeepSeek delivered smooth, playable experiences. Costs: DeepSeek ~$0.0008, GLM 5.2 ~$0.048, Fable significantly higher with little UX advantage. Open-source models are getting very interesting for design tasks.

**dv-20**, [naymur_dev](https://x.com/naymur_dev/status/2073059979834331206)  
**Models:** DeepSeek V4 Pro vs GLM 5.2 vs Fable 5  
**Prompt:** `/design` (same game prompt, focus on UX not just UI)  
**Description:** Creating the same interactive game with three models using `/design`. Huge difference in UX despite similar-looking UIs. GLM 5.2 felt far more comfortable to play. DeepSeek extremely cheap and competitive. Fable 5 good on polish but not worth the price delta for design/UX work. OS models beat premium ones on pricing + UX simultaneously.

---

### Landing Pages & SaaS

**dv-1**, [CommandCodeAI](https://x.com/CommandCodeAI/status/2072363959773233606)  
**Models:** GLM 5.2 vs Sonnet 5  
**Prompt:** `/design redesign, give this landing page richer motion, hover states, and a stronger footer`  
**Description:** Same prompt, two models. GLM 5.2 wins on effects, motion, and footer polish, and comes in cheaper.

**dv-2**, [CommandCodeAI](https://x.com/CommandCodeAI/status/2071942930710090111)  
**Models:** GLM 5.2 vs Opus 4.8  
**Prompt:** `/design redesign, build a landing page for a SaaS product`  
**Description:** Identical prompts across six categories (SaaS, portfolios, dashboards, architecture, pet shops, real estate). GLM 5.2 impressed every time.

**dv-3**, [naymur_dev](https://x.com/naymur_dev/status/2072425070069432359)  
**Models:** GLM 5.2 vs Sonnet 5  
**Prompt:** `/design redesign, build a landing page for a clothing brand`  
**Description:** A clothing brand landing page. Results were close, but GLM 5.2 took it on design precision and cost.

**dv-5**, [naymur_dev](https://x.com/naymur_dev/status/2072305440348897738)  
**Models:** GLM 5.2 vs Sonnet 5  
**Prompt:** `/design checkup, then fix what the report flags`  
**Description:** Same prompt again. GLM 5.2 nailed section accuracy where Sonnet 5 looked good but drifted off-brief, at a fraction of the cost.

**dv-7**, [naymur_dev](https://x.com/naymur_dev/status/2070626330719514805)  
**Models:** GLM 5.2 vs Opus 4.8  
**Prompt:** `/design redesign, build an education platform landing page`  
**Description:** An education landing page, one-shotted. Opus had a nicer hero, GLM won on overall finishing and polish.

**dv-9**, [naymur_dev](https://x.com/naymur_dev/status/2070313251188121706)  
**Models:** GLM 5.2 vs Opus 4.8  
**Prompt:** `/design redesign, build a SaaS landing page`  
**Description:** A SaaS landing page, one-shotted. GLM 5.2 came out clean, premium, and precise.

**dv-16**, [naymur_dev](https://x.com/naymur_dev/status/2069192459889053938)  
**Models:** GLM 5.2 vs Opus 4.8  
**Prompt:** `/design redesign, give this a Linear-style visual taste`  
**Description:** A landing page with Linear's visual taste, identical prompts. GLM didn't just compete, it won.

---

### Dashboards, Portfolios & Other

**dv-11**, [naymur_dev](https://x.com/naymur_dev/status/2069823448852111460)  
**Models:** Opus 4.8 vs GLM 5.2 vs GPT-5.5  
**Prompt:** `/design redesign, build an analytics dashboard`  
**Description:** A dashboard design, one-shotted across three models. GLM 5.2 beat both top-tier models.

**dv-13**, [naymur_dev](https://x.com/naymur_dev/status/2068103032504729644)  
**Models:** GLM 5.2 vs Opus 4.8  
**Prompt:** `/design redesign, build a developer portfolio`  
**Description:** A modern, clean, developer-friendly personal portfolio. GLM 5.2 came shockingly close to Opus 4.8.

**dv-15**, [naymur_dev](https://x.com/naymur_dev/status/2068477261662355637)  
**Models:** GLM 5.2 vs Opus 4.8  
**Prompt:** `/design redesign`  
**Description:** Real UI tasks, identical prompts. GLM came shockingly close to Opus 4.8 and won some rounds outright.

**dv-6**, [naymur_dev](https://x.com/naymur_dev/status/2072039588617719809)  
**Models:** GLM 5.2 Fast vs DeepSeek V4 Pro vs Kimi K2.7 Code  
**Prompt:** `/design redesign, ship something production-ready, fast`  
**Description:** Speed vs quality. GLM 5.2 Fast: fastest with great output. DeepSeek V4 Pro: solid but slow. Kimi K2.7 Code: generic, GSAP-heavy output.

**dv-10**, [naymur_dev](https://x.com/naymur_dev/status/2069914540645777782)  
**Models:** GLM 5.2 Fast vs GLM 5.2  
**Prompt:** `/design redesign`  
**Description:** Same prompt, fast vs regular. Nearly identical section count and quality, but GLM 5.2 Fast is dramatically quicker.

**dv-8**, [MrAhmadAwais](https://x.com/MrAhmadAwais/status/2070339566557655527)  
**Models:** Open models  
**Prompt:** `/design checkup`  
**Description:** Command Code paired with open models and the /design skill, one-shotted end to end.

---

### Developer Taste & Precision Tests

**dv-17**, [naymur_dev](https://x.com/naymur_dev/status/2072795260598788243)  
**Models:** DeepSeek V4 Pro vs Fable 5  
**Prompt:** `DEV_TASTE_PROMPT` (developer-focused clean taste profile)  
**Description:** Same prompt and taste profile, two models. DeepSeek V4 Pro cost $0.0005 for the run; Fable 5 held its own with a precise prompt.

**dv-18**, [naymur_dev](https://x.com/naymur_dev/status/2072756543188246928)  
**Models:** GLM 5.2 vs Fable 5  
**Prompt:** `DEV_TASTE_PROMPT`  
**Description:** Same straightforward prompt, two models. Fable 5 felt off this round; GLM 5.2 came out cleaner and more precise.

---

## How to Use These

These videos were generated using the `/design` command in Command Code AI (with different modes like `redesign`, `checkup`, and custom taste profiles).

The full `DESIGN_VIDEOS` array (TypeScript) powering any gallery component lives in the codebase and contains the structured data for each entry (id, url, models, description, prompt).

**Want to run your own comparisons?**  
Use `/design` with a clear brief + optional `DEV_TASTE_PROMPT` or Linear-style guidance. Then share the result on X, we're collecting the best ones.

Full command reference and options: [commandcode.ai/docs/slash-commands/design](https://commandcode.ai/docs/slash-commands/design)

---

## Credits

Curated from public X posts by [@naymur_dev](https://x.com/naymur_dev), [@MrAhmadAwais](https://x.com/MrAhmadAwais), and [@CommandCodeAI](https://x.com/CommandCodeAI) (Command Code team).

Built with ❤️ for high-taste, production-ready design tooling.

---

*Last updated: July 2026, 20 comparisons and counting. The gap between "frontier" and strong open models on real design/UX work is narrowing fast.*