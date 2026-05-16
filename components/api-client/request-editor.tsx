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
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  MoreHorizontalIcon,
  CheckmarkCircle01Icon,
  CircleIcon,
  Settings01Icon,
  Layers01Icon,
  Notebook01Icon,
  Database01Icon,
  Settings02Icon,
  Copy01Icon,
} from '@hugeicons/core-free-icons';
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
import { Separator } from '../ui/separator';

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
  onToggleIntegrated: (type: 'frontend' | 'mobile', isIntegrated: boolean) => void;
  onSaveDescription: (description: string) => void;
};

type CodeTextareaProps = {
  className?: string;
  value?: string | number | readonly string[];
  onChange?: (e: { target: { value: string }; currentTarget: { value: string } }) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  spellCheck?: boolean;
  autoCapitalize?: string;
  autoCorrect?: string;
  headerRight?: React.ReactNode;
};

function CodeTextarea({
  className,
  value,
  onChange,
  onKeyDown,
  headerRight,
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
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] tracking-wide text-slate-400 uppercase">
        <span>Editor</span>
        {headerRight}
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
        <div className="flex-1 overflow-auto">
          <Editor
            value={String(value ?? '')}
            onValueChange={(code) => {
              onChange?.({
                target: { value: code },
                currentTarget: { value: code },
              } as any);
            }}
            highlight={(code) => highlight(code, languages.json || languages.javascript, 'json')}
            padding={12}
            onScroll={(e) => {
              if (gutterRef.current) {
                gutterRef.current.scrollTop = e.currentTarget.scrollTop;
              }
            }}
            style={{
              fontFamily: '"Fira Code", "Fira Mono", monospace',
              fontSize: 12,
              minHeight: '13rem',
              backgroundColor: 'transparent',
            }}
            className={className}
            {...(props as any)}
          />
        </div>
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
  onToggleIntegrated,
  onSaveDescription,
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

  const urlPreview = useMemo(() => {
    try {
      const queryParams = JSON.parse(draft.queryText || '{}');
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
      const qs = searchParams.toString();
      const baseUrl = draft.url || '';

      if (!qs) return baseUrl;

      try {
        const url = new URL(baseUrl);
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            url.searchParams.set(key, String(value));
          }
        });
        return url.toString();
      } catch {
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}${qs}`;
      }
    } catch {
      return draft.url;
    }
  }, [draft.queryText, draft.url]);

  const getParamCount = (jsonText: string) => {
    try {
      const obj = JSON.parse(jsonText || '{}');
      return Object.keys(obj).filter((key) => !key.startsWith('//') && key.trim() !== '').length;
    } catch {
      return 0;
    }
  };

  const queryCount = useMemo(() => getParamCount(draft.queryText), [draft.queryText]);
  const headerCount = useMemo(() => getParamCount(draft.headersText), [draft.headersText]);
  const bodyLength = draft.bodyText?.trim().length || 0;
  const descriptionLength = draft.description?.trim().length || 0;

  const handleUrlChange = (urlInput: string) => {
    const patch: Partial<EditorDraft> = { url: urlInput };

    if (urlInput.includes('?')) {
      const [, queryString] = urlInput.split('?');
      const searchParams = new URLSearchParams(queryString);
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
      patch.queryText = JSON.stringify(params, null, 2);
    } else {
      patch.queryText = '{}';
    }

    onChange(patch);
  };

  const handleQueryChange = (queryText: string) => {
    const patch: Partial<EditorDraft> = { queryText };

    try {
      const params = JSON.parse(queryText);
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (!key.startsWith('//')) {
          searchParams.append(key, String(value));
        }
      });

      const qs = searchParams.toString();
      const baseUrl = draft.url.split('?')[0];
      patch.url = qs ? `${baseUrl}?${qs}` : baseUrl;
    } catch {
      // Invalid JSON, don't sync URL
    }

    onChange(patch);
  };

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
              <div className="flex flex-wrap items-center gap-2">
                {draft.id && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className={
                        draft.isIntegratedFrontend
                          ? 'border-green-600/30 bg-green-600/10 text-green-600 hover:bg-green-600/20 hover:text-green-700'
                          : 'text-muted-foreground'
                      }
                      onClick={() => {
                        onToggleIntegrated('frontend', !draft.isIntegratedFrontend);
                      }}
                    >
                      <HugeiconsIcon
                        icon={
                          draft.isIntegratedFrontend ? CheckmarkCircle01Icon : CircleIcon
                        }
                        className="mr-2 size-4"
                      />
                      {draft.isIntegratedFrontend ? 'Integrated in Frontend' : 'Mark as Integrated in Frontend'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={
                        draft.isIntegratedMobile
                          ? 'border-blue-600/30 bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 hover:text-blue-700'
                          : 'text-muted-foreground'
                      }
                      onClick={() => {
                        onToggleIntegrated('mobile', !draft.isIntegratedMobile);
                      }}
                    >
                      <HugeiconsIcon
                        icon={
                          draft.isIntegratedMobile ? CheckmarkCircle01Icon : CircleIcon
                        }
                        className="mr-2 size-4"
                      />
                      {draft.isIntegratedMobile ? 'Integrated in Mobile' : 'Mark as Integrated in Mobile'}
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">

              <Button variant="link" onClick={() => setIsImportOpen(true)}>
                Import cURL
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
              onChange={(event) => handleUrlChange(event.target.value)}
              placeholder="https://api.example.com/users"
            />
          </div>
          {editorError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {editorError}
            </div>
          )}
          <Tabs defaultValue="query" className="gap-4">
            <TabsList
              variant="line"
              className="justify-start rounded-none p-0"
            >
              <TabsTrigger value="query">
                <HugeiconsIcon icon={Settings01Icon} className="mr-2 size-3.5" />
                Query Params
                {queryCount > 0 && (
                  <span className="ml-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary/10 px-1 text-[9px] font-bold text-primary">
                    {queryCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="headers">
                <HugeiconsIcon icon={Settings02Icon} className="mr-2 size-3.5" />
                Headers
                {headerCount > 0 && (
                  <span className="ml-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary/10 px-1 text-[9px] font-bold text-primary">
                    {headerCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="body">
                <HugeiconsIcon icon={Layers01Icon} className="mr-2 size-3.5" />
                Body
                {bodyLength > 0 && (
                  <span className="ml-1.5 size-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                )}
              </TabsTrigger>
              <TabsTrigger value="description">
                <HugeiconsIcon icon={Notebook01Icon} className="mr-2 size-3.5" />
                Description
                {descriptionLength > 0 && (
                  <span className="ml-1.5 size-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                )}
              </TabsTrigger>
              <TabsTrigger value="variables">
                <HugeiconsIcon icon={Database01Icon} className="mr-2 size-3.5" />
                {variablesTitle}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="headers">
              <RequestTabEditor
                value={
                  !draft.headersText ||
                    draft.headersText === '{}' ||
                    draft.headersText.trim() === ''
                    ? '{\n  "Content-Type": "application/json"\n}'
                    : draft.headersText
                }
                onChange={(value) => onChange({ headersText: value })}
                EditorComponent={CodeTextarea}
                placeholder='{"Content-Type":"application/json"}'
              />
            </TabsContent>
            <TabsContent value="query" className="space-y-3">
              {/* {urlPreview && (
                <div className="rounded-lg border border-border/80 bg-black/20 px-3 py-2 font-mono text-[11px] text-slate-400 break-all">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-primary uppercase text-[9px] font-bold tracking-wider">Full URL Preview</span>
                    <button 
                      className="text-[9px] hover:text-primary transition-colors uppercase font-bold"
                      onClick={() => {
                        navigator.clipboard.writeText(urlPreview);
                        toast.success('URL copied');
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <div className="opacity-80 leading-relaxed">{urlPreview}</div>
                </div>
              )} */}
              <RequestTabEditor
                value={draft.queryText}
                onChange={handleQueryChange}
                initialTab="table"
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
                editorProps={{
                  headerRight: (
                    <button
                      title="Copy body"
                      onClick={() => {
                        navigator.clipboard.writeText(draft.bodyText);
                        toast.success('Body copied to clipboard');
                      }}
                      className="hover:text-primary transition-colors flex items-center gap-1.5 lowercase"
                    >
                      <HugeiconsIcon icon={Copy01Icon} className="size-3" />
                      <span>Copy</span>
                    </button>
                  )
                }}
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
            <TabsContent value="description" className="space-y-2">
              <div className="overflow-hidden rounded-xl border border-border/80 bg-[#0d1117] shadow-sm">
                <div className="border-b border-white/5 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] tracking-wide text-slate-400 uppercase flex items-center justify-between">
                  <span className='font-mono p-0 m-0'>Request Description</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSaveDescription(draft.description)}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Description'}
                  </Button>
                </div>
                <div className="min-h-96">
                  <Editor
                    value={draft.description}
                    onValueChange={(code) => onChange({ description: code })}
                    highlight={(code) => highlight(code, languages.markdown, 'markdown')}
                    padding={16}
                    style={{
                      fontFamily: '"Fira Code", "Fira Mono", monospace',
                      fontSize: 12,
                      minHeight: '24rem',
                      backgroundColor: 'transparent',
                    }}
                    className="description-editor"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tip: Use markdown to document parameters, authentication, and response structures. Syntax highlighting is enabled.
              </p>
            </TabsContent>
          </Tabs>
          <div className='flex flex-row gap-4'>
            <Button
              variant="outline"
              className="h-10 flex-1 border-border bg-background text-foreground transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:text-primary hover:shadow-md cursor-pointer"
              onClick={onSend}
              disabled={isExecuting}
            >
              {isExecuting ? 'Sending...' : 'Send Request'}
            </Button>
            <Button
              variant="outline"
              className="h-10 text-xs font-medium text-muted-foreground"
              onClick={handleCopyCurl}
            >
              Copy as cURL
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
