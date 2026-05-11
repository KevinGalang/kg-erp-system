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
      <body className="bg-white text-slate-900 h-screen overflow-hidden">
        <div className="flex h-screen bg-white">
          <Sidebar />

          <div className="flex flex-1 flex-col bg-white overflow-auto">
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