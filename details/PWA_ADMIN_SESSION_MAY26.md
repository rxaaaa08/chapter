# PWA/Admin Session Notes - May 26, 2026

Branch: `preview-may24`

## Summary

This session refined the Android PWA install handoff, added/adjusted PWA install states, introduced a standalone PWA home screen, and made one admin-panel change for native application trips.

## Pushed Commits Covered

- `75a3fbf` - Add PWA install success state
- `7b08de0` - Wait for PWA install completion before success
- `8d828b2` - Show PWA install spinner until completion
- `756846c` - Extend PWA install spinner duration
- `1ff173d` - Add plans PWA install success state
- `6c2c4ab` - Add standalone PWA home screen
- `997bca1` - Hide native application date status selector
- `afc8968` - Trigger Android PWA install from lifestyle CTA
- `f76fd20` - Revert "Trigger Android PWA install from lifestyle CTA"
- `a56a10b` - Use poster CTA for Android PWA install
- `62b5a25` - Improve PWA install prompt capture timing
- `bf56fb3` - Align Android PWA install handoff timing
- `d52c5b8` - Keep Android PWA handoff on poster route

## Android Meta Browser PWA Flow

Current behavior:

1. Android Instagram/Facebook on poster pages (`/lifestyle`, `/join`, `/galcode`) no longer shows the centered install popup.
2. The poster CTA itself changes to `Install App` and uses the existing download icon.
3. Tapping the CTA opens Chrome through an Android intent URL.
4. The intent now targets the same lightweight poster route, not `/plans`, to avoid loading the heavier plans flow before the install bottom sheet.
5. Chrome opens with `?pwa_install=1`.
6. The app strips `pwa_install` from the visible URL and immediately shows `PwaAutoInstallOverlay`.
7. If `beforeinstallprompt` is available, the yellow native `Install App` button appears.
8. If no prompt arrives within 3 seconds, the sheet falls back to manual Chrome instructions.

Example final handoff shape:

```txt
intent://<host>/<current-poster-path>?pwa_install=1#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=<encoded https fallback>;end
```

## PWA Install Prompt Reliability

Files:

- `src/App.tsx`
- `src/AppFlow.tsx`
- `src/main.tsx`

Changes:

- Service worker registration moved from `window.load` to immediate registration in `src/main.tsx`.
- All `beforeinstallprompt` listeners now also write the event to `window.__deferredInstallPrompt`.
- The `?pwa_install=1` flow checks the early captured prompt and polls briefly for it.
- Fallback timing was restored to 3 seconds to match the original working flow.

## Install Success UX

Files:

- `src/App.tsx`
- `src/AppFlow.tsx`

Changes:

- Android auto-install overlay has:
  - native install button when prompt is available
  - spinner while install is in progress
  - success card with app icon after install event plus buffer
- Plans/doubt-chat PWA prompt now mirrors this state model:
  - `idle`
  - `installing`
  - `installed`

Important caveat:

The spinner is a UX buffer. Browsers do not expose a reliable API to confirm the launcher icon is physically present on the phone.

## Standalone PWA Home

File: `src/App.tsx`

Added `PwaHomeScreen`.

When the app is opened in standalone PWA mode on `/` or `/aboutus`, users now see:

- `View my plans` -> `/invite`
- `Explore plans` -> `/plans`

Normal browser visits are unchanged.

## Admin Panel Change

File: `src/AdminPanel.tsx`

For native application trips (`booking_url === 'native-application'`):

- The Trip Dates section no longer shows the manual status dropdown (`Available`, `Selling Out`, `Sold Out`).
- It shows `Spots auto` instead.
- On save, native application event dates are normalized to `available`, so old/manual statuses do not interfere with automatic spots logic.

## Current Notes / Open Questions

- WhatsApp in-app browser can be detected with `/WhatsApp/i.test(navigator.userAgent)` if we want to expand the same browser-handling logic later.
- It is only partially possible to know if a user already has the PWA:
  - reliable when currently running in standalone mode
  - reliable after the current session fires `appinstalled`
  - not reliably detectable from Instagram/WhatsApp browser or normal Chrome before install prompt availability
- The install prompt still depends on Chrome's installability decision. If Chrome does not fire `beforeinstallprompt`, the app must fall back to manual instructions.

## Verification

`npm run lint` passed after the code changes.
