// Contenu dérivé du SRD 5.1 (CC BY 4.0), traduction Aventurine.
import type { Tool } from '../domain/content';

export const TOOL_ENTRIES: readonly Tool[] = [
  { id: 'outils-de-voleur', name: 'Outils de voleur', category: 'Outil', costGp: 25 },
  {
    id: 'outils-de-forgeron',
    name: 'Outils de forgeron',
    category: 'Artisan',
    costGp: 20,
  },
  {
    id: 'outils-de-brasseur',
    name: 'Outils de brasseur',
    category: 'Artisan',
    costGp: 20,
  },
  { id: 'outils-de-macon', name: 'Outils de maçon', category: 'Artisan', costGp: 10 },
  {
    id: 'outils-de-charpentier',
    name: 'Outils de charpentier',
    category: 'Artisan',
    costGp: 8,
  },
  {
    id: 'outils-de-cordonnier',
    name: 'Outils de cordonnier',
    category: 'Artisan',
    costGp: 5,
  },
  {
    id: 'outils-de-cuisinier',
    name: 'Outils de cuisinier',
    category: 'Artisan',
    costGp: 1,
  },
  {
    id: 'outils-de-bijoutier',
    name: 'Outils de bijoutier',
    category: 'Artisan',
    costGp: 25,
  },
  {
    id: 'materiel-de-calligraphie',
    name: 'Matériel de calligraphie',
    category: 'Artisan',
    costGp: 10,
  },
  {
    id: 'materiel-d-herboriste',
    name: 'Matériel d’herboriste',
    category: 'Artisan',
    costGp: 5,
  },
  {
    id: 'materiel-d-alchimiste',
    name: 'Matériel d’alchimiste',
    category: 'Artisan',
    costGp: 50,
  },
  {
    id: 'instrument-de-musique',
    name: 'Instrument de musique',
    category: 'Musique',
    costGp: 15,
  },
  { id: 'des-a-jouer', name: 'Dés à jouer', category: 'Jeu', costGp: 1 },
  { id: 'jeu-de-cartes', name: 'Jeu de cartes', category: 'Jeu', costGp: 1 },
  { id: 'kit-de-deguisement', name: 'Kit de déguisement', category: 'Outil', costGp: 25 },
  { id: 'kit-de-faussaire', name: 'Kit de faussaire', category: 'Outil', costGp: 15 },
  {
    id: 'outils-de-navigateur',
    name: 'Outils de navigateur',
    category: 'Outil',
    costGp: 25,
  },
];
