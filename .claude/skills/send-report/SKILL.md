---
name: send-report
area: meta
description: Send the newest /insights usage report to the user as a file. Use after running /insights when the file:/// link can't be opened (mobile/cloud sessions can't reach the container filesystem), or when the user asks to "send the report".
---

# send-report — deliver the latest insights report

`/insights` is a built-in command that writes an HTML report to a container path
and prints a `file:///root/.claude/usage-data/report-*.html` link. That link is
unreachable on mobile/cloud (the phone can't see the container's filesystem), so
deliver the file itself.

## Steps
1. Find the newest report:
   `ls -t ~/.claude/usage-data/report-*.html 2>/dev/null | head -1`
   (fall back to `/root/.claude/usage-data/` if `~` doesn't resolve).
2. If none exists, tell the user to run `/insights` first.
3. Send it with **SendUserFile** (absolute path, `status: "normal"`, a one-line
   caption). The user opens it from the chat.

Keep it to those steps — no need to read or summarize the HTML.
