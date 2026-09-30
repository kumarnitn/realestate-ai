"use client";
import React, { useState } from 'react';
import { FinalizedDeal } from '@/types/deal';

interface FinalizedDealsLogProps {
  deals: FinalizedDeal[];
  onDealDeleted: (id: string) => void;
  onOpenFinalizeModal: () => void;
}

export default function FinalizedDealsLog({
  deals,
  onDealDeleted,
  onOpenFinalizeModal,
}: FinalizedDealsLogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedDealForModal, setSelectedDealForModal] = useState<FinalizedDeal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter deals
  const filteredDeals = deals.filter((deal) => {
    if (typeFilter !== 'ALL' && deal.dealType !== typeFilter) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      deal.clientName.toLowerCase().includes(q) ||
      (deal.propertyTitle || '').toLowerCase().includes(q) ||
      (deal.agentNotes || '').toLowerCase().includes(q) ||
      deal.agreedPrice.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal log record?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/deals?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        onDealDeleted(id);
      } else {
        alert(data.error || 'Failed to delete deal log');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting deal log');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Finalized Deals & Closing Log</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {deals.length} Closed Deals
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Historical transaction records of finalized buyer leads and sold apartments. Archived with full closing details.
          </p>
        </div>

        <button
          onClick={onOpenFinalizeModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 self-start sm:self-auto shrink-0"
        >
          <span>🤝 + Log Another Finalized Deal</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Deals Won</p>
          <p className="mt-1 text-2xl font-black text-slate-900 text-emerald-700">{deals.length} Transactions</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Removed from active pipeline & archived</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs border-l-4 border-l-indigo-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lead + Flat Match Closures</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {deals.filter((d) => d.dealType === 'LEAD_AND_PROPERTY').length} Deals
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Sold inventory directly to matched buyers</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs border-l-4 border-l-amber-500 col-span-2 lg:col-span-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Closing</p>
          <p className="mt-1 text-base font-bold text-slate-900 truncate">
            {deals[0] ? `${deals[0].clientName} (${deals[0].agreedPrice})` : 'No deals yet'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {deals[0] ? new Date(deals[0].finalizedAt).toLocaleDateString() : 'Awaiting first closure'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search finalized deals by client name, property title, or remarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { key: 'ALL', label: 'All Deals' },
            { key: 'LEAD_AND_PROPERTY', label: 'Lead + Unit' },
            { key: 'LEAD_ONLY', label: 'Lead Only' },
            { key: 'PROPERTY_ONLY', label: 'Apartment Only' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTypeFilter(item.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
                typeFilter === item.key
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Deals List */}
      {filteredDeals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <span className="text-4xl">📁</span>
          <h3 className="mt-3 text-lg font-bold text-slate-800">No finalized deals logged yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            When you finalize any buyer lead or sell an apartment, click &quot;Finalize Deal&quot; to enter closing details and log them here permanently.
          </p>
          <button
            onClick={onOpenFinalizeModal}
            className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition"
          >
            + Log a Finalized Deal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeals.map((deal) => (
            <div
              key={deal.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              {/* Header Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <span>🎉</span> Deal Finalized & Closed
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ID: {deal.id}
                  </span>
                  <span className="text-xs text-slate-500">
                    Logged: {new Date(deal.finalizedAt).toLocaleDateString()} at {new Date(deal.finalizedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleDelete(deal.id)}
                    disabled={deletingId === deal.id}
                    className="text-[11px] text-slate-400 hover:text-red-600 transition p-1 rounded hover:bg-red-50"
                    title="Delete log record"
                  >
                    🗑️ Remove Log
                  </button>
                </div>
              </div>

              {/* Grid: Client & Property Details */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Client Box */}
                <div className="md:col-span-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    👤 Client / Buyer Information
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{deal.clientName}</p>
                  {deal.leadDetails?.location && (
                    <p className="text-slate-600">📍 {deal.leadDetails.location}</p>
                  )}
                  {deal.leadDetails?.propertyRequirement && (
                    <p className="text-slate-600 truncate">🏠 {deal.leadDetails.propertyRequirement}</p>
                  )}
                  {deal.leadDetails?.budget && (
                    <p className="text-slate-600">💰 Original Budget: {deal.leadDetails.budget}</p>
                  )}
                </div>

                {/* Property Box */}
                <div className="md:col-span-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    🏢 Flat / Apartment Unit
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {deal.propertyTitle || 'External Property Unit'}
                  </p>
                  {deal.propertyDetails?.location && (
                    <p className="text-slate-600">📍 {deal.propertyDetails.location}</p>
                  )}
                  {deal.propertyDetails?.propertyType && (
                    <p className="text-slate-600">🏷️ {deal.propertyDetails.propertyType}</p>
                  )}
                  {deal.propertyDetails?.price && (
                    <p className="text-slate-600">🏷️ Asking Price: {deal.propertyDetails.price}</p>
                  )}
                </div>

                {/* Financial Closing Box */}
                <div className="md:col-span-4 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 space-y-1 text-xs text-emerald-950">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block mb-1">
                    💰 Transaction Terms
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-slate-600">Agreed Price:</span>
                    <span className="text-base font-black text-emerald-800">{deal.agreedPrice}</span>
                  </div>
                  {deal.tokenAdvance && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">Token Advance:</span>
                      <span className="font-bold text-emerald-700">{deal.tokenAdvance}</span>
                    </div>
                  )}
                  {deal.closingDate && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-600">Closing Date:</span>
                      <span className="font-medium text-slate-800">{deal.closingDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Log Notes Section */}
              {deal.agentNotes && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-950">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-amber-800 block mb-0.5">
                    📝 Closing Notes & Information Log:
                  </span>
                  <p className="leading-relaxed whitespace-pre-wrap">{deal.agentNotes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
