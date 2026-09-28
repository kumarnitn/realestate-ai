"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lead } from '@/types/lead';

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('/api/leads');
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch leads');
        }
        
        setLeads(data.leads || []);
      } catch (err) {
        console.error('Error fetching leads:', err);
        setError('Unable to load leads. Please try refreshing the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeads();
  }, []);

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
        <StatsCard title="Total Leads" value={isLoading ? '...' : leads.length.toString()} />
        <StatsCard title="Hot Leads" value="0" />
        <StatsCard title="Warm Leads" value="0" />
        <StatsCard title="Cold Leads" value="0" />
      </section>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-12 text-center text-gray-600">Loading leads...</div>
      ) : error ? (
        <div className="py-12 text-center text-red-600">{error}</div>
      ) : leads.length === 0 ? (
        <EmptyLeadsState />
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 border-b pb-2">Recent Leads</h2>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {leads.map((lead) => (
              <div key={lead.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{lead.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{lead.location}</p>
                  <p className="text-sm font-medium text-gray-800">Req: <span className="font-normal text-gray-600">{lead.propertyRequirement}</span></p>
                  <p className="text-sm font-medium text-gray-800">Budget: <span className="font-normal text-gray-600">{lead.budget}</span></p>
                  <p className="text-sm font-medium text-gray-800">Timeline: <span className="font-normal text-gray-600">{lead.buyingTimeline}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
      <Link href="/leads/new" className="mt-4 inline-block rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900">
        + Add New Lead
      </Link>
    </div>
  );
}
