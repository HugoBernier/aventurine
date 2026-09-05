import type { ContentPack, PackEntryKind, PackIssue } from '../../domain/pack';
import type { PackFileResult } from '../../state/persistence/packFile';
import { counted } from './plural';

const SECTIONS: Readonly<Record<string, string>> = {
  races: 'des races',
  classes: 'des classes',
  backgrounds: 'des historiques',
};

const FIELDS: Readonly<Record<string, string>> = {
  id: 'il lui manque un identifiant',
  name: 'il lui manque un nom',
  level: 'son niveau n’est pas un niveau de sort',
  school: 'son école de magie n’existe pas',
  summary: 'il lui manque un résumé',
  classes: 'aucune classe ne peut le lancer',
  sort: 'ce n’est pas un sort',
  blurb: 'il lui manque sa phrase de présentation',
  for: 'elle ne dit pas à quelle classe elle s’ajoute',
  features: 'il lui faut au moins une aptitude, avec son niveau, son nom et son texte',
  'sous-classe': 'ce n’est pas une sous-classe',
};

/** Ce que cette version ne sait pas encore porter, dit dans les mots du jeu. */
const FIELDS_TO_COME: Readonly<Record<string, string>> = {
  proficiencies: 'donner des maîtrises',
  alwaysPreparedSpells: 'donner des sorts toujours préparés',
  unarmoredDefense: 'donner une défense sans armure',
  bonusHitPointsPerLevel: 'donner des points de vie en plus',
  choices: 'ouvrir un choix au joueur',
};

const WHAT: Readonly<Record<PackEntryKind, string>> = {
  spell: 'Sort',
  subclass: 'Sous-classe',
};

/** « Sort n° 3 » quand rien ne le nomme, « Sort « karn-brume » » sinon. */
function entryOf(at: number, entry: string, what: PackEntryKind): string {
  return entry === '' ? `${WHAT[what]} n° ${String(at)}` : `${WHAT[what]} « ${entry} »`;
}

/** Une raison, une phrase. Le domaine constate ; ici on le dit. */
export function formatPackIssue(issue: PackIssue): string {
  switch (issue.kind) {
    case 'not-a-pack': {
      return 'Ce fichier n’est pas un pack Aventurine.';
    }
    case 'bad-pack-id': {
      return 'Le pack n’a pas d’identifiant utilisable : des minuscules, des chiffres et des tirets, comme « brumes-de-karn ».';
    }
    case 'missing-name': {
      return 'Le pack n’a pas de nom : sans lui, rien ne le désigne dans la liste.';
    }
    case 'missing-field': {
      return `${entryOf(issue.at, issue.entry, issue.what)} : ${FIELDS[issue.field] ?? 'un champ manque'}.`;
    }
    case 'bad-prefix': {
      return `${entryOf(issue.at, issue.entry, issue.what)} : son identifiant doit commencer par celui du pack, c’est ce qui empêche deux packs de se marcher dessus.`;
    }
    case 'duplicate-id': {
      return `${entryOf(issue.at, issue.entry, issue.what)} : cet identifiant est déjà pris dans ce pack.`;
    }
    case 'unknown-class': {
      return `${entryOf(issue.at, issue.entry, issue.what)} : « ${issue.value} » n’est pas une classe que cette version connaît.`;
    }
    case 'field-not-yet-supported': {
      return `${entryOf(issue.at, issue.entry, issue.what)} : cette version ne sait pas encore ${FIELDS_TO_COME[issue.field] ?? 'porter ce champ'}. Retire-le du fichier, ou attends la version qui le lira.`;
    }
    case 'not-yet-supported': {
      return `Ce pack contient ${SECTIONS[issue.section] ?? 'du contenu'} : cette version d’Aventurine ne sait lire que les sorts et les sous-classes.`;
    }
  }
}

/** Ce qu'on dit d'un fichier refusé. `null` : il est accepté, ça se voit. */
export function formatPackFileResult(result: PackFileResult): readonly string[] {
  switch (result.kind) {
    case 'ok': {
      return [];
    }
    case 'unreadable': {
      return ['Ce fichier n’est pas un pack Aventurine.'];
    }
    case 'too-new': {
      return [
        'Ce pack a été écrit par une version plus récente d’Aventurine. Recharge la page, puis réessaie.',
      ];
    }
    case 'too-big': {
      return ['Ce fichier est bien trop lourd pour un pack.'];
    }
    case 'invalid': {
      return result.issues.map((issue) => formatPackIssue(issue));
    }
  }
}

/** « par Hugo, version du 4 septembre 2026 » : la date EST la version. */
export function formatPackLine(pack: ContentPack): string {
  const by = pack.info.author === '' ? '' : `par ${pack.info.author}, `;
  const date = formatPackDate(pack.info.updatedAt);
  return date === '' ? by.replace(/, $/u, '') : `${by}version du ${date}`;
}

export function formatPackDate(updatedAt: string): string {
  const at = new Date(updatedAt);
  if (Number.isNaN(at.getTime())) {
    return '';
  }
  return at.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Ce que le pack apporte, compté : c'est ce qu'on veut savoir avant d'installer. */
export function formatPackContents(pack: ContentPack): string {
  const parts = [
    pack.spells.length === 0 ? null : counted(pack.spells.length, 'sort', 'sorts'),
    pack.subclasses.length === 0
      ? null
      : counted(pack.subclasses.length, 'sous-classe', 'sous-classes'),
  ].filter((part): part is string => part !== null);
  return parts.length === 0 ? 'rien pour l’instant' : parts.join(' · ');
}

/**
 * Ce que l'attribution SRD ne couvre pas, dit sur la fiche — imprimée
 * comprise, celle qu'on tend au meneur, qui a le plus besoin de savoir qu'un
 * sort n'est pas dans le livre. `null` quand tout vient du SRD.
 */
export function formatHomebrewNotice(packs: readonly ContentPack[]): string | null {
  if (packs.length === 0) {
    return null;
  }
  const named = packs
    .map((pack) => {
      const date = formatPackDate(pack.info.updatedAt);
      return date === '' ? pack.info.name : `${pack.info.name} (${date})`;
    })
    .join(', ');
  return `Contient du contenu maison, hors SRD : ${named}.`;
}
