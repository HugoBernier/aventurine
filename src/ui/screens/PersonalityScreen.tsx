import type { ReactNode } from 'react';
import { findBackground } from '../../domain/catalogue';
import type { SuggestedTraits } from '../../domain/content';
import type { PersonalTraits } from '../../domain/draft';
import { useCatalogue, useDraft, useDraftText } from '../../state/hooks';
import { Explainer } from '../components/Explainer';
import { Notice } from '../components/Notice';
import { TextField } from '../components/TextField';

interface FieldSpec {
  readonly field: keyof PersonalTraits;
  readonly suggestions: keyof SuggestedTraits;
  readonly label: string;
  readonly hint: string;
}

const FIELDS: readonly FieldSpec[] = [
  {
    field: 'trait',
    suggestions: 'traits',
    label: 'Un trait de caractère',
    hint: 'Ce qu’on remarque en te croisant.',
  },
  {
    field: 'ideal',
    suggestions: 'ideals',
    label: 'Ton idéal',
    hint: 'Ce en quoi tu crois, même quand ça coûte.',
  },
  {
    field: 'bond',
    suggestions: 'bonds',
    label: 'Ton lien',
    hint: 'Quelqu’un ou quelque chose qui compte.',
  },
  {
    field: 'flaw',
    suggestions: 'flaws',
    label: 'Ton défaut',
    hint: 'Ce qui te met dans l’embarras.',
  },
];

function TraitField({
  spec,
  suggestion,
}: {
  readonly spec: FieldSpec;
  readonly suggestion: string | undefined;
}): ReactNode {
  const text = useDraftText(spec.field);
  const hint =
    suggestion === undefined ? spec.hint : `${spec.hint} Par exemple : « ${suggestion} »`;
  return (
    <TextField
      label={spec.label}
      defaultValue={text.initial}
      onCommit={text.commit}
      hint={hint}
      maxLength={300}
      multiline
    />
  );
}

export function PersonalityScreen(): ReactNode {
  const catalogue = useCatalogue();
  const draft = useDraft();
  const background = findBackground(catalogue, draft.backgroundId);
  const suggestions = background?.suggestedTraits;

  return (
    <>
      <Explainer label="À quoi ça sert ?">
        Ces quatre phrases ne changent aucun chiffre : elles servent à jouer. Écris ce que
        tu veux, ou laisse vide et reviens plus tard.
      </Explainer>
      {background?.assembledFromGenericRules === true && (
        <Notice tone="reminder">
          Ton historique est composé à partir des règles générales du SRD : à toi d’écrire
          ces quatre phrases entièrement.
        </Notice>
      )}
      {FIELDS.map((spec) => (
        <TraitField
          key={spec.field}
          spec={spec}
          suggestion={suggestions?.[spec.suggestions][0]}
        />
      ))}
    </>
  );
}
