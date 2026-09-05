import type { ReactNode } from 'react';
import type { ChoiceSlotId } from '../../domain/choice';
import { useChoiceSlot } from '../../state/hooks';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { Explainer } from '../components/Explainer';
import { Notice } from '../components/Notice';
import { formatPicking } from '../format/picking';
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
  if (view === null) {
    return (
      <Notice tone="reminder">
        Ce choix n’est plus ouvert : reviens en arrière pour voir ce qui a changé.
      </Notice>
    );
  }

  const { slot, picked, remaining, toggle } = view;
  return (
    <>
      <Explainer label="Comment ça marche ?">{slot.help}</Explainer>
      {/* Un seul choix à faire n'a pas de reste à compter : le titre le dit. */}
      {slot.pick > 1 && (
        <p className={styles.counter} role="status">
          {formatPicking(remaining, slot.pick, slot.kind)}
        </p>
      )}
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
      />
    </>
  );
}
