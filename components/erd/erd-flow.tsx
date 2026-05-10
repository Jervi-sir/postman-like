'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  BackgroundVariant,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TableNode, { TableNodeData } from './table-node';
import { Button } from '@/components/ui/button';
import { Save, Plus, MousePointer2, LayoutDashboard } from 'lucide-react';
import { toast } from 'sonner';

const nodeTypes = {
  table: TableNode,
};

interface ErdFlowProps {
  diagramId: string | null;
  initialNodes: Node[];
  initialEdges: Edge[];
  initialViewport: { x: number; y: number; zoom: number };
  onSave: (nodes: Node[], edges: Edge[], viewport: { x: number; y: number; zoom: number }) => Promise<void>;
}

function ErdFlowContent({
  diagramId,
  initialNodes,
  initialEdges,
  initialViewport,
  onSave,
}: ErdFlowProps) {
  const { getViewport, setViewport } = useReactFlow();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [saving, setSaving] = useState(false);

  // Update nodes/edges when initial props change (e.g. switching diagrams)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setViewport(initialViewport);
  }, [initialNodes, initialEdges, initialViewport, diagramId, setViewport]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const handleAddColumn = useCallback((nodeId: string) => {
    const colName = prompt('Enter column name:');
    if (!colName) return;
    const colType = prompt('Enter column type (e.g. text, int, uuid):', 'text');

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              columns: [
                ...(node.data as TableNodeData).columns,
                { id: `col-${Date.now()}`, name: colName, type: colType || 'text' }
              ]
            }
          };
        }
        return node;
      })
    );
  }, []);

  const handleAddTable = useCallback(() => {
    const tableName = prompt('Enter table name:');
    if (!tableName) return;

    const newNode: Node = {
      id: `table-${Date.now()}`,
      type: 'table',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: tableName,
        columns: [
          { id: 'col-1', name: 'id', type: 'uuid', isPrimary: true },
        ],
        onAddColumn: handleAddColumn,
      } as TableNodeData,
    };

    setNodes((nds) => [...nds, newNode]);
  }, [handleAddColumn]);

  // Ensure all nodes have the onAddColumn handler when loaded
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onAddColumn: handleAddColumn,
        }
      }))
    );
  }, [handleAddColumn]);

  const handleSave = async () => {
    if (!diagramId) return;
    setSaving(true);
    try {
      const viewport = getViewport();
      await onSave(nodes, edges, viewport);
      toast.success('Diagram saved successfully');
    } catch (error) {
      toast.error('Failed to save diagram');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-muted/5"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <Controls className='text-black' orientation='horizontal' />

        <Panel position="top-right" className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddTable}
            className="bg-background shadow-md border-primary/20 hover:border-primary/50"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Table
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !diagramId}
            className="shadow-md"
          >
            <Save className={`mr-2 h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving...' : 'Save Diagram'}
          </Button>
        </Panel>

        <Panel position="top-left">
          <div className="bg-background/80 backdrop-blur-md border px-3 py-1.5 rounded-full shadow-sm flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground border-r pr-4">
              <MousePointer2 size={12} />
              <span>Select & Move</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <LayoutDashboard size={12} />
              <span>ERD Mode</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function ErdFlow(props: ErdFlowProps) {
  return (
    <ReactFlowProvider>
      <ErdFlowContent {...props} />
    </ReactFlowProvider>
  );
}
