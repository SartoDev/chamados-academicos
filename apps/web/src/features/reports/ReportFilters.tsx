import type { Category, Sector, Status } from '@/app/api/types';
import { NativeSelect } from '@/app/components/form-parts';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface ReportFilterValues {
  statusId: string;
  categoryId: string;
  sectorId: string;
}

interface ReportFiltersProps {
  values: ReportFilterValues;
  statuses: readonly Status[];
  categories: readonly Category[];
  sectors: readonly Sector[];
  onChange: (patch: Partial<ReportFilterValues>) => void;
  onClear: () => void;
  hasFilters: boolean;
}

/**
 * Status, category and sector, optional and combinable, kept in the address so paging preserves
 * them (BR5.1). The period lives above the tabs and applies to both of them.
 */
export function ReportFilters({
  values,
  statuses,
  categories,
  sectors,
  onChange,
  onClear,
  hasFilters,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3" data-testid="report-filters">
      <div className="flex min-w-40 flex-col gap-1">
        <Label htmlFor="report-status-filter">Status</Label>
        <NativeSelect
          id="report-status-filter"
          value={values.statusId}
          onChange={(event) => onChange({ statusId: event.target.value })}
          data-testid="report-status-filter"
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
        <Label htmlFor="report-category-filter">Categoria</Label>
        <NativeSelect
          id="report-category-filter"
          value={values.categoryId}
          onChange={(event) => onChange({ categoryId: event.target.value })}
          data-testid="report-category-filter"
        >
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="flex min-w-40 flex-col gap-1">
        <Label htmlFor="report-sector-filter">Setor</Label>
        <NativeSelect
          id="report-sector-filter"
          value={values.sectorId}
          onChange={(event) => onChange({ sectorId: event.target.value })}
          data-testid="report-sector-filter"
        >
          <option value="">Todos</option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClear}
          data-testid="report-clear-filters-button"
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
