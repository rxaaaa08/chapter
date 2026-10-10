#!/usr/bin/env python3
"""Creates, in our own WhatsApp account, any message template the code needs
that is not there yet. Definitions live beside this file in
whatsapp-templates.json.

HOW TO USE
  1. Meta Business Settings > System users > chaptera-whatsapp > Generate token
     (same three permissions as before), then press Copy.
  2. Run:  python3 scripts/whatsapp-create-templates.py
     Add --dry-run to see what it would do without creating anything.

The access key is read from the CLIPBOARD and is never printed. The key is
cleared from the clipboard at the end.

Safe to run again: a template that already exists is reported and left alone.
This never edits or deletes a template.
"""
import json
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

WABA_ID = "1438047108420416"
API = "https://graph.facebook.com/v24.0"
DEFS = Path(__file__).with_name("whatsapp-templates.json")
DRY = "--dry-run" in sys.argv


def stop(msg):
    print(f"\nSTOPPED: {msg}", file=sys.stderr)
    sys.exit(1)


def clipboard():
    return re.sub(r"\s+", "", subprocess.run(["pbpaste"], capture_output=True, text=True).stdout)


token = clipboard()
if not re.fullmatch(r"EA[A-Za-z0-9]{60,}", token):
    stop(
        "The clipboard does not hold a Meta access key (one long run of letters and digits starting EA).\n"
        f"What is on the clipboard now: {len(token)} characters, starting \"{token[:3]}\".\n"
        "Press Copy on the key as the very last thing, then start this without copying anything else."
    )


def call(method, path, body=None):
    """Returns (ok, parsed-json). Never raises for an HTTP error: Meta's reason is in the body."""
    req = urllib.request.Request(
        f"{API}/{path}",
        method=method,
        data=json.dumps(body).encode("utf-8") if body is not None else None,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            return True, json.loads(res.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as e:
        try:
            return False, json.loads(e.read().decode("utf-8") or "{}")
        except Exception:
            return False, {"error": {"message": f"HTTP {e.code}"}}
    except Exception as e:  # network trouble
        return False, {"error": {"message": str(e)}}


def reason(reply):
    e = reply.get("error", {}) if isinstance(reply, dict) else {}
    parts = [str(e.get("error_user_title") or ""), str(e.get("error_user_msg") or e.get("message") or "")]
    detail = (e.get("error_data") or {}).get("details")
    if detail:
        parts.append(str(detail))
    return " ".join(p for p in parts if p).strip() or "no reason given"


NEEDED = ("business_management", "whatsapp_business_management", "whatsapp_business_messaging")


def describe_key():
    """What Meta says this key is: whose it is, for which app, and what it may do.

    Prints nothing secret. Returns a list of plain-language problems (empty = the
    key itself is fine), or None when Meta would not describe the key.
    """
    problems = []
    ok_me, me = call("GET", "me?fields=id,name")
    owner = f"{me.get('name', '?')} (ID {me.get('id', '?')})" if ok_me else "unknown"
    ok_dbg, dbg = call("GET", "debug_token?input_token=" + urllib.parse.quote(token, safe=""))
    data = dbg.get("data", {}) if ok_dbg else {}
    if not data:
        print(f"Key belongs to: {owner}. (Meta would not describe its permissions: {reason(dbg)})")
        return None  # unknown, which is not the same as "no problems"
    scopes = set(data.get("scopes") or [])
    app = f"{data.get('application', '?')} (app ID {data.get('app_id', '?')})"
    expires = data.get("expires_at")
    print(f"Key belongs to: {owner}\n  for app:      {app}\n  expires:      {'never' if not expires else expires}")
    print("  permissions:  " + ", ".join(f"{s} {'yes' if s in scopes else 'MISSING'}" for s in NEEDED))
    missing = [s for s in NEEDED if s not in scopes]
    if missing:
        problems.append(
            "this key was generated WITHOUT: " + ", ".join(missing) + ". Generate a new one and tick all three boxes."
        )
    # Meta can also limit a permission to particular accounts. An empty list means "all".
    for g in data.get("granular_scopes") or []:
        targets = g.get("target_ids")
        if g.get("scope", "").startswith("whatsapp_business") and targets and WABA_ID not in targets:
            problems.append(
                f"{g['scope']} is limited to other accounts ({', '.join(targets)}) and not to ours (ending 0416). "
                "In the Generate token steps, select the chapter அ WhatsApp account ending 0416."
            )
    if str(data.get("app_id")) != "38444690021845940":
        problems.append("this key was generated for a different app. Choose chaptera-ads in the Generate token dialog.")
    return problems


spec = json.loads(DEFS.read_text(encoding="utf-8"))
language = spec["language"]
wanted = spec["templates"]

key_problems = describe_key()
print()
ok, existing = call("GET", f"{WABA_ID}/message_templates?fields=name,status,category,language&limit=200")
if not ok:
    ok_acct, acct = call("GET", f"{WABA_ID}?fields=id,name")
    lines = [f"Meta refused this key for the account: {reason(existing)}"]
    if key_problems:
        lines.append("What is wrong with the key:")
        lines += [f"  - {x}" for x in key_problems]
    elif not ok_acct:
        lines.append(
            ("The key has the right permissions but" if key_problems == [] else "The key")
            + " cannot see the MESSAGING account at all. Meta keeps two things under the same name: the "
            "'WhatsApp account' (the number and its profile) and the 'Messaging account' (templates and payment). "
            "Templates need the second. Fix: Business Settings > Messaging accounts > chapter அ (ID ending 0416) > "
            "Assign people > tick the system user named above > full control > Assign. Then generate a new key."
        )
    else:
        lines.append("The key can see the account but not its templates. Tell Claude; this needs a closer look.")
    stop("\n".join(lines))
if key_problems:
    print("NOTE: the key works for this, but: " + " ".join(key_problems) + "\n")
have = {(t["name"], t.get("language")): t for t in existing.get("data", [])}

print(f"Account {WABA_ID}: {len(have)} template(s) there now, {len(wanted)} wanted.\n")
created = skipped = failed = 0
for t in wanted:
    name = t["name"]
    already = have.get((name, language))
    if already:
        skipped += 1
        print(f"  exists   {name:28} {already.get('status', '?'):10} {already.get('category', '')}")
        continue
    other = [lang for (n, lang) in have if n == name]
    if other:
        # Same name in another language: creating "en" beside it is allowed, but say so.
        print(f"  note     {name:28} exists in {', '.join(map(str, other))}; adding {language}")
    if DRY:
        print(f"  would create {name:24} {t['category']}")
        continue
    ok, reply = call("POST", f"{WABA_ID}/message_templates", {
        "name": name, "language": language, "category": t["category"], "components": t["components"],
    })
    if ok and reply.get("id"):
        created += 1
        print(f"  created  {name:28} {reply.get('status', '?'):10} {reply.get('category', t['category'])}")
    else:
        failed += 1
        print(f"  FAILED   {name:28} {reason(reply)}")

if not DRY:
    subprocess.run(["pbcopy"], input="", text=True)  # take the key off the clipboard
print(f"\nDone: {created} created, {skipped} already there, {failed} failed."
      + ("" if not DRY else " (dry run: nothing was created)"))
print("PENDING means Meta is still reviewing. Paste these lines to Claude; they contain no secrets.")
sys.exit(1 if failed else 0)
