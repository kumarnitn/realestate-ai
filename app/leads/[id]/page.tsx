"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Lead } from '@/types/lead';
import LeadAnalysis from '@/components/leads/LeadAnalysis';
import LeadChat from '@/components/leads/LeadChat';

export default function LeadDetailsPage() {
  const { id } = useParams();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLead = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/leads');
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch lead');
        }
        
        const foundLead = data.leads.find((l: Lead) => l.id === id);
        if (!foundLead) {
          throw new Error('Lead not found');
        }
        
        setLead(foundLead);
      } catch (err: unknown) {
        console.error(err);
        if (err instanceof Error) {
          setError(err.message || 'An error occurred while fetching the lead.');
        } else {
          setError('An error occurred while fetching the lead.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  const handleAnalyze = async () => {
    if (!lead || isAnalyzing) return;
    
    setIsAnalyzing(true);
    setAnalyzeError(null);
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze lead');
      }
      
      // Update local state with new analysis
      setLead({
        ...lead,
        leadSummary: data.analysis.leadSummary,
        customerIntent: data.analysis.customerIntent,
        keyRequirements: data.analysis.keyRequirements,
        objections: data.analysis.objections,
        recommendedNextAction: data.analysis.recommendedNextAction,
        suggestedResponse: data.suggestedResponse,
        score: data.score,
        priority: data.priority,
        analysisStatus: 'completed',
      });
      
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setAnalyzeError(err.message || 'An error occurred during analysis.');
      } else {
        setAnalyzeError('An error occurred during analysis.');
      }
      // Cannot refresh fetchLead easily without refactoring, so we'll just show the error.
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading lead details...</div>;
  }

  if (error || !lead) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/" className="text-indigo-600 hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <Link href="/" className="text-gray-500 hover:text-gray-900">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{lead.name}</h1>
          <p className="text-gray-500">Submitted {new Date(lead.createdAt || '').toLocaleDateString()}</p>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Location</h3>
            <p className="mt-1 text-gray-900">{lead.location}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Property Requirement</h3>
            <p className="mt-1 text-gray-900">{lead.propertyRequirement}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Budget</h3>
            <p className="mt-1 text-gray-900">{lead.budget}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Buying Timeline</h3>
            <p className="mt-1 text-gray-900">{lead.buyingTimeline}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500">Customer Message</h3>
            <p className="mt-1 text-gray-900 bg-gray-50 p-4 rounded whitespace-pre-wrap">{lead.customerMessage}</p>
          </div>
        </div>
      </div>

      <LeadAnalysis 
        lead={lead} 
        onAnalyze={handleAnalyze} 
        isAnalyzing={isAnalyzing} 
        error={analyzeError}
      />

      <LeadChat leadId={lead.id} initialLead={lead} />
    </div>
  );
}
