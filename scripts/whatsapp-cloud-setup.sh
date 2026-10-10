#!/bin/bash
# One-time setup for sending WhatsApp through Meta's Cloud API directly, on our
# own account (chapter அ, 1438047108420416) and number (+91 82208 88650).
#
# HOW TO USE
#   1. In Meta Business Settings > System users, generate the access key and
#      press Copy.
#   2. Run this script. It reads the key from the CLIPBOARD, so the key is never
#      typed, printed, or pasted into a chat.
#
# WHAT IT DOES, IN ORDER
#   a. Finds the number in the account and shows its state.
#   b. Registers it for Cloud API (skipped if already connected). This asks for a
#      6-digit PIN that YOU choose: it becomes the number's two-step PIN and is
#      needed again if the number is ever re-registered. Keep it somewhere safe.
#   c. Subscribes our Meta app to the account, so delivery ticks and customer
#      messages are sent to us.
#   d. Stores the key and the number's ID as Supabase secrets
#      (WHATSAPP_CLOUD_TOKEN, WHATSAPP_CLOUD_PHONE_ID).
#
# Safe to run twice: every step checks before it acts.
#
# Storing the two secrets does NOT switch live sending over by itself. The edge
# functions only use them once the versions carrying the direct path are
# deployed.

set -euo pipefail

PROJECT_REF="txcmismkdttgsyhbnexf"
WABA_ID="1438047108420416"
NUMBER_TAIL="8220888650"
API="https://graph.facebook.com/v24.0"

say()  { printf '\n%s\n' "$*"; }
fail() { printf '\nSTOPPED: %s\n' "$*" >&2; exit 1; }

command -v pbpaste  >/dev/null || fail "pbpaste not found (this script is for macOS)."
command -v python3  >/dev/null || fail "python3 not found."
command -v supabase >/dev/null || fail "The supabase command-line tool is not installed."

TOKEN="$(pbpaste | tr -d '[:space:]')"
# Meta's keys are one long run of letters and digits beginning "EA". The third
# character varies (a first version of this check demanded "EAA" and turned away
# a real key that began "EAI").
if ! [[ "$TOKEN" =~ ^EA[A-Za-z0-9]{60,}$ ]]; then
  # Length and the first three characters only: enough to see what went wrong,
  # never enough to expose a key.
  fail "The clipboard does not hold a Meta access key (one long run of letters and digits starting EA).
What is on the clipboard now: ${#TOKEN} characters, starting \"${TOKEN:0:3}\".
Copying this command to run it REPLACES the key on the clipboard. Press Copy on
the key in Business Settings as the very last thing, then start this without
copying anything else (Run button, or the up-arrow to recall the command)."
fi

# Never echo the key. Every call sends it as a header read from this variable.
call() {  # call METHOD PATH [json-body]
  local method="$1" path="$2" body="${3:-}"
  if [[ -n "$body" ]]; then
    curl -sS -X "$method" "$API/$path" -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" -d "$body"
  else
    curl -sS -X "$method" "$API/$path" -H "Authorization: Bearer $TOKEN"
  fi
}

# Pulls one field out of a JSON reply, or the error message if there is one.
field() { python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
except Exception:
    print("UNREADABLE"); sys.exit(0)
if isinstance(d, dict) and "error" in d:
    e = d["error"]
    print("ERROR %s: %s %s" % (e.get("code"), e.get("message", ""), (e.get("error_data") or {}).get("details", "")))
    sys.exit(0)
cur = d
for key in sys.argv[1].split("."):
    cur = cur.get(key) if isinstance(cur, dict) else None
print("" if cur is None else cur)
' "$1"; }

# ── a. find the number ───────────────────────────────────────────────────────
say "Looking for the number in the account..."
NUMBERS="$(call GET "$WABA_ID/phone_numbers?fields=id,display_phone_number,verified_name,name_status,status,code_verification_status,quality_rating")"
ERR="$(printf '%s' "$NUMBERS" | field _none_)"
[[ "$ERR" == ERROR* ]] && fail "Meta refused the key for this account. $ERR
Check that the system user has the WhatsApp account (ID ending 0416) assigned with full control, and that the key was generated with whatsapp_business_management."

PHONE_LINE="$(printf '%s' "$NUMBERS" | python3 -c '
import json, re, sys
tail = sys.argv[1]
for n in json.load(sys.stdin).get("data", []):
    if re.sub(r"\D", "", n.get("display_phone_number", "")).endswith(tail):
        print("|".join(str(n.get(k, "")) for k in ("id", "display_phone_number", "verified_name", "name_status", "status", "code_verification_status")))
        break
' "$NUMBER_TAIL")"
[[ -z "$PHONE_LINE" ]] && fail "The account has no number ending $NUMBER_TAIL. Reply from Meta: $NUMBERS"

IFS='|' read -r PHONE_ID SHOWN NAME NAME_STATUS STATUS VERIFIED <<< "$PHONE_LINE"
say "Found $SHOWN
  number ID:      $PHONE_ID
  display name:   $NAME ($NAME_STATUS)
  status:         $STATUS
  SMS/call check: $VERIFIED"

# ── b. register for Cloud API ────────────────────────────────────────────────
if [[ "$STATUS" == "CONNECTED" ]]; then
  say "Already registered for Cloud API. Skipping registration."
else
  if [[ -t 0 ]]; then
    say "Registering the number for Cloud API.
Choose a 6-digit PIN. It becomes this number's two-step PIN: write it down, it is
needed again if the number is ever re-registered. (Typing is hidden.)"
    read -r -s -p "PIN: " PIN; echo
    [[ "$PIN" =~ ^[0-9]{6}$ ]] || fail "The PIN must be exactly 6 digits. Nothing was changed."
  else
    # Started from somewhere that cannot take typing (a chat box, a Run button).
    # Make the PIN here and file it, rather than print it or have it typed into
    # a command where it would be recorded.
    PIN="$(python3 -c 'import secrets; print("%06d" % secrets.randbelow(10**6))')"
    PIN_FILE="$HOME/Documents/chapter-whatsapp-two-step-PIN.txt"
    ( umask 077; printf 'Two-step PIN for WhatsApp number +91 82208 88650 (set %s): %s\n' "$(date '+%Y-%m-%d %H:%M')" "$PIN" > "$PIN_FILE" )
    say "Registering the number for Cloud API with a new 6-digit PIN.
The PIN was saved to: $PIN_FILE
Move it into your password manager and delete that file."
  fi
  REG="$(call POST "$PHONE_ID/register" "{\"messaging_product\":\"whatsapp\",\"pin\":\"$PIN\"}")"
  unset PIN
  REG_OK="$(printf '%s' "$REG" | field success)"
  if [[ "$REG_OK" != "True" && "$REG_OK" != "true" ]]; then
    fail "Meta did not register the number. $REG_OK
If this mentions a PIN mismatch, the number still carries an old two-step PIN:
open WhatsApp Manager > Phone numbers > the gear icon > Two-step verification,
turn it off (or set a new PIN), and run this again. Meta allows 10 tries per 72 hours."
  fi
  say "Registered."
fi

# ── c. subscribe our app to the account's notifications ──────────────────────
SUB="$(call POST "$WABA_ID/subscribed_apps")"
SUB_OK="$(printf '%s' "$SUB" | field success)"
if [[ "$SUB_OK" == "True" || "$SUB_OK" == "true" ]]; then
  say "Our app is subscribed to this account's notifications."
else
  say "WARNING: could not subscribe the app to the account ($SUB_OK).
Sending still works; delivery ticks and replies will not arrive until this is fixed."
fi

# ── d. store the two secrets ─────────────────────────────────────────────────
# Through a private temp file, so the key never appears in the process list.
ENVFILE="$(mktemp)"
chmod 600 "$ENVFILE"
trap 'rm -f "$ENVFILE"' EXIT
printf 'WHATSAPP_CLOUD_TOKEN=%s\nWHATSAPP_CLOUD_PHONE_ID=%s\n' "$TOKEN" "$PHONE_ID" > "$ENVFILE"
supabase secrets set --env-file "$ENVFILE" --project-ref "$PROJECT_REF" >/dev/null \
  || fail "Could not store the secrets in Supabase. The number IS registered; only the storing failed."
say "Stored WHATSAPP_CLOUD_TOKEN and WHATSAPP_CLOUD_PHONE_ID in Supabase."

# Clear the key off the clipboard now that it is stored.
printf '' | pbcopy

AFTER="$(call GET "$PHONE_ID?fields=status,name_status,quality_rating")"
say "Done. Number status now: $(printf '%s' "$AFTER" | field status)
Tell Claude this finished, and paste the lines above (they contain no secrets)."
