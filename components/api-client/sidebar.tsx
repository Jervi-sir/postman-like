import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { ModeToggle } from '@/components/mode-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import type { HistoryItem, SavedRequest } from '@/types/api';
import {
  ArrowLeftDoubleIcon,
  ChevronsLeft,
  CheckmarkCircle01Icon,
  CircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

type SidebarProps = {
  requests: SavedRequest[];
  history: HistoryItem[];
  activeRequestId: string | null;
  activeHistoryId: number | null;
  isLoading: boolean;
  onNewRequest: () => void;
  onClearHistory: () => void;
  onRenameGroup: (currentName: string, nextName: string) => void;
  onSelectHistory: (id: number) => void;
  onSelectRequest: (id: string) => void;
  onToggleIntegrated: (id: string, isIntegrated: boolean) => void;
};

type SidebarInfoCardProps = {
  title: string;
  subtitle: string;
  badge: string;
  badgeVariant?: 'outline' | 'destructive';
  isActive: boolean;
  isIntegrated?: boolean;
  onClick: () => void;
  onToggleIntegrated?: (event: React.MouseEvent) => void;
};

function SidebarInfoCard({
  title,
  subtitle,
  badge,
  badgeVariant = 'outline',
  isActive,
  isIntegrated,
  onClick,
  onToggleIntegrated,
}: SidebarInfoCardProps) {
  return (
    <div
      onClick={onClick}
      className={`w-full space-y-0 rounded-sm border px-2 py-1 text-left transition-colors cursor-pointer ${isActive
        ? 'border-primary/40 bg-primary/5'
        : 'border-border bg-background hover:bg-muted/50'
        }`}
    >
      <div className="flex min-w-0 items-center justify-between gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="min-w-0 truncate text-sm font-medium text-foreground">
            {title}
          </span>
        </div>
        <Badge variant={badgeVariant} className="rounded-sm">{badge}</Badge>
      </div>
      <div className='flex flex-row items-center justify-between'>
        <p className="truncate text-[9px] text-muted-foreground">{subtitle}</p>
        <div className='pr-2.5'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onToggleIntegrated?.(e);
            }}
            className={`size-3.5 shrink-0 transition-colors ${isIntegrated
              ? 'text-green-500'
              : 'text-muted-foreground/40 hover:text-muted-foreground'
              }`}
          >
            <HugeiconsIcon
              icon={isIntegrated ? CheckmarkCircle01Icon : CircleIcon}
              className="size-3"
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function groupRequests(requests: SavedRequest[]) {
  const grouped = new Map<string, Map<string, SavedRequest[]>>();

  for (const request of requests) {
    const groupKey = request.groupName || 'Ungrouped';
    const subGroupKey = request.subGroupName || '';
    const subGroups =
      grouped.get(groupKey) ?? new Map<string, SavedRequest[]>();
    const items = subGroups.get(subGroupKey);

    if (items) {
      items.push(request);
    } else {
      subGroups.set(subGroupKey, [request]);
    }

    grouped.set(groupKey, subGroups);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => {
      if (!left) {
        return 1;
      }

      if (!right) {
        return -1;
      }

      return left.localeCompare(right);
    })
    .map(([name, subGroups]) => ({
      name,
      label: name || 'Ungrouped',
      requestCount: [...subGroups.values()].reduce(
        (count, items) => count + items.length,
        0,
      ),
      subGroups: [...subGroups.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([subGroupName, items]) => ({
          name: subGroupName,
          label: subGroupName || 'Requests',
          requests: [...items].sort((left, right) =>
            left.name.localeCompare(right.name),
          ),
        })),
    }));
}

function formatHistoryStatus(statusCode: number | null) {
  if (statusCode === null) {
    return 'ERR';
  }

  return String(statusCode);
}

export function Sidebar({
  requests,
  history,
  activeRequestId,
  activeHistoryId,
  isLoading,
  onNewRequest,
  onClearHistory,
  onRenameGroup,
  onSelectHistory,
  onSelectRequest,
  onToggleIntegrated,
}: SidebarProps) {
  const groupedRequests = useMemo(() => groupRequests(requests), [requests]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSubGroups, setOpenSubGroups] = useState<Record<string, boolean>>(
    {},
  );
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [groupNameInput, setGroupNameInput] = useState('');

  useEffect(() => {
    if (
      editingGroup !== null &&
      !groupedRequests.some((group) => group.name === editingGroup)
    ) {
      setEditingGroup(null);
      setGroupNameInput('');
    }
  }, [editingGroup, groupedRequests]);

  function handleGroupToggle(groupName: string, isOpen: boolean) {
    setOpenGroups((current) => ({
      ...current,
      [groupName]: isOpen,
    }));
  }

  function handleSubGroupToggle(
    groupName: string,
    subGroupName: string,
    isOpen: boolean,
  ) {
    const key = `${groupName}::${subGroupName}`;
    setOpenSubGroups((current) => ({
      ...current,
      [key]: isOpen,
    }));
  }

  function startEditingGroup(groupName: string) {
    setEditingGroup(groupName);
    setGroupNameInput(groupName);
  }

  function stopEditingGroup() {
    setEditingGroup(null);
    setGroupNameInput('');
  }

  function submitGroupRename(currentName: string) {
    onRenameGroup(currentName, groupNameInput);
    stopEditingGroup();
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-card lg:w-[260px] lg:basis-[260px] lg:max-w-[260px] lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-foreground">API Client</p>
          <p className="text-xs text-muted-foreground">
            Internal request runner
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button size="sm" onClick={onNewRequest}>
            New Request
          </Button>
        </div>
      </div>
      <Separator />
      <ScrollArea className="h-[40vh] lg:h-[calc(100vh-73px)]">
        <div className="space-y-2 p-4">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Saved Requests
              </p>
              <Badge variant="outline">{requests.length}</Badge>
            </div>
            <div className="space-y-2">
              {isLoading && (
                <p className="text-xs text-muted-foreground">
                  Loading requests...
                </p>
              )}
              {!isLoading && requests.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No saved requests yet.
                </p>
              )}
              {groupedRequests.map((group) => (
                <Collapsible
                  key={group.name || '__ungrouped__'}
                  open={openGroups[group.name] ?? true}
                  onOpenChange={(isOpen) =>
                    handleGroupToggle(group.name, isOpen)
                  }
                  className="space-y-2"
                >
                  {editingGroup === group.name ? (
                    <div className="flex items-center gap-2 rounded-md border border-border bg-muted/20 p-2">
                      <Input
                        value={groupNameInput}
                        onChange={(event) =>
                          setGroupNameInput(event.target.value)
                        }
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            submitGroupRename(group.name);
                          }

                          if (event.key === 'Escape') {
                            event.preventDefault();
                            stopEditingGroup();
                          }
                        }}
                        autoFocus
                        placeholder="Ungrouped"
                        className="h-7"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => submitGroupRename(group.name)}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={stopEditingGroup}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md py-1 text-left hover:bg-muted/40">
                        <div className="flex flex-1 min-w-0 items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {(openGroups[group.name] ?? true) ? 'v' : '>'}
                          </span>
                          <p className="flex-1 truncate text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                            {group.label}
                          </p>
                        </div>
                        <Badge variant="outline">{group.requestCount}</Badge>
                      </CollapsibleTrigger>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="h-auto px-1.5"
                        onClick={() => startEditingGroup(group.name)}
                      >
                        Rename
                      </Button>
                    </div>
                  )}
                  <CollapsibleContent className="space-y-2">
                    {group.subGroups.map((subGroup) =>
                      subGroup.name ? (
                        <Collapsible
                          key={subGroup.name}
                          open={
                            openSubGroups[`${group.name}::${subGroup.name}`] ??
                            true
                          }
                          onOpenChange={(isOpen) =>
                            handleSubGroupToggle(
                              group.name,
                              subGroup.name,
                              isOpen,
                            )
                          }
                          className="ml-4 space-y-2 w-[220px]"
                        >
                          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md py-1 pr-1 text-left hover:bg-muted/30">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                {(openSubGroups[
                                  `${group.name}::${subGroup.name}`
                                ] ?? true)
                                  ? 'v'
                                  : '>'}
                              </span>
                              <p className="truncate text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                {subGroup.label}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {subGroup.requests.length}
                            </Badge>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="ml-0 space-y-2">
                            {subGroup.requests.map((request) => (
                              <Link
                                key={request.id}
                                href={`/requests/${request.id}`}
                                className="block"
                              >
                                <SidebarInfoCard
                                  title={request.name}
                                  subtitle={request.url}
                                  badge={request.method}
                                  isActive={request.id === activeRequestId}
                                  isIntegrated={request.isIntegrated}
                                  onClick={() => onSelectRequest(request.id)}
                                  onToggleIntegrated={() => onToggleIntegrated(request.id, !request.isIntegrated)}
                                />
                              </Link>
                            ))}
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <div
                          key="__default__"
                          className="ml-0 space-y-2 w-[232px]"
                        >
                          {subGroup.requests.map((request) => (
                            <Link
                              key={request.id}
                              href={`/requests/${request.id}`}
                              className="block"
                            >
                              <SidebarInfoCard
                                title={request.name}
                                subtitle={request.url}
                                badge={request.method}
                                isActive={request.id === activeRequestId}
                                isIntegrated={request.isIntegrated}
                                onClick={() => onSelectRequest(request.id)}
                                onToggleIntegrated={() => onToggleIntegrated(request.id, !request.isIntegrated)}
                              />
                            </Link>
                          ))}
                        </div>
                      ),
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </section>
          <Separator />
          <section className="space-y-3">
            <Collapsible
              open={isHistoryOpen}
              onOpenChange={setIsHistoryOpen}
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md py-1 text-left hover:bg-muted/40">
                  <div className="flex flex-1 min-w-0 items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {isHistoryOpen ? 'v' : '>'}
                    </span>
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      History
                    </p>
                  </div>
                  <Badge variant="outline">{history.length}</Badge>
                </CollapsibleTrigger>
                {history.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="h-auto px-1.5 text-destructive hover:text-destructive"
                    onClick={onClearHistory}
                  >
                    Remove All
                  </Button>
                )}
              </div>
              <CollapsibleContent className="space-y-2 w-[236px]">
                {history.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No executions recorded yet.
                  </p>
                )}
                {history.map((entry) => (
                  <SidebarInfoCard
                    key={entry.id}
                    title={entry.method}
                    subtitle={entry.url}
                    badge={formatHistoryStatus(entry.statusCode)}
                    badgeVariant={
                      entry.statusCode && entry.statusCode >= 400
                        ? 'destructive'
                        : 'outline'
                    }
                    isActive={entry.id === activeHistoryId}
                    onClick={() => onSelectHistory(entry.id)}
                  />
                ))}
              </CollapsibleContent>
            </Collapsible>
          </section>
        </div>
      </ScrollArea>
    </aside>
  );
}
