import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/api-client';
import { ActiveText, DataTableContainer, FormAlert, FormField, NativeSelect } from './form-parts';
import { PaginationControls } from './PaginationControls';
import { applyServerError } from './server-errors';

describe('FormField (AC5.3.3, BR6.3)', () => {
  it('associates the visible label, the hint and the error with the control', () => {
    render(
      <FormField id="sector-name" label="Nome" hint="Até 80 caracteres." error="Informe o nome.">
        {(a11y) => <input {...a11y} />}
      </FormField>,
    );

    const input = screen.getByLabelText('Nome');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Até 80 caracteres. Informe o nome.');
  });

  it('leaves the control valid and undescribed without hint or error', () => {
    render(
      <FormField id="plain" label="Rótulo">
        {(a11y) => <input {...a11y} />}
      </FormField>,
    );

    const input = screen.getByLabelText('Rótulo');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });
});

describe('small shared parts', () => {
  it('shows a form alert only when there is a message', () => {
    const { rerender } = render(<FormAlert message={null} testId="form-alert" />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(<FormAlert message="Já existe um item com este nome." testId="form-alert" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Já existe um item com este nome.');
  });

  it('writes the situation as text and labels the scrollable table region (AC5.3.4, BR7.2)', () => {
    render(
      <DataTableContainer label="Tabela de setores">
        <ActiveText active />
        <ActiveText active={false} />
        <NativeSelect aria-label="Situação">
          <option>Todas</option>
        </NativeSelect>
      </DataTableContainer>,
    );

    expect(screen.getByRole('region', { name: 'Tabela de setores' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Situação' })).toBeInTheDocument();
  });
});

describe('PaginationControls', () => {
  it('shows the range and total and moves between pages', async () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        page={2}
        pageSize={20}
        total={45}
        onPageChange={onPageChange}
        testIdPrefix="users"
      />,
    );

    expect(screen.getByText('Mostrando 21–40 de 45')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    expect(onPageChange.mock.calls).toEqual([[1], [3]]);
  });

  it('disables moving beyond the first and last page, and hides itself for an empty list', () => {
    const { rerender } = render(
      <PaginationControls
        page={1}
        pageSize={20}
        total={5}
        onPageChange={vi.fn()}
        testIdPrefix="users"
      />,
    );
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();

    rerender(
      <PaginationControls
        page={1}
        pageSize={20}
        total={0}
        onPageChange={vi.fn()}
        testIdPrefix="users"
      />,
    );
    expect(screen.queryByRole('button', { name: 'Próxima' })).not.toBeInTheDocument();
  });
});

describe('applyServerError (BR6.3)', () => {
  function Harness({
    error,
    onResult,
  }: {
    error: unknown;
    onResult: (message: string | null) => void;
  }) {
    const { setError, formState } = useForm<{ name: string; email: string }>();
    return (
      <>
        <button
          type="button"
          onClick={() => onResult(applyServerError(error, setError, ['name', 'email']))}
        >
          aplicar
        </button>
        <output data-testid="name-error">{formState.errors.name?.message}</output>
      </>
    );
  }

  it('places every field error next to its field and needs no form alert', async () => {
    const onResult = vi.fn();
    const error = new ApiError(
      400,
      'VALIDATION_FAILED',
      [{ field: 'name', code: 'REQUIRED' }],
      't',
    );
    render(<Harness error={error} onResult={onResult} />);

    await userEvent.click(screen.getByRole('button', { name: 'aplicar' }));

    expect(onResult).toHaveBeenCalledWith(null);
    expect(screen.getByTestId('name-error')).toHaveTextContent('Campo obrigatório.');
  });

  it('falls back to the translated message for unplaced or non-field errors', async () => {
    const onResult = vi.fn();
    const unplaced = new ApiError(
      400,
      'VALIDATION_FAILED',
      [{ field: 'role', code: 'INVALID_VALUE' }],
      't',
    );
    const { rerender } = render(<Harness error={unplaced} onResult={onResult} />);
    await userEvent.click(screen.getByRole('button', { name: 'aplicar' }));

    rerender(
      <Harness
        error={new ApiError(409, 'CATALOG_NAME_TAKEN', undefined, 't')}
        onResult={onResult}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'aplicar' }));

    expect(onResult.mock.calls).toEqual([
      ['Alguns campos estão inválidos. Revise e tente novamente.'],
      ['Já existe um item com este nome.'],
    ]);
  });
});
