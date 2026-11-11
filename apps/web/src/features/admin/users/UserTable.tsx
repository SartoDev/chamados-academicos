import type { User } from '@/app/api/types';
import { ActiveText, DataTableContainer } from '@/app/components/form-parts';
import { ROLE_LABELS } from '@/app/roles';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserTableProps {
  users: readonly User[];
  rowErrors: Record<string, string>;
  busyId: string | null;
  onEdit: (user: User) => void;
  onResetPassword: (user: User) => void;
  onDeactivate: (user: User) => void;
  onReactivate: (user: User) => void;
}

/** Users with role, sector and situation in text, and the row actions (BR2.7, BR7.4). */
export function UserTable({
  users,
  rowErrors,
  busyId,
  onEdit,
  onResetPassword,
  onDeactivate,
  onReactivate,
}: UserTableProps) {
  return (
    <DataTableContainer label="Tabela de usuários">
      <Table data-testid="user-table">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Nome</TableHead>
            <TableHead scope="col">E-mail</TableHead>
            <TableHead scope="col">Perfil</TableHead>
            <TableHead scope="col">Setor</TableHead>
            <TableHead scope="col">Situação</TableHead>
            <TableHead scope="col">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} data-testid={`user-table-row-${user.id}`}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{ROLE_LABELS[user.role]}</TableCell>
              <TableCell>{user.sector?.name ?? '—'}</TableCell>
              <TableCell>
                <ActiveText active={user.active} />
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Editar ${user.name}`}
                    onClick={() => onEdit(user)}
                    data-testid="user-table-edit-button"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`Redefinir senha de ${user.name}`}
                    onClick={() => onResetPassword(user)}
                    data-testid="user-table-reset-password-button"
                  >
                    Redefinir senha
                  </Button>
                  {user.active ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busyId === user.id}
                      aria-label={`Desativar ${user.name}`}
                      onClick={() => onDeactivate(user)}
                      data-testid="user-table-deactivate-button"
                    >
                      Desativar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busyId === user.id}
                      aria-label={`Reativar ${user.name}`}
                      onClick={() => onReactivate(user)}
                      data-testid="user-table-reactivate-button"
                    >
                      Reativar
                    </Button>
                  )}
                </div>
                {rowErrors[user.id] && (
                  <p
                    role="alert"
                    className="mt-1 text-sm whitespace-normal text-destructive"
                    data-testid="user-table-row-error"
                  >
                    {rowErrors[user.id]}
                  </p>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableContainer>
  );
}
