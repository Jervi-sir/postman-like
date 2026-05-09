export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type JsonMap = Record<string, unknown>;

export type VariableStoreMode = 'local' | 'database';

export type SavedRequest = {
  id: string;
  name: string;
  groupName: string;
  subGroupName: string;
  method: HttpMethod;
  url: string;
  headers: JsonMap;
  query: JsonMap;
  bodyText: string;
  responseStatus: number | null;
  responseStatusText: string;
  responseDurationMs: number | null;
  responseHeaders: JsonMap;
  responseBodyText: string;
  responseUrl: string;
  responseErrorText: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HistoryItem = {
  id: number;
  requestId: string | null;
  method: HttpMethod;
  url: string;
  statusCode: number | null;
  durationMs: number;
  responseHeaders: JsonMap;
  responseBodyText: string;
  errorText: string | null;
  createdAt: string;
};

export type RequestComment = {
  id: number;
  requestId: string;
  bodyText: string;
  createdAt: string;
};

export type ExecutionResponse = {
  status: number;
  statusText: string;
  durationMs: number;
  headers: JsonMap;
  bodyText: string;
  url: string;
  errorText?: string;
  isSavedSnapshot?: boolean;
};

export type ResponseSnapshot = {
  status: number;
  statusText: string;
  durationMs: number;
  headers: JsonMap;
  bodyText: string;
  url: string;
  errorText?: string;
};

export type EditorDraft = {
  id: string | null;
  name: string;
  groupName: string;
  subGroupName: string;
  method: HttpMethod;
  url: string;
  headersText: string;
  queryText: string;
  bodyText: string;
};

export type RequestPayload = {
  id?: string | null;
  name: string;
  groupName: string;
  subGroupName: string;
  method: HttpMethod;
  url: string;
  headers: JsonMap;
  query: JsonMap;
  bodyText: string;
  responseSnapshot?: ResponseSnapshot | null;
};

export type StoredVariables = {
  text: string;
  updatedAt: string;
};
