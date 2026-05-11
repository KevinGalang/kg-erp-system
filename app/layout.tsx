import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "KG Inventory",
  description: "Inventory Management App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900">
        <div className="flex min-h-screen bg-white">
          <aside className="w-72 shrink-0 bg-slate-900" />
          <div className="fixed left-0 top-0 h-full w-72 overflow-y-auto bg-slate-900">
            <Sidebar />
          </div>
          <div className="flex flex-1 flex-col bg-white ml-72">
            <Header />
            <main className="flex-1 bg-white p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}