import { NextResponse } from 'next/server';
import * as services from '@/lib/services';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const data = await services.listComments(requestId);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
