export type VariableStoreMode = 'local' | 'database';

export const variableStoreMode: VariableStoreMode =
  process.env.NEXT_PUBLIC_VARIABLES_STORE_MODE === 'database'
    ? 'database'
    : 'local';

export const isDatabaseVariableStore = variableStoreMode === 'database';
