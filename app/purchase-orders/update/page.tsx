"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Copy, Edit3, Save, X } from "lucide-react";
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
  updated_at?: string;
};

const statuses = ["Pending", "Sent", "Received", "Under Received", "Over Received"];

export default function PurchaseOrderUpdatePage() {
  const searchParams = useSearchParams();
  const purchaseOrderId = String(searchParams.get("poId") || "").trim();

  const [original, setOriginal] = useState<PurchaseOrderRow | null>(null);
  const [row, setRow] = useState<PurchaseOrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!purchaseOrderId) {
      setMessage("Missing purchase order ID.");
      setLoading(false);
      return;
    }

    fetch(`/api/purchase-orders/${encodeURIComponent(purchaseOrderId)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Purchase order line not found.");
        return data.purchaseOrder;
      })
      .then((purchaseOrder) => {
        setOriginal(purchaseOrder || null);
        setRow(purchaseOrder || null);
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Purchase order line not found.");
        setOriginal(null);
        setRow(null);
      })
      .finally(() => setLoading(false));
  }, [purchaseOrderId]);

  const updateValue = (key: keyof PurchaseOrderRow, value: string | number) => {
    setRow((current) => {
      if (!current) return current;
      const next = { ...current, [key]: value };

      if (key === "qty" || key === "qty_received") {
        next.diff = Number(next.qty || 0) - Number(next.qty_received || 0);
      }

      return next;
    });
  };

  const copyAll = () => {
    setRow((current) => {
      if (!current) return current;

      const qty = Number(current.qty || 0);
      if (!qty) {
        alert("Qty is blank. Cannot copy Qty into Qty Received.");
        return current;
      }

      return {
        ...current,
        qty_received: qty,
        diff: 0,
        status: "Received",
      };
    });
  };

  const saveChanges = async () => {
    if (!row || !original) return;

    const qty = Number(row.qty || 0);
    const qtyReceived = Number(row.qty_received || 0);

    if (["Received", "Under Received", "Over Received"].includes(row.status) && !qty) {
      alert("Qty is blank. Cannot mark this line as received.");
      return;
    }

    if (qtyReceived > 0 && !qty) {
      alert("Qty is blank. Cannot update Qty Received.");
      return;
    }

    setSaving(true);
    setMessage("");

    const changedFields: Record<string, unknown> = {};

    Object.keys(row).forEach((key) => {
      const typedKey = key as keyof PurchaseOrderRow;
      if (row[typedKey] !== original[typedKey]) {
        changedFields[typedKey] = row[typedKey];
      }
    });

    changedFields.diff = Number(row.qty || 0) - Number(row.qty_received || 0);

    const res = await fetch("/api/purchase-orders/update-line", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        match: {
          po_number: original.po_number,
          product_title: original.product_title,
          variant_title: original.variant_title,
        },
        changes: changedFields,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Unable to save purchase order line.");
      setSaving(false);
      return;
    }

    setOriginal(data.purchaseOrder);
    setRow(data.purchaseOrder);
    setEditing(false);
    setSaving(false);
    setMessage("Purchase order line updated.");
  };

  if (loading) return <div className="p-6 text-sm">Loading purchase order...</div>;

  if (!row) {
    return (
      <section className="space-y-4">
        <Link
          href="/purchase-orders"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft size={14} />
          Back to Purchase Orders
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {message || "Purchase order line not found."}
        </div>
      </section>
    );
  }

  const disabled = !editing;

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <PageTitle
          title={`Update PO: ${row.po_number}`}
          description="Edit PO line, copy Qty to Qty Received, and update receiving status."
        />

        <div className="flex gap-2">
          <Link href="/purchase-orders" className="btn-secondary">
            <ArrowLeft size={14} />
            Back to Purchase Orders
          </Link>

          <button type="button" onClick={() => setEditing(true)} className="btn-secondary">
            <Edit3 size={14} />
            Edit
          </button>

          <button type="button" onClick={copyAll} disabled={!editing} className="btn-secondary disabled:opacity-50">
            <Copy size={14} />
            Copy All
          </button>

          <button type="button" onClick={saveChanges} disabled={!editing || saving} className="btn-primary disabled:opacity-50">
            <Save size={14} />
            {saving ? "Saving..." : "Save"}
          </button>

          <Link href="/purchase-orders" className="btn-secondary">
            <X size={14} />
            Close
          </Link>
        </div>
      </div>

      {message && (
        <div className="rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
          {message}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Date">
            <input type="date" disabled={disabled} value={String(row.date || "").slice(0, 10)} onChange={(e) => updateValue("date", e.target.value)} className="input" />
          </Field>

          <Field label="Vendor">
            <input disabled={disabled} value={row.mfg || ""} onChange={(e) => updateValue("mfg", e.target.value)} className="input" />
          </Field>

          <Field label="Product Title">
            <input disabled={disabled} value={row.product_title || ""} onChange={(e) => updateValue("product_title", e.target.value)} className="input" />
          </Field>

          <Field label="Variant">
            <input disabled={disabled} value={row.variant_title || ""} onChange={(e) => updateValue("variant_title", e.target.value)} className="input" />
          </Field>

          <Field label="SKU">
            <input disabled={disabled} value={row.sku || ""} onChange={(e) => updateValue("sku", e.target.value)} className="input" />
          </Field>

          <Field label="Qty.">
            <input type="number" disabled={disabled} value={row.qty || 0} onChange={(e) => updateValue("qty", Number(e.target.value || 0))} className="input" />
          </Field>

          <Field label="Qty Rcvd.">
            <input type="number" disabled={disabled} value={row.qty_received || 0} onChange={(e) => updateValue("qty_received", Number(e.target.value || 0))} className="input" />
          </Field>

          <Field label="Diff.">
            <input disabled value={row.diff || 0} className="input" />
          </Field>

          <Field label="PO #">
            <input disabled={disabled} value={row.po_number || ""} onChange={(e) => updateValue("po_number", e.target.value)} className="input" />
          </Field>

          <Field label="Status">
            <select disabled={disabled} value={row.status || "Pending"} onChange={(e) => updateValue("status", e.target.value)} className="input">
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </Field>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}