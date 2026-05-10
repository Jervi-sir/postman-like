'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Database, Trash2, FileText, Search, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Diagram = {
  id: string;
  name: string;
  updatedAt: string;
};

interface DiagramSidebarProps {
  currentDiagramId: string | null;
  onSelectDiagram: (id: string) => void;
  onCreateDiagram: (name: string) => void;
  onDeleteDiagram: (id: string) => void;
  onRenameDiagram: (id: string, name: string) => void;
}

export function DiagramSidebar({
  currentDiagramId,
  onSelectDiagram,
  onCreateDiagram,
  onDeleteDiagram,
  onRenameDiagram,
}: DiagramSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('erd-sidebar-collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const fetchDiagrams = async () => {
    try {
      const res = await fetch('/api/diagrams');
      const data = await res.json();
      if (Array.isArray(data)) {
        setDiagrams(data);
      }
    } catch (error) {
      console.error('Failed to fetch diagrams', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagrams();
  }, []);

  // Save state to localStorage when it changes
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('erd-sidebar-collapsed', String(newState));
  };

  const handleCreate = () => {
    const name = prompt('Enter diagram name:', 'New ERD');
    if (name) {
      onCreateDiagram(name);
      // We'll rely on the parent to update or we can re-fetch
      setTimeout(fetchDiagrams, 500);
    }
  };

  const handleRename = (id: string, currentName: string) => {
    const newName = prompt('Enter new diagram name:', currentName);
    if (newName && newName !== currentName) {
      onRenameDiagram(id, newName);
      setDiagrams(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d));
    }
  };

  const filteredDiagrams = diagrams.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={cn(
      "border-r bg-card flex flex-col h-full transition-all duration-300 relative",
      isCollapsed ? "w-14" : "w-64"
    )}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm z-10 hover:bg-muted"
        onClick={toggleCollapse}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </Button>

      <div className={cn(
        "p-4 border-b flex flex-col gap-4 overflow-hidden transition-all",
        isCollapsed ? "items-center px-2" : ""
      )}>
        <div className={cn("flex items-center justify-between w-full", isCollapsed && "justify-center")}>
          <div className="flex items-center gap-2 font-bold text-lg whitespace-nowrap">
            <Database className="text-primary shrink-0" size={20} />
            {!isCollapsed && <span>ER Diagrams</span>}
          </div>
          {!isCollapsed && (
            <Button size="icon" variant="ghost" onClick={handleCreate} className="h-8 w-8">
              <Plus size={18} />
            </Button>
          )}
        </div>
        
        {!isCollapsed && (
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search diagrams..." 
              className="pl-8 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
        
        {isCollapsed && (
          <Button size="icon" variant="ghost" onClick={handleCreate} className="h-9 w-9">
            <Plus size={20} />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className={cn("p-2 flex flex-col gap-1", isCollapsed && "items-center")}>
          {loading ? (
            !isCollapsed && <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : filteredDiagrams.length === 0 ? (
            !isCollapsed && <div className="p-4 text-center text-sm text-muted-foreground">No diagrams found</div>
          ) : (
            filteredDiagrams.map((diagram) => (
              <div
                key={diagram.id}
                className={cn(
                  "group flex items-center justify-between p-2 rounded-md cursor-pointer transition-all overflow-hidden",
                  isCollapsed ? "w-10 h-10 justify-center" : "w-full",
                  currentDiagramId === diagram.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted'
                )}
                onClick={() => onSelectDiagram(diagram.id)}
                title={isCollapsed ? diagram.name : undefined}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={16} className="shrink-0" />
                  {!isCollapsed && <span className="text-sm font-medium truncate">{diagram.name}</span>}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRename(diagram.id, diagram.name);
                      }}
                    >
                      <Edit2 size={13} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this diagram?')) {
                          onDeleteDiagram(diagram.id);
                          setDiagrams(prev => prev.filter(d => d.id !== diagram.id));
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
