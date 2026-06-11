export type TableColumnConfig = {
  id: string;
  header: string;
  field: string;
};

export type VendorEmailSettings = {
  subject: string;
  body: string;
  includeAttachment: boolean;
  attachmentFormat: "pdf" | "none";
};

export type VendorPdfTemplate = {
  enabled: boolean;
  content: string;
};

export type VendorTableSettings = {
  enabled: boolean;
  columns: TableColumnConfig[];
};

export type VendorSettings = {
  email: VendorEmailSettings;
  pdfTemplate: VendorPdfTemplate;
  table: VendorTableSettings;
};

export const PO_TABLE_FIELD_OPTIONS = [
  { value: "productTitle", label: "Product Title" },
  { value: "variant", label: "Variant" },
  { value: "sku", label: "SKU" },
  { value: "vendor", label: "Vendor" },
  { value: "qty", label: "Qty" },
  { value: "onOrder", label: "On Order" },
  { value: "sales90d", label: "90D Sales" },
  { value: "weekly", label: "Weekly" },
  { value: "needed", label: "Needed" },
  { value: "approved", label: "Approved" },
] as const;

const VALID_TABLE_FIELDS = PO_TABLE_FIELD_OPTIONS.map((item) => item.value);

const LEGACY_FIELD_MAP: Record<string, string> = {
  itemDescription: "productTitle",
  ordered: "qty",
  quantity: "qty",
  amount: "approved",
  category: "vendor",
  customer: "vendor",
  shipDate: "needed",
  poNumber: "approved",
  total: "approved",

  "Product Title": "productTitle",
  Variant: "variant",
  SKU: "sku",
  Vendor: "vendor",
  Qty: "qty",
  "On Order": "onOrder",
  "90D Sales": "sales90d",
  Weekly: "weekly",
  Needed: "needed",
  Approved: "approved",
};

export const DEFAULT_VENDOR_SETTINGS: VendorSettings = {
  email: {
    subject: "Purchase Order {{poNumber}}",
    body: `Hello {{contact}},

Please find our purchase order {{poNumber}} below.

Vendor: {{vendor}}

{{table}}

Regards,
Kevin Galang`,
    includeAttachment: true,
    attachmentFormat: "pdf",
  },
  pdfTemplate: {
    enabled: false,
    content: `<div style="font-family: Arial, sans-serif;">
  <h2>Purchase Order {{poNumber}}</h2>
  <p><strong>Vendor:</strong> {{vendor}}</p>
  {{table}}
</div>`,
  },
  table: {
    enabled: true,
    columns: [
      { id: "1", header: "Item", field: "productTitle" },
      { id: "2", header: "Variant", field: "variant" },
      { id: "3", header: "SKU", field: "sku" },
      { id: "4", header: "Qty", field: "qty" },
      { id: "5", header: "Approved", field: "approved" },
    ],
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeTableField(field: string): string {
  const trimmed = field.trim();

  if (VALID_TABLE_FIELDS.includes(trimmed as any)) {
    return trimmed;
  }

  return LEGACY_FIELD_MAP[trimmed] || "productTitle";
}

function getFieldLabel(field: string): string {
  const option = PO_TABLE_FIELD_OPTIONS.find((item) => item.value === field);
  return option?.label || "Product Title";
}

function parseTableColumns(value: unknown): TableColumnConfig[] {
  if (!Array.isArray(value)) {
    return DEFAULT_VENDOR_SETTINGS.table.columns;
  }

  const columns = value
    .map((column, index) => {
      if (!isRecord(column)) return null;

      const rawHeader =
        typeof column.header === "string" ? column.header.trim() : "";

      const rawField =
        typeof column.field === "string" ? column.field.trim() : "";

      if (!rawField) return null;

      const field = normalizeTableField(rawField);
      const header = rawHeader || getFieldLabel(field);

      return {
        id:
          typeof column.id === "string" && column.id.trim()
            ? column.id
            : `column-${index + 1}`,
        header,
        field,
      };
    })
    .filter((column): column is TableColumnConfig => column !== null);

  return columns.length > 0 ? columns : DEFAULT_VENDOR_SETTINGS.table.columns;
}

export function parseVendorSettings(value: unknown): VendorSettings {
  if (!isRecord(value)) {
    return DEFAULT_VENDOR_SETTINGS;
  }

  const email = isRecord(value.email) ? value.email : {};
  const pdfTemplate = isRecord(value.pdfTemplate) ? value.pdfTemplate : {};
  const table = isRecord(value.table) ? value.table : {};

  return {
    email: {
      subject:
        typeof email.subject === "string" && email.subject.trim()
          ? email.subject
          : DEFAULT_VENDOR_SETTINGS.email.subject,
      body:
        typeof email.body === "string" && email.body.trim()
          ? email.body
          : DEFAULT_VENDOR_SETTINGS.email.body,
      includeAttachment:
        typeof email.includeAttachment === "boolean"
          ? email.includeAttachment
          : DEFAULT_VENDOR_SETTINGS.email.includeAttachment,
      attachmentFormat:
        email.attachmentFormat === "pdf" || email.attachmentFormat === "none"
          ? email.attachmentFormat
          : DEFAULT_VENDOR_SETTINGS.email.attachmentFormat,
    },
    pdfTemplate: {
      enabled:
        typeof pdfTemplate.enabled === "boolean"
          ? pdfTemplate.enabled
          : DEFAULT_VENDOR_SETTINGS.pdfTemplate.enabled,
      content:
        typeof pdfTemplate.content === "string" && pdfTemplate.content.trim()
          ? pdfTemplate.content
          : DEFAULT_VENDOR_SETTINGS.pdfTemplate.content,
    },
    table: {
      enabled:
        typeof table.enabled === "boolean"
          ? table.enabled
          : DEFAULT_VENDOR_SETTINGS.table.enabled,
      columns: parseTableColumns(table.columns),
    },
  };
}

export function createTableColumn(
  index: number,
  field = "productTitle"
): TableColumnConfig {
  const normalizedField = normalizeTableField(field);
  const option = PO_TABLE_FIELD_OPTIONS.find(
    (item) => item.value === normalizedField
  );

  return {
    id: `column-${Date.now()}-${index}`,
    header: option?.label ?? "Product Title",
    field: normalizedField,
  };
}