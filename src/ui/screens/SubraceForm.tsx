import { useState } from 'react';
import type { ReactNode } from 'react';
import type { SubraceDraft } from '../../domain/packDraft';
import { useCatalogue } from '../../state/hooks';
import { OptionChecklist } from '../components/OptionChecklist';
import { FormHeader } from '../components/FormHeader';
import { TextField } from '../components/TextField';
import { ChoiceEditor, RACE_KINDS } from './ChoiceEditor';
import { FeatureEditor } from './FeatureEditor';
import styles from './SpellForm.module.css';

/** Les intitulés des trois colonnes de la carte : ce que le joueur verra
 *  en face de chaque ligne, au moment de choisir. */
const FACT_LABELS = ['Caractéristiques', 'Vitesse', 'Ce qu’elle apporte'];

const FACT_EXAMPLES = ['+1 au choix', '7,50 m', '+1 point de vie par niveau'];

export interface SubraceFormProps {
  readonly subrace: SubraceDraft;
  readonly onSave: (subrace: SubraceDraft) => void;
  readonly onCancel: () => void;
}

/**
 * Une branche d'un peuple : le nain des collines, l'elfe des bois. Elle ne
 * répète pas son peuple, elle le précise — d'où les champs vides qui veulent
 * dire « comme le peuple » plutôt que « zéro ».
 */
export function SubraceForm({ subrace, onSave, onCancel }: SubraceFormProps): ReactNode {
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

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      <FormHeader
        title="Écrire une branche"
        lead="Une branche est une variante d’un peuple — le nain des collines, l’elfe des bois. Elle ne répète pas son peuple : elle ajoute ce qui la distingue."
        onCancel={onCancel}
      />
      <TextField
        label="Le nom de la branche"
        defaultValue={draft.name}
        maxLength={60}
        placeholder="Brumeux des marais"
        {...field('name')}
      />

      <TextField
        label="Ce qu’elle est, en une phrase"
        defaultValue={draft.blurb}
        maxLength={600}
        multiline
        {...field('blurb')}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Le résumé qui s’affiche sur sa carte</legend>
        <p className={styles.identifier}>
          Trois lignes courtes, à la même place que sur les autres branches : c’est ce qui
          permet de les comparer d’un coup d’œil.
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

      <TextField
        label="Points de vie en plus, par niveau"
        defaultValue={String(draft.bonusHitPointsPerLevel)}
        maxLength={1}
        hint="En plus de ceux de sa classe, à chaque niveau. 0 pour aucun ; le nain des collines en donne 1."
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
        legend="Les compétences qu’elle donne à tout le monde"
        options={catalogue.skills}
        checked={draft.skills}
        onChange={(skills) => {
          change({ skills });
        }}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ce qu’elle sait faire en plus</legend>
        <FeatureEditor
          features={draft.features}
          withLevel={false}
          onChange={(features) => {
            change({ features });
          }}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ce qu’elle laisse choisir au joueur</legend>
        <ChoiceEditor
          kinds={RACE_KINDS}
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
