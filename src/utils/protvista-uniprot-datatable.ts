import { nothing } from 'lit';

export type Filters = Record<string, string>;

export type FilterableColumn = {
  key: string;
  filterable?: boolean;
};

export function resolvePath(obj: unknown, path: string): unknown {
  if (!path) return obj;

  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      const rec = acc as Record<string, unknown>;
      if (key in rec) return rec[key];
    }
    return undefined;
  }, obj);
}

export function getRowId<T extends Record<string, unknown>>(
  row: T,
  rowIdKey: keyof T | string
): string {
  const val = resolvePath(row, String(rowIdKey));
  return val != null ? String(val) : '';
}

export function getCellStringValue<T extends Record<string, unknown>>(
  row: T,
  key: string
): string {
  const val = resolvePath(row, key);
  return val != null ? String(val) : '';
}

export function computeFilteredData<T extends Record<string, unknown>>(
  data: ReadonlyArray<T>,
  filters: Filters
): ReadonlyArray<T> {
  const entries = Object.entries(filters);
  if (entries.length === 0) return data;

  return data.filter((row) =>
    entries.every(([key, filterVal]) => {
      if (!filterVal) return true;
      return getCellStringValue(row, key) === filterVal;
    })
  );
}

export function computeUniqueValuesByKey<T extends Record<string, unknown>>(
  data: ReadonlyArray<T>,
  columns: ReadonlyArray<FilterableColumn>
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const col of columns) {
    if (!col.filterable) continue;

    const key = String(col.key);
    const values = new Set<string>();

    for (const row of data) {
      const val = getCellStringValue(row, key);
      if (val) values.add(val);
    }

    result[key] = Array.from(values).sort((a, b) => a.localeCompare(b));
  }

  return result;
}

export function findRowFromEvent<T extends Record<string, unknown>>(
  e: Event,
  filteredData: ReadonlyArray<T>,
  rowIdKey: keyof T | string
): { id: string; row?: T } | null {
  const tr = e.composedPath().find((n) => n instanceof HTMLTableRowElement) as
    | HTMLTableRowElement
    | undefined;

  const id = tr?.dataset?.id;
  if (!id) return null;

  const row = filteredData.find((r) => getRowId(r, rowIdKey) === id);
  return { id, row };
}

export function safeDisplayValue(val: unknown): string | typeof nothing {
  if (val == null) return nothing;
  if (typeof val === 'object') return nothing;
  return String(val);
}
