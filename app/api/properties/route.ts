import { NextResponse } from 'next/server';
import { getProperties, addProperty, deleteProperty, parsePriceToLakhs } from '@/lib/db/properties';

export async function GET() {
  try {
    const properties = await getProperties();
    return NextResponse.json({ success: true, properties }, { status: 200 });
  } catch (error) {
    console.error('GET /api/properties error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const requiredFields = ['title', 'propertyType', 'location', 'price'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const numericPrice = body.numericPrice ? Number(body.numericPrice) : parsePriceToLakhs(body.price);

    const property = await addProperty({
      title: body.title.trim(),
      propertyType: body.propertyType.trim(),
      location: body.location.trim(),
      price: body.price.trim(),
      numericPrice,
      areaSqft: body.areaSqft ? Number(body.areaSqft) : undefined,
      status: body.status || 'Available',
      amenities: Array.isArray(body.amenities) 
        ? body.amenities 
        : typeof body.amenities === 'string'
        ? body.amenities.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [],
      description: body.description ? body.description.trim() : '',
      floorNumber: body.floorNumber ? body.floorNumber.trim() : '',
      possessionStatus: body.possessionStatus || 'Ready to Move',
    });

    return NextResponse.json({ success: true, property }, { status: 201 });
  } catch (error) {
    console.error('POST /api/properties error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while saving property' },
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
        { success: false, error: 'Missing property id' },
        { status: 400 }
      );
    }

    await deleteProperty(id);
    return NextResponse.json({ success: true, message: 'Property deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/properties error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete property' },
      { status: 500 }
    );
  }
}
