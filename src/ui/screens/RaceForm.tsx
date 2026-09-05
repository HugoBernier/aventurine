import { useState } from 'react';
import type { ReactNode } from 'react';
import { emptySubraceDraft, uniqueId } from '../../domain/packDraft';
import type { RaceDraft, SubraceDraft } from '../../domain/packDraft';
import { useCatalogue } from '../../state/hooks';
import { OptionChecklist } from '../components/OptionChecklist';
import { FormHeader } from '../components/FormHeader';
import { TextField } from '../components/TextField';
import { DAMAGE_TYPE_OPTIONS } from '../format/damageTypes';
import { ChoiceEditor, RACE_KINDS } from './ChoiceEditor';
import { FeatureEditor } from './FeatureEditor';
import { SubraceForm } from './SubraceForm';
import styles from './SpellForm.module.css';

/** Les intitulés des trois colonnes de la carte : ce que le joueur verra
 *  en face de chaque ligne, au moment de choisir. */
const FACT_LABELS = ['Caractéristiques', 'Taille et vitesse', 'Ce qu’il apporte'];

const FACT_EXAMPLES = [
  '+2 au choix',
  '7,50 m · taille moyenne',
  'Vision 18 m, résiste au poison',
];

export interface RaceFormProps {
  readonly race: RaceDraft;
  readonly packId: string;
  readonly onSave: (race: RaceDraft) => void;
  readonly onCancel: () => void;
}

/**
 * Écrire un peuple. Le plus gros formulaire du créateur, et celui qui justifie
 * le mieux l'exception au « mobile d'abord » : on écrit un peuple une fois,
 * chez soi, avec ses vingt champs sous les yeux.
 */
export function RaceForm({ race, packId, onSave, onCancel }: RaceFormProps): ReactNode {
  const catalogue = useCatalogue();
  const [draft, setDraft] = useState(race);
  const [editing, setEditing] = useState<SubraceDraft | null>(null);
  const change = (parts: Partial<RaceDraft>): void => {
    setDraft((current) => ({ ...current, ...parts }));
  };

  if (editing !== null) {
    return (
      // Le préfixe d'une branche est celui du PACK, pas du peuple : sinon
      // « Brumeux des marais » sous le peuple « Brumeux » donnerait
      // `karn-brumeux-brumeux-des-marais`, là où le SRD écrit
      // `nain-des-collines` sous `nain`.
      <SubraceForm
        subrace={editing}
        onSave={(subrace) => {
          const isKnown = subrace.id !== '';
          change({
            subraces: isKnown
              ? draft.subraces.map((entry) => (entry.id === subrace.id ? subrace : entry))
              : [
                  ...draft.subraces,
                  {
                    ...subrace,
                    id: uniqueId(
                      packId,
                      subrace.name,
                      draft.subraces.map((entry) => entry.id),
                    ),
                  },
                ],
          });
          setEditing(null);
        }}
        onCancel={() => {
          setEditing(null);
        }}
      />
    );
  }

  const field = (
    key: 'name' | 'blurb',
  ): { onCommit: (value: string) => void; onInput: (value: string) => void } => {
    const commit = (value: string): void => {
      change({ [key]: value });
    };
    return { onCommit: commit, onInput: commit };
  };
  const number =
    (key: 'speed' | 'darkvision') =>
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
        title="Écrire un peuple"
        lead="Un peuple, c’est ce qu’on est de naissance : un nain, un elfe. Remplis ce que tu sais, laisse le reste — tu pourras y revenir."
        onCancel={onCancel}
      />
      <TextField
        label="Le nom du peuple"
        defaultValue={draft.name}
        maxLength={60}
        placeholder="Brumeux"
        {...field('name')}
      />

      <TextField
        label="Ce qu’il est, en une phrase"
        defaultValue={draft.blurb}
        maxLength={600}
        multiline
        hint="On la lit sous son nom au moment de choisir. Écris-la comme tu la raconterais."
        {...field('blurb')}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Le résumé qui s’affiche sur sa carte</legend>
        <p className={styles.identifier}>
          Trois lignes courtes, à la même place que sur les autres peuples : c’est ce qui
          permet de les comparer d’un coup d’œil. Écris ce qui se lit, pas les règles.
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

      <div className={styles.select}>
        <label className={styles.label} htmlFor="race-size">
          Sa taille
        </label>
        <select
          id="race-size"
          className={styles.input}
          value={draft.size}
          onChange={(event) => {
            change({ size: event.currentTarget.value === 'P' ? 'P' : 'M' });
          }}
        >
          <option value="M">Moyenne — humain, elfe, nain</option>
          <option value="P">Petite — halfelin, gnome</option>
        </select>
      </div>

      <TextField
        label="Sa vitesse, en mètres"
        defaultValue={String(draft.speed)}
        maxLength={5}
        hint="La distance qu’il parcourt en un tour. 9 pour la plupart, 7,50 pour les petites tailles."
        onCommit={number('speed')}
      />
      <TextField
        label="Sa vision dans le noir, en mètres"
        defaultValue={draft.darkvision === 0 ? '' : String(draft.darkvision)}
        maxLength={5}
        hint="Jusqu’où il voit sans lumière. Laisse vide s’il voit comme un humain."
        onCommit={number('darkvision')}
      />

      <label className={styles.check}>
        <input
          type="checkbox"
          checked={draft.everyAbilityPlusOne}
          onChange={(event) => {
            change({ everyAbilityPlusOne: event.currentTarget.checked });
          }}
        />
        Il donne +1 dans les six caractéristiques (c’est le cas de l’humain, et de lui
        seul)
      </label>
      <p className={styles.identifier}>
        Sinon, descends jusqu’à « ce qu’il laisse choisir » et ajoute un bonus à placer :
        c’est alors le joueur qui décide où il va.
      </p>

      <OptionChecklist
        legend="Les langues qu’il parle"
        options={catalogue.languages}
        checked={draft.languages}
        onChange={(languages) => {
          change({ languages });
        }}
      />
      <OptionChecklist
        legend="Les compétences qu’il donne à tout le monde"
        options={catalogue.skills}
        checked={draft.skills}
        onChange={(skills) => {
          change({ skills });
        }}
      />
      <OptionChecklist
        legend="Ce qui lui fait moitié moins de mal"
        options={DAMAGE_TYPE_OPTIONS}
        checked={draft.resistances}
        onChange={(resistances) => {
          change({ resistances });
        }}
      />
      <OptionChecklist
        legend="Les armes qu’il sait manier"
        options={catalogue.weapons}
        checked={draft.weapons}
        onChange={(weapons) => {
          change({ weapons });
        }}
      />
      <OptionChecklist
        legend="Les outils qu’il sait employer"
        options={catalogue.tools}
        checked={draft.tools}
        onChange={(tools) => {
          change({ tools });
        }}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ce qu’il sait faire</legend>
        <FeatureEditor
          features={draft.features}
          withLevel={false}
          onChange={(features) => {
            change({ features });
          }}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ce qu’il laisse choisir au joueur</legend>
        <ChoiceEditor
          kinds={RACE_KINDS}
          choices={draft.choices}
          onChange={(choices) => {
            change({ choices });
          }}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ses variantes</legend>
        <p className={styles.identifier}>
          Facultatif. Le nain a celui des collines et celui des montagnes ; beaucoup de
          peuples n’en ont aucune.
        </p>
        {draft.subraces.map((subrace) => (
          <div className={styles.actions} key={subrace.id}>
            <span className={styles.label}>
              {subrace.name === '' ? 'Sans nom' : subrace.name}
            </span>
            <button
              type="button"
              className={styles.cancel}
              onClick={() => {
                setEditing(subrace);
              }}
            >
              Modifier
            </button>
            <button
              type="button"
              className={styles.cancel}
              onClick={() => {
                change({
                  subraces: draft.subraces.filter((entry) => entry.id !== subrace.id),
                });
              }}
            >
              Retirer
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.cancel}
          onClick={() => {
            setEditing(emptySubraceDraft());
          }}
        >
          + Ajouter une branche
        </button>
      </fieldset>

      <div className={styles.actions}>
        <button type="submit" className={styles.primary}>
          Garder ce peuple
        </button>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
