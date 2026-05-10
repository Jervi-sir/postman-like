'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CommentsPanel } from '@/components/api-client/comments-panel';
import { ResponsePanel } from '@/components/api-client/response-panel';
import { RequestEditor } from '@/components/api-client/request-editor';
import { variableStoreMode } from '@/lib/variable-store';
import { useApiClientStore } from '@/store/use-api-client-store';
import type {
  EditorDraft,
  ExecutionResponse,
  SavedRequest,
  VariableStoreMode,
} from '@/types/api';

const emptyDraftBaseline: EditorDraft = {
  id: null,
  name: 'New Request',
  groupName: '',
  subGroupName: '',
  method: 'GET',
  url: '',
  headersText: '{}',
  queryText: '{}',
  bodyText: '',
  isIntegrated: false,
  integratedAt: null,
};

function getComparableDraft(draft: EditorDraft) {
  return {
    ...draft,
    name: draft.name.trim(),
    groupName: draft.groupName.trim(),
    subGroupName: draft.subGroupName.trim(),
    url: draft.url.trim(),
    headersText: draft.headersText.trim(),
    queryText: draft.queryText.trim(),
    bodyText: draft.bodyText.trim(),
  };
}

function getComparableResponse(response: ExecutionResponse | null) {
  if (!response) return null;
  return {
    status: response.status,
    statusText: response.statusText,
    durationMs: response.durationMs,
    headers: response.headers,
    bodyText: response.bodyText,
    url: response.url,
    errorText: response.errorText ?? null,
  };
}

function getSavedRequestResponse(savedRequest: SavedRequest | null | undefined) {
  if (!savedRequest) return null;

  const hasSavedResponse =
    savedRequest.responseStatus !== null ||
    savedRequest.responseBodyText.trim() ||
    Object.keys(savedRequest.responseHeaders).length > 0 ||
    savedRequest.responseErrorText ||
    savedRequest.responseUrl.trim();

  if (!hasSavedResponse) return null;

  return {
    status: savedRequest.responseStatus ?? 0,
    statusText: savedRequest.responseStatusText || 'Saved Response',
    durationMs: savedRequest.responseDurationMs ?? 0,
    headers: savedRequest.responseHeaders,
    bodyText: savedRequest.responseBodyText,
    url: savedRequest.responseUrl || savedRequest.url,
    errorText: savedRequest.responseErrorText ?? null,
  };
}

function getVariablesPanelTitle(mode: VariableStoreMode) {
  return mode === 'database' ? 'Global Variables' : 'Local Variables';
}

export default function Home() {
  const router = useRouter();
  const requests = useApiClientStore((state) => state.requests);
  const comments = useApiClientStore((state) => state.comments);
  const draft = useApiClientStore((state) => state.draft);
  const response = useApiClientStore((state) => state.response);
  const editorError = useApiClientStore((state) => state.editorError);
  const localVariablesText = useApiClientStore((state) => state.localVariablesText);
  const isSaving = useApiClientStore((state) => state.isSaving);
  const isExecuting = useApiClientStore((state) => state.isExecuting);
  const isCommentsLoading = useApiClientStore((state) => state.isCommentsLoading);
  const updateDraft = useApiClientStore((state) => state.updateDraft);
  const replaceDraft = useApiClientStore((state) => state.replaceDraft);
  const setLocalVariablesText = useApiClientStore((state) => state.setLocalVariablesText);
  const saveCurrentRequest = useApiClientStore((state) => state.saveCurrentRequest);
  const deleteCurrentRequest = useApiClientStore((state) => state.deleteCurrentRequest);
  const executeCurrentRequest = useApiClientStore((state) => state.executeCurrentRequest);
  const addCommentToCurrentRequest = useApiClientStore((state) => state.addCommentToCurrentRequest);
  const deleteComment = useApiClientStore((state) => state.deleteComment);
  const newRequest = useApiClientStore((state) => state.newRequest);

  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const handleSave = async () => {
    await saveCurrentRequest();
    const newId = useApiClientStore.getState().draft.id;
    if (newId) {
      router.push(`/requests/${newId}`);
    }
  };

  const handleDelete = async () => {
    await deleteCurrentRequest();
    // Since we're on / , we probably just clear the draft or go to next.
    // Store already handles draft selection.
  };

  // If we are on Home and there's an ID in draft, it means we probably want a new request
  // But actually, the sidebar "New Request" handles this.
  // If the user just lands on /, we show a clean slate.

  const hasChanges = useMemo(() => {
    const savedRequest = draft.id
      ? requests.find((request) => request.id === draft.id)
      : null;

    const baseline = savedRequest
      ? {
          id: savedRequest.id,
          name: savedRequest.name,
          groupName: savedRequest.groupName,
          subGroupName: savedRequest.subGroupName,
          method: savedRequest.method,
          url: savedRequest.url,
          headersText: JSON.stringify(savedRequest.headers, null, 2),
          queryText: JSON.stringify(savedRequest.query, null, 2),
          bodyText: savedRequest.bodyText,
          isIntegrated: savedRequest.isIntegrated,
          integratedAt: savedRequest.integratedAt,
        }
      : emptyDraftBaseline;

    const draftChanged =
      JSON.stringify(getComparableDraft(draft)) !==
      JSON.stringify(getComparableDraft(baseline));

    const responseChanged =
      JSON.stringify(getComparableResponse(response)) !==
      JSON.stringify(getSavedRequestResponse(savedRequest));

    return draftChanged || responseChanged;
  }, [draft, requests, response]);

  return (
    <>
      <RequestEditor
        draft={draft}
        editorError={editorError}
        localVariablesText={localVariablesText}
        variablesTitle={getVariablesPanelTitle(variableStoreMode)}
        variableStoreMode={variableStoreMode}
        hasChanges={hasChanges}
        isSaving={isSaving}
        isExecuting={isExecuting}
        requests={requests}
        onChange={updateDraft}
        onImportDraft={replaceDraft}
        onLocalVariablesTextChange={setLocalVariablesText}
        onSave={() => void handleSave()}
        onDelete={() => void handleDelete()}
        onSend={() => void executeCurrentRequest()}
        onToggleIntegrated={(isIntegrated) => {
          if (draft.id) {
            void useApiClientStore.getState().toggleIntegratedStatus(draft.id, isIntegrated)
          }
        }}
      />
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        <ResponsePanel response={response} />
        <CommentsPanel
          requestId={draft.id}
          requestName={draft.name}
          comments={comments}
          isLoading={isCommentsLoading}
          isOpen={isCommentsOpen}
          onToggle={() => setIsCommentsOpen((current) => !current)}
          onAddComment={(bodyText) =>
            void addCommentToCurrentRequest(bodyText)
          }
          onDeleteComment={(id) => void deleteComment(id)}
        />
      </div>
    </>
  );
}
