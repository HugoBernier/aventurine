import { useState } from 'react';
import type { ReactNode } from 'react';
import { emptySubraceDraft, slug } from '../../domain/packDraft';
import type { RaceDraft, SubraceDraft } from '../../domain/packDraft';
import { useCatalogue } from '../../state/hooks';
import { OptionChecklist } from '../components/OptionChecklist';
import { TextField } from '../components/TextField';
import { DAMAGE_TYPE_OPTIONS } from '../format/damageTypes';
import { ChoiceEditor, RACE_KINDS } from './ChoiceEditor';
import { FeatureEditor } from './FeatureEditor';
import { SubraceForm } from './SubraceForm';
import styles from './SpellForm.module.css';

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

  const id = draft.id === '' ? `${packId}-${slug(draft.name)}` : draft.id;

  if (editing !== null) {
    return (
      // Le préfixe d'une branche est celui du PACK, pas du peuple : sinon
      // « Brumeux des marais » sous le peuple « Brumeux » donnerait
      // `karn-brumeux-brumeux-des-marais`, là où le SRD écrit
      // `nain-des-collines` sous `nain`.
      <SubraceForm
        subrace={editing}
        packId={packId}
        onSave={(subrace) => {
          const isKnown = draft.subraces.some((entry) => entry.id === subrace.id);
          change({
            subraces: isKnown
              ? draft.subraces.map((entry) => (entry.id === subrace.id ? subrace : entry))
              : [...draft.subraces, subrace],
          });
          setEditing(null);
        }}
        onCancel={() => {
          setEditing(null);
        }}
      />
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ ...draft, id });
      }}
    >
      <TextField
        label="Le nom du peuple"
        defaultValue={draft.name}
        maxLength={60}
        placeholder="Brumeux"
        {...field('name')}
      />
      <p className={styles.identifier}>
        Son identifiant : {id === `${packId}-` ? '—' : id}
      </p>

      <TextField
        label="Ce qu’il est, en une phrase"
        defaultValue={draft.blurb}
        maxLength={600}
        multiline
        hint="C’est ce qu’on lit sous son nom au moment de choisir."
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
        hint="9 pour la plupart, 7,50 pour les petites tailles."
        onCommit={number('speed')}
      />
      <TextField
        label="Sa vision dans le noir, en mètres"
        defaultValue={draft.darkvision === 0 ? '' : String(draft.darkvision)}
        maxLength={5}
        hint="Laisse vide s’il voit comme un humain."
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
        +1 dans les six caractéristiques, comme l’humain
      </label>
      <p className={styles.identifier}>
        Sinon, ajoute un choix « bonus de caractéristique à placer » plus bas : c’est le
        joueur qui décide où il va.
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
        legend="Les compétences qu’il donne d’office"
        options={catalogue.skills}
        checked={draft.skills}
        onChange={(skills) => {
          change({ skills });
        }}
      />
      <OptionChecklist
        legend="Ce à quoi il résiste"
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
        <legend className={styles.legend}>Ce qu’il laisse choisir</legend>
        <ChoiceEditor
          kinds={RACE_KINDS}
          choices={draft.choices}
          onChange={(choices) => {
            change({ choices });
          }}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ses branches</legend>
        <p className={styles.identifier}>
          Facultatif. Le nain a ses collines et ses montagnes ; beaucoup de peuples n’en
          ont aucune.
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
