const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

/** Distinct, well-formed identifiers; anything else cannot match a row and is dropped. */
export function uniqueUuids(ids: readonly string[] | undefined): string[] {
  return [...new Set((ids ?? []).filter(isUuid))];
}
