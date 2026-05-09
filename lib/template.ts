import type { JsonMap } from '@/types/api';

const templatePattern = /\{\{\s*([\w.-]+)\s*\}\}/g;

export function resolveTemplateString(
  value: string,
  variables: Record<string, string>,
) {
  return value.replace(templatePattern, (match, variableName: string) => {
    const resolvedValue = variables[variableName];

    return resolvedValue === undefined ? match : resolvedValue;
  });
}

export function resolveTemplateMap(
  value: JsonMap,
  variables: Record<string, string>,
): JsonMap {
  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [
      key,
      resolveTemplateValue(entryValue, variables),
    ]),
  );
}

function resolveTemplateValue(
  value: unknown,
  variables: Record<string, string>,
): unknown {
  if (typeof value === 'string') {
    return resolveTemplateString(value, variables);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => resolveTemplateValue(entry, variables));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        resolveTemplateValue(entryValue, variables),
      ]),
    );
  }

  return value;
}
