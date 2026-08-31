import { MAX_ABILITY, abilityScores } from './abilities';
import type { AbilityScores } from './abilities';
import type { Catalogue } from './catalogue';
import { slotId } from './choice';
import type {
  ChoiceSlotId,
  ChoiceKind,
  ChoiceOption,
  ChoiceSlot,
  ChoiceSource,
  UnavailableReason,
} from './choice';
import type { AdvancementMode, ChoiceSpec } from './choiceSpec';
import {
  findAbility,
  findClass,
  findLanguage,
  findRace,
  findSkill,
  findSubrace,
  findTool,
  findBackground,
  spellsForClass,
} from './catalogue';
import type { Advancement, EquipmentOption, Facts } from './content';
import { pickedFor } from './draft';
import { clampLevel, pactMagic, spellSlots } from './progression';
import type { CharacterDraft } from './draft';

const NO_FACT = '—';

interface SpecOwner {
  readonly source: ChoiceSource;
  /** Toujours un identifiant que le joueur a choisi lui-même (§A3). */
  readonly parentId: string;
  readonly spec: ChoiceSpec;
}

/** Ce que le personnage possède déjà, et par quelle source il l'a obtenu. */
interface Granted {
  readonly skills: Map<string, ChoiceSource>;
  readonly languages: Map<string, ChoiceSource>;
  readonly tools: Map<string, ChoiceSource>;
  /**
   * Une caractéristique qui a déjà reçu un bonus d'origine. Deux bonus sur le
   * même score le monteraient de plus de 2, ce que la règle interdit.
   */
  readonly abilities: Map<string, ChoiceSource>;
}

function grantAll(
  into: Map<string, ChoiceSource>,
  ids: readonly string[],
  source: ChoiceSource,
): void {
  for (const id of ids) {
    if (!into.has(id)) {
      into.set(id, source);
    }
  }
}

/** Dotations fixes : elles l'emportent toujours sur les choix. */
function fixedGrants(draft: CharacterDraft, catalogue: Catalogue): Granted {
  const granted: Granted = {
    skills: new Map(),
    languages: new Map(),
    tools: new Map(),
    abilities: new Map(),
  };

  const race = findRace(catalogue, draft.raceId);
  if (race !== null) {
    grantAll(granted.skills, race.skills, 'race');
    grantAll(granted.languages, race.languages, 'race');
    grantAll(granted.tools, race.proficiencies.tools, 'race');
  }
  const subrace = findSubrace(catalogue, draft.raceId, draft.subraceId);
  if (subrace !== null) {
    grantAll(granted.skills, subrace.skills, 'race');
    grantAll(granted.tools, subrace.proficiencies.tools, 'race');
  }
  const background = findBackground(catalogue, draft.backgroundId);
  if (background !== null) {
    grantAll(granted.skills, background.skills, 'background');
    grantAll(granted.tools, background.proficiencies.tools, 'background');
  }
  const characterClass = findClass(catalogue, draft.classId);
  if (characterClass !== null) {
    grantAll(granted.tools, characterClass.proficiencies.tools, 'class');
    const { subclass } = characterClass;
    if (subclass?.proficiencies != null) {
      grantAll(granted.tools, subclass.proficiencies.tools, 'class');
    }
  }
  return granted;
}

/**
 * L'ordre de résolution EST la priorité d'exclusion : race, puis historique,
 * puis classe. L'expertise passe en dernier, parce que ses options sont les
 * compétences déjà acquises : accrochée derrière la classe elle proposerait
 * une liste vide (docs/plans/00-arbitrage.md §A15).
 */
/**
 * Le plus haut niveau de sort que les emplacements du personnage ouvrent.
 * Zéro tant qu'aucune classe n'est choisie, la liste est alors vide.
 */
function highestSpellLevel(draft: CharacterDraft, catalogue: Catalogue): number {
  const casting = findClass(catalogue, draft.classId)?.spellcasting;
  if (casting == null) {
    return 0;
  }
  if (casting.progression === 'pact') {
    return pactMagic(draft.level).slotLevel;
  }
  return spellSlots(casting.progression, draft.level).length;
}

/** La suite d'un palier dépend de la route retenue ; aucune tant qu'elle manque. */
function advancementFollowUp(
  step: Advancement,
  mode: AdvancementMode | undefined,
): readonly ChoiceSpec[] {
  switch (mode) {
    case 'ability-2': {
      return [step.abilityMajor];
    }
    case 'ability-1-1': {
      return [step.abilityMinor];
    }
    case 'feat': {
      return [step.feat];
    }
    case undefined: {
      return [];
    }
  }
}

function specsInPriorityOrder(
  draft: CharacterDraft,
  catalogue: Catalogue,
): readonly SpecOwner[] {
  const owners: SpecOwner[] = [];
  const push = (
    source: ChoiceSource,
    parentId: string | null,
    specs: readonly ChoiceSpec[],
  ) => {
    if (parentId === null) {
      return;
    }
    for (const spec of specs) {
      owners.push({ source, parentId, spec });
    }
  };

  const race = findRace(catalogue, draft.raceId);
  push('race', draft.raceId, race?.choices ?? []);
  const subrace = findSubrace(catalogue, draft.raceId, draft.subraceId);
  push('race', draft.subraceId, subrace?.choices ?? []);

  const background = findBackground(catalogue, draft.backgroundId);
  push('background', draft.backgroundId, background?.choices ?? []);

  const characterClass = findClass(catalogue, draft.classId);
  push('class', draft.classId, characterClass?.choices ?? []);
  push('class', draft.classId, characterClass?.subclass?.choices ?? []);

  // Un palier n'existe qu'une fois son niveau atteint, et sa suite dépend de
  // la route choisie. Redescendre de niveau referme le palier : la purge
  // retire alors la réponse, comme pour n'importe quel choix devenu caduc.
  const advancements = characterClass?.advancements ?? [];
  const reached = clampLevel(draft.level);
  for (const step of advancements) {
    const { classId } = draft;
    if (classId === null || step.level > reached) {
      continue;
    }
    push('class', classId, [step.mode]);
    const [mode] = pickedFor(draft, slotId('class', classId, step.mode.subject));
    // La réponse vient d'un JSON : on ne la croit que si elle est une route connue.
    push('class', classId, advancementFollowUp(step, asAdvancementMode(mode)));
  }

  const expertise = owners.filter((owner) => owner.spec.kind === 'expertise');
  const rest = owners.filter((owner) => owner.spec.kind !== 'expertise');
  return [...rest, ...expertise];
}

function equipmentOptions(
  draft: CharacterDraft,
  catalogue: Catalogue,
): readonly EquipmentOption[] {
  return findClass(catalogue, draft.classId)?.equipmentOptions ?? [];
}

function option(
  id: string,
  label: string,
  blurb: string,
  facts: Facts,
  unavailable: UnavailableReason | null,
): ChoiceOption {
  return { id, label, blurb, facts, details: [], unavailable };
}

/** Le registre de maîtrises concerné par un genre de choix, s'il y en a un. */
function registerFor(
  kind: ChoiceKind,
  granted: Granted,
): Map<string, ChoiceSource> | null {
  switch (kind) {
    case 'skill': {
      return granted.skills;
    }
    // L'expertise porte SUR les compétences déjà acquises : les posséder est
    // sa condition d'entrée, pas un conflit. Elle n'a donc pas de registre
    // d'exclusion, et ses options se construisent depuis `granted` directement.
    case 'expertise': {
      return null;
    }
    case 'language': {
      return granted.languages;
    }
    case 'tool': {
      return granted.tools;
    }
    // Un score déjà rehaussé À L'ORIGINE ne peut pas l'être une seconde fois.
    // Une amélioration de NIVEAU, elle, peut retomber où elle veut : deux +1
    // sur un même score y sont légitimes, seul le plafond de 20 l'arrête.
    case 'ability': {
      return granted.abilities;
    }
    case 'improvement':
    case 'feat':
    case 'advancement':
    case 'cantrip':
    case 'spell':
    case 'equipment':
    case 'ancestry':
    case 'fighting-style': {
      return null;
    }
  }
}

function buildOptions(
  owner: SpecOwner,
  draft: CharacterDraft,
  catalogue: Catalogue,
  granted: Granted,
): readonly ChoiceOption[] {
  const { spec } = owner;
  switch (spec.kind) {
    case 'skill': {
      return spec.from.map((id) => {
        const skill = findSkill(catalogue, id);
        return option(
          id,
          skill?.name ?? id,
          skill?.usage ?? '',
          [skill?.ability ?? NO_FACT, skill?.usage ?? NO_FACT, NO_FACT],
          null,
        );
      });
    }
    case 'language': {
      return spec.from.map((id) => {
        const language = findLanguage(catalogue, id);
        return option(
          id,
          language?.name ?? id,
          `Écriture ${language?.script ?? 'inconnue'}.`,
          [
            language?.exotic === true ? 'Exotique' : 'Standard',
            language?.script ?? NO_FACT,
            NO_FACT,
          ],
          null,
        );
      });
    }
    case 'tool': {
      return spec.from.map((id) => {
        const tool = findTool(catalogue, id);
        return option(
          id,
          tool?.name ?? id,
          tool?.category ?? '',
          [tool?.category ?? NO_FACT, `${String(tool?.costGp ?? 0)} po`, NO_FACT],
          null,
        );
      });
    }
    case 'ability': {
      return spec.from.map((id) => {
        const ability = findAbility(catalogue, id);
        return option(
          id,
          ability?.name ?? id,
          ability?.purpose ?? '',
          [ability?.name ?? NO_FACT, ability?.purpose ?? NO_FACT, NO_FACT],
          null,
        );
      });
    }
    case 'improvement': {
      // Sans l'exclusion, une Force à 17 choisie ici compterait 19, et le
      // plafond refuserait le choix que le joueur vient de faire.
      const totals = abilityTotals(
        draft,
        catalogue,
        slotId(owner.source, owner.parentId, spec.subject),
      );
      return spec.from.map((id) => {
        const ability = findAbility(catalogue, id);
        const total = totals[id];
        return option(
          id,
          ability?.name ?? id,
          ability?.purpose ?? '',
          [`${String(total)} actuellement`, ability?.purpose ?? NO_FACT, NO_FACT],
          // On refuse AVANT de dépasser : afficher 22 puis corriger serait pire.
          total + spec.bonus > MAX_ABILITY
            ? { kind: 'max-ability', max: MAX_ABILITY }
            : null,
        );
      });
    }
    case 'feat': {
      return catalogue.feats.map((feat) =>
        option(feat.id, feat.name, feat.blurb, feat.facts, null),
      );
    }
    case 'advancement': {
      return spec.from.map((entry) =>
        option(entry.id, entry.label, entry.blurb, [entry.label, NO_FACT, NO_FACT], null),
      );
    }
    case 'cantrip':
    case 'spell': {
      // Un tour de magie reste de niveau 0. Un sort va du premier niveau au
      // plus haut que les emplacements du personnage ouvrent.
      const [from, to] =
        spec.kind === 'cantrip' ? [0, 0] : [1, highestSpellLevel(draft, catalogue)];
      return spellsForClass(catalogue, spec.listFrom, from, to).map((spell) =>
        option(
          spell.id,
          spell.name,
          spell.summary,
          [spell.castingTime, spell.range, spell.duration],
          null,
        ),
      );
    }
    case 'equipment': {
      const available = equipmentOptions(draft, catalogue);
      return spec.from.flatMap((id) => {
        const found = available.find((entry) => entry.id === id);
        return found === undefined
          ? []
          : [option(found.id, found.name, found.blurb, found.facts, null)];
      });
    }
    case 'ancestry': {
      return catalogue.ancestries.map((ancestry) =>
        option(
          ancestry.id,
          ancestry.name,
          ancestry.blurb,
          [ancestry.damageType, ancestry.breathWeapon, NO_FACT],
          null,
        ),
      );
    }
    case 'fighting-style': {
      return catalogue.fightingStyles.map((style) =>
        option(style.id, style.name, style.text, [style.text, NO_FACT, NO_FACT], null),
      );
    }
    case 'expertise': {
      const skills = Array.from(granted.skills.keys(), (id) => {
        const skill = findSkill(catalogue, id);
        return option(
          id,
          skill?.name ?? id,
          skill?.usage ?? '',
          [skill?.ability ?? NO_FACT, skill?.usage ?? NO_FACT, NO_FACT],
          null,
        );
      });
      const tools = spec.tools
        .filter((id) => granted.tools.has(id))
        .map((id) => {
          const tool = findTool(catalogue, id);
          return option(
            id,
            tool?.name ?? id,
            tool?.category ?? '',
            [tool?.category ?? NO_FACT, `${String(tool?.costGp ?? 0)} po`, NO_FACT],
            null,
          );
        });
      return [...skills, ...tools];
    }
  }
}

/**
 * Tous les créneaux qu'ouvre le brouillon courant, dans un ordre stable qui est
 * aussi la priorité d'exclusion. Une option déjà acquise reste dans la liste,
 * marquée `unavailable` : l'interface peut ainsi expliquer pourquoi elle est
 * grisée, et la purge la retirer sans perdre son libellé.
 */
export function openChoices(
  draft: CharacterDraft,
  catalogue: Catalogue,
): readonly ChoiceSlot[] {
  const granted = fixedGrants(draft, catalogue);
  const slots: ChoiceSlot[] = [];

  for (const owner of specsInPriorityOrder(draft, catalogue)) {
    const { spec, source, parentId } = owner;
    const id = slotId(source, parentId, spec.subject);
    const picked = pickedFor(draft, id);
    const register = registerFor(spec.kind, granted);
    // `slot-full` ne vaut que pour un choix multiple. Un choix unique reste un
    // bouton radio, où remplacer sa sélection est naturel et attendu (§A19).
    const isFull = spec.pick > 1 && picked.length >= spec.pick;

    const options = buildOptions(owner, draft, catalogue, granted).map(
      (entry): ChoiceOption => {
        const isChosen = picked.includes(entry.id);
        // Le registre ne contient jamais les réponses de CE créneau : elles y
        // sont versées après. Une option marquée ici l'est donc par une source
        // antérieure, et le fait qu'on l'ait cochée n'y change rien : c'est ce
        // qui permet à la purge de retirer un doublon apparu après coup.
        const grantedBy = register?.get(entry.id);
        if (grantedBy !== undefined) {
          return {
            ...entry,
            unavailable: { kind: 'already-granted', source: grantedBy },
          };
        }
        if (isFull && !isChosen) {
          return { ...entry, unavailable: { kind: 'slot-full' } };
        }
        return entry;
      },
    );

    slots.push({
      id,
      source,
      kind: spec.kind,
      title: spec.title,
      help: spec.help,
      pick: spec.pick,
      options,
    });

    // Les réponses de ce créneau comptent pour les créneaux SUIVANTS, jamais
    // pour lui-même : c'est ce qui rend le résultat indépendant de l'ordre
    // dans lequel le joueur a répondu.
    if (register !== null && spec.kind !== 'expertise') {
      grantAll(register, picked, source);
    }
  }

  return slots;
}

/** Un bonus d'origine posé par le joueur : où il va, d'où il vient, combien. */
export interface ChosenAbilityBonus {
  readonly ability: string;
  readonly slotId: ChoiceSlotId;
  /** La VALEUR du créneau. Compter chaque réponse pour 1 ferait d'un +2 un +1. */
  readonly bonus: number;
}

const ADVANCEMENT_MODES: readonly AdvancementMode[] = [
  'ability-2',
  'ability-1-1',
  'feat',
];

function asAdvancementMode(value: string | undefined): AdvancementMode | undefined {
  return ADVANCEMENT_MODES.find((mode) => mode === value);
}

/**
 * Ce qu'un créneau pose dans une caractéristique, `null` s'il n'y pose rien.
 * Le `switch` fait ce qu'une comparaison répétée ne ferait pas : il restreint
 * le type, donc `spec.bonus` est lisible sans conversion.
 */
function abilityBonusOf(spec: ChoiceSpec): number | null {
  switch (spec.kind) {
    case 'ability':
    case 'improvement': {
      return spec.bonus;
    }
    case 'skill':
    case 'language':
    case 'tool':
    case 'equipment':
    case 'ancestry':
    case 'fighting-style':
    case 'feat':
    case 'advancement':
    case 'cantrip':
    case 'spell':
    case 'expertise': {
      return null;
    }
  }
}

export function chosenAbilityBonuses(
  draft: CharacterDraft,
  catalogue: Catalogue,
): readonly ChosenAbilityBonus[] {
  const chosen: ChosenAbilityBonus[] = [];
  for (const { spec, source, parentId } of specsInPriorityOrder(draft, catalogue)) {
    const bonus = abilityBonusOf(spec);
    if (bonus === null) {
      continue;
    }
    const id = slotId(source, parentId, spec.subject);
    for (const ability of pickedFor(draft, id)) {
      chosen.push({ ability, slotId: id, bonus });
    }
  }
  return chosen;
}

/**
 * Les six scores finaux : base, bonus fixes, bonus d'origine et améliorations
 * de niveau. La fiche s'en sert pour afficher, `openChoices` pour savoir ce
 * qui a atteint 20 : un seul calcul, donc une seule règle.
 */
/**
 * Les totaux du personnage. `exceptSlot` retire la contribution d'un créneau
 * précis : un créneau qui juge ses propres options ne doit pas compter la
 * réponse qu'il a déjà reçue, sinon l'option choisie se grise elle-même.
 */
export function abilityTotals(
  draft: CharacterDraft,
  catalogue: Catalogue,
  exceptSlot: string | null = null,
): AbilityScores {
  const race = findRace(catalogue, draft.raceId);
  const subrace = findSubrace(catalogue, draft.raceId, draft.subraceId);
  const chosen = chosenAbilityBonuses(draft, catalogue).filter(
    (entry) => entry.slotId !== exceptSlot,
  );
  return abilityScores((ability) => {
    const fixed =
      (race?.abilityBonuses[ability] ?? 0) + (subrace?.abilityBonuses[ability] ?? 0);
    const placed = chosen
      .filter((entry) => entry.ability === ability)
      .reduce((total, entry) => total + entry.bonus, 0);
    return draft.baseAbilities[ability] + fixed + placed;
  });
}
