import PageTitle from "@/components/PageTitle";

const totals = [
  { label: "MTD Sales", value: "$140,724" },
  { label: "In-transit", value: "698" },
  { label: "Low Stock", value: "12" },
];

const salesComparison = [
  { month: "Jan", thisYear: 14200, lastYear: 9800 },
  { month: "Feb", thisYear: 11800, lastYear: 9200 },
  { month: "Mar", thisYear: 15600, lastYear: 11200 },
  { month: "Apr", thisYear: 13200, lastYear: 10800 },
  { month: "May", thisYear: 16800, lastYear: 12100 },
  { month: "Jun", thisYear: 14700, lastYear: 11600 },
];

const lowStockItems = [
  { item: "PyloriVL", sku: "PYL-012", qty: 6, uom: 12 },
  { item: "OmegaVL", sku: "OMG-004", qty: 8, uom: 24 },
  { item: "Vitamin D3", sku: "VD3-100", qty: 10, uom: 24 },
  { item: "Zinc Complex", sku: "ZNC-030", qty: 4, uom: 12 },
];

const inTransitOrders = [
  { po: "PO-1008", vendor: "Vidal Labs", status: "In-transit", qty: 120 },
  { po: "PO-1009", vendor: "NutraHealth", status: "Shipped", qty: 84 },
  { po: "PO-1010", vendor: "BioSource", status: "Ordered", qty: 60 },
];

const topSellingItems = [
  { item: "PyloriVL", sold: 240 },
  { item: "CardioVL", sold: 210 },
  { item: "OmegaVL", sold: 185 },
  { item: "Probiotic Plus", sold: 160 },
  { item: "Magnesium Glycinate", sold: 144 },
];

const slowMovers = [
  { item: "Herbal Calm", sold: 2 },
  { item: "Liver Support", sold: 4 },
  { item: "Sleep Blend", sold: 5 },
  { item: "Greens Powder", sold: 7 },
  { item: "Joint Support", sold: 8 },
];

function MiniBar({ value, max }: { value: number; max: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-slate-900"
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const maxSales = Math.max(
    ...salesComparison.map((m) => Math.max(m.thisYear, m.lastYear))
  );

  const maxTopSelling = Math.max(...topSellingItems.map((i) => i.sold));
  const maxSlow = Math.max(...slowMovers.map((i) => i.sold));

  return (
    <section>
      <PageTitle
        title="Dashboard"
        description="Sales, inventory movement, and purchasing overview."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {totals.map((card) => (
          <article
            key={card.label}
            className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {card.value}
            </p>
          </article>
        ))}
      </div>

      <article className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            Past 6 Months Sales vs Last Year
          </h3>

          <div className="flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm bg-slate-900" />
              This Year
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm bg-slate-300" />
              Last Year
            </span>
          </div>
        </div>

        <div className="flex h-72 items-end justify-between gap-4 border-b border-l border-slate-200 px-4 pt-4">
          {salesComparison.map((month) => (
            <div key={month.month} className="flex flex-1 flex-col items-center">
              <div className="flex h-56 items-end gap-2">
                <div
                  className="w-7 rounded-t-md bg-slate-900"
                  style={{ height: `${(month.thisYear / maxSales) * 100}%` }}
                  title={`This Year: $${month.thisYear.toLocaleString()}`}
                />
                <div
                  className="w-7 rounded-t-md bg-slate-300"
                  style={{ height: `${(month.lastYear / maxSales) * 100}%` }}
                  title={`Last Year: $${month.lastYear.toLocaleString()}`}
                />
              </div>

              <p className="mt-3 text-xs font-medium text-slate-600">
                {month.month}
              </p>
            </div>
          ))}
        </div>
      </article>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            Low Stock
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
              {lowStockItems.map((item) => (
                <tr key={item.sku} className="border-b last:border-0">
                  <td className="py-2 text-slate-800">{item.item}</td>
                  <td className="py-2 text-slate-500">{item.sku}</td>
                  <td className="py-2 text-right font-semibold text-red-600">
                    {item.qty}
                  </td>
                  <td className="py-2 text-right text-slate-600">{item.uom}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            In-transit
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
              {inTransitOrders.map((order) => (
                <tr key={order.po} className="border-b last:border-0">
                  <td className="py-2 text-slate-800">{order.po}</td>
                  <td className="py-2 text-slate-600">{order.vendor}</td>
                  <td className="py-2 text-slate-600">{order.status}</td>
                  <td className="py-2 text-right font-semibold text-slate-900">
                    {order.qty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            Top Selling Items
          </h3>

          <div className="space-y-4">
            {topSellingItems.map((item) => (
              <div key={item.item}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-700">{item.item}</span>
                  <span className="font-medium text-slate-900">{item.sold}</span>
                </div>
                <MiniBar value={item.sold} max={maxTopSelling} />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-900">
            Slow Movers
          </h3>

          <div className="space-y-4">
            {slowMovers.map((item) => (
              <div key={item.item}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-700">{item.item}</span>
                  <span className="font-medium text-slate-900">{item.sold}</span>
                </div>
                <MiniBar value={item.sold} max={maxSlow} />
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
