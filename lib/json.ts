import type { JsonMap } from '@/types/api';

export function stringifyJson(value: JsonMap) {
  return JSON.stringify(value, null, 2);
}

export function parseJsonObject(text: string, fieldName: string): JsonMap {
  const trimmed = text.trim();

  if (!trimmed) {
    return {};
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${fieldName} must be valid JSON`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${fieldName} must be a JSON object`);
  }

  return parsed as JsonMap;
}

export function formatJsonText(text: string) {
  const trimmed = text.trim();

  if (!trimmed) {
    return '';
  }

  // Skip formatting for very large payloads (> 2MB) to prevent browser hangs
  if (trimmed.length > 2 * 1024 * 1024) {
    return trimmed;
  }

  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return text;
  }
}
