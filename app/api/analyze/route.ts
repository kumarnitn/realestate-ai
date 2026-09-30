import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';
import { leadAnalysisGraph } from '@/lib/ai/graphs/lead-analysis';
import { Lead } from '@/types/lead';

export async function POST(request: Request) {
  let parsedBody: unknown = null;
  try {
    parsedBody = await request.json();
    const body = parsedBody as { leadId?: string };
    
    if (!body.leadId) {
      return NextResponse.json(
        { success: false, error: 'Missing leadId' },
        { status: 400 }
      );
    }

    // 1. Fetch lead from Supabase
    const { data: leadData, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', body.leadId)
      .single();

    if (fetchError || !leadData) {
      return NextResponse.json(
        { success: false, error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Convert snake_case to camelCase
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
    };


    // 2. Mark analysis as pending
    await supabase
      .from('leads')
      .update({ analysis_status: 'pending' })
      .eq('id', body.leadId);

    // 3. Execute LangGraph
    const initialState = {
      lead: lead,
      analysis: undefined,
      score: undefined,
      priority: undefined,
      suggestedResponse: undefined,
      error: undefined,
    };

    const finalState = await leadAnalysisGraph.invoke(initialState);

    if (finalState.error) {
      // Mark as failed
      await supabase
        .from('leads')
        .update({ analysis_status: 'failed' })
        .eq('id', body.leadId);
      
      return NextResponse.json(
        { success: false, error: finalState.error },
        { status: 500 }
      );
    }

      const analysis = finalState.analysis;
      if (!analysis) {
        throw new Error("Analysis is missing from final state");
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update({
          lead_summary: analysis.leadSummary,
          customer_intent: analysis.customerIntent,
          key_requirements: analysis.keyRequirements,
          objections: analysis.objections,
          recommended_next_action: analysis.recommendedNextAction,
          suggested_response: finalState.suggestedResponse as string,
          score: finalState.score as number,
          priority: finalState.priority as string,
          analysis_status: 'completed',
          analyzed_at: new Date().toISOString(),
        })
        .eq('id', body.leadId);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Database error occurred during update: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: finalState.analysis,
      score: finalState.score,
      priority: finalState.priority,
      suggestedResponse: finalState.suggestedResponse,
    }, { status: 200 });

  } catch (error) {
    console.error('POST /api/analyze error:', error);
    
    // Attempt to mark as failed if we can
    try {
      const body = parsedBody as { leadId?: string } | null;
      if (body && body.leadId) {
        await supabase
          .from('leads')
          .update({ analysis_status: 'failed' })
          .eq('id', body.leadId);
      }
    } catch {
      // Ignore inner catch
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
