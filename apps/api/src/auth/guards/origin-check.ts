const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function isStateChangingMethod(method: string): boolean {
  return STATE_CHANGING_METHODS.has(method.toUpperCase());
}

/**
 * BR2.6: a state-changing request whose Origin header is present and differs from the
 * system origin is refused. Requests without the header (same-origin tools) are not.
 */
export function isCrossOriginStateChange(
  method: string,
  originHeader: string | undefined,
  appOrigin: string,
): boolean {
  if (!isStateChangingMethod(method)) {
    return false;
  }
  if (originHeader === undefined || originHeader === '') {
    return false;
  }
  return originHeader !== appOrigin;
}
