import React from 'react';
import Link from 'next/link';

export default function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8 shadow-2xs">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition">
            🏠
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition leading-tight">
              RealEstate AI
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Lead Copilot & Inventory Matcher</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition hidden sm:inline-block"
        >
          Pipeline & Inventory
        </Link>
        <Link
          href="/leads/new"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          + Add New Lead
        </Link>
      </div>
    </header>
  );
}
