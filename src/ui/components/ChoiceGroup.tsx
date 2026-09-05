import { Fragment } from 'react';
import type { ReactNode } from 'react';
import type { ChoiceKind, ChoiceOption } from '../../domain/choice';
import { formatUnavailable } from '../format/unavailable';
import { Provenance } from './Provenance';
import styles from './ChoiceGroup.module.css';

export type FactLabels = readonly [string, string, string];

/**
 * Intitulés des trois repères, par genre de choix. Ils vivent ici et non dans
 * le domaine : ce sont des libellés d'affichage. Un genre absent de cette
 * table n'affiche pas de bande de repères, elle n'informerait pas.
 *
 * Race, classe et historique partagent le genre `ability` sans partager le
 * sens de leurs repères : eux passent leurs intitulés par `factLabels`.
 */
const FACT_LABELS: Partial<Record<ChoiceKind, FactLabels>> = {
  // L'ordre suit celui des repères, pas l'inverse : les trois intitulés
  // étaient décalés d'un cran, et « Portée : 1 action » se lisait sur chaque
  // sort du site.
  cantrip: ['Incantation', 'Portée', 'Durée'],
  // Le niveau est le titre de son groupe : le répéter sur chacune des trente
  // cartes coûterait une ligne par carte pour redire l'intertitre juste au-dessus.
  spell: ['', 'Portée', 'Durée'],
  equipment: ['Dégâts', 'Propriétés', 'Usage'],
  ancestry: ['Type de dégâts', 'Souffle', ''],
};

export interface ChoiceGroupProps {
  readonly legend: string;
  /**
   * Le groupe occupe tout l'écran et le titre `h1` le nomme déjà : la légende
   * reste dans le DOM pour nommer le `fieldset`, mais ne se répète pas à
   * l'écran, où elle coûterait une ligne sur les six qu'un téléphone montre.
   */
  readonly legendHidden?: boolean | undefined;
  readonly kind: ChoiceKind;
  readonly fieldName: string;
  readonly pick: number;
  readonly options: readonly ChoiceOption[];
  readonly picked: readonly string[];
  readonly onToggle: (optionId: string) => void;
  readonly empty?: ReactNode | undefined;
  /** Prioritaire sur la table par genre, quand un genre sert à plusieurs sens. */
  readonly factLabels?: FactLabels | undefined;
  /**
   * Ce qu'il reste à choisir, déjà rédigé. Il voyage jusqu'au bandeau collant
   * parce que c'est là qu'il reste lisible : la phrase se compose dans l'écran,
   * qui seul connaît le créneau.
   */
  readonly note?: string | undefined;
}

function Facts({
  kind,
  facts,
  factLabels,
}: {
  readonly kind: ChoiceKind;
  readonly facts: readonly [string, string, string];
  readonly factLabels: FactLabels | undefined;
}): ReactNode {
  const labels = factLabels ?? FACT_LABELS[kind];
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

interface Section {
  /** `null` quand le genre ne se range pas : une seule liste, sans intertitre. */
  readonly heading: string | null;
  readonly options: readonly ChoiceOption[];
}

/**
 * Les sorts se rangent par niveau, comme sur la fiche. Un lanceur sait quel
 * niveau il veut remplir avant de savoir quel sort il prend : trente noms par
 * ordre alphabétique lui font chercher ce que six intertitres lui montrent.
 *
 * Le niveau est le premier repère d'un sort — `FACT_LABELS.spell` le déclare —
 * et le domaine rend déjà la liste triée, donc les groupes sortent dans l'ordre.
 */
function sectionsOf(
  kind: ChoiceKind,
  options: readonly ChoiceOption[],
): readonly Section[] {
  if (kind !== 'spell') {
    return [{ heading: null, options }];
  }
  const byLevel = new Map<string, ChoiceOption[]>();
  for (const option of options) {
    const heading = `Niveau ${option.facts[0]}`;
    const kept = byLevel.get(heading);
    if (kept === undefined) {
      byLevel.set(heading, [option]);
    } else {
      kept.push(option);
    }
  }
  return [...byLevel].map(([heading, kept]) => ({ heading, options: kept }));
}

/**
 * Le bandeau d'une section : le niveau à gauche, ce qu'il reste à choisir à
 * droite. Il ne défile pas, et c'est tout son intérêt — le niveau ayant quitté
 * les cartes, il n'existe plus qu'ici, et un compteur qu'on doit remonter
 * chercher ne compte rien.
 *
 * Chaque section porte le sien : au moment où la section 2 chasse la section 1
 * du haut de l'écran, c'est le bandeau 2 qui prend sa place, et les deux
 * informations restent. Seul le premier est une région live : les autres
 * répètent la même phrase à l'œil, et une annonce en triple n'apprend rien.
 */
function Band({
  heading,
  note,
  isFirst,
}: {
  readonly heading: string | null;
  readonly note: string | undefined;
  readonly isFirst: boolean;
}): ReactNode {
  if (heading === null && note === undefined) {
    return null;
  }
  return (
    <div className={styles.band}>
      {heading !== null && <h2 className={styles.level}>{heading}</h2>}
      {note !== undefined &&
        (isFirst ? (
          <p className={styles.note} role="status">
            {note}
          </p>
        ) : (
          <p className={styles.note} aria-hidden="true">
            {note}
          </p>
        ))}
    </div>
  );
}

function OptionCard({
  option,
  kind,
  fieldName,
  inputType,
  isChecked,
  onToggle,
  factLabels,
}: {
  readonly option: ChoiceOption;
  readonly kind: ChoiceKind;
  readonly fieldName: string;
  readonly inputType: 'radio' | 'checkbox';
  readonly isChecked: boolean;
  readonly onToggle: (optionId: string) => void;
  readonly factLabels: FactLabels | undefined;
}): ReactNode {
  return (
    <label className={styles.card}>
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
        <Provenance id={option.id} />
        <span className={styles.blurb}>{option.blurb}</span>
        <Facts kind={kind} facts={option.facts} factLabels={factLabels} />
        {option.unavailable !== null && (
          <span className={styles.unavailable}>
            {formatUnavailable(option.unavailable, kind)}
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * `fieldset` + `legend` + `input` natifs, sans un seul rôle ARIA : le natif
 * fournit le regroupement, le nom du groupe, `aria-checked`, les flèches et
 * Home/End, correctement, sur tous les lecteurs d'écran. Un `radiogroup`
 * fait main serait plus de code ET moins fiable.
 */
export function ChoiceGroup({
  legend,
  legendHidden = false,
  kind,
  fieldName,
  pick,
  options,
  picked,
  onToggle,
  empty,
  factLabels,
  note,
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
      <legend className={legendHidden ? styles.legendHidden : styles.legend}>
        {legend}
      </legend>
      {sectionsOf(kind, options).map((section, index) => (
        <Fragment key={section.heading ?? legend}>
          <Band heading={section.heading} note={note} isFirst={index === 0} />
          <div className={styles.list}>
            {section.options.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                kind={kind}
                fieldName={fieldName}
                inputType={inputType}
                isChecked={picked.includes(option.id)}
                onToggle={onToggle}
                factLabels={factLabels}
              />
            ))}
          </div>
        </Fragment>
      ))}
    </fieldset>
  );
}
