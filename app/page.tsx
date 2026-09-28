import React from 'react';

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Main heading */}
      <header className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-gray-900">Lead Dashboard</h1>
        <p className="mt-2 text-lg text-gray-600">
          Prioritize your inbound leads and decide what to do next.
        </p>
      </header>

      {/* Statistics cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Leads" value="0" />
        <StatsCard title="Hot Leads" value="0" />
        <StatsCard title="Warm Leads" value="0" />
        <StatsCard title="Cold Leads" value="0" />
      </section>

      {/* Empty state */}
      <EmptyLeadsState />
    </div>
  );
}

function StatsCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-800">{value}</p>
    </div>
  );
}

function EmptyLeadsState() {
  return (
    <div className="mt-12 text-center">
      <p className="text-xl font-medium text-gray-700">No leads yet</p>
      <p className="mt-2 text-gray-500">
        Add your first lead to start analyzing and prioritizing your sales pipeline.
      </p>
      <button
        type="button"
        className="mt-4 rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
      >
        + Add New Lead
      </button>
    </div>
  );
}
