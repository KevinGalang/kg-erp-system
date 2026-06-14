"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, Plus, Save, Trash2 } from "lucide-react";
import PageTitle from "@/components/PageTitle";

type VendorRow = {
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
  settings?: VendorSettings | null;
};

type VendorForm = Omit<VendorRow, "id" | "settings">;

type TableColumn = {
  header: string;
  field: string;
};

type PdfSkuMapping = {
  sku: string;
  itemSku: string;
  itemName: string;
};

type PdfFormField = {
  key: string;
  label: string;
  value: string;
};

type VendorSettings = {
  emailSubject: string;
  emailBody: string;
  pdfEmailBody: string;
  pdfEnabled: boolean;
  pdfTemplate: string;
  pdfUnitPrice: string;
  pdfSampleName: string;
  pdfEditableFields: string[];
  pdfFormFields: PdfFormField[];
  pdfSkuMappings: PdfSkuMapping[];
  tableColumns: TableColumn[];
};

const FIELD_OPTIONS = [
  "Product Title",
  "Variant",
  "SKU",
  "Qty",
  "Approved",
  "Cost",
  "Total",
  "Vendor",
  "Brand",
  "Barcode",
  "Notes",
];

const detailFields: Array<{ key: keyof VendorForm; label: string }> = [
  { key: "mfg", label: "MFG" },
  { key: "code", label: "Code" },
  { key: "lead_time", label: "Lead Time" },
  { key: "review_period", label: "Review Period" },
  { key: "order_at", label: "Order At" },
  { key: "link", label: "Link" },
  { key: "username", label: "Username" },
  { key: "password", label: "Password" },
  { key: "contact", label: "Contact" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
];

const defaultColumns: TableColumn[] = [
  { header: "Item", field: "Product Title" },
  { header: "Variant", field: "Variant" },
  { header: "SKU", field: "SKU" },
  { header: "Qty", field: "Qty" },
  { header: "Approved", field: "Approved" },
];

const defaultPdfFields = [
  "Item SKU # / Private label SKU #",
  "Item Name (Flavor):",
  "Item Quantity:",
];

const nutridynPdfSkuMappings: PdfSkuMapping[] = [
  { sku: "Bind-Clear", itemSku: "PL-VL178", itemName: "Bind & Clear" },
  { sku: "1A002", itemSku: "PL-VL913", itemName: "Essential Zn" },
  { sku: "FatDigestVL", itemSku: "PL-VL863", itemName: "Fat Digest" },
  { sku: "GSE", itemSku: "PL-VL2176", itemName: "GSE Eradicate" },
  { sku: "1D002", itemSku: "PL-VL710", itemName: "Gut Lining Pro" },
  { sku: "1D003", itemSku: "PL-VL325", itemName: "Gut Tissue Repair" },
  { sku: "1D001", itemSku: "PL-VL915", itemName: "Hormone Plus Complete" },
  { sku: "1C005", itemSku: "PL-VL2178", itemName: "Mucosa Repair" },
  { sku: "Optimal-Andro", itemSku: "PL-VL918", itemName: "Optimal Androgens" },
  { sku: "1B005", itemSku: "PL-VL895", itemName: "Optimal Kidney Pro" },
  { sku: "1A001", itemSku: "PL-VL2196", itemName: "Pro Spore Plus" },
  { sku: "1B002", itemSku: "PL-VL848L", itemName: "Resolve 120 ct" },
  { sku: "1B001", itemSku: "PL-VL848", itemName: "Resolve 60ct" },
  { sku: "1C002", itemSku: "PL-VL2121", itemName: "Sinus Pro" },
  { sku: "1C004", itemSku: "PL-VL2193", itemName: "Stomach Relief" },
  { sku: "1A004", itemSku: "PL-VL154", itemName: "Tummy Rescue" },
  { sku: "Vida-C", itemSku: "PL-VL101", itemName: "VidaC 1000" },
];

function isNutridynVendor(vendor?: VendorRow | null) {
  const vendorText = `${vendor?.mfg || ""} ${vendor?.code || ""}`.toLowerCase();
  return vendorText.includes("nutridyn") || vendorText.includes("nutri-dyn");
}

function isBondiPureVendor(vendor?: VendorRow | null) {
  const vendorText = `${vendor?.mfg || ""} ${vendor?.code || ""}`.toLowerCase();
  return vendorText.includes("bondi");
}

function normalizePdfMatchKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mergePdfFormFields(defaults: PdfFormField[], existing: PdfFormField[]) {
  const usedExisting = new Set<number>();
  const merged = defaults.map((defaultField) => {
    const defaultKey = normalizePdfMatchKey(defaultField.key || defaultField.label);
    const existingIndex = existing.findIndex((field, index) => {
      if (usedExisting.has(index)) return false;
      return (
        normalizePdfMatchKey(field.key || field.label) === defaultKey ||
        normalizePdfMatchKey(field.label) === normalizePdfMatchKey(defaultField.label)
      );
    });

    if (existingIndex < 0) {
      return defaultField;
    }

    usedExisting.add(existingIndex);
    return {
      ...defaultField,
      ...existing[existingIndex],
      key: defaultField.key || existing[existingIndex].key,
      label: defaultField.label,
    };
  });
  const extras = existing.filter((field, index) => !usedExisting.has(index));
  return [...merged, ...extras];
}

function getTodayCodeDate() {
  return new Date()
    .toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    })
    .replace(/\//g, ".");
}

function getTodaySlashDate() {
  return new Date().toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function getDefaultPdfFormFields(vendor?: VendorRow | null): PdfFormField[] {
  const today = getTodaySlashDate();

  if (isNutridynVendor(vendor)) {
    return [
      { key: "orderDate", label: "Order Date", value: today },
      { key: "accountNumber", label: "Account Number", value: "702613" },
      { key: "name", label: "Name", value: "Rhya Pachin" },
      { key: "businessName", label: "Business Name", value: "Vidal Nutrition" },
      {
        key: "shippingAddress",
        label: "Shipping Address",
        value: "11915 Enterprise Drive\nCincinnati, OH 45241",
      },
      {
        key: "billingAddress",
        label: "Billing Address",
        value: "11365 Sixth Street East, Treasure Island, FL 33706",
      },
      {
        key: "paymentMethod",
        label: "Payment Method",
        value: "Card ending with 1329",
      },
      {
        key: "notes",
        label: "Notes",
        value: "All Private Labeled items for Vidal",
      },
    ];
  }

  if (isBondiPureVendor(vendor)) {
    return [
      { key: "purchaseOrderDate", label: "Purchase Order Date", value: today },
      { key: "deliveryDate", label: "Delivery Date", value: "" },
      { key: "purchaseOrderNumber", label: "Purchase Order Number", value: "" },
      {
        key: "deliveryAddress",
        label: "Delivery Address",
        value: "11915 Enterprise Drive\nCincinnati, OH\n45241, USA",
      },
      { key: "deliveryInstructions", label: "Delivery Instructions", value: "" },
      { key: "attention", label: "Attention", value: "David or Mendel" },
      { key: "telephone", label: "Telephone", value: "1 855 7372655" },
    ];
  }

  return [
    { key: "orderDate", label: "Order Date", value: today },
    { key: "accountNumber", label: "Account Number", value: "" },
    { key: "shippingAddress", label: "Shipping Address", value: "" },
    { key: "billingAddress", label: "Billing Address", value: "" },
    { key: "paymentMethod", label: "Payment Method", value: "" },
    { key: "notes", label: "Notes", value: "" },
  ];
}

function getDefaultSettings(vendor?: VendorRow | null): VendorSettings {
  const pdfFormFields = getDefaultPdfFormFields(vendor);
  const isBondi = isBondiPureVendor(vendor);

  return {
    emailSubject: `${vendor?.code || "CODE"} x ${getTodayCodeDate()}`,
    emailBody: `Hi {{contact}},

Kindly see our order this week.

{{table}}

Thanks`,
    pdfEmailBody: `Hi {{contact}},

Kindly see attached for our order this week.

Thanks`,
    pdfEnabled: false,
    pdfTemplate: isBondi ? "bondi-pure" : "default",
    pdfUnitPrice: isBondi ? "37.50" : "",
    pdfSampleName: "",
    pdfEditableFields: defaultPdfFields,
    pdfFormFields,
    pdfSkuMappings: isNutridynVendor(vendor) ? nutridynPdfSkuMappings : [],
    tableColumns: defaultColumns,
  };
}

function normalizeSettings(
  vendor: VendorRow,
  settings?: VendorSettings | null
): VendorSettings {
  const defaults = getDefaultSettings(vendor);
  const tableColumns =
    Array.isArray(settings?.tableColumns) && settings.tableColumns.length > 0
      ? settings.tableColumns
      : defaults.tableColumns;
  const isBondi = isBondiPureVendor(vendor);
  const savedPdfFormFields =
    Array.isArray(settings?.pdfFormFields) && settings.pdfFormFields.length > 0
      ? settings.pdfFormFields.filter(
          (field) =>
            !isBondi || normalizePdfMatchKey(field.label) !== "taxamountusd"
        )
      : [];
  const pdfFormFields =
    savedPdfFormFields.length > 0
      ? (isBondi
          ? mergePdfFormFields(defaults.pdfFormFields, savedPdfFormFields)
          : savedPdfFormFields
        ).map((field) =>
          (field.key === "orderDate" || field.key === "purchaseOrderDate") &&
          !field.value
            ? { ...field, value: getTodaySlashDate() }
            : field
        )
      : defaults.pdfFormFields;

  return {
    emailSubject: settings?.emailSubject || defaults.emailSubject,
    emailBody: settings?.emailBody || defaults.emailBody,
    pdfEmailBody: settings?.pdfEmailBody || defaults.pdfEmailBody,
    pdfEnabled: Boolean(settings?.pdfEnabled),
    pdfTemplate: isBondi ? "bondi-pure" : settings?.pdfTemplate || defaults.pdfTemplate,
    pdfUnitPrice: settings?.pdfUnitPrice || defaults.pdfUnitPrice,
    pdfSampleName: settings?.pdfSampleName || defaults.pdfSampleName,
    pdfEditableFields:
      Array.isArray(settings?.pdfEditableFields) &&
      settings.pdfEditableFields.length > 0
        ? settings.pdfEditableFields
        : defaults.pdfEditableFields,
    pdfFormFields,
    pdfSkuMappings:
      Array.isArray(settings?.pdfSkuMappings) &&
      settings.pdfSkuMappings.length > 0
        ? settings.pdfSkuMappings
        : defaults.pdfSkuMappings,
    tableColumns,
  };
}

function vendorToForm(vendor: VendorRow): VendorForm {
  return {
    mfg: vendor.mfg || "",
    code: vendor.code || "",
    lead_time: vendor.lead_time || "",
    review_period: vendor.review_period || "",
    order_at: vendor.order_at || "",
    link: vendor.link || "",
    username: vendor.username || "",
    password: vendor.password || "",
    contact: vendor.contact || "",
    email: vendor.email || "",
    phone: vendor.phone || "",
  };
}

function getUniqueOptions(vendors: VendorRow[], key: keyof VendorForm) {
  return Array.from(
    new Set(
      vendors
        .map((vendor) => String(vendor[key] || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));
}

export default function VendorSettingsPage() {
  const params = useParams();

  const vendorId = useMemo(() => {
    const rawId = params?.id;
    return Array.isArray(rawId) ? rawId[0] : rawId;
  }, [params]);

  const [allVendors, setAllVendors] = useState<VendorRow[]>([]);
  const [vendor, setVendor] = useState<VendorRow | null>(null);
  const [vendorForm, setVendorForm] = useState<VendorForm | null>(null);
  const [settings, setSettings] = useState<VendorSettings | null>(null);
  const [configurationTab, setConfigurationTab] = useState<"email" | "pdf">(
    "email"
  );
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [pdfPreviewType, setPdfPreviewType] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!vendorId || vendorId === "undefined") {
        setMessage({
          type: "error",
          text: "The selected vendor settings page is not linked to a valid vendor record.",
        });
        setLoading(false);
        return;
      }

      try {
        const [vendorResponse, vendorsResponse] = await Promise.all([
          fetch(`/api/vendor-list/${vendorId}`),
          fetch("/api/vendor-list"),
        ]);

        const vendorData = await vendorResponse.json();
        const vendorsData = await vendorsResponse.json();

        if (!vendorResponse.ok) {
          throw new Error(vendorData.error || "Unable to load vendor.");
        }

        if (!vendorData.vendor?.id) {
          throw new Error(
            "The selected vendor settings page is not linked to a valid vendor record."
          );
        }

        if (!ignore) {
          setVendor(vendorData.vendor);
          setVendorForm(vendorToForm(vendorData.vendor));
          const normalizedSettings = normalizeSettings(
            vendorData.vendor,
            vendorData.vendor.settings
          );
          setSettings(normalizedSettings);
          setConfigurationTab(normalizedSettings.pdfEnabled ? "pdf" : "email");
          setAllVendors(vendorsData.vendors || []);
        }
      } catch (error) {
        if (!ignore) {
          setMessage({
            type: "error",
            text:
              error instanceof Error
                ? error.message
                : "Unable to load vendor settings.",
          });
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [vendorId]);

  const leadTimeOptions = useMemo(
    () => getUniqueOptions(allVendors, "lead_time"),
    [allVendors]
  );

  const reviewPeriodOptions = useMemo(
    () => getUniqueOptions(allVendors, "review_period"),
    [allVendors]
  );

  const orderAtOptions = useMemo(
    () => getUniqueOptions(allVendors, "order_at"),
    [allVendors]
  );

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const updateVendorForm = (key: keyof VendorForm, value: string) => {
    setVendorForm((current) =>
      current ? { ...current, [key]: value } : current
    );
  };

  const updateColumn = (
    index: number,
    key: keyof TableColumn,
    value: string
  ) => {
    setSettings((current) =>
      current
        ? {
            ...current,
            tableColumns: current.tableColumns.map((column, columnIndex) =>
              columnIndex === index ? { ...column, [key]: value } : column
            ),
          }
        : current
    );
  };

  const addColumn = () => {
    setSettings((current) =>
      current
        ? {
            ...current,
            tableColumns: [
              ...current.tableColumns,
              { header: "", field: FIELD_OPTIONS[0] },
            ],
          }
        : current
    );
  };

  const removeColumn = (index: number) => {
    setSettings((current) =>
      current
        ? {
            ...current,
            tableColumns: current.tableColumns.filter(
              (_column, columnIndex) => columnIndex !== index
            ),
          }
        : current
    );
  };

  const addPdfFormField = () => {
    setSettings((current) =>
      current
        ? {
            ...current,
            pdfFormFields: [
              ...current.pdfFormFields,
              { key: `custom-${Date.now()}`, label: "", value: "" },
            ],
          }
        : current
    );
  };

  const updatePdfFormField = (
    index: number,
    key: keyof PdfFormField,
    value: string
  ) => {
    setSettings((current) =>
      current
        ? {
            ...current,
            pdfFormFields: current.pdfFormFields.map((field, fieldIndex) =>
              fieldIndex === index ? { ...field, [key]: value } : field
            ),
          }
        : current
    );
  };

  const removePdfFormField = (index: number) => {
    setSettings((current) =>
      current
        ? {
            ...current,
            pdfFormFields: current.pdfFormFields.filter(
              (_field, fieldIndex) => fieldIndex !== index
            ),
          }
        : current
    );
  };

  const addPdfSkuMapping = () => {
    setSettings((current) =>
      current
        ? {
            ...current,
            pdfSkuMappings: [
              ...current.pdfSkuMappings,
              { sku: "", itemSku: "", itemName: "" },
            ],
          }
        : current
    );
  };

  const updatePdfSkuMapping = (
    index: number,
    key: keyof PdfSkuMapping,
    value: string
  ) => {
    setSettings((current) =>
      current
        ? {
            ...current,
            pdfSkuMappings: current.pdfSkuMappings.map((mapping, mappingIndex) =>
              mappingIndex === index ? { ...mapping, [key]: value } : mapping
            ),
          }
        : current
    );
  };

  const removePdfSkuMapping = (index: number) => {
    setSettings((current) =>
      current
        ? {
            ...current,
            pdfSkuMappings: current.pdfSkuMappings.filter(
              (_mapping, mappingIndex) => mappingIndex !== index
            ),
          }
        : current
    );
  };

  const saveSettings = async () => {
    if (!vendor || !vendorForm || !settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/vendor-list/${vendor.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...vendorForm,
          settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save vendor.");
      }

      setVendor(data.vendor);
      setVendorForm(vendorToForm(data.vendor));
      setSettings(normalizeSettings(data.vendor, data.vendor.settings));
      setMessage({ type: "success", text: "Vendor details saved." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Unable to save vendor.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <PageTitle title="Vendor Settings" description="Loading..." />
      </section>
    );
  }

  if (!vendor || !vendorForm || !settings) {
    return (
      <section className="space-y-4">
        <PageTitle title="Vendor Settings" description="Unable to load vendor." />

        {message && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {message.text}
          </div>
        )}

        <Link
          href="/masters/vendors"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft size={14} />
          Back to Vendors
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <PageTitle
          title={`${vendorForm.mfg || "Vendor"} Settings`}
          description="Edit vendor details, email templates, and table columns."
        />

        <div className="flex flex-wrap gap-2">
          <Link
            href="/masters/vendors"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft size={14} />
            Back
          </Link>

          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Vendor Details
          </h2>

          <div className="flex gap-2">
            <a
              href={`mailto:${vendorForm.email}`}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <Mail size={14} />
              Email Order Vendor
            </a>

            {vendorForm.link && (
              <a
                href={
                  vendorForm.link.startsWith("http")
                    ? vendorForm.link
                    : `https://${vendorForm.link}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Open Website
              </a>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {detailFields.map((field) => {
            const listId = `vendor-detail-${field.key}-options`;

            const options =
              field.key === "lead_time"
                ? leadTimeOptions
                : field.key === "review_period"
                  ? reviewPeriodOptions
                  : field.key === "order_at"
                    ? orderAtOptions
                    : [];

            return (
              <div key={field.key}>
                <label className="text-xs font-semibold uppercase text-slate-500">
                  {field.label}
                </label>

                <input
                  type="text"
                  list={options.length ? listId : undefined}
                  value={vendorForm[field.key]}
                  onChange={(event) =>
                    updateVendorForm(field.key, event.target.value)
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />

                {options.length > 0 && (
                  <datalist id={listId}>
                    {options.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Vendor Order Configuration
          </h2>

          <div className="inline-flex rounded-lg border border-slate-300 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setConfigurationTab("email")}
              className={`h-8 rounded-md px-3 text-xs font-semibold ${
                configurationTab === "email"
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-white"
              }`}
            >
              Email Configuration
            </button>
            <button
              type="button"
              onClick={() => setConfigurationTab("pdf")}
              className={`h-8 rounded-md px-3 text-xs font-semibold ${
                configurationTab === "pdf"
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-white"
              }`}
            >
              PDF Configuration
            </button>
          </div>
        </div>

        {configurationTab === "email" ? (
          <div className="space-y-4">
            <input
              type="text"
              value={settings.emailSubject}
              onChange={(event) =>
                setSettings((current) =>
                  current
                    ? { ...current, emailSubject: event.target.value }
                    : current
                )
              }
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
            />

            <textarea
              value={settings.emailBody}
              onChange={(event) =>
                setSettings((current) =>
                  current
                    ? { ...current, emailBody: event.target.value }
                    : current
                )
              }
              rows={8}
              className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-900"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={settings.pdfEnabled}
                onChange={(event) =>
                  setSettings((current) =>
                    current
                      ? { ...current, pdfEnabled: event.target.checked }
                      : current
                  )
                }
                className="h-4 w-4 rounded border-slate-300 text-slate-900"
              />
              Use PDF configuration for this vendor
            </label>

            <textarea
              value={settings.pdfEmailBody}
              disabled={!settings.pdfEnabled}
              onChange={(event) =>
                setSettings((current) =>
                  current
                    ? { ...current, pdfEmailBody: event.target.value }
                    : current
                )
              }
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
            />

            {settings.pdfTemplate === "bondi-pure" && (
              <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:max-w-sm">
                <label className="text-xs font-semibold uppercase text-slate-500">
                  Unit Price / Amount USD
                </label>
                <input
                  type="text"
                  value={settings.pdfUnitPrice}
                  disabled={!settings.pdfEnabled}
                  onChange={(event) =>
                    setSettings((current) =>
                      current
                        ? { ...current, pdfUnitPrice: event.target.value }
                        : current
                    )
                  }
                  placeholder="37.50"
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            )}

            <div className="rounded-lg border border-dashed border-slate-300 p-4">
              <label className="block text-xs font-semibold uppercase text-slate-500">
                Sample PDF
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                disabled={!settings.pdfEnabled}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  const fileName = file?.name || "";

                  if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
                  setPdfPreviewUrl(file ? URL.createObjectURL(file) : "");
                  setPdfPreviewType(file?.type || "");
                  setSettings((current) =>
                    current ? { ...current, pdfSampleName: fileName } : current
                  );
                }}
                className="mt-2 block w-full text-sm text-slate-700 file:mr-3 file:h-9 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-100 disabled:text-slate-400"
              />
              {settings.pdfSampleName && (
                <p className="mt-2 text-xs font-medium text-slate-600">
                  Sample selected: {settings.pdfSampleName}
                </p>
              )}
              {pdfPreviewUrl && (
                <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                  {pdfPreviewType === "application/pdf" ? (
                    <iframe
                      title="Uploaded PDF preview"
                      src={pdfPreviewUrl}
                      className="h-[540px] w-full"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pdfPreviewUrl}
                      alt="Uploaded PDF sample preview"
                      className="mx-auto max-h-[540px] max-w-full object-contain"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    PDF Form Fields
                  </h3>
                  <p className="text-xs text-slate-500">
                    Editable boxes for the header details on the vendor PDF.
                    Order Date defaults to today and can be manually changed.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addPdfFormField}
                  disabled={!settings.pdfEnabled}
                  className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={14} />
                  Add Field
                </button>
              </div>

              <div className="grid gap-3 p-4 md:grid-cols-2">
                {settings.pdfFormFields.map((field, index) => (
                  <div
                    key={`${field.key}-${index}`}
                    className="rounded-lg border border-yellow-300 bg-yellow-50 p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={field.label}
                        disabled={!settings.pdfEnabled}
                        onChange={(event) =>
                          updatePdfFormField(index, "label", event.target.value)
                        }
                        placeholder="Field label"
                        className="h-9 flex-1 rounded-lg border border-yellow-300 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => removePdfFormField(index)}
                        disabled={!settings.pdfEnabled}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Delete PDF form field"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <textarea
                      value={field.value}
                      disabled={!settings.pdfEnabled}
                      onChange={(event) =>
                        updatePdfFormField(index, "value", event.target.value)
                      }
                      rows={
                        field.key === "shippingAddress" ||
                        field.key === "billingAddress" ||
                        field.key === "deliveryAddress"
                          ? 3
                          : 2
                      }
                      placeholder="Field value"
                      className="w-full rounded-lg border border-yellow-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:bg-slate-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    PDF SKU Database
                  </h3>
                  <p className="text-xs text-slate-500">
                    Used to fill Item SKU #, Item Name (Flavor), and approved
                    quantity on vendor PDFs.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addPdfSkuMapping}
                  disabled={!settings.pdfEnabled}
                  className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={14} />
                  Add Row
                </button>
              </div>

              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="w-[26%] px-3 py-2 text-left font-semibold">
                      SKU
                    </th>
                    <th className="w-[26%] px-3 py-2 text-left font-semibold">
                      Item SKU #
                    </th>
                    <th className="px-3 py-2 text-left font-semibold">
                      Item Name (Flavor):
                    </th>
                    <th className="w-20 px-3 py-2 text-center font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {settings.pdfSkuMappings.map((mapping, index) => (
                    <tr key={`${mapping.sku}-${index}`} className="border-t">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={mapping.sku}
                          disabled={!settings.pdfEnabled}
                          onChange={(event) =>
                            updatePdfSkuMapping(index, "sku", event.target.value)
                          }
                          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={mapping.itemSku}
                          disabled={!settings.pdfEnabled}
                          onChange={(event) =>
                            updatePdfSkuMapping(
                              index,
                              "itemSku",
                              event.target.value
                            )
                          }
                          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={mapping.itemName}
                          disabled={!settings.pdfEnabled}
                          onChange={(event) =>
                            updatePdfSkuMapping(
                              index,
                              "itemName",
                              event.target.value
                            )
                          }
                          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900 disabled:bg-slate-100"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removePdfSkuMapping(index)}
                          disabled={!settings.pdfEnabled}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Delete PDF SKU mapping"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {configurationTab === "email" && (
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Email Table Configuration
          </h2>

          <button
            type="button"
            onClick={addColumn}
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Plus size={14} />
            Add Column
          </button>
        </div>

        <table className="w-full text-xs">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="w-16 px-3 py-2 text-left font-semibold">#</th>
              <th className="px-3 py-2 text-left font-semibold">Header</th>
              <th className="px-3 py-2 text-left font-semibold">Field</th>
              <th className="w-32 px-3 py-2 text-center font-semibold">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {settings.tableColumns.map((column, index) => (
              <tr key={index} className="border-t border-slate-100">
                <td className="px-3 py-2">{index + 1}</td>

                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={column.header}
                    onChange={(event) =>
                      updateColumn(index, "header", event.target.value)
                    }
                    className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
                  />
                </td>

                <td className="px-3 py-2">
                  <select
                    value={column.field}
                    onChange={(event) =>
                      updateColumn(index, "field", event.target.value)
                    }
                    className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-900"
                  >
                    {FIELD_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeColumn(index)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </section>
  );
}
