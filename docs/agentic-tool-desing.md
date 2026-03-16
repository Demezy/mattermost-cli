# Agentic CLI Design Best Practices

Synthesized from Anthropic docs, GitHub CLI, Stripe CLI, MCP spec, InfoQ, DEV Community, Jina AI, and practitioner blogs.

---

## Priority 1 — Structured Output

**`--json` global flag** is the single highest-impact change. Every credible CLI (gh, stripe, claude) does this.

- JSON to **stdout**, human/progress output to **stderr**
- Consistent envelope: `{"ok": true, "data": ...}` / `{"ok": false, "error": {...}}`
- Return **only high-signal fields** by default (Anthropic: "bloated responses waste context tokens and confuse Claude")
- Support `--fields id,name,display_name` for agents to request exactly what they need
- TTY-aware: detect `!process.stdout.isTTY` and auto-switch to JSON/TSV

## Priority 2 — Structured Errors

Agents can't interpret stack traces or parse human prose.

- **In `--json` mode, errors must also be valid JSON** — same parser, same envelope
- Include: machine-readable `code`, human `message`, and `hint` with recovery command
- Example: `{"ok": false, "error": {"code": "channel_not_found", "message": "Channel 'foo' not found", "hint": "Run 'mm channels list' to see available channels"}}`
- Surface `mattermostErrorId` and `statusCode` from the API

## Priority 3 — Semantic Exit Codes

Agents use exit codes for branching without parsing text.

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General/usage error |
| 2 | Auth failure |
| 3 | Resource not found |
| 4 | Network/server error |
| 5 | Permission denied (read-only) |

## Priority 4 — Non-Interactive Operation

Agents cannot respond to prompts.

- **Never prompt when stdin is not a TTY** — fail with clear error instead
- Add `--yes`/`--confirm` flag for destructive operations
- `--dry-run` for write operations (shows what would happen)
- Your existing `MM_READ_ONLY` is already good safety for agent orchestrators

## Priority 5 — Self-Description / Discoverability

LLMs select tools based on names and descriptions (Anthropic: "most critical factor in tool performance").

- **`mm schema`** command — outputs JSON manifest of all commands, args, types, and annotations. Analogous to MCP `tools/list`. Agent calls this once to understand the full surface area.
- **`--help` must include examples** with realistic values and example output
- `--json` with no fields should list available fields (the `gh` pattern — agents discover schema at runtime)

## Priority 6 — Token Economy

CLI beats MCP by ~35x on token efficiency (benchmark cited by multiple sources). Keep that advantage.

- Default to 20-25 results, require `--limit` for more
- Paginate with cursors (`--after <cursor>`), not pages
- Suppress all decoration (color, spinners, ASCII) in JSON mode
- Progressive disclosure: list summaries first, let agents drill into details

## Priority 7 — Reduce Round-Trips

Each tool call costs tokens and compounds error probability (Anthropic: "95% per-step accuracy → low end-to-end success over 500 steps").

- **Accept both IDs and names** for resource args (channels, users) — eliminates lookup calls
- Resolve references internally where possible (`--channel town-square` resolves name→ID inside the tool)
- Consistent noun-verb hierarchy: `mm channels list`, `mm messages send`, `mm users search`

## Priority 8 — Idempotency

Agents retry. Networks fail.

- Read ops are naturally safe
- For writes, consider `--idempotency-key` where Mattermost supports it
- "Create" operations should return existing resource if already exists (or return a structured error with the existing ID)

## Priority 9 — Agent Documentation

- An **`AGENTS.md`** or `llms.txt` file (~100 tokens) listing commands, purpose, and example invocations is extremely high-leverage (cited as key pattern by multiple sources)
- MCP tool annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`) should be tracked per command even before building MCP support

## Priority 10 — Future MCP Server Mode

- `mm serve` exposing every command as an MCP tool with `inputSchema`, annotations, and descriptions
- CLI and MCP share the same underlying command implementations — only transport differs

---

## Key Anti-Patterns to Avoid

| Anti-Pattern | Fix |
|---|---|
| Dumping raw API responses | Curate fields, return only what's useful |
| Inconsistent terminology | One noun per concept everywhere |
| >20 parameters per command | Consolidate, use sensible defaults |
| Opaque error codes | Actionable messages with recovery hints |
| Requiring agents to hold state | Make each command self-contained |
| No pagination | Default small pages with navigation hints |

---

## Sources

- Anthropic — tool use docs, "Writing Tools for Agents", "Building Effective Agents"
- GitHub CLI manual + blog
- Stripe CLI / Agent Toolkit
- MCP spec (2025-06-18)
- clig.dev
- InfoQ — "AI Agent Driven CLIs"
- DEV Community
- Jina AI CLI
- CLI-Anything (HKUDS)
- "Why CLI Tools Are Beating MCP" (Reinhard 2026)
