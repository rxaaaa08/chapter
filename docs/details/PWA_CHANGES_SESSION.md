# PWA Changes Session

Date: May 25, 2026
Branch: `preview-may24`

## Summary

This session focused on Android/iOS PWA install UX and the installed PWA entry experience.

The main result is that install prompts now show a clearer post-install flow, and the standalone PWA now opens to a lightweight app home instead of the public website/about page.

## Commits

- `75a3fbf` - Add PWA install success state
- `7b08de0` - Wait for PWA install completion before success
- `8d828b2` - Show PWA install spinner until completion
- `756846c` - Extend PWA install spinner duration
- `1ff173d` - Add plans PWA install success state
- `6c2c4ab` - Add standalone PWA home screen

## Android Meta Browser Install Flow

File: `src/App.tsx`

Relevant components:

- `InAppBrowserNudge`
- `PwaAutoInstallOverlay`

Current flow:

1. Instagram/Facebook Android in-app browser shows the install nudge.
2. Tapping `Install App` opens Chrome using an Android intent URL with `?pwa_install=1`.
3. Chrome loads the same route, the app removes `pwa_install` from the visible URL, and `PwaAutoInstallOverlay` appears.
4. If `beforeinstallprompt` is available, the sheet shows the native `Install App` button.
5. After the user accepts, the sheet shows a spinner.
6. The success card appears only after `appinstalled` fires plus a 15-second buffer.

Important note:

The spinner is not a real download progress tracker. Browsers do not expose a reliable API that confirms the Android launcher icon is physically present. The 15-second delay is an intentional UX buffer because WebAPK creation can lag behind the browser install event.

## Plans Flow PWA Prompt

Files:

- `src/AppFlow.tsx`
- `src/App.tsx`

The plans/doubt-chat install prompt now mirrors the Android Meta handoff UX:

- `idle` - show install button or manual platform instructions
- `installing` - show spinner after accepted native prompt
- `installed` - show success card with the app icon and home-screen guidance

This was added in both current prompt copies because both paths still exist in the codebase.

## Standalone PWA Home

File: `src/App.tsx`

New component:

- `PwaHomeScreen`

When the app is running in standalone PWA mode and opens on `/` or `/aboutus`, it now shows a compact app home with:

- `View my plans` -> `/invite`
- `Explore plans` -> `/plans`

Normal browser visits are unchanged. Non-standalone `/` still redirects to `/aboutus`.

## Existing PWA Foundation

Files:

- `public/manifest.json`
- `public/sw.js`
- `index.html`
- `vercel.json`

Key behavior:

- Manifest uses `display: standalone`.
- Service worker is registered from `src/main.tsx`.
- `index.html` captures `beforeinstallprompt` early on `window.__deferredInstallPrompt`.
- Vercel headers keep `manifest.json` and `sw.js` served with correct content types and no-cache headers.

## Known Caveats

- Android may still show Chrome/system UI that looks like "Add to Home screen" during install. If the icon has a Chrome badge, Android/Chrome may still be creating a shortcut-style entry or may still be preparing the WebAPK.
- The web app cannot directly open the newly installed PWA after install.
- The web app cannot reliably verify exact launcher-icon creation. It can only react to browser-level install events.
- iOS Meta browser flow currently asks users to open in the external browser first. A fuller iOS PWA install flow still needs design and implementation.

## Verification

Ran:

```bash
npm run lint
```

TypeScript passed after the implemented changes.
