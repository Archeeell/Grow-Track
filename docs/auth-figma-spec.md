# Auth Figma Make Spec — GrowTrack

Source: https://www.figma.com/make/eKkRChZaUOgj5qKV1xCeia/Designer
Extracted from live JS bundle (index-Dl027h-2.js) and live DOM on figma.site preview.
All values below are from source, not guessed.

---

## 1. SHARED STRUCTURE (both Login and Register)

```
<div> maxWidth:460 minHeight:dvh bg:#0d1715 color:#edf4ef
  sm: borderLeft/Right 1px #2a3c35 opacity 70%
  <main> px:20 pb:max(24,safeAreaBottom) pt:max(24,safeAreaTop)
         animate: enter 0.2s ease-out (opacity 0→1, translateY small→0)
    <header>
    <FarmVisual compact={isSignup||isForgot}>
    <div> heading + subtitle
    <form> (or sent-confirmation div)
    <div> OR divider + Google button (login only)
    <div> switch-link + Guest button
    <details> preview disclaimer
```

---

## 2. ENTER ANIMATION

Animation name: `enter`, duration: `0.2s`, easing: `ease-out`.
Applied on `<main>` tag via class `motion-safe:animate-[enter_.2s_ease-out]`.
In RN: fade in + translateY from ~8px to 0, 200ms, Easing.out(Easing.ease).

---

## 3. HEADER

### Login header
- `flexDirection: row, alignItems: center, justifyContent: center`
- Contains: GrowTrackLogo only

### Register/Forgot header
- `flexDirection: row, alignItems: center, justifyContent: space-between`
- Back button (left): size 44×44, borderRadius:12, borderWidth:1, borderColor:#2a3c35, color:#91a69d
  - Icon: Lucide ArrowLeft, size:18, strokeWidth:2
  - aria-label: "Back to sign in"
  - navigates to /login
- GrowTrackLogo (center)
- Spacer span: size 44×44 (balances flex layout)

### GrowTrackLogo
- `flexDirection: row, alignItems: center, gap: 8`
- Sprout SVG icon: size 21, strokeWidth:2, color: #45d483
- Text "GrowTrack": fontFamily PixelifySans-SemiBold, fontSize:23, color:#45d483
- Text ".": same span, color: #4ca8ff (accentBlue)

---

## 4. FARM VISUAL

Component: FarmVisual, aria-hidden.
Container: `position:relative, mx:auto, flexDirection:row, alignItems:flex-end, justifyContent:center, width:240`

Login: `height:112` (h-28 = 28×4)
Register/Forgot: `height:80` (h-20 = 20×4)

Inner absolute row (`bottom:24, width:192, flexDirection:row, alignItems:flex-end, justifyContent:space-around, px:16`):
1. `pepper-seed.webp` — size 28×28 (size-7), mb:4, imageRendering:pixelated
2. Sprout SVG: size:35, strokeWidth:1.5, color:#45d483 opacity 80% (#45d483 at 80%), mb:4
3. Column (center):
   - `pepper-item.webp` — size 36×36 (size-9), imageRendering:pixelated
   - Sprout SVG: size:29, strokeWidth:1.5, color:#45d483, mt:-4

Ground bar (absolute bottom:0, width:192):
- borderTop: 2px solid rgba(#45d483, 0.6) = `rgba(69,212,131,0.6)`
- Grid 12 cols, repeating pattern (24 spans total, index%3):
  - 0: bg rgba(#45d483,0.15) = `rgba(69,212,131,0.15)` — h:12
  - 1: bg #243631 (secondary) — h:12
  - 2: bg #14211e (card) — h:12

---

## 5. HEADING BLOCK

Container: `mb:24(login)/16(signup), mt:20, alignItems:center`

h1: fontFamily PixelifySans-Regular (font-pixel), fontSize:32, lineHeight:tight(~40), color:#edf4ef
- Login: "Welcome back"
- Register: "Create Account"
- Forgot: "Reset your password"

p subtitle: mx:auto, maxWidth:320, fontSize:13, lineHeight:20, color:#91a69d
- Login: "Your worlds are growing. Let's check in."
- Register: "A place for all your farms."
- Forgot: "Enter your email and we'll send you a link to reset your password."

---

## 6. FORM

### Login form: `gap:16 (space-y-4)`
Fields: Email, Password
Row: Remember me + Forgot password
Button: Sign In

### Register form: `gap:12 (space-y-3)`
Fields: Display name, Email, Password + strength, Confirm password
Checkbox: agree to Terms + Privacy Policy
Button: Create Account

---

## 7. INPUT FIELD ANATOMY

Per field:
- Label: `mb:8, fontSize:13, fontWeight:500 (DMSans-SemiBold), color:#edf4ef`
- Input wrapper: `position:relative`
- Input: `width:100%, minHeight:48, borderRadius:12, borderWidth:1, bg:#1c2b27, px:16, fontSize:14 (text-sm), color:#edf4ef, outline:none`
  - Default: `borderColor:#2a3c35`
  - Focus: `borderColor:#45d483, ring: 2px solid rgba(#45d483,0.15)` = `rgba(69,212,131,0.15)`
  - Error: `borderColor:#e96a6a`
  - Password fields: `pr:48` (space for eye button)

### Eye toggle button (password fields only)
- `position:absolute, right:4, top:0, width:48, height:48, alignItems:center, justifyContent:center`
- Color: #91a69d (muted-foreground)
- Icon: Lucide Eye (hidden) / EyeOff (visible), size:18, strokeWidth:2

### Error message
- `mt:6, flexDirection:row, alignItems:flex-start, gap:6, fontSize:12, lineHeight:20, color:#e96a6a`
- CircleAlert icon: size:13, mt:4 (mt-1 = 4px), shrink:0
- SVG paths for CircleAlert (lucide-circle-alert):
  - circle cx=12 cy=12 r=10
  - line x1=12 x2=12 y1=8 y2=12
  - line x1=12 x2=12.01 y1=16 y2=16

---

## 8. FIELD SPECS

### Display name (register only)
- id: auth-name, name: name
- type: text
- autoComplete: nickname
- autoCapitalize: words
- maxLength: 40
- placeholder: "Your Growtopia name"

### Email
- id: auth-email, name: email
- type: email
- autoComplete: email
- autoCapitalize: none
- maxLength: 254
- placeholder: "you@example.com"

### Password
- id: auth-password, name: password
- type: password (text when visible)
- autoComplete: current-password (login) / new-password (register)
- autoCapitalize: none
- maxLength: 254
- placeholder: "Enter your password"

### Confirm password (register only)
- id: auth-confirm, name: confirm
- type: password (text when visible)
- autoComplete: new-password
- autoCapitalize: none
- maxLength: 254
- placeholder: "Re-enter your password"

---

## 9. PASSWORD STRENGTH METER (register only)

id="password-strength", appears between Password and Confirm password fields, mt:-4 (no extra gap).

4 bars: `grid 4 cols, gap:6`
- Each bar: `height:4, borderRadius:4`
- Empty (score 0): bg #243631 (secondary)
- Filled (score 1-4): varies by score
  - score 1: #e96a6a (destruct)
  - score 2: #e6c16a (growing/warning)
  - score 3: #4ca8ff (accentBlue)
  - score 4: #45d483 (primary)

Score criteria (each = 1 point):
1. length >= 8
2. has lowercase AND uppercase
3. has digit
4. has symbol (non-alphanumeric)
Special: if length < 8, score = min(2, criteriaScore)

Hint text: `mt:6, fontSize:11, color:#91a69d`
Text: "8+ characters · mix letters, numbers, and symbols"

---

## 10. REMEMBER ME + FORGOT PASSWORD ROW (login only)

Container: `flexDirection:row, alignItems:center, justifyContent:space-between`

Remember me label: `minHeight:44, flexDirection:row, alignItems:center, gap:8, fontSize:12, color:#91a69d`
- Checkbox: size 16×16, accent-color:#45d483, default: checked=true

Forgot password link: `minHeight:44, alignItems:center, fontSize:12, fontWeight:600 (DMSans-SemiBold), color:#4ca8ff`
- Text: "Forgot password?"
- Navigates to /forgot-password

---

## 11. TERMS AGREEMENT CHECKBOX (register only)

Container: `minHeight:44, flexDirection:row, alignItems:center, gap:12`
- Checkbox: size 16×16, shrink:0, accent-color:#45d483, default: unchecked
- Text span: `fontSize:12, lineHeight:20, color:#91a69d`
  - "I agree to the " + button "Terms" + " and " + button "Privacy Policy" + "."
  - Button style: color:#4ca8ff, underline, underline-offset:2, decoration:#4ca8ff opacity 40%

---

## 12. PRIMARY BUTTON (Sign In / Create Account)

`flexDirection:row, minHeight:48, width:100%, alignItems:center, justifyContent:center, gap:8, borderRadius:10, bg:#45d483, px:16, fontSize:14, fontWeight:600 (DMSans-SemiBold), color:#0d1715`
- Active: scale 0.98
- Disabled (busy): opacity:0.6, cursor:wait
- Icon: Lucide ArrowRight, size:16, strokeWidth:2
  - Path 1: "M5 12h14"
  - Path 2: "m12 5 7 7-7 7"
- Loading state: button disabled, opacity:0.6, same text (no spinner in Make)

---

## 13. OR DIVIDER (login only)

`flexDirection:row, alignItems:center, gap:12, my:20`
- Line: flex:1, height:1, bg:#2a3c35
- Text: "OR", fontSize:10, letterSpacing:wider (tracking-wider ≈ 0.05em × 10px = 0.5px), color:#91a69d

---

## 14. GOOGLE BUTTON (login only)

`flexDirection:row, minHeight:48, width:100%, alignItems:center, justifyContent:center, gap:12, borderRadius:10, borderWidth:1, borderColor:#2a3c35, bg:#14211e (card), fontSize:14, fontWeight:500 (DMSans-Regular)`
- Active: scale 0.98
- Google G SVG icon: size 16×16, viewBox="0 0 24 24"
  - path fill #4285F4: "M22.56 12.25c0-.73-.06-1.42-.19-2.09H12v3.96h5.92c-.26 1.28-1.04 2.37-2.21 3.1v2.58h3.57c2.08-1.92 3.28-4.75 3.28-7.55Z"
  - path fill #34A853: "M12 23c2.97 0 5.46-.98 7.28-2.67l-3.57-2.58c-.98.66-2.24 1.06-3.71 1.06-2.87 0-5.3-1.94-6.17-4.55H2.14v2.65A11 11 0 0 0 12 23Z"
  - path fill #FBBC05: "M5.83 14.26A6.61 6.61 0 0 1 5.48 12c0-.78.13-1.53.35-2.26V7.09H2.14A11 11 0 0 0 1 12c0 1.77.42 3.44 1.14 4.91l3.69-2.65Z"
  - path fill #EA4335: "M12 5.19c1.62 0 3.07.56 4.21 1.66l3.15-3.15A10.56 10.56 0 0 0 12 1a11 11 0 0 0-9.86 6.09l3.69 2.65C6.7 7.13 9.13 5.19 12 5.19Z"
- Text: "Continue with Google"

Notice (shown after Google click attempt, login only):
- `mt:12, flexDirection:row, alignItems:flex-start, gap:8, fontSize:12, lineHeight:20, color:#91a69d`
- CircleAlert icon: size:15, mt:2, color:#4ca8ff (accentBlue)
- Text: set by Make (preview notice; in RN implementation: show info notice)

---

## 15. SWITCH LINK + GUEST BUTTON BLOCK

Container: `mt:16, alignItems:center`

Login:
- "Don't have an account? " + link "Create account" (primary, semibold)
- Guest button + Guest info

Register:
- "Already have an account? " + link "Sign in" (primary, semibold)
- Guest button + Guest info

Switch text p: `fontSize:12, color:#91a69d`
Switch link: `minHeight:44, alignItems:center, fontWeight:600 (DMSans-SemiBold), color:#45d483`
- Login → /signup: "Create account"
- Register → /login: "Sign in"

Guest button: `minHeight:44, flexDirection:row, alignItems:center, gap:8, fontSize:13, color:#91a69d`
- Text: "Continue as Guest"
- Icon: ArrowRight, size:14, strokeWidth:2

Guest info p: `fontSize:10, color:rgba(#91a69d, 0.8)`
- Text: "Up to 5 farms. No account needed."

---

## 16. DETAILS DISCLAIMER (bottom of all auth screens)

Container: `mt:24, borderTop:1 #2a3c35, pt:12, fontSize:11, lineHeight:20, color:#91a69d`
- summary: "Interactive preview · account services not connected"
- p: "Demo email: archell@growtrack.app\nPreview password: GrowTrack123!"
- p: "New accounts work for this prototype only..."

In RN: implement as a collapsible section using state toggle.

---

## 17. VALIDATION RULES

### Login submit validation
1. email empty → "Enter your email address."
2. email invalid format (regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`) → "Enter a valid email address."
3. password empty → "Enter your password."
4. email not in profiles → "No preview account found. Create an account or try the demo below." (email field)
5. password !== previewPassword → "Incorrect password. Use the preview password shown below." (password field)
6. no internet → form error "Unable to connect. Check your connection and try again."

### Register submit validation
1. name empty → "Enter your display name." (name field)
2. email empty → "Enter your email address."
3. email invalid → "Enter a valid email address."
4. password empty → "Enter your password."
5. password weak (length<8 OR score<3) → "Use 8+ characters with upper/lowercase letters and a number or symbol."
6. confirm empty → "Confirm your password."
7. confirm !== password → "Passwords don't match."
8. agreement unchecked → "Please agree to the terms and privacy notice." (agreement field)
9. email already registered in preview → "This email is already registered in the preview. Sign in instead." (email field)

### Forgot submit validation
1. email empty → "Enter your email address."
2. email invalid → "Enter a valid email address."

Validation timing: ON SUBMIT (not on-change, not on-blur).
Error clearing: on-change of the specific field, clears that field's error and form-level error.
First-error focus: after fail(), focus first errored field via requestAnimationFrame.

---

## 18. SUBMIT BEHAVIOR

Submit simulates async 550ms delay (`setTimeout(..., 550)`).
During 550ms: `busy=true`, button disabled+opacity:0.6, no spinner.

Login success: navigate("/farms", replace:true)
Register success: saves profile to localStorage key "growtrack-preview-profiles", navigate("/farms", replace:true)
  - If guest account exists (growtrack-guest-farms), migrates farms to member key.
Forgot success: shows "sent" confirmation in-place (no navigation).

Guest: `startSession({mode:"guest", name:"Guest"}, true)` → navigate("/farms")

---

## 19. SESSION / AUTH STORAGE

All localStorage/sessionStorage keys (Make's web API) → mapped to AsyncStorage in RN:

| Make key | RN AsyncStorage key | Description |
|---|---|---|
| `growtrack-account` (session+local) | `growtrack-account` | Current session {mode, name, email} |
| `growtrack-preview-profiles` (local) | `growtrack-preview-profiles` | Array of registered profiles |
| `growtrack-farms` (local) | existing `growtopia-farm-tracker` key (NOT TOUCHED) | Demo user farms |
| `growtrack-guest-farms` (local) | `growtrack-guest-farms` | Guest farms (for migration) |
| `growtrack-member-farms:<email>` (local) | `growtrack-member-farms:<email>` | Member farms |

RN implementation note:
- Session = AsyncStorage (not sessionStorage — RN has no sessionStorage)
- `remember=true` → same key, persists
- `remember=false` → store in memory only (useState), not AsyncStorage
- Password security: previewPassword = "GrowTrack123!" — this is the ONLY accepted password in Make's mock auth. Implement same mock: compare against hashed constant using expo-crypto SHA256.
- DO NOT touch existing `growtopia-farm-tracker` key.

Account object shape: `{ mode: "guest"|"member", name: string, email?: string }`

---

## 20. ASSETS USED BY AUTH

| Asset | Source | Size | Where |
|---|---|---|---|
| `pepper-seed.webp` | `assets/items/pepper-seed.webp` (already in repo) | 260 bytes | FarmVisual, size 28×28 |
| `pepper-item.webp` | `assets/items/pepper-item.webp` (already in repo) | 578 bytes | FarmVisual, size 36×36 |

No other images. The 6 figma/make/image/*.png files referenced in task description are NOT used by Auth.

---

## 21. ICONS USED BY AUTH (Lucide, svg paths)

All at strokeWidth:2 unless noted. Use react-native-svg. Scale pattern: `strokeWidth={2 / scale}` where `scale = size/24`.

### Sprout (already in SplashScreen.tsx)
Paths (3):
1. "M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3"
2. "M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4"
3. "M5 21h14"

### ArrowLeft
Paths (2):
1. "m12 19-7-7 7-7"
2. "M19 12H5"

### Eye
Paths (2):
1. "M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
2. circle cx=12 cy=12 r=3

### EyeOff (needed for visible state)
Paths (4):
1. "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
2. "M14.084 14.158a3 3 0 0 1-4.242-4.242"
3. "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
4. "m2 2 20 20"

### ArrowRight
Paths (2):
1. "M5 12h14"
2. "m12 5 7 7-7 7"

### CircleAlert
Elements (3):
1. circle cx=12 cy=12 r=10
2. line x1=12 x2=12 y1=8 y2=12
3. line x1=12 x2=12.01 y1=16 y2=16

---

## 22. FORGOT PASSWORD SCREEN

Same AuthScreen component with `page="forgot"`.
Header: back button + logo + spacer (same as register).
FarmVisual: compact (height:80).
Form: Email field only, no password.
Button: primary style, text "Send reset link" [UNRESOLVED: exact button text — check bundle].
After submit: shows "sent" panel:
- `div` 56×56, borderRadius:16, bg:rgba(#45d483,0.1), alignItems:center, justifyContent:center, color:#45d483
- Mail icon, size:26
- h2: PixelifySans, text-2xl (24px): "Check your inbox"
- p: fontSize:14, color:#91a69d: "Reset link requested for [email]."
- p: fontSize:12, color:#91a69d: "This is a preview confirmation. No email has been sent."
- Link "Back to sign in": primary-ish style
- Button "Use a different email": color:#4ca8ff

Bottom (forgot, not sent): shows ArrowLeft + "Back to sign in" link (text-accent color:#4ca8ff) instead of signup/guest block.

---

## 23. DEVIATIONS / NOTES

- Google auth: NOT implemented in Make (preview only). In RN: show same button, on press show notice text "Google sign-in is not available in the preview." Same as Make behavior.
- Terms/Privacy: PolicyDialog in Make shows content. In RN: show same modal with placeholder text (not in scope unless dashboard requests it).
- `tracking-wider` on "OR" = `0.05em × 10px = 0.5px` letterSpacing in RN.
- Border `border-border/70` on container (sm breakpoint): in RN web, apply `borderLeftWidth:1, borderRightWidth:1, borderColor: rgba(42,60,53,0.7)` at web only.
- `focus:ring-2 focus:ring-primary/15` = boxShadow/ring on web; in RN use borderColor change only (ring not natively supported on mobile).
- `active:scale-[.98]` on buttons = `Pressable` with `pressedStyle` or `Animated.spring` on press.
- `disabled:cursor-wait` = no cursor in RN native; on web set cursor style.

---

## 24. UNRESOLVED ITEMS

1. EyeOff SVG paths — need to extract from bundle or use standard Lucide EyeOff.
2. Forgot password button text — "Send reset link" or other wording.
3. Strength bar colors for scores 1-4 — visual inspection needed (extracted logic above).
4. Password strength bar fill color transitions — need to check if animated.
5. Policy/Terms dialog content — not in scope per spec.

Items 1 and 2 are non-blocking (EyeOff is standard Lucide, forgot button text extractable). None block Phase 1.
