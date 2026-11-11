import { Button } from '@/components/ui/button';

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  testIdPrefix: string;
}

/** Page navigation with the total count (FR4.8 convention shared by every list). */
export function PaginationControls({
  page,
  pageSize,
  total,
  onPageChange,
  testIdPrefix,
}: PaginationControlsProps) {
  if (total === 0) {
    return null;
  }
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <p aria-live="polite">
        Mostrando {first}–{last} de {total}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          data-testid={`${testIdPrefix}-previous-page-button`}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= lastPage}
          onClick={() => onPageChange(page + 1)}
          data-testid={`${testIdPrefix}-next-page-button`}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
