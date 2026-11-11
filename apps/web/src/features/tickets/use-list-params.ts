import { useSearchParams } from 'react-router';

/**
 * Filters, slice and page kept in the address, so a reload or the retry action lands on the
 * same list (BR9.5, BR9.8, AC2.1.5). Every value travels as text, like the query string.
 */
export function useListParams<T extends Record<string, string>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const fromUrl = searchParams.get(key);
    if (fromUrl !== null) {
      values[key as keyof T] = fromUrl as T[keyof T];
    }
  }

  /** Changing a filter goes back to the first page; paging keeps the filters (AC1.3.2). */
  function update(
    patch: Partial<Record<string, string>>,
    options: { keepPage?: boolean } = {},
  ): void {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined || value === '' || value === defaults[key as keyof T]) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
    }
    if (!options.keepPage) {
      next.delete('page');
    }
    setSearchParams(next);
  }

  function clear(): void {
    setSearchParams(new URLSearchParams());
  }

  const page = Number.parseInt(values.page ?? '1', 10);

  return {
    values,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    update,
    clear,
    setPage: (nextPage: number) => update({ page: String(nextPage) }, { keepPage: true }),
    hasFilters: Object.keys(defaults).some(
      (key) => key !== 'page' && values[key as keyof T] !== defaults[key],
    ),
  };
}
