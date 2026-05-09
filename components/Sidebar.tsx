"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type MenuItem = {
  label: string;
  href?: string;
  children?: {
    label: string;
    href: string;
  }[];
};

const menuItems: MenuItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Inventory", href: "/inventory" },
  { label: "Purchase Order", href: "/purchase-order" },
  {
    label: "Reports",
    children: [{ label: "In-transit", href: "/reports/in-transit" }],
  },
  {
    label: "Masters",
    children: [
      { label: "Vendors", href: "/masters/vendors" },
      { label: "Customers", href: "/masters/customers" },
      { label: "Item Master List", href: "/masters/item-master-list" },
    ],
  },
  {
    label: "Manage User",
    children: [{ label: "User Access", href: "/manage-user/user-access" }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Reports: pathname.startsWith("/reports"),
    Masters: pathname.startsWith("/masters"),
    "Manage User": pathname.startsWith("/manage-user"),
  });

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const isActive = (href: string) => pathname === href;

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 px-4 py-5">
      <div className="mb-8">
        <h1 className="text-lg font-bold text-slate-900">KG Inventory</h1>
        <p className="text-sm text-slate-500">Management Portal</p>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive(item.href)
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          }

          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => toggleMenu(item.label)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
              >
                <span>{item.label}</span>
                <span>{openMenus[item.label] ? "−" : "+"}</span>
              </button>

              {openMenus[item.label] && (
                <div className="mt-1 space-y-1 pl-3">
                  {item.children?.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={`block rounded-lg px-3 py-2 text-sm ${
                        isActive(child.href)
                          ? "bg-slate-900 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}