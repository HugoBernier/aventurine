import type { ReactNode } from 'react';
import type { ChoiceKind, ChoiceOption } from '../../domain/choice';
import { ChoiceGroup } from '../components/ChoiceGroup';
import type { FactLabels } from '../components/ChoiceGroup';
import { Explainer } from '../components/Explainer';

export interface EntityChoiceScreenProps {
  readonly legend: string;
  readonly fieldName: string;
  readonly kind: ChoiceKind;
  readonly options: readonly ChoiceOption[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string) => void;
  readonly help: { readonly label: string; readonly body: ReactNode };
  /** Intitulés des trois repères comparables d'une carte à l'autre. */
  readonly factLabels?: FactLabels | undefined;
}

export function EntityChoiceScreen({
  legend,
  fieldName,
  kind,
  options,
  selectedId,
  onSelect,
  help,
  factLabels,
}: EntityChoiceScreenProps): ReactNode {
  return (
    <>
      <Explainer label={help.label}>{help.body}</Explainer>
      <ChoiceGroup
        legend={legend}
        legendHidden
        kind={kind}
        fieldName={fieldName}
        pick={1}
        options={options}
        picked={selectedId === null ? [] : [selectedId]}
        onToggle={onSelect}
        factLabels={factLabels}
      />
    </>
  );
}
