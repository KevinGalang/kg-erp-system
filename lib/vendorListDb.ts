import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parseVendorSettings } from "@/lib/vendorSettings";

export const vendorBaseColumns =
  "id, mfg, lead_time, review_period, order_at, link, username, password, contact, email, phone";

export function normalizeVendorRow(row: Record<string, unknown>) {
  return {
    ...row,
    settings: parseVendorSettings(row.settings),
  };
}

export function isMissingSettingsColumnError(error: {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
} | null) {
  if (!error) {
    return false;
  }

  const text = [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    text.includes("settings") &&
    (text.includes("does not exist") ||
      text.includes("could not find") ||
      error.code === "42703")
  );
}

export async function fetchVendorRows(supabaseAdmin: SupabaseClient) {
  const { data, error } = await supabaseAdmin
    .from("vendor_list")
    .select(vendorBaseColumns)
    .order("mfg", { ascending: true });

  if (error) {
    throw new Error(`Supabase vendor fetch failed: ${error.message}`);
  }

  return (data ?? []).map((row) => normalizeVendorRow(row));
}

export async function fetchVendorById(
  supabaseAdmin: SupabaseClient,
  id: string
) {
  const { data, error } = await supabaseAdmin
    .from("vendor_list")
    .select(vendorBaseColumns)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase vendor fetch failed: ${error.message}`);
  }

  return data ? normalizeVendorRow(data) : null;
}

export async function fetchVendorSettings(
  supabaseAdmin: SupabaseClient,
  id: string
) {
  const { data, error } = await supabaseAdmin
    .from("vendor_list")
    .select("settings")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingSettingsColumnError(error)) {
      return null;
    }

    throw new Error(`Supabase vendor settings fetch failed: ${error.message}`);
  }

  return parseVendorSettings(data?.settings);
}

export async function fetchVendorWithSettings(
  supabaseAdmin: SupabaseClient,
  id: string
) {
  const vendor = await fetchVendorById(supabaseAdmin, id);

  if (!vendor) {
    return null;
  }

  const settings = await fetchVendorSettings(supabaseAdmin, id);

  if (settings) {
    return {
      ...vendor,
      settings,
    };
  }

  return vendor;
}

export async function updateVendorSettings(
  supabaseAdmin: SupabaseClient,
  id: string,
  settings: unknown
) {
  const parsedSettings = parseVendorSettings(settings);
  const { data, error } = await supabaseAdmin
    .from("vendor_list")
    .update({ settings: parsedSettings })
    .eq("id", id)
    .select("settings")
    .maybeSingle();

  if (error) {
    if (isMissingSettingsColumnError(error)) {
      throw new Error(
        "Vendor settings storage is not set up yet. Run supabase/vendor_list_settings.sql in the Supabase SQL editor."
      );
    }

    throw new Error(`Supabase vendor settings update failed: ${error.message}`);
  }

  if (!data) {
    throw new Error("Vendor not found.");
  }

  return parseVendorSettings(data.settings);
}
