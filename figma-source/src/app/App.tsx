import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router"
import {
  AuthScreen,
  SplashScreen,
  GrowTrackLogo,
  readAccount,
  farmStorageKey,
  signOut,
} from "./Auth"
import {
  FarmControls,
  GridFarmCard,
  FarmResultsEmpty,
  visibleFarms,
  farmStatus,
  farmProgress,
  type FarmFilter,
  type FarmSort,
  type FarmView,
} from "./FarmDashboard"
import {
  Sprout,
  Leaf,
  Settings,
  Plus,
  Star,
  Bell,
  BellRing,
  ArrowUpRight,
  ArrowLeft,
  ChevronRight,
  Check,
  Clock3,
  Search,
  X,
  RotateCcw,
  Repeat2,
  Trash2,
  Sun,
  Moon,
  Monitor,
  Info,
  ShieldCheck,
  CircleHelp,
  LogIn,
  MoreHorizontal,
  CheckCheck,
} from "lucide-react"

export type Seed = { id: string; name: string; duration: number; repeat: boolean }
export type Farm = {
  id: string
  world: string
  seed: string
  duration: number
  start: number
  favorite: boolean
  notify: boolean
  harvested: boolean
  createdAt?: number
  updatedAt?: number
}
type Prefs = {
  theme: string
  notifications: boolean
  time: string
  behavior: string
}
const defaults: Seed[] = [
  { id: "pepper", name: "Pepper Tree", duration: 188400, repeat: true },
  { id: "laser", name: "Laser Grid", duration: 313920, repeat: true },
  { id: "chandelier", name: "Chandelier", duration: 653760, repeat: true },
  { id: "fish", name: "Fish Tank", duration: 83160, repeat: true },
  { id: "sugar", name: "Sugar Cane", duration: 14400, repeat: false },
  { id: "pinball", name: "Pinball Bumper", duration: 86400, repeat: true },
]
const initial = [
  "ARCHELLGT",
  "PEPPERSTASH",
  "LASERFIELD",
  "CHANDWORLD",
  "FISHTANKS",
  "SUGARRUSH",
  "PINBALLGT",
].map((world, index): Farm => {
  const seed = defaults[Math.max(0, index - 1)]
  return {
    id: String(index),
    world,
    seed: seed.id,
    duration: seed.duration,
    start:
      Date.now() -
      seed.duration *
        1000 *
        (index < 2 ? 1.1 : [0.72, 0.38, 0.86, 0.54, 0.21][index - 2]),
    favorite: index === 0 || index === 2,
    notify: true,
    harvested: false,
  }
})
function stored<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback
  } catch {
    return fallback
  }
}
function duration(seconds: number) {
  const minutes = Math.max(0, Math.ceil(seconds / 60))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  return `${
    days ? `${days}d ` : ""
  }${String(hours).padStart(2, "0")}h ${String(minutes % 60).padStart(2, "0")}m`
}
const button =
  "min-h-11 rounded-[10px] px-4 text-sm font-semibold transition active:scale-[.97] disabled:opacity-40"
const primary = `${button} bg-primary text-primary-foreground`
const secondary = `${button} bg-secondary text-foreground`
const field =
  "w-full min-h-12 rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
function Thumb({ id, large = false }: { id: string; large?: boolean }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted ${
        large ? "size-16" : "size-12"
      }`}
    >
      <img
        src={`/items/${
          defaults.some((seed) => seed.id === id) ? id : "pepper"
        }-item.webp`}
        alt={`${defaults.find((seed) => seed.id === id)?.name || "Custom seed"} item`}
        className={`${
          large ? "size-10" : "size-8"
        } object-contain [image-rendering:pixelated]`}
      />
    </div>
  )
}
function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={onChange}
      className="flex min-h-11 min-w-12 items-center"
    >
      <span
        className={`flex h-6 w-11 items-center rounded-full px-1 transition-colors ${
          value ? "bg-primary" : "bg-secondary"
        }`}
      >
        <span
          className={`size-4 rounded-full bg-white transition-transform ${
            value ? "translate-x-5" : ""
          }`}
        />
      </span>
    </button>
  )
}
function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [account] = useState(() => readAccount()!)
  const guest = account.mode === "guest"
  const farmsKey = farmStorageKey(account)
  const tab = location.pathname.split("/")[1] || "farms"
  const [farms, setFarms] = useState<Farm[]>(() =>
    stored<Farm[]>(
      farmsKey,
      guest || account.email !== "archell@growtrack.app" ? [] : initial,
    ).map((farm) => ({
      ...farm,
      createdAt: farm.createdAt ?? farm.start,
      updatedAt: farm.updatedAt ?? farm.start,
    })),
  )
  const [seeds, setSeeds] = useState<Seed[]>(() =>
    stored("growtrack-seeds", defaults),
  )
  const [prefs, setPrefs] = useState<Prefs>(() =>
    stored("growtrack-prefs", {
      theme: "dark",
      notifications: true,
      time: "24",
      behavior: "seed",
    }),
  )
  const [now, setNow] = useState(Date.now())
  const [toast, setToast] = useState("")
  const [overlay, setOverlay] = useState("")
  const [overlayClosing, setOverlayClosing] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const detailsFlow = useRef(false)
  const close = useCallback(() => {
    if (closeTimer.current) return
    const dismiss = () => {
      setOverlay("")
      setOverlayClosing(false)
      detailsFlow.current = false
      closeTimer.current = null
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      dismiss()
      return
    }
    setOverlayClosing(true)
    closeTimer.current = setTimeout(dismiss, 160)
  }, [])
  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    },
    [],
  )
  const [active, setActive] = useState<Farm | null>(null)
  const [activeSeed, setActiveSeed] = useState<Seed | null>(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")
  const [farmFilter, setFarmFilter] = useState<FarmFilter>("All")
  const [farmQuery, setFarmQuery] = useState("")
  const [farmSort, setFarmSort] = useState<FarmSort>("Recommended")
  const [farmView, setFarmView] = useState<FarmView>(() =>
    stored<string>("growtrack-farm-view", "list") === "grid" ? "grid" : "list",
  )
  const [onboard, setOnboard] = useState(0)
  useEffect(() => {
    if (overlay && overlay !== "details") return
    setNow(Date.now())
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [overlay])
  useEffect(() => {
    localStorage.setItem("growtrack-farm-view", JSON.stringify(farmView))
  }, [farmView])
  useEffect(() => {
    if (!overlay) return
    const previousFocus = document.activeElement as HTMLElement | null
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')
    const controls = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select, [tabindex="0"]',
        ) || [],
      )
    controls()[0]?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
      if (event.key === "Tab") {
        const elements = controls()
        const first = elements[0]
        const last = elements[elements.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    document.addEventListener("keydown", handleKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [overlay, close])
  useEffect(() => {
    localStorage.setItem(farmsKey, JSON.stringify(farms))
  }, [farms, farmsKey])
  useEffect(() => {
    localStorage.setItem("growtrack-seeds", JSON.stringify(seeds))
  }, [seeds])
  useEffect(() => {
    localStorage.setItem("growtrack-prefs", JSON.stringify(prefs))
  }, [prefs])
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])
  const state = (farm: Farm) => farmStatus(farm, now)
  const matchingFarms = visibleFarms(
    farms,
    seeds,
    farmFilter,
    farmQuery,
    farmSort,
    now,
  )
  const selectedFarm = farms.find((farm) => farm.id === active?.id) || active
  const ready = farms.filter((farm) => state(farm) === "Ready")
  const growing = farms.filter((farm) => state(farm) === "Growing")
  const harvestDate = (timestamp: number) =>
    new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: prefs.time === "12",
    })
  const updateFarm = (id: string, patch: Partial<Farm>) =>
    setFarms((current) =>
      current.map((farm) =>
        farm.id === id ? { ...farm, ...patch, updatedAt: Date.now() } : farm,
      ),
    )
  const openFarm = (kind: string, farm: Farm | null = null) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
    setOverlayClosing(false)
    if (kind === "details") detailsFlow.current = true
    else if (
      overlay !== "details" &&
      !["edit", "swap", "replant", "reset-timer"].includes(overlay)
    )
      detailsFlow.current = false
    setToast("")
    setActive(farm)
    setOverlay(
      kind === "add" && guest && farms.length >= 5 ? "guest-limit" : kind,
    )
  }
  const finish = (message: string) => {
    if (
      detailsFlow.current &&
      active &&
      ["edit", "swap", "replant", "reset-timer"].includes(overlay)
    )
      setOverlay("details")
    else close()
    setToast(message)
  }
  const [notified, setNotified] = useState<string[]>([])
  useEffect(() => {
    const justReady = farms.filter(
      (farm) =>
        !farm.harvested &&
        farm.notify &&
        farm.start + farm.duration * 1000 <= now &&
        !notified.includes(farm.id),
    )
    if (justReady.length) {
      setNotified((current) => [
        ...current,
        ...justReady.map((farm) => farm.id),
      ])
      if (
        prefs.notifications &&
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      )
        justReady.forEach(
          (farm) =>
            new Notification("Ready to harvest", {
              body: `${farm.world} is ready. Your next harvest is waiting!`,
            }),
        )
    }
  }, [now, farms, prefs.notifications, notified])
  const notifyPermission = async () => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    )
      await Notification.requestPermission()
  }
  function renderFarmCard(farm: Farm) {
    const status = state(farm)
    const seed = seeds.find((item) => item.id === farm.seed)
    const percent = Math.min(
      100,
      Math.max(0, ((now - farm.start) / (farm.duration * 1000)) * 100),
    )
    return (
      <article
        key={farm.id}
        className={`relative rounded-2xl border p-4 ${
          status === "Ready"
            ? "border-primary/30 bg-[#142b20] [.light_&]:bg-[#eaf6e9]"
            : "border-border/70 bg-card"
        }`}
      >
        <button
          aria-label={`${farm.world}, ${status}. Open farm details`}
          onClick={() => openFarm("details", farm)}
          className="absolute inset-0 rounded-2xl"
        />
        <div className="pointer-events-none relative">
          <div className="flex items-center gap-3">
            <Thumb id={farm.seed} />
            <button
              onClick={() => openFarm("details", farm)}
              className="pointer-events-auto min-h-11 flex-1 text-left"
            >
              <h3 className="text-[15px] font-bold tracking-[.035em]">
                {farm.world}
              </h3>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {seed?.name || "Unknown seed"}
              </p>
            </button>
            <button
              aria-label={farm.favorite ? "Unpin farm" : "Pin farm"}
              onClick={() => updateFarm(farm.id, { favorite: !farm.favorite })}
              className="pointer-events-auto flex size-11 items-center justify-center transition active:scale-125"
            >
              <Star
                size={18}
                className={
                  farm.favorite
                    ? "fill-[#F2C94C] text-[#F2C94C]"
                    : "text-muted-foreground/70"
                }
              />
            </button>
          </div>
          {status === "Growing" ? (
            <>
              <div className="mt-4 flex justify-between text-[11px] font-semibold tracking-[.08em]">
                <span className="flex items-center gap-1.5 text-[#e6c16a]">
                  <span className="size-1.5 rounded-full bg-[#e6c16a]" />
                  GROWING
                </span>
                <span className="text-muted-foreground">
                  {Math.floor(percent)}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={Math.floor(percent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Grow progress"
                className="mt-2 flex h-1.5 overflow-hidden rounded bg-secondary"
              >
                <div
                  className="h-full rounded bg-primary transition-all duration-1000"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[20px] font-semibold tabular-nums">
                  {duration((farm.start + farm.duration * 1000 - now) / 1000)}{" "}
                  <span className="text-[11px] font-normal text-muted-foreground">
                    left
                  </span>
                </p>
                <Bell
                  size={14}
                  className={
                    farm.notify ? "text-accent" : "text-muted-foreground"
                  }
                />
              </div>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">
                  Harvest · {harvestDate(farm.start + farm.duration * 1000)}
                </p>
                <button
                  aria-label={`More actions for ${farm.world}`}
                  onClick={() => openFarm("details", farm)}
                  className="pointer-events-auto -mr-2 flex h-8 w-10 items-center justify-center text-muted-foreground"
                >
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-3">
              <div>
                <div
                  className={`flex items-center gap-1.5 text-[11px] font-bold tracking-[.08em] ${
                    status === "Ready"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {status === "Ready" ? (
                    <CheckCheck size={14} />
                  ) : (
                    <Check size={14} />
                  )}{" "}
                  {status.toUpperCase()}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {status === "Ready"
                    ? "Your next harvest is waiting."
                    : "Ready to plant again"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {status === "Ready" && (
                  <button
                    aria-label={`Swap ${farm.world}`}
                    onClick={() => openFarm("swap", farm)}
                    className="pointer-events-auto flex size-11 items-center justify-center text-muted-foreground"
                  >
                    <Repeat2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (status === "Ready") {
                      updateFarm(farm.id, { harvested: true })
                      setToast(`${farm.world} harvested. Nice work!`)
                    } else openFarm("replant", farm)
                  }}
                  className={`pointer-events-auto ${
                    status === "Ready" ? primary : secondary
                  } !min-h-10 !px-3 !text-xs`}
                >
                  {status === "Ready" ? "Harvest" : "Replant"}
                </button>
              </div>
            </div>
          )}
        </div>
      </article>
    )
  }
  function FarmForm() {
    const existing = active
    const [world, setWorld] = useState(existing?.world || "")
    const [seed, setSeed] = useState(existing?.seed || seeds[0]?.id || "")
    const [seconds, setSeconds] = useState(
      existing?.duration ||
        (prefs.behavior === "manual" ? 3600 : seeds[0]?.duration || 3600),
    )
    const [notify, setNotify] = useState(
      existing?.notify ?? prefs.notifications,
    )
    const isEdit = overlay === "edit"
    const action = isEdit
      ? "Save Changes"
      : overlay === "swap"
        ? "Swap"
        : overlay === "replant"
          ? "Replant"
          : "Add Farm"
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (!seed || seconds <= 0) return
          if (!existing && guest && farms.length >= 5) {
            setOverlay("guest-limit")
            return
          }
          const timerChanged =
            !isEdit || seed !== existing?.seed || seconds !== existing?.duration
          const patch = {
            world: world.trim().toUpperCase(),
            seed,
            duration: seconds,
            notify,
            ...(timerChanged ? { start: Date.now(), harvested: false } : {}),
          }
          if (existing) {
            updateFarm(existing.id, patch)
            if (timerChanged)
              setNotified((current) =>
                current.filter((id) => id !== existing.id),
              )
          } else
            setFarms((current) => [
              ...current,
              {
                ...patch,
                id: crypto.randomUUID(),
                start: Date.now(),
                harvested: false,
                favorite: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              },
            ])
          if (notify) void notifyPermission()
          finish(existing ? `${world} updated` : `${world} added. Let it grow!`)
        }}
        className="space-y-5"
      >
        {overlay === "swap" && existing && (
          <div className="rounded-xl bg-muted p-3 text-sm">
            <p className="text-muted-foreground">
              Current · {seeds.find((item) => item.id === existing.seed)?.name}
            </p>
            <p className="mt-1 font-semibold">
              {state(existing) === "Ready"
                ? "Ready to harvest"
                : `${duration((existing.start + existing.duration * 1000 - now) / 1000)} remaining`}
            </p>
          </div>
        )}
        <label className="block space-y-2 text-sm font-medium">
          World name
          <input
            autoFocus
            required
            maxLength={24}
            pattern="[a-zA-Z0-9]+"
            title="Use letters and numbers, without spaces"
            value={world}
            onChange={(event) => setWorld(event.target.value.toUpperCase())}
            placeholder="e.g. ARCHELLGT"
            className={`${field} font-semibold tracking-wider`}
          />
        </label>
        <SeedSelect
          value={seed}
          onChange={(id) => {
            setSeed(id)
            if (prefs.behavior === "seed")
              setSeconds(seeds.find((item) => item.id === id)?.duration || 3600)
          }}
        />
        <Duration value={seconds} onChange={setSeconds} />
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Harvest notification</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Get notified when this farm is ready.
            </p>
          </div>
          <Toggle
            label="Harvest notification"
            value={notify}
            onChange={() => setNotify(!notify)}
          />
        </div>
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[.12em] text-accent">
            <Clock3 size={14} />
            ESTIMATED HARVEST
          </p>
          <p className="mt-2 text-sm font-semibold">
            {harvestDate(
              isEdit &&
                seconds === existing?.duration &&
                seed === existing?.seed
                ? existing.start + seconds * 1000
                : now + seconds * 1000,
            )}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {seeds.find((item) => item.id === seed)?.name} · {duration(seconds)}
          </p>
        </div>
        <button
          disabled={!world.trim() || !seed || seconds <= 0}
          className={`${primary} w-full`}
        >
          {action}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={() => setOverlay("delete")}
            className={`${button} w-full border-t border-border text-destructive`}
          >
            Delete Farm
          </button>
        )}
      </form>
    )
  }
  function Duration({
    value,
    onChange,
  }: {
    value: number
    onChange: (value: number) => void
  }) {
    const values = [
      Math.floor(value / 86400),
      Math.floor((value % 86400) / 3600),
      Math.floor((value % 3600) / 60),
    ]
    return (
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Grow duration</legend>
        <div className="grid grid-cols-3 gap-3">
          {["Days", "Hours", "Minutes"].map((label, index) => (
            <label key={label}>
              <input
                aria-label={label}
                type="number"
                min="0"
                max={index === 0 ? 365 : index === 1 ? 23 : 59}
                required
                value={values[index]}
                onChange={(event) => {
                  const next = [...values]
                  next[index] = Math.max(0, Number(event.target.value))
                  onChange(next[0] * 86400 + next[1] * 3600 + next[2] * 60)
                }}
                className={`${field} text-center !text-xl tabular-nums`}
              />
              <span className="mt-2 block text-center text-xs text-muted-foreground">
                {label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    )
  }
  function SeedSelect({
    value,
    onChange,
  }: {
    value: string
    onChange: (id: string) => void
  }) {
    const [query, setQuery] = useState("")
    return (
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Seed</legend>
        <div className="relative mb-2">
          <Search
            size={15}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <input
            aria-label="Search seed selector"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a seed"
            className={`${field} !min-h-10 !pl-9`}
          />
        </div>
        <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
          {seeds
            .filter((item) =>
              item.name.toLowerCase().includes(query.toLowerCase()),
            )
            .map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => onChange(item.id)}
                className={`flex min-h-14 items-center gap-2 rounded-xl border p-2 text-left text-xs ${
                  value === item.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                }`}
              >
                <img
                  alt=""
                  src={`/items/${
                    defaults.some((seed) => seed.id === item.id)
                      ? item.id
                      : "pepper"
                  }-seed.webp`}
                  className="size-6 object-contain [image-rendering:pixelated]"
                />
                <span className="flex-1">{item.name}</span>
                {value === item.id && (
                  <Check size={13} className="text-primary" />
                )}
              </button>
            ))}
        </div>
      </fieldset>
    )
  }
  function SeedForm() {
    const [name, setName] = useState(activeSeed?.name || "")
    const [seconds, setSeconds] = useState(activeSeed?.duration || 3600)
    const [repeat, setRepeat] = useState(activeSeed?.repeat ?? true)
    return (
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault()
          const item = {
            id: activeSeed?.id || crypto.randomUUID(),
            name: name.trim(),
            duration: seconds,
            repeat,
          }
          setSeeds((current) =>
            activeSeed
              ? current.map((seed) => (seed.id === item.id ? item : seed))
              : [...current, item],
          )
          finish("Seed saved to your library")
        }}
      >
        <label className="block space-y-2 text-sm">
          Seed name
          <input
            autoFocus
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Seed name"
            className={field}
          />
        </label>
        <Duration value={seconds} onChange={setSeconds} />
        <fieldset>
          <legend className="mb-2 text-sm">Harvest behavior</legend>
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((value) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setRepeat(value)}
                className={`${secondary} border ${
                  repeat === value
                    ? "border-primary text-primary"
                    : "border-border"
                }`}
              >
                {value ? "Re-harvestable" : "One-time"}
              </button>
            ))}
          </div>
        </fieldset>
        <button
          disabled={!name.trim() || seconds <= 0}
          className={`${primary} w-full`}
        >
          Save Seed
        </button>
        {activeSeed && (
          <button
            type="button"
            className={`${button} w-full text-destructive`}
            onClick={() => setOverlay("delete-seed")}
          >
            Delete Seed
          </button>
        )}
      </form>
    )
  }
  function Row({
    icon,
    title,
    detail,
    onClick,
    danger = false,
  }: {
    icon: ReactNode
    title: string
    detail?: string
    onClick: () => void
    danger?: boolean
  }) {
    return (
      <button
        onClick={onClick}
        className={`flex min-h-14 w-full items-center gap-3 border-b border-border/60 text-left text-sm ${
          danger ? "text-destructive" : ""
        }`}
      >
        <span className="text-muted-foreground">{icon}</span>
        <span className="flex-1">{title}</span>
        <span className="text-xs text-muted-foreground">{detail}</span>
        <ChevronRight size={15} className="text-muted-foreground" />
      </button>
    )
  }
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
      <div className="flex h-10 items-center justify-between px-6 pt-[env(safe-area-inset-top)] text-[11px] font-bold sm:h-12">
        <span>
          {new Date(now).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: false,
          })}
        </span>
        <div className="flex items-end gap-1.5">
          <span className="text-[10px] tracking-[-2px]">▂▄▆█</span>
          <span className="text-sm">⌁</span>
          <span className="h-2.5 w-5 rounded-[3px] border border-foreground p-[1px]">
            <span className="block h-full w-4/5 rounded-[1px] bg-foreground" />
          </span>
        </div>
      </div>
      <main
        key={tab}
        className="px-5 pb-28 pt-3 motion-safe:animate-[enter_.2s_ease-out]"
      >
        {tab === "farms" && (
          <>
            <header className="flex items-center justify-between">
              <GrowTrackLogo />
              <button
                aria-label="Open settings"
                onClick={() => navigate("/settings")}
                className="flex size-10 items-center justify-center rounded-xl border border-border bg-card"
              >
                <Settings size={18} className="text-muted-foreground" />
              </button>
            </header>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="mb-1 text-xs text-muted-foreground">
                  A little care. A better harvest.
                </p>
                <h1 className="font-pixel text-[28px] leading-tight">
                  Good morning, {account.name}
                </h1>
                <p className="mt-2 text-xs text-muted-foreground">
                  {farms.length} farms <span className="px-1">·</span>{" "}
                  <span className="text-primary">
                    {ready.length} ready to harvest
                  </span>
                </p>
              </div>
            </div>
            <section
              aria-label="Farm overview"
              className="mt-5 grid grid-cols-3 rounded-2xl border border-border bg-card py-4"
            >
              {[
                {
                  number: farms.length,
                  label: "Total farms",
                  icon: <Sprout size={14} />,
                  color: "text-accent",
                },
                {
                  number: ready.length,
                  label: "Ready",
                  icon: <CheckCheck size={14} />,
                  color: "text-primary",
                },
                {
                  number: growing.length,
                  label: "Growing",
                  icon: <Clock3 size={14} />,
                  color: "text-[#e6c16a]",
                },
              ].map((stat, index) => (
                <button
                  key={stat.label}
                  aria-label={
                    index === 0
                      ? "Show all farms"
                      : index === 1
                        ? "Show ready farms"
                        : "Show growing farms"
                  }
                  aria-pressed={
                    farmFilter ===
                    (index === 0 ? "All" : index === 1 ? "Ready" : "Growing")
                  }
                  onClick={() =>
                    setFarmFilter(
                      index === 0 ? "All" : index === 1 ? "Ready" : "Growing",
                    )
                  }
                  className={`min-h-11 px-4 text-left transition active:opacity-70 ${
                    index ? "border-l border-border" : ""
                  }`}
                >
                  <div
                    className={`mb-1 flex items-center gap-1.5 text-[10px] ${stat.color}`}
                  >
                    {stat.icon}
                    {stat.label}
                  </div>
                  <p className="font-pixel text-[31px] leading-none">
                    {stat.number.toString().padStart(2, "0")}
                  </p>
                </button>
              ))}
            </section>
            {guest && (
              <div
                id="guest-usage"
                className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground"
              >
                <span>
                  Guest <span className="px-1">·</span>{" "}
                  <span className="tabular-nums">{farms.length} / 5 farms</span>
                </span>
                <span
                  className={
                    farms.length >= 5
                      ? "text-[#e6c16a]"
                      : "text-muted-foreground"
                  }
                >
                  {farms.length >= 5
                    ? "Guest limit reached"
                    : "Saved on this device"}
                </span>
              </div>
            )}
            <FarmControls
              filter={farmFilter}
              onFilter={setFarmFilter}
              sort={farmSort}
              onSort={setFarmSort}
              view={farmView}
              onView={setFarmView}
              query={farmQuery}
              onQuery={setFarmQuery}
              onAdd={() => openFarm("add")}
              guest={guest}
            />
            {farms.length === 0 && farmFilter === "All" && !farmQuery.trim() ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-5 flex justify-center gap-4 text-primary">
                  <Thumb id="pepper" />
                  <ArrowUpRight />
                  <Sprout size={40} />
                </div>
                <h2 className="font-pixel text-3xl">No farms yet</h2>
                <p className="mx-auto mt-3 max-w-64 text-sm text-muted-foreground">
                  Add your first farm and start tracking its harvest time.
                </p>
                <button
                  className={`${primary} mt-6`}
                  onClick={() => openFarm("add")}
                >
                  Add your first farm
                </button>
              </div>
            ) : matchingFarms.length === 0 ? (
              <FarmResultsEmpty
                filter={farmFilter}
                query={farmQuery}
                onClear={() => setFarmQuery("")}
                onAll={() => setFarmFilter("All")}
              />
            ) : farmView === "grid" ? (
              <section className="mb-5" aria-label="Farm grid">
                <h2 className="mb-3 text-[10px] font-bold tracking-[.12em] text-muted-foreground">
                  {farmFilter === "All"
                    ? "YOUR FARMS"
                    : farmFilter.toUpperCase()}{" "}
                  <span className="opacity-60">· {matchingFarms.length}</span>
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {matchingFarms.map((farm) => (
                    <GridFarmCard
                      key={farm.id}
                      farm={farm}
                      seed={seeds.find((seed) => seed.id === farm.seed)}
                      now={now}
                      thumbnail={<Thumb id={farm.seed} />}
                      onOpen={() => openFarm("details", farm)}
                      onFavorite={() =>
                        updateFarm(farm.id, { favorite: !farm.favorite })
                      }
                    />
                  ))}
                </div>
              </section>
            ) : farmSort !== "Recommended" && farmSort !== "Ready first" ? (
              <section className="mb-5" aria-label="Sorted farms">
                <h2 className="mb-3 text-[10px] font-bold tracking-[.12em] text-muted-foreground">
                  {farmFilter === "All"
                    ? "YOUR FARMS"
                    : farmFilter.toUpperCase()}{" "}
                  <span className="opacity-60">· {matchingFarms.length}</span>
                </h2>
                <div className="space-y-3">
                  {matchingFarms.map((farm) => renderFarmCard(farm))}
                </div>
              </section>
            ) : (
              ["Ready", "Growing", "Harvested"].map((status) => {
                const list = matchingFarms.filter(
                  (farm) => state(farm) === status,
                )
                return (
                  list.length > 0 && (
                    <section key={status} className="mb-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h2
                          className={`flex items-center gap-2 text-[10px] font-bold tracking-[.12em] ${
                            status === "Ready"
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {status === "Ready" ? (
                            <CheckCheck size={14} />
                          ) : status === "Growing" ? (
                            <Sprout size={14} />
                          ) : (
                            <Check size={14} />
                          )}{" "}
                          {status === "Ready"
                            ? "READY TO HARVEST"
                            : status.toUpperCase()}{" "}
                          <span className="opacity-60">· {list.length}</span>
                        </h2>
                        {status === "Ready" && (
                          <span className="text-[10px] text-muted-foreground">
                            Let's collect.
                          </span>
                        )}
                      </div>
                      <div className="space-y-3">
                        {list.map((farm) => renderFarmCard(farm))}
                      </div>
                    </section>
                  )
                )
              })
            )}
            <div className="flex items-center justify-center gap-1.5 pt-1 text-[10px] text-muted-foreground">
              <ShieldCheck size={12} />
              Your timers keep growing, even when you're away.
            </div>
          </>
        )}
        {tab === "seeds" && (
          <>
            <div className="flex justify-between">
              <div>
                <h1 className="font-pixel text-3xl">Seeds</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your GrowTrack seed library
                </p>
              </div>
              <button
                className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"
                aria-label="Add seed"
                onClick={() => {
                  setActiveSeed(null)
                  setOverlay("seed")
                }}
              >
                <Plus size={20} />
              </button>
            </div>
            <div className="relative mt-6">
              <Search
                size={18}
                className="absolute left-4 top-4 text-muted-foreground"
              />
              <input
                className={`${field} pl-11`}
                placeholder="Search seeds"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="my-4 flex gap-2">
              {["All", "Re-harvest", "One-time"].map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`${button} !min-h-10 !px-3 !text-xs ${
                    filter === item
                      ? "bg-primary/15 text-primary"
                      : "bg-card text-muted-foreground"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {seeds
                .filter(
                  (seed) =>
                    seed.name.toLowerCase().includes(search.toLowerCase()) &&
                    (filter === "All" ||
                      seed.repeat === (filter === "Re-harvest")),
                )
                .map((seed) => (
                  <article
                    key={seed.id}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
                  >
                    <Thumb id={seed.id} />
                    <div className="flex-1">
                      <h2 className="text-sm font-semibold">{seed.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {duration(seed.duration)}
                      </p>
                      <span className="mt-2 inline-block text-[10px] text-accent">
                        {seed.repeat ? "↻ Re-harvest" : "One-time"}
                      </span>
                    </div>
                    <button
                      className={`${button} !px-2 text-muted-foreground`}
                      onClick={() => {
                        setActiveSeed(seed)
                        setOverlay("seed")
                      }}
                    >
                      Edit
                    </button>
                  </article>
                ))}
            </div>
            {!seeds.some((seed) =>
              seed.name.toLowerCase().includes(search.toLowerCase()),
            ) && (
              <p className="py-10 text-center text-muted-foreground">
                No seeds found.
              </p>
            )}
            <div className="mt-5 flex gap-3 border-t border-border pt-4">
              <Info size={16} className="shrink-0 text-accent" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Starter seed times may change in-game.
                </p>
                <button
                  className="min-h-10 text-xs font-semibold text-accent"
                  onClick={() => setOverlay("restore")}
                >
                  Restore defaults
                </button>
              </div>
            </div>
          </>
        )}
        {tab === "settings" && (
          <>
            <h1 className="font-pixel text-3xl">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Make GrowTrack work for you.
            </p>
            {[
              {
                label: "APPEARANCE",
                rows: (
                  <Row
                    icon={<Moon size={18} />}
                    title="Theme"
                    detail={prefs.theme[0].toUpperCase() + prefs.theme.slice(1)}
                    onClick={() => setOverlay("theme")}
                  />
                ),
              },
              {
                label: "NOTIFICATIONS",
                rows: (
                  <div className="flex min-h-16 items-center gap-3 border-b border-border">
                    <Bell size={18} className="text-muted-foreground" />
                    <span className="flex-1 text-sm">
                      Harvest notifications
                    </span>
                    <Toggle
                      label="Enable harvest notifications"
                      value={prefs.notifications}
                      onChange={() => {
                        setPrefs({
                          ...prefs,
                          notifications: !prefs.notifications,
                        })
                        if (!prefs.notifications) void notifyPermission()
                      }}
                    />
                  </div>
                ),
              },
              {
                label: "FARM TRACKING",
                rows: (
                  <>
                    <Row
                      icon={<Clock3 size={18} />}
                      title="Default grow-time behavior"
                      detail={
                        prefs.behavior === "seed" ? "Use seed time" : "Manual"
                      }
                      onClick={() => setOverlay("behavior")}
                    />
                    <Row
                      icon={<Sun size={18} />}
                      title="Time format"
                      detail={`${prefs.time}-hour`}
                      onClick={() =>
                        setPrefs({
                          ...prefs,
                          time: prefs.time === "24" ? "12" : "24",
                        })
                      }
                    />
                  </>
                ),
              },
              {
                label: "DATA",
                rows: (
                  <>
                    <Row
                      icon={<RotateCcw size={18} />}
                      title="Restore default seeds"
                      onClick={() => setOverlay("restore")}
                    />
                    <Row
                      icon={<Trash2 size={18} />}
                      title="Reset app data"
                      danger
                      onClick={() => setOverlay("reset-data")}
                    />
                  </>
                ),
              },
              {
                label: "ABOUT",
                rows: (
                  <>
                    <Row
                      icon={<CircleHelp size={18} />}
                      title="About GrowTrack"
                      onClick={() => setOverlay("about")}
                    />
                    <Row
                      icon={<Info size={18} />}
                      title="Version"
                      detail="1.0.0"
                      onClick={() => setToast("You're up to date")}
                    />
                    <Row
                      icon={<Sprout size={18} />}
                      title="Getting started"
                      onClick={() => {
                        setOnboard(0)
                        setOverlay("onboarding")
                      }}
                    />
                  </>
                ),
              },
              {
                label: "ACCOUNT",
                rows: (
                  <Row
                    icon={<LogIn size={18} />}
                    title={guest ? "Guest Mode / Sign in" : "Account"}
                    detail={guest ? `${farms.length} / 5 farms` : account.name}
                    onClick={() => setOverlay("account")}
                  />
                ),
              },
            ].map((section) => (
              <section key={section.label} className="mt-7">
                <h2 className="mb-2 text-[10px] font-bold tracking-[.12em] text-muted-foreground">
                  {section.label}
                </h2>
                {section.rows}
              </section>
            ))}
            <p className="mt-8 text-center font-pixel text-lg text-primary">
              Keep every farm growing.
            </p>
          </>
        )}
      </main>
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[460px] -translate-x-1/2 justify-around border-t border-border bg-card/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
      >
        {[
          { id: "farms", label: "Farms", icon: Sprout },
          { id: "seeds", label: "Seeds", icon: Leaf },
          { id: "settings", label: "Settings", icon: Settings },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => navigate(`/${item.id}`)}
            aria-current={tab === item.id ? "page" : undefined}
            className={`flex min-h-12 w-20 flex-col items-center justify-center gap-1 text-[10px] font-medium ${
              tab === item.id ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon size={21} />
            {item.label}
          </button>
        ))}
      </nav>
      {toast && (
        <div
          role="status"
          className={`fixed ${overlay === "details" ? "top-[max(16px,env(safe-area-inset-top))]" : "bottom-24"} left-1/2 z-50 flex w-[calc(100%-40px)] max-w-[420px] -translate-x-1/2 items-center gap-3 rounded-xl border border-primary/25 bg-popover p-4 text-sm shadow-xl motion-safe:animate-[enter_.2s_ease-out]`}
        >
          <Check size={18} className="shrink-0 text-primary" />
          {toast}
        </div>
      )}
      {overlay && (
        <div
          className={`fixed inset-0 z-40 flex items-end justify-center bg-black/65 backdrop-blur-[3px] ${
            overlayClosing
              ? "pointer-events-none motion-safe:animate-[dim-out_.16s_ease-in_forwards]"
              : ""
          }`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={overlay === "details" ? "Farm details" : overlay}
            className={`w-full max-w-[460px] overflow-y-auto border border-border ${
              overlay === "details" ? "bg-popover" : "bg-background"
            } p-5 pb-[max(24px,env(safe-area-inset-bottom))] shadow-2xl ${
              [
                "delete",
                "reset-data",
                "restore",
                "delete-seed",
                "reset-timer",
              ].includes(overlay)
                ? `mb-[30vh] mx-5 max-w-[360px] rounded-2xl ${
                    overlayClosing
                      ? "motion-safe:animate-[dim-out_.16s_ease-in_forwards]"
                      : "motion-safe:animate-[enter_.2s_ease-out]"
                  }`
                : `max-h-[92dvh] rounded-t-3xl ${
                    overlayClosing
                      ? "motion-safe:animate-[sheet-out_.16s_ease-in_forwards]"
                      : "motion-safe:animate-[sheet_.25s_cubic-bezier(.2,.8,.2,1)]"
                  }`
            }`}
          >
            {![
              "delete",
              "reset-data",
              "restore",
              "delete-seed",
              "reset-timer",
            ].includes(overlay) && (
              <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-muted-foreground/40" />
            )}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-pixel text-[27px]">
                {
                  {
                    add: "Add Farm",
                    edit: "Edit Farm",
                    swap: "Swap Farm",
                    replant: "Replant Farm",
                    seed: activeSeed ? "Edit Seed" : "Add Seed",
                    delete: "Delete farm?",
                    "delete-seed": "Delete seed?",
                    "reset-data": "Reset app data?",
                    restore: "Restore default seeds?",
                    theme: "Choose your theme",
                    actions: active?.world,
                    behavior: "Default grow time",
                    about: "About GrowTrack",
                    account: "Your farms, everywhere",
                    "guest-limit": "Guest farm limit reached",
                    details: "Farm details",
                    onboarding: "GrowTrack",
                    "reset-timer": "Reset timer?",
                  }[overlay]
                }
              </h2>
              <button
                aria-label="Close dialog"
                className="flex size-11 shrink-0 items-center justify-center text-muted-foreground"
                onClick={close}
              >
                <X size={20} />
              </button>
            </div>
            {["add", "edit", "swap", "replant"].includes(overlay) && (
              <FarmForm />
            )}
            {overlay === "seed" && <SeedForm />}
            {[
              "delete",
              "reset-data",
              "restore",
              "delete-seed",
              "reset-timer",
            ].includes(overlay) && (
              <>
                <p className="text-sm leading-6 text-muted-foreground">
                  {
                    {
                      delete:
                        "This will remove the farm and its current timer.",
                      "reset-data":
                        "This will remove your farms, custom seeds, and app preferences. This cannot be undone.",
                      restore:
                        "Restore GrowTrack's starter seed library. Your custom seeds and farm timers will stay unchanged.",
                      "delete-seed":
                        "Remove this seed from your library. Seeds assigned to farms cannot be deleted.",
                      "reset-timer":
                        "Restart this farm's countdown from its full grow duration?",
                    }[overlay]
                  }
                </p>
                <div className="mt-6 flex gap-3">
                  <button className={`${secondary} flex-1`} onClick={close}>
                    Cancel
                  </button>
                  <button
                    disabled={
                      overlay === "delete-seed" &&
                      farms.some((farm) => farm.seed === activeSeed?.id)
                    }
                    className={`${button} flex-1 ${
                      overlay === "restore" || overlay === "reset-timer"
                        ? "bg-primary text-primary-foreground"
                        : "bg-destructive text-[#21110e]"
                    }`}
                    onClick={() => {
                      if (overlay === "delete")
                        setFarms((current) =>
                          current.filter((farm) => farm.id !== active?.id),
                        )
                      if (overlay === "delete-seed")
                        setSeeds((current) =>
                          current.filter((seed) => seed.id !== activeSeed?.id),
                        )
                      if (overlay === "reset-data") {
                        setFarms([])
                        setFarmView("list")
                        setFarmFilter("All")
                        setFarmSort("Recommended")
                        setFarmQuery("")
                        setSeeds(defaults)
                        setPrefs({
                          theme: "dark",
                          notifications: true,
                          time: "24",
                          behavior: "seed",
                        })
                        setNotified([])
                      }
                      if (overlay === "restore")
                        setSeeds((current) => [
                          ...defaults,
                          ...current.filter(
                            (seed) =>
                              !defaults.some((item) => item.id === seed.id),
                          ),
                        ])
                      if (overlay === "reset-timer" && active) {
                        updateFarm(active.id, {
                          start: Date.now(),
                          harvested: false,
                        })
                        setNotified((current) =>
                          current.filter((id) => id !== active.id),
                        )
                      }
                      finish(
                        overlay === "restore"
                          ? "Starter seeds restored"
                          : overlay === "reset-timer"
                            ? "Timer restarted"
                            : "Done. Your data has been updated.",
                      )
                    }}
                  >
                    {overlay === "restore"
                      ? "Restore"
                      : overlay === "reset-data"
                        ? "Reset data"
                        : overlay === "reset-timer"
                          ? "Reset timer"
                          : "Delete"}
                  </button>
                </div>
              </>
            )}
            {overlay === "details" && selectedFarm && (
              <div>
                <div className="flex items-center gap-3">
                  <Thumb id={selectedFarm.seed} large />
                  <div className="min-w-0 flex-1">
                    <h3
                      title={selectedFarm.world}
                      className="truncate text-[16px] font-bold tracking-[.035em]"
                    >
                      {selectedFarm.world}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {seeds.find((seed) => seed.id === selectedFarm.seed)
                        ?.name || "Unknown seed"}
                    </p>
                  </div>
                  <button
                    aria-label={
                      selectedFarm.favorite ? "Unpin farm" : "Pin farm"
                    }
                    aria-pressed={selectedFarm.favorite}
                    onClick={() =>
                      updateFarm(selectedFarm.id, {
                        favorite: !selectedFarm.favorite,
                      })
                    }
                    className="flex size-11 shrink-0 items-center justify-center transition active:scale-125"
                  >
                    <Star
                      size={18}
                      className={
                        selectedFarm.favorite
                          ? "fill-[#F2C94C] text-[#F2C94C]"
                          : "text-muted-foreground/70"
                      }
                    />
                  </button>
                </div>
                <div
                  key={`status-${state(selectedFarm)}`}
                  className="mt-5 flex items-center justify-between text-[11px] font-semibold tracking-[.08em] motion-safe:animate-[enter_.18s_ease-out]"
                >
                  <span
                    role="status"
                    className={`flex items-center gap-1.5 ${
                      state(selectedFarm) === "Ready"
                        ? "text-primary"
                        : state(selectedFarm) === "Growing"
                          ? "text-[#e6c16a]"
                          : "text-muted-foreground"
                    }`}
                  >
                    {state(selectedFarm) === "Ready" ? (
                      <CheckCheck size={14} />
                    ) : state(selectedFarm) === "Growing" ? (
                      <Clock3 size={14} />
                    ) : (
                      <Check size={14} />
                    )}{" "}
                    {state(selectedFarm).toUpperCase()}
                  </span>
                  <span className="text-muted-foreground">
                    {Math.floor(farmProgress(selectedFarm, now))}%
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label="Farm grow progress"
                  aria-valuenow={Math.floor(farmProgress(selectedFarm, now))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-2 flex h-1.5 overflow-hidden rounded bg-secondary"
                >
                  <div
                    className={`h-full rounded transition-all duration-1000 ${
                      state(selectedFarm) === "Harvested"
                        ? "bg-muted-foreground/40"
                        : "bg-primary"
                    }`}
                    style={{ width: `${farmProgress(selectedFarm, now)}%` }}
                  />
                </div>
                <p
                  key={`remaining-${state(selectedFarm)}`}
                  className={`mt-4 text-[23px] font-semibold tabular-nums motion-safe:animate-[enter_.18s_ease-out] ${
                    state(selectedFarm) === "Ready" ? "text-primary" : ""
                  }`}
                >
                  {state(selectedFarm) === "Growing"
                    ? duration(
                        (selectedFarm.start +
                          selectedFarm.duration * 1000 -
                          now) /
                          1000,
                      )
                    : state(selectedFarm) === "Ready"
                      ? "Ready to harvest"
                      : "Ready to plant again"}
                  {state(selectedFarm) === "Growing" && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      remaining
                    </span>
                  )}
                </p>
                <div className="mt-4 border-y border-border py-3">
                  <p className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">
                      Estimated harvest
                    </span>
                    <span>
                      {new Date(
                        selectedFarm.start + selectedFarm.duration * 1000,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      ·{" "}
                      {new Date(
                        selectedFarm.start + selectedFarm.duration * 1000,
                      ).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: prefs.time === "12",
                      })}
                    </span>
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Bell
                      size={14}
                      className={
                        selectedFarm.notify && prefs.notifications
                          ? "text-accent"
                          : "text-muted-foreground"
                      }
                    />
                    {selectedFarm.notify && prefs.notifications
                      ? "Harvest notification enabled"
                      : "Notifications off"}
                  </p>
                </div>
                <div className="mt-5 flex gap-3">
                  <button
                    className={`${primary} flex-1`}
                    onClick={() => {
                      if (state(selectedFarm) === "Ready") {
                        updateFarm(selectedFarm.id, { harvested: true })
                        setToast(`${selectedFarm.world} harvested. Nice work!`)
                      } else
                        openFarm(
                          state(selectedFarm) === "Growing"
                            ? "edit"
                            : "replant",
                          selectedFarm,
                        )
                    }}
                  >
                    {state(selectedFarm) === "Ready"
                      ? "Harvest"
                      : state(selectedFarm) === "Growing"
                        ? "Edit Farm"
                        : "Replant"}
                  </button>
                  {state(selectedFarm) === "Ready" && (
                    <button
                      className={`${secondary} flex-1`}
                      onClick={() => openFarm("swap", selectedFarm)}
                    >
                      Swap
                    </button>
                  )}
                  {state(selectedFarm) === "Growing" && (
                    <button
                      className={`${secondary} flex-1 border border-border`}
                      onClick={() => openFarm("reset-timer", selectedFarm)}
                    >
                      Reset
                    </button>
                  )}
                </div>
                {state(selectedFarm) !== "Growing" && (
                  <button
                    className={`${button} mt-2 w-full text-muted-foreground`}
                    onClick={() => openFarm("edit", selectedFarm)}
                  >
                    Edit Farm
                  </button>
                )}
              </div>
            )}
            {overlay === "theme" && (
              <div className="grid grid-cols-3 gap-3">
                {["dark", "light", "system"].map((theme) => (
                  <button
                    key={theme}
                    className={`rounded-xl border-2 p-3 text-left ${
                      prefs.theme === theme ? "border-primary" : "border-border"
                    }`}
                    onClick={() => setPrefs({ ...prefs, theme })}
                  >
                    <div
                      className={`mb-3 h-24 rounded-lg p-2 ${
                        theme === "light"
                          ? "bg-[#edf2e8]"
                          : theme === "dark"
                            ? "bg-[#0d1715]"
                            : "bg-linear-to-r from-[#0d1715] from-50% to-[#edf2e8] to-50%"
                      }`}
                    >
                      <div className="mb-2 h-2 w-7 rounded bg-primary" />
                      <div className="h-6 rounded border border-[#819287]/30 bg-[#819287]/20" />
                      <div className="mt-2 h-6 rounded border border-[#819287]/30 bg-[#819287]/20" />
                    </div>
                    <span className="text-xs capitalize">{theme}</span>
                    {prefs.theme === theme && (
                      <Check size={14} className="float-right text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
            {overlay === "behavior" &&
              ["seed", "manual"].map((value) => (
                <Row
                  key={value}
                  icon={
                    prefs.behavior === value ? (
                      <Check size={18} />
                    ) : (
                      <Clock3 size={18} />
                    )
                  }
                  title={
                    value === "seed"
                      ? "Use the seed's grow duration"
                      : "Enter duration manually"
                  }
                  onClick={() => {
                    setPrefs({ ...prefs, behavior: value })
                    close()
                  }}
                />
              ))}
            {overlay === "about" && (
              <div className="space-y-4 text-sm leading-6 text-muted-foreground">
                <p>
                  Built for growers who have more than one world to look after.
                  Track, harvest, and replant — without the world-hopping.
                </p>
                <p>
                  GrowTrack is an independent companion, not affiliated with
                  Ubisoft or Growtopia. Item imagery belongs to its respective
                  owners.
                </p>
                <p className="text-xs">
                  Version 1.0.0 · Timers and preferences saved on this device.
                  Browser harvest alerts require notification permission;
                  notifications while the app is closed need future background
                  support.
                </p>
              </div>
            )}
            {overlay === "account" && (
              <div className="text-sm leading-6 text-muted-foreground">
                {guest ? (
                  <>
                    <p>
                      You're growing as a Guest. Track up to 5 farms, with
                      timers and preferences saved on this device.
                    </p>
                    <p className="mt-3">
                      Create an account to manage more farms. Cross-device
                      synchronization is coming in a future update.
                    </p>
                    <button
                      className={`${primary} mt-6 w-full`}
                      onClick={() => navigate("/signup")}
                    >
                      Create Account
                    </button>
                    <button
                      className={`${secondary} mt-3 w-full`}
                      onClick={() => navigate("/login")}
                    >
                      Sign In
                    </button>
                    <button className={`${button} mt-2 w-full`} onClick={close}>
                      Not now
                    </button>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl bg-card p-4">
                      <p className="font-semibold text-foreground">
                        {account.name}
                      </p>
                      <p className="mt-1 break-all text-xs">{account.email}</p>
                      <p className="mt-3 flex items-center gap-2 text-xs">
                        <ShieldCheck size={14} className="text-accent" />
                        Sync status · Saved on this device
                      </p>
                    </div>
                    <p className="mt-4 text-xs leading-5">
                      This is a preview account. Cloud synchronization is not
                      connected yet. Your farm timers remain on this device.
                    </p>
                    <button
                      className={`${secondary} mt-5 w-full`}
                      onClick={() => {
                        signOut()
                        navigate("/login", { replace: true })
                      }}
                    >
                      Sign out
                    </button>
                  </>
                )}
              </div>
            )}
            {overlay === "guest-limit" && (
              <div>
                <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <Sprout size={22} className="text-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      {farms.length} / 5 farms
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Your worlds are still growing.
                    </p>
                  </div>
                  <CheckCheck size={20} className="ml-auto text-primary" />
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  You've reached the 5-farm limit for Guest Mode.
                </p>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Create an account to manage more farms and get ready for
                  access across devices.
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Your guest farms carry over when you create an account. Cloud
                  sync is coming soon.
                </p>
                <button
                  className={`${primary} mt-6 w-full`}
                  onClick={() => navigate("/signup")}
                >
                  Create Account
                </button>
                <button
                  className={`${secondary} mt-3 w-full`}
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </button>
                <button
                  className={`${button} mt-2 w-full text-muted-foreground`}
                  onClick={close}
                >
                  Not now
                </button>
              </div>
            )}
            {overlay === "onboarding" && (
              <div className="text-center">
                <div className="my-8 flex items-center justify-center gap-4">
                  <Thumb id="pepper" large />
                  <span className="text-primary">→</span>
                  <Sprout size={48} className="text-primary" />
                  <span className="text-accent">→</span>
                  <Thumb id="chandelier" large />
                </div>
                <h3 className="font-pixel text-3xl">
                  {
                    [
                      "Keep every farm growing.",
                      "All your farms. One view.",
                      "Know when it's ready.",
                    ][onboard]
                  }
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {
                    [
                      "Know exactly when it's ready. Your next harvest starts here.",
                      "Keep track of multiple worlds without checking each one individually.",
                      "Get notified when your farm reaches harvest time.",
                    ][onboard]
                  }
                </p>
                {onboard === 1 && (
                  <div className="mt-5 space-y-2 text-left">
                    {farms.slice(0, 2).map((farm) => (
                      <div
                        key={farm.id}
                        className="flex justify-between rounded-xl bg-card p-3 text-xs"
                      >
                        <span>{farm.world}</span>
                        <span className="text-primary">{state(farm)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {onboard === 2 && (
                  <div className="mt-5 rounded-xl bg-card p-4 text-left">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#e6c16a]">Growing</span>
                      <span className="text-primary">✓ Ready</span>
                    </div>
                    <div className="mt-3 h-1.5 rounded bg-primary" />
                  </div>
                )}
                <div className="my-6 flex justify-center gap-2">
                  {[0, 1, 2].map((index) => (
                    <span
                      key={index}
                      className={`h-1.5 rounded-full ${
                        onboard === index
                          ? "w-5 bg-primary"
                          : "w-1.5 bg-secondary"
                      }`}
                    />
                  ))}
                </div>
                <button
                  className={`${primary} w-full`}
                  onClick={() =>
                    onboard < 2 ? setOnboard(onboard + 1) : close()
                  }
                >
                  {onboard === 0
                    ? "Get Started"
                    : onboard === 2
                      ? "Start Tracking"
                      : "Continue"}
                </button>
                {onboard === 0 && (
                  <button
                    className={`${button} mt-2 text-muted-foreground`}
                    onClick={() => navigate("/login")}
                  >
                    I already have an account
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
function ProtectedApp() {
  return readAccount() ? <AppContent /> : <Navigate to="/login" replace />
}
const router = createBrowserRouter([
  { path: "/", Component: SplashScreen },
  { path: "/login", Component: AuthScreen },
  { path: "/signup", Component: AuthScreen },
  { path: "/forgot-password", Component: AuthScreen },
  { path: "/farms", Component: ProtectedApp },
  { path: "/seeds", Component: ProtectedApp },
  { path: "/settings", Component: ProtectedApp },
  { path: "*", element: <Navigate to="/" replace /> },
])
export default function App() {
  return <RouterProvider router={router} />
}
