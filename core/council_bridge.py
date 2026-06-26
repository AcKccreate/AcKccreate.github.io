"""
council_bridge.py — AnchorWithin Core
Central hub for AI Council consensus decisions.
Fixed model IDs and safer error handling.

LOCAL FILE — belongs at:
    C:\\Users\\acase\\AnchorWithin\\core\\council_bridge.py

DO NOT commit to AcKccreate.github.io (public repo).

Requires a .env file in the AnchorWithin project root with:
    ANTHROPIC_API_KEY=...
    OPENAI_API_KEY=...
    GEMINI_API_KEY=...
    XAI_API_KEY=...

Install once:
    pip install anthropic openai google-generativeai python-dotenv
"""

import os
import json
from datetime import datetime
from anthropic import Anthropic
from openai import OpenAI
import google.generativeai as genai
from dotenv import load_dotenv

# Load locals
load_dotenv()

# Setup Clients
claude = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
gpt = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini = genai.GenerativeModel("gemini-2.0-flash")
grok = OpenAI(api_key=os.getenv("XAI_API_KEY"), base_url="https://api.x.ai/v1")


def ask_claude(prompt):
    """Claude 3.7 Sonnet — high-reasoning council voice."""
    try:
        r = claude.messages.create(
            model="claude-3-7-sonnet-latest",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        return r.content[0].text
    except Exception as e:
        return f"Claude Error: {str(e)}"


def ask_gpt(prompt):
    try:
        r = gpt.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
        )
        return r.choices[0].message.content
    except Exception as e:
        return f"GPT Error: {str(e)}"


def ask_grok(prompt):
    try:
        r = grok.chat.completions.create(
            model="grok-3-latest",
            messages=[{"role": "user", "content": prompt}],
        )
        return r.choices[0].message.content
    except Exception as e:
        return f"Grok Error: {str(e)}"


def ask_gemini(prompt):
    try:
        r = gemini.generate_content(prompt)
        return r.text
    except Exception as e:
        return f"Gemini Error: {str(e)}"


def broadcast(prompt, members=None):
    """Collect thoughts from the selected council."""
    targets = members or ["claude", "gpt", "grok", "gemini"]
    callers = {
        "claude": ask_claude,
        "gpt": ask_gpt,
        "grok": ask_grok,
        "gemini": ask_gemini,
    }
    results = {}
    for m in targets:
        if m in callers:
            results[m] = callers[m](prompt)
    return results


def get_consensus(prompt, members=None):
    """Broadcast to all, then let Claude synthesize the Council Decision."""
    responses = broadcast(prompt, members)

    synthesis_prompt = f"""
    You are the Synthesis Engine for the AnchorWithin AI Council.

    ORIGINAL COMMAND: {prompt}

    RESPONSES FROM MEMBERS:
    {json.dumps(responses, indent=2)}

    Synthesize these viewpoints into one definitive, actionable 'Council Decision'.
    Be proactive and forward-thinking, matching the vibe of Commander Casey.
    """

    final_decision = ask_claude(synthesis_prompt)

    return {
        "status": "success",
        "timestamp": datetime.now().isoformat(),
        "query": prompt,
        "responses": responses,
        "council_decision": final_decision,
    }


if __name__ == "__main__":
    print("--- TESTING COUNCIL BRIDGE ---")
    test_run = get_consensus(
        "Identify the highest leverage automation for AnchorWithin for the next 48 hours."
    )
    print(f"DECISION: {test_run['council_decision']}")
