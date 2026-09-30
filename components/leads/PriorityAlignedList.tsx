"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { Lead } from '@/types/lead';
import { Property } from '@/types/property';

interface PriorityAlignedListProps {
  leads: Lead[];
  properties: Property[];
  selectedLeadId?: string | null;
  onSelectLeadForChat: (leadId: string, customPrompt?: string) => void;
  onOpenAddPropertyModal?: (prefill?: Partial<Property>) => void;
  onAnalyzeLead?: (id: string) => void;
  analyzingLeadId?: string | null;
}

export default function PriorityAlignedList({
  leads,
  properties,
  selectedLeadId,
  onSelectLeadForChat,
  onOpenAddPropertyModal,
  onAnalyzeLead,
  analyzingLeadId,
}: PriorityAlignedListProps) {
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HOT' | 'WARM' | 'COLD' | 'MATCHED_ONLY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMatrixModal, setShowMatrixModal] = useState(false);

  // Strictly sort leads in Priority-Wise order: HOT (score desc) -> WARM -> COLD -> Pending
  const priorityRank: Record<string, number> = { HOT: 1, WARM: 2, COLD: 3, pending: 4 };

  const sortedLeads = [...leads].sort((a, b) => {
    const rankA = priorityRank[a.priority || 'pending'] || 5;
    const rankB = priorityRank[b.priority || 'pending'] || 5;
    if (rankA !== rankB) return rankA - rankB;
    // Tie-breaker: inventory match first
    if (Boolean(a.matchedProperty) !== Boolean(b.matchedProperty)) {
      return a.matchedProperty ? -1 : 1;
    }
    // Tie-breaker: score descending
    return (b.score || 0) - (a.score || 0);
  });

  // Filter leads
  const filteredLeads = sortedLeads.filter((lead) => {
    if (priorityFilter === 'MATCHED_ONLY' && !lead.matchedProperty) return false;
    if (priorityFilter !== 'ALL' && priorityFilter !== 'MATCHED_ONLY' && lead.priority !== priorityFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(q) ||
      lead.location.toLowerCase().includes(q) ||
      lead.propertyRequirement.toLowerCase().includes(q) ||
      (lead.matchedProperty?.title || '').toLowerCase().includes(q)
    );
  });

  const hotCount = leads.filter((l) => l.priority === 'HOT').length;
  const matchedCount = leads.filter((l) => l.matchedProperty).length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <h2 className="text-2xl font-black tracking-tight text-white">
                Priority-Wise Leads & Matched Properties
              </h2>
            </div>
            <p className="mt-1 text-xs text-indigo-200 leading-relaxed max-w-2xl">
              Buyer leads dynamically ranked by priority. Inbound leads with matching flats or apartments in our inventory are promoted to <strong className="text-red-300">HOT Priority</strong> with immediate closing potential.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => setShowMatrixModal(true)}
              className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-1.5 shadow-xs"
            >
              <span>📊</span>
              <span>Alignment Matrix Table</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setPriorityFilter('ALL')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                priorityFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              All Ranked ({leads.length})
            </button>
            <button
              onClick={() => setPriorityFilter('HOT')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                priorityFilter === 'HOT'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'bg-red-500/20 text-red-200 hover:bg-red-500/30'
              }`}
            >
              <span>🔥 HOT Priority ({hotCount})</span>
            </button>
            <button
              onClick={() => setPriorityFilter('MATCHED_ONLY')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                priorityFilter === 'MATCHED_ONLY'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
              }`}
            >
              <span>🎯 Matched Inventory Units ({matchedCount})</span>
            </button>
            <button
              onClick={() => setPriorityFilter('WARM')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                priorityFilter === 'WARM'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-orange-500/20 text-orange-200 hover:bg-orange-500/30'
              }`}
            >
              Warm Leads
            </button>
            <button
              onClick={() => setPriorityFilter('COLD')}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                priorityFilter === 'COLD'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30'
              }`}
            >
              Cold / Exploring
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-white/50 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search buyer or property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* Aligned Lead-Property Cards */}
      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
            <span className="text-3xl">🎯</span>
            <p className="font-bold text-slate-800 text-base mt-2">No matching leads found</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the filter to All Ranked.</p>
            <button
              onClick={() => { setPriorityFilter('ALL'); setSearchQuery(''); }}
              className="mt-3 px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredLeads.map((lead, index) => {
            const isSelected = selectedLeadId === lead.id;
            const hasMatch = Boolean(lead.matchedProperty);
            const matchedProp = lead.matchedProperty;

            return (
              <div
                key={lead.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs hover:shadow-md overflow-hidden ${
                  lead.priority === 'HOT'
                    ? 'border-red-200 ring-1 ring-red-100'
                    : lead.priority === 'WARM'
                    ? 'border-orange-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Priority Status Strip */}
                <div
                  className={`px-5 py-2 flex items-center justify-between text-xs font-semibold border-b ${
                    lead.priority === 'HOT'
                      ? 'bg-red-50/70 text-red-900 border-red-100'
                      : lead.priority === 'WARM'
                      ? 'bg-orange-50/70 text-orange-900 border-orange-100'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white shadow-2xs flex items-center justify-center font-bold text-[11px] text-slate-700 border border-slate-200">
                      #{index + 1}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                        lead.priority === 'HOT'
                          ? 'bg-red-600 text-white shadow-2xs'
                          : lead.priority === 'WARM'
                          ? 'bg-orange-600 text-white shadow-2xs'
                          : 'bg-blue-600 text-white shadow-2xs'
                      }`}
                    >
                      {lead.priority || 'Pending'}
                    </span>
                    {lead.score !== undefined && (
                      <span className="text-slate-600 font-bold">
                        Score: {lead.score}/100
                      </span>
                    )}
                    {hasMatch && (
                      <span className="hidden sm:inline-flex text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                        ⚡ Inventory Matched
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">Timeline:</span>
                    <span className="font-bold text-slate-800">{lead.buyingTimeline}</span>
                  </div>
                </div>

                {/* Card Content Grid: Left Lead, Right Aligned Property */}
                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  {/* Left Column: Lead Profile */}
                  <div className="lg:col-span-6 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            {lead.name}
                            {isSelected && (
                              <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded">
                                Active in Chat
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span>📍</span> {lead.location}
                          </p>
                        </div>
                      </div>

                      {/* Requirement & Budget Box */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mt-2.5 space-y-1.5 text-xs">
                        <div className="flex items-start gap-1.5">
                          <span className="font-semibold text-slate-700 shrink-0">🏠 Requirement:</span>
                          <span className="text-slate-900 font-semibold">{lead.propertyRequirement}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-700 shrink-0">💰 Budget:</span>
                          <span className="text-slate-900 font-semibold">{lead.budget}</span>
                        </div>
                      </div>

                      {lead.customerMessage && (
                        <p className="text-xs text-slate-600 italic mt-2.5 line-clamp-2 bg-white p-2 rounded-lg border border-slate-100">
                          &ldquo;{lead.customerMessage}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition"
                      >
                        Lead Details →
                      </Link>

                      {lead.analysisStatus === 'pending' && onAnalyzeLead && (
                        <button
                          onClick={() => onAnalyzeLead(lead.id)}
                          disabled={analyzingLeadId === lead.id}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1 shadow-2xs disabled:opacity-60"
                        >
                          {analyzingLeadId === lead.id ? (
                            <>
                              <svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                              </svg>
                              <span>Analyzing...</span>
                            </>
                          ) : (
                            <>
                              <span>⚡</span>
                              <span>Run AI Analysis</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Aligned Held Property */}
                  <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border p-4 bg-gradient-to-br from-slate-50 to-white shadow-2xs">
                    {hasMatch && matchedProp ? (
                      <div className="flex flex-col h-full justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                              <span>🎯</span> Aligned Apartment Unit
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {matchedProp.status}
                            </span>
                          </div>

                          <h4 className="mt-2 text-sm font-bold text-slate-900 leading-snug">
                            {matchedProp.title}
                          </h4>

                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-[10px] text-slate-400 block font-medium">Asking Price</span>
                              <span className="font-black text-emerald-700 text-sm">{matchedProp.price}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-100">
                              <span className="text-[10px] text-slate-400 block font-medium">Type / Config</span>
                              <span className="font-bold text-slate-800 text-xs">{matchedProp.propertyType}</span>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                            <span>📍</span> {matchedProp.location}
                          </p>

                          <div className="mt-2 p-2 bg-emerald-50/70 border border-emerald-200/60 rounded-lg text-[11px] text-emerald-900 font-medium">
                            {matchedProp.matchReason}
                          </div>
                        </div>

                        {/* Quick AI Pitch Action */}
                        <div className="pt-2 border-t border-slate-100">
                          <button
                            onClick={() =>
                              onSelectLeadForChat(
                                lead.id,
                                `Draft a personalized pitch email for ${lead.name} introducing our matching inventory property: ${matchedProp.title} in ${matchedProp.location} (Price: ${matchedProp.price}). Highlight why it perfectly satisfies their requirement for ${lead.propertyRequirement}.`
                              )
                            }
                            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <span>💬 Pitch this Apartment with AI</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full justify-between items-center text-center p-4 space-y-3">
                        <div className="my-auto">
                          <span className="text-2xl text-slate-400">🏢</span>
                          <p className="font-semibold text-xs text-slate-700 mt-1">
                            No Direct Flat in Inventory Currently
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                            Looking for {lead.propertyRequirement} in {lead.location} ({lead.budget}).
                          </p>
                        </div>

                        <div className="w-full pt-2 border-t border-slate-100 flex gap-2">
                          <button
                            onClick={() =>
                              onOpenAddPropertyModal &&
                              onOpenAddPropertyModal({
                                location: lead.location,
                                price: lead.budget,
                              })
                            }
                            className="flex-1 py-1.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            + Add Matching Unit
                          </button>
                          <button
                            onClick={() =>
                              onSelectLeadForChat(
                                lead.id,
                                `What advice or alternative property options should I suggest to ${lead.name} regarding their requirement (${lead.propertyRequirement}) and budget (${lead.budget})?`
                              )
                            }
                            className="flex-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
                          >
                            💬 Consult AI
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Alignment Matrix Table Modal */}
      {showMatrixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>📊</span> Real Estate Lead Priority & Inventory Alignment Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete executive overview of leads sorted by priority with aligned flats and apartments.
                </p>
              </div>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <table className="min-w-full text-left text-xs text-slate-700 border-collapse">
                <thead className="bg-slate-100 text-slate-900 font-bold uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="p-3">Rank & Lead</th>
                    <th className="p-3">Priority / Score</th>
                    <th className="p-3">Requirement</th>
                    <th className="p-3">Budget</th>
                    <th className="p-3">Aligned Inventory Apartment</th>
                    <th className="p-3">Unit Price</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedLeads.map((lead, idx) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-400">#{idx + 1}</span>
                          <div>
                            <p className="font-bold text-slate-900">{lead.name}</p>
                            <p className="text-[10px] text-slate-500">{lead.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            lead.priority === 'HOT'
                              ? 'bg-red-100 text-red-700'
                              : lead.priority === 'WARM'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {lead.priority || 'Pending'}
                        </span>
                        {lead.score !== undefined && (
                          <span className="ml-1 text-[10px] text-slate-500 font-semibold">
                            ({lead.score})
                          </span>
                        )}
                      </td>
                      <td className="p-3 max-w-[200px] truncate" title={lead.propertyRequirement}>
                        {lead.propertyRequirement}
                      </td>
                      <td className="p-3 font-medium text-slate-900">{lead.budget}</td>
                      <td className="p-3">
                        {lead.matchedProperty ? (
                          <div>
                            <span className="font-bold text-indigo-900 block">
                              {lead.matchedProperty.title}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium">
                              ✓ {lead.matchedProperty.propertyType}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No inventory match</span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-emerald-700">
                        {lead.matchedProperty?.price || '—'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setShowMatrixModal(false);
                            onSelectLeadForChat(
                              lead.id,
                              lead.matchedProperty
                                ? `Draft a pitch for ${lead.name} featuring ${lead.matchedProperty.title}.`
                                : `Draft a consultation response for ${lead.name}.`
                            );
                          }}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold transition"
                        >
                          Pitch AI
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>{sortedLeads.length} Total Leads | {matchedCount} Matched to Inventory</span>
              <button
                onClick={() => setShowMatrixModal(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
