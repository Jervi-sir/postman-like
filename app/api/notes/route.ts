import { NextRequest, NextResponse } from 'next/server';
import { listNotes, createNote } from '@/lib/services';

export async function GET() {
  try {
    const notes = await listNotes();
    return NextResponse.json(notes);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to list notes' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const note = await createNote(payload);
    return NextResponse.json(note);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create note' },
      { status: 500 },
    );
  }
}
