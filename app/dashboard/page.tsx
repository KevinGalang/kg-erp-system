import PageTitle from "@/components/PageTitle";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type Item = {
  id?: string;
  product_title?: string;
  product_variant_sku?: string;
  vendor?: string;
  vendor_name?: string;
  inventory_quantity?: number;
  available_qty?: number;
  current_qty?: number;
  qty?: number;
  uom?: number;
  minimum?: number;
  minimum_qty?: number;
  sold_qty?: number;
  sales_qty?: number;
};

type PurchaseOrder = {
  id?: string;
  po_number?: string;
  vendor_name?: string;
  vendor?: string;
  status?: string;
  total_quantity?: number;
};

function getQty(item: Item) {
  return Number(
    item.inventory_quantity ??
      item.available_qty ??
      item.current_qty ??
      item.qty ??
      0
  );
}

function getMinimum(item: Item) {
  return Number(item.minimum ?? item.minimum_qty ?? item.uom ?? 0);
}

function getSold(item: Item) {
  return Number(item.sold_qty ?? item.sales_qty ?? 0);
}

function getVendor(item: Item) {
  return item.vendor_name || item.vendor || "No Vendor";
}

function getItemName(item: Item) {
  return item.product_title || item.product_variant_sku || "Unnamed Item";
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-slate-900"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export default async function DashboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <section>
        <PageTitle
          title="Dashboard"
          description="Quick overview of inventory, purchasing, vendors, and item movement."
        />

        <article className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Missing Supabase environment variables. Please check Vercel
          environment variables.
        </article>
      </section>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: items = [] } = await supabase
    .from("item_master_list")
    .select("*")
    .limit(1000);

  const { data: purchaseOrders = [] } = await supabase
    .from("purchase_orders")
    .select("*")
    .limit(1000);

  const inventoryItems = (items || []) as Item[];
  const orders = (purchaseOrders || []) as PurchaseOrder[];

  const lowStockItems = inventoryItems.filter((item) => {
    const qty = getQty(item);
    const min = getMinimum(item);
    return min > 0 && qty <= min;
  });

  const inTransitOrders = orders.filter((order) => {
    const status = String(order.status || "").toLowerCase();

    return (
      status.includes("transit") ||
      status.includes("in-transit") ||
      status.includes("shipped") ||
      status.includes("ordered")
    );
  });

  const openOrders = orders.filter((order) => {
    const status = String(order.status || "").toLowerCase();

    return (
      status.includes("open") ||
      status.includes("pending") ||
      status.includes("approved") ||
      status.includes("ordered")
    );
  });

  const topSellingItems = [...inventoryItems]
    .sort((a, b) => getSold(b) - getSold(a))
    .slice(0, 10);

  const slowMovers = [...inventoryItems]
    .sort((a, b) => getSold(a) - getSold(b))
    .slice(0, 10);

  const vendorTotals = inventoryItems.reduce<Record<string, number>>(
    (acc, item) => {
      const vendor = getVendor(item);
      acc[vendor] = (acc[vendor] || 0) + getQty(item);
      return acc;
    },
    {}
  );

  const topVendors = Object.entries(vendorTotals)
    .map(([vendor, qty]) => ({ vendor, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const maxSold = Math.max(...topSellingItems.map(getSold), 1);
  const maxVendorQty = Math.max(...topVendors.map((vendor) => vendor.qty), 1);

  const summaryCards = [
    { label: "Total Inventory Items", value: inventoryItems.length },
    { label: "Low Stock Items", value: lowStockItems.length },
    { label: "Open Purchase Orders", value: openOrders.length },
    { label: "In-transit Orders", value: inTransitOrders.length },
  ];

  return (
    <section>
      <PageTitle
        title="Dashboard"
        description="Quick overview of inventory, purchasing, vendors, and item movement."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {card.value}
            </p>
          </article>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            Top 10 Selling Items
          </h3>

          <div className="space-y-4">
            {topSellingItems.map((item) => (
              <div key={item.id || getItemName(item)}>
                <div className="mb-1 flex justify-between gap-4 text-sm">
                  <span className="truncate text-slate-700">
                    {getItemName(item)}
                  </span>
                  <span className="font-medium text-slate-900">
                    {getSold(item)}
                  </span>
                </div>

                <ProgressBar value={getSold(item)} max={maxSold} />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            Top 5 Vendors
          </h3>

          <div className="space-y-4">
            {topVendors.map((vendor) => (
              <div key={vendor.vendor}>
                <div className="mb-1 flex justify-between gap-4 text-sm">
                  <span className="truncate text-slate-700">
                    {vendor.vendor}
                  </span>
                  <span className="font-medium text-slate-900">
                    {vendor.qty}
                  </span>
                </div>

                <ProgressBar value={vendor.qty} max={maxVendorQty} />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            Low Stock Items
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Min/UOM</th>
                </tr>
              </thead>

              <tbody>
                {lowStockItems.slice(0, 10).map((item) => (
                  <tr
                    key={item.id || getItemName(item)}
                    className="border-b last:border-0"
                  >
                    <td className="py-2 text-slate-800">{getItemName(item)}</td>
                    <td className="py-2 text-slate-500">
                      {item.product_variant_sku || "-"}
                    </td>
                    <td className="py-2 text-right font-medium text-red-600">
                      {getQty(item)}
                    </td>
                    <td className="py-2 text-right text-slate-600">
                      {getMinimum(item)}
                    </td>
                  </tr>
                ))}

                {lowStockItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">
                      No low stock items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            In-transit Orders
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">PO</th>
                  <th className="py-2">Vendor</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Qty</th>
                </tr>
              </thead>

              <tbody>
                {inTransitOrders.slice(0, 10).map((order) => (
                  <tr
                    key={order.id || order.po_number}
                    className="border-b last:border-0"
                  >
                    <td className="py-2 text-slate-800">
                      {order.po_number || order.id || "-"}
                    </td>
                    <td className="py-2 text-slate-600">
                      {order.vendor_name || order.vendor || "-"}
                    </td>
                    <td className="py-2 text-slate-600">
                      {order.status || "-"}
                    </td>
                    <td className="py-2 text-right font-medium text-slate-900">
                      {order.total_quantity || 0}
                    </td>
                  </tr>
                ))}

                {inTransitOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500">
                      No in-transit orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            Top 10 Slow Movers
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2">SKU</th>
                  <th className="py-2">Vendor</th>
                  <th className="py-2 text-right">Sold</th>
                  <th className="py-2 text-right">Current Qty</th>
                </tr>
              </thead>

              <tbody>
                {slowMovers.map((item) => (
                  <tr
                    key={item.id || getItemName(item)}
                    className="border-b last:border-0"
                  >
                    <td className="py-2 text-slate-800">{getItemName(item)}</td>
                    <td className="py-2 text-slate-500">
                      {item.product_variant_sku || "-"}
                    </td>
                    <td className="py-2 text-slate-600">{getVendor(item)}</td>
                    <td className="py-2 text-right text-slate-600">
                      {getSold(item)}
                    </td>
                    <td className="py-2 text-right font-medium text-slate-900">
                      {getQty(item)}
                    </td>
                  </tr>
                ))}

                {slowMovers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-slate-500">
                      No slow movers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
