import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

import pandas as pd


ID_COLUMNS = ["Product title", "Product variant title", "Product variant SKU"]


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


def parse_week_start(value: object) -> str | None:
    parsed = pd.to_datetime(value, errors="coerce")

    if pd.isna(parsed):
        return None

    return parsed.date().isoformat()


def parse_quantity(value: object) -> float:
    text = clean_value(value)

    if not text:
        return 0

    try:
        return float(text.replace(",", ""))
    except ValueError:
        return 0


def post_chunks(
    supabase_url: str,
    service_role_key: str,
    rows: list[dict[str, str | float]],
) -> None:
    endpoint = (
        f"{supabase_url}/rest/v1/pd_90_day_sale"
        "?on_conflict=product_variant_sku,week_start"
    )

    for start in range(0, len(rows), 500):
        chunk = rows[start:start + 500]
        request = urllib.request.Request(
            endpoint,
            data=json.dumps(chunk).encode("utf-8"),
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
                    raise RuntimeError(
                        f"Supabase import failed: {response.status} {body}"
                    )
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            raise RuntimeError(
                f"Supabase import failed: {error.code} {body}"
            ) from error


def main() -> int:
    workbook_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(
        r"C:\Users\mcgal\OneDrive\Desktop\PD 90 day Sales.xltm"
    )
    env = load_env(Path(".env.local"))
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    service_role_key = env.get("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_role_key:
        raise RuntimeError("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    df = pd.read_excel(workbook_path)
    missing = [column for column in ID_COLUMNS if column not in df.columns]

    if missing:
        raise RuntimeError(f"Missing required columns: {', '.join(missing)}")

    week_columns = [
        column for column in df.columns
        if column not in ID_COLUMNS and parse_week_start(column)
    ]
    rows_by_key: dict[tuple[str, str], dict[str, str | float]] = {}

    for _, source_row in df.iterrows():
        sku = clean_value(source_row["Product variant SKU"])

        if not sku:
            continue

        for week_column in week_columns:
            week_start = parse_week_start(week_column)

            if not week_start:
                continue

            rows_by_key[(sku, week_start)] = {
                "product_title": clean_value(source_row["Product title"]),
                "product_variant_title": clean_value(source_row["Product variant title"]),
                "product_variant_sku": sku,
                "week_start": week_start,
                "quantity": parse_quantity(source_row[week_column]),
                "source_file": workbook_path.name,
            }

    rows = list(rows_by_key.values())
    post_chunks(supabase_url, service_role_key, rows)

    print(
        json.dumps(
            {
                "source_rows": len(df),
                "week_columns": len(week_columns),
                "imported": len(rows),
                "source": str(workbook_path),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
