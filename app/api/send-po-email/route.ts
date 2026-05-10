import { google } from "googleapis";
import { NextResponse } from "next/server";

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      poNumber,
      vendor,
      customer,
      shipDate,
      total,
      rows,
    } = body;

    const gmail = google.gmail({
      version: "v1",
      auth: oauth2Client,
    });

    const itemsHtml = rows
      .map(
        (row: any) => `
          <tr>
            <td style="border:1px solid #ccc;padding:8px;">${row.itemDescription}</td>
            <td style="border:1px solid #ccc;padding:8px;">${row.sku}</td>
            <td style="border:1px solid #ccc;padding:8px;">${row.category}</td>
            <td style="border:1px solid #ccc;padding:8px;">${row.ordered}</td>
            <td style="border:1px solid #ccc;padding:8px;">$${row.amount}</td>
          </tr>
        `
      )
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;">
        <h2>Purchase Order ${poNumber}</h2>

        <p><strong>Vendor:</strong> ${vendor}</p>
        <p><strong>Customer:</strong> ${customer}</p>
        <p><strong>Ship Date:</strong> ${shipDate}</p>
        <p><strong>Total:</strong> $${total}</p>

        <table style="border-collapse:collapse;width:100%;">
          <thead>
            <tr>
              <th style="border:1px solid #ccc;padding:8px;">Item</th>
              <th style="border:1px solid #ccc;padding:8px;">SKU</th>
              <th style="border:1px solid #ccc;padding:8px;">Category</th>
              <th style="border:1px solid #ccc;padding:8px;">Qty</th>
              <th style="border:1px solid #ccc;padding:8px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <br/>

        <p>Regards,</p>
        <p><strong>Kevin Galang</strong></p>
      </div>
    `;

    const messageParts = [
      "From: Kevin Galang <kevingalang.mcg@gmail.com>",
      "To: mcgalang14@gmail.com",
      `Subject: Purchase Order ${poNumber}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "",
      html,
    ];

    const message = messageParts.join("\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json({
      success: false,
      error: error.message,
    });
  }
}