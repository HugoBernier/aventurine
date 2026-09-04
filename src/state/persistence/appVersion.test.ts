import { describe, expect, it } from 'vitest';
import { APP_MAJOR_VERSION } from './appVersion';

describe('la version d’Aventurine', () => {
  it('suit le majeur de package.json', async () => {
    // Deux endroits qui doivent dire la même chose : autant qu'un test le
    // remarque avant qu'un fichier exporté ne mente sur son origine.
    const pkg: { readonly version: string } = await import('../../../package.json');
    expect(String(APP_MAJOR_VERSION)).toBe(pkg.version.split('.', 1)[0]);
  });
});
