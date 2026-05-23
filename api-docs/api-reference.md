# AnchorWithin API — Reference

**Base URL:** `https://anchor.verityswarm.com`  
**Auth:** `Authorization: Bearer AW-your-key`  
**Format:** JSON request/response, binary audio response for `/v1/audio/serve`

---

## Authentication

All endpoints (except `/v1/trial/request`) require a Bearer token:

```
Authorization: Bearer AW-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

| Status | Meaning |
|--------|---------|
| `401` | Missing, invalid, or inactive API key |
| `429` | Monthly quota exceeded |

---

## Endpoints

### `POST /v1/trial/request`

Issue a free 100-call trial key. No credit card required.

**Request body:**
```json
{ "email": "you@yourapp.com" }
```
`email` is optional but recommended for quota alerts.

**Response:**
```json
{
  "api_key": "AW-xxxx",
  "tier": "trial",
  "calls": 100,
  "endpoint": "POST /v1/audio/serve",
  "auth": "Authorization: Bearer <your_key>"
}
```

---

### `GET /v1/audio/catalog`

List all available audio tracks.

**Headers:** `Authorization: Bearer <key>`

**Response:**
```json
{
  "count": 15,
  "tracks": [
    {
      "id": "432hz_432hz_universal_healing",
      "title": "432hz_universal_healing",
      "frequency": "432",
      "format": "MP3",
      "size_bytes": 14401453,
      "use_cases": ["healing", "grounding", "sleep", "calm", "focus"]
    }
  ]
}
```

---

### `POST /v1/audio/serve`

Serve an audio file. Returns binary audio with metadata headers.

**Headers:** `Authorization: Bearer <key>`, `Content-Type: application/json`

**Request body** — provide at least one selector:
```json
{
  "audio_id":  "432hz_432hz_universal_healing",
  "frequency": "432",
  "use_case":  "sleep"
}
```

Selection priority: `audio_id` > `frequency + use_case` > `frequency` > `use_case`

**Response:** Binary audio file (MP3 or WAV)

**Response headers:**
```
Content-Type:      audio/mpeg
X-Audio-Id:        432hz_432hz_universal_healing
X-Frequency-Hz:    432
X-Use-Cases:       healing,grounding,sleep,calm,focus
X-Quota-Status:    5/100
```

**Errors:**
| Status | Detail |
|--------|--------|
| `400` | No selector provided |
| `401` | Invalid or missing API key |
| `404` | No track matches frequency/use_case |
| `429` | Monthly quota exceeded |
| `503` | No audio files on disk |

---

### `GET /v1/key/status`

Return quota and tier info for the authenticated key.

**Headers:** `Authorization: Bearer <key>`

**Response:**
```json
{
  "tier": "starter",
  "calls_month": 47,
  "calls_total": 312,
  "quota": "47/1000",
  "active": true,
  "email": "you@yourapp.com"
}
```

---

### `GET /health`

Service health check. No auth required.

**Response:**
```json
{
  "status": "ok",
  "port": 8990,
  "audio_tracks": 15,
  "active_keys": 3,
  "stripe_ready": true
}
```

---

## Error format

All errors return JSON:
```json
{ "detail": "human-readable error message" }
```

---

## Frequencies and use-cases

| Hz  | Use cases |
|-----|-----------|
| 174 | pain_relief, grounding, security |
| 285 | tissue_repair, healing |
| 396 | release_fear, grounding, guilt |
| 417 | change, clearing, trauma |
| 432 | healing, grounding, sleep, calm, focus |
| 528 | dna_repair, stress_relief, healing, love |
| 639 | relationships, connection, communication |
| 741 | awakening, toxin_release, clarity, expression |
| 852 | intuition, vagal_tone, calm, spiritual |
| 963 | pineal, clarity, transcendence, crown |

---

## Quotas

| Tier | Calls/month | Overage |
|------|-------------|---------|
| trial | 100 | 429 error |
| starter | 1,000 | 429 error |
| pro | 10,000 | 429 error |
| unlimited | no limit | — |

Quota resets on the 1st of each month. Upgrade at [anchorwithin.com/pricing](https://anchorwithin.com/pricing).

---

## Stripe webhook events

AnchorScout listens for:
- `checkout.session.completed` → issues API key, sends welcome email
- `customer.subscription.deleted` → revokes key (sets `active=0`)

Endpoint: `POST /webhooks/stripe`
