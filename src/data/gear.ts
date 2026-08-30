// Contenu dérivé du SRD 5.1 (CC BY 4.0) — traduction Aventurine.
import type { Item } from '../domain/content';
import { ARMOR_ENTRIES } from './armor';
import { TOOL_ENTRIES } from './tools';
import { WEAPON_ENTRIES } from './weapons';

const GEAR: readonly Item[] = [
  { id: 'sac-a-dos', name: 'Sac à dos', weightKg: 2.5 },
  { id: 'sac-de-couchage', name: 'Sac de couchage', weightKg: 3.5 },
  { id: 'rations', name: 'Rations (1 jour)', weightKg: 1 },
  { id: 'gourde', name: 'Gourde', weightKg: 2.5 },
  { id: 'corde-de-chanvre', name: 'Corde de chanvre (15 m)', weightKg: 5 },
  { id: 'torche', name: 'Torche', weightKg: 0.5 },
  { id: 'boite-a-amadou', name: 'Boîte à amadou', weightKg: 0.5 },
  { id: 'lanterne', name: 'Lanterne à capote', weightKg: 1 },
  { id: 'huile', name: 'Fiole d’huile', weightKg: 0.5 },
  { id: 'symbole-sacre', name: 'Symbole sacré', weightKg: 0.5 },
  { id: 'livre-de-prieres', name: 'Livre de prières', weightKg: 2.5 },
  { id: 'baton-d-encens', name: 'Bâton d’encens', weightKg: 0 },
  { id: 'habits-de-ceremonie', name: 'Habits de cérémonie', weightKg: 2 },
  { id: 'bourse', name: 'Bourse', weightKg: 0.5 },
  { id: 'focaliseur-arcanique', name: 'Focaliseur arcanique', weightKg: 1.5 },
  { id: 'focaliseur-druidique', name: 'Focaliseur druidique', weightKg: 1.5 },
  { id: 'grimoire', name: 'Grimoire', weightKg: 1.5 },
  { id: 'bourse-a-composantes', name: 'Bourse à composantes', weightKg: 1 },
  { id: 'carquois', name: 'Carquois', weightKg: 0.5 },
  { id: 'fleches', name: 'Flèches (20)', weightKg: 0.5 },
  { id: 'carreaux', name: 'Carreaux (20)', weightKg: 0.75 },
  { id: 'sacoche-a-billes', name: 'Sacoche à billes', weightKg: 1 },
  { id: 'menottes', name: 'Menottes', weightKg: 3 },
  { id: 'pied-de-biche', name: 'Pied-de-biche', weightKg: 2.5 },
  { id: 'marteau', name: 'Marteau', weightKg: 1.5 },
  { id: 'pitons', name: 'Pitons (10)', weightKg: 1 },
  { id: 'paquetage-d-explorateur', name: 'Paquetage d’explorateur', weightKg: 27 },
  { id: 'paquetage-de-cambrioleur', name: 'Paquetage de cambrioleur', weightKg: 21.5 },
  { id: 'paquetage-de-pretre', name: 'Paquetage de prêtre', weightKg: 12 },
  { id: 'paquetage-de-savant', name: 'Paquetage de savant', weightKg: 5 },
  { id: 'paquetage-de-donjon', name: 'Paquetage de donjon', weightKg: 27.5 },
  { id: 'paquetage-de-diplomate', name: 'Paquetage de diplomate', weightKg: 17 },
  { id: 'paquetage-d-artiste', name: 'Paquetage d’artiste', weightKg: 19 },
];

/**
 * Les armes, armures et outils sont aussi des objets qu'on possède : on dérive
 * leurs entrées plutôt que de les recopier, pour qu'un identifiant ne puisse
 * pas diverger entre deux tables.
 */
export const ITEM_ENTRIES: readonly Item[] = [
  ...GEAR,
  ...WEAPON_ENTRIES.map((weapon) => ({
    id: weapon.id,
    name: weapon.name,
    weightKg: 1.5,
  })),
  ...ARMOR_ENTRIES.map((armor) => ({ id: armor.id, name: armor.name, weightKg: 6 })),
  ...TOOL_ENTRIES.map((tool) => ({ id: tool.id, name: tool.name, weightKg: 1 })),
];
