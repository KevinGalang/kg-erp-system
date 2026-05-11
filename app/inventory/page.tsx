"use client";

import { useMemo, useState, useRef } from "react";
import PageTitle from "@/components/PageTitle";
import { Search, Plus, Minus, Upload, ChevronDown, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type InventoryStatus = "Healthy" | "Low Stocks" | "Critical";

type InventoryRow = {
  date: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
  vendor: string;
  leadTime: number;
  currentQty: number;
  onOrder: number;
  sell90Day: number;
  weeklyRate: number;
  qtyNeeded: number;
  qtyApproved: number;
  daysOfInventory: number;
  status: InventoryStatus;
};

const sampleData: InventoryRow[] = [
  { date: "2026-05-11", productTitle: "Product A", variantTitle: "Red / Large", sku: "SKU-1001", vendor: "Vendor 1", leadTime: 7, currentQty: 240, onOrder: 0, sell90Day: 180, weeklyRate: 14, qtyNeeded: 60, qtyApproved: 0, daysOfInventory: 120, status: "Healthy" },
  { date: "2026-05-11", productTitle: "Product B", variantTitle: "Blue / Small", sku: "SKU-1002", vendor: "Vendor 2", leadTime: 14, currentQty: 40, onOrder: 20, sell90Day: 120, weeklyRate: 9, qtyNeeded: 80, qtyApproved: 0, daysOfInventory: 30, status: "Low Stocks" },
  { date: "2026-05-11", productTitle: "Product C", variantTitle: "Default", sku: "SKU-1003", vendor: "Vendor 3", leadTime: 21, currentQty: 12, onOrder: 0, sell90Day: 100, weeklyRate: 7, qtyNeeded: 88, qtyApproved: 0, daysOfInventory: 10, status: "Critical" },
  { date: "2026-05-10", productTitle: "Product D", variantTitle: "Green / Medium", sku: "SKU-1004", vendor: "Vendor 1", leadTime: 10, currentQty: 310, onOrder: 50, sell90Day: 250, weeklyRate: 19, qtyNeeded: 40, qtyApproved: 0, daysOfInventory: 111, status: "Healthy" },
  { date: "2026-05-10", productTitle: "Product E", variantTitle: "Black / XL", sku: "SKU-1005", vendor: "Vendor 2", leadTime: 12, currentQty: 90, onOrder: 10, sell90Day: 140, weeklyRate: 10, qtyNeeded: 50, qtyApproved: 0, daysOfInventory: 57, status: "Low Stocks" },
  { date: "2026-05-10", productTitle: "Product F", variantTitle: "White / S", sku: "SKU-1006", vendor: "Vendor 3", leadTime: 30, currentQty: 8, onOrder: 0, sell90Day: 90, weeklyRate: 7, qtyNeeded: 82, qtyApproved: 0, daysOfInventory: 8, status: "Critical" },
];

type ColumnFilterKey = "productTitle" | "variantTitle" | "sku" | "vendor" | "status";
type UploadType = "inventory" | "vidal90" | "pd90" | "onorder" | null;

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [approvedQtyBySku, setApprovedQtyBySku] = useState<Record<string, number>>({});
  const [activeApprovedSku, setActiveApprovedSku] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [columnFilters, setColumnFilters] = useState<Record<ColumnFilterKey, string>>({
    productTitle: "All", variantTitle: "All", sku: "All", vendor: "All", status: "All",
  });
  const [openDropdown, setOpenDropdown] = useState<ColumnFilterKey | null>(null);

  // Upload modal state
  const [uploadType, setUploadType] = useState<UploadType>(null);
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().slice(0, 10));
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dates = useMemo(() => {
    return Array.from(new Set(sampleData.map((r) => r.date))).sort((a, b) => b.localeCompare(a));
  }, []);

  const latestDate = dates[0] ?? "";
  const effectiveDate = selectedDate || latestDate;

  const uniqueValues = (key: ColumnFilterKey) =>
    Array.from(new Set(sampleData.map((r) => String(r[key])))).sort();

  const filteredRows = useMemo(() => {
    return sampleData.filter((row) => {
      const matchesDate = row.date === effectiveDate;
      const query = search.toLowerCase();
      const matchesSearch = !query ||
        row.sku.toLowerCase().includes(query) ||
        row.productTitle.toLowerCase().includes(query) ||
        row.variantTitle.toLowerCase().includes(query) ||
        row.vendor.toLowerCase().includes(query);
      const matchesColumns = (Object.keys(columnFilters) as ColumnFilterKey[]).every(
        (key) => columnFilters[key] === "All" || String(row[key]) === columnFilters[key]
      );
      return matchesDate && matchesSearch && matchesColumns;
    });
  }, [search, effectiveDate, columnFilters]);

  const setApprovedQty = (sku: string, value: number) => {
    setApprovedQtyBySku((prev) => ({ ...prev, [sku]: Math.max(0, value) }));
  };

  const bumpQty = (sku: string, direction: 1 | -1) => {
    const current = approvedQtyBySku[sku] ?? 0;
    setApprovedQty(sku, current + direction);
  };

  const setColumnFilter = (key: ColumnFilterKey, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
    setOpenDropdown(null);
  };

  const openUploadModal = (type: UploadType) => {
    setUploadType(type);
    setUploadFile(null);
    setUploadMessage(null);
    setUploadDate(new Date().toISOString().slice(0, 10));
  };

  const closeUploadModal = () => {
    setUploadType(null);
    setUploadFile(null);
    setUploadMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadDate) return;
    setUploading(true);
    setUploadMessage(null);

    try {
      const text = await uploadFile.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setUploadMessage({ type: "error", text: "No data found in CSV file." });
        setUploading(false);
        return;
      }

      let tableName = "";
      let mapped: Record<string, string | number>[] = [];

      if (uploadType === "inventory") {
        tableName = "inventory";
        mapped = rows.map((r) => ({
          date: uploadDate,
          product_title: r["Product Title"] ?? r["product_title"] ?? "",
          variant_title: r["Variant Title"] ?? r["variant_title"] ?? "",
          sku: r["SKU"] ?? r["sku"] ?? "",
          vendor: r["Vendor"] ?? r["vendor"] ?? "",
          lead_time: Number(r["Lead Time"] ?? r["lead_time"] ?? 0),
          current_qty: Number(r["Current Qty"] ?? r["current_qty"] ?? 0),
          on_order: Number(r["On Order"] ?? r["on_order"] ?? 0),
          sell_rate_90_day: Number(r["90 Day Sell Rate"] ?? r["sell_rate_90_day"] ?? 0),
          weekly_sell_rate: Number(r["Weekly Sell Rate"] ?? r["weekly_sell_rate"] ?? 0),
          qty_needed: Number(r["Qty Needed"] ?? r["qty_needed"] ?? 0),
          qty_approved: 0,
          days_of_inventory: Number(r["Days of Inventory"] ?? r["days_of_inventory"] ?? 0),
          status: r["Status"] ?? r["status"] ?? "Healthy",
        }));
      } else if (uploadType === "vidal90") {
        tableName = "vidal_90_day_sales";
        mapped = rows.map((r) => ({
          date: uploadDate,
          product_title: r["Product title"] ?? r["Product Title"] ?? "",
          product_variant_title: r["Product variant title"] ?? r["Variant Title"] ?? "",
          product_variant_sku: r["Product variant SKU"] ?? r["SKU"] ?? "",
          net_items_sold: Number(r["Net items sold"] ?? 0),
          gross_sales: Number(r["Gross sales"] ?? 0),
          discounts: Number(r["Discounts"] ?? 0),
          returns: Number(r["Returns"] ?? 0),
          net_sales: Number(r["Net sales"] ?? 0),
          taxes: Number(r["Taxes"] ?? 0),
          total_sales: Number(r["Total sales"] ?? 0),
        }));
      } else if (uploadType === "pd90") {
        tableName = "pd_90_day_sales";
        mapped = rows.map((r) => ({
          date: uploadDate,
          product_title: r["Product title"] ?? r["Product Title"] ?? "",
          product_variant_title: r["Product variant title"] ?? r["Variant Title"] ?? "",
          product_variant_sku: r["Product variant SKU"] ?? r["SKU"] ?? "",
          net_items_sold: Number(r["Net items sold"] ?? 0),
          gross_sales: Number(r["Gross sales"] ?? 0),
          discounts: Number(r["Discounts"] ?? 0),
          returns: Number(r["Returns"] ?? 0),
          net_sales: Number(r["Net sales"] ?? 0),
          taxes: Number(r["Taxes"] ?? 0),
          total_sales: Number(r["Total sales"] ?? 0),
        }));
      } else if (uploadType === "onorder") {
        tableName = "on_order";
        mapped = rows.map((r) => ({
          date: uploadDate,
          sku: r["SKU"] ?? r["sku"] ?? "",
          product_name: r["Product Name"] ?? r["product_name"] ?? "",
          qty: Number(r["Qty"] ?? r["qty"] ?? 0),
        }));
      }

      const { error } = await supabase.from(tableName).insert(mapped);

      if (error) {
        setUploadMessage({ type: "error", text: `Upload failed: ${error.message}` });
      } else {
        setUploadMessage({ type: "success", text: `Successfully uploaded ${mapped.length} rows to ${tableName}!` });
      }
    } catch (err) {
      setUploadMessage({ type: "error", text: `Error reading file. Make sure it's a valid CSV.` });
    }

    setUploading(false);
  };

  const uploadLabels: Record<NonNullable<UploadType>, string> = {
    inventory: "Upload Inventory",
    vidal90: "Upload Vidal 90 Day Sales",
    pd90: "Upload PD 90 Day Sales",
    onorder: "Upload On Order",
  };

  const headers: { label: string; key?: ColumnFilterKey; align?: string }[] = [
    { label: "Product Title", key: "productTitle" },
    { label: "Variant Title", key: "variantTitle" },
    { label: "SKU", key: "sku" },
    { label: "Vendor", key: "vendor" },
    { label: "Lead Time", align: "text-right" },
    { label: "Current Qty", align: "text-right" },
    { label: "On Order", align: "text-right" },
    { label: "90 Day Sell Rate", align: "text-right" },
    { label: "Weekly Sell Rate", align: "text-right" },
    { label: "Qty Needed", align: "text-right" },
    { label: "Qty Approved" },
    { label: "Days of Inventory", align: "text-right" },
    { label: "Status", key: "status" },
  ];

  return (
    <div className="space-y-6">
      <PageTitle
        title="Inventory"
        description="Track stock levels, forecasting, vendor distribution, and inventory health."
      />

      {/* Top Controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search SKU, product, vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-slate-900"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Date:</label>
              <select
                value={effectiveDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-900"
              >
                {dates.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <button type="button" onClick={() => openUploadModal("inventory")} className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Upload size={15} /> Upload Inventory
            </button>
            <button type="button" onClick={() => openUploadModal("vidal90")} className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Upload size={15} /> Vidal 90 Day Sales
            </button>
            <button type="button" onClick={() => openUploadModal("pd90")} className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Upload size={15} /> PD 90 Day Sales
            </button>
            <button type="button" onClick={() => openUploadModal("onorder")} className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <Upload size={15} /> On Order
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                {headers.map((h) => (
                  <th key={h.label} className={`whitespace-nowrap px-4 py-3 text-left font-semibold ${h.align ?? ""}`}>
                    {h.key ? (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenDropdown(openDropdown === h.key ? null : h.key!)}
                          className="flex items-center gap-1 hover:text-slate-900"
                        >
                          {h.label}
                          <ChevronDown size={14} className={`transition-transform ${openDropdown === h.key ? "rotate-180" : ""}`} />
                          {columnFilters[h.key!] !== "All" && (
                            <span className="ml-1 rounded-full bg-slate-900 px-1.5 py-0.5 text-xs text-white">
                              {columnFilters[h.key!]}
                            </span>
                          )}
                        </button>
                        {openDropdown === h.key && (
                          <div className="absolute left-0 top-full z-50 mt-1 min-w-[160px] rounded-xl border border-slate-200 bg-white shadow-lg">
                            <button type="button" onClick={() => setColumnFilter(h.key!, "All")} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50">All</button>
                            {uniqueValues(h.key!).map((val) => (
                              <button key={val} type="button" onClick={() => setColumnFilter(h.key!, val)} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50">{val}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : h.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row) => {
                const approvedQty = approvedQtyBySku[row.sku] ?? 0;
                const isActive = activeApprovedSku === row.sku;
                return (
                  <tr key={row.sku} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-4">{row.productTitle}</td>
                    <td className="whitespace-nowrap px-4 py-4">{row.variantTitle}</td>
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-700">{row.sku}</td>
                    <td className="whitespace-nowrap px-4 py-4">{row.vendor}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right">{row.leadTime} days</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{row.currentQty}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{row.onOrder}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{row.sell90Day}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{row.weeklyRate}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-right font-semibold tabular-nums">{row.qtyNeeded}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className={`flex overflow-hidden rounded-xl border bg-white ${isActive ? "border-slate-900" : "border-slate-300"}`}>
                          {isActive && (
                            <button type="button" onClick={() => bumpQty(row.sku, -1)} className="flex h-9 w-9 items-center justify-center border-r border-slate-300 text-slate-600 hover:bg-slate-100">
                              <Minus size={14} />
                            </button>
                          )}
                          <input
                            type="number" min={0} value={approvedQty}
                            onFocus={() => setActiveApprovedSku(row.sku)}
                            onClick={() => setActiveApprovedSku(row.sku)}
                            onChange={(e) => setApprovedQty(row.sku, Number(e.target.value))}
                            className="h-9 w-20 border-0 bg-white px-2 text-center text-sm font-semibold outline-none"
                          />
                          {isActive && (
                            <button type="button" onClick={() => bumpQty(row.sku, 1)} className="flex h-9 w-9 items-center justify-center border-l border-slate-300 text-slate-600 hover:bg-slate-100">
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">{row.daysOfInventory}</td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        row.status === "Healthy" ? "bg-green-100 text-green-700" :
                        row.status === "Low Stocks" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>{row.status}</span>
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-5 py-8 text-center text-sm text-slate-500">No inventory items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">{uploadLabels[uploadType]}</h2>
              <button type="button" onClick={closeUploadModal} className="rounded-lg p-2 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="text-sm font-medium text-slate-700">Select Date</label>
                <input
                  type="date"
                  value={uploadDate}
                  onChange={(e) => setUploadDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Upload CSV File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-900"
                />
              </div>

              {uploadMessage && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
                  uploadMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                }`}>
                  {uploadMessage.text}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button type="button" onClick={closeUploadModal} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!uploadFile || !uploadDate || uploading}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={16} />
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}