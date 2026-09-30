import React from 'react';
import { Lead } from '@/types/lead';

interface LeadAnalysisProps {
  lead: Lead;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  error?: string | null;
}

export default function LeadAnalysis({ lead, onAnalyze, isAnalyzing, error }: LeadAnalysisProps) {
  if (lead.analysisStatus !== 'completed' && !lead.leadSummary) {
    return (
      <div className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">AI Lead Analysis</h2>
        <p className="text-gray-600 mb-4">
          This lead has not been analyzed yet. Run AI analysis to determine intent, requirements, and priority.
        </p>
        
        {error && (
          <div className="mb-4 text-red-600 bg-red-50 p-2 rounded inline-block">
            {error}
          </div>
        )}
        <br />
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {isAnalyzing ? 'Analyzing lead...' : 'Analyze Lead'}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-lg border border-indigo-200 bg-white shadow-sm overflow-hidden">
      <div className="bg-indigo-50 border-b border-indigo-100 p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold text-indigo-900">AI Lead Analysis</h2>
        <div className="flex space-x-4">
          <div className="flex flex-col items-end">
            <span className="text-xs text-indigo-600 uppercase font-semibold">Priority</span>
            <span className={`font-bold ${lead.priority === 'HOT' ? 'text-red-600' : lead.priority === 'WARM' ? 'text-orange-500' : 'text-blue-500'}`}>
              {lead.priority || 'N/A'}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs text-indigo-600 uppercase font-semibold">Score</span>
            <span className="font-bold text-indigo-900">{lead.score || 0}/100</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Lead Summary</h3>
          <p className="text-gray-900">{lead.leadSummary}</p>
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Customer Intent</h3>
          <p className="text-gray-900">{lead.customerIntent}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Key Requirements</h3>
            <ul className="list-disc pl-5 text-gray-900 space-y-1">
              {(lead.keyRequirements || []).map((req, i) => (
                <li key={i}>{req}</li>
              ))}
              {(!lead.keyRequirements || lead.keyRequirements.length === 0) && (
                <li className="text-gray-500 italic">None identified</li>
              )}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Objections / Concerns</h3>
            <ul className="list-disc pl-5 text-gray-900 space-y-1">
              {(lead.objections || []).map((obj, i) => (
                <li key={i}>{obj}</li>
              ))}
              {(!lead.objections || lead.objections.length === 0) && (
                <li className="text-gray-500 italic">None identified</li>
              )}
            </ul>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Recommended Next Action</h3>
          <p className="text-gray-900 bg-gray-50 p-3 rounded border border-gray-100">{lead.recommendedNextAction}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Suggested Response</h3>
          <div className="bg-indigo-50 p-4 rounded border border-indigo-100 whitespace-pre-wrap text-indigo-900 font-medium">
            {lead.suggestedResponse}
          </div>
        </div>
      </div>
    </div>
  );
}
