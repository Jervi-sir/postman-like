import {
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type UIEvent,
} from 'react';

import { generateCurlCommand, parseCurlToDraft } from '@/lib/curl';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import { MoreHorizontalIcon } from '@hugeicons/core-free-icons';
import { RequestTabEditor } from './key-value-editor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { httpMethods } from '@/store/use-api-client-store';
import type {
  EditorDraft,
  HttpMethod,
  SavedRequest,
  VariableStoreMode,
} from '@/types/api';
import { Label } from '../ui/label';

type RequestEditorProps = {
  draft: EditorDraft;
  editorError: string | null;
  localVariablesText: string;
  variablesTitle: string;
  variableStoreMode: VariableStoreMode;
  hasChanges: boolean;
  isSaving: boolean;
  isExecuting: boolean;
  requests: SavedRequest[];
  onChange: (patch: Partial<EditorDraft>) => void;
  onImportDraft: (draft: EditorDraft) => void;
  onLocalVariablesTextChange: (text: string) => void;
  onDelete: () => void;
  onSave: () => void;
  onSend: () => void;
};

type CodeTextareaProps = ComponentProps<typeof Textarea>;

function CodeTextarea({
  className,
  value,
  onChange,
  onKeyDown,
  ...props
}: CodeTextareaProps) {
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const lineCount = String(value ?? '').split('\n').length;
  const lineNumbers = Array.from(
    { length: lineCount },
    (_, index) => index + 1,
  );

  function handleScroll(event: UIEvent<HTMLTextAreaElement>) {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = event.currentTarget.scrollTop;
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Tab') {
      event.preventDefault();

      const target = event.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const currentValue = target.value;
      const nextValue = `${currentValue.slice(0, start)}  ${currentValue.slice(end)}`;

      onChange?.({
        target: { value: nextValue },
        currentTarget: { value: nextValue },
      } as never);

      requestAnimationFrame(() => {
        target.selectionStart = start + 2;
        target.selectionEnd = start + 2;
      });
    }

    onKeyDown?.(event);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-[#0d1117] shadow-sm">
      <div className="border-b border-white/5 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] tracking-wide text-slate-400 uppercase">
        Editor
      </div>
      <div className="flex min-h-0">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="max-h-52 min-w-12 overflow-hidden border-r border-white/5 bg-black/20 px-2 py-3 text-right font-mono text-[12px] leading-6 text-slate-500 select-none"
        >
          {lineNumbers.map((lineNumber) => (
            <div key={lineNumber}>{lineNumber}</div>
          ))}
        </div>
        <Textarea
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className={
            'field-sizing-fixed h-52 overflow-x-hidden overflow-y-auto rounded-none border-0 bg-transparent px-3 py-3 font-mono text-[12px] leading-6 tracking-[0.01em] whitespace-pre-wrap break-normal [overflow-wrap:anywhere] text-slate-100 shadow-none outline-none caret-sky-400 placeholder:text-slate-500 selection:bg-sky-500/20 focus-visible:border-0 focus-visible:ring-0 ' +
            (className ?? '')
          }
          {...props}
        />
      </div>
    </div>
  );
}

export function RequestEditor({
  draft,
  editorError,
  localVariablesText,
  variablesTitle,
  variableStoreMode,
  hasChanges,
  isSaving,
  isExecuting,
  requests,
  onChange,
  onImportDraft,
  onLocalVariablesTextChange,
  onDelete,
  onSave,
  onSend,
}: RequestEditorProps) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [curlCommand, setCurlCommand] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const groupSuggestions = useMemo(
    () =>
      [...new Set(requests.map((request) => request.groupName.trim()))]
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right)),
    [requests],
  );
  const subGroupSuggestions = useMemo(() => {
    const normalizedGroupName = draft.groupName.trim().toLowerCase();
    const relevantRequests = normalizedGroupName
      ? requests.filter(
        (request) =>
          request.groupName.trim().toLowerCase() === normalizedGroupName,
      )
      : requests;

    return [
      ...new Set(
        relevantRequests.map((request) => request.subGroupName.trim()),
      ),
    ]
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right));
  }, [draft.groupName, requests]);

  function handleImportCurl() {
    try {
      const importedDraft = parseCurlToDraft(curlCommand);
      onImportDraft(importedDraft);
      setImportError(null);
      setCurlCommand('');
      setIsImportOpen(false);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : 'Unable to parse cURL command',
      );
    }
  }

  function handleCopyCurl() {
    try {
      const command = generateCurlCommand(draft);
      navigator.clipboard.writeText(command);
      toast.success('cURL command copied to clipboard');
    } catch (error) {
      toast.error('Failed to generate cURL command');
    }
  }

  return (
    <div className="border-b border-border bg-background p-4 lg:p-6">
      <Card className="gap-0 border-none bg-transparent py-0 ring-0 shadow-none">
        <CardHeader className="px-0 pb-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-1">
              <CardTitle>Request Builder</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure the request and run it through the backend proxy.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="link" onClick={() => setIsImportOpen(true)}>
                Import cURL
              </Button>
              <Button
                variant="ghost"
                className="text-xs font-medium text-muted-foreground h-9"
                onClick={handleCopyCurl}
              >
                Copy as cURL
              </Button>
              <Button
                variant="outline"
                onClick={onSave}
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? 'Saving...' : 'Save Request'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="More options"
                  >
                    <HugeiconsIcon
                      icon={MoreHorizontalIcon}
                      strokeWidth={2}
                      className="size-4"
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {draft.id && (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setIsDeleteOpen(true)}
                    >
                      Delete request
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-0">
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import from cURL</DialogTitle>
                <DialogDescription>
                  Paste a cURL command to load method, URL, headers, and body
                  into a new unsaved request.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <CodeTextarea
                  value={curlCommand}
                  onChange={(event) => {
                    setCurlCommand(event.target.value);
                    setImportError(null);
                  }}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  className="[tab-size:2]"
                  placeholder={`curl --request POST --url https://api.example.com/users --header 'Content-Type: application/json' --data '{"name":"Jane"}'`}
                />
                {importError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {importError}
                  </div>
                )}
              </div>
              <DialogFooter showCloseButton>
                <Button onClick={handleImportCurl}>Import</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete saved request?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes <strong>{draft.name || 'this request'}</strong>{' '}
                  from the sidebar and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    setIsDeleteOpen(false);
                    onDelete();
                  }}
                >
                  Delete request
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Name"
              value={draft.name}
              onChange={(event) => onChange({ name: event.target.value })}
              placeholder="Saved request name"
            />
            <Input
              label="Group"
              value={draft.groupName}
              onChange={(event) =>
                onChange({ groupName: event.target.value })
              }
              list="request-group-suggestions"
              placeholder="Auth, Payments, Admin"
            />
            <datalist id="request-group-suggestions">
              {groupSuggestions.map((groupName) => (
                <option key={groupName} value={groupName} />
              ))}
            </datalist>

            <Input
              label="Sub Group"
              value={draft.subGroupName}
              onChange={(event) =>
                onChange({ subGroupName: event.target.value })
              }
              list="request-sub-group-suggestions"
              placeholder="Login, Refunds, Roles"
            />
            <datalist id="request-sub-group-suggestions">
              {subGroupSuggestions.map((subGroupName) => (
                <option key={subGroupName} value={subGroupName} />
              ))}
            </datalist>
          </div>
          <div className="gap-4 flex flex-row">
            <Select
              value={draft.method}
              onValueChange={(value) =>
                onChange({ method: value as HttpMethod })
              }
            >
              <SelectTrigger label="Method" className="w-[120px]">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                {httpMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              label="URL"
              value={draft.url}
              onChange={(event) => onChange({ url: event.target.value })}
              placeholder="https://api.example.com/users"
            />
          </div>
          {editorError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {editorError}
            </div>
          )}
          <Tabs defaultValue="body" className="gap-4">
            <TabsList
              variant="line"
              className="w-full justify-start rounded-none border-b border-border p-0"
            >
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="query">Query Params</TabsTrigger>
              <TabsTrigger value="variables">{variablesTitle}</TabsTrigger>
            </TabsList>
            <TabsContent value="headers">
              <RequestTabEditor
                value={draft.headersText}
                onChange={(value) => onChange({ headersText: value })}
                EditorComponent={CodeTextarea}
                placeholder='{"Content-Type":"application/json"}'
              />
            </TabsContent>
            <TabsContent value="query">
              <RequestTabEditor
                value={draft.queryText}
                onChange={(value) => onChange({ queryText: value })}
                EditorComponent={CodeTextarea}
                placeholder='{"page":1,"limit":20}'
              />
            </TabsContent>
            <TabsContent value="body">
              <RequestTabEditor
                value={draft.bodyText}
                onChange={(value) => onChange({ bodyText: value })}
                EditorComponent={CodeTextarea}
                placeholder='{"name":"Jane Doe"}'
              />
            </TabsContent>
            <TabsContent value="variables" className="space-y-3">
              <RequestTabEditor
                value={localVariablesText}
                onChange={onLocalVariablesTextChange}
                EditorComponent={CodeTextarea}
                placeholder='{"base_url":"https://api.example.com"}'
              />
              <p className="text-xs text-muted-foreground">
                Saved in this browser only. Use placeholders like
                <code>{'{{base_url}}'}</code> or <code>{'{{tenant_id}}'}</code>{' '}
                in URL, headers, query params, and body.
              </p>
            </TabsContent>
          </Tabs>
          <Button
            variant="outline"
            className="h-10 w-full border-border bg-background text-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary hover:shadow-md cursor-pointer"
            onClick={onSend}
            disabled={isExecuting}
          >
            {isExecuting ? 'Sending...' : 'Send Request'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
