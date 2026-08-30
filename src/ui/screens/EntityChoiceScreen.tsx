import type { ReactNode } from 'react';
import type { ChoiceKind, ChoiceOption } from '../../domain/choice';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { Explainer } from '../components/Explainer';
import styles from './EntityChoiceScreen.module.css';

export interface EntityChoiceScreenProps {
  readonly legend: string;
  readonly fieldName: string;
  readonly kind: ChoiceKind;
  readonly options: readonly ChoiceOption[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly help: { readonly label: string; readonly body: ReactNode };
  /** « Ce que ça change sur ta fiche », calculé par le domaine. */
  readonly effect?: string | null | undefined;
}

export function EntityChoiceScreen({
  legend,
  fieldName,
  kind,
  options,
  selectedId,
  onSelect,
  help,
  effect = null,
}: EntityChoiceScreenProps): ReactNode {
  return (
    <>
      <Explainer label={help.label}>{help.body}</Explainer>
      <ChoiceGroup
        legend={legend}
        kind={kind}
        fieldName={fieldName}
        pick={1}
        options={options}
        picked={selectedId === null ? [] : [selectedId]}
        onToggle={onSelect}
      />
      {effect === null ? null : (
        <p className={styles.effect}>
          <span className={styles.effectLabel}>Ce que ça change : </span>
          {effect}
        </p>
      )}
    </>
  );
}
