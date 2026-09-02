import type { ReactNode } from 'react';
import styles from './PrintBoxes.module.css';

/**
 * Les cases qu'on remplit au crayon pendant la partie. Elles n'existent qu'à
 * l'impression : à l'écran, ces valeurs se saisissent ou se recalculent, et des
 * cadres vides n'y seraient que du bruit.
 *
 * Une fiche imprimée sans elles est un état des lieux, pas une fiche de jeu :
 * les points de vie bougent à chaque tour, les emplacements se dépensent, et
 * les jets contre la mort se cochent quand ça tourne mal.
 */
export function PrintBoxes({ slots }: { readonly slots: readonly number[] }): ReactNode {
  return (
    <div className={styles.boxes} data-print="only">
      <div className={styles.field}>
        <span className={styles.label}>Points de vie temporaires</span>
        <span className={styles.rule} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Inspiration</span>
        <span className={styles.tick} />
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Jets contre la mort · réussites</span>
        <span className={styles.ticks}>
          <span className={styles.tick} />
          <span className={styles.tick} />
          <span className={styles.tick} />
        </span>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>Jets contre la mort · échecs</span>
        <span className={styles.ticks}>
          <span className={styles.tick} />
          <span className={styles.tick} />
          <span className={styles.tick} />
        </span>
      </div>
      {slots.map((count, index) =>
        count === 0 ? null : (
          <div className={styles.field} key={index}>
            <span className={styles.label}>
              Emplacements de niveau {index + 1} dépensés
            </span>
            <span className={styles.ticks}>
              {Array.from({ length: count }, (_, tick) => (
                <span className={styles.tick} key={tick} />
              ))}
            </span>
          </div>
        ),
      )}
    </div>
  );
}
