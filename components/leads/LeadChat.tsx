"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '@/types/lead';

interface LeadChatProps {
  leadId?: string;
  initialLead?: Lead;
  leads?: Lead[];
  selectedLeadId?: string | null;
  onSelectLeadId?: (id: string | null) => void;
  triggerPrompt?: string | null;
  onClearTriggerPrompt?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function LeadChat({
  leadId: propLeadId,
  initialLead,
  leads = [],
  selectedLeadId: controlledSelectedLeadId,
  onSelectLeadId,
  triggerPrompt,
  onClearTriggerPrompt,
}: LeadChatProps) {
  // If propLeadId is passed (e.g. from /leads/[id]), lock to that lead
  const isLockedToLead = Boolean(propLeadId);

  // Uncontrolled or controlled selected lead ID for dashboard
  const [internalSelectedLeadId, setInternalSelectedLeadId] = useState<string | null>(null);
  const currentLeadId = isLockedToLead 
    ? propLeadId 
    : (controlledSelectedLeadId !== undefined ? controlledSelectedLeadId : internalSelectedLeadId);

  const handleLeadSelect = (id: string | null) => {
    if (onSelectLeadId) {
      onSelectLeadId(id);
    } else {
      setInternalSelectedLeadId(id);
    }
  };

  // Find the active lead object
  const activeLead = isLockedToLead
    ? initialLead || leads.find((l) => l.id === propLeadId)
    : leads.find((l) => l.id === currentLeadId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle external trigger prompt (e.g. from pitch button)
  useEffect(() => {
    if (triggerPrompt && triggerPrompt.trim()) {
      sendMessage(triggerPrompt);
      if (onClearTriggerPrompt) {
        onClearTriggerPrompt();
      }
    }
  }, [triggerPrompt]);

  const sendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: messageContent }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: currentLeadId || 'all',
          message: messageContent,
          history: messages,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      setMessages([...newMessages, { role: 'assistant', content: data.response }]);
    } catch (err: unknown) {
      console.error('Chat error:', err);
      if (err instanceof Error) {
        setError(err.message || 'An error occurred while generating a response.');
      } else {
        setError('An error occurred while generating a response.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  // Dynamic quick action prompt chips
  const quickChips = activeLead
    ? [
        { label: '✉️ Draft Outreach Email', prompt: `Draft a professional outreach email for ${activeLead.name} regarding their requirement (${activeLead.propertyRequirement}) and budget (${activeLead.budget}).` },
        { label: '💬 Draft WhatsApp Message', prompt: `Draft a concise, friendly WhatsApp message for ${activeLead.name} acknowledging their requirement (${activeLead.propertyRequirement}).` },
        { label: '📊 Quick Requirement Analysis', prompt: `Give a brief 2-3 bullet analysis of ${activeLead.name}'s requirement feasibility, timeline urgency, and sales angle.` },
        { label: '🛡️ Overcome Objections', prompt: `How should I address ${activeLead.name}'s timeline or concerns in a consultative way?` },
      ]
    : [
        { label: '🏆 Prioritize Urgent Leads', prompt: 'Which leads in the pipeline have the most urgent timelines and should be contacted first today?' },
        { label: '🔥 Summarize Hot Leads', prompt: 'List our HOT priority leads with their exact property requirements and recommended immediate next action.' },
        { label: '🏙️ Group by Requirement', prompt: 'Provide a concise breakdown of leads grouped by property type and location.' },
        { label: '✉️ Outreach for Urgent Buyers', prompt: 'Draft a quick outreach message template for our high-intent buyers looking to purchase within 1-2 months.' },
      ];

  return (
    <div id="sales-assistant" className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col h-[650px] transition-all">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AI Sales Assistant
                <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-400/30">
                  Copilot
                </span>
              </h2>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded transition"
              title="Clear conversation"
            >
              Clear Chat
            </button>
          )}
        </div>

        {/* Lead Context Selector */}
        {!isLockedToLead && leads.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="lead-context-select" className="text-xs font-medium text-slate-300 whitespace-nowrap">
              Focus Context:
            </label>
            <select
              id="lead-context-select"
              value={currentLeadId || ''}
              onChange={(e) => handleLeadSelect(e.target.value ? e.target.value : null)}
              className="w-full text-xs bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              <option value="">🌐 All Leads (Pipeline Overview - {leads.length} leads)</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  👤 {l.name} — {l.propertyRequirement} ({l.budget})
                </option>
              ))}
            </select>
          </div>
        )}

        {isLockedToLead && activeLead && (
          <div className="text-xs text-slate-300 flex items-center justify-between">
            <span>Focused on: <strong className="text-white">{activeLead.name}</strong></span>
            {activeLead.priority && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                activeLead.priority === 'HOT' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                activeLead.priority === 'WARM' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30' :
                'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {activeLead.priority}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Context Snapshot Ribbon */}
      {activeLead ? (
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 py-2 text-xs text-indigo-950 flex flex-wrap gap-x-4 gap-y-1 items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-indigo-900">{activeLead.name}:</span>
            <span className="bg-white/80 px-1.5 py-0.5 rounded border border-indigo-200">📍 {activeLead.location}</span>
            <span className="bg-white/80 px-1.5 py-0.5 rounded border border-indigo-200">🏠 {activeLead.propertyRequirement}</span>
            <span className="bg-white/80 px-1.5 py-0.5 rounded border border-indigo-200">💰 {activeLead.budget}</span>
            <span className="bg-white/80 px-1.5 py-0.5 rounded border border-indigo-200">⏳ {activeLead.buyingTimeline}</span>
          </div>
          {!isLockedToLead && (
            <button
              onClick={() => handleLeadSelect(null)}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 underline font-medium ml-auto"
            >
              Reset to All Leads
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs text-slate-600 flex items-center justify-between">
          <span>Viewing full pipeline context ({leads.length} total leads)</span>
          <span className="text-[11px] text-slate-500 italic">Select a lead above or click &quot;Chat with AI&quot; on any card to focus</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {/* Welcome Message */}
        <div className="flex flex-col space-y-1 items-start">
          <span className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
            🤖 AI Sales Assistant
          </span>
          <div className="bg-white text-slate-800 p-3.5 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm max-w-[88%] text-sm leading-relaxed">
            {activeLead ? (
              <div>
                <p className="font-medium text-slate-900 mb-1">
                  Ready to assist you with <strong>{activeLead.name}</strong>.
                </p>
                <p className="text-slate-600">
                  I will analyze their requirement for <strong>{activeLead.propertyRequirement}</strong> (Budget: {activeLead.budget}) and generate personalized outreach messages, WhatsApp drafts, objection handlers, or site visit pitches for you.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-slate-900 mb-1">
                  Welcome to your Lead Dashboard Copilot!
                </p>
                <p className="text-slate-600">
                  I can analyze requirements across all your inbound leads, identify top prospects, draft outreach responses, and answer any sales pipeline questions.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Message History */}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex flex-col space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <span className="text-[11px] font-medium text-slate-400">
              {msg.role === 'user' ? 'You (Sales)' : 'AI Assistant'}
            </span>
            <div
              className={`p-3.5 rounded-2xl text-sm leading-relaxed max-w-[88%] whitespace-pre-wrap shadow-sm relative group ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
              }`}
            >
              {msg.content}

              {/* Copy button for assistant responses */}
              {msg.role === 'assistant' && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => copyToClipboard(msg.content, index)}
                    className="text-[11px] flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-medium px-2 py-1 rounded bg-slate-100 hover:bg-indigo-50 transition"
                  >
                    {copiedIndex === index ? (
                      <>
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span className="text-emerald-700">Copied to clipboard</span>
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        <span>Copy Response</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col space-y-1 items-start">
            <span className="text-[11px] font-semibold text-indigo-700">🤖 AI Assistant</span>
            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-white border border-slate-200 shadow-sm text-slate-600 text-sm flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Analyzing requirements & drafting response...</span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs self-center text-center w-full">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-3 py-2 bg-slate-100/80 border-t border-slate-200 overflow-x-auto flex gap-1.5 scrollbar-thin">
        {quickChips.map((chip, i) => (
          <button
            key={i}
            onClick={() => sendMessage(chip.prompt)}
            disabled={isLoading}
            className="text-[11px] whitespace-nowrap bg-white hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-300 hover:border-indigo-300 px-2.5 py-1 rounded-full transition shadow-xs disabled:opacity-50"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex space-x-2 items-end">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeLead
                ? `Ask to analyze requirements or draft a response for ${activeLead.name}...`
                : "Ask about your leads or request response drafts..."
            }
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 resize-none text-slate-900 placeholder:text-slate-400"
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed h-[42px] flex items-center justify-center gap-1 shadow-sm"
          >
            <span>Send</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 flex justify-between">
          <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
          <span>Requirement-grounded AI</span>
        </p>
      </div>
    </div>
  );
}
