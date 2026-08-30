import type { ReactNode } from 'react';
import styles from './ProgressBanner.module.css';

export interface ProgressBannerProps {
  readonly stepLabel: string;
  readonly stepIndex: number;
  readonly stepCount: number;
  readonly screenIndex: number;
  readonly screenCount: number;
  readonly onBack?: (() => void) | undefined;
  readonly onOpenSummary: () => void;
}

/**
 * Le texte annonce l'ÉTAPE — stable, encourageant. La barre fine mesure les
 * ÉCRANS — précise. Annoncer « écran 7 sur 19 » découragerait.
 */
export function ProgressBanner({
  stepLabel,
  stepIndex,
  stepCount,
  screenIndex,
  screenCount,
  onBack,
  onOpenSummary,
}: ProgressBannerProps): ReactNode {
  const percent = Math.round((screenIndex / Math.max(screenCount, 1)) * 100);
  const label = `Étape ${String(stepIndex)} sur ${String(stepCount)}`;

  return (
    <>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.link}
          onClick={onBack}
          disabled={onBack === undefined}
          aria-hidden={onBack === undefined}
        >
          ‹ Retour
        </button>
        <span className={styles.step}>
          {label} · {stepLabel}
        </span>
        <button type="button" className={styles.link} onClick={onOpenSummary}>
          Ma fiche
        </button>
      </div>
      <div
        className={styles.rail}
        role="progressbar"
        aria-label={label}
        aria-valuenow={screenIndex}
        aria-valuemin={1}
        aria-valuemax={screenCount}
      >
        <div className={styles.fill} style={{ width: `${String(percent)}%` }} />
      </div>
    </>
  );
}
