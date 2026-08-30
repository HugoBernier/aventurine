import type { ReactNode } from 'react';
import type { Catalogue } from '../../domain/catalogue';
import { findRace } from '../../domain/catalogue';
import type { Facts } from '../../domain/content';
import type { CharacterDraft } from '../../domain/draft';
import { buildSheet } from '../../domain/sheet';
import { useCatalogue, useDraft, useWizardDispatch } from '../../state/hooks';
import type { WizardAction } from '../../state/types';
import { EntityChoiceScreen } from './EntityChoiceScreen';
import { entityOptions } from './entityOptions';

export type SelectionKind = 'race' | 'subrace' | 'class' | 'background';

interface Comparable {
  readonly id: string;
  readonly name: string;
  readonly blurb: string;
  readonly facts: Facts;
}

interface SelectionConfig {
  readonly legend: string;
  readonly help: { readonly label: string; readonly body: string };
  readonly entries: (
    catalogue: Catalogue,
    draft: CharacterDraft,
  ) => readonly Comparable[];
  readonly selected: (draft: CharacterDraft) => string | null;
  readonly action: (id: string) => WizardAction;
}

/**
 * Race, sous-race, classe et historique se choisissent de la même façon :
 * quatre usages réels, donc un seul composant piloté par une table plutôt que
 * quatre presque identiques — ou une cascade de ternaires.
 */
const CONFIG: Record<SelectionKind, SelectionConfig> = {
  race: {
    legend: 'Choisis ta race',
    help: {
      label: 'C’est quoi une « race » ?',
      body: 'Le peuple d’où vient ton personnage. Elle change tes scores de caractéristique et te donne des capacités que tu gardes toute ta vie.',
    },
    entries: (catalogue) => catalogue.races,
    selected: (draft) => draft.raceId,
    action: (raceId) => ({ type: 'SELECT_RACE', raceId }),
  },
  subrace: {
    legend: 'Choisis ta branche',
    help: {
      label: 'Pourquoi une branche ?',
      body: 'Certains peuples se divisent en lignées, qui ajoutent chacune leurs propres bonus.',
    },
    entries: (catalogue, draft) => findRace(catalogue, draft.raceId)?.subraces ?? [],
    selected: (draft) => draft.subraceId,
    action: (subraceId) => ({ type: 'SELECT_SUBRACE', subraceId }),
  },
  class: {
    legend: 'Choisis ta classe',
    help: {
      label: 'C’est quoi une « classe » ?',
      body: 'Ton métier d’aventurier. Elle décide de ta résistance, de ce que tu sais faire au combat, et si tu lances des sorts.',
    },
    entries: (catalogue) => catalogue.classes,
    selected: (draft) => draft.classId,
    action: (classId) => ({ type: 'SELECT_CLASS', classId }),
  },
  background: {
    legend: 'Choisis ton historique',
    help: {
      label: 'C’est quoi un « historique » ?',
      body: 'Ce que tu faisais avant de partir à l’aventure. Il te donne des compétences, du matériel et de quoi jouer ton personnage. Seul l’Acolyte figure tel quel dans le SRD 5.1 : les autres sont écrits pour Aventurine à partir des règles générales d’historique.',
    },
    entries: (catalogue) => catalogue.backgrounds,
    selected: (draft) => draft.backgroundId,
    action: (backgroundId) => ({ type: 'SELECT_BACKGROUND', backgroundId }),
  },
};

/** « Ce que ça change sur ta fiche » : uniquement ce qui est déjà calculable. */
function describeEffect(draft: CharacterDraft, catalogue: Catalogue): string | null {
  const sheet = buildSheet(draft, catalogue);
  const parts: string[] = [];
  if (sheet.maxHitPoints !== null) {
    parts.push(`${String(sheet.maxHitPoints)} points de vie`);
  }
  if (sheet.armorClass !== null) {
    parts.push(`classe d’armure ${String(sheet.armorClass.total)}`);
  }
  if (sheet.speedMeters !== null) {
    parts.push(`vitesse ${sheet.speedMeters.toLocaleString('fr-FR')} m`);
  }
  return parts.length === 0 ? null : parts.join(' · ');
}

export interface SelectionScreenProps {
  readonly kind: SelectionKind;
}

export function SelectionScreen({ kind }: SelectionScreenProps): ReactNode {
  const catalogue = useCatalogue();
  const draft = useDraft();
  const dispatch = useWizardDispatch();
  const config = CONFIG[kind];
  const selectedId = config.selected(draft);

  return (
    <EntityChoiceScreen
      legend={config.legend}
      fieldName={kind}
      kind="ability"
      options={entityOptions(config.entries(catalogue, draft))}
      selectedId={selectedId}
      onSelect={(id) => {
        dispatch(config.action(id));
      }}
      help={config.help}
      effect={selectedId === null ? null : describeEffect(draft, catalogue)}
    />
  );
}
