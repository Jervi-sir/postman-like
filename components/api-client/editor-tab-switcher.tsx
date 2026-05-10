import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { CodeIcon, Table02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

export type TabType = 'json' | 'table';

interface EditorTabSwitcherProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isValidJson: boolean;
  className?: string;
}

export function EditorTabSwitcher({
  activeTab,
  onTabChange,
  isValidJson,
  className,
}: EditorTabSwitcherProps) {
  return null;
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex bg-muted/50 p-1 rounded-lg border border-border/40">
        <Button
          variant={activeTab === 'json' ? 'secondary' : 'ghost'}
          size="sm"
          className={cn(
            "h-7 px-3 text-[11px] gap-1.5 transition-all",
            activeTab === 'json' ? "shadow-sm bg-background" : "text-muted-foreground"
          )}
          onClick={() => onTabChange('json')}
        >
          <HugeiconsIcon icon={CodeIcon} className="size-3" />
          JSON
        </Button>
        <Button
          variant={activeTab === 'table' ? 'secondary' : 'ghost'}
          size="sm"
          disabled={!isValidJson}
          className={cn(
            "h-7 px-3 text-[11px] gap-1.5 transition-all",
            activeTab === 'table' ? "shadow-sm bg-background" : "text-muted-foreground"
          )}
          onClick={() => onTabChange('table')}
        >
          <HugeiconsIcon icon={Table02Icon} className="size-3" />
          Table
        </Button>
      </div>
    </div>
  );
}
