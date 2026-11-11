import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSession } from '@/features/auth/use-session';
import { useListParams } from '@/features/tickets/use-list-params';
import { IndicatorsTab } from './IndicatorsTab';
import { PeriodSelector } from './PeriodSelector';
import { QueryTab } from './QueryTab';
import { defaultPeriodDays, periodError, toReportPeriod } from './report-period';

const INDICATORS_TAB = 'indicators';
const QUERY_TAB = 'query';

/**
 * Tela 9: the panel of the manager and of the administrator. The period sits above the tabs
 * because it applies to both of them, and it travels in the address so a reload or a shared
 * link lands on the same numbers (BR7.2). The Consulta tab is mounted only for the manager;
 * the real protection is the role marker of the routes (BR1.1, BR7.5).
 */
export function ReportsPage() {
  const { user } = useSession();
  const defaults = useMemo(() => ({ tab: INDICATORS_TAB, ...defaultPeriodDays() }), []);
  const { values, update } = useListParams(defaults);

  const isManager = user?.role === 'MANAGER';
  const days = { from: values.from, to: values.to };
  const error = periodError(days);
  // The query keys are compared by value, so rebuilding the window on every render costs
  // nothing and keeps the cached answers of the current period.
  const period = error ? null : toReportPeriod(days);
  const activeTab = isManager && values.tab === QUERY_TAB ? QUERY_TAB : INDICATORS_TAB;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <h1 className="text-2xl font-semibold">Painel</h1>

      <PeriodSelector days={days} error={error} onChange={update} />

      <Tabs value={activeTab} onValueChange={(value) => update({ tab: value })} className="min-w-0">
        <div className="max-w-full overflow-x-auto">
          <TabsList aria-label="Seções do painel">
            <TabsTrigger value={INDICATORS_TAB} data-testid="reports-indicators-tab">
              Indicadores
            </TabsTrigger>
            {isManager && (
              <TabsTrigger value={QUERY_TAB} data-testid="reports-query-tab">
                Consulta
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value={INDICATORS_TAB} className="min-w-0 pt-2">
          {period && user && <IndicatorsTab period={period} role={user.role} />}
        </TabsContent>
        {isManager && (
          <TabsContent value={QUERY_TAB} className="min-w-0 pt-2">
            {period && <QueryTab period={period} />}
          </TabsContent>
        )}
      </Tabs>
    </section>
  );
}
