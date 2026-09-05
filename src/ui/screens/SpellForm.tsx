import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import type { SpellLevel } from '../../domain/content';
import type { SpellDraft } from '../../domain/packDraft';
import { useCatalogue } from '../../state/hooks';
import { FormHeader } from '../components/FormHeader';
import { TextField } from '../components/TextField';
import { MAGIC_SCHOOLS } from '../format/spellSchool';
import styles from './SpellForm.module.css';

const LEVELS: readonly SpellLevel[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export interface SpellFormProps {
  readonly spell: SpellDraft;
  readonly onSave: (spell: SpellDraft) => void;
  readonly onCancel: () => void;
}

/**
 * L'écran au clavier assumé de la charte : on écrit un sort une fois, chez
 * soi, avec ses champs sous les yeux — pas à table, au pouce. Une colonne
 * quand même, et des zones de 44 px : le téléphone reste utilisable.
 */
export function SpellForm({ spell, onSave, onCancel }: SpellFormProps): ReactNode {
  const catalogue = useCatalogue();
  const levelId = useId();
  const schoolId = useId();
  const [draft, setDraft] = useState(spell);
  const change = (parts: Partial<SpellDraft>): void => {
    setDraft((current) => ({ ...current, ...parts }));
  };
  /**
   * Les champs suivent la frappe ici, alors qu'ils attendent le `blur`
   * ailleurs : une touche ne déclenche qu'un état local, et « Entrée » dans un
   * champ envoie le formulaire sans passer par le `blur` — la dernière lettre
   * serait perdue.
   */
  const field = (
    key: 'name' | 'castingTime' | 'range' | 'duration' | 'material' | 'summary',
  ): { onCommit: (value: string) => void; onInput: (value: string) => void } => {
    const set = (value: string): void => {
      change({ [key]: value });
    };
    return { onCommit: set, onInput: set };
  };

  // L'identifiant se fixe à la création et ne bouge plus : les fiches qui ont
  // choisi ce sort le nomment, et le renommer les couperait de lui.
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      <FormHeader
        title="Écrire un sort"
        lead="Un sort, c’est ce qu’un personnage lance en jeu. Donne-lui un nom, dis ce qu’il fait, et qui a le droit de s’en servir."
        onCancel={onCancel}
      />
      <TextField
        label="Le nom du sort"
        defaultValue={draft.name}
        maxLength={60}
        {...field('name')}
      />

      <div className={styles.row}>
        <div className={styles.select}>
          <label className={styles.label} htmlFor={levelId}>
            Son niveau
          </label>
          <select
            id={levelId}
            className={styles.input}
            value={String(draft.level)}
            onChange={(event) => {
              const chosen = Number(event.currentTarget.value);
              change({ level: LEVELS.find((level) => level === chosen) ?? 0 });
            }}
          >
            {LEVELS.map((level) => (
              <option key={level} value={String(level)}>
                {level === 0 ? 'Tour de magie' : `Niveau ${String(level)}`}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.select}>
          <label className={styles.label} htmlFor={schoolId}>
            Son école
          </label>
          <select
            id={schoolId}
            className={styles.input}
            value={draft.school}
            onChange={(event) => {
              change({ school: event.currentTarget.value });
            }}
          >
            {MAGIC_SCHOOLS.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name} — {school.purpose}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TextField
        label="Le temps d’incantation"
        defaultValue={draft.castingTime}
        maxLength={120}
        hint="Le temps qu’il faut pour le lancer. « 1 action », « 1 action bonus », « 1 minute »."
        {...field('castingTime')}
      />
      <TextField
        label="La portée"
        defaultValue={draft.range}
        maxLength={120}
        hint="Jusqu’où il porte. « contact », « 18 mètres », « personnelle »."
        {...field('range')}
      />
      <TextField
        label="La durée"
        defaultValue={draft.duration}
        maxLength={120}
        hint="Combien de temps l’effet dure. « instantanée », « 1 heure », « 10 minutes »."
        {...field('duration')}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Ce qu’il faut pour le lancer</legend>
        <div className={styles.checks}>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={draft.verbal}
              onChange={(event) => {
                change({ verbal: event.currentTarget.checked });
              }}
            />
            Des paroles
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={draft.somatic}
              onChange={(event) => {
                change({ somatic: event.currentTarget.checked });
              }}
            />
            Des gestes
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={draft.concentration}
              onChange={(event) => {
                change({ concentration: event.currentTarget.checked });
              }}
            />
            De la concentration (il s’arrête si on en lance un autre)
          </label>
          <label className={styles.check}>
            <input
              type="checkbox"
              checked={draft.ritual}
              onChange={(event) => {
                change({ ritual: event.currentTarget.checked });
              }}
            />
            Il peut se lancer en rituel (plus lentement, sans dépenser d’emplacement)
          </label>
        </div>
      </fieldset>

      <TextField
        label="Le composant matériel"
        defaultValue={draft.material}
        maxLength={120}
        hint="Un objet à tenir en le lançant. Laisse vide s’il n’en faut aucun."
        {...field('material')}
      />

      <TextField
        label="Ce qu’il fait"
        defaultValue={draft.summary}
        maxLength={600}
        multiline
        hint="Une à trois phrases, comme sur une carte de sort. C’est ce que le joueur lira à table."
        {...field('summary')}
      />

      <fieldset className={styles.group}>
        <legend className={styles.legend}>Quelles classes y ont droit</legend>
        <div className={styles.checks}>
          {catalogue.classes.map((entry) => (
            <label className={styles.check} key={entry.id}>
              <input
                type="checkbox"
                checked={draft.classes.includes(entry.id)}
                onChange={(event) => {
                  change({
                    classes: event.currentTarget.checked
                      ? [...draft.classes, entry.id]
                      : draft.classes.filter((kept) => kept !== entry.id),
                  });
                }}
              />
              {entry.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className={styles.actions}>
        <button type="submit" className={styles.primary}>
          Garder ce sort
        </button>
        <button type="button" className={styles.cancel} onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
