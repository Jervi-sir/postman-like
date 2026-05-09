import { NextResponse } from 'next/server';
import * as services from '@/lib/services';

export async function POST(request: Request) {
  try {
    const { currentName, nextName } = await request.json();
    const data = await services.renameGroup(currentName, nextName);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
