'use client';

import React, { memo } from 'react';
import { NodeProps, Position } from '@xyflow/react';
import { Table, Hash, Key, Plus, MoreHorizontal, Edit2, Trash2, List } from 'lucide-react';
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
import { Button } from '@/components/ui/button';

export type Column = {
  id: string;
  name: string;
  type: string;
  isPrimary?: boolean;
  isForeignKey?: boolean;
};

export type TableNodeData = {
  label: string;
  isEnum?: boolean;
  columns: Column[];
  onAddColumn?: (nodeId: string) => void;
  onEditColumn?: (nodeId: string, column: Column) => void;
  onDeleteColumn?: (nodeId: string, columnId: string) => void;
  onDeleteTable?: (nodeId: string) => void;
  onEditTable?: (nodeId: string, label: string) => void;
};

const TableNode = ({ id, data, selected }: NodeProps & { data: TableNodeData }) => {
  const isEnum = data.isEnum;

  return (
    <DatabaseSchemaNode className={cn(
      "min-w-[260px] shadow-xl group/node", 
      selected && "ring-2 ring-primary border-primary",
      isEnum && "border-amber-500/50"
    )}>
      <BaseNodeHeader className={cn(
        "bg-secondary/50 backdrop-blur-sm border-b rounded-t-md px-3 py-2.5",
        isEnum && "bg-amber-500/10 border-amber-500/20"
      )}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className={cn(
            "p-1.5 bg-background rounded-md border shadow-sm shrink-0",
            isEnum ? "text-amber-500" : "text-primary"
          )}>
            {isEnum ? <List size={13} /> : <Table size={13} />}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <BaseNodeHeaderTitle className="text-sm font-bold text-foreground tracking-tight truncate">
              {data.label}
            </BaseNodeHeaderTitle>
            {isEnum && (
              <span className="text-[8px] font-black bg-amber-500/20 text-amber-600 px-1 rounded">ENUM</span>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 opacity-0 group-hover/node:opacity-100 transition-opacity"
              onClick={() => data.onEditTable?.(id, data.label)}
            >
              <Edit2 size={10} />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-destructive hover:bg-destructive/10"
            onClick={() => data.onDeleteTable?.(id)}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </BaseNodeHeader>

      <DatabaseSchemaNodeBody>
        {data.columns.map((column) => (
          <DatabaseSchemaTableRow key={column.id} className="group/row relative transition-colors border-b-0 hover:bg-muted/30">
            <DatabaseSchemaTableCell className="p-0">
              <LabeledHandle
                id={`${column.id}-left`}
                type="target"
                position={Position.Left}
                title={column.name}
                className="py-2 px-3"
                labelClassName={cn("font-semibold text-xs text-foreground/90", isEnum && "italic text-amber-600/80")}
                handleClassName="!-left-[6px] opacity-0 group-hover/row:opacity-100 transition-opacity"
              />
            </DatabaseSchemaTableCell>
            {!isEnum && (
              <DatabaseSchemaTableCell className="text-right pr-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground/40 tracking-wider">
                  {column.type}
                </span>
              </DatabaseSchemaTableCell>
            )}
            <DatabaseSchemaTableCell className={cn("p-0 pr-3", isEnum ? "w-10" : "w-20")}>
              <div className="flex items-center justify-end gap-1 relative h-full">
                {!isEnum && (
                  <div className="flex items-center gap-1 mr-1">
                    {column.isPrimary && <Key size={10} className="text-amber-500 shrink-0" />}
                    {column.isForeignKey && <Hash size={10} className="text-blue-500 shrink-0" />}
                  </div>
                )}
                
                {/* Column Actions */}
                <div className="flex items-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    onClick={() => data.onEditColumn?.(id, column)}
                  >
                    <Edit2 size={10} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    onClick={() => data.onDeleteColumn?.(id, column.id)}
                  >
                    <Trash2 size={10} />
                  </Button>
                </div>

                {!isEnum && (
                  <BaseHandle
                    id={`${column.id}-right`}
                    type="source"
                    position={Position.Right}
                    className="!-right-[6px] opacity-0 group-hover/row:opacity-100 transition-opacity"
                  />
                )}
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
          {isEnum ? 'Add Value' : 'Add Column'}
        </button>
      </div>
    </DatabaseSchemaNode>
  );
};

export default memo(TableNode);
