import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PeriodDays } from './report-period';

interface PeriodSelectorProps {
  days: PeriodDays;
  /** Message of the client-side check, shown next to the selector (BR2.1). */
  error: string | null;
  onChange: (patch: Partial<PeriodDays>) => void;
}

/**
 * Choice of the period, with the last thirty days as the starting point. Both bounds are days:
 * the start is included and the end is included as a whole day, which the client turns into the
 * closed-open window the API expects (BR7.2, BR2.1).
 */
export function PeriodSelector({ days, error, onChange }: PeriodSelectorProps) {
  const errorId = error ? 'period-selector-error' : undefined;
  return (
    <div className="flex flex-col gap-2" data-testid="period-selector">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-40 flex-col gap-1">
          <Label htmlFor="period-from">Início</Label>
          <Input
            id="period-from"
            type="date"
            value={days.from}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            onChange={(event) => onChange({ from: event.target.value })}
            data-testid="period-selector-from"
          />
        </div>
        <div className="flex min-w-40 flex-col gap-1">
          <Label htmlFor="period-to">Fim</Label>
          <Input
            id="period-to"
            type="date"
            value={days.to}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            onChange={(event) => onChange({ to: event.target.value })}
            data-testid="period-selector-to"
          />
        </div>
        <p className="pb-2 text-xs text-muted-foreground">O dia de fim entra inteiro no período.</p>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
