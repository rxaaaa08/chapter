# Writes one scenario file per link shape for seal.mjs.
#
#   python3 gen.py <folder of a built site | LIVE> <prefix>
#
# LIVE tests the real site as it is today; a folder tests that build, served as
# if it were chaptera.in. Every value below is made up: 9000000001, Zztest,
# ZZZZsyntheticZZZZ, ZZTXN0001. Never put a real customer's details in here.
import json,sys
dist=sys.argv[1]
IG="Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22F76 Instagram 385.0.0.25.111 (iPhone15,3; iOS 18_5; en_IN; en-IN; scale=3.00; 1290x2796; 745581873)"
WA="Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/140.0.0.0 Mobile Safari/537.36 WhatsApp/2.25.20.77"
PROBE="({href: location.href, historyLength: history.length, inputs: [...document.querySelectorAll('input')].map(i => i.value), arrival: sessionStorage.getItem('wa_arrival_code'), attribution: sessionStorage.getItem('ca_attribution'), fbc: (document.cookie.match(/_fbc=([^;]+)/)||[])[1] || null, referrer: document.referrer, inApp: /Instagram|FBAN|FBAV/i.test(navigator.userAgent)})"
def steps(url, extra=None):
    st=[{"phase":"landing","goto":url,"wait":11000},{"eval":PROBE,"as":"afterLanding"},
        {"phase":"scroll","eval":"window.scrollTo(0, document.body.scrollHeight); 1","wait":2000},
        {"phase":"history-push","eval":"(() => { const p = new URLSearchParams(location.search); p.set('sheet', 'zzprobe'); history.pushState({}, '', location.pathname + '?' + p.toString()); return location.href; })()","as":"afterPush","wait":2500},
        {"phase":"pixel-later-event","eval":"window.fbq && window.fbq('trackCustom', 'ZzSealedProbe'); 1","wait":2000},
        {"phase":"back","eval":"history.back(); 1","wait":2500},{"eval":"({href: location.href, historyLength: history.length})","as":"afterBack"}]
    if extra: st+=extra
    st+=[{"phase":"sentry-error","eval":"setTimeout(() => { throw new Error('zz-synthetic-sentry-test'); }, 0); 1","wait":4000},
         {"phase":"leave","eval":"Object.defineProperty(document, 'visibilityState', { get: () => 'hidden', configurable: true }); Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange', { bubbles: true })); window.dispatchEvent(new Event('pagehide')); ({ si: typeof window.si, sil: window.sil, script: !!document.querySelector('script[src*=\"speed-insights\"]') })","as":"speedInsights","wait":2500},
         {"phase":"leave","goto":"about:blank","wait":2500}]
    return st
INV="https://chaptera.in/invite?phone=9000000001&name=Zztest&wa=ZZZZsyntheticZZZZ.0"
LIFE="https://chaptera.in/lifestyle?utm_source=meta&utm_medium=paid&utm_campaign=whatsapp_chat&utm_content=120000000000000001&wa=ZZZZsyntheticZZZZ.0"
sc={
 'A':dict(name="A booking-message link /invite?phone&name&wa, slow app",delayAppMs=2500,steps=steps(INV)),
 'B':dict(name="B chat-reply link /lifestyle?utm&wa",steps=steps(LIFE)),
 'C':dict(name="C /invite?phone&wa with no name (never auto-cleaned by the app)",steps=steps("https://chaptera.in/invite?phone=9000000001&wa=ZZZZsyntheticZZZZ.0")),
 'D':dict(name="D payment return, failed",steps=steps("https://chaptera.in/invite?payment_status=failed&txnid=ZZTXN0001")),
 'E':dict(name="E full reload to /plans from a link that carried the code (came-from address)",steps=[{"phase":"first-page","goto":LIFE,"wait":7000},{"phase":"second-page","eval":"location.href='/plans'; 1","wait":10000},{"eval":PROBE,"as":"onSecondPage"},{"phase":"sentry-error","eval":"setTimeout(() => { throw new Error('zz-synthetic-sentry-test'); }, 0); 1","wait":7000},{"phase":"leave","goto":"about:blank","wait":2500}]),
 'F1':dict(name="F1 Instagram iPhone browser, booking-message link, slow app",userAgent=IG,mobile=True,delayAppMs=2500,steps=steps(INV)),
 'F2':dict(name="F2 Instagram iPhone browser, chat-reply link",userAgent=IG,mobile=True,steps=steps(LIFE)),
 'F3':dict(name="F3 WhatsApp Android browser, booking-message link",userAgent=WA,mobile=True,steps=steps(INV)),
 'H1':dict(name="H1 payment return, success, open event shape",steps=steps("https://chaptera.in/plans?payment_status=success&txnid=ZZTXN0001&event=zz-fake-event&payment_type=advance")),
 'H2':dict(name="H2 payment return, success, invite shape",steps=steps("https://chaptera.in/invite/zz-fake-event?payment_status=success&txnid=ZZTXN0001&payment_type=full")),
 'I':dict(name="I ordinary reel visitor /lifestyle?utm_source=sp_auto_dm&fbclid",steps=steps("https://chaptera.in/lifestyle?utm_source=sp_auto_dm&fbclid=ZZfbclidZZ1234567890")),
 'J':dict(name="J creator link /lifestyle?ref=zzhandle",steps=steps("https://chaptera.in/lifestyle?ref=zzhandle")),
 'L':dict(name="L an error whose message itself contains a personal link",steps=[{"phase":"landing","goto":INV,"wait":9000},{"phase":"sentry-error","eval":"setTimeout(() => { throw new Error('zz-synthetic-sentry-test at https://chaptera.in/invite?phone=9000000001&name=Zztest'); }, 0); 1","wait":7000},{"phase":"leave","goto":"about:blank","wait":2500}]),
 'G1':dict(name="G1 failure drill: Meta renames the module our guard looks up (pixel itself still works)",mutate=[{"urlIncludes":"connect.facebook.net/","from":"\"SignalsFBEventsEvents\"","to":"\"SignalsFBEventsEventsRenamed\""}],steps=[{"phase":"dirty-visit","goto":"https://chaptera.in/?preview_event=founders-meet&wa=ZZZZsyntheticZZZZ.0","wait":12000},{"eval":"sessionStorage.getItem('ca_pixel_guard_off')","as":"guardOffFlag"},{"phase":"clean-visit","goto":"https://chaptera.in/?preview_event=founders-meet","wait":12000}]),
 'G2':dict(name="G2 failure drill: Meta keeps the hook but stops honouring it",mutate=[{"urlIncludes":"connect.facebook.net/en_US/fbevents.js","from":"documentLink:_.dl?_.dl:\"\"","to":"documentLink:d"}],steps=[{"phase":"dirty-visit-1","goto":"https://chaptera.in/?preview_event=founders-meet&wa=ZZZZsyntheticZZZZ.0","wait":12000},{"eval":"sessionStorage.getItem('ca_pixel_guard_off')","as":"guardOffFlag"},{"phase":"dirty-visit-2-same-tab","goto":"https://chaptera.in/?preview_event=founders-meet&wa=ZZZZsyntheticZZZZ.0","wait":12000},{"phase":"clean-visit","goto":"https://chaptera.in/?preview_event=founders-meet","wait":12000}]),
 'M':dict(name="M healthy pixel, direct plan link with the code: two app events on one load",steps=[{"phase":"landing","goto":"https://chaptera.in/?preview_event=founders-meet&wa=ZZZZsyntheticZZZZ.0","wait":12000}]),
 'N':dict(name="N plans page reached with the personal parameters still in the address",steps=steps("https://chaptera.in/plans?phone=9000000001&name=Zztest&wa=ZZZZsyntheticZZZZ.0")),
 'K':dict(name="K address with a # part",steps=steps("https://chaptera.in/lifestyle?email=zztest%40example.com#zzfrag=ZZFRAG1")),
 # WHO GETS COUNTED (added 2026-10-12, the last script of index.html's tool block).
 # In these rows the right answer is silence: GA must show a dash in every one,
 # and Contentsquare too in P1 and P2. A "clean" there means the rule has broken.
 'P1':dict(name="P1 must be silent: the local dev server (needs `npm run dev` on :5175) - GA and CS both a dash",nodist=True,steps=steps("http://localhost:5175/lifestyle?utm_source=zzsealed")),
 'P2':dict(name="P2 must be silent: a preview address - GA and CS both a dash",extraSiteHosts=["zz-preview-sealed.vercel.app"],steps=steps("https://zz-preview-sealed.vercel.app/lifestyle?utm_source=zzsealed")),
 'P3':dict(name="P3 must be silent for Google: the team's screen /admin - GA a dash",steps=steps("https://chaptera.in/admin")),
 'P4':dict(name="P4 must be silent for Google: /team - GA a dash",steps=steps("https://chaptera.in/team")),
 'P5':dict(name="P5 must be silent for Google: a plan preview opened from the admin panel (staff=1) - GA a dash",steps=steps("https://chaptera.in/?preview_event=founders-meet&staff=1")),
}
for k,v in sc.items():
    if dist!='LIVE' and not v.pop('nodist',False): v['dist']=dist
    v['name']=('AFTER (prototype build) — ' if dist!='LIVE' else 'BEFORE (live site) — ')+v['name']
    json.dump(v,open(f"{sys.argv[2]}-{k}.json",'w'),indent=1)
