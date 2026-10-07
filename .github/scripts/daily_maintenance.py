"""Append a small, randomly selected maintenance review checklist."""

from datetime import datetime, timezone
from pathlib import Path
import os
import random


CHECKLIST_ITEMS = [
    "Review whether the README setup and available npm scripts match the current project.",
    "Review Expo SDK 57 package compatibility against the versioned Expo documentation.",
    "Review dependency advisories and note any packages that need attention.",
    "Review notification permission and delivery behavior on supported platforms.",
    "Review farm timer persistence and confirm unrelated edits do not reset timers.",
    "Review storage parsing and recovery behavior for invalid or older saved data.",
    "Review tests for the main farm creation, update, harvest, and timer flows.",
    "Review image and font assets for clear licensing and attribution.",
    "Review accessibility labels and touch targets on the main screens.",
    "Review loading, empty, and error states for clear user guidance.",
    "Review whether project documentation still describes the local-first behavior accurately.",
    "Review the latest change for a focused scope and a clear commit message.",
]


def main() -> None:
    log_path = Path("docs/daily-maintenance.md")
    log_path.parent.mkdir(parents=True, exist_ok=True)

    item_count = random.randint(4, 12)
    selected_items = random.sample(CHECKLIST_ITEMS, item_count)
    run_id = os.environ.get("GITHUB_RUN_ID", "local")
    run_attempt = os.environ.get("GITHUB_RUN_ATTEMPT", "1")
    date = datetime.now(timezone.utc).date().isoformat()

    entry = [
        f"## {date} — run {run_id}.{run_attempt}",
        "",
        "Generated review checklist (these prompts do not claim the checks were performed):",
        *[f"- [ ] {item}" for item in selected_items],
        "",
    ]

    with log_path.open("a", encoding="utf-8", newline="\n") as log:
        if log_path.stat().st_size:
            log.write("\n")
        log.write("\n".join(entry))


if __name__ == "__main__":
    main()
