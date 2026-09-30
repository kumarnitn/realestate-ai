"use client";
import React, { useState, useEffect } from 'react';
import { Lead } from '@/types/lead';
import { Property } from '@/types/property';
import { FinalizedDeal, DealType } from '@/types/deal';

interface FinalizeDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLead?: Lead | null;
  initialProperty?: Property | null;
  allLeads: Lead[];
  allProperties: Property[];
  onDealFinalized: (deal: FinalizedDeal) => void;
}

export default function FinalizeDealModal({
  isOpen,
  onClose,
  initialLead,
  initialProperty,
  allLeads,
  allProperties,
  onDealFinalized,
}: FinalizeDealModalProps) {
  const [dealType, setDealType] = useState<DealType>('LEAD_AND_PROPERTY');
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');

  const [agreedPrice, setAgreedPrice] = useState('');
  const [tokenAdvance, setTokenAdvance] = useState('');
  const [closingDate, setClosingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [agentNotes, setAgentNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize or reset when opened
  useEffect(() => {
    if (isOpen) {
      if (initialLead && initialProperty) {
        setDealType('LEAD_AND_PROPERTY');
        setSelectedLeadId(initialLead.id);
        setSelectedPropertyId(initialProperty.id);
        setAgreedPrice(initialProperty.price || initialLead.budget);
      } else if (initialLead) {
        if (initialLead.matchedProperty) {
          setDealType('LEAD_AND_PROPERTY');
          setSelectedLeadId(initialLead.id);
          setSelectedPropertyId(initialLead.matchedProperty.id);
          setAgreedPrice(initialLead.matchedProperty.price || initialLead.budget);
        } else {
          setDealType('LEAD_ONLY');
          setSelectedLeadId(initialLead.id);
          setSelectedPropertyId('');
          setAgreedPrice(initialLead.budget);
        }
      } else if (initialProperty) {
        setDealType('PROPERTY_ONLY');
        setSelectedLeadId('');
        setSelectedPropertyId(initialProperty.id);
        setAgreedPrice(initialProperty.price);
      } else {
        setDealType('LEAD_AND_PROPERTY');
        setSelectedLeadId(allLeads[0]?.id || '');
        setSelectedPropertyId(allProperties[0]?.id || '');
        setAgreedPrice('');
      }

      setError(null);
    }
  }, [isOpen, initialLead, initialProperty]);

  if (!isOpen) return null;

  const currentLead = allLeads.find((l) => l.id === selectedLeadId) || initialLead;
  const currentProperty = allProperties.find((p) => p.id === selectedPropertyId) || initialProperty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedPrice.trim()) {
      setError('Please specify the agreed closing price.');
      return;
    }

    if (dealType === 'LEAD_AND_PROPERTY' && (!currentLead || !currentProperty)) {
      setError('Please select both a Lead and a Property to finalize.');
      return;
    }

    if (dealType === 'LEAD_ONLY' && !currentLead) {
      setError('Please select a Lead to finalize.');
      return;
    }

    if (dealType === 'PROPERTY_ONLY' && !currentProperty) {
      setError('Please select a Property to finalize.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        dealType,
        clientName: currentLead?.name || 'Walk-in Client',
        propertyTitle: currentProperty?.title || 'External Unit',
        agreedPrice: agreedPrice.trim(),
        tokenAdvance: tokenAdvance.trim() || undefined,
        closingDate,
        agentNotes: agentNotes.trim() || undefined,
        leadId: (dealType === 'LEAD_AND_PROPERTY' || dealType === 'LEAD_ONLY') ? currentLead?.id : undefined,
        propertyId: (dealType === 'LEAD_AND_PROPERTY' || dealType === 'PROPERTY_ONLY') ? currentProperty?.id : undefined,
        leadDetails: currentLead ? {
          id: currentLead.id,
          name: currentLead.name,
          location: currentLead.location,
          budget: currentLead.budget,
          propertyRequirement: currentLead.propertyRequirement,
          buyingTimeline: currentLead.buyingTimeline,
          priority: currentLead.priority,
          score: currentLead.score,
          customerMessage: currentLead.customerMessage,
        } : undefined,
        propertyDetails: currentProperty ? {
          id: currentProperty.id,
          title: currentProperty.title,
          location: currentProperty.location,
          price: currentProperty.price,
          propertyType: currentProperty.propertyType,
          areaSqft: currentProperty.areaSqft,
          floorNumber: currentProperty.floorNumber,
        } : undefined,
      };

      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to finalize deal');
      }

      onDealFinalized(data.deal);
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error finalizing deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-gradient-to-r from-emerald-950 to-slate-900 text-white">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>🤝</span> Finalize Deal & Log Closing Details
            </h2>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Enter agreed closing details. The record will be permanently archived in Deals Log, and removed from the active pipeline.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          {/* Deal Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              What are you finalizing?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDealType('LEAD_AND_PROPERTY')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                  dealType === 'LEAD_AND_PROPERTY'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Lead + Apartment
              </button>
              <button
                type="button"
                onClick={() => setDealType('LEAD_ONLY')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                  dealType === 'LEAD_ONLY'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Lead Only
              </button>
              <button
                type="button"
                onClick={() => setDealType('PROPERTY_ONLY')}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center ${
                  dealType === 'PROPERTY_ONLY'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Apartment Only
              </button>
            </div>
          </div>

          {/* Lead Selector */}
          {(dealType === 'LEAD_AND_PROPERTY' || dealType === 'LEAD_ONLY') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Client / Buyer Lead <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => {
                  setSelectedLeadId(e.target.value);
                  const found = allLeads.find((l) => l.id === e.target.value);
                  if (found && !agreedPrice) {
                    setAgreedPrice(found.budget);
                  }
                }}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose Lead --</option>
                {allLeads.map((l) => (
                  <option key={l.id} value={l.id}>
                    👤 {l.name} — {l.propertyRequirement} ({l.budget})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Property Selector */}
          {(dealType === 'LEAD_AND_PROPERTY' || dealType === 'PROPERTY_ONLY') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Flat / Apartment Unit <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedPropertyId}
                onChange={(e) => {
                  setSelectedPropertyId(e.target.value);
                  const found = allProperties.find((p) => p.id === e.target.value);
                  if (found) {
                    setAgreedPrice(found.price);
                  }
                }}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Choose Flat / Apartment --</option>
                {allProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    🏢 {p.title} — {p.propertyType} ({p.price})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Deal Price & Token */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Final Agreed Deal Price <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ₹4.35 Cr or ₹98 Lakhs"
                value={agreedPrice}
                onChange={(e) => setAgreedPrice(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Token / Advance Amount
              </label>
              <input
                type="text"
                placeholder="e.g. ₹10 Lakhs (Cheque / RTGS)"
                value={tokenAdvance}
                onChange={(e) => setTokenAdvance(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Closing Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Closing / Target Registration Date
            </label>
            <input
              type="date"
              value={closingDate}
              onChange={(e) => setClosingDate(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Agent Closing Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Closing Details & Agent Log Remarks
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Agreement signed, 10% token received. HDFC home loan sanctioned for remaining balance. Sale deed registration scheduled for Oct 25th."
              value={agentNotes}
              onChange={(e) => setAgentNotes(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none leading-relaxed"
            />
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
            <span className="text-base leading-none">⚠️</span>
            <div className="leading-snug">
              <span className="font-bold">Permanent Log & Pipeline Removal:</span>
              <p className="mt-0.5 text-[11px] text-amber-800">
                Confirming will log this transaction in the permanent <strong>Finalized Deals Log</strong>, and remove the lead and/or apartment from active prospects.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition disabled:opacity-50 shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>Logging & Archiving...</span>
                </>
              ) : (
                <span>🤝 Finalize Deal & Log Details</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
