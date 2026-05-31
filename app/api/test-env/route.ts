import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    shopDomain: !!process.env.SHOPIFY_STORE_DOMAIN,
  });
}
