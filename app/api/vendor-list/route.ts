import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";

type EnvMap = Record<string, string | undefined>;

type VendorPayload = {
  mfg?: string;
  lead_time?: string;
  review_period?: string;
  order_at?: string;
  link?: string;
  username?: string;
  password?: string;
  contact?: string;
  email?: string;
  phone?: string;
};

const selectColumns =
  "id, mfg, lead_time, review_period, order_at, link, username, password, contact, email, phone";

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

function requireText(payload: VendorPayload, key: keyof VendorPayload) {
  const value = payload[key]?.trim();

  if (!value) {
    throw new Error(`Missing ${key}`);
  }

  return value;
}

export async function GET() {
  try {
    const env = await getEnvMap();
    const supabaseAdmin = getSupabaseAdmin(env);
    const { data, error } = await supabaseAdmin
      .from("vendor_list")
      .select(selectColumns)
      .order("mfg", { ascending: true });

    if (error) {
      throw new Error(`Supabase vendor fetch failed: ${error.message}`);
    }

    return NextResponse.json({
      vendors: data ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown vendor list fetch error";

    return NextResponse.json(
      {
        error: message,
        vendors: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as VendorPayload;
    const row = {
      mfg: requireText(payload, "mfg"),
      lead_time: requireText(payload, "lead_time"),
      review_period: requireText(payload, "review_period"),
      order_at: requireText(payload, "order_at"),
      link: requireText(payload, "link"),
      username: requireText(payload, "username"),
      password: requireText(payload, "password"),
      contact: requireText(payload, "contact"),
      email: requireText(payload, "email"),
      phone: requireText(payload, "phone"),
    };

    const env = await getEnvMap();
    const supabaseAdmin = getSupabaseAdmin(env);
    const { data, error } = await supabaseAdmin
      .from("vendor_list")
      .insert(row)
      .select(selectColumns)
      .single();

    if (error) {
      throw new Error(`Supabase vendor insert failed: ${error.message}`);
    }

    return NextResponse.json({
      vendor: data,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown vendor list insert error";

    return NextResponse.json(
      {
        error: message,
      },
      { status: 400 }
    );
  }
}
