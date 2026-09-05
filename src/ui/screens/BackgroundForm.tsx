import { useState } from 'react';
import type { ReactNode } from 'react';
import { slug } from '../../domain/packDraft';
import type { BackgroundDraft } from '../../domain/packDraft';
import { useCatalogue } from '../../state/hooks';
import { OptionChecklist } from '../components/OptionChecklist';
import { StringListEditor } from '../components/StringListEditor';
import { TextField } from '../components/TextField';
import { ChoiceEditor, BACKGROUND_KINDS } from './ChoiceEditor';
import { EquipmentEditor } from './EquipmentEditor';
import styles from './SpellForm.module.css';

const COLUMNS: readonly (readonly [
  'traits' | 'ideals' | 'bonds' | 'flaws',
  string,
  string,
])[] = [
  ['traits', 'Traits de personnalité', 'Comment on te reconnaît en trois mots.'],
  ['ideals', 'Idéaux', 'Ce en quoi tu crois, et qui te fait agir.'],
  ['bonds', 'Liens', 'Ce à quoi tu tiens, et qui te ramène quelque part.'],
  ['flaws', 'Défauts', 'Ce qui te met dans le pétrin.'],
];

export interface BackgroundFormProps {
  readonly background: BackgroundDraft;
  readonly packId: string;
  readonly onSave: (background: BackgroundDraft) => void;
  readonly onCancel: () => void;
}

/**
 * Écrire un historique. C'est l'entrée la plus autonome du format : elle ne
 * nomme ni classe ni peuple, seulement des compétences, des outils et des
 * objets. Un pack d'historiques seuls est donc un fichier parfaitement normal.
 */
export function BackgroundForm({
  background,
  packId,
  onSave,
  onCancel,
}: BackgroundFormProps): ReactNode {
  const catalogue = useCatalogue();
  const [draft, setDraft] = useState(background);
  const change = (parts: Partial<BackgroundDraft>): void => {
    setDraft((current) => ({ ...current, ...parts }));
  };
  const field = (
    key: 'name' | 'blurb' | 'featureName' | 'featureText',
  ): { onCommit: (value: string) => void; onInput: (value: string) => void } => {
    const commit = (value: string): void => {
      change({ [key]: value });
    };
    return { onCommit: commit, onInput: commit };
  };

  const id = draft.id === '' ? `${packId}-${slug(draft.name)}` : draft.id;

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ ...draft, id });
      }}
    >
      <TextField
        label="Le nom de l’historique"
        defaultValue={draft.name}
        maxLength={60}
        placeholder="Batelier des brumes"
        {...field('name')}
      />
      <p className={styles.identifier}>
        Son identifiant : {id === `${packId}-` ? '—' : id}
      </p>

      <TextField
        label="Ce que tu faisais avant, en une phrase"
        defaultValue={draft.blurb}
        maxLength={600}
        multiline
        {...field('blurb')}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Trois repères, pour comparer</legend>
        {draft.facts.map((fact, index) => (
          // Trois champs de même nature : leur rang EST leur identité.
          <TextField
            key={index}
            label={`Repère ${String(index + 1)}`}
            defaultValue={fact}
            maxLength={120}
            onCommit={(value) => {
              const facts: [string, string, string] = [...draft.facts];
              facts[index] = value;
              change({ facts });
            }}
          />
        ))}
      </fieldset>

      <OptionChecklist
        legend="Les compétences qu’il donne"
        options={catalogue.skills}
        checked={draft.skills}
        onChange={(skills) => {
          change({ skills });
        }}
      />
      <OptionChecklist
        legend="Les outils qu’il apprend"
        options={catalogue.tools}
        checked={draft.tools}
        onChange={(tools) => {
          change({ tools });
        }}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ce qu’il laisse choisir</legend>
        <ChoiceEditor
          kinds={BACKGROUND_KINDS}
          choices={draft.choices}
          onChange={(choices) => {
            change({ choices });
          }}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>L’équipement de départ</legend>
        <EquipmentEditor
          equipment={draft.equipment}
          onChange={(equipment) => {
            change({ equipment });
          }}
        />
      </fieldset>

      <TextField
        label="Les pièces d’or qu’il donne"
        defaultValue={String(draft.goldPieces)}
        maxLength={4}
        onCommit={(value) => {
          const asked = Number(value);
          change({ goldPieces: Number.isSafeInteger(asked) && asked >= 0 ? asked : 0 });
        }}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Son aptitude</legend>
        <p className={styles.identifier}>
          Facultative. Laisse le nom vide s’il n’en donne aucune.
        </p>
        <TextField
          label="Son nom"
          defaultValue={draft.featureName}
          maxLength={60}
          {...field('featureName')}
        />
        <TextField
          label="Ce qu’elle fait"
          defaultValue={draft.featureText}
          maxLength={600}
          multiline
          {...field('featureText')}
        />
      </fieldset>

      {COLUMNS.map(([key, legend, hint]) => (
        <StringListEditor
          key={key}
          legend={legend}
          hint={hint}
          lines={draft[key]}
          onChange={(lines) => {
            change({ [key]: lines });
          }}
        />
      ))}

      <div className={styles.actions}>
        <button type="submit" className={styles.primary}>
          Garder cet historique
        </button>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
