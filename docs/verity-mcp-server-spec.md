# Verity MCP Server — Technical Specification

**Document version:** 0.1.0 (draft)
**Status:** Pre-implementation design spec
**Audience:** Andy + any future contributor or design partner

---

## 1. What this is

`@anchorwithin/mcp-verity` is a Model Context Protocol (MCP) server that exposes the Verity hash-chained provenance API as a tool surface for AI agents. Any developer running an MCP-compatible host (Claude Desktop, Cursor, Cline, Continue, Windsurf, or a custom agent built with the MCP SDK) can install this server with one command and gain four new capabilities for their agent: **verify content**, **retrieve receipts**, **prove chain integrity**, and **audit recent activity**.

The MCP server is a thin protocol adapter. It does **not** store data. It translates MCP tool calls into HTTPS calls against the Verity REST API and returns the responses formatted for LLM consumption.

```
┌─────────────────────────┐
│  Claude Desktop / Cursor│
│  / Cline / agent host   │
└───────────┬─────────────┘
            │  MCP protocol (stdio JSON-RPC)
            ▼
┌─────────────────────────┐
│ @anchorwithin/mcp-verity│  ← this spec
│ (local Node 18+ process)│
└───────────┬─────────────┘
            │  HTTPS REST
            ▼
┌─────────────────────────┐
│   Verity REST API       │
│   (Cloudflare Worker    │
│    + D1 SQL)            │
└─────────────────────────┘
```

The Verity REST API itself is specified separately in `/docs/openapi/anchorwithin-agent-services.yaml` (the spec already shipped in Phase 6.0).

## 2. Distribution

**npm package name:** `@anchorwithin/mcp-verity`
**Runtime:** Node 18+ (uses `fetch`, `crypto.subtle`)
**Size budget:** < 50 KB minified + dependencies (target: zero non-dev deps beyond `@modelcontextprotocol/sdk`)

### Installation by end users

Standard MCP host config (Claude Desktop example, `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "verity": {
      "command": "npx",
      "args": ["-y", "@anchorwithin/mcp-verity"],
      "env": {
        "VERITY_API_KEY": "vrt_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

After saving and restarting the host, Verity tools appear in the LLM's tool list automatically. No further configuration required.

For Cursor (`.cursor/mcp.json`), Continue, Cline, and other hosts — the same package, same config structure, different file path.

## 3. Configuration

| Env var | Required | Default | Purpose |
|---|---|---|---|
| `VERITY_API_KEY` | ✓ | — | Bearer token issued at signup (`vrt_live_...` or `vrt_test_...`) |
| `VERITY_BASE_URL` | optional | `https://api.anchorwithin.com/v1` | Override for self-hosted instances or testing |
| `VERITY_DEFAULT_MODEL` | optional | none | Default model name stamped on receipts if caller doesn't specify |
| `VERITY_TIMEOUT_MS` | optional | `10000` | HTTPS request timeout |
| `VERITY_DEBUG` | optional | `0` | If `1`, logs request/response to stderr for debugging |

Missing or invalid `VERITY_API_KEY` causes the server to start but every tool returns a structured `unauthorized` error with a help URL. The server never exits — agents can call other servers while the user fixes auth.

## 4. Tools exposed

The MCP server registers four tools. Schemas follow JSON Schema, per the MCP specification.

### 4.1 `verify_text`

**Description (visible to the LLM):**
> Submit text content for provenance verification. Returns a tamper-evident receipt with a chain index, previous-hash link, and a public verification URL. Use this after producing important factual claims or any output the user may need to prove later.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "content": {
      "type": "string",
      "description": "The text to verify. The content itself is hashed client-side; only the SHA-256 hash is transmitted to the Verity API."
    },
    "model": {
      "type": "string",
      "description": "Identifier of the model that produced the content (e.g. 'claude-sonnet-4-7', 'gpt-4o'). Required if VERITY_DEFAULT_MODEL is not set."
    },
    "purpose": {
      "type": "string",
      "description": "Short free-text describing why the content is being verified (e.g. 'answer-to-customer-query', 'research-citation', 'agent-handoff'). Recommended."
    },
    "principal": {
      "type": "string",
      "description": "Optional identifier of the human or agent on whose behalf the content was produced."
    }
  },
  "required": ["content"]
}
```

**Output (text):**
```
Verified.
Receipt ID:     vrt_01HKWP4ZQX...
Chain index:    47281
Previous hash:  a3f2...8c91
Issued at:      2026-06-15T14:23:08Z
Verify URL:     https://verity.anchorwithin.com/r/vrt_01HKWP4ZQX...
Quota remaining: 99,847 of 100,000 receipts this period
```

**Behavior:**
- Hashes `content` client-side via Web Crypto SHA-256
- POSTs `{ content_hash, model, purpose, principal }` to `/v1/receipt`
- Returns a human-readable summary AND a structured JSON block the host can parse

### 4.2 `get_receipt`

**Description:**
> Retrieve a previously-issued receipt by its ID. Returns the full receipt plus a Merkle-style verification proof.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "receipt_id": {
      "type": "string",
      "description": "Receipt ID in the form vrt_XXXXX..."
    }
  },
  "required": ["receipt_id"]
}
```

**Output:** full receipt JSON + plain-English summary.

### 4.3 `verify_chain_integrity`

**Description:**
> Cryptographically verify that a stated range of the Verity hash chain has not been tampered with. Use this to prove the entire receipt history is consistent — e.g. before relying on Verity for a compliance claim.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "from_index": { "type": "integer", "minimum": 0 },
    "to_index":   { "type": "integer", "minimum": 0 }
  }
}
```

If `from_index` and `to_index` are omitted, verifies the latest 1,000 receipts.

**Output:** PASS / FAIL with the offending index if FAIL.

### 4.4 `list_my_recent_receipts`

**Description:**
> List the most recent receipts issued under the calling API key. Useful for debugging and for showing the user what's been verified.

**Input schema:**
```json
{
  "type": "object",
  "properties": {
    "limit":  { "type": "integer", "minimum": 1, "maximum": 50, "default": 10 },
    "cursor": { "type": "string", "description": "Pagination cursor from previous response" }
  }
}
```

**Output:** receipts array + next cursor.

## 5. Resources exposed

MCP allows servers to expose URI-addressable resources the LLM can read on demand.

| URI | What it returns |
|---|---|
| `verity://receipt/{id}` | Full receipt for `{id}` (same as `get_receipt` tool, addressable via URI) |
| `verity://chain/head` | Current chain head: latest index + hash + issued_at |
| `verity://my/usage` | Current period quota: receipts used / limit / reset date |
| `verity://help` | Built-in help text — installation, common errors, link to full docs |

Resources are useful when the LLM wants to *reference* a receipt in its response without invoking a full tool call.

## 6. Prompts exposed

MCP servers can register pre-built prompts that the user can invoke explicitly. Two registered prompts:

### `verify-my-last-output`
A one-click prompt the user can trigger that says: *"Take your most recent factual response in this conversation and submit it to verify_text. Then quote the receipt ID at the bottom of your answer."*

### `cite-verified-source`
A prompt that takes a source URL as an argument: *"Fetch the content at this URL, verify it via Verity, and format a citation in the form: `[N] {title} (Verity receipt: {receipt_id})`."*

These two prompts give non-technical users (i.e., the human typing into Claude Desktop) a way to invoke Verity without knowing tool names.

## 7. Example agent interaction

Below: what the user experiences in Claude Desktop after installing the server.

```
User: What's the current valuation of Anthropic?

Claude: Based on the most recent public reporting (early 2026),
Anthropic's last funding round valued the company at approximately
$X billion. [Tool call to verify_text with the content above and
model="claude-sonnet-4-7" purpose="research-citation"]

Verified ✓
Receipt: vrt_01HKWP4ZQX...
Chain index: 47,281
Verify at: https://verity.anchorwithin.com/r/vrt_01HKWP4ZQX...

I have logged this answer to Verity so you (or anyone you share it
with) can later confirm exactly what I said and when. If new
reporting contradicts this number, the receipt will still show
this is what I told you on 2026-06-15.
```

This is the agent commerce moment. The user did nothing technical. The LLM autonomously decided to verify because the system prompt or model behavior tells it to verify factual claims. **That decision is made by the LLM, not the dev — once the tool is available, the LLM uses it intelligently.**

## 8. Error handling

All errors are returned as structured MCP errors with a stable `code`, a human-readable `message`, and a `help_url`. Categories:

| Code | When | What the LLM sees |
|---|---|---|
| `unauthorized` | API key missing/invalid/expired | "Verity is not configured. Get a free API key at https://verity.anchorwithin.com/start" |
| `quota_exceeded` | Free or paid tier limit reached | "Verity quota exceeded for this period. Upgrade or wait for reset on {date}." |
| `rate_limited` | Per-second rate limit hit | "Rate limit exceeded — retry after {seconds}s" (LLM can call again later) |
| `bad_request` | Malformed input | The validation message itself |
| `network_error` | Verity API unreachable | "Could not reach Verity API — verification skipped, please retry later" |
| `timeout` | Request exceeded `VERITY_TIMEOUT_MS` | Same as network_error |

**No error ever throws or crashes the server.** Failures degrade gracefully — the host LLM can complete its response without verification and tell the user that verification was skipped.

## 9. Security considerations

- **Content stays local.** Only SHA-256 hashes are transmitted to the Verity API. The plaintext never leaves the user's machine. This is the most important property and the user-facing security promise.
- **API key never logged** unless `VERITY_DEBUG=1` is explicitly set, and even then the key is masked except first/last 4 characters.
- **HTTPS-only transport** — TLS 1.3 minimum on the Verity API.
- **Rate-limit per API key** enforced server-side, prevents single agent from exhausting Verity infrastructure.
- **Receipts are public-by-default but content is private** — the receipt contains the hash, not the content. Third parties verifying a receipt can confirm the hash matches a content they have a copy of, but cannot recover the content from the receipt alone.
- **No PII in receipts** unless caller explicitly puts it in `purpose` or `principal` fields. SDK warns on common PII patterns.

## 10. Versioning + changelog

- **Server version** follows SemVer. `1.0.0` is the first stable release. Pre-`1.0.0` is allowed to break.
- **MCP protocol version** is locked to the version of `@modelcontextprotocol/sdk` the server depends on.
- **Verity API version** (`v1`) is independent. Server tolerates `v1` minor field additions without changes.
- **Breaking changes** to tool schemas require a major version bump AND a deprecation period of 90 days announced in the changelog.
- Server prints its version + the MCP SDK version + the resolved Verity API base URL on startup to stderr.

## 11. Performance budget

| Metric | Target |
|---|---|
| Cold start (first tool call) | < 300 ms (includes Node startup + first HTTPS handshake) |
| Warm tool call latency (p50) | < 80 ms client → server → API round trip |
| Memory footprint (resident) | < 40 MB |
| Throughput | Bounded by Verity API rate limit, not the server |

## 12. Open questions (decisions to make before v1.0.0)

1. **Should the MCP server cache the most recent receipt locally** (so `get_receipt` for a just-issued ID returns instantly without an API call)? *Recommendation: yes, LRU 100 entries, 5 min TTL.*
2. **Should the `verify_text` tool offer a `dry_run` mode** that returns what the receipt *would* look like without consuming quota? *Recommendation: yes, gated behind an explicit `dry_run: true` field.*
3. **Should the server expose a `verity://search?q=...` resource** allowing the LLM to query its own previously-issued receipts by content keyword? *Recommendation: no for v1 — content is hashed-only, so search would require server-side plaintext storage which violates the privacy promise.*
4. **MCP elicitation support** — the MCP spec supports server → user prompts for missing info. Should `verify_text` elicit a `model` value from the user if neither input nor `VERITY_DEFAULT_MODEL` provides one? *Recommendation: yes for v1.1, no for v1.0.*
5. **Should we publish a `@anchorwithin/mcp-verity-hosted` SaaS variant** where the user provides only their API key and we host the MCP server (eliminating local Node requirement)? *Recommendation: yes, eventually — but local-first first.*

## 13. Out of scope for the MCP server (lives in the REST API)

- API key issuance (handled at signup via web flow)
- Subscription management (Stripe customer portal)
- Receipt search / filter UIs (web dashboard, not LLM-facing)
- Webhooks for downstream system integration (separate REST endpoint)
- Bulk verify endpoints (REST API only, MCP is optimized for one-at-a-time agent calls)

## 14. Build readiness

Building this server is approximately **10 hours of focused work** assuming the Verity REST API is already live:

| Hour | Output |
|---|---|
| 1–2 | npm package scaffold, MCP SDK integration, tool registration |
| 3–4 | `verify_text` tool with client-side hashing |
| 5 | `get_receipt`, `list_my_recent_receipts` |
| 6 | `verify_chain_integrity` |
| 7 | Resources + prompts |
| 8 | Error handling + retry logic |
| 9 | Tests against a mock REST server |
| 10 | README, publish to npm, smoke-test in Claude Desktop |

This is the simplest, highest-leverage layer of the entire Verity stack: a thin wrapper that makes the product instantly callable by tens of thousands of devs already running MCP hosts.

---

*This spec is intentionally complete enough to hand to a contractor or future-Claude session as a build brief. If you make changes to the design, update this document first, then the implementation.*
