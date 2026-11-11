import { useState } from 'react';
import type { Sector } from '@/app/api/types';
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
import { useSectors, useUpdateSector } from '../admin-api';
import { useActiveToggle } from '../shared/use-active-toggle';
import { CatalogRowActions, CatalogTable } from './CatalogTable';
import { SectorFormDialog } from './SectorFormDialog';

/** Sectors tab (US4.2). A sector is never deleted: it is deactivated (BR4.5). */
export function SectorsTab() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Sector | 'new' | null>(null);
  const sectors = useSectors({ page });
  const updateSector = useUpdateSector();
  const toggle = useActiveToggle<Sector>((sector, active) =>
    updateSector.mutateAsync({ id: sector.id, input: { active } }),
  );

  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="sectors-tab-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="sectors-tab-heading" className="text-lg font-semibold">
          Setores
        </h2>
        <Button onClick={() => setEditing('new')} data-testid="sectors-tab-new-button">
          Novo setor
        </Button>
      </div>
      <ListState
        status={listStatusOf(sectors)}
        emptyMessage="Nenhum setor cadastrado. Crie o primeiro para poder cadastrar categorias."
        errorMessage={`Não foi possível carregar os setores. ${messageForError(sectors.error)}`}
        onRetry={() => void sectors.refetch()}
      >
        {sectors.data && (
          <>
            <CatalogTable
              label="Tabela de setores"
              testId="sector-table"
              items={sectors.data.items}
              rowErrors={toggle.rowErrors}
              columns={[
                { key: 'name', header: 'Nome', render: (sector) => sector.name },
                {
                  key: 'active',
                  header: 'Situação',
                  render: (sector) => <ActiveText active={sector.active} />,
                },
              ]}
              actions={(sector) => (
                <CatalogRowActions
                  name={sector.name}
                  active={sector.active}
                  busy={toggle.busyId === sector.id}
                  testIdPrefix="sector-table"
                  onEdit={() => setEditing(sector)}
                  onDeactivate={() => toggle.requestDeactivation(sector)}
                  onReactivate={() => void toggle.reactivate(sector)}
                />
              )}
            />
            <PaginationControls
              page={sectors.data.page}
              pageSize={sectors.data.pageSize}
              total={sectors.data.total}
              onPageChange={setPage}
              testIdPrefix="sectors-tab"
            />
          </>
        )}
      </ListState>
      {editing && (
        <SectorFormDialog
          sector={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDeactivateDialog
        open={toggle.pendingDeactivation !== null}
        itemName={`o setor ${toggle.pendingDeactivation?.name ?? ''}`}
        effect={`${CATALOG_DEACTIVATION_EFFECT} As categorias do setor deixam de ser oferecidas enquanto ele estiver inativo.`}
        onCancel={toggle.cancelDeactivation}
        onConfirm={() => void toggle.confirmDeactivation()}
      />
    </section>
  );
}
