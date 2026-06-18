import PageTitle from "@/components/PageTitle";

const totals = [
  {
    label: "MTD Sales",
    value: "$140,724",
    accent: "from-blue-500 to-cyan-400",
  },
  {
    label: "In-transit",
    value: "8 PO",
    accent: "from-amber-500 to-orange-400",
  },
  {
    label: "Low Stock",
    value: "12",
    accent: "from-rose-500 to-pink-400",
  },
];

const salesComparison = [
  { month: "Jan", thisYear: 14200, lastYear: 9800 },
  { month: "Feb", thisYear: 11800, lastYear: 9200 },
  { month: "Mar", thisYear: 15600, lastYear: 11200 },
  { month: "Apr", thisYear: 13200, lastYear: 10800 },
  { month: "May", thisYear: 16800, lastYear: 12100 },
  { month: "Jun", thisYear: 14700, lastYear: 11600 },
];

function formatMoney(value: number) {
  return `$${value.toLocaleString()}`;
}

export default function DashboardPage() {
  const maxSales = Math.max(
    ...salesComparison.map((month) =>
      Math.max(month.thisYear, month.lastYear)
    )
  );

  return (
    <section className="space-y-6">
      <PageTitle
        title="Dashboard"
        description="Sales, inventory movement, and purchasing overview."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {totals.map((card) => (
          <article
            key={card.label}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className={`h-2 bg-gradient-to-r ${card.accent}`} />

            <div className="p-6">
              <p className="text-sm font-medium text-slate-500">
                {card.label}
              </p>
              <p className="mt-3 text-4xl font-bold text-slate-950">
                {card.value}
              </p>
            </div>
          </article>
        ))}
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">
              Past 6 Months Sales vs Last Year
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Monthly sales comparison using sample data.
            </p>
          </div>

          <div className="flex gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-blue-600" />
              This Year
            </span>
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-orange-400" />
              Last Year
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex h-[360px] min-w-[760px] items-end justify-between gap-6 rounded-xl bg-gradient-to-b from-slate-50 to-white px-6 pb-10 pt-8">
            {salesComparison.map((month) => {
              const thisYearHeight = Math.max(
                (month.thisYear / maxSales) * 240,
                40
              );

              const lastYearHeight = Math.max(
                (month.lastYear / maxSales) * 240,
                40
              );

              return (
                <div
                  key={month.month}
                  className="flex flex-1 flex-col items-center"
                >
                  <div className="flex h-[280px] items-end gap-3">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs font-semibold text-blue-700">
                        {formatMoney(month.thisYear)}
                      </span>

                      <div
                        className="w-10 rounded-t-lg bg-gradient-to-t from-blue-700 to-cyan-400 shadow-md"
                        style={{ height: `${thisYearHeight}px` }}
                      />
                    </div>

                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs font-semibold text-orange-600">
                        {formatMoney(month.lastYear)}
                      </span>

                      <div
                        className="w-10 rounded-t-lg bg-gradient-to-t from-orange-500 to-amber-300 shadow-md"
                        style={{ height: `${lastYearHeight}px` }}
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-sm font-semibold text-slate-700">
                    {month.month}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </article>
    </section>
  );
}
