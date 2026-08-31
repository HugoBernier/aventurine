import type { ReactNode } from 'react';
import {
  findAlignment,
  findBackground,
  findClass,
  findRace,
  findSubrace,
  findWeapon,
} from '../../domain/catalogue';
import {
  useCatalogue,
  useCharacterSheet,
  useDraft,
  useMissingChoices,
  useWizard,
} from '../../state/hooks';
import { AFFILIATION_NOTICE, SRD_ATTRIBUTION_FR } from '../../data/attribution';
import { Notice } from '../components/Notice';
import { formatMissing, formatMissingTitle } from '../format/missing';
import { formatModifier } from '../format/abilityBlock';
import { formatHeavyWeapons } from '../format/heavyWeapons';
import { formatMeters } from '../format/meters';
import { plural } from '../format/plural';
import styles from './SummaryScreen.module.css';

const TO_CHOOSE = 'À choisir';
const SIZE_NAMES = { P: 'Petite', M: 'Moyenne' } as const;

/**
 * Groupées par origine, et dans cet ordre : ce que tu es de naissance, ce que
 * tu as appris, ce que tu faisais avant. C'est l'ordre de l'assistant.
 */
const FEATURE_GROUPS = [
  ['race', 'De ton peuple'],
  ['class', 'De ta classe'],
  ['background', 'De ton historique'],
] as const;

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
  readonly onOpenLibrary?: (() => void) | undefined;
}

export function SummaryScreen({
  onNavigate,
  onOpenLibrary,
}: SummaryScreenProps): ReactNode {
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
  // La règle ne vaut la peine d'être dite que quand elle mord : un personnage
  // de petite taille qui porte effectivement une arme lourde.
  const heavyWeapons = sheet.attacks
    .filter((attack) => attack.heavyForSmallSize)
    .map((attack) => findWeapon(catalogue, attack.weaponId)?.name ?? attack.weaponId);
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
          {lineage} · {characterClass?.name ?? TO_CHOOSE} · niveau {draft.level}
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

      {onOpenLibrary !== undefined && (
        <button type="button" className={styles.library} onClick={onOpenLibrary}>
          <span>Tes personnages</span>
          <span className={styles.chevron}>Changer ou en créer un</span>
        </button>
      )}

      <h2 className={styles.heading}>Tes choix</h2>
      <ul className={styles.list}>
        {(
          [
            ['Race', race?.name ?? TO_CHOOSE, 'race'],
            ['Branche', subrace?.name ?? '—', 'subrace'],
            ['Classe', characterClass?.name ?? TO_CHOOSE, 'class'],
            // Monter d'un niveau après une séance est LE retour le plus
            // fréquent sur une fiche finie : il lui faut une entrée ici.
            ['Niveau', String(draft.level), 'level'],
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
              : `${formatMeters(sheet.speedMeters)} m`
          }
        />
        <Tile
          label="Dés de vie"
          value={sheet.hitDice === null ? TO_CHOOSE : `1 d${String(sheet.hitDice.die)}`}
        />
        <Tile label="Niveau" value={String(draft.level)} />
        <Tile label="Bonus de maîtrise" value={formatModifier(sheet.proficiencyBonus)} />
        {sheet.darkvisionMeters !== null && sheet.darkvisionMeters > 0 && (
          // Rien à annoncer pour qui voit comme un humain : la tuile n'apparaît
          // que quand la race apporte vraiment quelque chose.
          <Tile
            label="Vision dans le noir"
            value={`${formatMeters(sheet.darkvisionMeters)} m`}
          />
        )}
        {sheet.size !== null && <Tile label="Taille" value={SIZE_NAMES[sheet.size]} />}
        {sheet.resistances.length > 0 && (
          // Même règle que la vision : une tuile « aucune » n'apprend rien.
          <Tile
            label={plural(sheet.resistances.length, 'Résistance', 'Résistances')}
            value={sheet.resistances.join(', ')}
            detail="Tu encaisses moitié moins de ces dégâts"
          />
        )}
      </div>

      {heavyWeapons.length > 0 && (
        <Notice tone="reminder">{formatHeavyWeapons(heavyWeapons)}</Notice>
      )}

      {sheet.features.length > 0 && (
        <>
          <h2 className={styles.heading}>Tes aptitudes</h2>
          {FEATURE_GROUPS.map(([source, label]) => {
            const group = sheet.features.filter((feature) => feature.source === source);
            return group.length === 0 ? null : (
              <section key={source}>
                <h3 className={styles.subheading}>{label}</h3>
                <dl className={styles.features}>
                  {group.map((feature) => (
                    <div className={styles.feature} key={`${source}-${feature.name}`}>
                      <dt className={styles.featureName}>{feature.name}</dt>
                      <dd className={styles.featureText}>{feature.text}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </>
      )}

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
