import { useState } from 'react';
import type { ReactNode } from 'react';
import type { ClassDraft } from '../../domain/packDraft';
import { useCatalogue } from '../../state/hooks';
import { OptionChecklist } from '../components/OptionChecklist';
import { FormHeader } from '../components/FormHeader';
import { TextField } from '../components/TextField';
import { ChoiceEditor, CLASS_KINDS } from './ChoiceEditor';
import { EquipmentEditor } from './EquipmentEditor';
import { EquipmentOptionEditor } from './EquipmentOptionEditor';
import { FeatureEditor } from './FeatureEditor';
import styles from './SpellForm.module.css';

const HIT_DICE = [6, 8, 10, 12] as const;
const LEVELS = Array.from({ length: 20 }, (_, index) => index + 1);

const ARMOR = [
  { id: 'legere', name: 'Armures légères' },
  { id: 'intermediaire', name: 'Armures intermédiaires' },
  { id: 'lourde', name: 'Armures lourdes' },
  { id: 'bouclier', name: 'Boucliers' },
];

const WEAPON_CATEGORIES = [
  { id: 'courantes', name: 'Armes courantes' },
  { id: 'de-guerre', name: 'Armes de guerre' },
];

const PROGRESSIONS = [
  ['full', 'Complet — magicien, clerc, barde'],
  ['half', 'À moitié — paladin, rôdeur'],
  ['pact', 'De pacte — occultiste'],
] as const;

const PREPARATIONS = [
  ['known', 'Il connaît ses sorts, une fois pour toutes'],
  ['prepared', 'Il les prépare chaque matin'],
  ['spellbook', 'Il les copie dans un grimoire'],
] as const;

/** Les intitulés des trois colonnes de la carte : ce que le joueur verra
 *  en face de chaque ligne, au moment de choisir. */
const FACT_LABELS = ['Dé de vie', 'Jets de sauvegarde', 'Ce qu’elle apporte'];

const FACT_EXAMPLES = ['d8', 'Dextérité + Sagesse', 'Lanceur de sorts'];

export interface ClassFormProps {
  readonly entry: ClassDraft;
  readonly onSave: (entry: ClassDraft) => void;
  readonly onCancel: () => void;
}

/**
 * Écrire une classe. Ses voies ne sont pas ici : elles s'écrivent à côté, avec
 * les autres, et nomment cette classe — un seul écran pour toutes les voies,
 * qu'elles s'ajoutent au barde du SRD ou à celle qu'on vient d'inventer.
 */
export function ClassForm({ entry, onSave, onCancel }: ClassFormProps): ReactNode {
  const catalogue = useCatalogue();
  const [draft, setDraft] = useState(entry);
  const change = (parts: Partial<ClassDraft>): void => {
    setDraft((current) => ({ ...current, ...parts }));
  };
  const field = (
    key: 'name' | 'blurb' | 'subclassTitle' | 'subclassHelp',
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
        title="Écrire une classe"
        lead="Une classe, c’est le métier d’aventurier : guerrier, magicien. Elle décide de sa résistance, de ce qu’il sait faire au combat, et s’il lance des sorts."
        onCancel={onCancel}
      />
      <TextField
        label="Le nom de la classe"
        defaultValue={draft.name}
        maxLength={60}
        placeholder="Brumeur"
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
          Trois lignes courtes, à la même place que sur les autres classes : c’est ce qui
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

      <div className={styles.select}>
        <label className={styles.label} htmlFor="class-hit-die">
          Son dé de vie
        </label>
        <select
          id="class-hit-die"
          className={styles.input}
          value={String(draft.hitDie)}
          onChange={(event) => {
            const asked = Number(event.currentTarget.value);
            change({ hitDie: HIT_DICE.find((die) => die === asked) ?? 8 });
          }}
        >
          {HIT_DICE.map((die) => (
            <option key={die} value={String(die)}>
              d{die}
            </option>
          ))}
        </select>
      </div>

      <OptionChecklist
        legend="Les deux caractéristiques où elle résiste le mieux"
        options={catalogue.abilities}
        checked={draft.saves}
        onChange={(saves) => {
          // Deux, jamais plus : cocher un troisième remplace le plus ancien.
          change({ saves: saves.slice(-2) });
        }}
      />

      <OptionChecklist
        legend="Les armures qu’elle sait porter"
        options={ARMOR}
        checked={draft.armor}
        onChange={(armor) => {
          change({ armor });
        }}
      />
      <OptionChecklist
        legend="Les familles d’armes qu’elle sait manier"
        options={WEAPON_CATEGORIES}
        checked={draft.weaponCategories}
        onChange={(weaponCategories) => {
          change({ weaponCategories });
        }}
      />
      <OptionChecklist
        legend="Les armes précises qu’elle ajoute en plus"
        options={catalogue.weapons}
        checked={draft.weapons}
        onChange={(weapons) => {
          change({ weapons });
        }}
      />
      <OptionChecklist
        legend="Les outils qu’elle apprend à manier"
        options={catalogue.tools}
        checked={draft.tools}
        onChange={(tools) => {
          change({ tools });
        }}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ce qu’elle apporte, niveau par niveau</legend>
        <FeatureEditor
          features={draft.features}
          withLevel
          onChange={(features) => {
            change({ features });
          }}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Le matériel entre lequel il choisira</legend>
        <p className={styles.identifier}>
          Écris d’abord les paquets, puis descends jusqu’à « ce qu’elle laisse choisir au
          joueur » et ajoute un choix de matériel pour les lui proposer.
        </p>
        <EquipmentOptionEditor
          options={draft.equipmentOptions}
          onChange={(equipmentOptions) => {
            change({ equipmentOptions });
          }}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>
          Le matériel qu’elle donne à tout le monde
        </legend>
        <EquipmentEditor
          equipment={draft.fixedEquipment}
          onChange={(fixedEquipment) => {
            change({ fixedEquipment });
          }}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ce qu’elle laisse choisir au joueur</legend>
        <ChoiceEditor
          kinds={CLASS_KINDS}
          equipmentOptions={draft.equipmentOptions}
          choices={draft.choices}
          onChange={(choices) => {
            change({ choices });
          }}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Est-ce qu’elle lance des sorts ?</legend>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={draft.casts}
            onChange={(event) => {
              change({ casts: event.currentTarget.checked });
            }}
          />
          Elle lance des sorts
        </label>
        {draft.casts && (
          <>
            <div className={styles.select}>
              <label className={styles.label} htmlFor="class-casting-ability">
                Avec quelle caractéristique elle lance
              </label>
              <select
                id="class-casting-ability"
                className={styles.input}
                value={draft.castingAbility}
                onChange={(event) => {
                  change({ castingAbility: event.currentTarget.value });
                }}
              >
                {catalogue.abilities.map((ability) => (
                  <option key={ability.id} value={ability.id}>
                    {ability.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.select}>
              <label className={styles.label} htmlFor="class-progression">
                À quelle vitesse sa magie monte
              </label>
              <select
                id="class-progression"
                className={styles.input}
                value={draft.progression}
                onChange={(event) => {
                  change({ progression: event.currentTarget.value });
                }}
              >
                {PROGRESSIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.select}>
              <label className={styles.label} htmlFor="class-preparation">
                Comment elle accède à ses sorts
              </label>
              <select
                id="class-preparation"
                className={styles.input}
                value={draft.preparation}
                onChange={(event) => {
                  change({ preparation: event.currentTarget.value });
                }}
              >
                {PREPARATIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={draft.ritual}
                onChange={(event) => {
                  change({ ritual: event.currentTarget.checked });
                }}
              />
              Elle peut lancer des rituels
            </label>
          </>
        )}
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Sa spécialité</legend>
        <p className={styles.identifier}>
          Chaque classe fait choisir une spécialité en cours de route : le collège d’un
          barde, le domaine d’un clerc. Tu les écris à côté, dans « tes voies ».
        </p>
        <div className={styles.select}>
          <label className={styles.label} htmlFor="class-subclass-level">
            À quel niveau le joueur la choisit
          </label>
          <select
            id="class-subclass-level"
            className={styles.input}
            value={String(draft.subclassLevel)}
            onChange={(event) => {
              change({ subclassLevel: Number(event.currentTarget.value) });
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
          label="Comment la classe l’appelle"
          defaultValue={draft.subclassTitle}
          maxLength={120}
          hint="Le titre de l’écran de choix. « Ton collège bardique », « Ton domaine divin »."
          {...field('subclassTitle')}
        />
        <TextField
          label="La phrase qui aide à répondre"
          defaultValue={draft.subclassHelp}
          maxLength={600}
          multiline
          {...field('subclassHelp')}
        />
      </fieldset>

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Quand le personnage se muscle</legend>
        <p className={styles.identifier}>
          Aux niveaux cochés, le joueur monte ses caractéristiques ou prend un don. La
          plupart des classes le font aux niveaux 4, 8, 12, 16 et 19.
        </p>
        <OptionChecklist
          legend="Les niveaux"
          options={LEVELS.slice(1).map((level) => ({
            id: String(level),
            name: `Niveau ${String(level)}`,
          }))}
          checked={draft.advancements.map(String)}
          onChange={(levels) => {
            change({ advancements: levels.map(Number) });
          }}
        />
      </fieldset>

      <div className={styles.actions}>
        <button type="submit" className={styles.primary}>
          Garder cette classe
        </button>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
