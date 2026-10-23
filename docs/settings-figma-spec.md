# Settings Screen — Figma Make Spec

> Extracted from live Figma Make bundle and DOM. All values are exact — do not approximate.

---

## Context

Settings is **not** a separate route in Make. It is a `tab === 'settings'` branch inside `FarmDashboard`. The full app (farms / seeds / settings) lives in one `FarmDashboard` component with a bottom nav and `tab` state.

In the RN app, Settings is `SettingsScreen.tsx` accessed via the existing navigation system. This spec describes what to replicate from Make's settings tab.

---

## Page Layout

```
main: px-5 pb-28 pt-3 animate-[enter_.2s_ease-out]
  h1: font-pixel text-3xl (30px) — "Settings"
  p:  mt-1 text-sm text-muted-foreground (14px) — "Make GrowTrack work for you."
  [sections...]
  p:  mt-8 text-center font-pixel text-lg text-primary (18px) — "Keep every farm growing."
nav: (see Bottom Nav)
```

| Property | Tailwind | px value |
|---|---|---|
| padding-x | `px-5` | 20px |
| padding-bottom | `pb-28` | 112px |
| padding-top | `pt-3` | 12px |

---

## Section Structure

```
section: mt-7  (margin-top = 28px)
  h2: mb-2 text-[10px] font-bold tracking-[.12em] text-muted-foreground
      — letter-spacing = 0.12 × 10px = 1.2px
  [rows]
```

---

## Row Types

### Button Row

```
button: flex min-h-14 w-full items-center gap-3 border-b border-border/60 text-left text-sm
```

| Property | Value |
|---|---|
| min-height | 56px (`min-h-14`) |
| gap | 12px (`gap-3`) |
| border-bottom | 1px solid rgba(42,60,53,0.6) |

**Children:**

| Slot | Classes | Content |
|---|---|---|
| Icon span | `text-muted-foreground` | SVG 18×18 |
| Title span | `flex-1` | Title text, 14px |
| Detail span | `text-xs text-muted-foreground` | 12px; empty if no detail |
| ChevronRight | `text-muted-foreground` | size=15 |

**Danger variant:** adds `text-destructive` to the button element.

---

### Notifications Row (Toggle)

```
div: flex min-h-16 items-center gap-3 border-b border-border
     — min-height = 64px
```

| Element | Detail |
|---|---|
| Bell icon | size=18, `text-muted-foreground` |
| Label span | `flex-1 text-sm` — "Harvest notifications" |
| Toggle wrapper | `role=switch`, `aria-checked`, `aria-label="Enable harvest notifications"` |
| Toggle wrapper size | min-h: 44px (`min-h-11`), min-w: 48px (`min-w-12`) |
| Track | `flex h-6 w-11 items-center rounded-full px-1 transition-colors` |
| Track ON | `bg-primary` = #45d483 |
| Track OFF | `bg-secondary` = #243631 |
| Knob | `size-4 rounded-full bg-white transition-transform` (16×16) |
| Knob ON | `translate-x-5` = 20px right |
| Knob OFF | `translate-x-0` |

---

## Sections Inventory

### 1. APPEARANCE

| Setting | Icon | Detail | Action |
|---|---|---|---|
| Theme | Moon (18) | `prefs.theme` capitalized (Dark / Light / System) | Opens `theme` overlay |

---

### 2. NOTIFICATIONS

| Setting | Icon | Control | Value |
|---|---|---|---|
| Harvest notifications | Bell (18) | Toggle | `prefs.notifications` (bool) |

---

### 3. FARM TRACKING

| Setting | Icon | Detail | Action |
|---|---|---|---|
| Default grow-time behavior | Clock3 (18) | "Use seed time" or "Manual" | Opens `behavior` overlay |
| Time format | Sun (18) | "24-hour" or "12-hour" | Toggles inline (no overlay) |

---

### 4. DATA

| Setting | Icon | Danger | Action |
|---|---|---|---|
| Restore default seeds | RotateCcw (18) | No | Opens `restore` confirm dialog |
| Reset app data | Trash2 (18) | **Yes** (`text-destructive`) | Opens `reset-data` confirm dialog |

---

### 5. ABOUT

| Setting | Icon | Detail | Action |
|---|---|---|---|
| About GrowTrack | CircleHelp (18) | — | Opens `about` overlay |
| Version | Info (18) | "1.0.0" | Shows toast "You're up to date" |
| Getting started | Sprout (18) | — | Opens `onboarding` overlay (stub) |

---

### 6. ACCOUNT

| Condition | Title | Detail | Action |
|---|---|---|---|
| Guest | "Guest Mode / Sign in" | `${farmCount} / 5 farms` | Opens `account` overlay |
| Member | "Account" | `account.name` | Opens `account` overlay |

Icon: LogIn (18)

---

## Overlay / Sheet System

### Backdrop

```
div: fixed inset-0 z-40 flex items-end justify-center
     bg-black/65 backdrop-blur-[3px]
     on close: animate-[dim-out_.16s_ease-in_forwards] pointer-events-none
```

---

### Sheet (non-confirm overlays)

Applies to: `theme`, `account`, `about`, `behavior`, `onboarding`

```
div[role=dialog]: w-full max-w-[460px] overflow-y-auto border border-border
  bg-background p-5 pb-[max(24px,env(safe-area-inset-bottom))] shadow-2xl
  max-h-[92dvh] rounded-t-3xl
  open:  animate-[sheet_.25s_cubic-bezier(.2,.8,.2,1)]
  close: animate-[sheet-out_.16s_ease-in_forwards]
```

**Drag handle:**
```
mx-auto mb-5 h-1 w-9 rounded-full bg-muted-foreground/40
— 4px h, 36px w, rounded-full, rgba(145,166,157,0.4)
```

**Header:**
```
mb-5 flex items-center justify-between
  h2: font-pixel text-[27px] — overlay title
  X button: flex size-11 shrink-0 items-center justify-center text-muted-foreground
    X icon: size=20
```

---

### Dialog (confirm overlays)

Applies to: `restore`, `reset-data`

```
div[role=dialog]: w-full max-w-[360px] rounded-2xl border border-border
  bg-background p-5 pb-[max(24px,safe-area)] shadow-2xl
  mb-[30vh] mx-5  ← lifted from bottom
  open:  animate-[enter_.2s_ease-out]
  close: animate-[dim-out_.16s_ease-in_forwards]

  header: mb-5 flex items-center justify-between
    h2: font-pixel text-[27px]
    X button: same as sheet

  body p: text-sm leading-6 text-muted-foreground

  actions: mt-6 flex gap-3
    Cancel btn: secondary style, flex-1
    Confirm btn: primary or destructive style, flex-1
```

---

### Overlay Titles

| Key | Title |
|---|---|
| `theme` | "Choose your theme" |
| `account` | "Your farms, everywhere" |
| `restore` | "Restore default seeds?" |
| `reset-data` | "Reset app data?" |
| `about` | "About GrowTrack" |
| `behavior` | "Default grow time" |
| `onboarding` | "GrowTrack" |

---

### Overlay Body Messages

| Key | Message |
|---|---|
| `restore` | "Restore GrowTrack's starter seed library. Your custom seeds and farm timers will stay unchanged." |
| `reset-data` | "This will remove your farms, custom seeds, and app preferences. This cannot be undone." |

---

### Overlay Action Buttons

| Key | Cancel | Confirm | Style |
|---|---|---|---|
| `restore` | "Cancel" (secondary) | "Restore" | primary |
| `reset-data` | "Cancel" (secondary) | "Reset data" | destructive |

**Success toasts:**

| Action | Toast |
|---|---|
| Restore | "Starter seeds restored" |
| Reset | "Done. Your data has been updated." |

---

## Button Styles

```js
var button    = "flex min-h-11 rounded-[10px] px-4 text-sm font-semibold transition active:scale-[.97] disabled:opacity-40"
var primary   = button + " bg-primary text-primary-foreground"
var secondary = button + " bg-secondary text-foreground"
// Destructive:
                button + " bg-destructive text-[#21110e]"
```

| Token | Value |
|---|---|
| `min-h-11` | 44px |
| `rounded-[10px]` | borderRadius 10px |
| `active:scale-[.97]` | press scale 0.97 |
| `bg-destructive` | #e96a6a |
| `text-[#21110e]` | dark maroon #21110e |

---

## Overlay Content Details

### Theme Overlay

```
grid grid-cols-3 gap-3  (3 columns, 12px gap)

Each option button:
  rounded-xl border-2 p-3 text-left
  active:   border-primary
  inactive: border-border

  Preview div: mb-3 h-24 rounded-lg p-2
    dark:   bg-[#0d1715]
    light:  bg-[#edf2e8]
    system: bg-linear-to-r from-[#0d1715] from-50% to-[#edf2e8] to-50%

  Label span: text-xs capitalize — theme name
  Check icon: size=14, text-primary — shown when selected (float-right)
```

---

### Behavior Overlay

Two rows using the Row component:

| Value | Icon | Title | Detail |
|---|---|---|---|
| `seed` | Check (when selected) | "Use seed time" | "Farm timers follow the seed's grow time." |
| `manual` | Check (when selected) | "Manual only" | "Set a custom time for each farm." |

Row press → `setPrefs({...prefs, behavior: value})` + close

---

### Account Overlay — Guest

```
text-sm leading-6 text-muted-foreground

p: "You're growing as a Guest. Track up to 5 farms, with timers and preferences saved on this device."
p.mt-3: "Create an account to manage more farms. Cross-device synchronization is coming in a future update."

button (primary,   mt-6, w-full): "Create Account" → navigate to signup
button (secondary, mt-3, w-full): "Sign In"         → navigate to login
button (button,    mt-2, w-full): "Not now"          → close()
```

---

### Account Overlay — Member

```
div.rounded-xl.bg-card.p-4:
  p.font-semibold.text-foreground: account.name
  p.mt-1.break-all.text-xs: account.email  (12px, break-all)
  p.mt-3.flex.items-center.gap-2.text-xs:
    ShieldCheck icon (size=14, text-accent=#4ca8ff)
    "Sync status · Saved on this device"

p.mt-4.text-xs.leading-5:
  "This is a preview account. Cloud synchronization is not connected yet. Your farm timers remain on this device."

button (secondary, mt-5, w-full): "Sign out" → signOut() + navigate to login
```

---

### About Overlay

```
div.space-y-4.text-sm.leading-6.text-muted-foreground:
  p: "Built for growers who have more than one world to look after. Track, harvest, and replant — without the world-hopping."
  p: "GrowTrack is an independent companion, not affiliated with Ubisoft or Growtopia. Item imagery belongs to its respective owners."
  p.text-xs: "Version 1.0.0 · Timers and preferences saved on this device. Browser harvest alerts require notification permission; notifications while the app is closed need future background support."
```

---

### Onboarding Overlay (Stub)

Content not fully extracted. Render stub:

```
Sheet title: "GrowTrack"
Body: "Getting started guide coming soon."
```

---

## Toast

```
div: fixed bottom-[max(80px,calc(env(safe-area-inset-bottom)+68px))] left-1/2 -translate-x-1/2 z-50
     rounded-xl bg-card border border-border px-4 py-3
     text-sm font-medium text-foreground
     animate-in: motion-safe:animate-[enter_.2s_ease-out]
Auto-dismiss: 3500ms
```

---

## Bottom Nav

```
nav: fixed bottom-0 left-1/2 z-20 flex w-full max-w-[460px] -translate-x-1/2 justify-around
     border-t border-border bg-card/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-2
     backdrop-blur-md
```

**Tab button:**

```
flex min-h-12 w-20 flex-col items-center justify-center gap-1
text-[10px] font-medium
active:   text-primary
inactive: text-muted-foreground
aria-current="page" when active
```

| Property | Value |
|---|---|
| `min-h-12` | 48px |
| `w-20` | 80px |
| `gap-1` | 4px |
| `px-5` | 20px |
| `pt-2` | 8px |
| `pb` | max(12px, safe-area-inset-bottom) |

**Tabs:**

| Tab | Icon | Label | Icon size |
|---|---|---|---|
| farms | Sprout | "Farms" | 21 |
| seeds | Leaf | "Seeds" | 21 |
| settings | Settings/Gear | "Settings" | 21 |

---

## Icon SVG Paths

All icons use `strokeWidth=2`, `stroke="currentColor"`, `fill="none"` unless noted.

### Moon (18×18)
```svg
<path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/>
```

### Bell (18×18)
```svg
<path d="M10.268 21a2 2 0 0 0 3.464 0"/>
<path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"/>
```

### Clock3 (18×18)
```svg
<circle cx="12" cy="12" r="10"/>
<path d="M12 6v6h4"/>
```

### Sun (18×18)
```svg
<circle cx="12" cy="12" r="4"/>
<path d="M12 2v2 M12 20v2 m4.93 4.93 1.41 1.41 m17.66 17.66 1.41 1.41 M2 12h2 M20 12h2 m6.34 17.66-1.41 1.41 m19.07 4.93-1.41 1.41"/>
```

### RotateCcw (18×18)
```svg
<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
<path d="M3 3v5h5"/>
```

### Trash2 (18×18)
```svg
<path d="M10 11v6 M14 11v6 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M3 6h18 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
```

### CircleHelp (18×18)
```svg
<circle cx="12" cy="12" r="10"/>
<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
<path d="M12 17h.01"/>
```

### Info (18×18)
```svg
<circle cx="12" cy="12" r="10"/>
<path d="M12 16v-4"/>
<path d="M12 8h.01"/>
```

### LogIn (18×18)
```svg
<path d="m10 17 5-5-5-5"/>
<path d="M15 12H3"/>
<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
```

### Settings / Gear (21×21, nav only)
```svg
<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/>
<circle cx="12" cy="12" r="3"/>
```

### ChevronRight (15×15)
```svg
<path d="m9 18 6-6-6-6"/>
```

### X (20×20, overlay close)
```svg
<path d="M18 6 6 18"/>
<path d="m6 6 12 12"/>
```

### Check (14×14 theme selection, 18×18 behavior)
```svg
<path d="M20 6 9 17l-5-5"/>
```

### ShieldCheck (14×14, account panel)
```svg
<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
<path d="m9 12 2 2 4-4"/>
```

### Leaf (21×21, nav)
```svg
<path d="M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20"/>
<path d="M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13"/>
```

### Sprout (21×21, nav)
Already in `AuthIcons.tsx` — reuse existing.

---

## Data / Storage

### localStorage Keys (Make)

| Key | Value |
|---|---|
| `growtrack-prefs` | `{theme: 'dark'\|'light'\|'system', notifications: bool, time: '24'\|'12', behavior: 'seed'\|'manual'}` |
| `growtrack-seeds` | Array of seed objects |
| `growtrack-farms` | Demo account farms (key for archell@growtrack.app) |
| `growtrack-guest-farms` | Guest account farms |
| `growtrack-member-farms:<email>` | Member account farms |
| `growtrack-account` | Session key (same as RN app) |
| `growtrack-preview-profiles` | Registered profiles |
| `growtrack-farm-view` | `'list'\|'grid'` (farm view pref) |

### ⚠️ Key Migration Required

The RN app currently uses `growtopia-farm-tracker` (different name) for all farms. Make uses `farmStorageKey(account)` returning account-specific keys.

**Migration plan:**

1. On first load with an account: if `growtopia-farm-tracker` has data **and** `farmStorageKey(account)` is empty → migrate once.
2. Going forward: use `farmStorageKey(account)` for the current user.
3. Seeds stay at `growtrack-seeds` (global, same as Make). Prefs at `growtrack-prefs`.
4. **Never delete** `growtopia-farm-tracker` — leave as backup.

---

## Animations (RN Translations)

| Name | Duration | Easing | Effect |
|---|---|---|---|
| `enter` | 200ms | `Easing.out(Easing.ease)` | opacity 0→1, translateY 8→0 |
| `sheet` | 250ms | `cubic-bezier(.2,.8,.2,1)` | translateY from screen height → 0 |
| `sheet-out` | 160ms | ease-in | translateY 0 → screen height |
| `dim-out` | 160ms | ease-in | backdrop opacity 1→0 |
| `enter` (dialogs) | 200ms | same as page enter | opacity 0→1, translateY 8→0 |

Same enter animation as AuthScreen — reuse.

---

## Notifications (RN)

Make calls `Notification.requestPermission()` when toggle is turned ON and permission not yet granted.

In RN: `expo-notifications` handles permission. When enabling:
- Call `syncAllNotifications(farms)` from store.

When disabling:
- Set `prefs.notifications = false`. This controls whether new notifications are scheduled. The store already has this logic through `notificationsEnabled` per-farm.

---

## Guest Farm Limit (5 farms)

Make shows a `guest-limit` overlay when a guest tries to add a 6th farm.

In RN: handle in `DashboardScreen` at the Add Farm button. If `guest && farms.length >= 5` → show alert/block. **This is separate from `SettingsScreen`.**

---

## Unresolved / Deferred

| Item | Status |
|---|---|
| Onboarding overlay full content | Deferred — stub with "Getting started guide coming soon." |
| All other Phase 1 items | No blockers |
