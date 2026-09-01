import type { ReactNode } from 'react';
import type { Spell } from '../../domain/content';
import { useSpellbook } from '../../state/hooks';
import type { ScreenId } from '../../state/types';
import {
  formatCastingAbility,
  formatPreparation,
  formatSlots,
  spellFacts,
} from '../format/spellbook';
import styles from './SpellbookSection.module.css';

interface SpellListProps {
  readonly title: string;
  readonly spells: readonly Spell[];
  readonly onChange?: (() => void) | undefined;
  readonly emptyLabel?: string | undefined;
}

function SpellList({ title, spells, onChange, emptyLabel }: SpellListProps): ReactNode {
  return (
    <section className={styles.block}>
      <div className={styles.blockHead}>
        <h3 className={styles.blockTitle}>{title}</h3>
        {onChange !== undefined && (
          <button
            type="button"
            className={styles.change}
            data-print="hide"
            onClick={onChange}
          >
            Changer
          </button>
        )}
      </div>
      {spells.length === 0 ? (
        <p className={styles.empty}>{emptyLabel ?? 'Rien ici pour l’instant.'}</p>
      ) : (
        <ul className={styles.list}>
          {spells.map((spell) => (
            <li className={styles.spell} key={spell.id}>
              <div className={styles.spellName}>{spell.name}</div>
              <div className={styles.spellFacts}>{spellFacts(spell)}</div>
              <p className={styles.spellText}>{spell.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export interface SpellbookSectionProps {
  readonly onJump: (screenId: ScreenId) => void;
}

/**
 * Le grimoire : ce que le personnage sait lancer, et le bouton qui ramène à
 * l'écran de choix. Un joueur change de sorts entre deux séances ; l'obliger à
 * remonter tout l'assistant pour ça serait absurde.
 */
export function SpellbookSection({ onJump }: SpellbookSectionProps): ReactNode {
  const book = useSpellbook();
  const { casting } = book;
  if (casting === null) {
    return null;
  }
  const slots = formatSlots(casting);
  const jump = (screenId: ScreenId | null) =>
    screenId === null
      ? undefined
      : () => {
          onJump(screenId);
        };

  return (
    <>
      <h2 className={styles.heading} data-sheet="annex">
        Ta magie
      </h2>
      <dl className={styles.summary}>
        <div className={styles.row}>
          <dt className={styles.term}>Caractéristique</dt>
          <dd className={styles.value}>{formatCastingAbility(casting)}</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>Degré de sauvegarde</dt>
          <dd className={styles.value}>{casting.saveDc}</dd>
        </div>
        <div className={styles.row}>
          <dt className={styles.term}>Attaque avec un sort</dt>
          <dd className={styles.value}>
            {casting.attackBonus >= 0
              ? `+${String(casting.attackBonus)}`
              : casting.attackBonus}
          </dd>
        </div>
        {slots !== null && (
          <div className={styles.row}>
            <dt className={styles.term}>Emplacements</dt>
            <dd className={styles.value}>{slots}</dd>
          </div>
        )}
        {casting.preparedCount !== null && (
          <div className={styles.row}>
            <dt className={styles.term}>Sorts préparés</dt>
            <dd className={styles.value}>{casting.preparedCount}</dd>
          </div>
        )}
      </dl>
      <p className={styles.note}>{formatPreparation(casting)}</p>

      <SpellList
        title="Tes tours de magie"
        spells={book.cantrips}
        onChange={jump(book.cantripScreenId)}
        emptyLabel="Tu n’as pas encore choisi tes tours de magie."
      />
      {book.groups.map((group) => (
        <SpellList
          key={group.level}
          title={`Tes sorts de niveau ${String(group.level)}`}
          spells={group.spells}
          onChange={jump(book.spellScreenId)}
        />
      ))}
      {book.groups.length === 0 && (
        <SpellList
          title="Tes sorts"
          spells={[]}
          onChange={jump(book.spellScreenId)}
          emptyLabel="Tu n’as pas encore choisi tes sorts."
        />
      )}
      {book.alwaysPrepared.length > 0 && (
        <SpellList title="Toujours préparés" spells={book.alwaysPrepared} />
      )}
    </>
  );
}
