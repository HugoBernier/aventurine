import type { ReactNode } from 'react';
import type { ChoiceKind, ChoiceOption } from '../../domain/choice';
import { formatUnavailable } from '../format/unavailable';
import styles from './ChoiceGroup.module.css';

/**
 * Intitulés des trois repères, par genre de choix. Ils vivent ici et non dans
 * le domaine : ce sont des libellés d'affichage. Un genre absent de cette
 * table n'affiche pas de bande de repères — elle n'informerait pas.
 */
const FACT_LABELS: Partial<Record<ChoiceKind, readonly [string, string, string]>> = {
  cantrip: ['Portée', 'Durée', 'Incantation'],
  spell: ['Portée', 'Durée', 'Incantation'],
  equipment: ['Dégâts', 'Propriétés', 'Usage'],
  ancestry: ['Type de dégâts', 'Souffle', ''],
};

export interface ChoiceGroupProps {
  readonly legend: string;
  readonly kind: ChoiceKind;
  readonly fieldName: string;
  readonly pick: number;
  readonly options: readonly ChoiceOption[];
  readonly picked: readonly string[];
  readonly onToggle: (optionId: string) => void;
  readonly empty?: ReactNode;
}

function Facts({
  kind,
  facts,
}: {
  readonly kind: ChoiceKind;
  readonly facts: readonly [string, string, string];
}): ReactNode {
  const labels = FACT_LABELS[kind];
  if (labels === undefined) {
    return null;
  }
  return (
    <dl className={styles.facts}>
      {labels.map((label, index) =>
        label === '' || facts[index] === '—' ? null : (
          <div key={label} style={{ display: 'contents' }}>
            <dt className={styles.factLabel}>{label}</dt>
            <dd className={styles.factValue}>{facts[index]}</dd>
          </div>
        ),
      )}
    </dl>
  );
}

/**
 * `fieldset` + `legend` + `input` natifs, sans un seul rôle ARIA : le natif
 * fournit le regroupement, le nom du groupe, `aria-checked`, les flèches et
 * Home/End — correctement, sur tous les lecteurs d'écran. Un `radiogroup`
 * fait main serait plus de code ET moins fiable.
 */
export function ChoiceGroup({
  legend,
  kind,
  fieldName,
  pick,
  options,
  picked,
  onToggle,
  empty,
}: ChoiceGroupProps): ReactNode {
  if (options.length === 0) {
    return (
      <p className={styles.empty}>{empty ?? 'Rien à choisir ici pour l’instant.'}</p>
    );
  }

  // Un choix unique reste un bouton radio : remplacer sa sélection y est
  // naturel, alors qu'un groupe multiple plein se décoche d'abord.
  const inputType = pick === 1 ? 'radio' : 'checkbox';

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      {pick > 1 && (
        <p className={styles.counter} role="status">
          {picked.length} sur {pick} choisis
        </p>
      )}
      <div className={styles.list}>
        {options.map((option) => {
          const isChecked = picked.includes(option.id);
          return (
            <label className={styles.card} key={option.id}>
              <input
                className={styles.input}
                type={inputType}
                name={fieldName}
                value={option.id}
                checked={isChecked}
                disabled={option.unavailable !== null}
                onChange={() => {
                  onToggle(option.id);
                }}
              />
              <span className={styles.body}>
                <span className={styles.head}>
                  <span className={styles.name}>{option.label}</span>
                  {isChecked && <span className={styles.chosen}>✓ Choisi</span>}
                </span>
                <span className={styles.blurb}>{option.blurb}</span>
                <Facts kind={kind} facts={option.facts} />
                {option.unavailable !== null && (
                  <span className={styles.unavailable}>
                    {formatUnavailable(option.unavailable)}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
