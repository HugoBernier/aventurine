import type { ReactNode } from 'react';
import { findWeapon } from '../../domain/catalogue';
import type { Catalogue } from '../../domain/catalogue';
import type { CharacterSheet, RollLine } from '../../domain/sheet';
import { useCatalogue, useCharacterSheet } from '../../state/hooks';
import { formatModifier } from '../format/abilityBlock';
import { damageTypeName } from '../format/damageTypes';
import { formatMastery, formatRollBonus } from '../format/rollLines';
import styles from './PlaySection.module.css';

function Rolls({
  lines,
  nameOf,
  abilityOf,
}: {
  readonly lines: readonly RollLine[];
  readonly nameOf: (line: RollLine) => string;
  readonly abilityOf: (line: RollLine) => string;
}): ReactNode {
  return (
    <ul className={styles.rolls}>
      {lines.map((line) => {
        const mastery = formatMastery(line);
        return (
          <li className={styles.roll} key={line.id}>
            <span className={styles.rollName}>
              {nameOf(line)}
              {mastery !== null && <span className={styles.mastery}>{mastery}</span>}
            </span>
            <span className={styles.rollAbility}>{abilityOf(line)}</span>
            <span className={styles.rollBonus}>{formatRollBonus(line)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Attacks({
  sheet,
  catalogue,
}: {
  readonly sheet: CharacterSheet;
  readonly catalogue: Catalogue;
}): ReactNode {
  if (sheet.attacks.length === 0) {
    return null;
  }
  return (
    <>
      <h3 className={styles.subheading}>Tes attaques</h3>
      <ul className={styles.rolls}>
        {sheet.attacks.map((attack) => {
          const weapon = findWeapon(catalogue, attack.weaponId);
          const reach =
            attack.rangeMeters === null
              ? 'corps à corps'
              : `${String(attack.rangeMeters[0])} / ${String(attack.rangeMeters[1])} m`;
          return (
            <li className={styles.attack} key={attack.weaponId}>
              <span className={styles.rollName}>{weapon?.name ?? attack.weaponId}</span>
              <span className={styles.attackDamage}>
                {attack.damageDice}
                {attack.damageBonus === 0 ? '' : formatModifier(attack.damageBonus)}{' '}
                {damageTypeName(attack.damageType)} · {reach}
              </span>
              <span className={styles.rollBonus}>
                {formatModifier(attack.attackBonus)}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

/**
 * Ce qu'on lit en jouant : les jets, les attaques, ce qu'on porte. Tout était
 * déjà calculé et n'atteignait aucun écran.
 */
export function PlaySection(): ReactNode {
  const sheet = useCharacterSheet();
  const catalogue = useCatalogue();
  const nameOfSkill = (line: RollLine): string =>
    catalogue.skills.find((skill) => skill.id === line.id)?.name ?? line.id;
  const nameOfAbility = (id: string): string =>
    catalogue.abilities.find((ability) => ability.id === id)?.name ?? id;

  const gear = sheet.equipment.filter((line) => line.quantity > 0);

  return (
    <>
      <h2 className={styles.heading}>Ce que tu lances</h2>

      <h3 className={styles.subheading}>Tes jets de sauvegarde</h3>
      <Rolls
        lines={sheet.saves}
        nameOf={(line) => nameOfAbility(line.id)}
        abilityOf={() => ''}
      />

      <h3 className={styles.subheading}>Tes compétences</h3>
      <Rolls
        lines={sheet.skills}
        nameOf={nameOfSkill}
        abilityOf={(line) => nameOfAbility(line.ability)}
      />

      <Attacks sheet={sheet} catalogue={catalogue} />

      {(gear.length > 0 || sheet.languageIds.length > 0) && (
        <>
          <h2 className={styles.heading}>Ce que tu portes</h2>
          <div className={styles.list}>
            {gear.map((line) => (
              <p className={styles.line} key={line.itemId}>
                <span>
                  {catalogue.items.find((i) => i.id === line.itemId)?.name ?? line.itemId}
                </span>
                <span className={styles.term}>
                  {line.quantity > 1 ? `× ${String(line.quantity)}` : ''}
                </span>
              </p>
            ))}
            <p className={styles.line}>
              <span className={styles.term}>Pièces d’or</span>
              <span>{sheet.goldPieces}</span>
            </p>
            {sheet.languageIds.length > 0 && (
              <p className={styles.line}>
                <span className={styles.term}>Langues</span>
                <span>
                  {sheet.languageIds
                    .map((id) => catalogue.languages.find((l) => l.id === id)?.name ?? id)
                    .join(', ')}
                </span>
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}
