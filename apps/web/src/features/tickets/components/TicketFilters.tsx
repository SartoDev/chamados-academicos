import type { Category, Sector, Status } from '@/app/api/types';
import { NativeSelect } from '@/app/components/form-parts';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SORT_OPTIONS } from '../ticket-labels';

export interface TicketFilterValues {
  statusId: string;
  categoryId: string;
  sectorId: string;
  sort?: string;
}

interface TicketFiltersProps {
  testIdPrefix: string;
  values: TicketFilterValues;
  statuses: readonly Status[];
  categories: readonly Category[];
  sectors?: readonly Sector[];
  /** Shown with a sort selector on the lists that offer ordering (BR2.5). */
  sortValue?: string;
  onChange: (patch: Partial<TicketFilterValues & { sort: string }>) => void;
  onClear: () => void;
  hasFilters: boolean;
}

/** Filters kept in the address, preserved when the page changes (AC1.3.2, AC2.1.5). */
export function TicketFilters({
  testIdPrefix,
  values,
  statuses,
  categories,
  sectors,
  sortValue,
  onChange,
  onClear,
  hasFilters,
}: TicketFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3" data-testid={`${testIdPrefix}-filters`}>
      <div className="flex min-w-40 flex-col gap-1">
        <Label htmlFor={`${testIdPrefix}-status-filter`}>Status</Label>
        <NativeSelect
          id={`${testIdPrefix}-status-filter`}
          value={values.statusId}
          onChange={(event) => onChange({ statusId: event.target.value })}
          data-testid={`${testIdPrefix}-status-filter`}
        >
          <option value="">Todos</option>
          {statuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex min-w-40 flex-col gap-1">
        <Label htmlFor={`${testIdPrefix}-category-filter`}>Categoria</Label>
        <NativeSelect
          id={`${testIdPrefix}-category-filter`}
          value={values.categoryId}
          onChange={(event) => onChange({ categoryId: event.target.value })}
          data-testid={`${testIdPrefix}-category-filter`}
        >
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {sectors && (
        <div className="flex min-w-40 flex-col gap-1">
          <Label htmlFor={`${testIdPrefix}-sector-filter`}>Setor</Label>
          <NativeSelect
            id={`${testIdPrefix}-sector-filter`}
            value={values.sectorId}
            onChange={(event) => onChange({ sectorId: event.target.value })}
            data-testid={`${testIdPrefix}-sector-filter`}
          >
            <option value="">Todos</option>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      {sortValue !== undefined && (
        <div className="flex min-w-48 flex-col gap-1">
          <Label htmlFor={`${testIdPrefix}-sort`}>Ordenar por</Label>
          <NativeSelect
            id={`${testIdPrefix}-sort`}
            value={sortValue}
            onChange={(event) => onChange({ sort: event.target.value })}
            data-testid={`${testIdPrefix}-sort`}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}

      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          data-testid={`${testIdPrefix}-clear-filters-button`}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
