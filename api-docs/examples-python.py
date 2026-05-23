"""
AnchorWithin API — Python Examples
Requires: requests (pip install requests)
"""
import requests

BASE_URL = "https://anchor.verityswarm.com"
API_KEY  = "AW-your-key-here"  # replace with your key

headers = {"Authorization": f"Bearer {API_KEY}"}


# ── Get a free trial key ──────────────────────────────────────────

def get_trial_key(email: str) -> str:
    resp = requests.post(f"{BASE_URL}/v1/trial/request",
                         json={"email": email})
    resp.raise_for_status()
    data = resp.json()
    print(f"Trial key: {data['api_key']}")
    print(f"Quota: {data['calls']} free calls")
    return data["api_key"]


# ── Browse catalog ────────────────────────────────────────────────

def get_catalog() -> list:
    resp = requests.get(f"{BASE_URL}/v1/audio/catalog", headers=headers)
    resp.raise_for_status()
    data = resp.json()
    print(f"Available tracks: {data['count']}")
    for track in data["tracks"]:
        print(f"  {track['id']:40s} {track['frequency']}Hz  {track['format']}")
    return data["tracks"]


# ── Stream audio by frequency ─────────────────────────────────────

def serve_by_frequency(hz: str, use_case: str = None, output_path: str = "output.mp3"):
    payload = {"frequency": hz}
    if use_case:
        payload["use_case"] = use_case

    resp = requests.post(f"{BASE_URL}/v1/audio/serve",
                         json=payload, headers=headers, stream=True)
    resp.raise_for_status()

    print(f"Track ID  : {resp.headers.get('X-Audio-Id')}")
    print(f"Frequency : {resp.headers.get('X-Frequency-Hz')}Hz")
    print(f"Use cases : {resp.headers.get('X-Use-Cases')}")
    print(f"Quota     : {resp.headers.get('X-Quota-Status')}")

    with open(output_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)

    size_mb = sum(1 for _ in open(output_path, "rb")) / 125_000
    print(f"Saved to  : {output_path}")
    return output_path


# ── Stream audio by use-case ──────────────────────────────────────

def serve_by_use_case(use_case: str, output_path: str = "output.mp3"):
    resp = requests.post(f"{BASE_URL}/v1/audio/serve",
                         json={"use_case": use_case},
                         headers=headers, stream=True)
    resp.raise_for_status()
    with open(output_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"Served {use_case} -> {output_path}")
    return output_path


# ── Stream audio by track ID ──────────────────────────────────────

def serve_by_id(audio_id: str, output_path: str = "output.mp3"):
    resp = requests.post(f"{BASE_URL}/v1/audio/serve",
                         json={"audio_id": audio_id},
                         headers=headers, stream=True)
    resp.raise_for_status()
    with open(output_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
    print(f"Served {audio_id} -> {output_path}")
    return output_path


# ── Check quota ───────────────────────────────────────────────────

def check_quota():
    resp = requests.get(f"{BASE_URL}/v1/key/status", headers=headers)
    resp.raise_for_status()
    data = resp.json()
    print(f"Tier  : {data['tier']}")
    print(f"Usage : {data['quota']} this month")
    print(f"Total : {data['calls_total']} all time")
    return data


# ── Example: build a sleep app endpoint ──────────────────────────

def sleep_audio_for_user(user_email: str, output_path: str = "sleep.mp3"):
    """
    Example pattern for a wellness app:
    - User requests sleep audio
    - Your backend fetches from AnchorWithin API
    - Streams file to user
    """
    resp = requests.post(
        f"{BASE_URL}/v1/audio/serve",
        json={"frequency": "432", "use_case": "sleep"},
        headers=headers,
        stream=True,
    )
    if resp.status_code == 429:
        raise RuntimeError("API quota exceeded — upgrade at anchorwithin.com/pricing")
    resp.raise_for_status()

    with open(output_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)

    quota = resp.headers.get("X-Quota-Status", "unknown")
    return {"file": output_path, "quota_remaining": quota}


if __name__ == "__main__":
    # Quick demo
    print("=== AnchorWithin API Python Demo ===\n")
    check_quota()
    print()
    get_catalog()
    print()
    serve_by_frequency("528", use_case="healing", output_path="528hz_healing.mp3")
