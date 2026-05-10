import { stringifyJson } from '@/lib/json';
import type { EditorDraft, HttpMethod, JsonMap } from '@/types/api';

const dataFlags = new Set([
  '-d',
  '--data',
  '--data-raw',
  '--data-binary',
  '--data-ascii',
  '--json',
]);

function tokenizeCurlCommand(command: string) {
  const tokens: string[] = [];
  let current = '';
  let quote: 'single' | 'double' | null = null;

  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];

    if (
      character === '\\' &&
      quote !== 'single' &&
      index + 1 < command.length
    ) {
      current += command[index + 1];
      index += 1;
      continue;
    }

    if (quote === 'single') {
      if (character === "'") {
        quote = null;
      } else {
        current += character;
      }
      continue;
    }

    if (quote === 'double') {
      if (character === '"') {
        quote = null;
      } else {
        current += character;
      }
      continue;
    }

    if (character === "'") {
      quote = 'single';
      continue;
    }

    if (character === '"') {
      quote = 'double';
      continue;
    }

    if (/\s/.test(character)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += character;
  }

  if (quote) {
    throw new Error('Unclosed quote in cURL command');
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

function toMethod(value: string): HttpMethod {
  const method = value.toUpperCase();

  if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    return method as HttpMethod;
  }

  throw new Error(`Unsupported HTTP method in cURL: ${value}`);
}

function parseHeader(headerValue: string, headers: JsonMap) {
  const separatorIndex = headerValue.indexOf(':');

  if (separatorIndex === -1) {
    throw new Error(`Invalid header format: ${headerValue}`);
  }

  const key = headerValue.slice(0, separatorIndex).trim();
  const value = headerValue.slice(separatorIndex + 1).trim();

  headers[key] = value;
}

function guessRequestName(url: string, method: HttpMethod) {
  try {
    const parsedUrl = new URL(url);
    const pathPart = parsedUrl.pathname.split('/').filter(Boolean).at(-1);

    if (pathPart) {
      return `${method} ${pathPart}`;
    }

    return `${method} ${parsedUrl.hostname}`;
  } catch {
    return `${method} request`;
  }
}

export function parseCurlToDraft(command: string): EditorDraft {
  const tokens = tokenizeCurlCommand(command.trim());

  if (tokens.length === 0 || tokens[0] !== 'curl') {
    throw new Error('Paste a valid cURL command that starts with `curl`');
  }

  let method: HttpMethod = 'GET';
  let url = '';
  let bodyText = '';
  let hasExplicitMethod = false;
  const headers: JsonMap = {};

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    const nextToken = tokens[index + 1];

    if ((token === '-X' || token === '--request') && nextToken) {
      method = toMethod(nextToken);
      hasExplicitMethod = true;
      index += 1;
      continue;
    }

    if ((token === '-H' || token === '--header') && nextToken) {
      parseHeader(nextToken, headers);
      index += 1;
      continue;
    }

    if ((token === '--url' || token === '--location-url') && nextToken) {
      url = nextToken;
      index += 1;
      continue;
    }

    if (dataFlags.has(token) && nextToken) {
      bodyText = nextToken;

      if (!hasExplicitMethod) {
        method = 'POST';
      }

      index += 1;
      continue;
    }

    if (token.startsWith('http://') || token.startsWith('https://')) {
      url = token;
    }
  }

  if (!url) {
    throw new Error('Could not find a URL in the cURL command');
  }

  return {
    id: null,
    name: guessRequestName(url, method),
    groupName: '',
    subGroupName: '',
    method,
    url,
    headersText: stringifyJson(headers),
    queryText: '{}',
    bodyText,
    isIntegrated: false,
    integratedAt: null,
    description: '',
  };
}

export function generateCurlCommand(draft: EditorDraft): string {
  const parts = ['curl'];

  // Method
  if (draft.method !== 'GET') {
    parts.push('-X', draft.method);
  }

  // URL (with query params if any)
  let finalUrl = draft.url;
  try {
    const query = JSON.parse(draft.queryText || '{}');
    const queryEntries = Object.entries(query).filter(
      ([_, value]) => value !== undefined && value !== null && value !== '',
    );

    if (queryEntries.length > 0) {
      try {
        const urlObj = new URL(finalUrl);
        queryEntries.forEach(([key, value]) => {
          urlObj.searchParams.append(key, String(value));
        });
        finalUrl = urlObj.toString();
      } catch {
        // If URL parsing fails (e.g. templates), manually append
        const separator = finalUrl.includes('?') ? '&' : '?';
        const queryString = queryEntries
          .map(
            ([key, value]) =>
              `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
          )
          .join('&');
        finalUrl = `${finalUrl}${separator}${queryString}`;
      }
    }
  } catch {
    // Ignore JSON parsing errors for query params
  }
  parts.push(`'${finalUrl}'`);

  // Headers
  try {
    const headers = JSON.parse(draft.headersText || '{}');
    Object.entries(headers).forEach(([key, value]) => {
      parts.push('-H', `'${key}: ${value}'`);
    });
  } catch {
    // Ignore header parsing errors
  }

  // Body
  if (
    draft.method !== 'GET' &&
    draft.method !== 'DELETE' &&
    draft.bodyText?.trim()
  ) {
    // Escape single quotes in body for cURL command
    const escapedBody = draft.bodyText.replace(/'/g, "'\\''");
    parts.push('--data-raw', `'${escapedBody}'`);
  }

  return parts.join(' ');
}
