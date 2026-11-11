import { useState } from 'react';
import type { Role, User } from '@/app/api/types';
import {
  ConfirmDeactivateDialog,
  USER_DEACTIVATION_EFFECT,
} from '@/app/components/ConfirmDeactivateDialog';
import { NativeSelect } from '@/app/components/form-parts';
import { listStatusOf } from '@/app/components/list-status';
import { ListState } from '@/app/components/ListState';
import { PaginationControls } from '@/app/components/PaginationControls';
import { messageForError } from '@/app/i18n/error-code-messages';
import { ROLE_LABELS, ROLES } from '@/app/roles';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useUpdateUser, useUsers } from '../admin-api';
import { useActiveToggle } from '../shared/use-active-toggle';
import { ResetPasswordDialog } from './ResetPasswordDialog';
import { UserFormDialog } from './UserFormDialog';
import { UserTable } from './UserTable';

type ActiveFilter = '' | 'true' | 'false';
type FormTarget = { mode: 'create' } | { mode: 'edit'; user: User };

/** Users tab (US4.1): list with filters and pagination, creation, edition, password, state. */
export function UsersTab() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<Role | ''>('');
  const [active, setActive] = useState<ActiveFilter>('');
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const users = useUsers({
    page,
    role: role || undefined,
    active: active === '' ? undefined : active === 'true',
  });
  const updateUser = useUpdateUser();
  const toggle = useActiveToggle<User>((user, nextActive) =>
    updateUser.mutateAsync({ id: user.id, input: { active: nextActive } }),
  );

  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="users-tab-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="users-tab-heading" className="text-lg font-semibold">
          Usuários
        </h2>
        <Button
          onClick={() => setFormTarget({ mode: 'create' })}
          data-testid="users-tab-new-button"
        >
          Novo usuário
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex min-w-40 flex-col gap-1">
          <Label htmlFor="users-filter-role">Perfil</Label>
          <NativeSelect
            id="users-filter-role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as Role | '');
              setPage(1);
            }}
            data-testid="users-tab-role-filter"
          >
            <option value="">Todos</option>
            {ROLES.map((option) => (
              <option key={option} value={option}>
                {ROLE_LABELS[option]}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex min-w-40 flex-col gap-1">
          <Label htmlFor="users-filter-active">Situação</Label>
          <NativeSelect
            id="users-filter-active"
            value={active}
            onChange={(event) => {
              setActive(event.target.value as ActiveFilter);
              setPage(1);
            }}
            data-testid="users-tab-active-filter"
          >
            <option value="">Todas</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </NativeSelect>
        </div>
      </div>

      {notice && (
        <p role="status" className="rounded-md border p-2 text-sm" data-testid="users-tab-notice">
          {notice}
        </p>
      )}

      <ListState
        status={listStatusOf(users)}
        emptyMessage="Nenhum usuário encontrado para os filtros escolhidos."
        errorMessage={`Não foi possível carregar os usuários. ${messageForError(users.error)}`}
        onRetry={() => void users.refetch()}
      >
        {users.data && (
          <>
            <UserTable
              users={users.data.items}
              rowErrors={toggle.rowErrors}
              busyId={toggle.busyId}
              onEdit={(user) => setFormTarget({ mode: 'edit', user })}
              onResetPassword={setPasswordTarget}
              onDeactivate={toggle.requestDeactivation}
              onReactivate={(user) => void toggle.reactivate(user)}
            />
            <PaginationControls
              page={users.data.page}
              pageSize={users.data.pageSize}
              total={users.data.total}
              onPageChange={setPage}
              testIdPrefix="users-tab"
            />
          </>
        )}
      </ListState>

      {formTarget && (
        <UserFormDialog
          user={formTarget.mode === 'edit' ? formTarget.user : undefined}
          onClose={() => setFormTarget(null)}
          onSaved={(message) => {
            setFormTarget(null);
            setNotice(message);
          }}
        />
      )}
      {passwordTarget && (
        <ResetPasswordDialog
          user={passwordTarget}
          onClose={() => setPasswordTarget(null)}
          onSaved={() => {
            setNotice(`Senha de ${passwordTarget.name} redefinida.`);
            setPasswordTarget(null);
          }}
        />
      )}
      <ConfirmDeactivateDialog
        open={toggle.pendingDeactivation !== null}
        itemName={toggle.pendingDeactivation?.name ?? ''}
        effect={USER_DEACTIVATION_EFFECT}
        onCancel={toggle.cancelDeactivation}
        onConfirm={() => void toggle.confirmDeactivation()}
      />
    </section>
  );
}
