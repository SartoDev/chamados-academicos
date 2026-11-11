import type {
  CategoryView,
  PriorityView,
  SectorView,
  StatusKeyValue,
  StatusView,
} from './catalog.types.js';

interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export function toSectorView(
  sector: { id: string; name: string; active: boolean } & Timestamps,
): SectorView {
  return {
    id: sector.id,
    name: sector.name,
    active: sector.active,
    createdAt: sector.createdAt.toISOString(),
    updatedAt: sector.updatedAt.toISOString(),
  };
}

export const CATEGORY_WITH_SECTOR = { sector: { select: { id: true, name: true } } } as const;

export function toCategoryView(
  category: {
    id: string;
    name: string;
    active: boolean;
    sector: { id: string; name: string };
  } & Timestamps,
): CategoryView {
  return {
    id: category.id,
    name: category.name,
    sector: { id: category.sector.id, name: category.sector.name },
    active: category.active,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function toStatusView(status: {
  id: string;
  key: StatusKeyValue;
  label: string;
}): StatusView {
  return { id: status.id, key: status.key, label: status.label };
}

export function toPriorityView(priority: {
  id: string;
  label: string;
  isDefault: boolean;
  active: boolean;
}): PriorityView {
  return {
    id: priority.id,
    label: priority.label,
    isDefault: priority.isDefault,
    active: priority.active,
  };
}
