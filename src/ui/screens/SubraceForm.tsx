import { useState } from 'react';
import type { ReactNode } from 'react';
import { slug } from '../../domain/packDraft';
import type { SubraceDraft } from '../../domain/packDraft';
import { useCatalogue } from '../../state/hooks';
import { OptionChecklist } from '../components/OptionChecklist';
import { TextField } from '../components/TextField';
import { ChoiceEditor } from './ChoiceEditor';
import { FeatureEditor } from './FeatureEditor';
import styles from './SpellForm.module.css';

export interface SubraceFormProps {
  readonly subrace: SubraceDraft;
  readonly packId: string;
  readonly onSave: (subrace: SubraceDraft) => void;
  readonly onCancel: () => void;
}

/**
 * Une branche d'un peuple : le nain des collines, l'elfe des bois. Elle ne
 * répète pas son peuple, elle le précise — d'où les champs vides qui veulent
 * dire « comme le peuple » plutôt que « zéro ».
 */
export function SubraceForm({
  subrace,
  packId,
  onSave,
  onCancel,
}: SubraceFormProps): ReactNode {
  const catalogue = useCatalogue();
  const [draft, setDraft] = useState(subrace);
  const change = (parts: Partial<SubraceDraft>): void => {
    setDraft((current) => ({ ...current, ...parts }));
  };
  const field = (
    key: 'name' | 'blurb',
  ): { onCommit: (value: string) => void; onInput: (value: string) => void } => {
    const commit = (value: string): void => {
      change({ [key]: value });
    };
    return { onCommit: commit, onInput: commit };
  };
  const number =
    (key: 'speed' | 'darkvision' | 'bonusHitPointsPerLevel') =>
    (value: string): void => {
      const asked = Number(value.replace(',', '.'));
      change({ [key]: Number.isFinite(asked) && asked >= 0 ? asked : 0 });
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
        label="Le nom de la branche"
        defaultValue={draft.name}
        maxLength={60}
        placeholder="Brumeux des marais"
        {...field('name')}
      />
      <p className={styles.identifier}>
        Son identifiant : {id === `${packId}-` ? '—' : id}
      </p>

      <TextField
        label="Ce qu’elle est, en une phrase"
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

      <TextField
        label="Points de vie en plus, par niveau"
        defaultValue={String(draft.bonusHitPointsPerLevel)}
        maxLength={1}
        hint="0 pour aucun. Le nain des collines en donne 1."
        onCommit={number('bonusHitPointsPerLevel')}
      />
      <TextField
        label="Sa vitesse, en mètres"
        defaultValue={draft.speed === 0 ? '' : String(draft.speed)}
        maxLength={5}
        hint="Laisse vide pour garder celle du peuple."
        onCommit={number('speed')}
      />
      <TextField
        label="Sa vision dans le noir, en mètres"
        defaultValue={draft.darkvision === 0 ? '' : String(draft.darkvision)}
        maxLength={5}
        hint="Laisse vide pour garder celle du peuple."
        onCommit={number('darkvision')}
      />

      <OptionChecklist
        legend="Les compétences qu’elle donne d’office"
        options={catalogue.skills}
        checked={draft.skills}
        onChange={(skills) => {
          change({ skills });
        }}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ses aptitudes</legend>
        <FeatureEditor
          features={draft.features}
          withLevel={false}
          onChange={(features) => {
            change({ features });
          }}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ce qu’elle laisse choisir</legend>
        <ChoiceEditor
          choices={draft.choices}
          onChange={(choices) => {
            change({ choices });
          }}
        />
      </fieldset>

      <div className={styles.actions}>
        <button type="submit" className={styles.primary}>
          Garder cette branche
        </button>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
