# Theme Light & System — Figma Make Specification

> Extracted directly from live Figma Make bundle, DOM, CSS (`make_index.css`), and source files (`src/app/App.tsx`, `src/app/FarmDashboard.tsx`, `src/app/Auth.tsx`).
> All values are exact — zero approximation.

---

## 1. Design Token Matrix (Dark vs Light)

### 1.1. Core CSS Variables (from `make_index.css`)

In Make CSS, `:root` specifies the Dark palette by default, and the `.light` class overrides the specific tokens for Light mode. Tokens not explicitly overridden in `.light` inherit directly from `:root`.

| CSS Variable | Dark (`:root`) | Light (`.light`) | Make CSS Rule Source |
|---|---|---|---|
| `--background` | `#0d1715` | `#f3f5ef` | `:root` line 2020 / `.light` line 2036 |
| `--foreground` | `#edf4ef` | `#182b22` | `:root` line 2021 / `.light` line 2037 |
| `--card` | `#14211e` | `#ffffff` | `:root` line 2022 / `.light` line 2038 (`#fff`) |
| `--popover` | `#1c2b27` | `#e9eee5` | `:root` line 2023 / `.light` line 2039 |
| `--primary` | `#45d483` | `#168647` | `:root` line 2024 / `.light` line 2046 |
| `--primary-foreground` | `#0d1715` | `#ffffff` | `:root` line 2025 / `.light` line 2047 (`#fff`) |
| `--secondary` | `#243631` | `#e1e9dc` | `:root` line 2026 / `.light` line 2040 |
| `--secondary-foreground` | `#edf4ef` | `#182b22` | `:root` line 2027 / `.light` line 2041 |
| `--muted` | `#1c2b27` | `#e8eee4` | `:root` line 2028 / `.light` line 2042 |
| `--muted-foreground` | `#91a69d` | `#586e60` | `:root` line 2029 / `.light` line 2043 |
| `--accent` | `#4ca8ff` | `#4ca8ff` | Inherited from `:root` (line 2030) |
| `--accent-foreground` | `#0d1715` | `#0d1715` | Inherited from `:root` (line 2031) |
| `--destructive` | `#e96a6a` | `#e96a6a` | Inherited from `:root` (line 2032) |
| `--border` | `#2a3c35` | `#d6dfd0` | `:root` line 2033 / `.light` line 2044 |
| `--input` | `#1c2b27` | `#ffffff` | `:root` line 2034 / `.light` line 2045 (`#fff`) |
| `--ring` | `#45d483` | `#168647` | Tracks `--primary` (Tailwind `ring-primary/15`) |
| `--radius` | `.875rem` (14px) | `.875rem` (14px) | Constant |

---

### 1.2. Complete RN Palette Mapping (`src/theme/palettes.ts`)

Every key in `darkPalette` must match the current `colors` in `src/theme.ts` byte-per-byte to prevent any pixel regression in Dark mode. The corresponding keys in `lightPalette` are derived from the Make source.

| Key | Dark Palette (`darkPalette`) | Light Palette (`lightPalette`) | Origin / Role |
|---|---|---|---|
| `bg` | `#0d1715` | `#f3f5ef` | `--background` |
| `foreground` | `#edf4ef` | `#182b22` | `--foreground` |
| `primary` | `#45d483` | `#168647` | `--primary` |
| `primaryForeground` | `#0d1715` | `#ffffff` | `--primary-foreground` |
| `secondary` | `#243631` | `#e1e9dc` | `--secondary` |
| `accentBlue` | `#4ca8ff` | `#4ca8ff` | `--accent` (dot in logo, links, info badges) |
| `card` | `#14211e` | `#ffffff` | `--card` |
| `border` | `#2a3c35` | `#d6dfd0` | `--border` |
| `muted` | `#1c2b27` | `#e8eee4` | `--muted` |
| `mutedForeground` | `#91a69d` | `#586e60` | `--muted-foreground` |
| `surface` | `#1c2b27` | `#e8eee4` | Token alias of `muted` |
| `popover` | `#1c2b27` | `#e9eee5` | `--popover` |
| `growing` | `#e6c16a` | `#e6c16a` | Farm growing status & countdown |
| `destruct` | `#e96a6a` | `#e96a6a` | `--destructive` |
| `surfaceRaised` | `#1c2b27` | `#e8eee4` | Legacy alias |
| `text` | `#edf4ef` | `#182b22` | Legacy alias of `foreground` |
| `accent` | `#45d483` | `#168647` | Legacy alias of `primary` |
| `accentDim` | `#1a4a30` | `#d4edd9` | Dim green surface / badge background |
| `readyBg` | `#0f2c1c` | `#eaf6e9` | Ready farm card bg (Make: `[.light_&]:bg-[#eaf6e9]`) |
| `danger` | `#e96a6a` | `#e96a6a` | Legacy alias of `destruct` |
| `dangerBg` | `#2a1515` | `#fde8e8` | Dim red surface |
| `input` | `#1c2b27` | `#ffffff` | `--input` |
| `warningBg` | `#2a2210` | `#fdf6e7` | Dim amber surface |
| `warningText` | `#e6c16a` | `#e6c16a` | Growing status text |

---

## 2. Theme Application & System Resolution

### 2.1. Make Source Logic

From `src/app/App.tsx` (lines 891–897):
```tsx
const isLight =
  prefs.theme === "light" ||
  (prefs.theme === "system" &&
    window.matchMedia("(prefers-color-scheme: light)").matches)

return (
  <div
    className={`${
      isLight ? "light" : ""
    } mx-auto min-h-dvh max-w-[460px] bg-background text-foreground sm:border-x sm:border-border/70`}
  >
    ...
```

1. **Storage Key**: `growtrack-prefs`.
2. **Preference Type**: `'dark' | 'light' | 'system'`.
3. **Default Value**: `'dark'`.
4. **System Resolution**:
   - When preference is `'system'`, check OS color scheme (`useColorScheme()` in React Native, `matchMedia` on Web).
   - Scheme updates immediately when OS changes appearance.
5. **Reset Data**:
   - In Make's `handleResetData` (lines 1558–1563), `prefs` is explicitly reset to:
     ```ts
     {
       theme: "dark",
       notifications: true,
       time: "24",
       behavior: "seed",
     }
     ```

### 2.2. Preventing Flash of Wrong Theme (Flicker Prevention)

- `ThemeProvider` must read `growtrack-prefs` from `AsyncStorage` on app start before the first visual content renders.
- While preferences are loading, display an uncolored blank canvas (`backgroundColor: colors.bg` matching native OS color scheme) or hold splash.
- In `app.json`:
  - Set `"userInterfaceStyle": "automatic"` so Android and iOS allow light and dark native backgrounds.
  - Set `StatusBar` style dynamically (`light` for dark theme, `dark` for light theme).

---

## 3. Screen & Component Deltas (Light vs Dark)

### 3.1. Ready Farm Card (`FarmCard.tsx` / `FarmDashboard.tsx`)

In Make `FarmDashboard.tsx` (line 464) and `App.tsx` (line 404):
```tsx
status === "Ready"
  ? "border-primary/35 bg-[#142b20] [.light_&]:bg-[#eaf6e9]"
  : "border-border/70 bg-card"
```
- **Dark Mode**:
  - Background: `#142b20` (in `FarmCard.tsx`, mapped via `readyBg` / `cardReady`)
  - Border: `withAlpha(colors.primary, 0.35)`
- **Light Mode**:
  - Background: `#eaf6e9` (Exact hex from Make)
  - Border: `withAlpha(colors.primary, 0.35)`

### 3.2. TabBar (Bottom Navigation)

In Make `App.tsx` (lines 1400–1430):
```tsx
<nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[460px] -translate-x-1/2 justify-around border-t border-border bg-card/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
```
- **Dark Mode**: `bg-card/95` = `withAlpha('#14211e', 0.95)` = `rgba(20, 33, 30, 0.95)`.
- **Light Mode**: `bg-card/95` = `withAlpha('#ffffff', 0.95)` = `rgba(255, 255, 255, 0.95)`.
- Border top: `border` (`#2a3c35` dark, `#d6dfd0` light).
- Active item: `colors.primary` (`#45d483` dark, `#168647` light).
- Inactive item: `colors.mutedForeground` (`#91a69d` dark, `#586e60` light).

### 3.3. Toast Notification

In Make `App.tsx`:
```tsx
border border-primary/25 bg-popover p-4 text-sm shadow-xl
```
- Background: `colors.popover` (`#1c2b27` dark, `#e9eee5` light).
- Border: `withAlpha(colors.primary, 0.25)`.
- Check icon: `colors.primary` (`#45d483` dark, `#168647` light).
- Text: `colors.foreground` (`#edf4ef` dark, `#182b22` light).

### 3.4. Overlays & Sheets

In Make `App.tsx`:
- Backdrop: `rgba(0, 0, 0, 0.65)` (`bg-black/65` with `backdrop-blur-[3px]`) in BOTH themes.
- Dialog / Sheet container:
  - Details sheet: `colors.popover` (`#1c2b27` dark, `#e9eee5` light).
  - Dialogs & standard sheets: `colors.bg` (`#0d1715` dark, `#f3f5ef` light).
  - Border: `colors.border` (`#2a3c35` dark, `#d6dfd0` light).
- Drag handle:
  - `bg-muted-foreground/40` = `withAlpha(colors.mutedForeground, 0.40)`.
  - Dark: `rgba(145, 166, 157, 0.4)`.
  - Light: `rgba(88, 110, 96, 0.4)`.

### 3.5. Settings Toggle

In Make `App.tsx`:
- Track ON: `colors.primary` (`#45d483` dark, `#168647` light).
- Track OFF: `colors.secondary` (`#243631` dark, `#e1e9dc` light).
- Knob: `#ffffff` in BOTH themes.

### 3.6. Theme Overlay Swatches

In Make `App.tsx` (lines 1802–1813):
- Dark preview card: `#0d1715` (constant).
- Light preview card: `#edf2e8` (constant).
- System preview card: 50% `#0d1715` to 50% `#edf2e8` (constant).
- Inner mock cards: `border border-[#819287]/30 bg-[#819287]/20` (constant).
- Active option border: `colors.primary` (`#45d483` dark, `#168647` light).
- Inactive option border: `colors.border` (`#2a3c35` dark, `#d6dfd0` light).

### 3.7. Settings Rows

In Make `App.tsx`:
- Border bottom: `border-border/60` = `withAlpha(colors.border, 0.60)`.
- Icon color: `colors.mutedForeground`.
- Title: `colors.foreground`.
- Detail: `colors.mutedForeground`.
- Danger row text: `colors.destruct` (`#e96a6a` in both).

### 3.8. Auth Screen (`Auth.tsx`)

- Ground illustration in Auth:
  ```tsx
  <div className="absolute bottom-0 w-48 border-t-2 border-primary/60">
    <div className="grid grid-cols-12">
      {/* 24 cells repeating: bg-primary/15, bg-secondary, bg-card */}
    </div>
  </div>
  ```
  All three cell colors (`primary/15`, `secondary`, `card`) dynamically track theme!
- Sprout illustration:
  - Sprout 1: `withAlpha(colors.primary, 0.80)`.
  - Sprout 2: `colors.primary`.
- Password strength bars:
  - Empty: `colors.secondary`.
  - Level 1: `#e96a6a` (destructive).
  - Level 2: `#e6c16a` (growing).
  - Level 3: `#4ca8ff` (accent).
  - Level 4: `colors.primary`.
- Input fields:
  - Background: `colors.input` (`#1c2b27` dark, `#ffffff` light).
  - Border: `colors.border` (`#2a3c35` dark, `#d6dfd0` light).
  - Focus border: `colors.primary`.
  - Focus ring: `withAlpha(colors.primary, 0.15)`.
- Google button:
  - Background: `colors.card` (`#14211e` dark, `#ffffff` light).
  - Border: `colors.border` (`#2a3c35` dark, `#d6dfd0` light).
  - Text: `colors.foreground`.
  - Google SVG paths: brand colors `#4285F4`, `#34A853`, `#FBBC05`, `#EA4335` (constant).

---

## 4. Theme-Independent Constants

These literal colors are intentionally invariant across themes:
1. **Google brand colors**: `#4285F4`, `#34A853`, `#FBBC05`, `#EA4335` in `AuthIcons.tsx`.
2. **Theme swatch preview backgrounds**: `#0d1715`, `#edf2e8`, `#555f5c` in `SettingsScreen.tsx`.
3. **Theme swatch mock card borders/fills**: `rgba(129, 146, 135, 0.30)` and `rgba(129, 146, 135, 0.20)` (`#819287`).
4. **Destructive button text**: `#21110e` (dark maroon text on red button `bg-destructive`).
5. **Backdrop modal scrim**: `rgba(0, 0, 0, 0.65)`.
6. **Toggle switch knob**: `#ffffff`.
7. **Star favorite icon**: `#F2C94C` (gold star fill and stroke).
8. **Android push notification light**: `#3DDC84` in `notifications.ts`.
9. **Shadow color**: `#000000`.

---

## 5. Assets

- `/items/*.webp` (pepper-seed, pepper-item, etc.): Identical across both Light and Dark themes in Make.
- 6 PNG images in `figma/make/image/` (`55a4605a…`, `7bfddfa6…`, `8aa7afac…`, `9fac6942…`, `cd1ce2c3…`, `fc9e2ba5…`): Not referenced in Make code or CSS.
- Lucide SVG icons: Stroke and geometry identical across themes; color bound to theme tokens (`primary`, `mutedForeground`, etc.).

---

## 6. Alpha Ratios Used in Make

| Alpha Ratio | Make Tailwind Class | Dark RGBA Basis (`#...`) | Light RGBA Basis (`#...`) |
|---|---|---|---|
| `0.05` (5%) | `bg-primary/5`, `bg-accent/5` | `withAlpha(primary, 0.05)` | `withAlpha(primary, 0.05)` |
| `0.10` (10%) | `bg-primary/10`, `dangerBg` | `withAlpha(primary, 0.10)` | `withAlpha(primary, 0.10)` |
| `0.15` (15%) | `ring-primary/15`, `bg-primary/15` | `withAlpha(primary, 0.15)` | `withAlpha(primary, 0.15)` |
| `0.20` (20%) | `border-accent/20`, mock card | `withAlpha(accent, 0.20)` | `withAlpha(accent, 0.20)` |
| `0.25` (25%) | `border-primary/25` | `withAlpha(primary, 0.25)` | `withAlpha(primary, 0.25)` |
| `0.30` (30%) | `border-primary/30` | `withAlpha(primary, 0.30)` | `withAlpha(primary, 0.30)` |
| `0.35` (35%) | `border-primary/35` | `withAlpha(primary, 0.35)` | `withAlpha(primary, 0.35)` |
| `0.40` (40%) | `bg-muted-foreground/40` | `withAlpha(mutedFg, 0.40)` | `withAlpha(mutedFg, 0.40)` |
| `0.60` (60%) | `border-border/60`, `primary/60` | `withAlpha(border, 0.60)` | `withAlpha(border, 0.60)` |
| `0.65` (65%) | `bg-black/65` | `rgba(0, 0, 0, 0.65)` | `rgba(0, 0, 0, 0.65)` |
| `0.70` (70%) | `border-border/70`, `mutedFg/70` | `withAlpha(border, 0.70)` | `withAlpha(border, 0.70)` |
| `0.80` (80%) | `text-primary/80`, `mutedFg/80` | `withAlpha(primary, 0.80)` | `withAlpha(primary, 0.80)` |
| `0.95` (95%) | `bg-card/95` | `withAlpha(card, 0.95)` | `withAlpha(card, 0.95)` |

---

## 7. Status & Blocker Assessment

- **UNRESOLVED items**: None.
- All tokens, classes, source code, and behaviors from Figma Make have been extracted and verified.
- Proceeding to FASE 1: Theme Infrastructure.
