import type { ContentPack, PackIssue } from '../../domain/pack';
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
};

/** « Sort n° 3 » quand rien ne le nomme, « Sort « karn-brume » » sinon. */
function entryOf(at: number, entry: string): string {
  return entry === '' ? `Sort n° ${String(at)}` : `Sort « ${entry} »`;
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
      return `${entryOf(issue.at, issue.entry)} : ${FIELDS[issue.field] ?? 'un champ manque'}.`;
    }
    case 'bad-prefix': {
      return `${entryOf(issue.at, issue.entry)} : son identifiant doit commencer par celui du pack, c’est ce qui empêche deux packs de se marcher dessus.`;
    }
    case 'duplicate-id': {
      return `${entryOf(issue.at, issue.entry)} : cet identifiant est déjà pris dans ce pack.`;
    }
    case 'unknown-class': {
      return `${entryOf(issue.at, issue.entry)} : « ${issue.value} » n’est pas une classe que cette version connaît.`;
    }
    case 'not-yet-supported': {
      return `Ce pack contient ${SECTIONS[issue.section] ?? 'du contenu'} : cette version d’Aventurine ne sait encore lire que les sorts.`;
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
  return counted(pack.spells.length, 'sort', 'sorts');
}
