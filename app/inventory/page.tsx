import PageTitle from "@/components/PageTitle";

const inventoryRows = [
  {
    category: "Category 1",
    vendor: "Vendor 1",
    sku: "SKU-1001",
    itemName: "Item 1",
    currentInventory: 240,
    averageForecast: 180,
    leadTime: "7 Days",
    needed: 60,
    status: "Healthy",
  },
  {
    category: "Category 2",
    vendor: "Vendor 2",
    sku: "SKU-1002",
    itemName: "Item 2",
    currentInventory: 40,
    averageForecast: 120,
    leadTime: "14 Days",
    needed: 80,
    status: "Low Stocks",
  },
  {
    category: "Category 3",
    vendor: "Vendor 3",
    sku: "SKU-1003",
    itemName: "Item 3",
    currentInventory: 12,
    averageForecast: 100,
    leadTime: "21 Days",
    needed: 88,
    status: "Critical",
  },
  {
    category: "Category 4",
    vendor: "Vendor 1",
    sku: "SKU-1004",
    itemName: "Item 4",
    currentInventory: 310,
    averageForecast: 250,
    leadTime: "10 Days",
    needed: 40,
    status: "Healthy",
  },
  {
    category: "Category 5",
    vendor: "Vendor 2",
    sku: "SKU-1005",
    itemName: "Item 5",
    currentInventory: 90,
    averageForecast: 140,
    leadTime: "12 Days",
    needed: 50,
    status: "Low Stocks",
  },
  {
    category: "Category 6",
    vendor: "Vendor 3",
    sku: "SKU-1006",
    itemName: "Item 6",
    currentInventory: 8,
    averageForecast: 90,
    leadTime: "30 Days",
    needed: 82,
    status: "Critical",
  },
  {
    category: "Category 7",
    vendor: "Vendor 1",
    sku: "SKU-1007",
    itemName: "Item 7",
    currentInventory: 270,
    averageForecast: 200,
    leadTime: "9 Days",
    needed: 30,
    status: "Healthy",
  },
  {
    category: "Category 8",
    vendor: "Vendor 2",
    sku: "SKU-1008",
    itemName: "Item 8",
    currentInventory: 55,
    averageForecast: 115,
    leadTime: "15 Days",
    needed: 60,
    status: "Low Stocks",
  },
  {
    category: "Category 9",
    vendor: "Vendor 3",
    sku: "SKU-1009",
    itemName: "Item 9",
    currentInventory: 5,
    averageForecast: 75,
    leadTime: "28 Days",
    needed: 70,
    status: "Critical",
  },
  {
    category: "Category 10",
    vendor: "Vendor 1",
    sku: "SKU-1010",
    itemName: "Item 10",
    currentInventory: 190,
    averageForecast: 150,
    leadTime: "11 Days",
    needed: 20,
    status: "Healthy",
  },
];

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Inventory"
        description="Track stock levels, forecasting, vendor distribution, and inventory health."
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Inventory Overview
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Monitor inventory movement, supplier distribution, stock forecasting,
          and replenishment requirements.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">
                  Category
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Vendor
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  SKU
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Item Name
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Current Inventory
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Ave. Forecast
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Lead Time
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Needed
                </th>

                <th className="px-5 py-4 text-left font-semibold">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {inventoryRows.map((item, index) => (
                <tr
                  key={index}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-5 py-4">{item.category}</td>

                  <td className="px-5 py-4">{item.vendor}</td>

                  <td className="px-5 py-4 font-medium text-slate-700">
                    {item.sku}
                  </td>

                  <td className="px-5 py-4">{item.itemName}</td>

                  <td className="px-5 py-4">
                    {item.currentInventory}
                  </td>

                  <td className="px-5 py-4">
                    {item.averageForecast}
                  </td>

                  <td className="px-5 py-4">{item.leadTime}</td>

                  <td className="px-5 py-4">{item.needed}</td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "Healthy"
                          ? "bg-green-100 text-green-700"
                          : item.status === "Low Stocks"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}