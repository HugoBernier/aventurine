import { useState } from 'react';
import type { ReactNode } from 'react';
import type { BackgroundDraft } from '../../domain/packDraft';
import { useCatalogue } from '../../state/hooks';
import { OptionChecklist } from '../components/OptionChecklist';
import { StringListEditor } from '../components/StringListEditor';
import { FormHeader } from '../components/FormHeader';
import { TextField } from '../components/TextField';
import { ChoiceEditor, BACKGROUND_KINDS } from './ChoiceEditor';
import { EquipmentEditor } from './EquipmentEditor';
import styles from './SpellForm.module.css';

const COLUMNS: readonly (readonly [
  'traits' | 'ideals' | 'bonds' | 'flaws',
  string,
  string,
])[] = [
  [
    'traits',
    'Traits de personnalité',
    'Des amorces que le joueur pourra reprendre. Une par ligne.',
  ],
  ['ideals', 'Idéaux', 'Ce en quoi le personnage croit, et qui le fait agir.'],
  ['bonds', 'Liens', 'Ce à quoi il tient, et qui le ramène quelque part.'],
  ['flaws', 'Défauts', 'Ce qui le met dans le pétrin.'],
];

/** Les intitulés des trois colonnes de la carte : ce que le joueur verra
 *  en face de chaque ligne, au moment de choisir. */
const FACT_LABELS = ['Compétences', 'Outils et langues', 'Équipement de départ'];

const FACT_EXAMPLES = ['Perception, Survie', 'Outils de navigateur', 'Perche, 10 po'];

export interface BackgroundFormProps {
  readonly background: BackgroundDraft;
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

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      <FormHeader
        title="Écrire un historique"
        lead="Un historique, c’est ce que le personnage faisait avant de partir à l’aventure. Il lui donne des compétences, du matériel, et de quoi le jouer."
        onCancel={onCancel}
      />
      <TextField
        label="Le nom de l’historique"
        defaultValue={draft.name}
        maxLength={60}
        placeholder="Batelier des brumes"
        {...field('name')}
      />

      <TextField
        label="Ce que tu faisais avant, en une phrase"
        defaultValue={draft.blurb}
        maxLength={600}
        multiline
        {...field('blurb')}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Le résumé qui s’affiche sur sa carte</legend>
        <p className={styles.identifier}>
          Trois lignes courtes, à la même place que sur les autres historiques : c’est ce
          qui permet de les comparer d’un coup d’œil.
        </p>
        {draft.facts.map((fact, index) => (
          // Trois champs de même nature : leur rang EST leur identité, et rien
          // ne les réordonne.
          <TextField
            key={index}
            label={FACT_LABELS[index] ?? ''}
            defaultValue={fact}
            maxLength={120}
            placeholder={FACT_EXAMPLES[index] ?? ''}
            onCommit={(value) => {
              const facts: [string, string, string] = [...draft.facts];
              facts[index] = value;
              change({ facts });
            }}
          />
        ))}
      </fieldset>

      <OptionChecklist
        legend="Les deux compétences qu’il donne"
        options={catalogue.skills}
        checked={draft.skills}
        onChange={(skills) => {
          change({ skills });
        }}
      />
      <OptionChecklist
        legend="Les outils qu’il apprend à manier"
        options={catalogue.tools}
        checked={draft.tools}
        onChange={(tools) => {
          change({ tools });
        }}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ce qu’il laisse choisir au joueur</legend>
        <ChoiceEditor
          kinds={BACKGROUND_KINDS}
          choices={draft.choices}
          onChange={(choices) => {
            change({ choices });
          }}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ce qu’il emporte en partant</legend>
        <EquipmentEditor
          equipment={draft.equipment}
          onChange={(equipment) => {
            change({ equipment });
          }}
        />
      </fieldset>

      <TextField
        label="L’argent qu’il donne, en pièces d’or"
        defaultValue={String(draft.goldPieces)}
        maxLength={4}
        onCommit={(value) => {
          const asked = Number(value);
          change({ goldPieces: Number.isSafeInteger(asked) && asked >= 0 ? asked : 0 });
        }}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ce qu’il permet, hors combat</legend>
        <p className={styles.identifier}>
          Facultatif : une petite chose que ce passé ouvre — un gîte, un contact, une
          entrée quelque part. Laisse le nom vide s’il n’y en a pas.
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
