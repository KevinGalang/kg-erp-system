import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    keys: Object.keys(process.env)
      .filter((k) =>
        k.includes("SHOPIFY") ||
        k.includes("SUPABASE")
      )
      .sort(),

    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "FOUND" : "MISSING",
    supabaseAnon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "FOUND" : "MISSING",
    serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? "FOUND" : "MISSING",
    shopDomain: process.env.SHOPIFY_STORE_DOMAIN ? "FOUND" : "MISSING",
    shopClientId: process.env.SHOPIFY_CLIENT_ID ? "FOUND" : "MISSING",
    shopClientSecret: process.env.SHOPIFY_CLIENT_SECRET ? "FOUND" : "MISSING",
  });
}
