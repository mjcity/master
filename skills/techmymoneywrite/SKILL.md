---
name: techmymoneywrite
description: Write and prepare TechMyMoney WordPress drafts modeled on current tech coverage, with richer reporting quality. Use when the user says “techmymoneywrite” or asks for Engadget-style article production, including opening recent Engadget and PR Newswire source material, selecting the best fresh non-duplicate topic (or more only when requested), synthesizing original articles with comparison/review structure, adding professional formatting (bold lead, H2/H3 structure, clean paragraphs), citing primary/credible sources, embedding original-source media links when available (YouTube/social), generating related images in ChatGPT from regular Brave (for reliable downloads), setting featured images, and doing final line-by-line polish (headline, SEO meta, alt text) before publish. Keep all non-image tasks in isolated Brave where WordPress accounts are already signed in; use regular Brave only for ChatGPT image generation/download.
---

# TechMyMoneyWrite

## Workflow

1. Open trusted current-news sources (including Engadget, The Verge, and PR Newswire when available) and collect recent candidate stories in separate tabs, then select the **single best fresh topic** for this run unless user asks for multiple posts.
2. Run a duplicate check before writing:
   - check existing TechMyMoney posts/drafts for same story angle, same source URL, or very similar headline
   - if a topic was already covered previously, **skip it** and pick the next recent Engadget article
   - never produce a repeat/rewrite of an already published or previously drafted TechMyMoney post unless the user explicitly asks for an update
3. Read and extract:
   - core angle
   - key facts and claims
   - source links worth citing
4. Draft original TechMyMoney article(s):
   - do **not** copy wording
   - keep human, professional, publication-grade tone
   - prioritize consumer impact and money angle
5. Format for readability:
   - bold opening takeaway line
   - clear H2/H3 subheads
   - short mobile-friendly paragraphs
   - bullet lists for checklists/takeaways
   - inline links on relevant phrases (not raw link dumps)
   - comparison/review clarity: what changed, who should buy/skip, value verdict
6. Source quality rules (mandatory):
   - use the original/primary source as the narrative anchor when available (do not default to "Engadget reported" phrasing)
   - cite Engadget AND The Verge for review/comparison stories, plus at least 1 additional primary/credible source
   - quote key facts from original/primary source with attribution
   - add research context (market, legal, product, or buyer-impact detail) so posts feel substantive, not generic
   - for new product launches/reviews, include a detailed "Specs at a glance" section (table/list)
   - only if the user explicitly requests a review format: in WordPress Post Settings → Reviews, enable Stars, write Review Description summarizing why the rating was given, add at least 5 feature names, and set star ratings
   - add a "Sources & Credits" section at the end of each post
   - if source includes a YouTube/social video relevant to the story, paste its URL on its own line so WordPress auto-embeds it
7. WordPress prep:
   - set title
   - paste polished content
   - ensure categories/tags are sensible
   - keep each new draft open in its own WordPress tab for easier user review
8. Image workflow (mandatory, run every time):
   - always run image phase immediately after writing posts (do not stop after text drafts)
   - determine the post’s core visual subject before choosing images
   - source candidate visuals from primary/news `og:image` first when relevant
   - if source visuals are weak or mismatched, generate one fresh topic-matched hero image in ChatGPT
   - continue until all written posts have matching, non-filler featured images
9. Image workflow (regular Brave for downloads):
   - do writing/editing/publishing tasks in **isolated Brave**
   - switch to **regular Brave** for ChatGPT image generation and download reliability
   - open ChatGPT in regular Brave and generate similar-style **original** hero images
   - if ChatGPT is logged out, use **Continue with Google** (saved Google account login)
   - download images in regular Brave, verify files exist in `~/Downloads`
   - return to isolated WordPress tab, upload, and set featured image
10. Final polish before notifying user:
   - line-by-line edit for spelling/grammar
   - sharpen headline
   - set focus keyphrase
   - ensure 300+ words (prefer 330+)
   - shorten SEO title if overlong
   - add SEO meta description
   - add 1-2 internal links
   - set featured image alt text (topic/keyphrase aligned)
   - run repetition QA and remove duplicate boilerplate lines/paragraphs
   - save draft (never publish unless explicitly requested)

## Anti-Duplication Rule

- Do not repeat Engadget topics already done on TechMyMoney.
- Treat near-identical angles as duplicates even if headline wording differs.
- Prefer fresh categories/topics when recent feed items overlap prior coverage.
- If unsure, quickly search existing WP posts and compare source links before drafting.

## Browser Routing Rule

- **Isolated Brave:** Engadget + The Verge + PR Newswire research, WordPress drafting/editing, SEO/meta, final QA.
- **Regular Brave:** ChatGPT image generation + image downloads.
- Do not use isolated-browser ChatGPT downloads unless the user explicitly overrides this rule.
- If PR Newswire access is already signed in on isolated browser, use it as an additional research source each run.

## SEO Minimum Protocol (Mandatory)

For every draft before handoff:

- Focus keyphrase set
- 300+ words minimum (prefer 330+)
- SEO title kept concise/within viewable width
- Meta description set with keyphrase
- Keyphrase naturally distributed in intro/body/subheads
- At least 1-2 internal links to relevant TechMyMoney posts/pages
- Featured image alt text aligned to topic/keyphrase

## Editorial Quality Standard

- Sound like a confident human editor, not generic AI text.
- Keep claims specific and sourced.
- Avoid fluff and repetitive phrasing.
- Use clean transitions and clear reader value.
- End with a practical takeaway.
- Never use repeated boilerplate to increase length.

## Default Output Structure (per article)

Decide format per story as editor in chief:
- **Short-form:** concise update with tight analysis.
- **Long-form:** fuller context, implications, and buyer guidance.

Structure:
1. Headline
2. Bold lead takeaway (1 sentence)
3. Context paragraph
4. 3-5 H2 sections with analysis
5. Practical checklist or “what to do now” bullets
6. Bottom-line conclusion
7. Source links (inline + optional short source block)

## Image Prompt Template

Use this baseline and adapt to article topic:

"Generate a realistic, editorial-style horizontal hero image for a technology news article about <TOPIC>. Modern scene, premium lighting, no logos, no text, photorealistic, 16:9, high resolution."

## Completion Message to User

When finished, report:

- article titles
- draft IDs/URLs
- image status (downloaded + featured image set)
- request for review before publish
