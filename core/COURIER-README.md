# Courier branch — `couriers/council-bridge`

This branch exists for the sole purpose of transporting `council_bridge.py`
from this remote Claude session to Casey's local AnchorWithin Python project.

**This file does NOT belong in the public `AcKccreate.github.io` site.**

## On your Windows machine

```bash
# from anywhere — pull the file out of this branch and into your AnchorWithin folder
git fetch origin couriers/council-bridge
git show origin/couriers/council-bridge:core/council_bridge.py > C:/Users/acase/AnchorWithin/core/council_bridge.py
```

Or PowerShell equivalent:
```powershell
git fetch origin couriers/council-bridge
git show origin/couriers/council-bridge:core/council_bridge.py | Out-File -Encoding utf8 C:\Users\acase\AnchorWithin\core\council_bridge.py
```

## After pickup

Once you've confirmed the file is in your AnchorWithin folder, this branch
should be deleted from the remote so the Python code doesn't sit on a
public-facing repo:

```bash
git push origin --delete couriers/council-bridge
```
