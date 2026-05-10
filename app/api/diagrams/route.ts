import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { diagrams } from '@/lib/schema';
import { v4 as uuidv4 } from 'uuid';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const allDiagrams = await db.select().from(diagrams).orderBy(desc(diagrams.updatedAt));
    return NextResponse.json(allDiagrams);
  } catch (error) {
    console.error('Failed to fetch diagrams:', error);
    return NextResponse.json({ error: 'Failed to fetch diagrams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, nodes, edges, viewport } = body;

    const newDiagram = {
      id: uuidv4(),
      name: name || 'Untitled Diagram',
      nodes: nodes || '[]',
      edges: edges || '[]',
      viewport: viewport || '{"x":0,"y":0,"zoom":1}',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(diagrams).values(newDiagram);

    return NextResponse.json(newDiagram);
  } catch (error) {
    console.error('Failed to create diagram:', error);
    return NextResponse.json({ error: 'Failed to create diagram' }, { status: 500 });
  }
}
