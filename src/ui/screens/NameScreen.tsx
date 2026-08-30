import type { ReactNode } from 'react';
import { useDraftText } from '../../state/hooks';
import { Explainer } from '../components/Explainer';
import { TextField } from '../components/TextField';

export function NameScreen(): ReactNode {
  const name = useDraftText('name');
  return (
    <>
      <Explainer label="Faut-il un nom tout de suite ?">
        Non. Tu peux avancer sans, et revenir le remplir plus tard : le récapitulatif te
        le rappellera.
      </Explainer>
      <TextField
        label="Le nom de ton personnage"
        defaultValue={name.initial}
        onCommit={name.commit}
        placeholder="Alric, Lyra, Brann…"
        enterKeyHint="done"
        maxLength={60}
      />
    </>
  );
}
