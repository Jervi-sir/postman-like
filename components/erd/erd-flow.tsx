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
import TableNode, { TableNodeData, Column } from './table-node';
import { Button } from '@/components/ui/button';
import { Save, Plus, MousePointer2, LayoutDashboard, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Edit Column Dialog State
  const [editingColumn, setEditingColumn] = useState<{ nodeId: string; column: Column } | null>(null);
  const [editFormData, setEditFormData] = useState<Column | null>(null);

  // Edit Table Dialog State
  const [editingTable, setEditingTable] = useState<{ nodeId: string; label: string } | null>(null);
  const [tableRenameValue, setTableRenameValue] = useState('');

  const handleSave = useCallback(async (isAutosave = false) => {
    if (!diagramId) return;
    if (!isAutosave) setSaving(true);
    
    try {
      const viewport = getViewport();
      // We use the functional updates or refs if we were in a timer, 
      // but here we can just use the current nodes/edges state because we are in the component.
      // However, for handleSave to be stable in useEffect, we need to be careful.
      await onSave(nodes, edges, viewport);
      setLastSaved(new Date());
      if (!isAutosave) toast.success('Diagram saved successfully');
    } catch (error) {
      if (!isAutosave) toast.error('Failed to save diagram');
      console.error('Autosave failed', error);
    } finally {
      if (!isAutosave) setSaving(false);
    }
  }, [diagramId, getViewport, nodes, edges, onSave]);

  // Autosave logic
  useEffect(() => {
    if (!diagramId || nodes.length === 0) return;

    const timer = setTimeout(() => {
      handleSave(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [nodes, edges, diagramId, handleSave]);

  // Update nodes/edges when initial props change (e.g. switching diagrams)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setViewport(initialViewport);
    setLastSaved(null);
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

  const handleEditTable = useCallback((nodeId: string, label: string) => {
    setEditingTable({ nodeId, label });
    setTableRenameValue(label);
  }, []);

  const saveTableRename = () => {
    if (!editingTable || !tableRenameValue) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === editingTable.nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: tableRenameValue
            }
          };
        }
        return node;
      })
    );
    setEditingTable(null);
    toast.success('Table renamed');
  };

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

  const handleEditColumn = useCallback((nodeId: string, column: Column) => {
    setEditingColumn({ nodeId, column });
    setEditFormData({ ...column });
  }, []);

  const handleDeleteColumn = useCallback((nodeId: string, columnId: string) => {
    if (!confirm('Are you sure you want to delete this column?')) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              columns: (node.data as TableNodeData).columns.filter((c) => c.id !== columnId)
            }
          };
        }
        return node;
      })
    );
    setEdges((eds) => eds.filter((edge) => 
      !edge.sourceHandle?.startsWith(columnId) && !edge.targetHandle?.startsWith(columnId)
    ));
  }, []);

  const handleDeleteTable = useCallback((nodeId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, []);

  const saveColumnEdit = () => {
    if (!editingColumn || !editFormData) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === editingColumn.nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              columns: (node.data as TableNodeData).columns.map((c) => 
                c.id === editFormData.id ? editFormData : c
              )
            }
          };
        }
        return node;
      })
    );
    setEditingColumn(null);
    toast.success('Column updated');
  };

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
        onEditColumn: handleEditColumn,
        onDeleteColumn: handleDeleteColumn,
        onDeleteTable: handleDeleteTable,
        onEditTable: handleEditTable,
      } as TableNodeData,
    };

    setNodes((nds) => [...nds, newNode]);
  }, [handleAddColumn, handleEditColumn, handleDeleteColumn, handleDeleteTable, handleEditTable]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onAddColumn: handleAddColumn,
          onEditColumn: handleEditColumn,
          onDeleteColumn: handleDeleteColumn,
          onDeleteTable: handleDeleteTable,
          onEditTable: handleEditTable,
        }
      }))
    );
  }, [handleAddColumn, handleEditColumn, handleDeleteColumn, handleDeleteTable, handleEditTable]);

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

        <Panel position="top-right" className="flex items-center gap-2">
          {lastSaved && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/50 backdrop-blur-sm border text-[10px] font-medium text-muted-foreground animate-in fade-in slide-in-from-right-2">
              <Check size={10} className="text-green-500" />
              Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          )}
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
            onClick={() => handleSave(false)}
            disabled={saving || !diagramId}
            className="shadow-md min-w-[120px]"
          >
            <Save className={`mr-2 h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving...' : 'Save Now'}
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

      {/* Edit Table Dialog */}
      <Dialog open={!!editingTable} onOpenChange={(open) => !open && setEditingTable(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Table</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tableName" className="text-right text-xs">Table Name</Label>
              <Input
                id="tableName"
                value={tableRenameValue}
                onChange={(e) => setTableRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveTableRename()}
                className="col-span-3 h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingTable(null)}>Cancel</Button>
            <Button size="sm" onClick={saveTableRename}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={!!editingColumn} onOpenChange={(open) => !open && setEditingColumn(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
          </DialogHeader>
          {editFormData && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right text-xs">Name</Label>
                <Input
                  id="name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="col-span-3 h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right text-xs">Type</Label>
                <Input
                  id="type"
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                  className="col-span-3 h-8 text-xs"
                />
              </div>
              <div className="flex items-center gap-6 pl-[100px]">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="primary" 
                    checked={editFormData.isPrimary} 
                    onCheckedChange={(checked) => setEditFormData({ ...editFormData, isPrimary: !!checked })}
                  />
                  <Label htmlFor="primary" className="text-[10px] uppercase font-bold tracking-wider">Primary</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="foreign" 
                    checked={editFormData.isForeignKey} 
                    onCheckedChange={(checked) => setEditFormData({ ...editFormData, isForeignKey: !!checked })}
                  />
                  <Label htmlFor="foreign" className="text-[10px] uppercase font-bold tracking-wider">Foreign</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditingColumn(null)}>Cancel</Button>
            <Button size="sm" onClick={saveColumnEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
