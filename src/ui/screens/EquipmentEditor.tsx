import type { ReactNode } from 'react';
import type { EquipmentDraft } from '../../domain/packDraft';
import { useCatalogue } from '../../state/hooks';
import { TextField } from '../components/TextField';
import styles from './SpellForm.module.css';

export interface EquipmentEditorProps {
  readonly equipment: readonly EquipmentDraft[];
  readonly onChange: (equipment: readonly EquipmentDraft[]) => void;
}

/** Ce qu'on emporte en partant : un objet du catalogue, et combien. */
export function EquipmentEditor({
  equipment,
  onChange,
}: EquipmentEditorProps): ReactNode {
  const catalogue = useCatalogue();
  const set = (index: number, parts: Partial<EquipmentDraft>): void => {
    onChange(equipment.map((line, at) => (at === index ? { ...line, ...parts } : line)));
  };

  return (
    <>
      {equipment.map((line, index) => (
        <div className={styles.row} key={index}>
          <div className={styles.select}>
            <label className={styles.label} htmlFor={`item-${String(index)}`}>
              L’objet
            </label>
            <select
              id={`item-${String(index)}`}
              className={styles.input}
              value={line.itemId}
              onChange={(event) => {
                set(index, { itemId: event.currentTarget.value });
              }}
            >
              <option value="">À choisir</option>
              {catalogue.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <TextField
            label="Combien"
            defaultValue={String(line.quantity)}
            maxLength={2}
            onCommit={(value) => {
              const asked = Number(value);
              set(index, {
                quantity: Number.isSafeInteger(asked) && asked > 0 ? asked : 1,
              });
            }}
          />
          <button
            type="button"
            className={styles.cancel}
            onClick={() => {
              onChange(equipment.filter((_, at) => at !== index));
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
          onChange([...equipment, { itemId: '', quantity: 1 }]);
        }}
      >
        + Ajouter un objet
      </button>
    </>
  );
}
