import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  CATALOG_DEACTIVATION_EFFECT,
  ConfirmDeactivateDialog,
  USER_DEACTIVATION_EFFECT,
} from './ConfirmDeactivateDialog';

function setup(open = true, effect = CATALOG_DEACTIVATION_EFFECT) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const user = userEvent.setup();
  render(
    <ConfirmDeactivateDialog
      open={open}
      itemName="o setor Secretaria"
      effect={effect}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  );
  return { onConfirm, onCancel, user };
}

describe('ConfirmDeactivateDialog (BR4.8, AC4.2.6)', () => {
  it('explains the effect on existing records before deactivating', () => {
    setup();

    const dialog = screen.getByRole('alertdialog', { name: 'Desativar o setor Secretaria?' });
    expect(dialog).toHaveAccessibleDescription(CATALOG_DEACTIVATION_EFFECT);
    expect(CATALOG_DEACTIVATION_EFFECT).toMatch(/novos chamados/);
    expect(CATALOG_DEACTIVATION_EFFECT).toMatch(/chamados existentes/);
  });

  it('describes what happens to a deactivated user', () => {
    setup(true, USER_DEACTIVATION_EFFECT);

    expect(screen.getByRole('alertdialog')).toHaveTextContent('não conseguirá mais entrar');
  });

  it('confirms with the Desativar action', async () => {
    const { onConfirm, user } = setup();

    await user.click(screen.getByRole('button', { name: 'Desativar' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('cancels with the Cancelar action', async () => {
    const { onCancel, onConfirm, user } = setup();

    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels with Escape', async () => {
    const { onCancel, user } = setup();

    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('keeps the keyboard focus inside the dialog', async () => {
    const { user } = setup();
    const dialog = screen.getByRole('alertdialog');

    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await user.tab();
    await user.tab();
    await user.tab();

    expect(within(dialog).getAllByRole('button')).toContain(document.activeElement);
  });

  it('renders nothing while closed', () => {
    setup(false);

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
