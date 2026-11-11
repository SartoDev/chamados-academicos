import { RATING_SCORE_OPTIONS } from './rating-labels';

interface ScoreChoiceProps {
  /** The chosen score, or `null` while nothing was chosen yet (BR2.1). */
  value: number | null;
  onChange: (score: number) => void;
  disabled?: boolean;
  /** Identifier of the error shown below the group, linked for screen readers. */
  describedBy?: string;
  invalid?: boolean;
}

/**
 * The five values of the scale as exclusive radio buttons, each with its label written out
 * beside it. They are radio buttons and not stars on purpose: a star alone carries nothing to
 * somebody using a screen reader, and the colour of the theme is never the only carrier of the
 * information (BR2.1, BR5.3, BR5.5, AC5.3.4).
 */
export function ScoreChoice({
  value,
  onChange,
  disabled = false,
  describedBy,
  invalid = false,
}: ScoreChoiceProps) {
  return (
    <fieldset
      className="flex min-w-0 flex-col gap-2"
      aria-describedby={describedBy}
      aria-invalid={invalid ? true : undefined}
      data-testid="rating-score-choice"
    >
      <legend className="text-sm font-medium">Sua nota para o atendimento</legend>
      <div className="flex flex-col gap-1.5">
        {RATING_SCORE_OPTIONS.map((option) => (
          <label
            key={option.score}
            htmlFor={`rating-score-${option.score}`}
            className="flex min-w-0 cursor-pointer items-center gap-2 rounded-md border p-2 text-sm has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
          >
            <input
              type="radio"
              id={`rating-score-${option.score}`}
              name="rating-score"
              value={option.score}
              checked={value === option.score}
              disabled={disabled}
              onChange={() => onChange(option.score)}
              className="size-4 accent-primary outline-none"
              data-testid={`rating-score-option-${option.score}`}
            />
            <span>
              {option.score} — {option.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
