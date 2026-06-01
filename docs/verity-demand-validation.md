# Verity Demand Validation — Public-Signal Research

**Document version:** 1.0
**Research date:** 2026-06-01
**Method:** AI research agent, public-signal scan only (no customer interviews, no surveys)
**Decision sought:** Should Andy commit ~50 hours to building Verity as a SaaS?

> ⚠️ **TL;DR — DEMAND SIGNAL: 3/10. RECOMMENDATION: NO-GO as currently scoped.**
> The technical problem is real. The market is not yet. Four open-source competitors already ship the exact design with negligible traction. LangChain maintainers rejected this exact feature when asked. **There is no public evidence of a paying buyer for "AI output receipts as a service."**
>
> See §10 for the full assessment and the conditions that would change the verdict.

---

## 1. Executive summary

The "tamper-evident, hash-chained receipts for AI agent actions" thesis is real and timely — but Verity is **not first to market**: at least four open-source projects (Signet, Agent Passport System, MCP Firewall, agentreceipts.ai) already ship exactly this design, all with Ed25519 + hash-chaining + MCP integration. Public developer demand is mostly **expressed by builders of these competing tools and academic researchers**, not by paying customers asking for it. **Demand signal: 3/10. Recommendation: NO-GO as currently scoped** — build a thin MCP wrapper for personal use over a weekend, but do not commit 50 hours to a SaaS unless you can name a paying first customer this week.

## 2. Methodology

Searched May–June 2026 for: (a) developer complaints about agent provenance/audit on Reddit, HN, GitHub issues; (b) commercial competitors in LLM observability and AI security; (c) open-source repos in adjacent spaces with star/recency data; (d) state of MCP ecosystem (registry counts, existing provenance servers); (e) EU AI Act enforcement timeline. **Could not access**: Reddit search returned almost nothing usable (Google site-restriction yielded only arXiv papers — Reddit's anti-scraping is biting public research), Discord/Slack member counts are not public, several DEV.to posts returned 403, and the GitHub `gh` CLI was unavailable so star counts were verified via WebFetch on the repo HTML page directly. Star counts are point-in-time as of June 1, 2026.

## 3. Direct demand evidence

The signal is thin. After targeted searching, only a handful of direct, public, dev-voiced asks were found. Most "evidence" came from arXiv papers and from the marketing copy of competing tools — neither of which is demand.

1. **LangChain RFC #35691** — "RFC: ComplianceCallbackHandler — tamper-evident audit trails for regulated industries" (Mar 9, 2026). *"I would like LangChain to support a ComplianceCallbackHandler pattern for generating tamper-evident audit trails for regulated industries."* **Closed as not planned** by maintainers — a strong negative signal that the closest framework to the buyer does not see this as core. https://github.com/langchain-ai/langchain/issues/35691
2. **Google ADK Python issue #4173** (2026) — agents invoking hallucinated tools causing crashes. Real pain, but the requested fix is graceful handling, not cryptographic receipts. https://github.com/google/adk-python/issues/4173
3. **dev.to: "Every MCP Tool Call My AI Makes Now Gets a Signed Receipt"** — a builder shipping their own version of Verity (the Agent Receipts protocol). The article *is* the demand-expression; it's also the competitor. https://dev.to/ojongerius/every-mcp-tool-call-my-ai-makes-now-gets-a-signed-receipt-2adc
4. **dev.to: "Your MCP Server Has No Audit Trail — A Security Checklist"** by willamhou — frames the gap explicitly. https://dev.to/willamhou/your-mcp-server-has-no-audit-trail-a-security-checklist-h1k
5. **dev.to: "Is that MCP request actually from your AI agent"** by willamhou — same author, identity/attestation pain. https://dev.to/willamhou/is-that-mcp-request-actually-from-your-ai-agent-3m28
6. **Stacklok blog**: "From unknown to verified: Solving the MCP server trust problem" — vendor framing pain about MCP trust. https://stacklok.com/blog/from-unknown-to-verified-solving-the-mcp-server-trust-problem/
7. **Aembit: "Auditing MCP Server Access: A Complete Security Guide"** — vendor identifies "most MCP servers don't address parameter integrity, replay protection, stdio authentication, and audit trails." https://aembit.io/blog/auditing-mcp-server-access/
8. **HN Show HN: "Early detection of LLM hallucinations via structural dissonance"** (Feb 2026) — adjacent, not direct. https://news.ycombinator.com/item?id=46959695
9. **arXiv 2603.10060 "Tool Receipts, Not Zero-Knowledge Proofs"** — academic statement of the exact problem Verity addresses. Researchers see it; that does not equal paying devs. https://arxiv.org/pdf/2603.10060
10. **arXiv 2603.14283 "AEX: Non-Intrusive Multi-Hop Attestation and Provenance for LLM APIs"** — same.

**Honest read**: 1–2 are real (devs asking maintainers). 3–7 are vendors/builders selling a similar solution (signal that *they* think there's demand — not that buyers do). 8–10 are researchers. **No Reddit/HN thread of an agent-product dev saying "I'd pay for this" was located.** That is the signal.

## 4. Homebrew solutions inventory

The mature observability category is large and well-funded; the homebrew layer is therefore *less* prevalent than expected — most devs reach for Langfuse or Helicone instead of rolling their own.

| Repo | Stars | Last activity | Category |
|---|---|---|---|
| langfuse/langfuse | 28.3k | May 28, 2026 | Full LLM observability (closest commercial competitor) |
| comet-ml/opik | 19.4k | Active | LLM/agent tracing |
| Helicone/helicone | 5.8k | Active | LLM proxy + observability |
| dillionverma/llm.report | (mid hundreds — unverified) | Logging/analytics for OpenAI |
| prajeesh-chavan/OpenLLM-Monitor | low (unverified) | Self-host dashboard |
| PromptSail/prompt_sail | low (unverified) | Transparent LLM proxy logger |
| lanesket/llm.log | low (unverified) | Local SQLite logger |
| modelcontextprotocol/servers | 86.5k | Active | Reference MCP servers |
| **Prismer-AI/signet** | **35** | Active (339 commits) | **Direct competitor — Ed25519 hash-chained receipts, 6 npm packages under `@signet-auth/`** |
| **aeoess/agent-passport-system** | **19** | Active (765 commits) | **Direct competitor — Ed25519 identity + receipts, `npm i agent-passport-system`** |
| **ressl/mcp-firewall** | **8** | Recent | **Direct competitor — Ed25519 + hash chain audit, "WAF for AI agents"** |
| aeoess/agent-passport-mcp | low (unverified) | MCP variant of above |
| Dicklesworthstone/mcp_agent_mail | low (unverified) | Agent coordination on FastMCP |

**Pattern**: Rolling-your-own logger is *not* a widespread practice — devs adopt Langfuse/Helicone. The cryptographic-receipts subspace exists but the existing OSS projects are all at <50 stars. That cuts two ways: small market signal *and* small competitor moats.

## 5. Direct competitor landscape

- **Langfuse** (28.3k stars, MIT, YC W23). Open-source LLM engineering platform. Hobby free (50k events/mo), Core $29/mo, Pro $199/mo, Enterprise $2,499/mo. Buyer: dev teams self-hosting. **Gap**: traces are mutable logs, not cryptographic proofs. **Complaint pattern**: teams outgrow eval features, hit limits at scale.
- **LangSmith** (proprietary). $39/user/mo. Buyer: LangChain shops. **Gap**: same — no tamper-evidence; vendor lock-in to LangChain. **Complaint**: UI slows at scale, hostile to non-LangChain stacks.
- **Helicone** (5.8k stars, YC W23). Free + usage tiers. Buyer: OpenAI-only shops wanting a proxy. **Gap**: cost tracking, not provenance.
- **Lakera** — acquired by Check Point Oct 1, 2025. Community free (10k req/mo), Enterprise custom. Buyer: enterprise security. **Gap**: focus is prompt-injection defense, not action receipts. Acquisition removes them as an indie competitor and signals the *security* angle is where exits happen.
- **WhyLabs** — ML/data monitoring lineage; enterprise sales. Not really fighting in agent-receipts.
- **Arthur AI** — ML monitoring; enterprise. Same.
- **Patronus AI** — pivoted toward "AGI simulation infrastructure" in late 2025; messaging ambiguity for buyers. Enterprise pricing only.
- **Confident AI / DeepEval** — eval-focused; $0 start; SOC2; engineering/QA teams. **Gap**: evaluation ≠ provenance.
- **Braintrust, Phoenix (Arize), Logfire (Pydantic), Laminar** — all observability-eval plays.

**The actual direct competitors are not on this list — they are Signet, Agent Passport System, agentreceipts.ai, MCP Firewall, and Sanna.** The commercial observability vendors are an adjacency, not Verity's lane.

## 6. MCP ecosystem context

- **PulseMCP**: ~15,930+ servers indexed (May 2026).
- **Smithery.ai**: ~7,000–7,300 servers (April–May 2026).
- **mcp.so, Glama**: additional registries, overlapping inventory.
- **Official Anthropic registry** (`registry.modelcontextprotocol.io`): live but does not host packages — metadata only; backed by Anthropic, GitHub, PulseMCP, Microsoft.
- **Official servers repo** (`modelcontextprotocol/servers`): 86.5k stars, 7 reference servers.

**Critical finding for Verity**: there are **already MCP servers doing provenance/receipts/audit**:
- `agentreceipts.ai` — open protocol, signing proxy between MCP client and server, W3C Verifiable Credentials, Ed25519 hash-chained. Go binary, wraps any MCP server.
- `@signet-auth/mcp-server` (npm) — production-grade signed receipts MCP server.
- `agent-passport-system-mcp` (npm) — 150 tools across 127 modules.
- `mcp-firewall` — compliance-ready signed audit logging for MCP.
- A "Verify" MCP server on mcpmarket.com for offline verification of signed artifacts.

**There is no wide-open lane.** The lane has 4–5 occupants already, plus an open W3C-aligned protocol (agentreceipts.ai) that Verity would have to either adopt or compete with. Discoverability in a 23k-server registry is its own grim problem.

## 7. Communities where the buyer lives

(Member counts noted where public; many Discords do not publish them.)

- **r/LocalLLaMA** — ~500k members; loud, technical, skeptical of paid SaaS.
- **r/LangChain** — ~70k; LangChain practitioners.
- **r/AI_Agents** — growing fast; agent-product builders.
- **r/MachineLearning** — ~3M; less product-builder, more research.
- **Hacker News** (`news.ycombinator.com`) — Show HN remains the highest-leverage launch surface.
- **LangChain Discord** — official; tens of thousands.
- **MCP community Discord** (linked from modelcontextprotocol.io) — newer, smaller, very on-topic.
- **CrewAI Discord** — multi-agent builders.
- **AI Engineer / Latent Space Discord & podcast audience** (latent.space) — high-signal practitioners.
- **dev.to #ai, #mcp tags** — surprisingly active for MCP content.
- **X/Twitter** clusters around @swyx, @hwchase17, @jerryjliu0, MCP/Anthropic dev advocates.

## 8. Trigger-keyword monitoring list

`agent receipts` · `tool call receipt` · `MCP audit trail` · `MCP audit log` · `tamper-evident agent log` · `verifiable AI output` · `LLM provenance` · `agent attestation` · `signed tool call` · `Ed25519 agent` · `hash-chained log AI` · `prove agent did` · `agent forensics` · `replay attack MCP` · `agent identity verification` · `hallucinated tool call` · `fabricated tool execution` · `LLM audit compliance` · `EU AI Act Article 12 logging` · `agent did not actually` · `how do I prove LLM` · `agent action provenance` · `non-repudiation agent` · `agent receipt protocol` · `MCP firewall` · `multi-agent trust` · `agent-to-agent verification` · `signed MCP response` · `tamper-proof AI` · `C2PA for agents`

## 9. Falsification attempts

The strongest case against Verity, taken seriously:

1. **The category already exists and is unsold.** Signet (35 stars), Agent Passport (19), MCP Firewall (8) are 6–18 months old, technically polished, and have *negligible* traction. If devs wanted this, at least one would be at 1k+ stars. The market is voting with its absence.
2. **The LangChain RFC was closed as not planned.** The maintainers of the highest-leverage agent framework looked at "tamper-evident audit trails" and said no. That is the most direct possible buyer-side rejection.
3. **Devs don't pay for logging — they pay for debugging.** Langfuse and Helicone monetize observability because the *primary value is finding bugs*, with audit as a side effect. Cryptographic receipts add cost (signing latency, key management, storage) and zero debugging value. Buyers will log to Sentry/Langfuse and call it done.
4. **The buyer doesn't have the problem yet.** Indie agent-product devs are pre-revenue or low-revenue. They are not being sued, not being audited, not being asked for proofs. The problem is real for *regulated enterprises* — which is explicitly NOT Verity's stated buyer. The pitch and the buyer are mismatched.
5. **EU AI Act timing is wrong and the wrong buyer.** August 2, 2026 enforcement is real, but it applies to high-risk AI system *providers* who need integrated logging (per Article 12, "bolting on an audit layer afterward will not satisfy the requirement"). A third-party MCP receipt service is exactly the bolt-on the regulation does not credit. And again — not the dev buyer.
6. **MCP discoverability is a graveyard.** ~23k MCP servers across registries. A new "Verity MCP" server faces 4 incumbents and ~23,000 distractions.
7. **Pricing assumes volume that doesn't exist for the buyer.** A solo dev hitting 100k receipts/mo ($19) is running real production traffic — at which point they are using Langfuse, not stacking a second tool. The Builder tier's natural customer is a small team, and small teams will self-host any of the 4 OSS competitors for free.
8. **Open-protocol risk.** agentreceipts.ai is positioning as the W3C Verifiable Credential-aligned standard. Standards-track competitors are existential threats to closed SaaS in this exact category (cf. C2PA winning content provenance).

The strongest single counter: **there is no public evidence of a paying buyer for "AI output receipts as a service," and the OSS versions that already exist have not found one either.**

## 10. Strength assessment + go/no-go

**Score: 3/10.** Justification: the *technical problem* is real and the *category exists*, but the demand signal is dominated by builders selling solutions (supply) and academics describing the problem, with near-zero observed demand from paying buyers. The exact-design competitors at <50 stars after months of work are the loudest negative data point.

**Recommendation: NO-GO on the 50-hour SaaS build as scoped.**

**What would change the verdict:**
- A named first customer willing to pre-pay $19–99/mo this week.
- A specific compliance-driven enterprise buyer (the buyer you said you don't want).
- Evidence Signet/Agent Passport are hitting growth inflection (re-check star velocity in 90 days).
- An MCP-native distribution surface (Anthropic blessing, Claude Desktop default install) that bypasses the discoverability problem.

**If you go anyway, the highest-value first-customer profile**: a solo or 2–3 person team shipping a vertical AI agent that touches money or contracts (e.g., AI bookkeeper, AI legal-doc assistant, AI procurement agent) where the *end-customer* asks "how do I know the agent actually did what it told me?" That buyer has real liability, has revenue, is technical enough to install an MCP server, and faces a question receipts directly answer. Pre-sell *that* persona in a Discord/Reddit DM before writing code. If three of them don't say "yes, take my money" within two weeks of outreach, redirect the 50 hours.
