import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLibrary } from '../../state/hooks';
import { Explainer } from '../components/Explainer';
import styles from './LibraryScreen.module.css';

/**
 * La liste des personnages rangés. Supprimer demande confirmation sur place
 * plutôt que dans une fenêtre : sur un téléphone, une boîte de dialogue native
 * se rate au pouce, et rien ici ne se récupère après coup.
 */
export function LibraryScreen(): ReactNode {
  const { characters, create, switchTo, remove } = useLibrary();
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <>
      <Explainer label="Comment ça marche ?">
        Chaque personnage est gardé sur cet appareil. Tu peux passer de l’un à l’autre
        quand tu veux : ce que tu as rempli t’attend.
      </Explainer>

      <ul className={styles.list}>
        {characters.map((entry) => (
          <li className={styles.item} key={entry.id}>
            <div className={styles.row}>
              <button
                type="button"
                className={styles.pick}
                onClick={() => {
                  // Changer de personnage referme la liste, y compris
                  // quand on touche celui sur lequel on travaille déjà.
                  switchTo(entry.id);
                }}
              >
                <span className={styles.name}>
                  {entry.name}
                  {entry.isCurrent && <span className={styles.badge}>en cours</span>}
                </span>
                <span className={styles.summary}>{entry.summary}</span>
              </button>
              <button
                type="button"
                className={styles.remove}
                onClick={() => {
                  setConfirming(entry.id);
                }}
              >
                Supprimer
              </button>
            </div>

            {confirming === entry.id && (
              <p className={styles.confirm}>
                <span>Supprimer {entry.name} ? C’est définitif.</span>
                <span className={styles.confirmActions}>
                  <button
                    type="button"
                    className={styles.danger}
                    onClick={() => {
                      remove(entry.id);
                      setConfirming(null);
                    }}
                  >
                    Oui, supprimer
                  </button>
                  <button
                    type="button"
                    className={styles.cancel}
                    onClick={() => {
                      setConfirming(null);
                    }}
                  >
                    Annuler
                  </button>
                </span>
              </p>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={styles.create}
        onClick={() => {
          create();
        }}
      >
        + Nouveau personnage
      </button>
    </>
  );
}
