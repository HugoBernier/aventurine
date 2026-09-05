import { useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { useLibrary } from '../../state/hooks';
import { readCharacterFile } from '../../state/persistence/characterFile';
import { Explainer } from '../components/Explainer';
import { Notice } from '../components/Notice';
import { formatImportResult } from '../format/characterFile';
import type { ImportMessage } from '../format/characterFile';
import styles from './LibraryScreen.module.css';

/**
 * La liste des personnages rangés. Supprimer demande confirmation sur place
 * plutôt que dans une fenêtre : sur un téléphone, une boîte de dialogue native
 * se rate au pouce, et rien ici ne se récupère après coup.
 */
export interface LibraryScreenProps {
  /** Les packs valent pour l'appareil, comme cette liste : ils s'ouvrent d'ici. */
  readonly onOpenPacks: () => void;
}

export function LibraryScreen({ onOpenPacks }: LibraryScreenProps): ReactNode {
  const { characters, create, add, switchTo, remove } = useLibrary();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [message, setMessage] = useState<ImportMessage | null>(null);
  // Le champ garde son étiquette native plutôt qu'un bouton qui le cliquerait :
  // c'est le mécanisme que tous les navigateurs ouvrent sans détour. La
  // référence ne sert qu'à le vider après coup.
  const fileInput = useRef<HTMLInputElement>(null);

  const openFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    // Rouvrir le MÊME fichier après une correction doit relancer la lecture :
    // sans ça, `change` ne se déclenche pas une seconde fois.
    if (fileInput.current !== null) {
      fileInput.current.value = '';
    }
    if (file === undefined) return;
    const result = readCharacterFile(await file.text());
    setMessage(formatImportResult(result));
    if (result.kind === 'ok') {
      add(result.draft);
    }
  };

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

      {/* L'étiquette EST le bouton : le champ, invisible, reste au clavier, et
          l'anneau de focus se dessine sur le libellé qui, lui, se voit. */}
      <label className={styles.open}>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className={styles.file}
          onChange={(event) => {
            void openFile(event);
          }}
        />
        <span className={styles.openLabel}>Ouvrir un fichier</span>
      </label>

      {message !== null && (
        <Notice
          tone={message.tone}
          live
          onDismiss={() => {
            setMessage(null);
          }}
        >
          {message.text}
        </Notice>
      )}

      <p className={styles.hint}>
        Un personnage que tu as enregistré depuis ta fiche, sur cet appareil ou un autre.
        Il s’ajoute : rien de ce que tu as ici n’est remplacé.
      </p>

      {/* Les packs valent pour l'appareil, comme cette liste. Ils n'étaient
          atteignables qu'au bas d'une fiche, donc après avoir fait défiler tout
          un personnage pour un réglage qui n'en concerne aucun. */}
      <button type="button" className={styles.packs} onClick={onOpenPacks}>
        <span>Tes packs</span>
        <span className={styles.chevron}>Du contenu écrit à la main</span>
      </button>
    </>
  );
}
