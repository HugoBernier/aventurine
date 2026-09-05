import type { ReactNode } from 'react';
import { emptyChoiceDraft } from '../../domain/packDraft';
import type { ChoiceDraft, ChoiceKindDraft } from '../../domain/packDraft';
import { useCatalogue } from '../../state/hooks';
import { OptionChecklist } from '../components/OptionChecklist';
import { TextField } from '../components/TextField';
import { SpellCountEditor } from './SpellCountEditor';
import styles from './SpellForm.module.css';

type Kind = ChoiceKindDraft;

const LABELS: Readonly<Record<Kind, string>> = {
  skill: 'Le joueur choisit une compétence',
  language: 'Le joueur choisit une langue',
  tool: 'Le joueur choisit un outil',
  ability: 'Le joueur place un bonus (+1 ou +2) où il veut',
  cantrip: 'Le joueur choisit un tour de magie',
  ancestry: 'Le joueur choisit un dragon d’origine',
  spell: 'Le joueur choisit ses sorts',
  'fighting-style': 'Le joueur choisit une façon de se battre',
  expertise: 'Le joueur double son bonus sur deux compétences',
  equipment: 'Le joueur choisit son matériel de départ',
};

/** Ce qu'un PEUPLE ou un HISTORIQUE peut ouvrir. */
export const RACE_KINDS: readonly Kind[] = [
  'skill',
  'language',
  'tool',
  'ability',
  'cantrip',
  'ancestry',
];

export const BACKGROUND_KINDS: readonly Kind[] = ['skill', 'language', 'tool'];

export const CLASS_KINDS: readonly Kind[] = [
  'skill',
  'tool',
  'language',
  'cantrip',
  'spell',
  'fighting-style',
  'expertise',
  'equipment',
];

/** Les genres qui listent des options ; les autres n'en ont pas à cocher. */
const LISTED = new Set<Kind>([
  'skill',
  'language',
  'tool',
  'expertise',
  'fighting-style',
  'equipment',
]);

/** Un nombre qui reste jouable : jamais zéro, jamais au-delà de la borne. */
function bounded(value: string, max = 6): number {
  const asked = Number(value);
  return Number.isFinite(asked) ? Math.min(Math.max(Math.trunc(asked), 1), max) : 1;
}

export interface ChoiceEditorProps {
  readonly choices: readonly ChoiceDraft[];
  /** Les genres que CETTE entrée peut ouvrir : un peuple et une classe diffèrent. */
  readonly kinds: readonly Kind[];
  /** Les lots de départ de la classe, quand c'est une classe qu'on écrit. */
  readonly equipmentOptions?: readonly { readonly id: string; readonly name: string }[];
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
export function ChoiceEditor({
  choices,
  kinds,
  equipmentOptions = [],
  onChange,
}: ChoiceEditorProps): ReactNode {
  const catalogue = useCatalogue();

  const optionsFor = (kind: Kind): readonly { id: string; name: string }[] => {
    if (kind === 'skill' || kind === 'expertise') return catalogue.skills;
    if (kind === 'language') return catalogue.languages;
    if (kind === 'tool') return catalogue.tools;
    if (kind === 'fighting-style') return catalogue.fightingStyles;
    return kind === 'equipment' ? equipmentOptions : [];
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
              Ce que ça lui fait choisir
            </label>
            <select
              id={`choice-kind-${String(index)}`}
              className={styles.input}
              value={choice.kind}
              onChange={(event) => {
                const chosen = event.currentTarget.value;
                const kind = kinds.find((id) => id === chosen);
                set(index, { kind: kind ?? 'skill', from: [] });
              }}
            >
              {kinds.map((id) => (
                <option key={id} value={id}>
                  {LABELS[id]}
                </option>
              ))}
            </select>
          </div>

          <TextField
            label="La question posée"
            defaultValue={choice.title}
            maxLength={120}
            hint="Elle s’affiche en gros, en haut de l’écran. Tutoie le joueur : « Où mettre ton +2 ? »"
            {...field(index, 'title')}
          />
          <TextField
            label="La phrase qui aide à répondre"
            defaultValue={choice.help}
            maxLength={600}
            multiline
            {...field(index, 'help')}
          />

          {choice.kind === 'ability' && (
            <div className={styles.select}>
              <label className={styles.label} htmlFor={`choice-bonus-${String(index)}`}>
                Combien de points il place
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

          {(choice.kind === 'cantrip' || choice.kind === 'spell') && (
            <div className={styles.select}>
              <label className={styles.label} htmlFor={`choice-list-${String(index)}`}>
                Dans les sorts de quelle classe
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

          {choice.kind === 'spell' && (
            <SpellCountEditor
              choice={choice}
              onChange={(parts) => {
                set(index, parts);
              }}
            />
          )}

          {choice.kind === 'fighting-style' && (
            <TextField
              label="À quel niveau il le choisit"
              defaultValue={String(choice.level)}
              maxLength={2}
              onCommit={(value) => {
                set(index, { level: bounded(value, 20) });
              }}
            />
          )}

          {LISTED.has(choice.kind) && (
            <>
              <OptionChecklist
                legend="Parmi quoi il choisit"
                options={optionsFor(choice.kind)}
                checked={choice.from}
                onChange={(from) => {
                  set(index, { from });
                }}
              />
              <TextField
                label="Combien il en choisit"
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
          // Le sujet est unique dans l'entrée et n'en bouge plus : c'est lui
          // qui nommera le créneau sur la fiche du personnage.
          const subject = `choix-${String(choices.length + 1)}`;
          onChange([...choices, emptyChoiceDraft(kinds[0] ?? 'skill', subject)]);
        }}
      >
        + Lui laisser un choix
      </button>
    </>
  );
}
