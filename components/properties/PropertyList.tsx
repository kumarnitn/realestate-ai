"use client";
import React, { useState } from 'react';
import { Property } from '@/types/property';
import { Lead } from '@/types/lead';
import AddPropertyModal from './AddPropertyModal';

interface PropertyListProps {
  properties: Property[];
  leads: Lead[];
  onPropertyAdded: (newProp: Property) => void;
  onPropertyDeleted: (id: string) => void;
  onViewMatchedLeads?: (property: Property) => void;
}

export default function PropertyList({
  properties,
  leads,
  onPropertyAdded,
  onPropertyDeleted,
  onViewMatchedLeads,
}: PropertyListProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Compute portfolio stats
  const totalUnits = properties.length;
  const availableUnits = properties.filter((p) => p.status === 'Available').length;
  const reservedUnits = properties.filter((p) => p.status === 'Reserved').length;
  const soldUnits = properties.filter((p) => p.status === 'Sold').length;

  // Filter properties
  const filteredProperties = properties.filter((prop) => {
    const matchesStatus = statusFilter === 'ALL' || prop.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      prop.title.toLowerCase().includes(query) ||
      prop.location.toLowerCase().includes(query) ||
      prop.propertyType.toLowerCase().includes(query) ||
      prop.price.toLowerCase().includes(query);

    return matchesStatus && matchesQuery;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this property from inventory?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/properties?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        onPropertyDeleted(id);
      } else {
        alert(data.error || 'Failed to delete property');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting property');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Property Inventory</h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {availableUnits} Units Available
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Current flats, penthouses & apartments held in inventory. Matching units automatically upgrade leads to <strong className="text-red-600">HOT Priority</strong>.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500 self-start sm:self-auto shrink-0"
        >
          <span>+ Add Apartment / Flat</span>
        </button>
      </div>

      {/* Inventory Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs border-l-4 border-l-indigo-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inventory</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{totalUnits} Units</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Held flats & apartments</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available For Sale</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{availableUnits} Units</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Ready for buyer pitch</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reserved / In Token</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{reservedUnits} Units</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Under token negotiations</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs border-l-4 border-l-blue-500">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pipeline Match Rate</p>
          <p className="mt-1 text-2xl font-black text-indigo-600">
            {leads.filter((l) => l.matchedProperty).length} Leads
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Directly matched to inventory</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search inventory by title, location (e.g. Indiranagar), BHK, or price..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'Available', 'Reserved', 'Sold'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition shrink-0 ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Properties Cards Grid */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <span className="text-4xl">🏢</span>
          <h3 className="mt-3 text-lg font-bold text-slate-800">No properties found</h3>
          <p className="mt-1 text-xs text-slate-500">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try changing your search query or status filter.'
              : 'Add your first flat or apartment to begin matching inbound buyer leads!'}
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
          >
            + Add Apartment / Flat
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((prop) => {
            // Find which leads match this property
            const matchedLeads = leads.filter(
              (l) => l.matchedProperty?.id === prop.id || l.matchedProperties?.some((m) => m.id === prop.id)
            );

            return (
              <div
                key={prop.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {prop.propertyType}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                        prop.status === 'Available'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : prop.status === 'Reserved'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {prop.status}
                    </span>
                  </div>

                  {/* Title & Location */}
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition leading-snug">
                    {prop.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <span>📍</span> {prop.location}
                  </p>

                  {/* Price & Specs */}
                  <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Asking Price</p>
                      <p className="text-xl font-black text-slate-900 text-emerald-700">{prop.price}</p>
                    </div>
                    {prop.areaSqft && (
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-semibold text-slate-400">Carpet Area</p>
                        <p className="text-sm font-bold text-slate-700">{prop.areaSqft.toLocaleString()} sq ft</p>
                      </div>
                    )}
                  </div>

                  {/* Floor & Possession */}
                  <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-500">
                    {prop.floorNumber && (
                      <span className="flex items-center gap-1">
                        <span>🏢</span> {prop.floorNumber}
                      </span>
                    )}
                    {prop.possessionStatus && (
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <span>🔑</span> {prop.possessionStatus}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {prop.description && (
                    <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {prop.description}
                    </p>
                  )}

                  {/* Amenities Tags */}
                  {prop.amenities && prop.amenities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {prop.amenities.slice(0, 3).map((a, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                        >
                          {a}
                        </span>
                      ))}
                      {prop.amenities.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                          +{prop.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Matched Buyer Leads Box */}
                  <div className="mt-4 p-3 rounded-xl border border-indigo-100 bg-indigo-50/50">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-indigo-900 flex items-center gap-1">
                        <span>🎯</span> Matched Buyer Leads
                      </span>
                      <span className="font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full text-[11px]">
                        {matchedLeads.length} {matchedLeads.length === 1 ? 'Lead' : 'Leads'}
                      </span>
                    </div>

                    {matchedLeads.length > 0 ? (
                      <div className="space-y-1 mt-2">
                        {matchedLeads.slice(0, 2).map((l) => (
                          <div
                            key={l.id}
                            className="bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100 text-xs flex items-center justify-between shadow-2xs"
                          >
                            <span className="font-semibold text-slate-800 truncate mr-2">{l.name}</span>
                            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded">
                              HOT 🔥
                            </span>
                          </div>
                        ))}
                        {matchedLeads.length > 2 && (
                          <p className="text-[10px] text-indigo-600 font-medium text-center pt-0.5">
                            +{matchedLeads.length - 2} more prospective buyers
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic mt-1">
                        No current inbound lead specifically matches this unit yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {matchedLeads.length > 0 ? (
                    <button
                      onClick={() => onViewMatchedLeads && onViewMatchedLeads(prop)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition text-center shadow-xs flex items-center justify-center gap-1"
                    >
                      <span>⚡ View {matchedLeads.length} Matched Leads</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400 italic">No buyers yet</span>
                  )}

                  <button
                    onClick={() => handleDelete(prop.id)}
                    disabled={deletingId === prop.id}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    title="Delete property from inventory"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Property Modal */}
      <AddPropertyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPropertyAdded={onPropertyAdded}
      />
    </div>
  );
}
