import { Injectable } from '@nestjs/common';
import type { Actor } from '../auth/actor.js';
import { CatalogPublicService } from '../catalog/catalog-public.service.js';
import { Clock } from '../common/clock.js';
import type { Page, PageRequest } from '../common/pagination.js';
import { uniqueUuids } from '../common/uuid.js';
import { RatingService } from '../tickets/rating.service.js';
import { TicketsPublicService } from '../tickets/tickets-public.service.js';
import type { TicketCountGroupBy, TicketListRow } from '../tickets/tickets.types.js';
import { UsersPublicService } from '../users/users-public.service.js';
import type {
  DurationAveragesView,
  RatingSummaryView,
  ReportRefView,
  ReportTicketFilter,
  ReportTicketRowView,
  TicketCountGroupView,
  TicketCountsView,
} from './reporting.types.js';
import { resolveReportPeriod, type ReportPeriodInput } from './rules/report-period.js';

/** Shown when a referenced row has disappeared, which the foreign keys make impossible. */
const UNKNOWN_LABEL = '—';

type LabelIndex = Map<string, string>;

function indexOf(items: readonly { id: string; name: string }[]): LabelIndex {
  return new Map(items.map((item) => [item.id, item.name]));
}

function refView(id: string, labels: LabelIndex): ReportRefView {
  return { id, name: labels.get(id) ?? UNKNOWN_LABEL };
}

/**
 * Reporting service of U4 (WF1 to WF3). Read-only and without a single query of its own: the
 * counts, the averages and the listing come from the public service of U2, which applies the
 * visibility of the actor inside the query (BR1.2, BR6.1), and the labels and the people come
 * from the public services of U1 (BR3.3). What belongs to this unit is the period, the
 * resolution of names from the identifiers U2 returns and the assembly of the API-U4 answers.
 */
@Injectable()
export class ReportingService {
  constructor(
    private readonly tickets: TicketsPublicService,
    private readonly ratings: RatingService,
    private readonly catalog: CatalogPublicService,
    private readonly users: UsersPublicService,
    private readonly clock: Clock,
  ) {}

  /**
   * WF1, BR3.1 to BR3.3: how many visible tickets each group holds in the period, which cuts by
   * the opening of the ticket. Groups without a ticket in the period never come back, so it is
   * the screen that fills the missing statuses with zero from the catalog of U1 (BR7.1).
   */
  async getTicketCounts(
    actor: Actor,
    groupBy: TicketCountGroupBy,
    periodInput: ReportPeriodInput,
  ): Promise<TicketCountsView> {
    const period = resolveReportPeriod(periodInput, this.clock.now());
    const counts = await this.tickets.countTickets(
      actor,
      { openedFrom: period.from, openedTo: period.to },
      groupBy,
    );
    const labels = await this.labelsForGroups(
      groupBy,
      counts.map((group) => group.groupId),
    );
    const groups: TicketCountGroupView[] = counts.map((group) => ({
      id: group.groupId,
      label: labels.get(group.groupId) ?? UNKNOWN_LABEL,
      count: group.count,
    }));
    // Largest bar first, ties broken by label, so two identical requests answer the same order.
    groups.sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
    return {
      groups,
      // BR3.2: each visible ticket of the window falls in exactly one group.
      total: groups.reduce((sum, group) => sum + group.count, 0),
      from: period.from,
      to: period.to,
    };
  }

  /**
   * WF1, BR4.1 to BR4.4: the two average durations of the period, which here cuts by the closing
   * of the ticket and not by its opening. Each average carries its own sample, and no goal or
   * threshold ever travels with them.
   */
  async getDurationAverages(
    actor: Actor,
    periodInput: ReportPeriodInput,
  ): Promise<DurationAveragesView> {
    const period = resolveReportPeriod(periodInput, this.clock.now());
    const averages = await this.tickets.getDurationAverages(actor, {
      closedFrom: period.from,
      closedTo: period.to,
    });
    return { ...averages, from: period.from, to: period.to };
  }

  /**
   * BR3.1 to BR3.3 of U5: the average and the count of the ratings of the period, which here
   * cuts by the closing of the ticket, exactly like the duration averages above. The rating
   * table belongs to U5 and lives in the Tickets module, which applies the visibility of the
   * actor inside the query; this unit owns the period and the shape of the answer, and never
   * reads a table of another unit (BR6.1, DB-01).
   */
  async getRatingSummary(actor: Actor, periodInput: ReportPeriodInput): Promise<RatingSummaryView> {
    const period = resolveReportPeriod(periodInput, this.clock.now());
    const summary = await this.ratings.summarize(actor, {
      closedFrom: period.from,
      closedTo: period.to,
    });
    return { ...summary, from: period.from, to: period.to };
  }

  /**
   * WF3, BR5.1: the filtered, paginated listing of the manager, cut by the opening of the
   * ticket. U2 answers identifiers; resolving them into names and people is the work of this
   * unit, which never reads a table of another one (review finding R-02).
   */
  async searchTickets(
    actor: Actor,
    filter: ReportTicketFilter,
    periodInput: ReportPeriodInput,
    page: PageRequest,
  ): Promise<Page<ReportTicketRowView>> {
    const period = resolveReportPeriod(periodInput, this.clock.now());
    const result = await this.tickets.searchTickets(
      actor,
      { ...filter, openedFrom: period.from, openedTo: period.to },
      page,
    );
    const rows = result.items;
    const [labels, assignees] = await Promise.all([
      this.catalog.findLabels({
        categoryIds: rows.map((row) => row.categoryId),
        sectorIds: rows.map((row) => row.sectorId),
        statusIds: rows.map((row) => row.statusId),
        priorityIds: rows.map((row) => row.priorityId),
      }),
      this.assigneeNames(rows),
    ]);
    const index: ReportRowLabels = {
      categories: indexOf(labels.categories),
      sectors: indexOf(labels.sectors),
      statuses: indexOf(labels.statuses),
      priorities: indexOf(labels.priorities),
      assignees,
    };
    return { ...result, items: rows.map((row) => toReportRow(row, index)) };
  }

  /** BR3.3: names come from the catalog of U1 and include items that were deactivated. */
  private async labelsForGroups(
    groupBy: TicketCountGroupBy,
    groupIds: readonly string[],
  ): Promise<LabelIndex> {
    const ids = uniqueUuids(groupIds);
    if (ids.length === 0) {
      return new Map();
    }
    switch (groupBy) {
      case 'status':
        return indexOf((await this.catalog.findLabels({ statusIds: ids })).statuses);
      case 'category':
        return indexOf((await this.catalog.findLabels({ categoryIds: ids })).categories);
      case 'sector':
        return indexOf((await this.catalog.findLabels({ sectorIds: ids })).sectors);
    }
  }

  /** BR3.3: a person who was deactivated keeps their name on the rows they answer for. */
  private async assigneeNames(rows: readonly TicketListRow[]): Promise<LabelIndex> {
    const ids = uniqueUuids(rows.map((row) => row.assigneeId).filter((id) => id !== null));
    if (ids.length === 0) {
      return new Map();
    }
    return indexOf(await this.users.findSummariesByIds(ids));
  }
}

/** The four catalog indexes and the people index, built once per page instead of per row. */
interface ReportRowLabels {
  categories: LabelIndex;
  sectors: LabelIndex;
  statuses: LabelIndex;
  priorities: LabelIndex;
  assignees: LabelIndex;
}

function toReportRow(row: TicketListRow, labels: ReportRowLabels): ReportTicketRowView {
  return {
    id: row.id,
    reference: row.reference,
    title: row.title,
    category: refView(row.categoryId, labels.categories),
    sector: refView(row.sectorId, labels.sectors),
    status: refView(row.statusId, labels.statuses),
    priority: refView(row.priorityId, labels.priorities),
    assignee: row.assigneeId ? refView(row.assigneeId, labels.assignees) : null,
    openedAt: row.openedAt,
    updatedAt: row.updatedAt,
  };
}
