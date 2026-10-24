import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  Mail,
  Sprout,
  X,
} from "lucide-react"

export type Account = { mode: "guest" | "member"; name: string; email?: string }
type PreviewProfile = { name: string; email: string }
const sessionKey = "growtrack-account"
const previewPassword = "GrowTrack123!"
const demoProfile = { name: "Archell", email: "archell@growtrack.app" }

export function readAccount(): Account | null {
  try {
    return JSON.parse(
      sessionStorage.getItem(sessionKey) ||
        localStorage.getItem(sessionKey) ||
        "null",
    )
  } catch {
    return null
  }
}
export function signOut() {
  sessionStorage.removeItem(sessionKey)
  localStorage.removeItem(sessionKey)
}
export function farmStorageKey(account: Account) {
  return account.mode === "guest"
    ? "growtrack-guest-farms"
    : account.email === demoProfile.email
      ? "growtrack-farms"
      : `growtrack-member-farms:${account.email}`
}
function startSession(account: Account, remember: boolean) {
  sessionStorage.setItem(sessionKey, JSON.stringify(account))
  if (remember) localStorage.setItem(sessionKey, JSON.stringify(account))
  else localStorage.removeItem(sessionKey)
}
function profiles(): PreviewProfile[] {
  try {
    return [
      demoProfile,
      ...JSON.parse(localStorage.getItem("growtrack-preview-profiles") || "[]"),
    ]
  } catch {
    return [demoProfile]
  }
}
export function GrowTrackLogo() {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Sprout size={21} />
      <span className="font-pixel text-[23px] font-semibold">
        GrowTrack<span className="text-accent">.</span>
      </span>
    </div>
  )
}
export function SplashScreen() {
  const navigate = useNavigate()
  useEffect(() => {
    const timer = setTimeout(
      () => navigate(readAccount() ? "/farms" : "/login", { replace: true }),
      1100,
    )
    return () => clearTimeout(timer)
  }, [navigate])
  return (
    <div className="mx-auto flex min-h-dvh max-w-[460px] items-center justify-center bg-background text-foreground sm:border-x sm:border-border/70">
      <div
        aria-label="GrowTrack"
        className="relative flex h-32 w-52 items-center justify-center"
      >
        <img
          src="/items/pepper-seed.webp"
          alt=""
          className="absolute size-6 object-contain [image-rendering:pixelated] motion-safe:animate-[splash-seed_1s_both] motion-reduce:hidden"
        />
        <Sprout
          size={28}
          className="absolute text-primary motion-safe:animate-[splash-sprout_1s_both] motion-reduce:hidden"
        />
        <Leaf
          size={38}
          className="absolute text-primary motion-safe:animate-[splash-plant_1s_both] motion-reduce:hidden"
        />
        <div className="motion-safe:animate-[splash-logo_1s_both]">
          <GrowTrackLogo />
        </div>
      </div>
    </div>
  )
}
function FarmVisual({ compact = false }: { compact?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={`relative mx-auto flex w-60 items-end justify-center ${
        compact ? "h-20" : "h-28"
      }`}
    >
      <div className="absolute bottom-6 flex w-48 items-end justify-around px-4">
        <img
          src="/items/pepper-seed.webp"
          alt=""
          className="mb-1 size-7 object-contain [image-rendering:pixelated]"
        />
        <Sprout size={35} strokeWidth={1.5} className="mb-1 text-primary/80" />
        <div className="flex flex-col items-center">
          <img
            src="/items/pepper-item.webp"
            alt=""
            className="size-9 object-contain [image-rendering:pixelated]"
          />
          <Sprout size={29} strokeWidth={1.5} className="-mt-1 text-primary" />
        </div>
      </div>
      <div className="absolute bottom-0 w-48 border-t-2 border-primary/60">
        <div className="grid grid-cols-12">
          {Array.from({ length: 24 }, (_, index) => (
            <span
              key={index}
              className={`h-3 ${
                index % 3 === 0
                  ? "bg-primary/15"
                  : index % 3 === 1
                    ? "bg-secondary"
                    : "bg-card"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
const inputClass =
  "w-full min-h-12 rounded-xl border bg-input px-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
const primary =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-4 text-sm font-semibold text-primary-foreground transition active:scale-[.98] disabled:cursor-wait disabled:opacity-60"

export function AuthScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const page =
    location.pathname === "/signup"
      ? "signup"
      : location.pathname === "/forgot-password"
        ? "forgot"
        : "login"
  const signup = page === "signup"
  const forgot = page === "forgot"
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [remember, setRemember] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [notice, setNotice] = useState("")
  const [policy, setPolicy] = useState("")
  const formRef = useRef<HTMLFormElement>(null)
  const requestRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    setValues({ name: "", email: "", password: "", confirm: "" })
    setErrors({})
    setNotice("")
    setSent(false)
    setBusy(false)
    setAgreed(false)
    setShowPassword(false)
    setShowConfirm(false)
    return () => {
      if (requestRef.current) clearTimeout(requestRef.current)
    }
  }, [page])
  const criteriaScore = [
    values.password.length >= 8,
    /[a-z]/.test(values.password) && /[A-Z]/.test(values.password),
    /\d/.test(values.password),
    /[^a-zA-Z0-9]/.test(values.password),
  ].filter(Boolean).length
  const score = values.password.length < 8 ? Math.min(2, criteriaScore) : criteriaScore
  const change = (key: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: "", form: "" }))
    setNotice("")
  }
  const fail = (next: Record<string, string>) => {
    setErrors(next)
    const first = Object.keys(next)[0]
    requestAnimationFrame(() =>
      formRef.current
        ?.querySelector<HTMLInputElement>(`[name="${first}"]`)
        ?.focus(),
    )
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    const email = values.email.trim().toLowerCase()
    if (signup && !values.name.trim()) next.name = "Enter your display name."
    if (!email) next.email = "Enter your email address."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address."
    if (!forgot && !values.password) next.password = "Enter your password."
    if (signup) {
      if (values.password && (values.password.length < 8 || score < 3))
        next.password =
          "Use 8+ characters with upper/lowercase letters and a number or symbol."
      if (!values.confirm) next.confirm = "Confirm your password."
      else if (values.confirm !== values.password)
        next.confirm = "Passwords don't match."
      if (!agreed)
        next.agreement = "Please agree to the terms and privacy notice."
      if (!next.email && profiles().some((profile) => profile.email === email))
        next.email =
          "This email is already registered in the preview. Sign in instead."
    }
    if (Object.keys(next).length) {
      fail(next)
      return
    }
    if (!navigator.onLine) {
      fail({ form: "Unable to connect. Check your connection and try again." })
      return
    }
    setBusy(true)
    setErrors({})
    requestRef.current = setTimeout(() => {
      setBusy(false)
      if (!navigator.onLine) {
        fail({ form: "Connection interrupted. Please try again." })
        return
      }
      if (forgot) {
        setSent(true)
        return
      }
      if (!signup) {
        const profile = profiles().find((item) => item.email === email)
        if (!profile) {
          fail({
            email:
              "No preview account found. Create an account or try the demo below.",
          })
          return
        }
        if (values.password !== previewPassword) {
          fail({
            password:
              "Incorrect password. Use the preview password shown below.",
          })
          return
        }
        startSession({ mode: "member", name: profile.name, email }, remember)
      } else {
        const profile = { name: values.name.trim(), email }
        localStorage.setItem(
          "growtrack-preview-profiles",
          JSON.stringify([
            ...profiles().filter((item) => item.email !== demoProfile.email),
            profile,
          ]),
        )
        if (readAccount()?.mode === "guest") {
          const guestFarms = localStorage.getItem("growtrack-guest-farms")
          if (guestFarms)
            localStorage.setItem(
              farmStorageKey({ mode: "member", ...profile }),
              guestFarms,
            )
        }
        startSession({ mode: "member", ...profile }, true)
      }
      navigate("/farms", { replace: true })
    }, 550)
  }
  const guest = () => {
    startSession({ mode: "guest", name: "Guest" }, true)
    navigate("/farms", { replace: true })
  }
  const authField = (
    key: "name" | "email" | "password" | "confirm",
    label: string,
  ) => {
    const password = key === "password" || key === "confirm"
    const visible = key === "confirm" ? showConfirm : showPassword
    return (
      <div>
        <label
          htmlFor={`auth-${key}`}
          className="mb-2 block text-[13px] font-medium"
        >
          {label}
        </label>
        <div className="relative">
          <input
            id={`auth-${key}`}
            name={key}
            type={
              password
                ? visible
                  ? "text"
                  : "password"
                : key === "email"
                  ? "email"
                  : "text"
            }
            autoComplete={
              key === "name"
                ? "nickname"
                : key === "email"
                  ? "email"
                  : signup
                    ? "new-password"
                    : "current-password"
            }
            autoCapitalize={password || key === "email" ? "none" : "words"}
            spellCheck={false}
            maxLength={key === "name" ? 40 : 254}
            value={values[key]}
            onChange={(event) => change(key, event.target.value)}
            aria-invalid={Boolean(errors[key])}
            aria-describedby={
              errors[key]
                ? `${key}-error`
                : key === "password" && signup
                  ? "password-strength"
                  : undefined
            }
            placeholder={
              key === "name"
                ? "Your Growtopia name"
                : key === "email"
                  ? "you@example.com"
                  : key === "confirm"
                    ? "Re-enter your password"
                    : "Enter your password"
            }
            className={`${inputClass} ${password ? "pr-12" : ""} ${
              errors[key] ? "border-destructive" : "border-border"
            }`}
          />
          {password && (
            <button
              type="button"
              aria-label={`${visible ? "Hide" : "Show"} ${
                key === "confirm" ? "confirm password" : "password"
              }`}
              aria-pressed={visible}
              onClick={() =>
                key === "confirm"
                  ? setShowConfirm(!visible)
                  : setShowPassword(!visible)
              }
              className="absolute right-1 top-0 flex size-12 items-center justify-center text-muted-foreground"
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
        </div>
        {errors[key] && (
          <p
            id={`${key}-error`}
            role="alert"
            className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-destructive"
          >
            <AlertCircle size={13} className="mt-1 shrink-0" />
            {errors[key]}
          </p>
        )}
      </div>
    )
  }
  return (
    <div className="mx-auto min-h-dvh max-w-[460px] bg-background text-foreground sm:border-x sm:border-border/70">
      <main
        key={page}
        className="px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))] motion-safe:animate-[enter_.2s_ease-out]"
      >
        <header
          className={`flex items-center ${
            page === "login" ? "justify-center" : "justify-between"
          }`}
        >
          {page !== "login" && (
            <Link
              to="/login"
              aria-label="Back to sign in"
              className="flex size-11 items-center justify-center rounded-xl border border-border text-muted-foreground"
            >
              <ArrowLeft size={18} />
            </Link>
          )}
          <GrowTrackLogo />
          {page !== "login" && <span className="size-11" />}
        </header>
        <FarmVisual compact={signup || forgot} />
        <div className={`${signup ? "mb-4" : "mb-6"} mt-5 text-center`}>
          <h1 className="font-pixel text-[32px] leading-tight">
            {forgot
              ? "Reset your password"
              : signup
                ? "Create Account"
                : "Welcome back"}
          </h1>
          <p className="mx-auto mt-2 max-w-80 text-[13px] leading-5 text-muted-foreground">
            {forgot
              ? "Enter your email and we'll send you a link to reset your password."
              : signup
                ? "A place for all your farms."
                : "Your worlds are growing. Let's check in."}
          </p>
        </div>
        {sent ? (
          <div role="status" className="py-5 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Mail size={26} />
            </div>
            <h2 className="font-pixel text-2xl">Check your inbox</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Reset link requested for{" "}
              <span className="font-medium text-foreground">
                {values.email.trim()}
              </span>
              .
            </p>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              This is a preview confirmation. No email has been sent.
            </p>
            <Link to="/login" className={`${primary} mt-6`}>
              Back to sign in
            </Link>
            <button
              onClick={() => {
                setSent(false)
                setNotice("")
              }}
              className="mt-2 min-h-11 text-xs text-accent"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <form
              ref={formRef}
              noValidate
              onSubmit={submit}
              className={signup ? "space-y-3" : "space-y-4"}
            >
              {signup && authField("name", "Display name")}
              {authField("email", "Email")}
              {!forgot && authField("password", "Password")}
              {signup && (
                <>
                  <div id="password-strength" className="-mt-1">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((value) => (
                        <span
                          key={value}
                          className={`h-1 rounded ${
                            score >= value
                              ? score < 3
                                ? "bg-[#F2C94C]"
                                : "bg-primary"
                              : "bg-secondary"
                          }`}
                        />
                      ))}
                    </div>
                    <p
                      className={`mt-1.5 text-[11px] ${
                        values.password && score < 3
                          ? "text-[#F2C94C]"
                          : "text-muted-foreground"
                      }`}
                    >
                      {!values.password
                        ? "8+ characters · mix letters, numbers, and symbols"
                        : score < 3
                          ? "Weak — add more variety"
                          : score === 3
                            ? "Good — your password is getting stronger"
                            : "Strong password"}
                    </p>
                  </div>
                  {authField("confirm", "Confirm password")}
                  <div>
                    <label className="flex min-h-11 items-center gap-3 text-xs leading-5 text-muted-foreground">
                      <input
                        name="agreement"
                        type="checkbox"
                        checked={agreed}
                        onChange={(event) => {
                          setAgreed(event.target.checked)
                          setErrors((current) => ({
                            ...current,
                            agreement: "",
                          }))
                        }}
                        aria-invalid={Boolean(errors.agreement)}
                        aria-describedby={
                          errors.agreement ? "agreement-error" : undefined
                        }
                        className="size-4 shrink-0 accent-primary"
                      />
                      <span>
                        I agree to the{" "}
                        <button
                          type="button"
                          onClick={() => setPolicy("Terms")}
                          className="text-accent underline decoration-accent/40 underline-offset-2"
                        >
                          Terms
                        </button>{" "}
                        and{" "}
                        <button
                          type="button"
                          onClick={() => setPolicy("Privacy")}
                          className="text-accent underline decoration-accent/40 underline-offset-2"
                        >
                          Privacy Policy
                        </button>
                        .
                      </span>
                    </label>
                    {errors.agreement && (
                      <p
                        id="agreement-error"
                        role="alert"
                        className="text-xs text-destructive"
                      >
                        {errors.agreement}
                      </p>
                    )}
                  </div>
                </>
              )}
              {!signup && !forgot && (
                <div className="flex items-center justify-between">
                  <label className="flex min-h-11 items-center gap-2 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="size-4 accent-primary"
                    />
                    Remember me
                  </label>
                  <Link
                    to="/forgot-password"
                    className="flex min-h-11 items-center text-xs font-medium text-accent"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
              {errors.form && (
                <p
                  role="alert"
                  className="flex items-start gap-2 text-xs leading-5 text-destructive"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {errors.form}
                </p>
              )}
              <button disabled={busy} className={primary}>
                {busy
                  ? forgot
                    ? "Requesting link…"
                    : signup
                      ? "Creating account…"
                      : "Signing in…"
                  : forgot
                    ? "Send reset link"
                    : signup
                      ? "Create Account"
                      : "Sign In"}
                {!busy && !forgot && <ArrowRight size={16} />}
              </button>
            </form>
            {!signup && !forgot && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[10px] tracking-wider text-muted-foreground">
                    OR
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <button
                  onClick={() =>
                    setNotice(
                      "Google sign-in is coming soon. For this preview, use email sign-in or continue as Guest.",
                    )
                  }
                  className="flex min-h-12 w-full items-center justify-center gap-3 rounded-[10px] border border-border bg-card text-sm font-medium transition active:scale-[.98]"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-4"
                  >
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.73-.06-1.42-.19-2.09H12v3.96h5.92c-.26 1.28-1.04 2.37-2.21 3.1v2.58h3.57c2.08-1.92 3.28-4.75 3.28-7.55Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.67l-3.57-2.58c-.98.66-2.24 1.06-3.71 1.06-2.87 0-5.3-1.94-6.17-4.55H2.14v2.65A11 11 0 0 0 12 23Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.83 14.26A6.61 6.61 0 0 1 5.48 12c0-.78.13-1.53.35-2.26V7.09H2.14A11 11 0 0 0 1 12c0 1.77.42 3.44 1.14 4.91l3.69-2.65Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.19c1.62 0 3.07.56 4.21 1.66l3.15-3.15A10.56 10.56 0 0 0 12 1a11 11 0 0 0-9.86 6.09l3.69 2.65C6.7 7.13 9.13 5.19 12 5.19Z"
                    />
                  </svg>
                  Continue with Google
                </button>
                {notice && (
                  <p
                    role="status"
                    className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground"
                  >
                    <AlertCircle
                      size={15}
                      className="mt-0.5 shrink-0 text-accent"
                    />
                    {notice}
                  </p>
                )}
              </>
            )}
            <div className="mt-4 text-center">
              {forgot ? (
                <Link
                  to="/login"
                  className="inline-flex min-h-11 items-center gap-2 text-sm text-accent"
                >
                  <ArrowLeft size={15} />
                  Back to sign in
                </Link>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {signup
                      ? "Already have an account?"
                      : "Don't have an account?"}{" "}
                    <Link
                      to={signup ? "/login" : "/signup"}
                      className="inline-flex min-h-11 items-center font-semibold text-primary"
                    >
                      {signup ? "Sign in" : "Create account"}
                    </Link>
                  </p>
                  <button
                    onClick={guest}
                    className="inline-flex min-h-11 items-center gap-2 text-[13px] text-muted-foreground"
                  >
                    Continue as Guest
                    <ArrowRight size={14} />
                  </button>
                  <p className="text-[10px] text-muted-foreground/80">
                    Up to 5 farms. No account needed.
                  </p>
                </>
              )}
            </div>
          </>
        )}
        <details className="mt-6 border-t border-border pt-3 text-[11px] leading-5 text-muted-foreground">
          <summary className="cursor-pointer">
            Interactive preview · account services not connected
          </summary>
          <p className="mt-2">
            Demo email:{" "}
            <span className="text-foreground">archell@growtrack.app</span>
            <br />
            Preview password:{" "}
            <span className="text-foreground">{previewPassword}</span>
          </p>
          <p className="mt-2">
            New accounts work for this prototype only. All preview accounts use
            the password above for returning sign-in. Passwords entered here are
            not stored. Cloud sync and email delivery are not connected.
          </p>
        </details>
      </main>
      {policy && <PolicyDialog title={policy} onClose={() => setPolicy("")} />}
    </div>
  )
}
function PolicyDialog({
  title,
  onClose,
}: {
  title: string
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key === "Tab") {
        event.preventDefault()
        closeRef.current?.focus()
      }
    }
    document.addEventListener("keydown", key)
    return () => {
      document.removeEventListener("keydown", key)
      previous?.focus()
    }
  }, [onClose])
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5 backdrop-blur-[3px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-title"
        className="w-full max-w-[360px] rounded-2xl border border-border bg-background p-5"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="policy-title" className="font-pixel text-2xl">
            {title} · Preview
          </h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close policy"
            className="flex size-11 items-center justify-center text-muted-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          This is an interactive design prototype, not a live account service.
          Farm data, preferences, and preview account names are saved in this
          browser. Passwords are not stored or sent. Final terms and privacy
          policies will be available before account services launch.
        </p>
      </div>
    </div>
  )
}
