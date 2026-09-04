import { describe, expect, it } from 'vitest';
import { hitPointRows } from '../../domain/progression';
import { formatHitPointRow } from './hitPoints';

describe('le décompte des points de vie', () => {
  const paladin = hitPointRows(2, 10, -1, 0);

  it('nomme le dé de la classe, pas la valeur obtenue', () => {
    // « moyenne du dé 6 » se lisait « moyenne du d6 » sur une fiche de paladin.
    const [, second] = paladin;
    expect(second === undefined ? '' : formatHitPointRow(second, 10)).toBe(
      '6 (moyenne du d10), Constitution -1',
    );
  });

  it('dit que le niveau 1 prend le dé au maximum', () => {
    const [premier] = paladin;
    expect(premier === undefined ? '' : formatHitPointRow(premier, 10)).toBe(
      '10 (d10 au maximum), Constitution -1',
    );
  });

  it('annonce un lancer comme un lancer', () => {
    const [, second] = hitPointRows(2, 12, 0, 0, { '2': 9 });
    expect(second === undefined ? '' : formatHitPointRow(second, 12)).toBe(
      '9 (ton lancer de d12)',
    );
  });

  it('signale le plancher quand la Constitution ferait perdre un niveau', () => {
    const [, second] = hitPointRows(2, 6, -5, 0);
    expect(second === undefined ? '' : formatHitPointRow(second, 6)).toBe(
      '4 (moyenne du d6), Constitution -5, minimum 1',
    );
  });
});
