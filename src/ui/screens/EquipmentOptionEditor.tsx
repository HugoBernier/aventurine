import type { ReactNode } from 'react';
import { slug } from '../../domain/packDraft';
import type { EquipmentOptionDraft } from '../../domain/packDraft';
import { TextField } from '../components/TextField';
import { EquipmentEditor } from './EquipmentEditor';
import styles from './SpellForm.module.css';

export interface EquipmentOptionEditorProps {
  readonly options: readonly EquipmentOptionDraft[];
  readonly onChange: (options: readonly EquipmentOptionDraft[]) => void;
}

/**
 * Les paquets de départ entre lesquels le joueur choisit — « une hache à deux
 * mains » contre « une épée à deux mains ».
 *
 * Leur identifiant reste local à la classe, sans préfixe de pack : il ne
 * devient jamais un identifiant de créneau, et n'est lu que dans le choix de
 * sa propre classe, où aucune collision n'est possible.
 */
export function EquipmentOptionEditor({
  options,
  onChange,
}: EquipmentOptionEditorProps): ReactNode {
  const set = (index: number, parts: Partial<EquipmentOptionDraft>): void => {
    onChange(
      options.map((option, at) => (at === index ? { ...option, ...parts } : option)),
    );
  };
  const field = (
    index: number,
    key: 'name' | 'blurb',
  ): { onCommit: (value: string) => void; onInput: (value: string) => void } => {
    const commit = (value: string): void => {
      const id = key === 'name' && options[index]?.id === '' ? slug(value) : undefined;
      set(index, id === undefined ? { [key]: value } : { [key]: value, id });
    };
    return { onCommit: commit, onInput: commit };
  };

  return (
    <>
      {options.map((option, index) => (
        // Le rang, jamais l'identifiant : celui-ci se fabrique depuis le nom
        // et changerait à chaque lettre, refermant le clavier.
        <div className={styles.form} key={index}>
          <TextField
            label="Le nom du lot"
            defaultValue={option.name}
            maxLength={60}
            placeholder="Une hache à deux mains"
            {...field(index, 'name')}
          />
          <TextField
            label="Ce qu’il vaut, en une phrase"
            defaultValue={option.blurb}
            maxLength={600}
            {...field(index, 'blurb')}
          />
          <EquipmentEditor
            equipment={option.items}
            onChange={(items) => {
              set(index, { items });
            }}
          />
          <button
            type="button"
            className={styles.cancel}
            onClick={() => {
              onChange(options.filter((_, at) => at !== index));
            }}
          >
            Retirer ce lot
          </button>
        </div>
      ))}
      <button
        type="button"
        className={styles.cancel}
        onClick={() => {
          onChange([
            ...options,
            { id: '', name: '', blurb: '', facts: ['', '', ''], items: [] },
          ]);
        }}
      >
        + Ajouter un lot
      </button>
    </>
  );
}
