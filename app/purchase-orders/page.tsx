"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import PageTitle from "@/components/PageTitle";

type PurchaseOrderRow = {
  id: string;
  date: string;
  mfg: string;
  product_title: string;
  variant_title: string;
  sku: string;
  qty: number;
  qty_received: number;
  diff: number;
  po_number: string;
  status: string;
};

export default function PurchaseOrdersPage() {
  const [rows, setRows] = useState<PurchaseOrderRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch("/api/purchase-orders")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load purchase orders.");
        return data.purchaseOrders || [];
      })
      .then(setRows)
      .catch((error) =>
        setErrorMessage(error instanceof Error ? error.message : "Unable to load purchase orders.")
      )
      .finally(() => setLoading(false));
  }, []);

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;

    return rows.filter((row) =>
      [
        row.date,
        row.mfg,
        row.product_title,
        row.variant_title,
        row.sku,
        row.po_number,
        row.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  return (
    <section className="space-y-4">
      <PageTitle
        title="Purchase Orders"
        description="Track purchase orders, receiving quantities, differences, and status."
      />

      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Search PO, vendor, product, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-xs outline-none focus:border-slate-900"
          />
        </div>

        {errorMessage && (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-xs">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Vendor</th>
                <th className="px-3 py-2 text-left">Product Title</th>
                <th className="px-3 py-2 text-left">Variant</th>
                <th className="px-3 py-2 text-left">SKU</th>
                <th className="px-3 py-2 text-right">Qty.</th>
                <th className="px-3 py-2 text-right">Qty Rcvd.</th>
                <th className="px-3 py-2 text-right">Diff.</th>
                <th className="px-3 py-2 text-left">PO #</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-sm text-slate-500">
                    Loading purchase orders...
                  </td>
                </tr>
              )}

              {!loading &&
                filteredRows.map((row, index) => (
                  <tr key={row.id || index} className="border-t border-slate-100">
                    <td className="px-3 py-2">{String(row.date || "").slice(0, 10)}</td>
                    <td className="px-3 py-2">{row.mfg || ""}</td>
                    <td className="px-3 py-2">{row.product_title || ""}</td>
                    <td className="px-3 py-2">{row.variant_title || ""}</td>
                    <td className="px-3 py-2">{row.sku || ""}</td>
                    <td className="px-3 py-2 text-right">{Number(row.qty || 0)}</td>
                    <td className="px-3 py-2 text-right">{Number(row.qty_received || 0)}</td>
                    <td className="px-3 py-2 text-right">{Number(row.diff || 0)}</td>
                    <td className="px-3 py-2">{row.po_number || ""}</td>
                    <td className="px-3 py-2">{row.status || ""}</td>
                    <td className="px-3 py-2 text-center">
                      <Link
                        href={`/purchase-orders/update?poId=${encodeURIComponent(row.id || "")}`}
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Update
                      </Link>
                    </td>
                  </tr>
                ))}

              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-sm text-slate-500">
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}