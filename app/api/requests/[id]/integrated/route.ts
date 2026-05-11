import { NextResponse } from 'next/server';
import * as services from '@/lib/services';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { type, isIntegrated, integratedAt } = await request.json();
    const data = await services.toggleRequestIntegrated(id, type, isIntegrated, integratedAt);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
