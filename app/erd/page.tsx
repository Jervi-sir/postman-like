'use client';

import React, { useState, useEffect } from 'react';
import { DiagramSidebar } from '@/components/erd/diagram-sidebar';
import { ErdFlow } from '@/components/erd/erd-flow';
import { Node, Edge } from '@xyflow/react';
import { toast } from 'sonner';

export default function ErdPage() {
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);
  const [initialNodes, setInitialNodes] = useState<Node[]>([]);
  const [initialEdges, setInitialEdges] = useState<Edge[]>([]);
  const [initialViewport, setInitialViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [loading, setLoading] = useState(false);

  const fetchDiagram = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/diagrams/${id}`);
      const data = await res.json();
      if (data.id) {
        setInitialNodes(JSON.parse(data.nodes));
        setInitialEdges(JSON.parse(data.edges));
        setInitialViewport(JSON.parse(data.viewport));
        setCurrentDiagramId(id);
      }
    } catch (error) {
      console.error('Failed to fetch diagram', error);
      toast.error('Failed to load diagram');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDiagram = async (name: string) => {
    try {
      const res = await fetch('/api/diagrams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.id) {
        toast.success('Diagram created');
        fetchDiagram(data.id);
      }
    } catch (error) {
      toast.error('Failed to create diagram');
    }
  };

  const handleDeleteDiagram = async (id: string) => {
    try {
      await fetch(`/api/diagrams/${id}`, { method: 'DELETE' });
      if (currentDiagramId === id) {
        setCurrentDiagramId(null);
        setInitialNodes([]);
        setInitialEdges([]);
      }
      toast.success('Diagram deleted');
    } catch (error) {
      toast.error('Failed to delete diagram');
    }
  };

  const handleSave = async (nodes: Node[], edges: Edge[], viewport: { x: number; y: number; zoom: number }) => {
    if (!currentDiagramId) return;
    try {
      const res = await fetch(`/api/diagrams/${currentDiagramId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: JSON.stringify(nodes),
          edges: JSON.stringify(edges),
          viewport: JSON.stringify(viewport),
        }),
      });
      if (!res.ok) throw new Error('Save failed');
    } catch (error) {
      console.error('Save error', error);
      throw error;
    }
  };

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      <DiagramSidebar
        currentDiagramId={currentDiagramId}
        onSelectDiagram={fetchDiagram}
        onCreateDiagram={handleCreateDiagram}
        onDeleteDiagram={handleDeleteDiagram}
      />
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {currentDiagramId ? (
          <ErdFlow
            key={currentDiagramId}
            diagramId={currentDiagramId}
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            initialViewport={initialViewport}
            onSave={handleSave}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 p-8 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground">No Diagram Selected</h2>
            <p className="max-w-xs">Select an existing diagram from the sidebar or create a new one to start building your ERD.</p>
            <button 
              onClick={() => handleCreateDiagram('New ERD')}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              Create Your First ERD
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
