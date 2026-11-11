import { useState } from 'react';
import type { Priority } from '@/app/api/types';
import {
  CATALOG_DEACTIVATION_EFFECT,
  ConfirmDeactivateDialog,
} from '@/app/components/ConfirmDeactivateDialog';
import { ActiveText } from '@/app/components/form-parts';
import { listStatusOf } from '@/app/components/list-status';
import { ListState } from '@/app/components/ListState';
import { PaginationControls } from '@/app/components/PaginationControls';
import { messageForError } from '@/app/i18n/error-code-messages';
import { Button } from '@/components/ui/button';
import { usePriorities, useUpdatePriority } from '../admin-api';
import { useActiveToggle } from '../shared/use-active-toggle';
import { CatalogRowActions, CatalogTable } from './CatalogTable';
import { PriorityFormDialog } from './PriorityFormDialog';

/** Priorities tab (US4.2), with the default marker written as text (BR4.7, AC5.3.4). */
export function PrioritiesTab() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Priority | 'new' | null>(null);
  const priorities = usePriorities({ page });
  const updatePriority = useUpdatePriority();
  const toggle = useActiveToggle<Priority>((priority, active) =>
    updatePriority.mutateAsync({ id: priority.id, input: { active } }),
  );

  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="priorities-tab-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="priorities-tab-heading" className="text-lg font-semibold">
          Prioridades
        </h2>
        <Button onClick={() => setEditing('new')} data-testid="priorities-tab-new-button">
          Nova prioridade
        </Button>
      </div>
      <ListState
        status={listStatusOf(priorities)}
        emptyMessage="Nenhuma prioridade cadastrada."
        errorMessage={`Não foi possível carregar as prioridades. ${messageForError(priorities.error)}`}
        onRetry={() => void priorities.refetch()}
      >
        {priorities.data && (
          <>
            <CatalogTable
              label="Tabela de prioridades"
              testId="priority-table"
              items={priorities.data.items}
              rowErrors={toggle.rowErrors}
              columns={[
                { key: 'label', header: 'Rótulo', render: (priority) => priority.label },
                {
                  key: 'default',
                  header: 'Padrão',
                  render: (priority) => (priority.isDefault ? 'Sim' : 'Não'),
                },
                {
                  key: 'active',
                  header: 'Situação',
                  render: (priority) => <ActiveText active={priority.active} />,
                },
              ]}
              actions={(priority) => (
                <CatalogRowActions
                  name={priority.label}
                  active={priority.active}
                  busy={toggle.busyId === priority.id}
                  testIdPrefix="priority-table"
                  onEdit={() => setEditing(priority)}
                  onDeactivate={() => toggle.requestDeactivation(priority)}
                  onReactivate={() => void toggle.reactivate(priority)}
                />
              )}
            />
            <PaginationControls
              page={priorities.data.page}
              pageSize={priorities.data.pageSize}
              total={priorities.data.total}
              onPageChange={setPage}
              testIdPrefix="priorities-tab"
            />
          </>
        )}
      </ListState>
      {editing && (
        <PriorityFormDialog
          priority={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDeactivateDialog
        open={toggle.pendingDeactivation !== null}
        itemName={`a prioridade ${toggle.pendingDeactivation?.label ?? ''}`}
        effect={CATALOG_DEACTIVATION_EFFECT}
        onCancel={toggle.cancelDeactivation}
        onConfirm={() => void toggle.confirmDeactivation()}
      />
    </section>
  );
}
