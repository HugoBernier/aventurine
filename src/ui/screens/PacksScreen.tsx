import { useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { usePacks } from '../../state/PacksProvider';
import {
  packFileName,
  packFileText,
  readPackFile,
} from '../../state/persistence/packFile';
import { Explainer } from '../components/Explainer';
import { Notice } from '../components/Notice';
import { formatPackContents, formatPackFileResult, formatPackLine } from '../format/pack';
import { saveFile } from '../saveFile';
import styles from './PacksScreen.module.css';

export interface PacksScreenProps {
  readonly onCreate: () => void;
}

/**
 * Ce qui est installé sur cet appareil, et les trois gestes qui vont avec :
 * en ouvrir un, le réexporter, le retirer.
 *
 * Réexporter n'est pas un luxe : quand la copie perdue est celle de
 * l'ordinateur, le téléphone est le seul chemin de retour.
 */
export function PacksScreen({ onCreate }: PacksScreenProps): ReactNode {
  const { packs, catalogue, install, remove, isStorageFull } = usePacks();
  const [refusals, setRefusals] = useState<readonly string[]>([]);
  const [confirming, setConfirming] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const openFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (fileInput.current !== null) {
      fileInput.current.value = '';
    }
    if (file === undefined) return;
    const result = readPackFile(await file.text(), catalogue);
    setRefusals(formatPackFileResult(result));
    if (result.kind === 'ok') {
      install(result.pack);
    }
  };

  return (
    <>
      <Explainer label="C’est quoi, un pack ?">
        Un fichier qui apporte du contenu écrit à la main — le tien, ou celui qu’on t’a
        envoyé. Tu peux l’installer, le ressortir pour le donner, ou le retirer. Retirer
        un pack ne casse aucun personnage : ce qu’ils en avaient choisi les attend et
        revient avec lui.
      </Explainer>

      {isStorageFull && (
        <Notice tone="error" live>
          Il n’y a plus de place sur cet appareil pour ranger ce pack. Retires-en un avant
          d’en ajouter un autre.
        </Notice>
      )}

      {packs.length === 0 ? (
        <p className={styles.empty}>Tu n’as encore installé aucun pack.</p>
      ) : (
        <ul className={styles.list}>
          {packs.map((pack) => (
            <li className={styles.item} key={pack.info.id}>
              <span className={styles.name}>{pack.info.name}</span>
              <p className={styles.line}>
                {formatPackLine(pack)} · {formatPackContents(pack)}
              </p>
              {pack.info.description !== '' && (
                <p className={styles.description}>{pack.info.description}</p>
              )}
              <span className={styles.actions}>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    saveFile(packFileName(pack), packFileText(pack), 'application/json');
                  }}
                >
                  Enregistrer le fichier
                </button>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    setConfirming(pack.info.id);
                  }}
                >
                  Retirer
                </button>
              </span>

              {confirming === pack.info.id && (
                <p className={styles.confirm}>
                  <span>
                    Retirer {pack.info.name} ? Garde le fichier si tu veux pouvoir le
                    remettre.
                  </span>
                  <span className={styles.actions}>
                    <button
                      type="button"
                      className={styles.danger}
                      onClick={() => {
                        remove(pack.info.id);
                        setConfirming(null);
                      }}
                    >
                      Oui, retirer
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
      )}

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
        <span className={styles.openLabel}>Installer un pack</span>
      </label>

      {refusals.length > 0 && (
        <Notice
          tone="error"
          live
          onDismiss={() => {
            setRefusals([]);
          }}
        >
          Ce pack n’a pas été installé.
          <ul className={styles.refusals}>
            {refusals.map((refusal) => (
              <li key={refusal}>{refusal}</li>
            ))}
          </ul>
        </Notice>
      )}

      <button type="button" className={styles.create} onClick={onCreate}>
        + Écrire un pack
      </button>
      <p className={styles.hint}>
        Le contenu d’un pack n’est pas du SRD : il vient de toi ou de qui te l’a donné.
        Aventurine ne le publie ni ne le partage — il va sur ton appareil, et il en
        revient.
      </p>
    </>
  );
}
