import { describe, expect, it } from 'vitest';
import { emptyDraft } from '../../domain/draft';
import { formatImportResult } from './characterFile';

describe('ce qu’on dit après avoir ouvert un fichier', () => {
  it('ne dit rien quand tout va bien', () => {
    expect(
      formatImportResult({ kind: 'ok', draft: emptyDraft(), warnings: [] }),
    ).toBeNull();
  });

  it('refuse net un fichier illisible', () => {
    expect(formatImportResult({ kind: 'unreadable' })?.tone).toBe('error');
  });

  it('nomme le cas d’un fichier trop récent', () => {
    expect(formatImportResult({ kind: 'too-new', wrote: 3 })?.text).toContain(
      'version plus récente',
    );
  });

  it('accorde au singulier ce qu’il n’a pas compris', () => {
    const message = formatImportResult({
      kind: 'ok',
      draft: emptyDraft(),
      warnings: [{ kind: 'unknown-slot', slotId: 'x' }],
    });
    expect(message?.text).toBe(
      'Personnage ouvert. 1 donnée du fichier n’a pas été comprise : elle est ignorée.',
    );
  });

  it('accorde au pluriel au-delà', () => {
    const message = formatImportResult({
      kind: 'ok',
      draft: emptyDraft(),
      warnings: [
        { kind: 'unknown-slot', slotId: 'x' },
        { kind: 'value-truncated', field: 'name' },
      ],
    });
    expect(message?.text).toBe(
      'Personnage ouvert. 2 données du fichier n’ont pas été comprises : elles sont ignorées.',
    );
  });
});
