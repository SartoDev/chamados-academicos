import { useState } from 'react';
import { messageForError } from '@/app/i18n/error-code-messages';

/**
 * Deactivation asks for confirmation first; reactivation does not (no effect on records).
 * A refusal (e.g. 422 for the default priority or the last administrator) is shown on the
 * affected row, and the table is not reloaded.
 */
export function useActiveToggle<T extends { id: string }>(
  setActive: (item: T, active: boolean) => Promise<unknown>,
) {
  const [pendingDeactivation, setPendingDeactivation] = useState<T | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const run = async (item: T, active: boolean) => {
    setBusyId(item.id);
    setRowErrors((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    try {
      await setActive(item, active);
    } catch (error) {
      setRowErrors((current) => ({ ...current, [item.id]: messageForError(error) }));
    } finally {
      setBusyId(null);
    }
  };

  return {
    pendingDeactivation,
    rowErrors,
    busyId,
    requestDeactivation: (item: T) => setPendingDeactivation(item),
    cancelDeactivation: () => setPendingDeactivation(null),
    confirmDeactivation: async () => {
      const item = pendingDeactivation;
      setPendingDeactivation(null);
      if (item) {
        await run(item, false);
      }
    },
    reactivate: (item: T) => run(item, true),
  };
}
