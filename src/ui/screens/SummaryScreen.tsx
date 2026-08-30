import type { ReactNode } from 'react';
import {
  findAlignment,
  findBackground,
  findClass,
  findRace,
  findSubrace,
} from '../../domain/catalogue';
import {
  useCatalogue,
  useCharacterSheet,
  useDraft,
  useMissingChoices,
  useWizard,
} from '../../state/hooks';
import { AFFILIATION_NOTICE, SRD_ATTRIBUTION_FR } from '../../data/attribution';
import { formatMissing, formatMissingTitle } from '../format/missing';
import { formatModifier } from '../format/abilityBlock';
import styles from './SummaryScreen.module.css';

const TO_CHOOSE = 'À choisir';

function Tile({
  label,
  value,
  detail = null,
}: {
  readonly label: string;
  readonly value: string;
  // `| null` plutôt qu'une propriété optionnelle : c'est la convention du
  // projet, et `exactOptionalPropertyTypes` rend l'autre forme pénible.
  readonly detail?: string | null | undefined;
}): ReactNode {
  return (
    <div className={styles.tile}>
      <div className={styles.tileLabel}>{label}</div>
      <div className={styles.tileValue}>{value}</div>
      {detail === null ? null : <div className={styles.tileDetail}>{detail}</div>}
    </div>
  );
}

export interface SummaryScreenProps {
  /**
   * Appelé après un saut vers l'écran à corriger. Sans lui, le récapitulatif
   * resterait affiché par-dessus l'écran d'arrivée : la navigation aurait
   * lieu, mais le joueur ne verrait rien changer.
   */
  readonly onNavigate?: (() => void) | undefined;
}

export function SummaryScreen({ onNavigate }: SummaryScreenProps): ReactNode {
  const catalogue = useCatalogue();
  const draft = useDraft();
  const sheet = useCharacterSheet();
  const missing = useMissingChoices();
  const { goTo } = useWizard();

  const race = findRace(catalogue, draft.raceId);
  const subrace = findSubrace(catalogue, draft.raceId, draft.subraceId);
  const characterClass = findClass(catalogue, draft.classId);
  const background = findBackground(catalogue, draft.backgroundId);
  const alignment = findAlignment(catalogue, draft.alignmentId);

  const lineage = subrace?.name ?? race?.name ?? TO_CHOOSE;
  const armorClass = sheet.armorClass;
  const abilitySummary = sheet.saves
    .map((save) => String(sheet.abilities[save.ability]))
    .join(' ');

  return (
    <>
      <div className={styles.identity}>
        <div className={styles.name}>
          {draft.name === '' ? 'Personnage sans nom' : draft.name}
        </div>
        <p className={styles.subtitle}>
          {lineage} · {characterClass?.name ?? TO_CHOOSE} · niveau 1
        </p>
        <p className={styles.subtitle}>
          {background?.name ?? TO_CHOOSE} · {alignment?.name ?? TO_CHOOSE}
        </p>
      </div>

      {missing.length > 0 && (
        <>
          <h2 className={styles.heading}>{formatMissingTitle(missing.length)}</h2>
          <ul className={styles.list}>
            {missing.map((entry) => (
              <li key={`${entry.kind}-${String(entry.screenId)}`}>
                <button
                  type="button"
                  className={styles.jump}
                  disabled={entry.screenId === null}
                  onClick={() => {
                    if (entry.screenId === null) {
                      return;
                    }
                    goTo(entry.screenId);
                    onNavigate?.();
                  }}
                >
                  <span>{formatMissing(entry)}</span>
                  <span className={styles.chevron} aria-hidden>
                    ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className={styles.heading}>Tes choix</h2>
      <ul className={styles.list}>
        {(
          [
            ['Race', race?.name ?? TO_CHOOSE, 'race'],
            ['Branche', subrace?.name ?? '—', 'subrace'],
            ['Classe', characterClass?.name ?? TO_CHOOSE, 'class'],
            ['Caractéristiques', abilitySummary, 'ability-assign'],
            ['Historique', background?.name ?? TO_CHOOSE, 'background'],
            ['Alignement', alignment?.name ?? TO_CHOOSE, 'alignment'],
          ] as const
        ).map(([label, value, target]) => (
          <li key={label}>
            <button
              type="button"
              className={styles.jump}
              onClick={() => {
                goTo(target);
                onNavigate?.();
              }}
            >
              <span>
                {label} · {value}
              </span>
              <span className={styles.chevron}>Modifier</span>
            </button>
          </li>
        ))}
      </ul>

      <h2 className={styles.heading}>En combat</h2>
      <div className={styles.tiles}>
        <Tile
          label="Classe d’armure"
          value={armorClass === null ? TO_CHOOSE : String(armorClass.total)}
          detail={
            armorClass === null
              ? 'Choisis ta classe et ton équipement'
              : armorClass.parts.map((part) => String(part.value)).join(' + ')
          }
        />
        <Tile label="Initiative" value={formatModifier(sheet.initiative)} />
        <Tile
          label="Points de vie"
          value={sheet.maxHitPoints === null ? TO_CHOOSE : String(sheet.maxHitPoints)}
          detail={sheet.maxHitPoints === null ? 'Choisis ta classe' : null}
        />
        <Tile
          label="Vitesse"
          value={
            sheet.speedMeters === null
              ? TO_CHOOSE
              : `${sheet.speedMeters.toLocaleString('fr-FR')} m`
          }
        />
        <Tile
          label="Dés de vie"
          value={sheet.hitDice === null ? TO_CHOOSE : `1 d${String(sheet.hitDice.die)}`}
        />
        <Tile label="Bonus de maîtrise" value={formatModifier(sheet.proficiencyBonus)} />
        {sheet.darkvisionMeters !== null && sheet.darkvisionMeters > 0 && (
          // Rien à annoncer pour qui voit comme un humain : la tuile n'apparaît
          // que quand la race apporte vraiment quelque chose.
          <Tile
            label="Vision dans le noir"
            value={`${sheet.darkvisionMeters.toLocaleString('fr-FR')} m`}
          />
        )}
      </div>

      <h2 className={styles.heading}>Tes caractéristiques</h2>
      <div className={styles.tiles}>
        {sheet.saves.map((save) => (
          <Tile
            key={save.id}
            label={catalogue.abilities.find((a) => a.id === save.id)?.name ?? save.id}
            value={String(sheet.abilities[save.ability])}
            detail={`modificateur ${formatModifier(sheet.modifiers[save.ability])}`}
          />
        ))}
      </div>

      <p className={styles.attribution}>
        {SRD_ATTRIBUTION_FR} {AFFILIATION_NOTICE}
      </p>
    </>
  );
}
