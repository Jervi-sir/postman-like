import { create } from 'zustand';

import { apiClient } from '@/lib/api';
import { parseJsonObject, stringifyJson } from '@/lib/json';
import { resolveTemplateMap, resolveTemplateString } from '@/lib/template';
import { variableStoreMode } from '@/lib/variable-store';
import type {
  EditorDraft,
  ExecutionResponse,
  HistoryItem,
  HttpMethod,
  RequestPayload,
  RequestComment,
  ResponseSnapshot,
  SavedRequest,
  VariableStoreMode,
} from '@/types/api';

type ApiClientState = {
  requests: SavedRequest[];
  history: HistoryItem[];
  comments: RequestComment[];
  draft: EditorDraft;
  activeHistoryId: number | null;
  response: ExecutionResponse | null;
  editorError: string | null;
  localVariablesText: string;
  variableStoreMode: VariableStoreMode;
  isBootstrapping: boolean;
  isSaving: boolean;
  isExecuting: boolean;
  isCommentsLoading: boolean;
  initialize: () => Promise<void>;
  newRequest: () => void;
  selectRequest: (id: string) => void;
  selectHistory: (id: number) => void;
  replaceDraft: (draft: EditorDraft) => void;
  updateDraft: (patch: Partial<EditorDraft>) => void;
  setLocalVariablesText: (text: string) => void;
  renameGroup: (currentName: string, nextName: string) => Promise<void>;
  saveCurrentRequest: () => Promise<void>;
  deleteCurrentRequest: () => Promise<void>;
  loadCommentsForCurrentRequest: () => Promise<void>;
  addCommentToCurrentRequest: (bodyText: string) => Promise<void>;
  deleteComment: (id: number) => Promise<void>;
  clearHistory: () => Promise<void>;
  executeCurrentRequest: () => Promise<void>;
  toggleIntegratedStatus: (requestId: string, type: 'frontend' | 'mobile', isIntegrated: boolean) => Promise<void>;
  saveRequestDescription: (description: string) => Promise<void>;
};

const localVariablesStorageKey = 'api-client-local-settings';
const variablesSaveDelayMs = 300;
let pendingVariablesSave: ReturnType<typeof setTimeout> | null = null;

const defaultLocalVariablesText = JSON.stringify(
  {
    base_url: '',
  },
  null,
  2,
);

const defaultDraft: EditorDraft = {
  id: null,
  name: 'New Request',
  groupName: '',
  subGroupName: '',
  method: 'GET',
  url: '',
  headersText: '{\n  "Content-Type": "application/json"\n}',
  queryText: '{}',
  bodyText: '',
  isIntegratedFrontend: false,
  integratedFrontendAt: null,
  isIntegratedMobile: false,
  integratedMobileAt: null,
  description: '',
};

function toDraft(savedRequest: SavedRequest): EditorDraft {
  return {
    id: savedRequest.id,
    name: savedRequest.name,
    groupName: savedRequest.groupName,
    subGroupName: savedRequest.subGroupName,
    method: savedRequest.method,
    url: savedRequest.url,
    headersText: stringifyJson(savedRequest.headers),
    queryText: stringifyJson(savedRequest.query),
    bodyText: savedRequest.bodyText,
    isIntegratedFrontend: savedRequest.isIntegratedFrontend,
    integratedFrontendAt: savedRequest.integratedFrontendAt,
    isIntegratedMobile: savedRequest.isIntegratedMobile,
    integratedMobileAt: savedRequest.integratedMobileAt,
    description: savedRequest.description,
  };
}

function toResponseFromSavedRequest(
  savedRequest: SavedRequest,
): ExecutionResponse | null {
  const hasSavedResponse =
    savedRequest.responseStatus !== null ||
    savedRequest.responseBodyText.trim() ||
    Object.keys(savedRequest.responseHeaders).length > 0 ||
    savedRequest.responseErrorText ||
    savedRequest.responseUrl.trim();

  if (!hasSavedResponse) {
    return null;
  }

  return {
    status: savedRequest.responseStatus ?? 0,
    statusText: savedRequest.responseStatusText || 'Saved Response',
    durationMs: savedRequest.responseDurationMs ?? 0,
    headers: savedRequest.responseHeaders,
    bodyText: savedRequest.responseBodyText,
    url: savedRequest.responseUrl || savedRequest.url,
    errorText: savedRequest.responseErrorText ?? undefined,
    isSavedSnapshot: true,
  };
}

function getTemplateVariables(localVariablesText: string) {
  const localVariables = parseJsonObject(localVariablesText, 'Local variables');
  return Object.fromEntries(
    Object.entries(localVariables).map(([key, value]) => [key, String(value)]),
  );
}

function readLocalVariablesFromStorage() {
  if (typeof window === 'undefined') {
    return defaultLocalVariablesText;
  }

  try {
    const rawValue = window.localStorage.getItem(localVariablesStorageKey);

    if (!rawValue) {
      return defaultLocalVariablesText;
    }

    const parsedValue = JSON.parse(rawValue) as {
      state?: { localVariablesText?: unknown };
    };

    return typeof parsedValue.state?.localVariablesText === 'string'
      ? parsedValue.state.localVariablesText
      : defaultLocalVariablesText;
  } catch {
    return defaultLocalVariablesText;
  }
}

function writeLocalVariablesToStorage(localVariablesText: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(
    localVariablesStorageKey,
    JSON.stringify({
      state: { localVariablesText },
      version: 0,
    }),
  );
}

function fromDraft(
  draft: EditorDraft,
  localVariablesText = defaultLocalVariablesText,
): RequestPayload {
  const payload = toRequestPayload(draft);
  const templateVariables = getTemplateVariables(localVariablesText);
  const headers = resolveTemplateMap(payload.headers, templateVariables);
  const query = resolveTemplateMap(payload.query, templateVariables);
  const bodyText = resolveTemplateString(payload.bodyText, templateVariables);
  const url = resolveTemplateString(payload.url, templateVariables);

  return {
    ...payload,
    url,
    headers,
    query,
    bodyText,
  };
}

function toRequestPayload(draft: EditorDraft): RequestPayload {
  return {
    id: draft.id,
    name: draft.name.trim() || `${draft.method} request`,
    groupName: draft.groupName.trim(),
    subGroupName: draft.subGroupName.trim(),
    method: draft.method,
    url: draft.url.trim(),
    headers: parseJsonObject(draft.headersText, 'Headers'),
    query: parseJsonObject(draft.queryText, 'Query params'),
    bodyText: draft.bodyText,
    isIntegratedFrontend: draft.isIntegratedFrontend,
    integratedFrontendAt: draft.integratedFrontendAt,
    isIntegratedMobile: draft.isIntegratedMobile,
    integratedMobileAt: draft.integratedMobileAt,
    description: draft.description,
  };
}

function toResponseSnapshot(
  response: ExecutionResponse | null,
): ResponseSnapshot | null {
  if (!response) {
    return null;
  }

  return {
    status: response.status,
    statusText: response.statusText,
    durationMs: response.durationMs,
    headers: response.headers,
    bodyText: response.bodyText,
    url: response.url,
    errorText: response.errorText,
  };
}

function toResponseFromHistory(historyItem: HistoryItem): ExecutionResponse {
  return {
    status: historyItem.statusCode ?? 0,
    statusText: historyItem.statusCode === null ? 'History Error' : 'History',
    durationMs: historyItem.durationMs,
    headers: historyItem.responseHeaders,
    bodyText: historyItem.responseBodyText,
    url: historyItem.url,
    errorText: historyItem.errorText ?? undefined,
  };
}

async function fetchCommentsForRequest(requestId: string) {
  return apiClient.listComments(requestId);
}

export const useApiClientStore = create<ApiClientState>()((set, get) => ({
  requests: [],
  history: [],
  comments: [],
  draft: defaultDraft,
  activeHistoryId: null,
  response: null,
  editorError: null,
  localVariablesText: defaultLocalVariablesText,
  variableStoreMode,
  isBootstrapping: true,
  isSaving: false,
  isExecuting: false,
  isCommentsLoading: false,
  initialize: async () => {
    set({ isBootstrapping: true });

    try {
      const [requests, history, storedVariables] = await Promise.all([
        apiClient.listRequests(),
        apiClient.listHistory(),
        variableStoreMode === 'database'
          ? apiClient.getStoredVariables()
          : Promise.resolve({
              text: readLocalVariablesFromStorage(),
              updatedAt: '',
            }),
      ]);

      const initialDraft = requests[0] ? toDraft(requests[0]) : get().draft;
      const comments = initialDraft.id
        ? await fetchCommentsForRequest(initialDraft.id).catch(() => [])
        : [];

      set({
        requests,
        history,
        draft: initialDraft,
        comments,
        localVariablesText: storedVariables.text || defaultLocalVariablesText,
        variableStoreMode,
        editorError: null,
      });
    } catch (error) {
      set({
        editorError:
          error instanceof Error
            ? error.message
            : 'Unable to load API client data',
      });
    } finally {
      set({ isBootstrapping: false });
    }
  },
  newRequest: () => {
    set({
      draft: defaultDraft,
      comments: [],
      activeHistoryId: null,
      response: null,
      editorError: null,
    });
  },
  selectRequest: (id) => {
    const selectedRequest = get().requests.find((request) => request.id === id);

    if (!selectedRequest) {
      return;
    }

    set({
      draft: toDraft(selectedRequest),
      comments: [],
      activeHistoryId: null,
      response: toResponseFromSavedRequest(selectedRequest),
      editorError: null,
      isCommentsLoading: true,
    });

    void fetchCommentsForRequest(selectedRequest.id)
      .then((comments) => {
        if (get().draft.id === selectedRequest.id) {
          set({ comments, isCommentsLoading: false });
        }
      })
      .catch(() => {
        if (get().draft.id === selectedRequest.id) {
          set({ comments: [], isCommentsLoading: false });
        }
      });
  },
  selectHistory: (id) => {
    const { history, requests } = get();
    const selectedHistory = history.find((entry) => entry.id === id);

    if (!selectedHistory) {
      return;
    }

    const linkedRequest = selectedHistory.requestId
      ? requests.find((request) => request.id === selectedHistory.requestId)
      : null;

    set((state) => ({
      draft: linkedRequest
        ? toDraft(linkedRequest)
        : {
            ...state.draft,
            method: selectedHistory.method,
            url: selectedHistory.url,
          },
      activeHistoryId: selectedHistory.id,
      response: toResponseFromHistory(selectedHistory),
      editorError: selectedHistory.errorText,
      comments: state.comments,
    }));

    if (linkedRequest) {
      set({ isCommentsLoading: true });
      void fetchCommentsForRequest(linkedRequest.id)
        .then((comments) => {
          if (get().draft.id === linkedRequest.id) {
            set({ comments, isCommentsLoading: false });
          }
        })
        .catch(() => {
          if (get().draft.id === linkedRequest.id) {
            set({ comments: [], isCommentsLoading: false });
          }
        });
    } else {
      set({ comments: [], isCommentsLoading: false });
    }
  },
  replaceDraft: (draft) => {
    set({
      draft,
      comments: [],
      activeHistoryId: null,
      response: null,
      editorError: null,
      isCommentsLoading: false,
    });
  },
  updateDraft: (patch) => {
    set((state) => ({
      draft: { ...state.draft, ...patch },
      activeHistoryId: null,
      editorError: null,
    }));
  },
  setLocalVariablesText: (text) => {
    set({ localVariablesText: text, editorError: null });

    if (variableStoreMode === 'database') {
      if (pendingVariablesSave) {
        clearTimeout(pendingVariablesSave);
      }

      pendingVariablesSave = setTimeout(() => {
        void apiClient.updateStoredVariables(text).catch((error) => {
          set({
            editorError:
              error instanceof Error
                ? error.message
                : 'Unable to save global variables',
          });
        });
      }, variablesSaveDelayMs);

      return;
    }

    writeLocalVariablesToStorage(text);
  },
  renameGroup: async (currentName, nextName) => {
    try {
      const renamedRequests = await apiClient.renameGroup(
        currentName,
        nextName,
      );
      const renamedRequestIds = new Set(
        renamedRequests.map((request) => request.id),
      );

      set((state) => ({
        requests: state.requests
          .map((request) =>
            renamedRequestIds.has(request.id)
              ? (renamedRequests.find((entry) => entry.id === request.id) ??
                request)
              : request,
          )
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
        draft:
          state.draft.id && renamedRequestIds.has(state.draft.id)
            ? { ...state.draft, groupName: nextName.trim() }
            : state.draft,
        editorError: null,
      }));
    } catch (error) {
      set({
        editorError:
          error instanceof Error ? error.message : 'Unable to rename group',
      });
    }
  },
  saveCurrentRequest: async () => {
    set({ isSaving: true, editorError: null });

    try {
      const { draft, response } = get();
      const payload = {
        ...toRequestPayload(draft),
        responseSnapshot: toResponseSnapshot(response),
      };
      const savedRequest = payload.id
        ? await apiClient.updateRequest(payload.id, payload)
        : await apiClient.createRequest(payload);

      set((state) => {
        const withoutSaved = state.requests.filter(
          (request) => request.id !== savedRequest.id,
        );

        return {
          requests: [savedRequest, ...withoutSaved].sort((left, right) =>
            right.updatedAt.localeCompare(left.updatedAt),
          ),
          activeHistoryId: null,
          draft: toDraft(savedRequest),
          response: toResponseFromSavedRequest(savedRequest),
        };
      });

      const comments = await fetchCommentsForRequest(savedRequest.id).catch(
        () => [],
      );
      set({ comments });
    } catch (error) {
      set({
        editorError:
          error instanceof Error ? error.message : 'Unable to save request',
      });
    } finally {
      set({ isSaving: false });
    }
  },
  deleteCurrentRequest: async () => {
    const { draft, requests } = get();

    if (!draft.id) {
      return;
    }

    set({ editorError: null });

    try {
      await apiClient.deleteRequest(draft.id);

      const remainingRequests = requests.filter(
        (request) => request.id !== draft.id,
      );

      set({
        requests: remainingRequests,
        draft: remainingRequests[0]
          ? toDraft(remainingRequests[0])
          : defaultDraft,
        comments: [],
        activeHistoryId: null,
        response: null,
      });

      if (remainingRequests[0]) {
        const comments = await fetchCommentsForRequest(
          remainingRequests[0].id,
        ).catch(() => []);
        set({ comments });
      }
    } catch (error) {
      set({
        editorError:
          error instanceof Error ? error.message : 'Unable to delete request',
      });
    }
  },
  loadCommentsForCurrentRequest: async () => {
    const requestId = get().draft.id;

    if (!requestId) {
      set({ comments: [], isCommentsLoading: false });
      return;
    }

    set({ isCommentsLoading: true, editorError: null });

    try {
      const comments = await fetchCommentsForRequest(requestId);
      if (get().draft.id === requestId) {
        set({ comments, isCommentsLoading: false });
      }
    } catch (error) {
      set({
        comments: [],
        isCommentsLoading: false,
        editorError:
          error instanceof Error ? error.message : 'Unable to load comments',
      });
    }
  },
  addCommentToCurrentRequest: async (bodyText) => {
    const requestId = get().draft.id;

    if (!requestId) {
      set({ editorError: 'Save the request before adding comments' });
      return;
    }

    try {
      const createdComment = await apiClient.createComment(requestId, bodyText);
      set((state) => ({
        comments: [createdComment, ...state.comments],
        editorError: null,
      }));
    } catch (error) {
      set({
        editorError:
          error instanceof Error ? error.message : 'Unable to add comment',
      });
    }
  },
  deleteComment: async (id) => {
    try {
      await apiClient.deleteComment(id);
      set((state) => ({
        comments: state.comments.filter((comment) => comment.id !== id),
      }));
    } catch (error) {
      set({
        editorError:
          error instanceof Error ? error.message : 'Unable to delete comment',
      });
    }
  },
  clearHistory: async () => {
    try {
      await apiClient.clearHistory();
      set({
        history: [],
        activeHistoryId: null,
        response: null,
        editorError: null,
      });
    } catch (error) {
      set({
        editorError:
          error instanceof Error ? error.message : 'Unable to clear history',
      });
    }
  },
  executeCurrentRequest: async () => {
    set({ isExecuting: true, editorError: null });

    try {
      const { draft, localVariablesText } = get();
      const payload = fromDraft(draft, localVariablesText);
      const executionResponse = await apiClient.executeRequest(payload);
      const history = await apiClient.listHistory();

      set({
        activeHistoryId: history[0]?.id ?? null,
        response: executionResponse,
        history,
        editorError: executionResponse.errorText ?? null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to execute request';

      set((state) => ({
        editorError: message,
        response: {
          status: state.response?.status ?? 0,
          statusText: 'Error',
          durationMs: 0,
          headers: {},
          bodyText: '',
          url: state.draft.url,
          errorText: message,
        },
      }));
    } finally {
      set({ isExecuting: false });
    }
  },
  toggleIntegratedStatus: async (requestId, type, isIntegrated) => {
    const integratedAt = isIntegrated ? new Date().toISOString() : null;

    // Optimistic update
    set((state) => {
      const update = type === 'frontend' 
        ? { isIntegratedFrontend: isIntegrated, integratedFrontendAt: integratedAt }
        : { isIntegratedMobile: isIntegrated, integratedMobileAt: integratedAt };

      return {
        requests: state.requests.map((r) =>
          r.id === requestId ? { ...r, ...update } : r
        ),
        draft:
          state.draft.id === requestId
            ? { ...state.draft, ...update }
            : state.draft,
      };
    });

    try {
      await apiClient.toggleIntegrated(requestId, type, isIntegrated, integratedAt);
    } catch (error) {
      // Revert on error
      const originalRequest = get().requests.find((r) => r.id === requestId);
      if (originalRequest) {
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === requestId ? originalRequest : r
          ),
          draft:
            state.draft.id === requestId
              ? toDraft(originalRequest)
              : state.draft,
        }));
      }
      set({
        editorError:
          error instanceof Error
            ? error.message
            : 'Failed to update integrated status',
      });
    }
  },
  saveRequestDescription: async (description) => {
    const { draft } = get();
    if (!draft.id) return;

    set({ isSaving: true, editorError: null });

    try {
      const savedRequest = await apiClient.updateRequestDescription(draft.id, description);

      set((state) => ({
        requests: state.requests.map((r) =>
          r.id === savedRequest.id ? savedRequest : r
        ),
        draft: toDraft(savedRequest),
      }));
    } catch (error) {
      set({
        editorError:
          error instanceof Error
            ? error.message
            : 'Failed to save description',
      });
    } finally {
      set({ isSaving: false });
    }
  },
}));

export const httpMethods: HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
];
