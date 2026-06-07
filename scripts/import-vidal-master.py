import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

import pandas as pd


REQUIRED_COLUMNS = {
    "Product Name",
    "SKU",
    "Company",
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


def post_upsert(
    supabase_url: str,
    service_role_key: str,
    table: str,
    conflict_key: str,
    rows: list[dict[str, str]],
) -> None:
    if not rows:
        return

    endpoint = f"{supabase_url}/rest/v1/{table}?on_conflict={conflict_key}"
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


def main() -> int:
    workbook_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(
        r"C:\Users\mcgal\Downloads\Vidal.xlsx"
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

    item_rows_by_sku: dict[str, dict[str, str]] = {}
    vendor_rows_by_mfg: dict[str, dict[str, str]] = {}
    source_row_count = 0

    for _, source_row in df.iterrows():
        source_row_count += 1
        product_name = clean_value(source_row["Product Name"])
        sku = clean_value(source_row["SKU"])
        company = clean_value(source_row["Company"])

        if not sku:
            continue

        item_rows_by_sku[sku] = {
            "product_title": product_name,
            "product_variant_title": "Default Title",
            "product_variant_sku": sku,
            "product_vendor": company,
            "uom": "1",
        }

        if company:
            vendor_rows_by_mfg[company] = {
                "mfg": company,
                "lead_time": "XXX",
                "review_period": "XXX",
                "order_at": "XXX",
                "link": "XXX",
                "username": "XXX",
                "password": "XXX",
                "contact": "XXX",
                "email": "XXX",
                "phone": "XXX",
            }

    item_rows = list(item_rows_by_sku.values())
    vendor_rows = list(vendor_rows_by_mfg.values())

    post_upsert(
        supabase_url,
        service_role_key,
        "item_master_list",
        "product_variant_sku",
        item_rows,
    )
    post_upsert(
        supabase_url,
        service_role_key,
        "vendor_list",
        "mfg",
        vendor_rows,
    )

    print(
        json.dumps(
            {
                "source_rows": source_row_count,
                "items_imported": len(item_rows),
                "vendors_imported": len(vendor_rows),
                "duplicates_removed": source_row_count - len(item_rows),
                "source": str(workbook_path),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
