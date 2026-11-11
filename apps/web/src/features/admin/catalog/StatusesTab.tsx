import { useState } from 'react';
import type { Status } from '@/app/api/types';
import { listStatusOf } from '@/app/components/list-status';
import { ListState } from '@/app/components/ListState';
import { messageForError } from '@/app/i18n/error-code-messages';
import { Button } from '@/components/ui/button';
import { useStatuses } from '../admin-api';
import { CatalogTable } from './CatalogTable';
import { StatusLabelDialog } from './StatusLabelDialog';

/** Statuses tab: the four fixed statuses; only the label is editable (BR4.6). */
export function StatusesTab() {
  const [editing, setEditing] = useState<Status | null>(null);
  const statuses = useStatuses();

  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="statuses-tab-heading">
      <div className="flex flex-col gap-1">
        <h2 id="statuses-tab-heading" className="text-lg font-semibold">
          Status
        </h2>
        <p className="text-sm text-muted-foreground">
          Os quatro status são fixos. Apenas o rótulo exibido pode ser alterado.
        </p>
      </div>
      <ListState
        status={listStatusOf(statuses)}
        emptyMessage="Nenhum status encontrado."
        errorMessage={`Não foi possível carregar os status. ${messageForError(statuses.error)}`}
        onRetry={() => void statuses.refetch()}
        skeletonRows={4}
      >
        {statuses.data && (
          <CatalogTable
            label="Tabela de status"
            testId="status-table"
            items={statuses.data.items}
            rowErrors={{}}
            columns={[
              { key: 'label', header: 'Rótulo', render: (status) => status.label },
              { key: 'key', header: 'Chave', render: (status) => <code>{status.key}</code> },
            ]}
            actions={(status) => (
              <Button
                variant="outline"
                size="sm"
                aria-label={`Editar rótulo de ${status.label}`}
                onClick={() => setEditing(status)}
                data-testid="status-table-edit-button"
              >
                Editar rótulo
              </Button>
            )}
          />
        )}
      </ListState>
      {editing && <StatusLabelDialog status={editing} onClose={() => setEditing(null)} />}
    </section>
  );
}
