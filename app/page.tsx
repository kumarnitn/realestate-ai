"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Lead } from '@/types/lead';
import { Property } from '@/types/property';
import LeadChat from '@/components/leads/LeadChat';
import PropertyList from '@/components/properties/PropertyList';
import PriorityAlignedList from '@/components/leads/PriorityAlignedList';
import AddPropertyModal from '@/components/properties/AddPropertyModal';
import { applyInventoryCalibration } from '@/lib/scoring';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'leads' | 'inventory'>('leads');
  const [viewMode, setViewMode] = useState<'grid' | 'priority_aligned'>('grid');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [triggerPrompt, setTriggerPrompt] = useState<string | null>(null);

  // Add property modal control from leads view
  const [isAddPropModalOpen, setIsAddPropModalOpen] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [leadsRes, propsRes] = await Promise.all([
        fetch('/api/leads'),
        fetch('/api/properties'),
      ]);

      const [leadsData, propsData] = await Promise.all([
        leadsRes.json(),
        propsRes.json(),
      ]);

      if (!leadsRes.ok || !leadsData.success) {
        throw new Error(leadsData.error || 'Failed to fetch leads');
      }

      const fetchedProps: Property[] = propsData.success ? propsData.properties || [] : [];
      setProperties(fetchedProps);

      // Calibrate leads with fetched properties
      const fetchedLeads: Lead[] = leadsData.leads || [];
      const calibratedLeads = applyInventoryCalibration(fetchedLeads, fetchedProps);
      setLeads(calibratedLeads);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Unable to load data. Please check your connection and try refreshing.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectLeadForChat = (id: string, promptText?: string) => {
    setSelectedLeadId(id);
    if (promptText) {
      setTriggerPrompt(promptText);
    }
    chatContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handlePropertyAdded = (newProp: Property) => {
    const updatedProps = [newProp, ...properties];
    setProperties(updatedProps);
    // Instantly re-calibrate leads in state
    const recalibrated = applyInventoryCalibration(leads, updatedProps);
    setLeads(recalibrated);
  };

  const handlePropertyDeleted = (id: string) => {
    const updatedProps = properties.filter((p) => p.id !== id);
    setProperties(updatedProps);
    const recalibrated = applyInventoryCalibration(leads, updatedProps);
    setLeads(recalibrated);
  };

  const [analyzingLeadId, setAnalyzingLeadId] = useState<string | null>(null);

  const handleAnalyzeLead = async (id: string) => {
    setAnalyzingLeadId(id);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchData();
      } else {
        alert(data.error || 'Failed to analyze lead');
      }
    } catch (err) {
      console.error(err);
      alert('Error triggering analysis');
    } finally {
      setAnalyzingLeadId(null);
    }
  };

  const handleViewMatchedLeadsFromProperty = (property: Property) => {
    setActiveTab('leads');
    setViewMode('priority_aligned');
  };

  // Stats calculation
  const hotLeadsCount = leads.filter((l) => l.priority === 'HOT').length;
  const warmLeadsCount = leads.filter((l) => l.priority === 'WARM').length;
  const coldLeadsCount = leads.filter((l) => l.priority === 'COLD').length;
  const matchedLeadsCount = leads.filter((l) => l.matchedProperty).length;
  const availablePropsCount = properties.filter((p) => p.status === 'Available').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Global Actions */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">RealEstate AI Copilot</h1>
            <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
              Live Pipeline
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Intelligent lead scoring, inventory alignment, and automated sales response generator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddPropModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
          >
            <span>🏢 + Add Flat to Inventory</span>
          </button>
          <Link
            href="/leads/new"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <span>👤 + Add New Lead</span>
          </Link>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex gap-2 -mb-px">
          {/* Tab 1: Leads Pipeline */}
          <button
            onClick={() => setActiveTab('leads')}
            className={`pb-3.5 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'leads'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span>📋 Inbound Leads Pipeline</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'leads'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {leads.length}
            </span>
            {matchedLeadsCount > 0 && (
              <span className="hidden sm:inline-flex text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {matchedLeadsCount} Matched 🔥
              </span>
            )}
          </button>

          {/* Tab 2: Property Inventory */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3.5 px-4 text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              activeTab === 'inventory'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <span>🏢 Property Inventory (Flats & Apartments)</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
                activeTab === 'inventory'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {properties.length}
            </span>
            <span className="hidden sm:inline-flex text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
              {availablePropsCount} Available
            </span>
          </button>
        </div>

        {/* View Mode Toggle Button for Leads (Prominent Button) */}
        {activeTab === 'leads' && (
          <div className="pb-2 hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Layout:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Standard Grid
            </button>
            <button
              onClick={() => setViewMode('priority_aligned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'priority_aligned'
                  ? 'bg-gradient-to-r from-red-600 to-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/20'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
              }`}
            >
              <span>⚡ Priority Aligned View</span>
              <span className="text-[10px] bg-white text-indigo-900 px-1.5 py-0.2 rounded font-black">
                HOT First
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
          <svg className="animate-spin h-9 w-9 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-slate-700 font-semibold text-sm">Syncing pipeline & inventory properties...</span>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-600 bg-red-50 rounded-2xl p-6 border border-red-200">
          <p className="font-semibold text-sm">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
          >
            Retry Connection
          </button>
        </div>
      ) : activeTab === 'inventory' ? (
        /* =========================================================================
           TAB 2: PROPERTY INVENTORY VIEW
           ========================================================================= */
        <PropertyList
          properties={properties}
          leads={leads}
          onPropertyAdded={handlePropertyAdded}
          onPropertyDeleted={handlePropertyDeleted}
          onViewMatchedLeads={handleViewMatchedLeadsFromProperty}
        />
      ) : (
        /* =========================================================================
           TAB 1: LEADS PIPELINE VIEW
           ========================================================================= */
        <div className="space-y-6">
          {/* Statistics summary */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatsCard
              title="Total Pipeline"
              value={leads.length.toString()}
              subtitle="All inbound prospects"
              accentColor="border-l-indigo-500"
            />
            <StatsCard
              title="Hot Leads"
              value={hotLeadsCount.toString()}
              subtitle="Urgent & inventory matches"
              accentColor="border-l-red-500 text-red-600"
            />
            <StatsCard
              title="Inventory Matched"
              value={matchedLeadsCount.toString()}
              subtitle="Exact flat in stock ready"
              accentColor="border-l-emerald-500 text-emerald-600"
            />
            <StatsCard
              title="Warm Leads"
              value={warmLeadsCount.toString()}
              subtitle="1–3 month horizon"
              accentColor="border-l-orange-500 text-orange-600"
            />
            <StatsCard
              title="Cold / Exploring"
              value={coldLeadsCount.toString()}
              subtitle="Long term nurture"
              accentColor="border-l-blue-500 text-blue-600"
            />
          </section>

          {/* Mobile view toggle */}
          <div className="sm:hidden flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-semibold text-slate-700">Display Layout:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                  viewMode === 'grid' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('priority_aligned')}
                className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                  viewMode === 'priority_aligned' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'
                }`}
              >
                ⚡ Priority View
              </button>
            </div>
          </div>

          {/* VIEW MODE 1: PRIORITY-WISE ALIGNED VIEW (The requested feature) */}
          {viewMode === 'priority_aligned' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Priority Aligned Leads List */}
              <div className="lg:col-span-7">
                <PriorityAlignedList
                  leads={leads}
                  properties={properties}
                  selectedLeadId={selectedLeadId}
                  onSelectLeadForChat={handleSelectLeadForChat}
                  onOpenAddPropertyModal={() => setIsAddPropModalOpen(true)}
                  onAnalyzeLead={handleAnalyzeLead}
                  analyzingLeadId={analyzingLeadId}
                />
              </div>

              {/* Right Column: AI Assistant for Pitching & Copilot */}
              <div ref={chatContainerRef} className="lg:col-span-5 lg:sticky lg:top-6">
                <LeadChat
                  leads={leads}
                  selectedLeadId={selectedLeadId}
                  onSelectLeadId={setSelectedLeadId}
                  triggerPrompt={triggerPrompt}
                  onClearTriggerPrompt={() => setTriggerPrompt(null)}
                />
              </div>
            </div>
          ) : (
            /* VIEW MODE 2: STANDARD GRID VIEW */
            leads.length === 0 ? (
              <EmptyLeadsState />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Leads Grid */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Recent Inbound Leads</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Click &quot;Chat with AI&quot; or &quot;⚡ Priority Aligned View&quot; to inspect matching apartments.
                      </p>
                    </div>
                    <button
                      onClick={() => setViewMode('priority_aligned')}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition flex items-center gap-1"
                    >
                      <span>⚡ Priority View</span>
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                    {leads.map((lead) => {
                      const isSelected = selectedLeadId === lead.id;
                      const hasMatch = Boolean(lead.matchedProperty);

                      return (
                        <div
                          key={lead.id}
                          className={`rounded-2xl border bg-white p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10'
                              : hasMatch && lead.priority === 'HOT'
                              ? 'border-red-200 ring-1 ring-red-100'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            {/* Lead Card Header */}
                            <div className="flex justify-between items-start mb-2.5">
                              <div>
                                <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                                  {lead.name}
                                  {isSelected && (
                                    <span className="text-[10px] bg-indigo-600 text-white font-medium px-1.5 py-0.5 rounded">
                                      Active Chat
                                    </span>
                                  )}
                                </h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <span>📍</span> {lead.location}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                {lead.priority ? (
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                                      lead.priority === 'HOT'
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : lead.priority === 'WARM'
                                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}
                                  >
                                    {lead.priority}
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                                    {lead.analysisStatus || 'Pending'}
                                  </span>
                                )}
                                {lead.score !== undefined && (
                                  <span className="text-[10px] font-bold text-slate-600">
                                    Score: {lead.score}/100
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Requirement Details */}
                            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 mt-2 mb-3">
                              <div className="flex items-start gap-1">
                                <span className="font-semibold text-slate-700 shrink-0">🏠 Req:</span>
                                <span className="text-slate-800 font-medium">{lead.propertyRequirement}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-slate-700 shrink-0">💰 Budget:</span>
                                <span className="text-slate-800 font-medium">{lead.budget}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-slate-700 shrink-0">⏳ Timeline:</span>
                                <span className="text-slate-800">{lead.buyingTimeline}</span>
                              </div>
                            </div>

                            {/* Inventory Match Pill if present */}
                            {lead.matchedProperty && (
                              <div className="mb-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-1.5">
                                <span className="shrink-0 text-sm">🎯</span>
                                <div className="leading-snug">
                                  <span className="font-bold block text-[11px] text-emerald-800">
                                    Matched Flat: {lead.matchedProperty.title}
                                  </span>
                                  <span className="text-[10px] text-emerald-700">
                                    Price: {lead.matchedProperty.price} ({lead.matchedProperty.propertyType})
                                  </span>
                                </div>
                              </div>
                            )}

                            {lead.customerMessage && (
                              <p className="text-xs text-slate-600 line-clamp-2 italic mb-2">
                                &ldquo;{lead.customerMessage}&rdquo;
                              </p>
                            )}
                          </div>

                          {/* Quick AI Analysis button if pending */}
                          {lead.analysisStatus === 'pending' && (
                            <button
                              onClick={() => handleAnalyzeLead(lead.id)}
                              disabled={analyzingLeadId === lead.id}
                              className="w-full mt-2 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-60"
                            >
                              {analyzingLeadId === lead.id ? (
                                <>
                                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                  </svg>
                                  <span>Analyzing with AI...</span>
                                </>
                              ) : (
                                <>
                                  <span>⚡</span>
                                  <span>Run AI Analysis & Score</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Action Buttons */}
                          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                            <Link
                              href={`/leads/${lead.id}`}
                              className="text-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                            >
                              View Details
                            </Link>
                            <button
                              onClick={() => handleSelectLeadForChat(lead.id)}
                              className={`text-center rounded-lg px-3 py-1.5 text-xs font-semibold transition flex items-center justify-center gap-1 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                              }`}
                            >
                              <span>💬</span>
                              <span>{isSelected ? 'Chatting' : 'Chat with AI'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: AI Sales Assistant */}
                <div ref={chatContainerRef} className="lg:col-span-5 lg:sticky lg:top-6">
                  <LeadChat
                    leads={leads}
                    selectedLeadId={selectedLeadId}
                    onSelectLeadId={setSelectedLeadId}
                    triggerPrompt={triggerPrompt}
                    onClearTriggerPrompt={() => setTriggerPrompt(null)}
                  />
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Global Add Property Modal */}
      <AddPropertyModal
        isOpen={isAddPropModalOpen}
        onClose={() => setIsAddPropModalOpen(false)}
        onPropertyAdded={handlePropertyAdded}
      />
    </div>
  );
}

function StatsCard({
  title,
  value,
  subtitle,
  accentColor = '',
}: {
  title: string;
  value: string;
  subtitle: string;
  accentColor?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-xs border-l-4 ${accentColor}`}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
      <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  );
}

function EmptyLeadsState() {
  return (
    <div className="mt-8 text-center bg-white rounded-2xl p-12 border border-slate-200 shadow-xs max-w-lg mx-auto">
      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
        🏠
      </div>
      <p className="text-xl font-bold text-slate-800">No leads in pipeline yet</p>
      <p className="mt-2 text-sm text-slate-500 leading-relaxed">
        Add your first real estate lead to start analyzing requirements, scoring prospects, and matching with inventory.
      </p>
      <Link
        href="/leads/new"
        className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition shadow-sm"
      >
        <span>+</span> Add Your First Lead
      </Link>
    </div>
  );
}
