# Erta Ale Trip Log — Feature Requirement Checklist

Use this list **twice** for every feature:
1. **Before coding** — confirm the design satisfies every box.
2. **Before shipping** — re-verify by actually clicking through.

Use it **once retroactively** for each existing feature to catch gaps.

---

## A. Architecture rules (non-negotiable)

- [x] Everything stays in the single HTML file (`Erta_Ale_Trip_Log_vX.X_PWA.html`). No new JS/CSS files, no new network dependencies.
- [x] No new CDN / external script at runtime (the file must run from `file://` with no internet). _Net change: Google Fonts CDN removed, XLSX moved to lazy-load + localStorage cache._
- [x] Version number in `<title>` and header `<span>` bumped. _v2.9 → v3.0._
- [x] Inline manifest + apple-touch-icon still valid (PWA install must still work).

## B. Persistence — feature must survive ALL of these transitions

- [ ] Page refresh (F5) — state restored from `localStorage`.
- [ ] Page refresh on a **downloaded** file — state restored from embedded `_INIT_TRIPS` / `_INIT_USERS` / `_INIT_*` blocks.
- [ ] `localStorage` blocked (iOS Safari private mode, some `file://` contexts) — feature still works using in-memory fallback (`window._EMBEDDED_USERS`, `_DOWNLOADED_STATE`).
- [ ] Sign out → sign back in — feature state still there for that user.
- [ ] Switch user (admin → driver) — state is scoped to the right user, not leaked across accounts.
- [ ] New day detected (`onDateChange`) — old day auto-archived to history, new day starts clean, feature behaves correctly on day 1.

## C. Download / share workflow

- [x] `downloadLog()` still produces a working file. Filename includes a `YYYY-MM-DD_HH-MM` timestamp so repeat downloads don't overwrite each other.
- [x] Opened downloaded file **auto-signs-in as the user who downloaded it** (via `_INIT_AUTO_USER`) — no login screen, lands directly on the data.
- [x] On a downloaded file, the Sign Out button is hidden and the 1-hour inactivity timeout does NOT arm (exit by closing the tab).
- [x] Any data the feature stores is embedded into the downloaded HTML (via `replaceInit` or equivalent) so it travels to other devices.
- [x] Driver signature + per-trip signatures survive the download → reopen round-trip.
- [x] No duplicate trips after download → reopen → refresh.
- [x] Daily Log History is embedded too (via `_INIT_HISTORY`) and survives download → reopen.
- [x] For downloaded files, the embedded snapshot wins over any pre-existing `localStorage` on the same browser (`_IS_DOWNLOADED` branch in `enterApp` and `getHistory`).

## D. Auth, roles, sessions

- [ ] Admin-only actions gated (`getUsers().role === 'admin'` style check) — driver cannot reach them.
- [ ] Password check still case-insensitive (`_encodePass` lowercases).
- [x] Session timeout (1 hour idle) still arms and triggers in the **live app**; activity resets it. (Disabled on downloaded snapshots — see Section C.)
- [ ] Admin credential change (`changeAdminCredentials`) still works after the feature is added; old username key removed if renamed.
- [ ] Built-in `admin/admin123` and `driver/driver1` fallback still works when localStorage is empty.

## E. UI / device compatibility

- [ ] Landscape layout at min-width 1100px not broken (horizontal scroll inside `.trips-scroll` still aligns).
- [ ] Signature pads work with **finger AND Apple Pencil** (touch events + `touch-action:none`).
- [ ] Tap targets ≥ ~26px height; no zoom on input focus (font-size ≥ 13px on inputs).
- [ ] Header / info-bar / col-headers still align on iPad landscape and desktop.
- [ ] No emoji / no unicode that breaks on iOS Safari.

## F. Don't-break-this regression list

Click through each one after the feature lands:

- [ ] Add Trip, fill row, **Save** → row turns green, fields lock, signature locks.
- [ ] **Edit** a saved trip → fields editable, signature editable, re-Save works.
- [ ] **Save All Trips** toggles correctly (blue → green → blue).
- [ ] **Delete mode** (triple-click) shows X buttons, removes a trip, renumbers.
- [ ] **Sticky fields** (provider, license, VIN, driver name) carry over to next day / next trip.
- [ ] **XLSX import** still parses, previews, sorts by member name + trip suffix, and populates Will Call / AM-PM correctly.
- [x] **Download** then reopen file → all trips present, all sigs present, **auto-signs-in** (no login screen).
- [x] **History** overlay still lists past days; per-day download still works; per-day download also auto-signs-in on open.
- [x] **Admin panel** tabs: Create User, Manage Users (incl. **Export/Import Users** buttons), Activity Log, Admin Credentials — all still render and function.
- [x] **Export Users** downloads `erta_ale_users_<timestamp>.json` containing every account; **Import Users** validates and merges.
- [ ] **Change password** (admin changing a user's pw, user changing own pw) still works.
- [ ] **Auto-save** still writes form state on input changes (no console errors).

## G. Code-quality gates

- [ ] No `console.log` left behind.
- [ ] No `alert()` used for normal flow (use `showToast`).
- [ ] All new IDs unique; no clashes with `tn-N`, `ampm-N`, `sig-N` patterns.
- [ ] All new functions handle the "saved trip" case (read from `dataset.*`, not the hidden input).
- [ ] All new functions handle the "_restoreOnly" path used during restore from saved state.
- [ ] No new dependency on `localStorage` without a `tryLS()` wrapper / in-memory fallback.

---

## Retrospective audit — run this against each EXISTING feature

For each feature already in v2.9, walk the same A–G list and write **PASS / FAIL / N/A** next to each box. Anything that fails is a bug to file.

Suggested order to audit:
1. Sign in / Sign up / Sign out
2. Admin panel (4 tabs)
3. Add / Save / Edit / Delete trip
4. Driver signature + per-trip signatures
5. Will Call toggle + AM/PM combo
6. Sticky fields
7. Auto-save + form-state restore
8. Download log (timestamped filename, embedded state)
9. History (per-day archive + per-day download)
10. XLSX import (preview, sort, populate)
11. Fresh-day detection + auto-archive
12. Session timeout
13. Triple-click admin gestures
14. Password change (self + admin-of-other)
15. Case-insensitive password matching
16. [x] **Offline mode** — fonts/XLSX work without internet (no Google Fonts CDN at runtime; XLSX lazy-loaded and cached in `localStorage`); offline banner shows when offline.
17. [x] **Daily Log History embedded in downloads** (`_INIT_HISTORY`) — history list survives download → reopen, even on a clean device.
18. [x] **Timestamped download filenames** — both `downloadLog` and `downloadHistoryDay` append `YYYY-MM-DD_HH-MM` so files don't collide.
19. [x] **Embedded snapshot wins on downloaded files** — `_IS_DOWNLOADED` branch in `enterApp` and `getHistory` prevents stale `localStorage` from suppressing the file's data.
20. [x] **Export / Import Users** (admin panel, Manage Users tab) — move accounts between devices without bundling a full trip log.
21. [x] **Auto-sign-in on downloaded files** (`_INIT_AUTO_USER`) — open → straight to the data; no Sign Out button; no inactivity timeout; sign out in the **live app** still works normally.

---

## Quick "definition of done" (copy into PR description)

```
[ ] Single-file constraint kept, version bumped
[ ] Survives refresh / downloaded-file refresh / no-localStorage / sign-out-in / new-day
[ ] Download → reopen round-trip clean, lands on login
[ ] Admin/driver role boundary respected
[ ] Landscape + iPad + Apple Pencil verified
[ ] Regression checklist (Section F) walked
[ ] No console errors, no leftover console.log/alert
```
