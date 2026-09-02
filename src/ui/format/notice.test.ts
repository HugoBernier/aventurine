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

describe('avis de cascade', () => {
  it('accorde tout au singulier quand un seul choix tombe', () => {
    // « tes 1 choix liés … ont été remis à zéro » : tout était figé au pluriel.
    expect(formatNotice({ kind: 'slot-closed', source: 'class', lost: 1 })).toBe(
      'Tu as changé de classe : le choix qui en dépendait a été remis à zéro.',
    );
  });

  it('accorde au pluriel au-delà', () => {
    expect(formatNotice({ kind: 'slot-closed', source: 'race', lost: 2 })).toBe(
      'Tu as changé de race : les 2 choix qui en dépendaient ont été remis à zéro.',
    );
  });
});

describe('avis de niveau redescendu', () => {
  it('accorde au singulier quand une seule réponse part', () => {
    expect(
      formatNotice({
        kind: 'too-many',
        slotId: 'class:clerc:cantrips',
        optionIds: ['assistance'],
      }),
    ).toBe('Ce niveau t’en accorde moins : 1 réponse a été retirée.');
  });

  it('accorde au pluriel au-delà', () => {
    expect(
      formatNotice({
        kind: 'too-many',
        slotId: 'class:barde:spells',
        optionIds: ['soin-des-blessures', 'sommeil'],
      }),
    ).toBe('Ce niveau t’en accorde moins : 2 réponses ont été retirées.');
  });
});
