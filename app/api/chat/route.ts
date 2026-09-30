import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { leadChatGraph } from '@/lib/ai/graphs/lead-chat';
import { Lead } from '@/types/lead';
import { chatRequestSchema } from '@/lib/ai/schemas';

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    
    const parsedBody = chatRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsedBody.error.issues },
        { status: 400 }
      );
    }
    
    const { leadId, message, history } = parsedBody.data;

    // Mode 1: Specific Lead Chat
    if (leadId && leadId !== 'all' && leadId !== 'dashboard') {
      const { data: leadData, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (fetchError || !leadData) {
        return NextResponse.json(
          { success: false, error: 'Lead not found' },
          { status: 404 }
        );
      }

      const lead: Lead = {
        id: leadData.id,
        name: leadData.name,
        location: leadData.location,
        propertyRequirement: leadData.property_requirement,
        budget: leadData.budget,
        buyingTimeline: leadData.buying_timeline,
        customerMessage: leadData.customer_message,
        createdAt: leadData.created_at,
        updatedAt: leadData.updated_at,
        analysisStatus: leadData.analysis_status,
        score: leadData.score,
        priority: leadData.priority,
        leadSummary: leadData.lead_summary,
        customerIntent: leadData.customer_intent,
        keyRequirements: leadData.key_requirements,
        objections: leadData.objections,
        recommendedNextAction: leadData.recommended_next_action,
        suggestedResponse: leadData.suggested_response,
      };

      const analysis = leadData.lead_summary ? {
        leadSummary: leadData.lead_summary,
        customerIntent: leadData.customer_intent,
        keyRequirements: leadData.key_requirements || [],
        objections: leadData.objections || [],
        recommendedNextAction: leadData.recommended_next_action,
      } : undefined;

      const initialState = {
        lead: lead,
        allLeads: undefined,
        analysis: analysis,
        score: leadData.score,
        priority: leadData.priority,
        suggestedResponse: leadData.suggested_response,
        history: history,
        question: message
      };

      const finalState = await leadChatGraph.invoke(initialState);

      if (finalState.error) {
        return NextResponse.json(
          { success: false, error: finalState.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        response: finalState.response,
      }, { status: 200 });
    }

    // Mode 2: Pipeline Chat (Dashboard mode with all leads)
    const { data: allLeadsData, error: fetchAllError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchAllError) {
      console.error('Error fetching leads for pipeline chat:', fetchAllError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pipeline leads' },
        { status: 500 }
      );
    }

    const allLeads: Lead[] = (allLeadsData || []).map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location,
      propertyRequirement: row.property_requirement,
      budget: row.budget,
      buyingTimeline: row.buying_timeline,
      customerMessage: row.customer_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      leadSummary: row.lead_summary,
      customerIntent: row.customer_intent,
      keyRequirements: row.key_requirements,
      objections: row.objections,
      recommendedNextAction: row.recommended_next_action,
      suggestedResponse: row.suggested_response,
      score: row.score,
      priority: row.priority,
      analysisStatus: row.analysis_status,
    }));

    // If message mentions a specific lead by name, identify them as target lead
    let matchedLead: Lead | undefined = undefined;
    let matchedAnalysis = undefined;
    if (allLeads.length > 0) {
      const lowerMsg = message.toLowerCase();
      matchedLead = allLeads.find((l) => 
        l.name && l.name.trim().length > 1 && lowerMsg.includes(l.name.toLowerCase().trim())
      );
      if (matchedLead && matchedLead.leadSummary) {
        matchedAnalysis = {
          leadSummary: matchedLead.leadSummary,
          customerIntent: matchedLead.customerIntent || '',
          keyRequirements: matchedLead.keyRequirements || [],
          objections: matchedLead.objections || [],
          recommendedNextAction: matchedLead.recommendedNextAction || '',
        };
      }
    }

    const initialState = {
      lead: matchedLead,
      allLeads: allLeads,
      analysis: matchedAnalysis,
      score: matchedLead?.score,
      priority: matchedLead?.priority,
      suggestedResponse: matchedLead?.suggestedResponse,
      history: history,
      question: message
    };

    const finalState = await leadChatGraph.invoke(initialState);

    if (finalState.error) {
      return NextResponse.json(
        { success: false, error: finalState.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      response: finalState.response,
    }, { status: 200 });

  } catch (error) {
    console.error('POST /api/chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

