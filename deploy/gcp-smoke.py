#!/usr/bin/env python3
"""Read-only Cloud Run smoke checks for Saan's live revision."""

import json
import sys
import time
import urllib.error
import urllib.request


def get(url: str) -> tuple[int, bytes, str]:
    request = urllib.request.Request(
        url,
        headers={"Accept": "application/json,text/html", "User-Agent": "saan-lab5-smoke/1"},
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return response.status, response.read(), response.headers.get("Content-Type", "")


def retry(check, label: str) -> None:
    last_error: Exception | None = None
    for attempt in range(5):
        try:
            check()
            print(f"PASS {label}")
            return
        except (OSError, TimeoutError, ValueError, urllib.error.URLError) as error:
            last_error = error
            if attempt < 4:
                time.sleep(3)
    raise RuntimeError(f"Smoke check failed: {label}: {last_error}")


def main() -> int:
    if len(sys.argv) != 2 or not sys.argv[1].startswith("https://"):
        print("Usage: python3 deploy/gcp-smoke.py https://SERVICE_URL", file=sys.stderr)
        return 2
    base_url = sys.argv[1].rstrip("/")

    def check_health() -> None:
        status, body, _ = get(f"{base_url}/api/health")
        if status != 200 or json.loads(body).get("status") != "ok":
            raise ValueError("Database-backed /api/health did not return status=ok")

    def check_home() -> None:
        status, body, content_type = get(base_url + "/")
        if status != 200 or "text/html" not in content_type.lower() or b"<html" not in body.lower():
            raise ValueError("The public home route did not return HTML")

    retry(check_health, "/api/health (PostgreSQL reachable)")
    retry(check_home, "/ (HTML)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RuntimeError as error:
        print(error, file=sys.stderr)
        raise SystemExit(1)
