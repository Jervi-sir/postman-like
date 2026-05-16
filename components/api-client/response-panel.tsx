import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatJsonText } from '@/lib/json';
import type { ExecutionResponse } from '@/types/api';

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

type ResponsePanelProps = {
  response: ExecutionResponse | null;
};

function getStatusVariant(status: number) {
  if (status >= 400 || status === 0) {
    return 'destructive' as const;
  }

  return 'outline' as const;
}

function isJsonRecord(value: unknown): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatJsonCount(value: JsonValue) {
  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? '' : 's'}`;
  }

  if (isJsonRecord(value)) {
    const count = Object.keys(value).length;
    return `${count} key${count === 1 ? '' : 's'}`;
  }

  return '';
}

function getJsonContainerLabel(value: JsonValue) {
  return Array.isArray(value) ? 'Array' : 'Object';
}

function shouldWrapJsonString(value: JsonValue, label?: string) {
  return typeof value === 'string' && Boolean(label) && value.length > 120;
}

function JsonPrimitive({
  value,
}: {
  value: Exclude<JsonValue, JsonValue[] | Record<string, JsonValue>>;
}) {
  if (typeof value === 'string') {
    return (
      <span className="inline-block max-w-full align-top text-emerald-400 whitespace-pre-wrap break-all">
        &quot;{value}&quot;
      </span>
    );
  }

  if (typeof value === 'number') {
    return <span className="text-amber-400">{value}</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="text-sky-400">{String(value)}</span>;
  }

  return <span className="text-fuchsia-400">null</span>;
}

const MAX_JSON_ITEMS = 100;

function JsonTreeNode({
  label,
  value,
  defaultExpanded,
}: {
  label?: string;
  value: JsonValue;
  defaultExpanded: boolean;
}) {
  const [showAll, setShowAll] = useState(false);

  if (!Array.isArray(value) && !isJsonRecord(value)) {
    const wrapJsonString = shouldWrapJsonString(value, label);

    return (
      <div className="min-w-0 py-0.5 font-mono text-xs">
        {label && (
          <>
            <span className="text-slate-400">&quot;{label}&quot;</span>
            <span className="text-muted-foreground">: </span>
          </>
        )}
        {wrapJsonString ? (
          <div className="mt-1 min-w-0 pl-4">
            <JsonPrimitive value={value} />
          </div>
        ) : (
          <JsonPrimitive value={value} />
        )}
      </div>
    );
  }

  const entries = Array.isArray(value)
    ? value.map((entry, index) => [String(index), entry] as const)
    : Object.entries(value);

  const displayedEntries = showAll ? entries : entries.slice(0, MAX_JSON_ITEMS);
  const hasMore = entries.length > MAX_JSON_ITEMS && !showAll;

  return (
    <details open={defaultExpanded} className="group/details py-0.5">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md px-1 py-1 font-mono text-xs text-foreground hover:bg-background/60 [&::-webkit-details-marker]:hidden">
        <span className="text-[10px] text-muted-foreground transition-transform group-open/details:rotate-90">
          &gt;
        </span>
        {label && (
          <>
            <span className="text-slate-400">&quot;{label}&quot;</span>
            <span className="text-muted-foreground">:</span>
          </>
        )}
        <span className="text-muted-foreground">
          {getJsonContainerLabel(value)}
        </span>
        <span className="rounded border border-border bg-background/70 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {formatJsonCount(value)}
        </span>
      </summary>
      <div className="ml-2 border-l border-border/60 pl-3">
        {displayedEntries.length === 0 && (
          <div className="py-1 font-mono text-xs text-muted-foreground">
            {Array.isArray(value) ? '[empty]' : '{empty}'}
          </div>
        )}
        {displayedEntries.map(([entryLabel, entryValue]) => (
          <JsonTreeNode
            key={entryLabel}
            label={Array.isArray(value) ? undefined : entryLabel}
            value={entryValue}
            defaultExpanded={defaultExpanded}
          />
        ))}
        {hasMore && (
          <Button
            variant="link"
            size="xs"
            className="h-6 px-0 text-[10px] text-sky-400"
            onClick={() => setShowAll(true)}
          >
            Show all {entries.length} items...
          </Button>
        )}
        {entries.length > 0 && (
          <div className="py-1 font-mono text-xs text-muted-foreground">
            {Array.isArray(value) ? ']' : '}'}
          </div>
        )}
      </div>
    </details>
  );
}

function JsonViewer({ value }: { value: JsonValue }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewerKey, setViewerKey] = useState(0);

  function handleExpansion(nextExpanded: boolean) {
    setIsExpanded(nextExpanded);
    setViewerKey((current) => current + 1);
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-3 py-1.5">
        <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Tree View
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-6 text-[10px] text-slate-400 hover:text-white"
            onClick={() => handleExpansion(true)}
          >
            Expand All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-6 text-[10px] text-slate-400 hover:text-white"
            onClick={() => handleExpansion(false)}
          >
            Collapse All
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-[300px]">
        <div key={viewerKey} className="p-4">
          <JsonTreeNode value={value} defaultExpanded={isExpanded} />
        </div>
      </ScrollArea>
    </div>
  );
}

export function ResponsePanel({ response }: ResponsePanelProps) {
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');
  
  const parsedBody = useMemo(() => {
    if (!response?.bodyText.trim()) {
      return null;
    }

    try {
      const parsed = JSON.parse(response.bodyText) as JsonValue;
      return parsed;
    } catch {
      return null;
    }
  }, [response?.bodyText]);

  const formattedBody = response ? formatJsonText(response.bodyText) : '';

  return (
    <section className="flex-1 p-4 lg:p-6 min-h-0">
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Response</CardTitle>
              <p className="text-sm text-muted-foreground">
                Status, headers, body, and execution timing.
              </p>
            </div>
            {response && (
              <div className="flex flex-wrap gap-2">
                {response.isSavedSnapshot ? (
                  <Badge variant="outline">Saved Snapshot</Badge>
                ) : (
                  <Badge variant={getStatusVariant(response.status)}>
                    {response.status} {response.statusText}
                  </Badge>
                )}
                {response.status > 0 && (
                  <Badge variant={getStatusVariant(response.status)}>
                    {response.status} {response.statusText}
                  </Badge>
                )}
                {response.durationMs > 0 && (
                  <Badge variant="outline">{response.durationMs} ms</Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
          {!response && (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground">
              Send a request to inspect the response payload.
            </div>
          )}
          {response && (
            <>
              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  Resolved URL:
                </span>{' '}
                {response.url}
              </div>
              {response.errorText && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {response.errorText}
                </div>
              )}
              <Tabs defaultValue="body" className="flex min-h-0 flex-1 gap-4">
                <TabsList
                  variant="line"
                  className="w-full justify-start rounded-none border-b border-border p-0"
                >
                  <TabsTrigger value="body">Body</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                </TabsList>
                <TabsContent value="body" className="min-h-0 flex-1 space-y-3">
                  <div className="flex items-center justify-end">
                    <div className="flex bg-muted/50 p-0.5 rounded-md border border-border/40">
                      <Button
                        variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
                        size="xs"
                        className={cn(
                          "h-6 px-3 text-[10px] transition-all",
                          viewMode === 'tree' ? "shadow-sm bg-background" : "text-muted-foreground"
                        )}
                        onClick={() => setViewMode('tree')}
                      >
                        Tree
                      </Button>
                      <Button
                        variant={viewMode === 'raw' ? 'secondary' : 'ghost'}
                        size="xs"
                        className={cn(
                          "h-6 px-3 text-[10px] transition-all",
                          viewMode === 'raw' ? "shadow-sm bg-background" : "text-muted-foreground"
                        )}
                        onClick={() => setViewMode('raw')}
                      >
                        Raw
                      </Button>
                    </div>
                  </div>
                  {parsedBody && viewMode === 'tree' ? (
                    <JsonViewer value={parsedBody} />
                  ) : (
                    <ScrollArea className="flex-1 min-h-[300px] rounded-lg border border-border bg-[#0d1117]">
                      <pre className="p-4 font-mono text-xs whitespace-pre-wrap text-emerald-400">
                        {formattedBody || '(empty response body)'}
                      </pre>
                    </ScrollArea>
                  )}
                </TabsContent>
                <TabsContent value="headers" className="min-h-0 flex-1">
                  <JsonViewer value={response.headers as JsonValue} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
