import type { ReactNode } from 'react';
import { useCatalogue, useCharacterSheet, useDraft, useLevel } from '../../state/hooks';
import { findClass } from '../../domain/catalogue';
import { Explainer } from '../components/Explainer';
import { Notice } from '../components/Notice';
import { formatHitPointRow, formatIgnoredRoll } from '../format/hitPoints';
import styles from './LevelScreen.module.css';

/**
 * Un pas à la fois plutôt qu'une liste de vingt cartes : à 360 px, vingt
 * cartes se cherchent au défilement, deux boutons se trouvent au pouce. Ce
 * que le niveau change s'affiche à côté, pour que le chiffre ait un sens.
 */
/** Un champ vidé efface le jet ; tout ce qui n'est pas un entier est ignoré. */
function asRoll(value: string): number | null {
  if (value === '') {
    return null;
  }
  const roll = Number(value);
  return Number.isSafeInteger(roll) ? roll : null;
}

export function LevelScreen(): ReactNode {
  const {
    level,
    canDecrease,
    canIncrease,
    setLevel,
    hitPointMethod,
    hitPointRolls,
    setHitPointMethod,
    setHitPointRoll,
  } = useLevel();
  const sheet = useCharacterSheet();
  const draft = useDraft();
  const catalogue = useCatalogue();
  const characterClass = findClass(catalogue, draft.classId);

  const nextAdvancement = characterClass?.advancements.find((step) => step.level > level);
  const openAdvancements =
    characterClass?.advancements.filter((step) => step.level <= level).length ?? 0;

  return (
    <>
      <Explainer label="À quoi sert le niveau ?">
        Il mesure l’expérience de ton personnage. Plus il monte, plus tu as de points de
        vie, un meilleur bonus de maîtrise, et à certains paliers un choix à faire.
      </Explainer>

      {characterClass === null && (
        <Notice tone="reminder">
          Choisis d’abord ta classe : sans elle, le niveau ne change presque rien.
        </Notice>
      )}

      <div className={styles.stepper}>
        <button
          type="button"
          className={styles.step}
          onClick={() => {
            setLevel(level - 1);
          }}
          disabled={!canDecrease}
          aria-label="Descendre d’un niveau"
        >
          −
        </button>
        <p className={styles.value} aria-live="polite">
          <span className={styles.label}>Niveau</span>
          <span className={styles.number}>{level}</span>
        </p>
        <button
          type="button"
          className={styles.step}
          onClick={() => {
            setLevel(level + 1);
          }}
          disabled={!canIncrease}
          aria-label="Monter d’un niveau"
        >
          +
        </button>
      </div>

      <dl className={styles.effects}>
        <div className={styles.row}>
          <dt className={styles.term}>Bonus de maîtrise</dt>
          <dd className={styles.value2}>+{sheet.proficiencyBonus}</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>Points de vie</dt>
          <dd className={styles.value2}>{sheet.maxHitPoints ?? 'à définir'}</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>Dés de vie</dt>
          <dd className={styles.value2}>
            {sheet.hitDice === null
              ? 'à définir'
              : `${String(sheet.hitDice.count)} d${String(sheet.hitDice.die)}`}
          </dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>Choix de progression ouverts</dt>
          <dd className={styles.value2}>{openAdvancements}</dd>
        </div>
      </dl>

      {characterClass !== null && (
        <section className={styles.breakdown}>
          <h2 className={styles.breakdownTitle}>D’où viennent tes points de vie</h2>
          <ol className={styles.ledger}>
            {sheet.hitPointRows.map((row) => {
              const ignored = formatIgnoredRoll(row, characterClass.hitDie);
              return (
                <li className={styles.ledgerRow} key={row.level}>
                  <span className={styles.ledgerLevel}>Niveau {row.level}</span>
                  <span className={styles.ledgerHow}>
                    {formatHitPointRow(row, characterClass.hitDie)}
                  </span>
                  <span className={styles.ledgerGain}>+{row.total}</span>
                  {ignored === null ? null : (
                    <span className={styles.ledgerWarning}>{ignored}</span>
                  )}
                </li>
              );
            })}
          </ol>
          <p className={styles.ledgerTotal}>
            <span>Total</span>
            <span className={styles.ledgerGain}>{sheet.maxHitPoints ?? 0}</span>
          </p>
        </section>
      )}

      {characterClass !== null && level > 1 && (
        <>
          <fieldset className={styles.group}>
            <legend className={styles.legend}>Comment tes points de vie montent</legend>
            {(
              [
                [
                  'average',
                  'La moyenne du dé',
                  'Le calcul se fait tout seul. C’est le choix par défaut.',
                ],
                [
                  'rolled',
                  'J’ai lancé les dés',
                  'Tu lances chez toi, tu saisis le résultat ici.',
                ],
              ] as const
            ).map(([id, label, help]) => (
              <label className={styles.method} key={id}>
                <input
                  type="radio"
                  name="hit-point-method"
                  checked={hitPointMethod === id}
                  onChange={() => {
                    setHitPointMethod(id);
                  }}
                />
                <span>
                  <span className={styles.methodName}>{label}</span>
                  <span className={styles.methodHelp}>{help}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {hitPointMethod === 'rolled' && (
            <ul className={styles.rolls}>
              {Array.from({ length: level - 1 }, (_, index) => index + 2).map((at) => (
                <li className={styles.roll} key={at}>
                  <label htmlFor={`roll-${String(at)}`}>Niveau {at}</label>
                  <input
                    id={`roll-${String(at)}`}
                    className={styles.rollInput}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={characterClass.hitDie}
                    placeholder={String(Math.floor(characterClass.hitDie / 2) + 1)}
                    value={hitPointRolls[String(at)] ?? ''}
                    onChange={(event) => {
                      setHitPointRoll(at, asRoll(event.target.value));
                    }}
                  />
                  <span className={styles.die}>sur d{characterClass.hitDie}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {nextAdvancement !== undefined && (
        <p className={styles.hint}>
          Prochain choix au niveau {nextAdvancement.level} : améliorer tes
          caractéristiques, ou prendre un don.
        </p>
      )}
    </>
  );
}
