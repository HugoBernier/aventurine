import type { ReactNode } from 'react';
import type { FeatureDraft } from '../../domain/packDraft';
import { TextField } from '../components/TextField';
import styles from './SpellForm.module.css';

const LEVELS = Array.from({ length: 20 }, (_, index) => index + 1);

export interface FeatureEditorProps {
  readonly features: readonly FeatureDraft[];
  /** Une voie donne ses aptitudes à des niveaux ; un peuple les donne toutes. */
  readonly withLevel: boolean;
  readonly onChange: (features: readonly FeatureDraft[]) => void;
}

/**
 * La liste d'aptitudes, partagée par les voies et les peuples : c'est le même
 * geste — un nom, un texte, et pour une voie le niveau où elle arrive.
 */
export function FeatureEditor({
  features,
  withLevel,
  onChange,
}: FeatureEditorProps): ReactNode {
  const set = (index: number, parts: Partial<FeatureDraft>): void => {
    onChange(
      features.map((feature, at) => (at === index ? { ...feature, ...parts } : feature)),
    );
  };
  // Les champs suivent la frappe : le bouton d'envoi retire le focus et
  // valide dans le même geste, et la dernière lettre partirait avec.
  const field = (
    index: number,
    key: 'name' | 'text',
  ): { onCommit: (value: string) => void; onInput: (value: string) => void } => {
    const commit = (value: string): void => {
      set(index, { [key]: value });
    };
    return { onCommit: commit, onInput: commit };
  };

  return (
    <>
      {features.map((feature, index) => (
        // La clé ne suit JAMAIS ce qu'on tape : elle changerait à chaque
        // lettre, React démonterait le champ, et le clavier du téléphone se
        // refermerait. Le rang suffit — rien ne réordonne cette liste.
        <div className={styles.form} key={index}>
          {withLevel && (
            <div className={styles.select}>
              <label className={styles.label} htmlFor={`feature-level-${String(index)}`}>
                À quel niveau
              </label>
              <select
                id={`feature-level-${String(index)}`}
                className={styles.input}
                value={String(feature.level)}
                onChange={(event) => {
                  set(index, { level: Number(event.currentTarget.value) });
                }}
              >
                {LEVELS.map((level) => (
                  <option key={level} value={String(level)}>
                    Niveau {level}
                  </option>
                ))}
              </select>
            </div>
          )}
          <TextField
            label="Le nom de l’aptitude"
            defaultValue={feature.name}
            maxLength={60}
            {...field(index, 'name')}
          />
          <TextField
            label="Ce qu’elle fait, en clair"
            defaultValue={feature.text}
            maxLength={600}
            multiline
            {...field(index, 'text')}
          />
          <button
            type="button"
            className={styles.cancel}
            onClick={() => {
              onChange(features.filter((_, at) => at !== index));
            }}
          >
            Retirer cette aptitude
          </button>
        </div>
      ))}
      <button
        type="button"
        className={styles.cancel}
        onClick={() => {
          onChange([...features, { level: 1, name: '', text: '' }]);
        }}
      >
        + Ajouter une aptitude
      </button>
    </>
  );
}
