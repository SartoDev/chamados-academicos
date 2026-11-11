import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ApiError } from '@/app/api/api-client';
import { FormAlert, FormField } from '@/app/components/form-parts';
import { applyServerError } from '@/app/components/server-errors';
import { messageForError } from '@/app/i18n/error-code-messages';
import { Button } from '@/components/ui/button';
import { MESSAGE_BODY_MAX_LENGTH } from './conversation-rules';
import { useSendMessage } from './conversation-api';
import { messageSchema, type MessageValues } from './message-schema';

const FIELDS = ['body'] as const;

interface MessageComposerProps {
  ticketId: string;
  /** BR2.2: a closed ticket keeps the field on screen, disabled, with the reason written out. */
  closed: boolean;
}

/**
 * Tela 5: the field with a visible label and a counter. A send that fails keeps the typed text
 * and offers to try again; a 409 disables the field, because the ticket was closed underneath
 * the screen (BR2.1, BR5.2, BR5.3, BR5.7).
 */
export function MessageComposer({ ticketId, closed }: MessageComposerProps) {
  const sendMessage = useSendMessage(ticketId);
  const [formError, setFormError] = useState<string | null>(null);
  const [unsent, setUnsent] = useState<string | null>(null);
  const [closedByServer, setClosedByServer] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<MessageValues>({
    resolver: zodResolver(messageSchema),
    mode: 'onBlur',
    defaultValues: { body: '' },
  });

  const body = useWatch({ control, name: 'body' }) ?? '';
  const disabled = closed || closedByServer;
  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setUnsent(null);
    try {
      await sendMessage.mutateAsync(values.body.trim());
      reset({ body: '' });
      setFocus('body');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'MESSAGE_TICKET_CLOSED') {
        setClosedByServer(true);
        setFormError(messageForError(error));
        return;
      }
      setFormError(applyServerError(error, setError, FIELDS));
      // Network failure or 5xx: the message was never stored, so it is offered again (BR5.3).
      if (!(error instanceof ApiError) || error.status >= 500) {
        setUnsent(values.body);
      }
    }
  });

  return (
    <form
      noValidate
      className="flex min-w-0 flex-col gap-3"
      onSubmit={onSubmit}
      data-testid="message-composer"
    >
      {unsent && (
        <div
          className="flex flex-col items-start gap-2 rounded-md border border-destructive p-3 text-sm"
          data-testid="message-composer-unsent-bubble"
        >
          <p className="text-xs font-medium text-destructive">Não enviado</p>
          <p className="break-words whitespace-pre-wrap">{unsent}</p>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={isSubmitting || disabled}
            data-testid="message-composer-retry-button"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      <FormField
        id="message-composer-body"
        label="Nova mensagem"
        error={errors.body?.message}
        hint={
          disabled
            ? 'Este chamado está encerrado.'
            : `${body.length}/${MESSAGE_BODY_MAX_LENGTH} caracteres`
        }
      >
        {(a11y) => (
          <textarea
            {...a11y}
            rows={4}
            disabled={disabled}
            readOnly={isSubmitting}
            className="w-full min-w-0 rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive"
            data-testid="message-composer-body-input"
            {...register('body')}
          />
        )}
      </FormField>

      <FormAlert message={formError} testId="message-composer-error-alert" />

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting || disabled}
          data-testid="message-composer-submit-button"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar'}
        </Button>
      </div>
    </form>
  );
}
