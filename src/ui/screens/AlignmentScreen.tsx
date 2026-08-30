import type { ReactNode } from 'react';
import { useCatalogue, useDraft, useWizardDispatch } from '../../state/hooks';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { Explainer } from '../components/Explainer';

export function AlignmentScreen(): ReactNode {
  const catalogue = useCatalogue();
  const draft = useDraft();
  const dispatch = useWizardDispatch();

  const options = catalogue.alignments.map((alignment) => ({
    id: alignment.id,
    label: alignment.name,
    blurb: alignment.blurb,
    facts: ['—', '—', '—'] as const,
    details: [],
    unavailable: null,
  }));

  return (
    <>
      <Explainer label="C’est quoi un alignement ?">
        Une boussole morale en deux mots : d’un côté ton rapport aux règles (loyal,
        neutre, chaotique), de l’autre ton rapport aux autres (bon, neutre, mauvais). Rien
        n’est verrouillé : ton personnage peut changer.
      </Explainer>
      <ChoiceGroup
        legend="Comment te comportes-tu ?"
        kind="ability"
        fieldName="alignment"
        pick={1}
        options={options}
        picked={draft.alignmentId === null ? [] : [draft.alignmentId]}
        onToggle={(alignmentId) => {
          dispatch({ type: 'SELECT_ALIGNMENT', alignmentId });
        }}
      />
    </>
  );
}
