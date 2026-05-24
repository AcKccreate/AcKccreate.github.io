# AnchorWithin API — Quickstart

Get your first audio file in under 5 minutes.

---

## Step 1 — Get a free trial key

```bash
curl -X POST https://api.anchorwithin.com/v1/trial/request \
  -H "Content-Type: application/json" \
  -d '{"email": "you@yourapp.com"}'
```

**Response:**
```json
{
  "api_key": "AW-xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "tier": "trial",
  "calls": 100,
  "endpoint": "POST /v1/audio/serve",
  "auth": "Authorization: Bearer <your_key>"
}
```

Save your `api_key`. You get **100 free calls** — no credit card required.

---

## Step 2 — Browse the catalog

```bash
curl https://api.anchorwithin.com/v1/audio/catalog \
  -H "Authorization: Bearer AW-your-key-here"
```

Returns all 15 tracks with frequency, format, use-case tags, and IDs.

---

## Step 3 — Stream your first audio file

**By frequency (Hz):**
```bash
curl -X POST https://api.anchorwithin.com/v1/audio/serve \
  -H "Authorization: Bearer AW-your-key-here" \
  -H "Content-Type: application/json" \
  -d '{"frequency": "432", "use_case": "sleep"}' \
  --output healing_432hz.mp3
```

**By use-case:**
```bash
curl -X POST https://api.anchorwithin.com/v1/audio/serve \
  -H "Authorization: Bearer AW-your-key-here" \
  -H "Content-Type: application/json" \
  -d '{"use_case": "focus"}' \
  --output focus_session.mp3
```

**By specific track ID:**
```bash
curl -X POST https://api.anchorwithin.com/v1/audio/serve \
  -H "Authorization: Bearer AW-your-key-here" \
  -H "Content-Type: application/json" \
  -d '{"audio_id": "528hz_528hz_dna_repair"}' \
  --output 528hz.mp3
```

---

## Step 4 — Check your quota

```bash
curl https://api.anchorwithin.com/v1/key/status \
  -H "Authorization: Bearer AW-your-key-here"
```

```json
{
  "tier": "trial",
  "calls_month": 3,
  "calls_total": 3,
  "quota": "3/100",
  "active": true,
  "email": "you@yourapp.com"
}
```

---

## Available frequencies

| Hz  | Use cases |
|-----|-----------|
| 432 | healing, sleep, calm, focus, grounding |
| 528 | DNA repair, stress relief, love |
| 639 | relationships, communication, connection |
| 741 | clarity, toxin release, expression |
| 852 | intuition, vagal tone, calm, spiritual |
| 963 | pineal, transcendence, clarity, crown |

---

## When you're ready to scale

Subscribe at [ackccreate.github.io/anchorwithin-home/#pricing](https://ackccreate.github.io/anchorwithin-home/#pricing):

| Tier | Calls/month | Price |
|------|-------------|-------|
| Starter | 1,000 | $9/mo |
| Pro | 10,000 | $29/mo |
| Unlimited | Unlimited | $79/mo |

Your key upgrades automatically on subscription — same key, higher quota.
