import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  LayoutGrid,
  List,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react"
import type { Farm, Seed } from "./App"

export type FarmFilter = "All" | "Ready" | "Growing" | "Harvested" | "Pinned"
export type FarmView = "list" | "grid"
export const sortOptions = [
  "Recommended",
  "Ready first",
  "Farthest harvest",
  "Alphabetical A → Z",
  "Alphabetical Z → A",
  "Recently added",
  "Recently updated",
  "Favorite first",
] as const
export type FarmSort = typeof sortOptions[number]
export function farmStatus(farm: Farm, now: number) {
  return farm.harvested
    ? "Harvested"
    : farm.start + farm.duration * 1000 <= now
      ? "Ready"
      : "Growing"
}
export function farmProgress(farm: Farm, now: number) {
  return farm.harvested || farm.duration <= 0
    ? 100
    : Math.min(
        100,
        Math.max(0, ((now - farm.start) / (farm.duration * 1000)) * 100),
      )
}
export function visibleFarms(
  farms: Farm[],
  seeds: Seed[],
  filter: FarmFilter,
  query: string,
  sort: FarmSort,
  now: number,
) {
  const search = query.trim().toLowerCase()
  const rank = (farm: Farm) =>
    ({ Ready: 0, Growing: 1, Harvested: 2 })[farmStatus(farm, now)]
  const result = farms.filter(
    (farm) =>
      (filter === "All" ||
        (filter === "Pinned"
          ? farm.favorite
          : farmStatus(farm, now) === filter)) &&
      (!search ||
        farm.world.toLowerCase().includes(search) ||
        (seeds.find((seed) => seed.id === farm.seed)?.name || "")
          .toLowerCase()
          .includes(search)),
  )
  return result.sort((first, second) => {
    switch (sort) {
      case "Ready first":
        return (
          rank(first) - rank(second) ||
          first.start +
            first.duration * 1000 -
            second.start -
            second.duration * 1000
        )
      case "Farthest harvest":
        return (
          Number(first.harvested) - Number(second.harvested) ||
          second.start +
            second.duration * 1000 -
            first.start -
            first.duration * 1000
        )
      case "Alphabetical A → Z":
        return first.world.localeCompare(second.world)
      case "Alphabetical Z → A":
        return second.world.localeCompare(first.world)
      case "Recently added":
        return (
          (second.createdAt ?? second.start) - (first.createdAt ?? first.start)
        )
      case "Recently updated":
        return (
          (second.updatedAt ?? second.start) - (first.updatedAt ?? first.start)
        )
      case "Favorite first":
        return (
          Number(second.favorite) - Number(first.favorite) ||
          rank(first) - rank(second)
        )
      default:
        return rank(first) - rank(second)
    }
  })
}
type ControlsProps = {
  filter: FarmFilter
  onFilter: (value: FarmFilter) => void
  sort: FarmSort
  onSort: (value: FarmSort) => void
  view: FarmView
  onView: (value: FarmView) => void
  query: string
  onQuery: (value: string) => void
  onAdd: () => void
  guest: boolean
}
export function FarmControls({
  filter,
  onFilter,
  sort,
  onSort,
  view,
  onView,
  query,
  onQuery,
  onAdd,
  guest,
}: ControlsProps) {
  const [popup, setPopup] = useState<"filter" | "sort" | null>(null)
  const [searchOpen, setSearchOpen] = useState(Boolean(query))
  const [menuHeight, setMenuHeight] = useState(400)
  const [menuAbove, setMenuAbove] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const sortRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!popup) return
    const root = popup === "filter" ? filterRef.current : sortRef.current
    const positionMenu = () => {
      const bounds = root?.getBoundingClientRect()
      if (!bounds) return
      const below = window.innerHeight - bounds.bottom - 12
      const above = bounds.top - 12
      const flip = below < (popup === "sort" ? 400 : 268) && above > below
      setMenuAbove(flip)
      setMenuHeight(Math.max(120, flip ? above : below))
    }
    positionMenu()
    root
      ?.querySelector<HTMLButtonElement>(
        '[role="menuitemradio"][aria-checked="true"]',
      )
      ?.focus({ preventScroll: true })
    const dismiss = (event: PointerEvent) => {
      if (!root?.contains(event.target as Node)) setPopup(null)
    }
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPopup(null)
        root
          ?.querySelector<HTMLButtonElement>('[aria-haspopup="menu"]')
          ?.focus()
      }
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault()
        const items = Array.from(
          root?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ||
            [],
        )
        const current = items.indexOf(
          document.activeElement as HTMLButtonElement,
        )
        const index =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? items.length - 1
              : (current +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  items.length) %
                items.length
        items[index]?.focus()
      }
      if (event.key === "Tab") setPopup(null)
    }
    document.addEventListener("pointerdown", dismiss)
    document.addEventListener("keydown", keyboard)
    window.addEventListener("resize", positionMenu)
    return () => {
      document.removeEventListener("pointerdown", dismiss)
      document.removeEventListener("keydown", keyboard)
      window.removeEventListener("resize", positionMenu)
    }
  }, [popup])
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus()
  }, [searchOpen])
  const menuClass = `absolute left-0 z-30 w-56 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-lg motion-safe:animate-[enter_.15s_ease-out] ${
    menuAbove ? "bottom-full mb-1" : "top-full mt-1"
  }`
  return (
    <div className="mb-4 mt-6">
      <div className="flex items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1">
          <div ref={filterRef} className="relative">
            <button
              aria-label={`Filter farms: ${
                filter === "All" ? "All farms" : filter
              }`}
              aria-haspopup="menu"
              aria-expanded={popup === "filter"}
              aria-controls={
                popup === "filter" ? "farm-filter-menu" : undefined
              }
              onClick={() => setPopup(popup === "filter" ? null : "filter")}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault()
                  setPopup("filter")
                }
              }}
              className={`flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold max-[360px]:gap-1 max-[360px]:px-2 max-[360px]:text-[11px] ${
                filter !== "Pinned"
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {filter === "All" || filter === "Pinned" ? "All farms" : filter}
              <ChevronDown size={12} />
            </button>
            {popup === "filter" && (
              <div
                id="farm-filter-menu"
                role="menu"
                aria-label="Filter farms"
                className={menuClass}
                style={{ maxHeight: menuHeight }}
              >
                <p className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground">
                  SHOW FARMS
                </p>
                {([
                  "All",
                  "Ready",
                  "Growing",
                  "Harvested",
                  "Pinned",
                ] as FarmFilter[]).map((option) => (
                  <button
                    key={option}
                    role="menuitemradio"
                    aria-checked={filter === option}
                    onClick={() => {
                      onFilter(option)
                      setPopup(null)
                      filterRef.current
                        ?.querySelector<HTMLButtonElement>("[aria-haspopup]")
                        ?.focus()
                    }}
                    className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-xs ${
                      filter === option
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    <span className="w-4">
                      {filter === option && <Check size={14} />}
                    </span>
                    {option === "All" ? "All farms" : option}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            aria-pressed={filter === "Pinned"}
            onClick={() => onFilter(filter === "Pinned" ? "All" : "Pinned")}
            className={`flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold max-[360px]:gap-1 max-[360px]:px-1 max-[360px]:text-[11px] ${
              filter === "Pinned"
                ? "bg-secondary text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <Star size={12} />
            Pinned
          </button>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            aria-label="Search farms"
            aria-expanded={searchOpen}
            aria-controls="farm-search"
            onClick={() => {
              setSearchOpen(!searchOpen)
              if (searchOpen) onQuery("")
            }}
            className={`flex size-11 items-center justify-center rounded-lg ${
              searchOpen ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Search size={17} />
          </button>
          <div
            role="group"
            aria-label="Farm view"
            className="flex rounded-lg border border-border bg-card p-0.5"
          >
            {([
              { id: "list", icon: List, label: "List view" },
              { id: "grid", icon: LayoutGrid, label: "Grid view" },
            ] as const).map((item) => (
              <button
                key={item.id}
                aria-label={item.label}
                aria-pressed={view === item.id}
                onClick={() => onView(item.id)}
                className={`flex size-11 items-center justify-center rounded-md transition ${
                  view === item.id
                    ? "bg-secondary text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon size={17} />
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div ref={sortRef} className="relative min-w-0">
          <button
            aria-label={`Sort farms: ${sort}`}
            aria-haspopup="menu"
            aria-expanded={popup === "sort"}
            aria-controls={popup === "sort" ? "farm-sort-menu" : undefined}
            onClick={() => setPopup(popup === "sort" ? null : "sort")}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault()
                setPopup("sort")
              }
            }}
            className="flex min-h-11 max-w-full items-center gap-1.5 text-[11px] text-muted-foreground"
          >
            <span className="shrink-0">Sort:</span>
            <span className="truncate text-foreground">{sort}</span>
            <ChevronDown size={12} className="shrink-0" />
          </button>
          {popup === "sort" && (
            <div
              id="farm-sort-menu"
              role="menu"
              aria-label="Sort by"
              className={menuClass}
              style={{ maxHeight: menuHeight }}
            >
              <p className="px-3 py-2 text-[10px] font-semibold tracking-wider text-muted-foreground">
                SORT BY
              </p>
              {sortOptions.map((option) => (
                <button
                  key={option}
                  role="menuitemradio"
                  aria-checked={sort === option}
                  onClick={() => {
                    onSort(option)
                    setPopup(null)
                    sortRef.current
                      ?.querySelector<HTMLButtonElement>("[aria-haspopup]")
                      ?.focus()
                  }}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-xs ${
                    sort === option
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <span className="w-4">
                    {sort === option && <Check size={14} />}
                  </span>
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          aria-describedby={guest ? "guest-usage" : undefined}
          onClick={onAdd}
          className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-[10px] bg-primary px-3 text-xs font-semibold text-primary-foreground transition active:scale-[.97]"
        >
          <Plus size={15} />
          Add farm
        </button>
      </div>
      {searchOpen && (
        <div id="farm-search" className="relative mt-2">
          <Search
            size={17}
            className="absolute left-3 top-3.5 text-muted-foreground"
          />
          <input
            ref={searchRef}
            aria-label="Search farms or worlds"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder="Search farms or worlds..."
            className="min-h-11 w-full rounded-xl border border-border bg-input pl-10 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {query && (
            <button
              aria-label="Clear search"
              onClick={() => {
                onQuery("")
                searchRef.current?.focus()
              }}
              className="absolute right-0 top-0 flex size-11 items-center justify-center text-muted-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}
      <span className="sr-only">
        Current status filter: {filter}. View, filter, sort, and search can be
        combined.
      </span>
    </div>
  )
}
type GridProps = {
  farm: Farm
  seed?: Seed
  now: number
  onOpen: () => void
  onFavorite: () => void
  thumbnail: ReactNode
}
export function GridFarmCard({
  farm,
  seed,
  now,
  onOpen,
  onFavorite,
  thumbnail,
}: GridProps) {
  const status = farmStatus(farm, now)
  const percent = farmProgress(farm, now)
  const remaining = Math.max(
    0,
    Math.ceil((farm.start + farm.duration * 1000 - now) / 60000),
  )
  const days = Math.floor(remaining / 1440)
  const hours = Math.floor((remaining % 1440) / 60)
  const countdown = days
    ? `${days}d ${String(hours).padStart(2, "0")}h`
    : `${String(hours).padStart(2, "0")}h ${String(remaining % 60).padStart(2, "0")}m`
  return (
    <article
      className={`relative h-[232px] min-w-0 rounded-2xl border p-3 ${
        status === "Ready"
          ? "border-primary/35 bg-[#142b20] [.light_&]:bg-[#eaf6e9]"
          : "border-border/70 bg-card"
      }`}
    >
      <button
        onClick={onOpen}
        aria-label={`${farm.world}, ${status}. Open farm details`}
        className="absolute inset-0 rounded-2xl transition active:bg-primary/5"
      />
      <div className="pointer-events-none relative flex h-full flex-col">
        <div className="mb-3 flex items-start justify-between gap-1">
          {thumbnail}
          <button
            onClick={onFavorite}
            aria-label={`${farm.favorite ? "Unpin" : "Pin"} ${farm.world}`}
            aria-pressed={farm.favorite}
            className="pointer-events-auto -mr-1 -mt-1 flex size-11 shrink-0 items-center justify-center transition active:scale-125"
          >
            <Star
              size={17}
              className={
                farm.favorite
                  ? "fill-[#F2C94C] text-[#F2C94C]"
                  : "text-muted-foreground/70"
              }
            />
          </button>
        </div>
        <h3
          title={farm.world}
          className="truncate text-[13px] font-bold tracking-[.035em]"
        >
          {farm.world}
        </h3>
        <p
          title={seed?.name || "Unknown seed"}
          className="mt-1 truncate text-xs text-muted-foreground"
        >
          {seed?.name || "Unknown seed"}
        </p>
        <div
          className={`mt-4 flex items-center gap-1.5 text-[10px] font-bold tracking-[.06em] ${
            status === "Ready"
              ? "text-primary"
              : status === "Growing"
                ? "text-[#e6c16a]"
                : "text-muted-foreground"
          }`}
        >
          {status === "Ready" ? (
            <CheckCheck size={13} />
          ) : status === "Growing" ? (
            <Clock3 size={12} />
          ) : (
            <Check size={13} />
          )}{" "}
          {status.toUpperCase()}
        </div>
        <div
          role="progressbar"
          aria-label={`${farm.world} grow progress`}
          aria-valuenow={Math.floor(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 flex h-1.5 shrink-0 overflow-hidden rounded bg-secondary"
        >
          <div
            className={`h-full rounded transition-all duration-1000 ${
              status === "Harvested" ? "bg-muted-foreground/40" : "bg-primary"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] tabular-nums text-muted-foreground">
          {Math.floor(percent)}%
        </p>
        <p
          className={`mt-auto truncate ${
            status === "Growing"
              ? "text-[19px] font-semibold tabular-nums"
              : status === "Ready"
                ? "text-[10px] font-bold tracking-[.03em] text-primary"
                : "text-xs text-muted-foreground"
          }`}
        >
          {status === "Growing"
            ? countdown
            : status === "Ready"
              ? "READY TO HARVEST"
              : "Ready to plant"}
        </p>
      </div>
    </article>
  )
}
export function FarmResultsEmpty({
  filter,
  query,
  onClear,
  onAll,
}: {
  filter: FarmFilter
  query: string
  onClear: () => void
  onAll: () => void
}) {
  const messages = {
    All: ["No farms found", "Try a different world or seed name."],
    Ready: [
      "No ready farms",
      "Your growing farms will appear here when they're ready.",
    ],
    Growing: [
      "No growing farms",
      "Add a farm or replant a harvested world to start growing.",
    ],
    Harvested: [
      "No harvested farms",
      "Your collected farms will appear here, ready to replant.",
    ],
    Pinned: [
      "No pinned farms",
      "Star a farm to keep your favorite worlds close.",
    ],
  }
  const [title, description] = query.trim() ? messages.All : messages[filter]
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-border px-5 py-8 text-center"
    >
      <h2 className="font-pixel text-2xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-64 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
      <button
        onClick={query.trim() ? onClear : onAll}
        className="mt-3 min-h-11 text-xs font-semibold text-accent"
      >
        {query.trim() ? "Clear search" : "Show all farms"}
      </button>
    </div>
  )
}
