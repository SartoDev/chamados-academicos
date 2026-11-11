/**
 * The content of a rating: its score scale and its comment (BR2.1, BR2.2). Pure module, with no
 * dependency on Nest and none on Prisma, so both rules are decided in memory and are the same
 * whether the call arrived through the API or through the service.
 */
export const RATING_MIN_SCORE = 1;
export const RATING_MAX_SCORE = 5;

export const RATING_COMMENT_MIN_LENGTH = 1;
export const RATING_COMMENT_MAX_LENGTH = 500;

/**
 * BR2.1: every value of the scale carries a fixed label. The key is the stable contract, in
 * English like every other enum value of the system; the Portuguese text shown next to the
 * score lives in the web app (team.md, CT11).
 */
export const RATING_SCORE_LABEL_KEYS = ['VERY_BAD', 'BAD', 'FAIR', 'GOOD', 'VERY_GOOD'] as const;

export type RatingScoreLabelKey = (typeof RATING_SCORE_LABEL_KEYS)[number];

/** The five scores of the scale, from the lowest to the highest. */
export const RATING_SCORES: readonly number[] = [1, 2, 3, 4, 5];

/** BR2.1: an integer inside the closed interval of the scale, and nothing else. */
export function isValidScore(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= RATING_MIN_SCORE &&
    value <= RATING_MAX_SCORE
  );
}

/** BR2.1: the fixed label key of a score, or `null` for a value outside the scale. */
export function labelKeyForScore(score: number): RatingScoreLabelKey | null {
  return isValidScore(score) ? (RATING_SCORE_LABEL_KEYS[score - RATING_MIN_SCORE] ?? null) : null;
}

export type CommentRefusal = 'TOO_LONG';

export interface NormalizedComment {
  /** The comment as it is stored: trimmed, or absent when nothing was left after trimming. */
  value: string | null;
  /** Why the comment was refused, or `null` when it is acceptable. */
  refusal: CommentRefusal | null;
}

/**
 * BR2.2: the comment is optional. Surrounding blank space is removed before the length is
 * measured, a comment that is empty after that is stored as absent, and anything longer than
 * the limit is refused naming the field. Line breaks inside the text are preserved and no
 * markup is interpreted — the text travels exactly as it was typed.
 */
export function normalizeComment(comment: string | null | undefined): NormalizedComment {
  if (comment === null || comment === undefined) {
    return { value: null, refusal: null };
  }
  const trimmed = comment.trim();
  if (trimmed.length < RATING_COMMENT_MIN_LENGTH) {
    return { value: null, refusal: null };
  }
  if (trimmed.length > RATING_COMMENT_MAX_LENGTH) {
    return { value: null, refusal: 'TOO_LONG' };
  }
  return { value: trimmed, refusal: null };
}
