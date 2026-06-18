import PageTitle from "@/components/PageTitle";

const summaryCards = [
  { label: "Total Inventory Items", value: 128 },
  { label: "Low Stock Items", value: 14 },
  { label: "Open Purchase Orders", value: 7 },
  { label: "In-transit Orders", value: 5 },
];

const topSellingItems = [
  ["PyloriVL", 240],
  ["CardioVL", 210],
  ["OmegaVL", 185],
  ["Probiotic Plus", 160],
  ["Magnesium Glycinate", 144],
  ["Vitamin D3", 130],
  ["Zinc Complex", 118],
  ["B-Complex", 104],
  ["Digestive Enzyme", 96],
  ["Collagen Peptides", 88],
];

const slowMovers = [
  ["Herbal Calm", "HC-001", "Vidal Labs", 2, 42],
  ["Liver Support", "LS-014", "NutraHealth", 4, 55],
  ["Sleep Blend", "SB-022", "Wellness Co", 5, 38],
  ["Greens Powder", "GP-018", "BioSource", 7, 61],
  ["Joint Support", "JS-011", "Vidal Labs", 8, 47],
];

const lowStockItems = [
  ["PyloriVL", "PYL-012", 6, 12],
  ["OmegaVL", "OMG-004", 8, 24],
  ["Vitamin D3", "VD3-100", 10, 24],
  ["Zinc Complex", "ZNC-030", 4, 12],
];

const inTransitOrders = [
  ["PO-1008", "Vidal Labs", "In-transit", 120],
  ["PO-1009", "NutraHealth", "Shipped", 84],
  ["PO-1010", "BioSource", "Ordered", 60],
];

const topVendors = [
  ["Vidal Labs", 420],
  ["NutraHealth", 310],
  ["BioSource", 255],
  ["Wellness Co", 190],
  ["Pure Formulas", 150],
];

function ProgressBar({ value, max }: { value: number; max: number }) {
  const width = Math.min((value / max) * 100, 100);

  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-slate-900"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const maxSold = Math.max(...topSellingItems.map((item) => item[1] as number));
  const maxVendor = Math.max(...topVendors.map((vendor) => vendor[1] as number));

  return (
    <section>
      <PageTitle
        title="Dashboard"
        description="Sample overview of inventory, purchasing, vendors, and item movement."
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
            {topSellingItems.map(([name, sold]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="truncate text-slate-700">{name}</span>
                  <span className="font-medium text-slate-900">{sold}</span>
                </div>
                <ProgressBar value={sold as number} max={maxSold} />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            Top 5 Vendors
          </h3>

          <div className="space-y-4">
            {topVendors.map(([vendor, qty]) => (
              <div key={vendor}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="truncate text-slate-700">{vendor}</span>
                  <span className="font-medium text-slate-900">{qty}</span>
                </div>
                <ProgressBar value={qty as number} max={maxVendor} />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            Low Stock Items
          </h3>

          <table className="w-full text-left text-sm">
            <thead className="border-b text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Item</th>
                <th className="py-2">SKU</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">UOM</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map(([item, sku, qty, uom]) => (
                <tr key={sku} className="border-b last:border-0">
                  <td className="py-2 text-slate-800">{item}</td>
                  <td className="py-2 text-slate-500">{sku}</td>
                  <td className="py-2 text-right font-medium text-red-600">
                    {qty}
                  </td>
                  <td className="py-2 text-right text-slate-600">{uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            In-transit Orders
          </h3>

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
              {inTransitOrders.map(([po, vendor, status, qty]) => (
                <tr key={po} className="border-b last:border-0">
                  <td className="py-2 text-slate-800">{po}</td>
                  <td className="py-2 text-slate-600">{vendor}</td>
                  <td className="py-2 text-slate-600">{status}</td>
                  <td className="py-2 text-right font-medium text-slate-900">
                    {qty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            Top 10 Slow Movers
          </h3>

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
              {slowMovers.map(([item, sku, vendor, sold, qty]) => (
                <tr key={sku} className="border-b last:border-0">
                  <td className="py-2 text-slate-800">{item}</td>
                  <td className="py-2 text-slate-500">{sku}</td>
                  <td className="py-2 text-slate-600">{vendor}</td>
                  <td className="py-2 text-right text-slate-600">{sold}</td>
                  <td className="py-2 text-right font-medium text-slate-900">
                    {qty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}
