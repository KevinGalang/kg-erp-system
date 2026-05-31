import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const runtime = "nodejs";

type EnvMap = Record<string, string | undefined>;

type ShopifyTokenResponse = {
  access_token: string;
  scope?: string;
  expires_in?: number;
};

type InventoryRow = {
  snapshot_date: string;
  product_title: string;
  variant_title: string;
  product_sku: string;
  quantity: number;
};

type ShopifyInventoryResponse = {
  productVariants: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    edges: Array<{
      node: {
        title: string;
        sku: string | null;
        product: {
          title: string;
        };
        inventoryItem: {
          inventoryLevels: {
            edges: Array<{
              node: {
                quantities: Array<{
                  name: string;
                  quantity: number;
                }>;
              };
            }>;
          };
        } | null;
      };
    }>;
  };
};

const SHOPIFY_API_VERSION = "2026-04";

const INVENTORY_QUERY = `
  query InventorySync($cursor: String) {
    productVariants(first: 100, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          title
          sku
          product {
            title
          }
          inventoryItem {
            inventoryLevels(first: 20) {
              edges {
                node {
                  quantities(names: ["available"]) {
                    name
                    quantity
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

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

function requireEnv(env: EnvMap, name: string): string {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

function getSupabaseAdmin(env: EnvMap) {
  const supabaseUrl =
    env.NEXT_PUBLIC_SUPABASE_URL || "https://nlakcdkuktclsncaqotk.supabase.co";

  const serviceRoleKey =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

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

async function getShopifyAccessToken(env: EnvMap) {
  const shop =
    env.SHOPIFY_STORE_DOMAIN ||
    env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
    "nutrition-dynamic.myshopify.com";

  const clientId =
    env.SHOPIFY_CLIENT_ID ||
    env.NEXT_PUBLIC_SHOPIFY_CLIENT_ID;

  const clientSecret =
    env.SHOPIFY_CLIENT_SECRET ||
    env.NEXT_PUBLIC_SHOPIFY_CLIENT_SECRET;

  if (!clientId) {
    throw new Error("Missing SHOPIFY_CLIENT_ID");
  }

  if (!clientSecret) {
    throw new Error("Missing SHOPIFY_CLIENT_SECRET");
  }

  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Shopify token request failed: ${errorText}`);
  }

  const data = (await response.json()) as ShopifyTokenResponse;

  if (!data.access_token) {
    throw new Error("Shopify did not return an access token");
  }

  return data.access_token;
}

async function shopifyGraphQL<T>(
  env: EnvMap,
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const shop =
    env.SHOPIFY_STORE_DOMAIN ||
    env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN ||
    "nutrition-dynamic.myshopify.com";

  const response = await fetch(
    `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    }
  );

  const result = await response.json();

  if (!response.ok || result.errors) {
    throw new Error(
      `Shopify GraphQL error: ${JSON.stringify(result.errors || result)}`
    );
  }

  return result.data as T;
}

async function getInventoryRows(env: EnvMap, accessToken: string) {
  const snapshotDate = new Date().toISOString().slice(0, 10);
  const rows: InventoryRow[] = [];

  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data: ShopifyInventoryResponse =
      await shopifyGraphQL<ShopifyInventoryResponse>(
        env,
        accessToken,
        INVENTORY_QUERY,
        { cursor }
      );

    for (const edge of data.productVariants.edges) {
      const variant = edge.node;

      if (!variant.sku) {
        continue;
      }

      const quantity =
        variant.inventoryItem?.inventoryLevels.edges.reduce((total, level) => {
          const available =
            level.node.quantities.find((item) => item.name === "available")
              ?.quantity ?? 0;

          return total + available;
        }, 0) ?? 0;

      rows.push({
        snapshot_date: snapshotDate,
        product_title: variant.product.title,
        variant_title: variant.title,
        product_sku: variant.sku,
        quantity,
      });
    }

    hasNextPage = data.productVariants.pageInfo.hasNextPage;
    cursor = data.productVariants.pageInfo.endCursor;
  }

  return rows;
}

export async function GET() {
  try {
    const env = await getEnvMap();

    const supabaseAdmin = getSupabaseAdmin(env);
    const accessToken = await getShopifyAccessToken(env);
    const rows = await getInventoryRows(env, accessToken);

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        inserted: 0,
        message: "No Shopify inventory rows found.",
      });
    }

    const { error } = await supabaseAdmin
      .from("shopify_inventory_snapshots")
      .insert(rows);

    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      inserted: rows.length,
      snapshotDate: rows[0]?.snapshot_date,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown sync error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
