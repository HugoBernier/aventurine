import type { ReactNode } from 'react';
import type { ChoiceDraft } from '../../domain/packDraft';
import { useCatalogue } from '../../state/hooks';
import { OptionChecklist } from '../components/OptionChecklist';
import { TextField } from '../components/TextField';
import styles from './SpellForm.module.css';

type Kind = ChoiceDraft['kind'];

const KINDS: readonly (readonly [Kind, string])[] = [
  ['skill', 'Une compétence à choisir'],
  ['language', 'Une langue à choisir'],
  ['tool', 'Un outil à choisir'],
  ['ability', 'Un bonus de caractéristique à placer'],
  ['cantrip', 'Un tour de magie'],
  ['ancestry', 'Une ascendance draconique'],
];

/** Les genres qui listent des options ; les autres n'en ont pas à cocher. */
const LISTED = new Set<Kind>(['skill', 'language', 'tool']);

/** Un nombre de choix qui reste jouable : un, et pas plus de six. */
function bounded(value: string): number {
  const asked = Number(value);
  return Number.isFinite(asked) ? Math.min(Math.max(Math.trunc(asked), 1), 6) : 1;
}

export interface ChoiceEditorProps {
  readonly choices: readonly ChoiceDraft[];
  readonly onChange: (choices: readonly ChoiceDraft[]) => void;
}

/**
 * Les choix qu'un peuple laisse au joueur. Un seul éditeur pour les six
 * genres : ils partagent leur titre, leur aide et leur nombre, et ne diffèrent
 * que par ce qu'ils listent.
 *
 * Le `subject` ne s'édite pas. Il est fixé à la création, parce que le créneau
 * d'un personnage le porte — `race:karn-brumeux:skills` — et que le changer
 * couperait les fiches de leur réponse.
 */
export function ChoiceEditor({ choices, onChange }: ChoiceEditorProps): ReactNode {
  const catalogue = useCatalogue();

  const optionsFor = (kind: Kind): readonly { id: string; name: string }[] => {
    if (kind === 'skill') return catalogue.skills;
    if (kind === 'language') return catalogue.languages;
    return kind === 'tool' ? catalogue.tools : [];
  };

  const set = (index: number, parts: Partial<ChoiceDraft>): void => {
    onChange(
      choices.map((choice, at) => (at === index ? { ...choice, ...parts } : choice)),
    );
  };
  const field = (
    index: number,
    key: 'title' | 'help',
  ): { onCommit: (value: string) => void; onInput: (value: string) => void } => {
    const commit = (value: string): void => {
      set(index, { [key]: value });
    };
    return { onCommit: commit, onInput: commit };
  };

  return (
    <>
      {choices.map((choice, index) => (
        <div className={styles.form} key={choice.subject}>
          <div className={styles.select}>
            <label className={styles.label} htmlFor={`choice-kind-${String(index)}`}>
              Ce que le joueur choisit
            </label>
            <select
              id={`choice-kind-${String(index)}`}
              className={styles.input}
              value={choice.kind}
              onChange={(event) => {
                const chosen = event.currentTarget.value;
                const kind = KINDS.find(([id]) => id === chosen)?.[0];
                set(index, { kind: kind ?? 'skill', from: [] });
              }}
            >
              {KINDS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <TextField
            label="La question posée"
            defaultValue={choice.title}
            maxLength={120}
            hint="« Où mettre ton +2 ? », « L’outil de ton clan »."
            {...field(index, 'title')}
          />
          <TextField
            label="L’explication en dessous"
            defaultValue={choice.help}
            maxLength={600}
            multiline
            {...field(index, 'help')}
          />

          {choice.kind === 'ability' && (
            <div className={styles.select}>
              <label className={styles.label} htmlFor={`choice-bonus-${String(index)}`}>
                Combien de points
              </label>
              <select
                id={`choice-bonus-${String(index)}`}
                className={styles.input}
                value={String(choice.bonus)}
                onChange={(event) => {
                  set(index, { bonus: Number(event.currentTarget.value) });
                }}
              >
                <option value="1">+1 à placer</option>
                <option value="2">+2 à placer</option>
              </select>
            </div>
          )}

          {choice.kind === 'cantrip' && (
            <div className={styles.select}>
              <label className={styles.label} htmlFor={`choice-list-${String(index)}`}>
                Dans la liste de quelle classe
              </label>
              <select
                id={`choice-list-${String(index)}`}
                className={styles.input}
                value={choice.listFrom}
                onChange={(event) => {
                  set(index, { listFrom: event.currentTarget.value });
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
          )}

          {LISTED.has(choice.kind) && (
            <>
              <OptionChecklist
                legend="Parmi lesquelles"
                options={optionsFor(choice.kind)}
                checked={choice.from}
                onChange={(from) => {
                  set(index, { from });
                }}
              />
              <TextField
                label="Combien en choisir"
                defaultValue={String(choice.pick)}
                maxLength={1}
                onCommit={(value) => {
                  set(index, { pick: bounded(value) });
                }}
              />
            </>
          )}

          <button
            type="button"
            className={styles.cancel}
            onClick={() => {
              onChange(choices.filter((_, at) => at !== index));
            }}
          >
            Retirer ce choix
          </button>
        </div>
      ))}
      <button
        type="button"
        className={styles.cancel}
        onClick={() => {
          // Le sujet est unique dans l'entrée et n'en bouge plus : c'est lui
          // qui nommera le créneau sur la fiche du personnage.
          const subject = `choix-${String(choices.length + 1)}`;
          onChange([
            ...choices,
            {
              subject,
              kind: 'skill',
              title: '',
              help: '',
              pick: 1,
              from: [],
              bonus: 1,
              listFrom: '',
            },
          ]);
        }}
      >
        + Ajouter un choix
      </button>
    </>
  );
}
