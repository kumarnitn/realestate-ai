import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'name', 'location', 'propertyRequirement', 
      'budget', 'buyingTimeline', 'customerMessage'
    ];
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Map to snake_case for Supabase
    const insertData = {
      name: body.name,
      location: body.location,
      property_requirement: body.propertyRequirement,
      budget: body.budget,
      buying_timeline: body.buyingTimeline,
      customer_message: body.customerMessage,
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { success: false, error: 'Database error occurred' },
        { status: 500 }
      );
    }

    // Map back to camelCase for the response
    const lead = {
      id: data.id,
      name: data.name,
      location: data.location,
      propertyRequirement: data.property_requirement,
      budget: data.budget,
      buyingTimeline: data.buying_timeline,
      customerMessage: data.customer_message,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ success: true, lead }, { status: 201 });
  } catch (error) {
    console.error('POST /api/leads error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase select error:', error);
      return NextResponse.json(
        { success: false, error: 'Database error occurred' },
        { status: 500 }
      );
    }

    // Map database snake_case to frontend camelCase
    const leads = (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location,
      propertyRequirement: row.property_requirement,
      budget: row.budget,
      buyingTimeline: row.buying_timeline,
      customerMessage: row.customer_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ success: true, leads }, { status: 200 });
  } catch (error) {
    console.error('GET /api/leads error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
