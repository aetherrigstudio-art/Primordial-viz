#!/usr/bin/env bash
# Restore the Antigravity (agy) integration for this repo.
#
# agy's config lives in ~/.gemini and the NotebookLM MCP wrapper in ~/.local — NEITHER is
# git-durable, so a fresh cloud container loses them. This script regenerates all of it from
# the repo (the canonical NotebookLM wrapper is committed at .claude/agy/). Idempotent.
#
#   Run:    bash .claude/agy-setup.sh
#   Verify: timeout 25 agy -p ok ; grep -E 'total handlers|connected' \
#             "$(ls -t ~/.gemini/antigravity-cli/log/*.log | head -1)"
#
# See docs/tooling/antigravity-qa.md for what this wires and why.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$SCRIPT_DIR/.." && pwd)"

CFG="$HOME/.gemini/config"
HOOKS_DIR="$CFG/hooks"
WRAP_DIR="$HOME/.local/share/notebooklm-mcp"
WRAPPER="$WRAP_DIR/server.mjs"
VERIFY="$HOOKS_DIR/immersive-verify.mjs"

mkdir -p "$HOOKS_DIR" "$WRAP_DIR"

# 1) NotebookLM zero-dependency stdio MCP wrapper (canonical copy is committed in the repo).
cp "$REPO/.claude/agy/notebooklm-mcp-server.mjs" "$WRAPPER"

# 2) MCP servers — agy's NATIVE schema (validator rule: "must have either command or serverUrl";
#    HTTP uses serverUrl, NOT Claude's "type":"http").
cat > "$CFG/mcp_config.json" <<EOF
{
  "mcpServers": {
    "context7": { "serverUrl": "https://mcp.context7.com/mcp" },
    "mdn": { "serverUrl": "https://mcp.mdn.mozilla.net/" },
    "primordial": { "command": "node", "args": ["tools/mcp/server.mjs"], "cwd": "$REPO" },
    "notebooklm": { "command": "node", "args": ["$WRAPPER"] }
  }
}
EOF

# 3) Verify-after-edit hook — agy's named-hook → event → [{matcher, hooks:[...]}] schema (strict
#    JSON, no comments). matcher = agy's edit-tool names (confirm against a real edit if it changes).
cat > "$CFG/hooks.json" <<EOF
{
  "immersive-verify": {
    "PostToolUse": [
      {
        "matcher": "edit_file|write_file|create_file|replace_file_content|multi_replace_file_content|write_to_file|apply_patch",
        "hooks": [ { "type": "command", "command": "$VERIFY", "timeout": 120 } ]
      }
    ]
  }
}
EOF

# 4) The verify hook script. Quoted heredoc preserves the JS verbatim; __REPO__ is baked below.
cat > "$VERIFY" <<'EOF'
#!/usr/bin/env node
// agy PostToolUse hook — verify-after-edit for the immersive app. On an immersive/src JS edit,
// run the on-device gate (node --check + esbuild bundle smoke) and emit agy's decision contract.
import { execSync } from 'node:child_process'

const REPO = process.env.AGY_IMMERSIVE_REPO || '__REPO__'
const IMMERSIVE_PATH_RE = /immersive\/src\/[^\s"']*\.(?:jsx?|mjs)/

let input = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (d) => { input += d })
process.stdin.on('end', () => {
  if (!IMMERSIVE_PATH_RE.test(input)) return out({ decision: 'allow' })
  try {
    execSync(`for f in $(find immersive/src -name '*.js'); do node --check "$f" || exit 1; done`,
      { cwd: REPO, stdio: 'pipe', timeout: 45000 })
    execSync(`immersive/node_modules/.bin/esbuild immersive/src/main.jsx --bundle --format=esm --jsx=automatic --outfile=/dev/null`,
      { cwd: REPO, stdio: 'pipe', timeout: 90000 })
    return out({ decision: 'allow', reason: 'immersive gate GREEN (node --check + esbuild bundle smoke).' })
  } catch (e) {
    const detail = (e.stderr?.toString() || e.stdout?.toString() || e.message || '').trim().slice(-1200)
    return out({ decision: 'ask', reason: 'immersive verify FAILED — do not claim done until fixed:\n' + detail })
  }
})
function out(obj) { process.stdout.write(JSON.stringify(obj)); process.exit(0) }
EOF
sed -i "s|__REPO__|$REPO|g" "$VERIFY"

chmod +x "$VERIFY" "$WRAPPER"

echo "agy integration restored for repo: $REPO"
echo "  MCP: context7, mdn, primordial, notebooklm   hook: immersive-verify (PostToolUse)"
echo "  verify: timeout 25 agy -p ok ; grep 'total handlers' \"\$(ls -t ~/.gemini/antigravity-cli/log/*.log | head -1)\""
