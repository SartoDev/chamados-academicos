import { useState } from 'react';
import { ApiError } from '@/app/api/api-client';
import { FormAlert, FormField } from '@/app/components/form-parts';
import { messageForError, messageForFieldCode } from '@/app/i18n/error-code-messages';
import { Button } from '@/components/ui/button';
import { ConfirmRatingDialog, RATING_IS_FINAL_WARNING } from './ConfirmRatingDialog';
import { ScoreChoice } from './ScoreChoice';
import { useRateTicket } from './rating-api';
import { RATING_COMMENT_MAX_LENGTH } from './rating-labels';

const SCORE_REQUIRED_MESSAGE = 'Escolha uma nota para enviar a avaliação.';

interface RatingFormProps {
  ticketId: string;
}

/**
 * Tela 5, inside the Detalhes tab: the five options with their labels, an optional comment with
 * a counter, and a confirmation that says the rating is final before it is sent (BR5.3).
 *
 * A failed send never clears what was typed: a 400 places the message below the field it names,
 * a 409 says the ticket changed underneath the screen and the block reloads itself, and a
 * network failure offers to try again with the score and the comment still in place (CT8).
 */
export function RatingForm({ ticketId }: RatingFormProps) {
  const rateTicket = useRateTicket(ticketId);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const trimmedComment = comment.trim();
  const commentTooLong = trimmedComment.length > RATING_COMMENT_MAX_LENGTH;
  const submitting = rateTicket.isPending;

  function validateComment(): boolean {
    const message = commentTooLong
      ? `O comentário deve ter no máximo ${RATING_COMMENT_MAX_LENGTH} caracteres.`
      : null;
    setCommentError(message);
    return message === null;
  }

  function openConfirmation(): void {
    setFormError(null);
    if (score === null) {
      setScoreError(SCORE_REQUIRED_MESSAGE);
      return;
    }
    setScoreError(null);
    if (!validateComment()) {
      return;
    }
    setConfirming(true);
  }

  async function send(): Promise<void> {
    setConfirming(false);
    if (score === null) {
      return;
    }
    setFormError(null);
    try {
      await rateTicket.mutateAsync({
        score,
        ...(trimmedComment.length > 0 ? { comment: trimmedComment } : {}),
      });
      // The block re-reads the rating and shows it in place of this form (WF1 step 8).
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION_FAILED') {
        let placedAll = error.fieldErrors.length > 0;
        for (const detail of error.fieldErrors) {
          const message = messageForFieldCode(detail.code);
          if (detail.field === 'score') {
            setScoreError(message);
          } else if (detail.field === 'comment') {
            setCommentError(message);
          } else {
            placedAll = false;
          }
        }
        setFormError(placedAll ? null : messageForError(error));
        return;
      }
      // Everything else — the two conflicts, a network failure or a 5xx — is written above the
      // buttons, and the typed text stays exactly where it is (CT8, BR5.3).
      setFormError(messageForError(error));
    }
  }

  return (
    <section
      aria-labelledby="rating-form-title"
      className="flex min-w-0 flex-col gap-3 rounded-md border p-4"
      data-testid="rating-form"
    >
      <h3 id="rating-form-title" className="text-lg font-semibold">
        Avalie o atendimento
      </h3>
      <p className="text-sm text-muted-foreground" data-testid="rating-form-final-warning">
        {RATING_IS_FINAL_WARNING}
      </p>

      <ScoreChoice
        value={score}
        onChange={(chosen) => {
          setScore(chosen);
          setScoreError(null);
        }}
        disabled={submitting}
        describedBy={scoreError ? 'rating-form-score-error' : undefined}
        invalid={scoreError !== null}
      />
      {scoreError && (
        <p
          id="rating-form-score-error"
          className="text-sm text-destructive"
          data-testid="rating-form-score-error"
        >
          {scoreError}
        </p>
      )}

      <FormField
        id="rating-form-comment"
        label="Comentário (opcional)"
        error={commentError ?? undefined}
        hint={`${trimmedComment.length}/${RATING_COMMENT_MAX_LENGTH} caracteres`}
      >
        {(a11y) => (
          <textarea
            {...a11y}
            rows={4}
            value={comment}
            disabled={submitting}
            onChange={(event) => setComment(event.target.value)}
            onBlur={validateComment}
            className="w-full min-w-0 rounded-lg border border-input bg-transparent p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive"
            data-testid="rating-form-comment-input"
          />
        )}
      </FormField>

      <FormAlert message={formError} testId="rating-form-error-alert" />

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={openConfirmation}
          disabled={submitting}
          data-testid="rating-form-submit-button"
        >
          {submitting ? 'Enviando...' : 'Enviar avaliação'}
        </Button>
      </div>

      {score !== null && (
        <ConfirmRatingDialog
          open={confirming}
          score={score}
          onConfirm={() => void send()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </section>
  );
}
