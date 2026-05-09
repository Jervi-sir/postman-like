import { NextResponse } from 'next/server';
import * as services from '@/lib/services';

export async function GET() {
  try {
    const data = await services.listHistory();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await services.clearHistory();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
