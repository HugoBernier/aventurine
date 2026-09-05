import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { slug } from '../../domain/packDraft';
import type { FeatureDraft, SubclassDraft } from '../../domain/packDraft';
import { useCatalogue } from '../../state/hooks';
import { TextField } from '../components/TextField';
import styles from './SpellForm.module.css';

const LEVELS = Array.from({ length: 20 }, (_, index) => index + 1);

export interface SubclassFormProps {
  readonly subclass: SubclassDraft;
  readonly packId: string;
  readonly onSave: (subclass: SubclassDraft) => void;
  readonly onCancel: () => void;
}

/**
 * Écrire une voie qui s'ajoute à une classe existante — un collège de barde,
 * un domaine de clerc. C'est le homebrew le plus courant, et il n'invente
 * aucune classe : la classe visée garde son dé de vie et ses aptitudes, elle
 * gagne une voie de plus.
 */
export function SubclassForm({
  subclass,
  packId,
  onSave,
  onCancel,
}: SubclassFormProps): ReactNode {
  const catalogue = useCatalogue();
  const classId = useId();
  const [draft, setDraft] = useState(subclass);
  const change = (parts: Partial<SubclassDraft>): void => {
    setDraft((current) => ({ ...current, ...parts }));
  };
  const field = (
    key: 'name' | 'blurb',
  ): { onCommit: (value: string) => void; onInput: (value: string) => void } => {
    const set = (value: string): void => {
      change({ [key]: value });
    };
    return { onCommit: set, onInput: set };
  };

  const id = draft.id === '' ? `${packId}-${slug(draft.name)}` : draft.id;

  const setFeature = (index: number, parts: Partial<FeatureDraft>): void => {
    setDraft((current) => ({
      ...current,
      features: current.features.map((feature, at) =>
        at === index ? { ...feature, ...parts } : feature,
      ),
    }));
  };

  /**
   * Ces champs-là aussi suivent la frappe : « Garder cette voie » retire le
   * focus ET envoie le formulaire dans le même geste, et la dernière aptitude
   * saisie partait avec — le pack refusait alors de s'installer, faute
   * d'aptitude, pour un texte que le joueur avait bel et bien écrit.
   */
  const featureField = (
    index: number,
    key: 'name' | 'text',
  ): { onCommit: (value: string) => void; onInput: (value: string) => void } => {
    const set = (value: string): void => {
      setFeature(index, { [key]: value });
    };
    return { onCommit: set, onInput: set };
  };

  const factField = (
    index: number,
  ): { onCommit: (value: string) => void; onInput: (value: string) => void } => {
    const set = (value: string): void => {
      setDraft((current) => {
        const facts: [string, string, string] = [...current.facts];
        facts[index] = value;
        return { ...current, facts };
      });
    };
    return { onCommit: set, onInput: set };
  };

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ ...draft, id });
      }}
    >
      <TextField
        label="Le nom de la voie"
        defaultValue={draft.name}
        maxLength={60}
        placeholder="Collège des brumes"
        {...field('name')}
      />
      <p className={styles.identifier}>
        Son identifiant : {id === `${packId}-` ? '—' : id}
      </p>

      <div className={styles.select}>
        <label className={styles.label} htmlFor={classId}>
          La classe à laquelle elle s’ajoute
        </label>
        <select
          id={classId}
          className={styles.input}
          value={draft.forClassId}
          onChange={(event) => {
            change({ forClassId: event.currentTarget.value });
          }}
        >
          <option value="">À choisir</option>
          {catalogue.classes.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </div>

      <TextField
        label="Ce qu’elle est, en une phrase"
        defaultValue={draft.blurb}
        maxLength={600}
        multiline
        hint="C’est ce qu’on lit sous son nom au moment de choisir."
        {...field('blurb')}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Trois repères, pour comparer</legend>
        {draft.facts.map((fact, index) => (
          <TextField
            // Trois champs de même nature, sans identifiant propre : leur rang
            // EST leur identité, et l'ordre ne change jamais.
            key={index}
            label={`Repère ${String(index + 1)}`}
            defaultValue={fact}
            maxLength={120}
            {...factField(index)}
          />
        ))}
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ses aptitudes, niveau par niveau</legend>
        {draft.features.map((feature, index) => (
          <div className={styles.form} key={`${String(index)}-${feature.name}`}>
            <div className={styles.select}>
              <label
                className={styles.label}
                htmlFor={`${classId}-level-${String(index)}`}
              >
                À quel niveau
              </label>
              <select
                id={`${classId}-level-${String(index)}`}
                className={styles.input}
                value={String(feature.level)}
                onChange={(event) => {
                  setFeature(index, { level: Number(event.currentTarget.value) });
                }}
              >
                {LEVELS.map((level) => (
                  <option key={level} value={String(level)}>
                    Niveau {level}
                  </option>
                ))}
              </select>
            </div>
            <TextField
              label="Son nom"
              defaultValue={feature.name}
              maxLength={60}
              {...featureField(index, 'name')}
            />
            <TextField
              label="Ce qu’elle fait"
              defaultValue={feature.text}
              maxLength={600}
              multiline
              {...featureField(index, 'text')}
            />
            <button
              type="button"
              className={styles.cancel}
              onClick={() => {
                change({
                  features: draft.features.filter((_, at) => at !== index),
                });
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
            change({
              features: [...draft.features, { level: 1, name: '', text: '' }],
            });
          }}
        >
          + Ajouter une aptitude
        </button>
      </fieldset>

      <div className={styles.actions}>
        <button type="submit" className={styles.primary}>
          Garder cette voie
        </button>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
