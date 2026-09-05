import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CATALOGUE } from '../../data/catalogue';
import { advancement } from '../../data/classes/helpers';
import type { ChoiceOption } from '../../domain/choice';
import { PacksProvider } from '../../state/PacksProvider';
import { ChoiceGroup } from './ChoiceGroup';

const option = (details: ChoiceOption['details']): ChoiceOption => ({
  id: 'barbare',
  label: 'Barbare',
  blurb: 'Tu encaisses, tu avances, tu frappes.',
  facts: ['Dé de vie d12', 'Force + Constitution', 'Armures intermédiaires'],
  details,
  unavailable: null,
});

function renderGroup(options: readonly ChoiceOption[], onToggle = vi.fn()): void {
  render(
    <PacksProvider base={CATALOGUE} advancementFor={advancement}>
      <ChoiceGroup
        legend="Choisis ta classe"
        kind="ability"
        fieldName="class"
        pick={1}
        options={options}
        picked={[]}
        onToggle={onToggle}
      />
    </PacksProvider>,
  );
}

describe('la fiche repliée d’une carte de choix', () => {
  it('n’affiche aucun dépliant quand l’entrée n’a pas de fiche', () => {
    renderGroup([option([])]);
    expect(screen.queryByText('La fiche de Barbare')).toBeNull();
  });

  it('propose la fiche, repliée, quand l’entrée en a une', () => {
    renderGroup([option([{ title: 'Points de vie', body: 'd12 par niveau.' }])]);
    expect(screen.getByText('La fiche de Barbare')).toBeVisible();
    // Repliée : le contenu existe dans le DOM mais n'est pas affiché.
    expect(screen.getByText('d12 par niveau.')).not.toBeVisible();
  });

  it('montre les sections une fois la fiche dépliée', async () => {
    renderGroup([
      option([
        { title: 'Points de vie', body: 'd12 par niveau.' },
        { title: 'Niveau 1', body: 'Rage — En action bonus.' },
      ]),
    ]);
    await userEvent.click(screen.getByText('La fiche de Barbare'));
    expect(screen.getByText('Points de vie')).toBeVisible();
    expect(screen.getByText('Rage — En action bonus.')).toBeVisible();
  });

  it('lire la fiche ne choisit pas la classe', async () => {
    const onToggle = vi.fn();
    renderGroup(
      [option([{ title: 'Points de vie', body: 'd12 par niveau.' }])],
      onToggle,
    );
    await userEvent.click(screen.getByText('La fiche de Barbare'));
    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: /Barbare/ })).not.toBeChecked();
  });

  it('choisir la classe reste un appui sur la carte', async () => {
    const onToggle = vi.fn();
    renderGroup(
      [option([{ title: 'Points de vie', body: 'd12 par niveau.' }])],
      onToggle,
    );
    await userEvent.click(screen.getByText('Barbare'));
    expect(onToggle).toHaveBeenCalledWith('barbare');
  });
});
