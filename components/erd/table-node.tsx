'use client';

import React, { memo } from 'react';
import { NodeProps, Position } from '@xyflow/react';
import { Table, Hash, Key, Plus, MoreHorizontal } from 'lucide-react';
import { 
  DatabaseSchemaNode, 
  DatabaseSchemaNodeBody,
  DatabaseSchemaTableRow,
  DatabaseSchemaTableCell
} from '@/components/database-schema-node';
import { BaseNodeHeader, BaseNodeHeaderTitle } from '@/components/base-node';
import { LabeledHandle } from '@/components/labeled-handle';
import { BaseHandle } from '@/components/base-handle';
import { cn } from '@/lib/utils';

export type Column = {
  id: string;
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeignKey?: boolean;
};

export type TableNodeData = {
  label: string;
  columns: Column[];
  onAddColumn?: (nodeId: string) => void;
};

const TableNode = ({ id, data, selected }: NodeProps & { data: TableNodeData }) => {
  return (
    <DatabaseSchemaNode className={cn("min-w-[240px] shadow-xl", selected && "ring-2 ring-primary border-primary")}>
      <BaseNodeHeader className="bg-secondary/50 backdrop-blur-sm border-b rounded-t-md px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-background rounded-md border shadow-sm shrink-0 text-primary">
            <Table size={13} />
          </div>
          <BaseNodeHeaderTitle className="text-sm font-bold text-foreground tracking-tight">
            {data.label}
          </BaseNodeHeaderTitle>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-background/50 rounded-md">
          <MoreHorizontal size={14} />
        </button>
      </BaseNodeHeader>

      <DatabaseSchemaNodeBody>
        {data.columns.map((column) => (
          <DatabaseSchemaTableRow key={column.id} className="group relative transition-colors border-b-0 hover:bg-muted/30">
            <DatabaseSchemaTableCell className="p-0">
              <LabeledHandle
                id={`${column.id}-left`}
                type="target"
                position={Position.Left}
                title={column.name}
                className="py-2 px-3"
                labelClassName="font-semibold text-xs text-foreground/90"
                handleClassName="!-left-[6px] opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </DatabaseSchemaTableCell>
            <DatabaseSchemaTableCell className="text-right pr-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground/40 tracking-wider">
                {column.type}
              </span>
            </DatabaseSchemaTableCell>
            <DatabaseSchemaTableCell className="w-8 p-0 pr-3">
              <div className="flex items-center justify-end gap-1 relative h-full">
                {column.isPrimary && <Key size={10} className="text-amber-500 shrink-0" />}
                {column.isForeignKey && <Hash size={10} className="text-blue-500 shrink-0" />}
                <BaseHandle
                  id={`${column.id}-right`}
                  type="source"
                  position={Position.Right}
                  className="!-right-[6px] opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
            </DatabaseSchemaTableCell>
          </DatabaseSchemaTableRow>
        ))}
      </DatabaseSchemaNodeBody>

      {/* Footer for adding columns */}
      <div className="px-3 py-2 border-t bg-muted/10">
        <button 
          onClick={() => data.onAddColumn?.(id)}
          className="w-full py-1.5 rounded-md border border-dashed border-muted-foreground/20 text-[10px] font-bold text-muted-foreground/60 hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-1.5 uppercase tracking-widest"
        >
          <Plus size={10} />
          Add Column
        </button>
      </div>
    </DatabaseSchemaNode>
  );
};

export default memo(TableNode);
