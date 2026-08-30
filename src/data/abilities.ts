// Contenu dérivé du SRD 5.1 (CC BY 4.0), traduction Aventurine.
// Voir src/data/attribution.ts.
import type { AbilityEntry } from '../domain/content';

export const ABILITY_ENTRIES: readonly AbilityEntry[] = [
  { id: 'force', name: 'Force', purpose: 'Frapper, porter, briser, escalader.' },
  {
    id: 'dexterite',
    name: 'Dextérité',
    purpose: 'Viser, esquiver, se faufiler, garder l’équilibre.',
  },
  {
    id: 'constitution',
    name: 'Constitution',
    purpose: 'Encaisser, tenir debout, résister au poison.',
  },
  {
    id: 'intelligence',
    name: 'Intelligence',
    purpose: 'Savoir, déduire, comprendre la magie.',
  },
  {
    id: 'sagesse',
    name: 'Sagesse',
    purpose: 'Remarquer, sentir le mensonge, garder la tête froide.',
  },
  {
    id: 'charisme',
    name: 'Charisme',
    purpose: 'Convaincre, mentir, mener, impressionner.',
  },
];
