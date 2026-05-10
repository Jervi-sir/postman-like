import type { RequestPayload, StoredVariables, SavedRequest, HistoryItem, RequestComment, ExecutionResponse } from '@/types/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'API request failed');
  }
  return response.json() as Promise<T>;
}

export const apiClient = {
  getStoredVariables: async (): Promise<StoredVariables> => {
    const res = await fetch('/api/variables');
    return handleResponse<StoredVariables>(res);
  },

  updateStoredVariables: async (text: string): Promise<StoredVariables> => {
    const res = await fetch('/api/variables', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    return handleResponse<StoredVariables>(res);
  },

  listRequests: async (): Promise<SavedRequest[]> => {
    const res = await fetch('/api/requests');
    return handleResponse<SavedRequest[]>(res);
  },

  createRequest: async (payload: RequestPayload): Promise<SavedRequest> => {
    const res = await fetch('/api/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse<SavedRequest>(res);
  },

  updateRequest: async (id: string, payload: RequestPayload): Promise<SavedRequest> => {
    const res = await fetch(`/api/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return handleResponse<SavedRequest>(res);
  },
  
  toggleIntegrated: async (id: string, isIntegrated: boolean, integratedAt: string | null): Promise<SavedRequest> => {
    const res = await fetch(`/api/requests/${id}/integrated`, {
      method: 'POST',
      body: JSON.stringify({ isIntegrated, integratedAt }),
    });
    return handleResponse<SavedRequest>(res);
  },

  updateRequestDescription: async (id: string, description: string): Promise<SavedRequest> => {
    const res = await fetch(`/api/requests/${id}/description`, {
      method: 'PATCH',
      body: JSON.stringify({ description }),
    });
    return handleResponse<SavedRequest>(res);
  },

  renameGroup: async (currentName: string, nextName: string): Promise<SavedRequest[]> => {
    const res = await fetch('/api/requests/rename-group', {
      method: 'POST',
      body: JSON.stringify({ currentName, nextName }),
    });
    return handleResponse<SavedRequest[]>(res);
  },

  deleteRequest: async (id: string): Promise<void> => {
    const res = await fetch(`/api/requests/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  listComments: async (requestId: string): Promise<RequestComment[]> => {
    const res = await fetch(`/api/comments/${requestId}`);
    return handleResponse<RequestComment[]>(res);
  },

  createComment: async (requestId: string, bodyText: string): Promise<RequestComment> => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ requestId, bodyText }),
    });
    return handleResponse<RequestComment>(res);
  },

  deleteComment: async (commentId: number): Promise<void> => {
    const res = await fetch(`/api/comments/delete/${commentId}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  listHistory: async (): Promise<HistoryItem[]> => {
    const res = await fetch('/api/history');
    return handleResponse<HistoryItem[]>(res);
  },

  clearHistory: async (): Promise<void> => {
    const res = await fetch('/api/history', {
      method: 'DELETE',
    });
    return handleResponse<void>(res);
  },

  executeRequest: async (payload: RequestPayload): Promise<ExecutionResponse> => {
    const res = await fetch('/api/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return handleResponse<ExecutionResponse>(res);
  },
};
