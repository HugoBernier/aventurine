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
import { PlaySection } from './PlaySection';
import { PrintBoxes } from './PrintBoxes';
import { SpellbookSection } from './SpellbookSection';
import { formatMissing, formatMissingTitle } from '../format/missing';
import { formatModifier } from '../format/abilityBlock';
import { formatHeavyWeapons } from '../format/heavyWeapons';
import { formatDamageTypeList } from '../format/damageTypes';
import { formatMeters } from '../format/meters';
import { plural } from '../format/plural';
import styles from './SummaryScreen.module.css';

const TO_CHOOSE = 'À choisir';

/** Une donnée de référence : vraie, utile, mais consultée trois fois par soir. */
function Ref({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}): ReactNode {
  return (
    <div className={styles.ref}>
      <span className={styles.refLabel}>{label}</span>
      <span className={styles.refValue}>{value}</span>
    </div>
  );
}
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
      <div className={styles.identity} data-sheet="identity">
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

      {/* On lance d20 + MODIFICATEUR. Le score ne sert qu'à deux moments : quand
          une aptitude le référence, et quand on monte de niveau. C'est donc le
          modificateur qui porte le bloc, et le score qui l'accompagne. */}
      <div className={styles.abilities} data-sheet="abilities">
        {sheet.saves.map((save) => (
          <div className={styles.ability} key={save.id}>
            <div className={styles.abilityName}>
              {catalogue.abilities.find((a) => a.id === save.id)?.name ?? save.id}
            </div>
            <div className={styles.abilityModifier}>
              {formatModifier(sheet.modifiers[save.ability])}
            </div>
            <div className={styles.abilityScore}>{sheet.abilities[save.ability]}</div>
          </div>
        ))}
      </div>

      {missing.length > 0 && (
        <div data-print="hide">
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
        </div>
      )}

      {/* `window.print()` plutôt qu'une bibliothèque PDF : le navigateur sait
          déjà paginer, et sur téléphone « Enregistrer au format PDF » est dans
          le dialogue d'impression, sur iOS comme sur Android. */}
      <button
        type="button"
        className={styles.library}
        data-print="hide"
        onClick={() => {
          globalThis.print();
        }}
      >
        <span>Imprimer ou enregistrer en PDF</span>
        <span className={styles.chevron}>Ta fiche de jeu</span>
      </button>

      {onOpenLibrary !== undefined && (
        <button
          type="button"
          className={styles.library}
          data-print="hide"
          onClick={onOpenLibrary}
        >
          <span>Tes personnages</span>
          <span className={styles.chevron}>Changer ou en créer un</span>
        </button>
      )}

      <h2 className={styles.heading} data-print="hide">
        Tes choix
      </h2>
      <ul className={styles.list} data-print="hide">
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

      {/* Les trois nombres qu'on donne au meneur à chaque tour. Ils méritent
          le tiers de la page à eux seuls : chercher sa CA dans une grille de
          onze tuiles identiques, c'est la chercher à chaque fois. */}
      <div className={styles.vitals} data-sheet="vitals">
        <div className={styles.vital}>
          <div className={styles.vitalName}>Classe d’armure</div>
          <div className={styles.vitalValue}>
            {armorClass === null ? '—' : armorClass.total}
          </div>
          <div className={styles.vitalDetail}>
            {armorClass === null
              ? 'Choisis ta classe'
              : armorClass.parts.map((part) => String(part.value)).join(' + ')}
          </div>
        </div>
        <div className={styles.vital}>
          <div className={styles.vitalName}>Initiative</div>
          <div className={styles.vitalValue}>{formatModifier(sheet.initiative)}</div>
          <div className={styles.vitalDetail}>Dextérité</div>
        </div>
        <div className={styles.vital}>
          <div className={styles.vitalName}>Vitesse</div>
          <div className={styles.vitalValue}>
            {sheet.speedMeters === null ? '—' : formatMeters(sheet.speedMeters)}
          </div>
          <div className={styles.vitalDetail}>mètres par tour</div>
        </div>
        {/* Les points de vie changent à chaque tour : le maximum est une
            référence, la case vide est ce qu'on écrit vraiment. */}
        <div className={styles.hitPoints}>
          <div className={styles.vitalName}>Points de vie</div>
          <div className={styles.hitPointsRow}>
            {/* La case la plus écrite de la soirée. Elle vaut mieux qu'un filet
                de 8 pt perdu dans une bande de cases à cocher. */}
            <div className={styles.hitPointsCurrent} data-sheet="hp-current">
              <span className={styles.vitalDetail}>actuels</span>
            </div>
            <div className={styles.hitPointsMax}>
              <span className={styles.vitalValue}>{sheet.maxHitPoints ?? '—'}</span>
              <span className={styles.vitalDetail}>maximum</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ce qu'on ne consulte presque jamais, ou que le meneur lit à notre
          place. Vrai sur la fiche, mais pas au même prix en surface. */}
      <div className={styles.reference} data-sheet="reference">
        <Ref label="Maîtrise" value={formatModifier(sheet.proficiencyBonus)} />
        <Ref label="Perception passive" value={String(sheet.passivePerception)} />
        <Ref label="Niveau" value={String(draft.level)} />
        <Ref
          label="Dés de vie"
          value={sheet.hitDice === null ? '—' : `1 d${String(sheet.hitDice.die)}`}
        />
        {sheet.darkvisionMeters !== null && sheet.darkvisionMeters > 0 && (
          <Ref
            label="Vision dans le noir"
            value={`${formatMeters(sheet.darkvisionMeters)} m`}
          />
        )}
        {sheet.size !== null && <Ref label="Taille" value={SIZE_NAMES[sheet.size]} />}
        {sheet.resistances.length > 0 && (
          <Ref
            label={plural(sheet.resistances.length, 'Résistance', 'Résistances')}
            value={formatDamageTypeList(sheet.resistances)}
          />
        )}
      </div>

      {heavyWeapons.length > 0 && (
        <Notice tone="reminder">{formatHeavyWeapons(heavyWeapons)}</Notice>
      )}

      <PrintBoxes slots={sheet.spellcasting?.slots ?? []} />

      <PlaySection />

      {sheet.features.length > 0 && (
        <>
          <h2 className={styles.heading} data-sheet="annex">
            Tes aptitudes
          </h2>
          {FEATURE_GROUPS.map(([source, label]) => {
            const group = sheet.features.filter((feature) => feature.source === source);
            return group.length === 0 ? null : (
              <section key={source}>
                <h3 className={styles.subheading}>{label}</h3>
                <dl className={styles.features}>
                  {group.map((feature) => (
                    <div className={styles.feature} key={`${source}-${feature.name}`}>
                      <dt className={styles.featureName}>
                        {feature.name}
                        {feature.value !== null && (
                          // La ligne du tableau que TON niveau atteint : le
                          // joueur ne cherche pas sa ligne, il la lit.
                          <span className={styles.featureValue}>{feature.value}</span>
                        )}
                      </dt>
                      <dd className={styles.featureText}>{feature.text}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </>
      )}

      <SpellbookSection
        onJump={(screenId) => {
          goTo(screenId);
          onNavigate?.();
        }}
      />

      <p className={styles.attribution}>
        {SRD_ATTRIBUTION_FR} {AFFILIATION_NOTICE}
      </p>
    </>
  );
}
