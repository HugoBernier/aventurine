import { describe, expect, it } from 'vitest';
import { formatDamageTypeList, formatResistances } from './damageTypes';

describe('résistances', () => {
  it('contracte « à » selon le genre et l’initiale', () => {
    // Les trois cas que « au » + identifiant cassait.
    expect(formatResistances(['foudre'])).toBe('résiste à la foudre');
    expect(formatResistances(['acide'])).toBe('résiste à l’acide');
    expect(formatResistances(['force'])).toBe('résiste à la force');
  });

  it('garde « au » quand c’est la bonne forme', () => {
    expect(formatResistances(['feu'])).toBe('résiste au feu');
    expect(formatResistances(['poison'])).toBe('résiste au poison');
  });

  it('enchaîne plusieurs résistances sans répéter le verbe', () => {
    expect(formatResistances(['poison', 'foudre'])).toBe(
      'résiste au poison, à la foudre',
    );
  });

  it('ne dit rien quand il n’y en a aucune', () => {
    expect(formatResistances([])).toBeNull();
  });

  it('rend son accent au nécrotique, que l’identifiant n’a pas', () => {
    expect(formatDamageTypeList(['necrotique'])).toBe('nécrotique');
  });
});
