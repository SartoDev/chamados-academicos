import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { apiRequest } from '@/app/api/api-client';
import type { Category, Page, Priority, Role, Sector, Status, User } from '@/app/api/types';

export const ADMIN_PAGE_SIZE = 20;
/** Size used to fill selection lists (maximum allowed by X-01). */
export const OPTIONS_PAGE_SIZE = 100;

export const adminKeys = {
  users: ['admin', 'users'] as const,
  sectors: ['admin', 'sectors'] as const,
  categories: ['admin', 'categories'] as const,
  statuses: ['admin', 'statuses'] as const,
  priorities: ['admin', 'priorities'] as const,
};

const path = (base: string, id: string) => `${base}/${encodeURIComponent(id)}`;

/** Mutations never retry (X-01) and refresh the affected lists on success. */
function useInvalidatingMutation<TInput, TResult>(
  mutationFn: (input: TInput) => Promise<TResult>,
  invalidates: readonly QueryKey[],
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all(invalidates.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });
}

export interface UserListParams {
  page: number;
  role?: Role;
  active?: boolean;
}

export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: [...adminKeys.users, params],
    queryFn: () =>
      apiRequest<Page<User>>('/users', {
        query: {
          page: params.page,
          pageSize: ADMIN_PAGE_SIZE,
          role: params.role,
          active: params.active,
        },
      }),
    placeholderData: keepPreviousData,
  });
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: Role;
  password: string;
  sectorId?: string;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  sectorId?: string | null;
  active?: boolean;
}

export function useCreateUser() {
  return useInvalidatingMutation(
    (input: CreateUserInput) => apiRequest<User>('/users', { method: 'POST', body: input }),
    [adminKeys.users],
  );
}

export function useUpdateUser() {
  return useInvalidatingMutation(
    ({ id, input }: { id: string; input: UpdateUserInput }) =>
      apiRequest<User>(path('/users', id), { method: 'PATCH', body: input }),
    [adminKeys.users],
  );
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      apiRequest<void>(`${path('/users', id)}/password`, { method: 'PUT', body: { password } }),
  });
}

export interface CatalogListParams {
  page?: number;
  pageSize?: number;
  active?: boolean;
}

function catalogQuery(params: CatalogListParams) {
  return {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? ADMIN_PAGE_SIZE,
    active: params.active,
  };
}

export function useSectors(params: CatalogListParams) {
  return useQuery({
    queryKey: [...adminKeys.sectors, params],
    queryFn: () => apiRequest<Page<Sector>>('/sectors', { query: catalogQuery(params) }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateSector() {
  return useInvalidatingMutation(
    (input: { name: string }) => apiRequest<Sector>('/sectors', { method: 'POST', body: input }),
    [adminKeys.sectors],
  );
}

export function useUpdateSector() {
  return useInvalidatingMutation(
    ({ id, input }: { id: string; input: { name?: string; active?: boolean } }) =>
      apiRequest<Sector>(path('/sectors', id), { method: 'PATCH', body: input }),
    [adminKeys.sectors, adminKeys.categories, adminKeys.users],
  );
}

export function useCategories(params: CatalogListParams) {
  return useQuery({
    queryKey: [...adminKeys.categories, params],
    queryFn: () => apiRequest<Page<Category>>('/categories', { query: catalogQuery(params) }),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCategory() {
  return useInvalidatingMutation(
    (input: { name: string; sectorId: string }) =>
      apiRequest<Category>('/categories', { method: 'POST', body: input }),
    [adminKeys.categories],
  );
}

export function useUpdateCategory() {
  return useInvalidatingMutation(
    ({
      id,
      input,
    }: {
      id: string;
      input: { name?: string; sectorId?: string; active?: boolean };
    }) => apiRequest<Category>(path('/categories', id), { method: 'PATCH', body: input }),
    [adminKeys.categories],
  );
}

export function useStatuses() {
  return useQuery({
    queryKey: adminKeys.statuses,
    queryFn: () => apiRequest<Page<Status>>('/statuses'),
  });
}

export function useUpdateStatus() {
  return useInvalidatingMutation(
    ({ id, label }: { id: string; label: string }) =>
      apiRequest<Status>(path('/statuses', id), { method: 'PATCH', body: { label } }),
    [adminKeys.statuses],
  );
}

export function usePriorities(params: CatalogListParams) {
  return useQuery({
    queryKey: [...adminKeys.priorities, params],
    queryFn: () => apiRequest<Page<Priority>>('/priorities', { query: catalogQuery(params) }),
    placeholderData: keepPreviousData,
  });
}

export function useCreatePriority() {
  return useInvalidatingMutation(
    (input: { label: string; isDefault: boolean }) =>
      apiRequest<Priority>('/priorities', { method: 'POST', body: input }),
    [adminKeys.priorities],
  );
}

export function useUpdatePriority() {
  return useInvalidatingMutation(
    ({
      id,
      input,
    }: {
      id: string;
      input: { label?: string; isDefault?: boolean; active?: boolean };
    }) => apiRequest<Priority>(path('/priorities', id), { method: 'PATCH', body: input }),
    [adminKeys.priorities],
  );
}
