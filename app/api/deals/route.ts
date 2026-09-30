import { NextResponse } from 'next/server';
import { getFinalizedDeals, addFinalizedDeal, deleteFinalizedDeal } from '@/lib/db/deals';
import { supabase } from '@/lib/db/supabase';
import { deleteProperty } from '@/lib/db/properties';

export async function GET() {
  try {
    const deals = await getFinalizedDeals();
    return NextResponse.json({ success: true, deals }, { status: 200 });
  } catch (error) {
    console.error('GET /api/deals error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch finalized deals' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      dealType = 'LEAD_AND_PROPERTY',
      clientName,
      propertyTitle,
      agreedPrice,
      tokenAdvance,
      closingDate,
      agentNotes,
      leadId,
      propertyId,
      leadDetails,
      propertyDetails,
    } = body;

    if (!clientName && !propertyTitle) {
      return NextResponse.json(
        { success: false, error: 'Either Client Name or Property Title is required' },
        { status: 400 }
      );
    }

    if (!agreedPrice) {
      return NextResponse.json(
        { success: false, error: 'Agreed Closing Price is required' },
        { status: 400 }
      );
    }

    // 1. Log the finalized deal into storage
    const deal = await addFinalizedDeal({
      dealType,
      clientName: clientName || leadDetails?.name || 'Private Client',
      propertyTitle: propertyTitle || propertyDetails?.title || '',
      agreedPrice,
      tokenAdvance,
      closingDate,
      agentNotes,
      leadDetails,
      propertyDetails,
    });

    // 2. Remove the finalized lead from active leads database
    if (leadId) {
      try {
        await supabase.from('leads').delete().eq('id', leadId);
      } catch (err) {
        console.error('Error removing finalized lead from leads table:', err);
      }
    }

    // 3. Remove or mark the property as sold in inventory
    if (propertyId) {
      try {
        await deleteProperty(propertyId);
      } catch (err) {
        console.error('Error removing finalized property from inventory:', err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Deal finalized, logged, and removed from active pipeline successfully',
        deal,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/deals error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to finalize deal: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing deal id' },
        { status: 400 }
      );
    }

    await deleteFinalizedDeal(id);
    return NextResponse.json(
      { success: true, message: 'Deal log removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE /api/deals error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete deal log' },
      { status: 500 }
    );
  }
}
