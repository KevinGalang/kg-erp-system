import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const PURCHASE_ORDER_COLUMNS = `
  id,
  date,
  mfg,
  product_title,
  variant_title,
  sku,
  qty,
  qty_received,
  diff,
  po_number,
  status,
  created_at,
  updated_at
`;

const receivingStatuses = ["Received", "Under Received", "Over Received"];

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const match = body.match || {};
    const changes = body.changes || {};

    if (!match.po_number || !match.product_title) {
      return NextResponse.json(
        { error: "Missing PO Number or Product Title match values." },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("purchase_orders")
      .select(PURCHASE_ORDER_COLUMNS)
      .eq("po_number", match.po_number)
      .eq("product_title", match.product_title);

    if (match.variant_title) {
      query = query.eq("variant_title", match.variant_title);
    } else {
      query = query.or("variant_title.is.null,variant_title.eq.");
    }

    const { data: existing, error: findError } = await query.maybeSingle();

    if (findError) {
      return NextResponse.json(
        { error: `Supabase PO lookup failed: ${findError.message}` },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json(
        { error: "The PO line was not found. It may have been changed or deleted." },
        { status: 404 }
      );
    }

    const originalQty = existing.qty;
    const qtyIsBlank =
      originalQty === null || originalQty === undefined || String(originalQty).trim() === "";

    const qtyReceivedChanged = Object.prototype.hasOwnProperty.call(
      changes,
      "qty_received"
    );
    const receivingStatusSelected = receivingStatuses.includes(String(changes.status));

    if ((qtyReceivedChanged || receivingStatusSelected) && qtyIsBlank) {
      return NextResponse.json(
        {
          error:
            "Cannot update Qty Received or receiving status because original Qty is blank.",
        },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {};

    const allowedFields = [
      "date",
      "mfg",
      "product_title",
      "variant_title",
      "sku",
      "qty",
      "qty_received",
      "po_number",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(changes, field)) {
        payload[field] = changes[field];
      }
    });

    if (
      Object.prototype.hasOwnProperty.call(payload, "qty") ||
      Object.prototype.hasOwnProperty.call(payload, "qty_received")
    ) {
      const nextQty = Object.prototype.hasOwnProperty.call(payload, "qty")
        ? toNumber(payload.qty)
        : toNumber(existing.qty);
      const nextReceived = Object.prototype.hasOwnProperty.call(
        payload,
        "qty_received"
      )
        ? toNumber(payload.qty_received)
        : toNumber(existing.qty_received);

      payload.diff = nextQty - nextReceived;
    }

    if (payload.status && receivingStatuses.includes(String(payload.status))) {
      payload.updated_at = new Date().toISOString();
    }

    if (!Object.keys(payload).length) {
      return NextResponse.json({ purchaseOrder: existing });
    }

    const { data, error } = await supabaseAdmin
      .from("purchase_orders")
      .update(payload)
      .eq("id", existing.id)
      .select(PURCHASE_ORDER_COLUMNS)
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Supabase PO update failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ purchaseOrder: data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update purchase order line.",
      },
      { status: 500 }
    );
  }
}
