import type { Role } from '@/app/api/types';
import { ListState } from '@/app/components/ListState';
import type { ListStatus } from '@/app/components/list-status';
import { messageForError } from '@/app/i18n/error-code-messages';
import { RatingCard } from '@/features/rating/RatingCard';
import { useRatingSummary } from '@/features/rating/rating-api';
import { useStatusOptions } from '@/features/tickets/tickets-api';
import { BarChartWithTable } from './BarChartWithTable';
import { CountCard } from './CountCard';
import { DurationCard } from './DurationCard';
import { EMPTY_PERIOD_MESSAGE, fillStatusCounts } from './indicators';
import { useDurationAverages, useTicketCounts, type ReportPeriod } from './reports-api';

interface IndicatorsTabProps {
  period: ReportPeriod;
  role: Role;
}

/**
 * Tela 9: the cards and the two bar charts of the period. One loading state for the whole tab
 * and one error state for it as well, because the four queries answer one picture (BR7.3). The
 * chart by sector is mounted only for the administrator, since for a manager it would be a
 * single bar (Q4).
 */
export function IndicatorsTab({ period, role }: IndicatorsTabProps) {
  const isAdmin = role === 'ADMIN';
  const statuses = useStatusOptions();
  const byStatus = useTicketCounts('status', period);
  const byCategory = useTicketCounts('category', period);
  const bySector = useTicketCounts('sector', period, isAdmin);
  const durations = useDurationAverages(period);
  // U5 adds one more number to the panel, in the same period and with the same visibility.
  const ratings = useRatingSummary(period);

  const queries = [
    statuses,
    byStatus,
    byCategory,
    durations,
    ratings,
    ...(isAdmin ? [bySector] : []),
  ];
  const error = queries.find((query) => query.isError)?.error;
  const hasNothing = byStatus.data?.total === 0 && durations.data?.resolutionSampleSize === 0;
  const status: ListStatus = queries.some((query) => query.isPending)
    ? 'loading'
    : error
      ? 'error'
      : hasNothing
        ? 'empty'
        : 'ready';

  return (
    <ListState
      status={status}
      emptyMessage={EMPTY_PERIOD_MESSAGE}
      errorMessage={`Não foi possível carregar os indicadores. ${messageForError(error)}`}
      onRetry={() => {
        for (const query of queries) {
          void query.refetch();
        }
      }}
      skeletonRows={6}
    >
      <div className="flex min-w-0 flex-col gap-6" data-testid="indicators-tab">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {fillStatusCounts(statuses.data?.items ?? [], byStatus.data).map((group) => (
            <CountCard
              key={group.id}
              label={group.label}
              count={group.count}
              testId={`indicators-count-${group.id}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DurationCard
            label="Tempo médio de resolução"
            seconds={durations.data?.averageResolutionSeconds ?? null}
            sampleSize={durations.data?.resolutionSampleSize ?? 0}
            description="Da abertura até o encerramento mais recente, sobre os chamados encerrados no período."
            testId="indicators-resolution-card"
          />
          <DurationCard
            label="Tempo médio de atendimento"
            seconds={durations.data?.averageHandlingSeconds ?? null}
            sampleSize={durations.data?.handlingSampleSize ?? 0}
            description="Da abertura até o primeiro responsável, apenas sobre os que chegaram a ter um."
            testId="indicators-handling-card"
          />
          <RatingCard
            averageScore={ratings.data?.averageScore ?? null}
            count={ratings.data?.count ?? 0}
            testId="indicators-rating-card"
          />
        </div>

        <p className="text-xs text-muted-foreground" data-testid="indicators-period-note">
          As quantidades contam os chamados abertos no período; os tempos médios e a avaliação média
          consideram os chamados encerrados no período.
        </p>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <BarChartWithTable
            title="Chamados por categoria"
            groups={byCategory.data?.groups ?? []}
            emptyMessage={EMPTY_PERIOD_MESSAGE}
            testId="indicators-category-chart"
          />
          {isAdmin && (
            <BarChartWithTable
              title="Chamados por setor"
              groups={bySector.data?.groups ?? []}
              emptyMessage={EMPTY_PERIOD_MESSAGE}
              testId="indicators-sector-chart"
            />
          )}
        </div>
      </div>
    </ListState>
  );
}
