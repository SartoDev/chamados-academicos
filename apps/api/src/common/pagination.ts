/** X-01 list conventions: page starts at 1, pageSize defaults to 20 and is at most 100. */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const FIRST_PAGE: PageRequest = { page: 1, pageSize: DEFAULT_PAGE_SIZE };

export function toSkipTake(request: PageRequest): { skip: number; take: number } {
  return { skip: (request.page - 1) * request.pageSize, take: request.pageSize };
}
