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
  CheckmarkCircle01Icon,
  CircleIcon,
  Notebook01Icon,
  Database01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  isCollapsed?: boolean;
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
  isCollapsed = false,
}: SidebarInfoCardProps) {
  if (isCollapsed) {
    return (
      <div
        onClick={onClick}
        title={`${title} (${badge})`}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-md border transition-colors cursor-pointer",
          isActive ? 'border-primary/40 bg-primary/5' : 'border-border bg-background hover:bg-muted/50'
        )}
      >
        <span className="text-[10px] font-bold uppercase">{badge.substring(0, 3)}</span>
      </div>
    );
  }

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
      if (!left) return 1;
      if (!right) return -1;
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
  if (statusCode === null) return 'ERR';
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [openSubGroups, setOpenSubGroups] = useState<Record<string, boolean>>({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [groupNameInput, setGroupNameInput] = useState('');

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('main-sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('main-sidebar-collapsed', String(newState));
  };

  const groupedRequests = useMemo(() => groupRequests(requests), [requests]);

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
    setOpenGroups((current) => ({ ...current, [groupName]: isOpen }));
  }

  function handleSubGroupToggle(groupName: string, subGroupName: string, isOpen: boolean) {
    const key = `${groupName}::${subGroupName}`;
    setOpenSubGroups((current) => ({ ...current, [key]: isOpen }));
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
    <aside className={cn(
      "flex w-full shrink-0 flex-col border-b border-border bg-card transition-all duration-300 relative lg:border-r lg:border-b-0",
      isCollapsed ? "lg:w-16 lg:basis-16 lg:max-w-16" : "lg:w-[260px] lg:basis-[260px] lg:max-w-[260px]"
    )}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:flex absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm z-10 hover:bg-muted"
        onClick={toggleCollapse}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </Button>

      <div className={cn(
        "flex items-center justify-between px-4 py-4 transition-all overflow-hidden",
        isCollapsed ? "justify-center px-2" : ""
      )}>
        {!isCollapsed && (
          <div>
            <p className="text-sm font-semibold text-foreground whitespace-nowrap">API Client</p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">Internal runner</p>
          </div>
        )}
        <div className={cn("flex items-center gap-2", isCollapsed && "flex-col")}>
          <ModeToggle />
          <Button size="sm" onClick={onNewRequest} className={cn(isCollapsed && "h-8 w-8 p-0")}>
            {isCollapsed ? <Plus size={16} /> : "New"}
          </Button>
        </div>
      </div>
      <Separator />

      <div className={cn("px-4 py-2 flex flex-col gap-2 overflow-hidden", isCollapsed && "items-center px-1")}>
        <Link href="/notes" title="Notion Notes">
          <Button variant="ghost" className={cn("w-full justify-start gap-2 h-9 text-xs font-medium", isCollapsed && "justify-center p-0")} size="sm">
            <HugeiconsIcon icon={Notebook01Icon} className="size-4 shrink-0" />
            {!isCollapsed && "Notes"}
          </Button>
        </Link>
        <Link href="/erd" title="ER Diagrams">
          <Button variant="ghost" className={cn("w-full justify-start gap-2 h-9 text-xs font-medium", isCollapsed && "justify-center p-0")} size="sm">
            <HugeiconsIcon icon={Database01Icon} className="size-4 shrink-0" />
            {!isCollapsed && "ERD"}
          </Button>
        </Link>
      </div>
      <Separator />

      <ScrollArea className="flex-1 lg:h-[calc(100vh-140px)]">
        <div className={cn("space-y-4 p-4 transition-all", isCollapsed && "p-2 flex flex-col items-center")}>
          {/* Requests Section */}
          <section className="w-full">
            {!isCollapsed && (
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Requests</p>
                <Badge variant="outline" className="text-[10px] h-4">{requests.length}</Badge>
              </div>
            )}

            <div className="space-y-2">
              {isLoading && !isCollapsed && <p className="text-[10px] text-muted-foreground">Loading...</p>}
              {groupedRequests.map((group) => (
                isCollapsed ? (
                  <div key={group.name || '__ungrouped__'} className="flex flex-col gap-1 items-center">
                    {group.subGroups.flatMap(sg => sg.requests).map(req => (
                      <SidebarInfoCard
                        key={req.id}
                        title={req.name}
                        subtitle={req.url}
                        badge={req.method}
                        isActive={req.id === activeRequestId}
                        isCollapsed
                        onClick={() => onSelectRequest(req.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <Collapsible
                    key={group.name || '__ungrouped__'}
                    open={openGroups[group.name] ?? true}
                    onOpenChange={(isOpen) => handleGroupToggle(group.name, isOpen)}
                    className="space-y-1"
                  >
                    <div className="flex items-center gap-2 group/header">
                      <CollapsibleTrigger className="flex flex-1 items-center gap-2 py-1 text-left">
                        <span className="text-[8px] text-muted-foreground w-2">
                          {(openGroups[group.name] ?? true) ? '▼' : '▶'}
                        </span>
                        <p className="flex-1 truncate text-[10px] font-bold text-muted-foreground/70 uppercase tracking-tight">
                          {group.label}
                        </p>
                      </CollapsibleTrigger>
                      <Button variant="ghost" size="xs" className="h-4 px-1 text-[9px] opacity-0 group-hover/header:opacity-100" onClick={() => startEditingGroup(group.name)}>
                        Edit
                      </Button>
                    </div>
                    <CollapsibleContent className="space-y-1 pl-2 border-l ml-1">
                      {group.subGroups.map((subGroup) => (
                        <div key={subGroup.name || '__default__'} className="space-y-1">
                          {subGroup.name && (
                            <p className="text-[9px] font-medium text-muted-foreground/50 px-2 py-0.5">{subGroup.label}</p>
                          )}
                          {subGroup.requests.map((request) => (
                            <SidebarInfoCard
                              key={request.id}
                              title={request.name}
                              subtitle={request.url}
                              badge={request.method}
                              isActive={request.id === activeRequestId}
                              isIntegrated={request.isIntegrated}
                              onClick={() => onSelectRequest(request.id)}
                              onToggleIntegrated={() => onToggleIntegrated(request.id, !request.isIntegrated)}
                            />
                          ))}
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )
              ))}
            </div>
          </section>

          <Separator />

          {/* History Section */}
          <section className="w-full">
            {!isCollapsed && (
              <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen} className="space-y-2">
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger className="flex items-center gap-2 py-1 text-left">
                    <span className="text-[8px] text-muted-foreground w-2">{isHistoryOpen ? '▼' : '▶'}</span>
                    <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">History</p>
                  </CollapsibleTrigger>
                  <Button variant="ghost" size="xs" className="h-4 text-destructive text-[9px]" onClick={onClearHistory}>Clear</Button>
                </div>
                <CollapsibleContent className="space-y-1">
                  {history.map((entry) => (
                    <SidebarInfoCard
                      key={entry.id}
                      title={entry.method}
                      subtitle={entry.url}
                      badge={formatHistoryStatus(entry.statusCode)}
                      badgeVariant={entry.statusCode && entry.statusCode >= 400 ? 'destructive' : 'outline'}
                      isActive={entry.id === activeHistoryId}
                      onClick={() => onSelectHistory(entry.id)}
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}
            {isCollapsed && (
              <div className="flex flex-col gap-1 items-center">
                <div className="text-[9px] font-bold text-muted-foreground/40 mb-1">HIST</div>
                {history.slice(0, 5).map(entry => (
                  <SidebarInfoCard
                    key={entry.id}
                    title={entry.method}
                    subtitle={entry.url}
                    badge={formatHistoryStatus(entry.statusCode)}
                    isActive={entry.id === activeHistoryId}
                    isCollapsed
                    onClick={() => onSelectHistory(entry.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </ScrollArea>
    </aside>
  );
}
