import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { diagrams } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const diagram = await db.query.diagrams.findFirst({
      where: eq(diagrams.id, id),
    });

    if (!diagram) {
      return NextResponse.json({ error: 'Diagram not found' }, { status: 404 });
    }

    return NextResponse.json(diagram);
  } catch (error) {
    console.error('Failed to fetch diagram:', error);
    return NextResponse.json({ error: 'Failed to fetch diagram' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, nodes, edges, viewport } = body;

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (nodes !== undefined) updateData.nodes = nodes;
    if (edges !== undefined) updateData.edges = edges;
    if (viewport !== undefined) updateData.viewport = viewport;

    await db.update(diagrams).set(updateData).where(eq(diagrams.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update diagram:', error);
    return NextResponse.json({ error: 'Failed to update diagram' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(diagrams).where(eq(diagrams.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete diagram:', error);
    return NextResponse.json({ error: 'Failed to delete diagram' }, { status: 500 });
  }
}
