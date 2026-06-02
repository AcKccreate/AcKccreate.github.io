# Deploying AnchorRemembers to anchorremembers.com

This folder is the deploy-ready source for the standalone site at
**https://anchorremembers.com** (repo: `AcKccreate/anchor-remembers`).

## What's here
- `index.html` — the redesigned (full brand-match) memory-book app
- `CNAME` — contains `anchorremembers.com` so GitHub Pages binds the custom domain

## Move it to its home (one-time)
Copy `index.html` and `CNAME` into the **root** of the `AcKccreate/anchor-remembers`
repo (replacing the older `index.html`), commit, and push to its default branch (`main`).

> Note: a `CNAME` file only takes effect at a repo's Pages **root** — it is ignored
> inside this subfolder of `ackccreate.github.io`, so it does not affect the main site.

## Enable Pages (if not already)
In `AcKccreate/anchor-remembers` → Settings → Pages → Source: `main` / root.
With the `CNAME` file present, the custom domain populates automatically.

## DNS (at your domain registrar)
Apex domain → GitHub Pages:

| Type  | Name | Value             |
|-------|------|-------------------|
| A     | @    | 185.199.108.153   |
| A     | @    | 185.199.109.153   |
| A     | @    | 185.199.110.153   |
| A     | @    | 185.199.111.153   |
| CNAME | www  | ackccreate.github.io |

After DNS propagates (~10–60 min), tick **Enforce HTTPS** in Settings → Pages.
