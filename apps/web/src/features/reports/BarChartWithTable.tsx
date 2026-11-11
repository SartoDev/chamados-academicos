import { useId } from 'react';
import type { TicketCountGroup } from '@/app/api/types';
import { DataTableContainer } from '@/app/components/form-parts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BarChartWithTableProps {
  title: string;
  groups: readonly TicketCountGroup[];
  emptyMessage: string;
  testId: string;
}

/**
 * Horizontal bars drawn with plain layout elements and proportional widths — no chart library —
 * plus the equivalent table that a screen reader reads (BR7.4). The bars carry the label and
 * the quantity as text, so nothing is transmitted by colour or by width alone, and they are
 * hidden from assistive technology to avoid announcing the same numbers twice.
 */
export function BarChartWithTable({ title, groups, emptyMessage, testId }: BarChartWithTableProps) {
  const titleId = useId();
  const largest = Math.max(1, ...groups.map((group) => group.count));
  return (
    <section
      aria-labelledby={titleId}
      className="flex min-w-0 flex-col gap-3 rounded-md border p-4"
      data-testid={testId}
    >
      <h3 id={titleId} className="text-base font-semibold">
        {title}
      </h3>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground" data-testid={`${testId}-empty`}>
          {emptyMessage}
        </p>
      ) : (
        <>
          <ul aria-hidden="true" className="flex flex-col gap-2" data-testid={`${testId}-bars`}>
            {groups.map((group) => (
              <li key={group.id} className="flex min-w-0 flex-col gap-1">
                <span className="flex justify-between gap-2 text-sm">
                  <span className="truncate">{group.label}</span>
                  <span className="font-medium">{group.count}</span>
                </span>
                <span className="h-3 w-full rounded-sm bg-muted">
                  <span
                    className="block h-3 rounded-sm bg-primary"
                    style={{ width: `${Math.round((group.count / largest) * 100)}%` }}
                    data-testid={`${testId}-bar-${group.id}`}
                  />
                </span>
              </li>
            ))}
          </ul>

          <div className="sr-only">
            <DataTableContainer label={`Tabela equivalente: ${title}`}>
              <Table data-testid={`${testId}-table`}>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Item</TableHead>
                    <TableHead scope="col">Quantidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>{group.label}</TableCell>
                      <TableCell>{group.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableContainer>
          </div>
        </>
      )}
    </section>
  );
}
