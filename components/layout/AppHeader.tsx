import React from 'react';

export default function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">RealEstate AI</h1>
        <p className="text-sm text-gray-500">Lead Copilot</p>
      </div>
      <button
        type="button"
        className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
      >
        + Add New Lead
      </button>
    </header>
  );
}
