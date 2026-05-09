import { NextResponse } from 'next/server';
import * as services from '@/lib/services';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await services.executeRequest(body);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
