import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

import pandas as pd


REQUIRED_COLUMNS = {
    "MFG": "mfg",
    "LEAD TIME": "lead_time",
    "REVIEW PERIOD": "review_period",
    "Order at": "order_at",
    "Link": "link",
    "Username": "username",
    "Password": "password",
    "Contact": "contact",
    "Email": "email",
    "Phone": "phone",
}


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}

    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.lstrip().startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        env[key.strip()] = value.strip()

    return env


def clean_value(value: object) -> str:
    if pd.isna(value):
        return ""

    text = str(value).strip()

    if text.endswith(".0"):
        return text[:-2]

    return text


def main() -> int:
    workbook_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(
        r"C:\Users\mcgal\Downloads\Vendor Details (1).xlsx"
    )
    env = load_env(Path(".env.local"))
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    service_role_key = env.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        raise RuntimeError("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    df = pd.read_excel(workbook_path)
    missing = [column for column in REQUIRED_COLUMNS if column not in df.columns]

    if missing:
        raise RuntimeError(f"Missing required columns: {', '.join(missing)}")

    rows_by_mfg: dict[str, dict[str, str]] = {}
    source_row_count = 0

    for _, source_row in df.iterrows():
        source_row_count += 1
        row = {
            target: clean_value(source_row[source])
            for source, target in REQUIRED_COLUMNS.items()
        }

        if not row["mfg"]:
            continue

        rows_by_mfg[row["mfg"]] = row

    rows = list(rows_by_mfg.values())
    endpoint = f"{supabase_url}/rest/v1/vendor_list?on_conflict=mfg"
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(rows).encode("utf-8"),
        headers={
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            if response.status >= 400:
                body = response.read().decode("utf-8", errors="replace")
                raise RuntimeError(f"Supabase import failed: {response.status} {body}")
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Supabase import failed: {error.code} {body}") from error

    print(
        json.dumps(
            {
                "source_rows": source_row_count,
                "imported": len(rows),
                "duplicates_removed": source_row_count - len(rows),
                "source": str(workbook_path),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
