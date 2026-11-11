import { describe, expect, it } from '@jest/globals';
import {
  isValidScore,
  labelKeyForScore,
  normalizeComment,
  RATING_COMMENT_MAX_LENGTH,
  RATING_MAX_SCORE,
  RATING_MIN_SCORE,
  RATING_SCORE_LABEL_KEYS,
  RATING_SCORES,
} from './rating-score.js';

const commentOfLength = (length: number): string => 'a'.repeat(length);

describe('rating score and comment (BR2.1, BR2.2)', () => {
  describe('the scale of one to five (BR2.1)', () => {
    it('accepts both ends of the scale and everything between them', () => {
      expect(RATING_SCORES).toEqual([1, 2, 3, 4, 5]);
      for (const score of RATING_SCORES) {
        expect(isValidScore(score)).toBe(true);
      }
      expect(isValidScore(RATING_MIN_SCORE)).toBe(true);
      expect(isValidScore(RATING_MAX_SCORE)).toBe(true);
    });

    it('refuses a value below the scale and one above it', () => {
      expect(isValidScore(0)).toBe(false);
      expect(isValidScore(-1)).toBe(false);
      expect(isValidScore(6)).toBe(false);
    });

    it('refuses a value that is not an integer and one that is not a number', () => {
      expect(isValidScore(3.5)).toBe(false);
      expect(isValidScore(Number.NaN)).toBe(false);
      expect(isValidScore('4')).toBe(false);
      expect(isValidScore(null)).toBe(false);
      expect(isValidScore(undefined)).toBe(false);
    });

    it('gives every score its own fixed label, from the worst to the best', () => {
      expect(RATING_SCORE_LABEL_KEYS).toHaveLength(RATING_SCORES.length);
      expect(RATING_SCORES.map((score) => labelKeyForScore(score))).toEqual([
        'VERY_BAD',
        'BAD',
        'FAIR',
        'GOOD',
        'VERY_GOOD',
      ]);
      expect(new Set(RATING_SCORE_LABEL_KEYS).size).toBe(RATING_SCORE_LABEL_KEYS.length);
    });

    it('has no label for a value outside the scale', () => {
      expect(labelKeyForScore(0)).toBeNull();
      expect(labelKeyForScore(6)).toBeNull();
      expect(labelKeyForScore(2.5)).toBeNull();
    });
  });

  describe('the optional comment (BR2.2)', () => {
    it('treats an absent comment as absent, whichever way it arrives', () => {
      expect(normalizeComment(undefined)).toEqual({ value: null, refusal: null });
      expect(normalizeComment(null)).toEqual({ value: null, refusal: null });
    });

    it('removes the surrounding blank space before measuring and storing', () => {
      expect(normalizeComment('  Atendimento excelente.  ')).toEqual({
        value: 'Atendimento excelente.',
        refusal: null,
      });
      expect(normalizeComment(commentOfLength(RATING_COMMENT_MAX_LENGTH).padEnd(510, ' '))).toEqual(
        { value: commentOfLength(RATING_COMMENT_MAX_LENGTH), refusal: null },
      );
    });

    it('stores a comment that is empty after trimming as absent', () => {
      expect(normalizeComment('')).toEqual({ value: null, refusal: null });
      expect(normalizeComment('   \n\t  ')).toEqual({ value: null, refusal: null });
    });

    it('accepts one character and exactly the maximum length', () => {
      expect(normalizeComment('a')).toEqual({ value: 'a', refusal: null });
      expect(normalizeComment(commentOfLength(RATING_COMMENT_MAX_LENGTH)).refusal).toBeNull();
    });

    it('refuses one character past the maximum, naming nothing else', () => {
      expect(normalizeComment(commentOfLength(RATING_COMMENT_MAX_LENGTH + 1))).toEqual({
        value: null,
        refusal: 'TOO_LONG',
      });
    });

    it('keeps the line breaks inside the text and interprets no markup', () => {
      const comment = 'Primeira linha.\nSegunda linha.\n\n**não é negrito**';

      expect(normalizeComment(`\n${comment}\n`)).toEqual({ value: comment, refusal: null });
    });
  });
});
