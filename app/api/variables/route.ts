import { NextResponse } from 'next/server';
import * as services from '@/lib/services';

export async function GET() {
  try {
    const data = await services.getStoredVariables();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    const data = await services.updateStoredVariables(text);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
