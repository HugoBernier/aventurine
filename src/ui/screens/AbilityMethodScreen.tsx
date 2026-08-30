import type { ReactNode } from 'react';
import type { AbilityMethod } from '../../domain/draft';
import { useAbilities } from '../../state/hooks';
import { ChoiceGroup } from '../components/ChoiceGroup';
import { Explainer } from '../components/Explainer';

const OPTIONS = [
  {
    id: 'point-buy',
    label: 'Répartir des points',
    blurb: 'Tu construis chaque score toi-même.',
    facts: ['27 points', 'De 8 à 15 avant bonus', 'Tu veux tout maîtriser'] as const,
    details: [],
    unavailable: null,
  },
  {
    id: 'standard-array',
    label: 'Tableau standard',
    blurb: 'Six scores tout prêts, à placer où tu veux.',
    facts: ['Aucun calcul', '15, 14, 13, 12, 10, 8', 'Tu veux aller vite'] as const,
    details: [],
    unavailable: null,
  },
];

/**
 * Écran séparé de la répartition : une décision par écran. Mettre les deux
 * ensemble ferait un écran à deux décisions.
 */
export function AbilityMethodScreen(): ReactNode {
  const { method, setMethod } = useAbilities();
  return (
    <>
      <Explainer label="C’est quoi une caractéristique ?">
        Six chiffres qui décrivent ton personnage. Chacun donne un
        <strong> modificateur</strong>, le petit bonus que tu ajoutes à tes jets de dés.
        Un score de 14 donne +2, un score de 8 donne −1.
      </Explainer>
      <ChoiceGroup
        legend="Comment veux-tu tes scores ?"
        kind="ability"
        fieldName="ability-method"
        pick={1}
        options={OPTIONS}
        picked={[method]}
        onToggle={(id) => {
          setMethod(id as AbilityMethod);
        }}
      />
    </>
  );
}
