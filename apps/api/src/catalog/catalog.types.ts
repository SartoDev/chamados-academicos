/** SVC-01 contract types exported by Catalog. `name` carries the label of statuses and priorities. */
export const STATUS_KEYS = ['OPEN', 'IN_ANALYSIS', 'WAITING_REQUESTER', 'CLOSED'] as const;

export type StatusKeyValue = (typeof STATUS_KEYS)[number];

export interface CatalogItemRef {
  id: string;
  name: string;
  active: boolean;
}

export interface CategoryRef extends CatalogItemRef {
  sectorId: string;
}

/**
 * Divergence recorded in Functional Design (Q3): statuses are never deactivated, so StatusRef
 * no longer inherits `active` from CatalogItemRef.
 */
export interface StatusRef {
  id: string;
  key: StatusKeyValue;
  name: string;
}

/** Review finding R-04 (BR8.8): status labels in findLabels carry no `active` field. */
export interface StatusLabelRef {
  id: string;
  name: string;
}

export interface CatalogLabels {
  categories: CatalogItemRef[];
  sectors: CatalogItemRef[];
  statuses: StatusLabelRef[];
  priorities: CatalogItemRef[];
}

export interface FindLabelsInput {
  categoryIds?: string[];
  sectorIds?: string[];
  statusIds?: string[];
  priorityIds?: string[];
}

/** API-U1 response shapes. */
export interface SectorView {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryView {
  id: string;
  name: string;
  sector: { id: string; name: string };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StatusView {
  id: string;
  key: StatusKeyValue;
  label: string;
}

export interface PriorityView {
  id: string;
  label: string;
  isDefault: boolean;
  active: boolean;
}
