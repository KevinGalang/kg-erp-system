"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Mail, Plus, Save, Trash2 } from "lucide-react";
import PageTitle from "@/components/PageTitle";
import {
  DEFAULT_VENDOR_SETTINGS,
  PO_TABLE_FIELD_OPTIONS,
  VendorSettings,
  parseVendorSettings,
  createTableColumn,
} from "@/lib/vendorSettings";

type VendorDetails = {
  id: string;
  mfg: string;
  code: string;
  lead_time: string;
  review_period: string;
  order_at: string;
  link: string;
  username: string;
  password: string;
  contact: string;
  email: string;
  phone: string;
  settings?: VendorSettings;
};

const vendorDetailFields: Array<{
  key: keyof VendorDetails;
  label: string;
  type?: string;
}> = [
  { key: "mfg", label: "MFG" },
  { key: "code", label: "CODE" },
  { key: "lead_time", label: "LEAD TIME" },
  { key: "review_period", label: "REVIEW PERIOD" },
  { key: "order_at", label: "ORDER AT" },
  { key: "link", label: "LINK" },
  { key: "username", label: "USERNAME" },
  { key: "password", label: "PASSWORD", type: "password" },
  { key: "contact", label: "CONTACT" },
  { key: "email", label: "EMAIL" },
  { key: "phone", label: "PHONE" },
];

export default function VendorSettingsPage() {
  const params = useParams<{ id: string }>();
  const vendorId = params.id;

  const [vendor, setVendor] = useState<VendorDetails | null>(null);
  const [settings, setSettings] = useState<VendorSettings>(
    DEFAULT_VENDOR_SETTINGS
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const placeholders = useMemo(
    () => [
      "{{poNumber}}",
      "{{vendor}}",
      "{{customer}}",
      "{{shipDate}}",
      "{{total}}",
      "{{contact}}",
      "{{table}}",
    ],
    []
  );

  useEffect(() => {
    fetch(`/api/vendor-list/${vendorId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load vendor.");
        return data.vendor;
      })
      .then((loadedVendor) => {
        setVendor({
          ...loadedVendor,
          code: loadedVendor?.code || "",
        });
        setSettings(parseVendorSettings(loadedVendor?.settings));
      })
      .catch(() => setVendor(null))
      .finally(() => setLoading(false));
  }, [vendorId]);

  const updateVendor = (key: keyof VendorDetails, value: string) => {
    setVendor((current) => (current ? { ...current, [key]: value } : current));
  };

  const saveSettings = async () => {
    if (!vendor) return;

    setSaving(true);

    try {
      const res = await fetch(`/api/vendor-list/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mfg: vendor.mfg,
          code: vendor.code,
          lead_time: vendor.lead_time,
          review_period: vendor.review_period,
          order_at: vendor.order_at,
          link: vendor.link,
          username: vendor.username,
          password: vendor.password,
          contact: vendor.contact,
          email: vendor.email,
          phone: vendor.phone,
          settings,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to save settings.");

      alert("Settings saved.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm">Loading settings...</div>;

  if (!vendor) {
    return (
      <section className="space-y-4">
        <PageTitle
          title="Vendor not found"
          description="The selected vendor settings page is not linked to a valid vendor record."
        />

        <Link
          href="/masters/vendors"
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft size={14} />
          Back to Vendor List
        </Link>
      </section>
    );
  }

  const websiteHref = vendor.link?.startsWith("http")
    ? vendor.link
    : `https://${vendor.link}`;

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <PageTitle
          title={`${vendor.mfg} Settings`}
          description="Review vendor details and configure email, PDF, and table formatting."
        />

        <div className="flex gap-2">
          <Link
            href="/masters/vendors"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft size={14} />
            Back to Vendor List
          </Link>

          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Vendor Details
          </h2>

          <div className="flex gap-2">
            {vendor.email && (
              <a
                href={`mailto:${vendor.email}`}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Mail size={13} />
                Email Order Vendor
              </a>
            )}

            {vendor.link && (
              <a
                href={websiteHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Open Website
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vendorDetailFields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {field.label}
              </label>

              <input
                type={field.type || "text"}
                value={String(vendor[field.key] || "")}
                onChange={(e) => updateVendor(field.key, e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Email Configuration
        </h2>

        <div className="mt-4 space-y-4">
          <input
            value={settings.email.subject}
            onChange={(e) =>
              setSettings((current) => ({
                ...current,
                email: { ...current.email, subject: e.target.value },
              }))
            }
            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
          />

          <textarea
            value={settings.email.body}
            onChange={(e) =>
              setSettings((current) => ({
                ...current,
                email: { ...current.email, body: e.target.value },
              }))
            }
            rows={10}
            className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-900"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Table Configuration
          </h2>

          <button
            type="button"
            onClick={() =>
              setSettings((current) => ({
                ...current,
                table: {
                  ...current.table,
                  columns: [
                    ...current.table.columns,
                    createTableColumn(current.table.columns.length + 1),
                  ],
                },
              }))
            }
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Plus size={13} />
            Add Column
          </button>
        </div>

        <table className="w-full text-xs">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Header</th>
              <th className="px-3 py-2 text-left">Field</th>
              <th className="px-3 py-2 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {settings.table.columns.map((column, index) => (
              <tr key={column.id}>
                <td className="px-3 py-2">{index + 1}</td>

                <td className="px-3 py-2">
                  <input
                    value={column.header}
                    onChange={(e) => {
                      const columns = [...settings.table.columns];
                      columns[index] = {
                        ...columns[index],
                        header: e.target.value,
                      };
                      setSettings((current) => ({
                        ...current,
                        table: { ...current.table, columns },
                      }));
                    }}
                    className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  />
                </td>

                <td className="px-3 py-2">
                  <select
                    value={column.field}
                    onChange={(e) => {
                      const columns = [...settings.table.columns];
                      columns[index] = {
                        ...columns[index],
                        field: e.target.value,
                      };
                      setSettings((current) => ({
                        ...current,
                        table: { ...current.table, columns },
                      }));
                    }}
                    className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
                  >
                    {PO_TABLE_FIELD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((current) => ({
                        ...current,
                        table: {
                          ...current.table,
                          columns: current.table.columns.filter(
                            (_, i) => i !== index
                          ),
                        },
                      }))
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
        <span className="font-semibold">Available placeholders:</span>{" "}
        {placeholders.join(", ")}
      </div>
    </section>
  );
}