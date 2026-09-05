import type { ReactNode } from 'react';
import type { Catalogue } from '../../domain/catalogue';
import { findRace } from '../../domain/catalogue';
import type { Facts } from '../../domain/content';
import type { CharacterDraft } from '../../domain/draft';
import { useCatalogue, useDraft, useWizardDispatch } from '../../state/hooks';
import type { WizardAction } from '../../state/types';
import type { FactLabels } from '../components/ChoiceGroup';
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
  /**
   * Ce que veut dire chacun des trois repères des cartes. Sans eux la bande ne
   * s'affiche pas : quatre listes partagent le même genre de choix sans
   * partager le sens de leurs colonnes.
   */
  readonly factLabels: FactLabels;
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
 * quatre presque identiques, ou une cascade de ternaires.
 */
const CONFIG: Record<SelectionKind, SelectionConfig> = {
  race: {
    legend: 'Choisis ta race',
    help: {
      label: 'C’est quoi une « race » ?',
      body: 'Le peuple d’où vient ton personnage. Elle change tes scores de caractéristique et te donne des capacités que tu gardes toute ta vie.',
    },
    factLabels: ['Caractéristiques', 'Taille et vitesse', 'Ce qu’elle apporte'],
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
    factLabels: ['Caractéristiques', 'Vitesse', 'Ce qu’elle apporte'],
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
    factLabels: ['Dé de vie', 'Jets de sauvegarde', 'Ce qu’elle apporte'],
    entries: (catalogue) => catalogue.classes,
    selected: (draft) => draft.classId,
    action: (classId) => ({ type: 'SELECT_CLASS', classId }),
  },
  background: {
    legend: 'Choisis ton historique',
    help: {
      label: 'C’est quoi un « historique » ?',
      // « les autres sont écrits pour Aventurine » cessait d'être vrai dès
      // qu'un pack en ajoutait un : ceux-là sont écrits par un joueur, et
      // portent le nom de leur pack sous le leur.
      body: 'Ce que tu faisais avant de partir à l’aventure. Il te donne des compétences, du matériel et de quoi jouer ton personnage. Seul l’Acolyte figure tel quel dans le SRD 5.1 : les autres sont écrits à partir des règles générales d’historique — par Aventurine, ou par le pack dont ils portent le nom.',
    },
    factLabels: ['Compétences', 'Outils et langues', 'Équipement de départ'],
    entries: (catalogue) => catalogue.backgrounds,
    selected: (draft) => draft.backgroundId,
    action: (backgroundId) => ({ type: 'SELECT_BACKGROUND', backgroundId }),
  },
};

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
      factLabels={config.factLabels}
    />
  );
}
