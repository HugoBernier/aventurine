import type { ReactNode } from 'react';
import { useCatalogue, useCharacterSheet, useDraft, useLevel } from '../../state/hooks';
import { findClass } from '../../domain/catalogue';
import { Explainer } from '../components/Explainer';
import { Notice } from '../components/Notice';
import styles from './LevelScreen.module.css';

/**
 * Un pas à la fois plutôt qu'une liste de vingt cartes : à 360 px, vingt
 * cartes se cherchent au défilement, deux boutons se trouvent au pouce. Ce
 * que le niveau change s'affiche à côté, pour que le chiffre ait un sens.
 */
export function LevelScreen(): ReactNode {
  const { level, canDecrease, canIncrease, setLevel } = useLevel();
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

      {nextAdvancement !== undefined && (
        <p className={styles.hint}>
          Prochain choix au niveau {nextAdvancement.level} : améliorer tes
          caractéristiques, ou prendre un don.
        </p>
      )}
    </>
  );
}
