import PageTitle from "@/components/PageTitle";
import { Plus } from "lucide-react";

const vendors = [
  {
    vendorName: "Vendor 1",
    contactPerson: "Contact Person 1",
    email: "Vendor1@gmail.com",
    terms: "30 Days",
    fobPoint: "Location 1",
  },
  {
    vendorName: "Vendor 2",
    contactPerson: "Contact Person 2",
    email: "Vendor2@gmail.com",
    terms: "30 Days",
    fobPoint: "Location 2",
  },
];

export default function VendorsPage() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <PageTitle
          title="Vendors"
          description="Maintain supplier records and contact details for procurement operations."
        />

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <Plus size={18} />
          Add Vendor
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-5 py-4 text-left font-semibold">
                  Vendor Name
                </th>
                <th className="px-5 py-4 text-left font-semibold">
                  Contact Person
                </th>
                <th className="px-5 py-4 text-left font-semibold">Email</th>
                <th className="px-5 py-4 text-left font-semibold">Terms</th>
                <th className="px-5 py-4 text-left font-semibold">
                  FOB Point
                </th>
              </tr>
            </thead>

            <tbody>
              {vendors.map((vendor) => (
                <tr
                  key={vendor.email}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-5 py-4 font-medium text-slate-700">
                    {vendor.vendorName}
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    {vendor.contactPerson}
                  </td>
                  <td className="px-5 py-4 text-slate-700">{vendor.email}</td>
                  <td className="px-5 py-4 text-slate-700">{vendor.terms}</td>
                  <td className="px-5 py-4 text-slate-700">
                    {vendor.fobPoint}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}