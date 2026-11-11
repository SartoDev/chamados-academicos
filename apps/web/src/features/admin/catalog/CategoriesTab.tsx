import { useState } from 'react';
import type { Category } from '@/app/api/types';
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
import { useCategories, useUpdateCategory } from '../admin-api';
import { useActiveToggle } from '../shared/use-active-toggle';
import { CatalogRowActions, CatalogTable } from './CatalogTable';
import { CategoryFormDialog } from './CategoryFormDialog';

/** Categories tab (US4.2), each with its destination sector (BR4.2). */
export function CategoriesTab() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Category | 'new' | null>(null);
  const categories = useCategories({ page });
  const updateCategory = useUpdateCategory();
  const toggle = useActiveToggle<Category>((category, active) =>
    updateCategory.mutateAsync({ id: category.id, input: { active } }),
  );

  return (
    <section className="flex min-w-0 flex-col gap-4" aria-labelledby="categories-tab-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="categories-tab-heading" className="text-lg font-semibold">
          Categorias
        </h2>
        <Button onClick={() => setEditing('new')} data-testid="categories-tab-new-button">
          Nova categoria
        </Button>
      </div>
      <ListState
        status={listStatusOf(categories)}
        emptyMessage="Nenhuma categoria cadastrada."
        errorMessage={`Não foi possível carregar as categorias. ${messageForError(categories.error)}`}
        onRetry={() => void categories.refetch()}
      >
        {categories.data && (
          <>
            <CatalogTable
              label="Tabela de categorias"
              testId="category-table"
              items={categories.data.items}
              rowErrors={toggle.rowErrors}
              columns={[
                { key: 'name', header: 'Nome', render: (category) => category.name },
                { key: 'sector', header: 'Setor', render: (category) => category.sector.name },
                {
                  key: 'active',
                  header: 'Situação',
                  render: (category) => <ActiveText active={category.active} />,
                },
              ]}
              actions={(category) => (
                <CatalogRowActions
                  name={category.name}
                  active={category.active}
                  busy={toggle.busyId === category.id}
                  testIdPrefix="category-table"
                  onEdit={() => setEditing(category)}
                  onDeactivate={() => toggle.requestDeactivation(category)}
                  onReactivate={() => void toggle.reactivate(category)}
                />
              )}
            />
            <PaginationControls
              page={categories.data.page}
              pageSize={categories.data.pageSize}
              total={categories.data.total}
              onPageChange={setPage}
              testIdPrefix="categories-tab"
            />
          </>
        )}
      </ListState>
      {editing && (
        <CategoryFormDialog
          category={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDeactivateDialog
        open={toggle.pendingDeactivation !== null}
        itemName={`a categoria ${toggle.pendingDeactivation?.name ?? ''}`}
        effect={CATALOG_DEACTIVATION_EFFECT}
        onCancel={toggle.cancelDeactivation}
        onConfirm={() => void toggle.confirmDeactivation()}
      />
    </section>
  );
}
