// Contenu dérivé du SRD 5.1 (CC BY 4.0) — traduction Aventurine.
import type { Language } from '../domain/content';

export const LANGUAGE_ENTRIES: readonly Language[] = [
  { id: 'commun', name: 'Commun', script: 'commune', exotic: false },
  { id: 'nain', name: 'Nain', script: 'naine', exotic: false },
  { id: 'elfique', name: 'Elfique', script: 'elfique', exotic: false },
  { id: 'gigant', name: 'Géant', script: 'naine', exotic: false },
  { id: 'gnome', name: 'Gnome', script: 'naine', exotic: false },
  { id: 'gobelin', name: 'Gobelin', script: 'naine', exotic: false },
  { id: 'halfelin', name: 'Halfelin', script: 'commune', exotic: false },
  { id: 'orc', name: 'Orc', script: 'naine', exotic: false },
  { id: 'abyssal', name: 'Abyssal', script: 'infernale', exotic: true },
  { id: 'celeste', name: 'Céleste', script: 'céleste', exotic: true },
  { id: 'draconique', name: 'Draconique', script: 'draconique', exotic: true },
  { id: 'parler-souterrain', name: 'Parler souterrain', script: 'aucune', exotic: true },
  { id: 'infernal', name: 'Infernal', script: 'infernale', exotic: true },
  { id: 'primordial', name: 'Primordial', script: 'draconique', exotic: true },
  { id: 'sylvestre', name: 'Sylvestre', script: 'elfique', exotic: true },
  {
    id: 'commun-des-profondeurs',
    name: 'Commun des profondeurs',
    script: 'elfique',
    exotic: true,
  },
];
