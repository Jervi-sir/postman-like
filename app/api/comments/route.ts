import { NextResponse } from 'next/server';
import * as services from '@/lib/services';

export async function POST(request: Request) {
  try {
    const { requestId, bodyText } = await request.json();
    const data = await services.createComment(requestId, bodyText);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
