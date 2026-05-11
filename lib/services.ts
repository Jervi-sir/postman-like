import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import { eq, desc, sql } from 'drizzle-orm';
import { requests, history, requestComments, globalVariables, notes } from './schema';
import type {
  SavedRequest,
  HistoryItem,
  RequestComment,
  RequestPayload,
  ExecutionResponse,
  StoredVariables,
  JsonMap,
  HttpMethod,
  Note,
  NotePayload,
} from '@/types/api';

// --- Helpers & Mappings ---

function parseJsonRecord(
  value: string | null | undefined,
  fallback: JsonMap,
): JsonMap {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapRequestRow(row: any): SavedRequest {
  return {
    id: row.id,
    name: row.name,
    groupName: row.groupName,
    subGroupName: row.subGroupName,
    method: row.method as HttpMethod,
    url: row.url,
    headers: parseJsonRecord(row.headersJson, {}),
    query: parseJsonRecord(row.queryJson, {}),
    bodyText: row.bodyText,
    responseStatus: row.responseStatus,
    responseStatusText: row.responseStatusText,
    responseDurationMs: row.responseDurationMs,
    responseHeaders: parseJsonRecord(row.responseHeadersJson, {}),
    responseBodyText: row.responseBodyText,
    responseUrl: row.responseUrl,
    responseErrorText: row.responseErrorText,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    isIntegratedFrontend: row.isIntegratedFrontend,
    integratedFrontendAt: row.integratedFrontendAt,
    isIntegratedMobile: row.isIntegratedMobile,
    integratedMobileAt: row.integratedMobileAt,
    description: row.description,
  };
}

function mapHistoryRow(row: any): HistoryItem {
  return {
    id: row.id,
    requestId: row.requestId,
    method: row.method as HttpMethod,
    url: row.url,
    statusCode: row.statusCode,
    durationMs: row.durationMs,
    responseHeaders: parseJsonRecord(row.responseHeadersJson, {}),
    responseBodyText: row.responseBodyText,
    errorText: row.errorText,
    createdAt: row.createdAt,
  };
}

function mapCommentRow(row: any): RequestComment {
  return {
    id: row.id,
    requestId: row.requestId,
    bodyText: row.bodyText,
    createdAt: row.createdAt,
  };
}

function nowIso() {
  return new Date().toISOString();
}

// --- Requests ---

export async function getStoredVariables(): Promise<StoredVariables> {
  try {
    const row = await db.query.globalVariables.findFirst({
      where: eq(globalVariables.id, 1),
    });

    if (!row) {
      const timestamp = nowIso();

      await db.insert(globalVariables).values({
        id: 1,
        variablesText: '{}',
        updatedAt: timestamp,
      });

      return {
        text: '{}',
        updatedAt: timestamp,
      };
    }

    return {
      text: row.variablesText,
      updatedAt: row.updatedAt,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch stored variables');
  }
}

export async function updateStoredVariables(
  text: string,
): Promise<StoredVariables> {
  try {
    const timestamp = nowIso();

    await db
      .insert(globalVariables)
      .values({
        id: 1,
        variablesText: text,
        updatedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: globalVariables.id,
        set: {
          variablesText: text,
          updatedAt: timestamp,
        },
      });

    return {
      text,
      updatedAt: timestamp,
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update stored variables');
  }
}

export async function listRequests(): Promise<SavedRequest[]> {
  try {
    const rows = await db
      .select()
      .from(requests)
      .orderBy(desc(requests.updatedAt), desc(requests.createdAt));
    return rows.map(mapRequestRow);
  } catch (error) {
    console.error('Failed to list requests:', error);
    throw new Error('Failed to fetch requests');
  }
}

export async function createRequest(
  payload: RequestPayload,
): Promise<SavedRequest> {
  try {
    const id = uuidv4();
    const timestamp = nowIso();

    await db.insert(requests).values({
      id,
      name: payload.name,
      groupName: payload.groupName,
      subGroupName: payload.subGroupName,
      method: payload.method,
      url: payload.url,
      headersJson: JSON.stringify(payload.headers || {}),
      queryJson: JSON.stringify(payload.query || {}),
      bodyText: payload.bodyText || '',
      useGlobalBearer: 0,
      responseStatus: payload.responseSnapshot?.status ?? null,
      responseStatusText: payload.responseSnapshot?.statusText ?? '',
      responseDurationMs: payload.responseSnapshot?.durationMs ?? null,
      responseHeadersJson: JSON.stringify(payload.responseSnapshot?.headers ?? {}),
      responseBodyText: payload.responseSnapshot?.bodyText ?? '',
      responseUrl: payload.responseSnapshot?.url ?? '',
      responseErrorText: payload.responseSnapshot?.errorText ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      isIntegratedFrontend: payload.isIntegratedFrontend ?? false,
      integratedFrontendAt: payload.integratedFrontendAt ?? null,
      isIntegratedMobile: payload.isIntegratedMobile ?? false,
      integratedMobileAt: payload.integratedMobileAt ?? null,
      description: payload.description ?? '',
    });

    const created = await db.query.requests.findFirst({
      where: eq(requests.id, id),
    });
    if (!created) throw new Error('Failed to create request');
    return mapRequestRow(created);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create request');
  }
}

export async function updateRequest(
  id: string,
  payload: RequestPayload,
): Promise<SavedRequest> {
  try {
    const timestamp = nowIso();

    const [updated] = await db
      .update(requests)
      .set({
        name: payload.name,
        groupName: payload.groupName,
        subGroupName: payload.subGroupName,
        method: payload.method,
        url: payload.url,
        headersJson: JSON.stringify(payload.headers || {}),
        queryJson: JSON.stringify(payload.query || {}),
        bodyText: payload.bodyText || '',
        useGlobalBearer: 0,
        responseStatus: payload.responseSnapshot?.status ?? null,
        responseStatusText: payload.responseSnapshot?.statusText ?? '',
        responseDurationMs: payload.responseSnapshot?.durationMs ?? null,
        responseHeadersJson: JSON.stringify(payload.responseSnapshot?.headers ?? {}),
        responseBodyText: payload.responseSnapshot?.bodyText ?? '',
        responseUrl: payload.responseSnapshot?.url ?? '',
        responseErrorText: payload.responseSnapshot?.errorText ?? null,
        updatedAt: timestamp,
        isIntegratedFrontend: payload.isIntegratedFrontend ?? false,
        integratedFrontendAt: payload.integratedFrontendAt ?? null,
        isIntegratedMobile: payload.isIntegratedMobile ?? false,
        integratedMobileAt: payload.integratedMobileAt ?? null,
        description: payload.description ?? '',
      })
      .where(eq(requests.id, id))
      .returning();

    if (!updated) {
      throw new Error('Request not found');
    }

    return mapRequestRow(updated);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update request');
  }
}

export async function toggleRequestIntegrated(
  id: string,
  type: 'frontend' | 'mobile',
  isIntegrated: boolean,
  integratedAt: string | null,
): Promise<SavedRequest> {
  try {
    const timestamp = nowIso();
    const updatePayload: any = { updatedAt: timestamp };

    if (type === 'frontend') {
      updatePayload.isIntegratedFrontend = isIntegrated;
      updatePayload.integratedFrontendAt = integratedAt;
    } else {
      updatePayload.isIntegratedMobile = isIntegrated;
      updatePayload.integratedMobileAt = integratedAt;
    }

    const [updated] = await db
      .update(requests)
      .set(updatePayload)
      .where(eq(requests.id, id))
      .returning();

    if (!updated) {
      throw new Error('Request not found');
    }

    return mapRequestRow(updated);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to toggle integrated status');
  }
}

export async function updateRequestDescription(
  id: string,
  description: string,
): Promise<SavedRequest> {
  try {
    const timestamp = nowIso();

    const [updated] = await db
      .update(requests)
      .set({
        description,
        updatedAt: timestamp,
      })
      .where(eq(requests.id, id))
      .returning();

    if (!updated) {
      throw new Error('Request not found');
    }

    return mapRequestRow(updated);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update request description');
  }
}

export async function deleteRequest(id: string): Promise<void> {
  try {
    await db.delete(requests).where(eq(requests.id, id));
  } catch (error) {
    throw new Error('Failed to delete request');
  }
}

// --- Groups ---

export async function renameGroup(
  currentName: string,
  nextName: string,
): Promise<SavedRequest[]> {
  try {
    const filterValue = currentName?.trim() || '';
    const newName = nextName?.trim() || '';

    if (filterValue === newName) {
      throw new Error('New group name must be different');
    }

    const timestamp = nowIso();
    await db
      .update(requests)
      .set({
        groupName: newName,
        updatedAt: timestamp,
      })
      .where(eq(requests.groupName, filterValue));

    const rows = await db
      .select()
      .from(requests)
      .where(eq(requests.groupName, newName))
      .orderBy(desc(requests.updatedAt), desc(requests.createdAt));

    return rows.map(mapRequestRow);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to rename group');
  }
}

// --- Comments ---

export async function listComments(
  requestId: string,
): Promise<RequestComment[]> {
  try {
    const rows = await db
      .select()
      .from(requestComments)
      .where(eq(requestComments.requestId, requestId))
      .orderBy(desc(requestComments.createdAt), desc(requestComments.id));
    return rows.map(mapCommentRow);
  } catch (error) {
    throw new Error('Failed to fetch comments');
  }
}

export async function createComment(
  requestId: string,
  bodyText: string,
): Promise<RequestComment> {
  try {
    const [created] = await db
      .insert(requestComments)
      .values({
        requestId,
        bodyText,
        createdAt: nowIso(),
      })
      .returning();

    return mapCommentRow(created);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create comment');
  }
}

export async function deleteComment(commentId: number): Promise<void> {
  try {
    await db.delete(requestComments).where(eq(requestComments.id, commentId));
  } catch (error) {
    throw new Error('Failed to delete comment');
  }
}

// --- History ---

export async function listHistory(): Promise<HistoryItem[]> {
  try {
    const rows = await db
      .select()
      .from(history)
      .orderBy(desc(history.createdAt), desc(history.id))
      .limit(50);
    return rows.map(mapHistoryRow);
  } catch (error) {
    throw new Error('Failed to fetch history');
  }
}

export async function clearHistory(): Promise<void> {
  try {
    await db.delete(history);
  } catch (error) {
    throw new Error('Failed to clear history');
  }
}

// --- Execution ---

function buildTargetUrl(rawUrl: string, query: Record<string, any>) {
  const targetUrl = new URL(rawUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value === null || value === undefined || value === '') {
      targetUrl.searchParams.delete(key);
      continue;
    }
    targetUrl.searchParams.set(key, String(value));
  }
  return targetUrl.toString();
}

async function insertHistory(entry: any) {
  await db.insert(history).values({
    requestId: entry.requestId ?? null,
    method: entry.method,
    url: entry.url,
    statusCode: entry.statusCode ?? null,
    durationMs: entry.durationMs,
    responseHeadersJson: JSON.stringify(entry.responseHeaders ?? {}),
    responseBodyText: entry.responseBodyText ?? '',
    errorText: entry.errorText ?? null,
    createdAt: nowIso(),
  });

  // Maintain limit of 50
  const subquery = db
    .select({ id: history.id })
    .from(history)
    .orderBy(desc(history.createdAt), desc(history.id))
    .limit(50);

  await db.delete(history).where(sql`${history.id} NOT IN (${subquery})`);
}

export async function executeRequest(
  payload: RequestPayload,
): Promise<ExecutionResponse> {
  const startedAt = Date.now();
  let targetUrl: string;

  try {
    targetUrl = buildTargetUrl(payload.url, payload.query || {});
  } catch (error: any) {
    throw new Error(error.message || 'Invalid target URL');
  }

  const requestId = payload.id ?? null;

  try {
    const fetchOptions: RequestInit = {
      method: payload.method,
      headers: (payload.headers as any) || {},
    };

    if (
      payload.method !== 'GET' &&
      payload.method !== 'DELETE' &&
      payload.bodyText &&
      payload.bodyText.trim()
    ) {
      fetchOptions.body = payload.bodyText;
    }

    const upstreamResponse = await fetch(targetUrl, fetchOptions);
    const responseBodyText = await upstreamResponse.text();
    const durationMs = Date.now() - startedAt;
    const responseHeaders = Object.fromEntries(
      upstreamResponse.headers.entries(),
    );

    await insertHistory({
      requestId,
      method: payload.method,
      url: targetUrl,
      statusCode: upstreamResponse.status,
      durationMs,
      responseHeaders,
      responseBodyText,
      errorText: null,
    });

    return {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      durationMs,
      headers: responseHeaders,
      bodyText: responseBodyText,
      url: targetUrl,
    };
  } catch (error: any) {
    const durationMs = Date.now() - startedAt;
    const errorText = error.message || 'Request failed';

    await insertHistory({
      requestId,
      method: payload.method,
      url: targetUrl,
      statusCode: null,
      durationMs,
      responseHeaders: {},
      responseBodyText: '',
      errorText,
    });

    return {
      status: 0,
      statusText: 'Request Failed',
      durationMs,
      headers: {},
      bodyText: '',
      errorText,
      url: targetUrl,
    };
  }
}

// --- Notes ---

export async function listNotes(): Promise<Note[]> {
  try {
    const rows = await db
      .select()
      .from(notes)
      .orderBy(desc(notes.updatedAt), desc(notes.createdAt));
    return rows;
  } catch {
    throw new Error('Failed to fetch notes');
  }
}

export async function getNote(id: string): Promise<Note | null> {
  try {
    const note = await db.query.notes.findFirst({
      where: eq(notes.id, id),
    });
    return note || null;
  } catch {
    throw new Error('Failed to fetch note');
  }
}

export async function createNote(payload: NotePayload): Promise<Note> {
  try {
    const id = uuidv4();
    const timestamp = nowIso();

    const [created] = await db
      .insert(notes)
      .values({
        id,
        title: payload.title,
        content: payload.content,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    return created;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create note');
  }
}

export async function updateNote(
  id: string,
  payload: NotePayload,
): Promise<Note> {
  try {
    const timestamp = nowIso();

    const [updated] = await db
      .update(notes)
      .set({
        title: payload.title,
        content: payload.content,
        updatedAt: timestamp,
      })
      .where(eq(notes.id, id))
      .returning();

    if (!updated) {
      throw new Error('Note not found');
    }

    return updated;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update note');
  }
}

export async function deleteNote(id: string): Promise<void> {
  try {
    await db.delete(notes).where(eq(notes.id, id));
  } catch {
    throw new Error('Failed to delete note');
  }
}
