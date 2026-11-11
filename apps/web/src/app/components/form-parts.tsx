import type { ComponentProps, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Error below a field, referenced by the field's aria-describedby (BR6.3, BR7.1). */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export interface FieldA11yProps {
  id: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: (a11y: FieldA11yProps) => ReactNode;
}

/** Visible label associated with the control, hint and error linked for screen readers (AC5.3.3). */
export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
      })}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

/** Error above the form buttons for failures that do not belong to one field (BR7.4). */
export function FormAlert({ message, testId }: { message?: string | null; testId: string }) {
  if (!message) {
    return null;
  }
  return (
    <Alert variant="destructive" data-testid={testId}>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

/** Native select styled like the theme inputs: keyboard and screen-reader friendly by default. */
export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  );
}

/** Horizontal scrolling stays inside the table container on narrow screens (BR7.2). */
export function DataTableContainer({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="max-w-full rounded-md border outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {children}
    </div>
  );
}

/** Situation always written as text, never color only (AC5.3.4). */
export function ActiveText({ active }: { active: boolean }) {
  return <span>{active ? 'Ativo' : 'Inativo'}</span>;
}
