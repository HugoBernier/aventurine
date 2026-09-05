import type { ReactNode } from 'react';
import type { ChoiceSlotId } from '../../domain/choice';
import { useCatalogue, useChoiceSlot } from '../../state/hooks';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { Explainer } from '../components/Explainer';
import { Notice } from '../components/Notice';
import { formatPickSource, formatPicking } from '../format/picking';
import styles from './ChoiceSlotScreen.module.css';

export interface ChoiceSlotScreenProps {
  readonly slotId: ChoiceSlotId;
}

/**
 * Un seul écran générique rend la grande majorité du parcours : tous les
 * créneaux ouverts par `openChoices`. Ajouter une race ou une classe n'ajoute
 * donc aucun composant.
 */
export function ChoiceSlotScreen({ slotId }: ChoiceSlotScreenProps): ReactNode {
  const view = useChoiceSlot(slotId);
  const catalogue = useCatalogue();
  if (view === null) {
    return (
      <Notice tone="reminder">
        Ce choix n’est plus ouvert : reviens en arrière pour voir ce qui a changé.
      </Notice>
    );
  }

  const { slot, picked, remaining, toggle } = view;
  // Un nombre qui se calcule s'explique sur place, et non derrière un dépliant
  // qu'on n'ouvre pas : sans le calcul, deux sorts au niveau 7 passent pour une
  // erreur de l'application.
  const source =
    slot.pickFrom === null
      ? null
      : formatPickSource(
          slot.pick,
          slot.pickFrom,
          catalogue.abilities.find((entry) => entry.id === slot.pickFrom?.ability)
            ?.name ?? slot.pickFrom.ability,
        );
  return (
    <>
      <Explainer label="Comment ça marche ?">{slot.help}</Explainer>
      {source !== null && <p className={styles.source}>{source}</p>}
      <ChoiceGroup
        legend={slot.title}
        legendHidden
        kind={slot.kind}
        fieldName={slot.id}
        pick={slot.pick}
        options={slot.options}
        picked={picked}
        onToggle={toggle}
        empty="Aucune option disponible ici pour l’instant."
        // Un seul choix à faire n'a pas de reste à compter : le titre le dit.
        note={slot.pick > 1 ? formatPicking(remaining, slot.pick, slot.kind) : undefined}
      />
    </>
  );
}
