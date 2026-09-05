import type { ReactNode } from 'react';
import type { Spell } from '../../domain/content';
import { useSpellbook } from '../../state/hooks';
import type { ScreenId } from '../../state/types';
import {
  formatCastingAbility,
  formatPreparation,
  formatSlots,
  slotLevels,
  slotsAtLevel,
  spellFacts,
} from '../format/spellbook';
import { Provenance } from '../components/Provenance';
import styles from './SpellbookSection.module.css';

interface SpellListProps {
  readonly title: string;
  readonly spells: readonly Spell[];
  /** Emplacements de ce niveau : une case à cocher par emplacement. */
  readonly slots?: number | undefined;
  readonly onChange?: (() => void) | undefined;
  readonly emptyLabel?: string | undefined;
}

function SpellList({
  title,
  spells,
  slots = 0,
  onChange,
  emptyLabel,
}: SpellListProps): ReactNode {
  return (
    <section className={styles.block} data-print="keep-together">
      <div className={styles.blockHead}>
        <h3 className={styles.blockTitle}>{title}</h3>
        {slots > 0 && (
          // Sur papier seulement : à l'écran, rien ne coche ces cases, et le
          // compte des emplacements est déjà écrit en toutes lettres plus haut.
          <span className={styles.slots} data-print="slots">
            emplacements dépensés
            {Array.from({ length: slots }, (_, index) => (
              <span key={index} />
            ))}
          </span>
        )}
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
        <p className={styles.empty} data-print="write-here">
          {emptyLabel ?? 'Rien ici pour l’instant.'}
        </p>
      ) : (
        <ul className={styles.list}>
          {spells.map((spell) => (
            <li className={styles.spell} key={spell.id}>
              <div className={styles.spellName}>{spell.name}</div>
              <Provenance id={spell.id} />
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
  // Un niveau apparaît s'il porte des sorts ou des emplacements : le clerc ne
  // choisit rien à l'avance, il lui faut quand même ses cases à cocher.
  const levels = [
    ...new Set([...book.groups.map((group) => group.level), ...slotLevels(casting)]),
  ].toSorted((a, b) => a - b);
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

      {/* Le paladin et le rôdeur n'ont pas de tour de magie : leur en promettre
          un bloc vide ferait chercher un écran qui n'existe pas. */}
      {(book.cantrips.length > 0 || book.cantripScreenId !== null) && (
        <SpellList
          title="Tes tours de magie"
          spells={book.cantrips}
          onChange={jump(book.cantripScreenId)}
          emptyLabel="Tu n’as pas encore choisi tes tours de magie."
        />
      )}
      {levels.map((level) => (
        <SpellList
          key={level}
          title={`Tes sorts de niveau ${String(level)}`}
          spells={book.groups.find((group) => group.level === level)?.spells ?? []}
          slots={slotsAtLevel(casting, level)}
          onChange={jump(book.spellScreenId)}
          emptyLabel="Rien à ce niveau pour l’instant."
        />
      ))}
      {levels.length === 0 && (
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
