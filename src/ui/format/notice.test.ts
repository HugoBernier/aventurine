import { describe, expect, it } from 'vitest';
import { formatNotice } from './notice';

describe('avis de remise à zéro des caractéristiques', () => {
  it('contracte la préposition devant le tableau standard', () => {
    // « Tu es passé à le tableau standard » : le libellé portait son article.
    expect(formatNotice({ kind: 'abilities-reset', method: 'standard-array' })).toBe(
      'Tu es passé au tableau standard : tes caractéristiques repartent de zéro.',
    );
  });

  it('garde « à la » devant la répartition de points', () => {
    expect(formatNotice({ kind: 'abilities-reset', method: 'point-buy' })).toBe(
      'Tu es passé à la répartition de points : tes caractéristiques repartent de zéro.',
    );
  });
});
