import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "@supabase/supabase-js";
import {
  buildInventoryForecastRows,
  fetchForecastMasterData,
  type ShopifySnapshotRow,
  toInventoryClientRow,
} from "@/lib/inventoryForecast";

export const runtime = "nodejs";

type EnvMap = Record<string, string | undefined>;

type Sales90DayResponse = {
  sales: Array<{
    sku: string;
    quantity: number;
  }>;
};

async function getEnvMap(): Promise<EnvMap> {
  try {
    const context = await getCloudflareContext({ async: true });
    return {
      ...process.env,
      ...(context.env as EnvMap),
    };
  } catch {
    return process.env;
  }
}

function getSupabaseAdmin(env: EnvMap) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getSalesBySku(origin: string) {
  const response = await fetch(
    `${origin}/api/shopify/sales-90-day`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return new Map<string, number>();
  }

  const data = (await response.json()) as Sales90DayResponse;

  return new Map(data.sales.map((item) => [item.sku, item.quantity]));
}

export async function GET(request: Request) {
  try {
    const env = await getEnvMap();
    const supabaseAdmin = getSupabaseAdmin(env);

    const { data: latest, error: latestError } = await supabaseAdmin
      .from("shopify_inventory_snapshots")
      .select("snapshot_date")
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
      throw new Error(`Supabase latest snapshot failed: ${latestError.message}`);
    }

    if (!latest?.snapshot_date) {
      return NextResponse.json({
        snapshotDate: null,
        rows: [],
      });
    }

    const { data, error } = await supabaseAdmin
      .from("shopify_inventory_snapshots")
      .select("snapshot_date, product_title, variant_title, sku, vendor, available_quantity")
      .eq("snapshot_date", latest.snapshot_date)
      .order("product_title", { ascending: true });

    if (error) {
      throw new Error(`Supabase inventory fetch failed: ${error.message}`);
    }

    const salesBySku = await getSalesBySku(new URL(request.url).origin);
    const { vendorByName, itemBySku } =
      await fetchForecastMasterData(supabaseAdmin);
    const forecastRows = buildInventoryForecastRows(
      (data ?? []) as ShopifySnapshotRow[],
      salesBySku,
      vendorByName,
      itemBySku
    );

    return NextResponse.json({
      snapshotDate: latest.snapshot_date,
      rows: forecastRows.map(toInventoryClientRow),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown inventory fetch error";

    return NextResponse.json(
      {
        error: message,
        rows: [],
      },
      { status: 500 }
    );
  }
}
