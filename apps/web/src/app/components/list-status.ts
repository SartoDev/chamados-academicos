export type ListStatus = 'loading' | 'error' | 'empty' | 'ready';

/** Derives the screen state of a paginated list query (BR7.4). */
export function listStatusOf(query: {
  isPending: boolean;
  isError: boolean;
  data?: { items: readonly unknown[] };
}): ListStatus {
  if (query.isPending) {
    return 'loading';
  }
  if (query.isError) {
    return 'error';
  }
  return query.data && query.data.items.length > 0 ? 'ready' : 'empty';
}
