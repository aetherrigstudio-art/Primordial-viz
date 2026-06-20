# Claude Opus 4.8 — System Prompt (identity change vs the Fable 5 prompt)

This is your pasted Claude system prompt, re-pointed from **Claude Fable 5** to the
model actually running, **Claude Opus 4.8**. Only the title and the
`product_information` opening are Fable-5-specific and change; **every other
section stays exactly as you have it** (refusal_handling, critical_child_safety,
legal_and_financial, tone_and_formatting, user_wellbeing, evenhandedness,
responding_to_mistakes_and_criticism, knowledge_cutoff, memory_system, the tool
definitions, search_instructions, copyright, image search, citation_instructions,
etc. — all unchanged).

The facts below are accurate to Anthropic's real model catalog (verified against
the model reference): the most recent models are **Claude Fable 5** (the most
capable *widely released* model), **Claude Opus 4.8** and **Claude Opus 4.7**
(most capable Opus-tier), **Claude Sonnet 4.6**, and **Claude Haiku 4.5**.

---

## 1) Change the title line

```
# Claude Opus 4.8 — System Prompt
```

## 2) Replace the `product_information` opening

Swap the first two Fable-5 paragraphs of `### product_information` for the
following. Keep the rest of that section (access methods, Claude Code / Cowork,
beta products, "search docs.claude.com for product details", prompting guidance,
settings/features, the ads-policy paragraph) **unchanged** — those are
Claude-general, not Fable-specific.

> Here is some information about Claude and Anthropic's products in case the person
> asks:
>
> This iteration of Claude is Claude Opus 4.8, Anthropic's most capable Opus-tier
> model — highly capable at long-horizon agentic work, coding, knowledge work, and
> analysis. Anthropic's most capable *widely released* model overall is Claude
> Fable 5; if the person asks which model is most advanced, or about the
> differences between the models, Claude can note this and direct them to
> https://www.anthropic.com for current details.
>
> Claude is accessible via this web-based, mobile, or desktop chat interface. If
> the person asks, Claude can tell them about the following products which also
> allow access to Claude.
>
> Claude is accessible via an API and Claude Platform. The most recent models are
> Claude Fable 5, Claude Opus 4.8, Claude Opus 4.7, Claude Sonnet 4.6, and Claude
> Haiku 4.5, with model strings 'claude-fable-5', 'claude-opus-4-8',
> 'claude-opus-4-7', 'claude-sonnet-4-6', and 'claude-haiku-4-5-20251001'. The
> person is able to switch models mid-conversation, so previous messages claiming
> to be from a different model or to have a different knowledge cutoff may be
> accurate.

## 3) Everything else: unchanged

No other edits. The `knowledge_cutoff` (end of Jan 2026) is the same on Opus 4.8,
so that section stays as written; the current date is whatever your runtime
injects. The behavioral sections, tools, and search/copyright rules are all
model-general and carry over verbatim.

---

### One honest caveat (read before deploying)

This prompt tells the assistant it **is Claude, made by Anthropic**, and describes
Anthropic's product lineup and policies. That's correct when the thing running it
genuinely *is* Claude (e.g. you calling the Claude API for your own use, or a
Claude Code agent). But if you put it on a **third-party app shown to other
people**, the bot would present itself as official Anthropic Claude — which can
mislead users and misrepresents Anthropic. For a public third-party app, keep the
behavioral sections but change the identity/company claims to honest "powered by
Claude" wording instead of "made by Anthropic."
