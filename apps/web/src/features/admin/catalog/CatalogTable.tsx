import type { ReactNode } from 'react';
import { DataTableContainer } from '@/app/components/form-parts';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface CatalogColumn<T> {
  key: string;
  header: string;
  render: (item: T) => ReactNode;
}

interface CatalogTableProps<T extends { id: string }> {
  label: string;
  testId: string;
  items: readonly T[];
  columns: readonly CatalogColumn<T>[];
  actions: (item: T) => ReactNode;
  rowErrors: Record<string, string>;
}

/** One catalog list, with the actions column and inline row errors (BR4.3, BR7.2). */
export function CatalogTable<T extends { id: string }>({
  label,
  testId,
  items,
  columns,
  actions,
  rowErrors,
}: CatalogTableProps<T>) {
  return (
    <DataTableContainer label={label}>
      <Table data-testid={testId}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} scope="col">
                {column.header}
              </TableHead>
            ))}
            <TableHead scope="col">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} data-testid={`${testId}-row-${item.id}`}>
              {columns.map((column) => (
                <TableCell key={column.key}>{column.render(item)}</TableCell>
              ))}
              <TableCell>
                <div className="flex flex-wrap gap-1">{actions(item)}</div>
                {rowErrors[item.id] && (
                  <p
                    role="alert"
                    className="mt-1 text-sm whitespace-normal text-destructive"
                    data-testid={`${testId}-row-error`}
                  >
                    {rowErrors[item.id]}
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

interface CatalogRowActionsProps {
  name: string;
  active: boolean;
  busy: boolean;
  testIdPrefix: string;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}

export function CatalogRowActions({
  name,
  active,
  busy,
  testIdPrefix,
  onEdit,
  onDeactivate,
  onReactivate,
}: CatalogRowActionsProps) {
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        aria-label={`Editar ${name}`}
        onClick={onEdit}
        data-testid={`${testIdPrefix}-edit-button`}
      >
        Editar
      </Button>
      {active ? (
        <Button
          variant="destructive"
          size="sm"
          disabled={busy}
          aria-label={`Desativar ${name}`}
          onClick={onDeactivate}
          data-testid={`${testIdPrefix}-deactivate-button`}
        >
          Desativar
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          aria-label={`Reativar ${name}`}
          onClick={onReactivate}
          data-testid={`${testIdPrefix}-reactivate-button`}
        >
          Reativar
        </Button>
      )}
    </>
  );
}
