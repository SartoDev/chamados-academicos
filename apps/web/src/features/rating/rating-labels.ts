/**
 * The five values of the scale, each with the fixed Portuguese label the screen writes next to
 * the number (BR2.1, Q1). The information never travels by star or by colour alone, so the label
 * is part of the data, not of the styling (BR5.2, BR5.5).
 */
export const RATING_MIN_SCORE = 1;
export const RATING_MAX_SCORE = 5;

/** Client-side mirror of BR2.2; the server stays the authority. */
export const RATING_COMMENT_MAX_LENGTH = 500;

export interface RatingScoreOption {
  score: number;
  label: string;
}

export const RATING_SCORE_OPTIONS: readonly RatingScoreOption[] = [
  { score: 1, label: 'Muito ruim' },
  { score: 2, label: 'Ruim' },
  { score: 3, label: 'Regular' },
  { score: 4, label: 'Bom' },
  { score: 5, label: 'Muito bom' },
];

/** The label of a score, or an empty string when the value is outside the scale. */
export function labelForScore(score: number): string {
  return RATING_SCORE_OPTIONS.find((option) => option.score === score)?.label ?? '';
}

/** `4 — Bom`, the form every screen of U5 writes a stored score in (BR5.2). */
export function formatScore(score: number): string {
  const label = labelForScore(score);
  return label ? `${score} — ${label}` : String(score);
}

/**
 * The panel average, with one decimal place (BR3.1). An empty average is a dash, never a zero
 * read as if it were a score (BR3.2).
 */
export function formatAverageScore(average: number | null, count: number): string {
  return average === null || count === 0 ? '—' : average.toFixed(1).replace('.', ',');
}

/** How many ratings the average came out of, written out next to it (BR3.1). */
export function formatRatingSample(count: number): string {
  return count === 1 ? 'Base: 1 avaliação' : `Base: ${count} avaliações`;
}
