import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, Add01Icon } from '@hugeicons/core-free-icons';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { EditorTabSwitcher, type TabType } from './editor-tab-switcher';


export type KeyValueRow = {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
};

type KeyValueTableProps = {
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
};

export function KeyValueTable({ rows, onChange }: KeyValueTableProps) {
  const handleRowChange = (id: string, patch: Partial<KeyValueRow>) => {
    const nextRows = rows.map((row) =>
      row.id === id ? { ...row, ...patch } : row,
    );
    onChange(nextRows);
  };

  const handleAddRow = () => {
    onChange([
      ...rows,
      {
        id: Math.random().toString(36).slice(2),
        key: '',
        value: '',
        enabled: true,
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    onChange(rows.filter((row) => row.id !== id));
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/60">
            <TableHead className="w-[48px] px-3"></TableHead>
            <TableHead className="px-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Key</TableHead>
            <TableHead className="px-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Value</TableHead>
            <TableHead className="w-[48px] px-3"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              className={cn(
                "group border-b border-border/40 last:border-0 transition-opacity",
                !row.enabled && "opacity-60 bg-muted/[0.01]"
              )}
            >
              <TableCell className="px-3 py-2">
                <Checkbox
                  checked={row.enabled}
                  onCheckedChange={(checked) =>
                    handleRowChange(row.id, { enabled: !!checked })
                  }
                  className="size-4 rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </TableCell>
              <TableCell className="px-3 py-1.5">
                <Input
                  className="h-8 border-none bg-transparent px-0 font-mono text-sm focus-visible:ring-0 shadow-none"
                  value={row.key}
                  onChange={(e) =>
                    handleRowChange(row.id, { key: e.target.value })
                  }
                  placeholder="Key"
                />
              </TableCell>
              <TableCell className="px-3 py-1.5 border-l border-border/40">
                <Input
                  className="h-8 border-none bg-transparent px-0 font-mono text-sm focus-visible:ring-0 shadow-none"
                  value={row.value}
                  onChange={(e) =>
                    handleRowChange(row.id, { value: e.target.value })
                  }
                  placeholder="Value"
                />
              </TableCell>
              <TableCell className="px-3 py-1.5 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-all hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveRow(row.id)}
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-20 text-center text-muted-foreground italic text-xs"
              >
                No parameters defined
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="p-2 border-t border-border/40 bg-muted/[0.02]">
        <Button
          variant="ghost"
          size="sm"
          className="text-[11px] h-8 text-muted-foreground hover:text-foreground font-medium"
          onClick={handleAddRow}
        >
          <HugeiconsIcon icon={Add01Icon} className="size-3 mr-1.5" />
          Add row
        </Button>
      </div>
    </div>
  );
}



type RequestTabEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  EditorComponent: React.ComponentType<any>;
};

export function RequestTabEditor({
  value,
  onChange,
  placeholder,
  className,
  EditorComponent,
}: RequestTabEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('json');

  const { rows, isValidJson } = useMemo(() => {
    try {
      const obj = JSON.parse(value || '{}');
      if (typeof obj !== 'object' || obj === null || Array.isArray(obj))
        return { rows: [], isValidJson: false };

      const parsedRows = Object.entries(obj).map(([key, val], index) => {
        const isDisabled = key.startsWith('//');
        const cleanKey = isDisabled ? key.slice(2) : key;
        return {
          id: `${cleanKey}-${index}`, // Stable ID based on key and position
          key: cleanKey,
          value: typeof val === 'string' ? val : JSON.stringify(val),
          enabled: !isDisabled,
        };
      });

      return { rows: parsedRows, isValidJson: true };
    } catch {
      return { rows: [], isValidJson: false };
    }
  }, [value]);

  const handleTableChange = (nextRows: KeyValueRow[]) => {
    const obj: Record<string, any> = {};
    nextRows.forEach((row) => {
      const trimmedKey = row.key.trim();
      if (!trimmedKey) return;

      const finalKey = row.enabled ? trimmedKey : `//${trimmedKey}`;

      try {
        const trimmedValue = row.value.trim();
        if ((trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) || (trimmedValue.startsWith('[') && trimmedValue.endsWith(']'))) {
          obj[finalKey] = JSON.parse(row.value);
        } else if (trimmedValue === 'true') {
          obj[finalKey] = true;
        } else if (trimmedValue === 'false') {
          obj[finalKey] = false;
        } else if (!isNaN(Number(trimmedValue)) && trimmedValue !== '') {
          obj[finalKey] = Number(trimmedValue);
        } else {
          obj[finalKey] = row.value;
        }
      } catch {
        obj[finalKey] = row.value;
      }
    });
    onChange(JSON.stringify(obj, null, 2));
  };

  useEffect(() => {
    if (!isValidJson && activeTab === 'table') {
      setActiveTab('json');
    }
  }, [isValidJson, activeTab]);

  return (
    <div className={cn("space-y-3", className)}>
      <EditorTabSwitcher
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isValidJson={isValidJson}
      />

      {activeTab === 'json' ? (
        <EditorComponent
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="[tab-size:2]"
        />
      ) : (
        <KeyValueTable rows={rows} onChange={handleTableChange} />
      )}
    </div>
  );
}
