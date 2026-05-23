// AnchorWithin API — JavaScript / Node.js Examples
// Works in: Node.js 18+, browser (with CORS), Deno, Bun

const BASE_URL = "https://api.anchorwithin.com";
const API_KEY  = "AW-your-key-here"; // replace with your key

const headers = {
  "Authorization": `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
};


// ── Get a free trial key ──────────────────────────────────────────

async function getTrialKey(email) {
  const resp = await fetch(`${BASE_URL}/v1/trial/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await resp.json();
  console.log("Trial key:", data.api_key);
  console.log("Free calls:", data.calls);
  return data.api_key;
}


// ── Browse catalog ─────────────────────────────────────────────────

async function getCatalog() {
  const resp = await fetch(`${BASE_URL}/v1/audio/catalog`, { headers });
  const data = await resp.json();
  console.log(`${data.count} tracks available:`);
  data.tracks.forEach(t => {
    console.log(`  ${t.id.padEnd(40)} ${t.frequency}Hz  ${t.format}`);
  });
  return data.tracks;
}


// ── Stream audio to a file (Node.js) ─────────────────────────────

async function serveAudioToFile(payload, outputPath) {
  const { createWriteStream } = await import("fs");
  const { Readable } = await import("stream");
  const { pipeline } = await import("stream/promises");

  const resp = await fetch(`${BASE_URL}/v1/audio/serve`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(`API error ${resp.status}: ${err.detail}`);
  }

  console.log("Track ID :", resp.headers.get("X-Audio-Id"));
  console.log("Frequency:", resp.headers.get("X-Frequency-Hz"), "Hz");
  console.log("Quota    :", resp.headers.get("X-Quota-Status"));

  await pipeline(
    Readable.fromWeb(resp.body),
    createWriteStream(outputPath)
  );
  console.log("Saved to :", outputPath);
}


// ── Stream audio to browser <audio> element ────────────────────────

async function streamAudioToBrowser(payload, audioElementId) {
  const resp = await fetch(`${BASE_URL}/v1/audio/serve`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (resp.status === 429) {
    throw new Error("Quota exceeded. Upgrade at anchorwithin.com/pricing");
  }
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(`API error: ${err.detail}`);
  }

  const blob = await resp.blob();
  const url  = URL.createObjectURL(blob);
  const el   = document.getElementById(audioElementId);
  el.src = url;
  el.play();

  // Clean up object URL when done
  el.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
  return url;
}


// ── Check quota ────────────────────────────────────────────────────

async function checkQuota() {
  const resp = await fetch(`${BASE_URL}/v1/key/status`, { headers });
  const data = await resp.json();
  console.log("Tier :", data.tier);
  console.log("Usage:", data.quota, "this month");
  return data;
}


// ── React hook example ─────────────────────────────────────────────

/*
import { useState, useCallback } from "react";

export function useHealingAudio(apiKey) {
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  const playFrequency = useCallback(async (hz, useCase) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("https://api.anchorwithin.com/v1/audio/serve", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ frequency: hz, use_case: useCase }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  return { loading, audioUrl, error, playFrequency };
}
*/


// ── Quick demo (Node.js) ───────────────────────────────────────────

async function demo() {
  console.log("=== AnchorWithin API JavaScript Demo ===\n");
  await checkQuota();
  console.log();
  await getCatalog();
  console.log();
  await serveAudioToFile(
    { frequency: "432", use_case: "sleep" },
    "432hz_sleep.mp3"
  );
}

// demo().catch(console.error);

module.exports = { getTrialKey, getCatalog, serveAudioToFile, streamAudioToBrowser, checkQuota };
