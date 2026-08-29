import type { Catalogue } from './catalogue';
import { slotId } from './choice';
import type {
  ChoiceKind,
  ChoiceOption,
  ChoiceSlot,
  ChoiceSource,
  UnavailableReason,
} from './choice';
import type { ChoiceSpec } from './choiceSpec';
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
import type { EquipmentOption, Facts } from './content';
import { pickedFor } from './draft';
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
  const granted: Granted = { skills: new Map(), languages: new Map(), tools: new Map() };

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
 * compétences déjà acquises — accrochée derrière la classe elle proposerait
 * une liste vide (docs/plans/00-arbitrage.md §A15).
 */
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
    case 'cantrip':
    case 'spell':
    case 'ability':
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
    case 'cantrip':
    case 'spell': {
      const level = spec.kind === 'cantrip' ? 0 : 1;
      return spellsForClass(catalogue, spec.listFrom, level).map((spell) =>
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
    const isFull = picked.length >= spec.pick;

    const options = buildOptions(owner, draft, catalogue, granted).map(
      (entry): ChoiceOption => {
        const isChosen = picked.includes(entry.id);
        // Le registre ne contient jamais les réponses de CE créneau — elles y
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
