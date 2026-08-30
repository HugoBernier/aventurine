import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';

/**
 * Test d'intégration exigé par docs/plans/00-arbitrage.md §A13 : il monte
 * l'application entière et parcourt l'assistant en ne visant que des rôles et
 * des libellés français, jamais une classe CSS.
 *
 * C'est la compensation explicite du renoncement à Playwright : il couvre le
 * parcours complet et la persistance d'un rechargement à l'autre, c'est-à-dire
 * tout ce qu'un test de bout en bout apporterait hors du rendu physique.
 */

const next = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.click(screen.getByRole('button', { name: 'Suivant ›' }));
};

describe('parcours de création', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });
  afterEach(() => {
    globalThis.localStorage.clear();
  });

  it('ouvre sur le choix de la race, à la première étape', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Choisis ta race',
    );
    expect(screen.getByText(/Étape 1 sur/)).toBeInTheDocument();
  });

  it('propose les neuf races du SRD', () => {
    render(<App />);
    expect(screen.getAllByRole('radio')).toHaveLength(9);
  });

  it('laisse avancer sans avoir rien choisi', async () => {
    const user = userEvent.setup();
    render(<App />);
    await next(user);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Choisis ta classe',
    );
  });

  it('insère l’écran de branche après avoir choisi une race qui en a', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: /Nain/ }));
    await next(user);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Choisis ta branche',
    );
  });

  it('n’insère pas d’écran de branche pour une race qui n’en a pas', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: /Humain/ }));
    await next(user);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Choisis ta classe',
    );
  });

  it('annonce ce que la race change sur la fiche', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: /Nain/ }));
    expect(screen.getByText(/Ce que ça change/)).toBeInTheDocument();
  });

  it('donne un nom accessible à chaque bouton', () => {
    render(<App />);
    for (const button of screen.getAllByRole('button')) {
      // Aucune icône seule : chaque cible tactile porte un libellé.
      expect(button).toHaveAccessibleName();
    }
  });

  it('explique le blocage plutôt que de griser un bouton en silence', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));
    await user.click(
      screen.getByRole('button', { name: /point à répartir|points à répartir/ }),
    );

    // On épuise le budget : 15 + 15 + 15 coûte exactement 27 points.
    for (const ability of ['Force', 'Dextérité', 'Constitution']) {
      const button = screen.getByRole('button', { name: `Augmenter ${ability}` });
      for (let index = 0; index < 7; index += 1) {
        await user.click(button);
      }
    }
    // Le bouton restant est inactif, mais il dit pourquoi.
    expect(screen.getByRole('button', { name: 'Augmenter Sagesse' })).toBeDisabled();
    expect(screen.getAllByText(/Il te reste .* monter/).length).toBeGreaterThan(0);
  });

  it('donne une étiquette à chaque champ de saisie', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));
    await user.click(screen.getByRole('button', { name: /n’a pas encore de nom/ }));
    // `getByLabelText` échouerait sur un champ sans <label> associé.
    expect(screen.getByLabelText('Le nom de ton personnage')).toBeInTheDocument();
  });

  it('n’utilise aucun élément cliquable sans rôle', () => {
    render(<App />);
    // Un `div` avec un `onClick` n'a ni rôle, ni focus, ni activation clavier.
    // C'est la régression que `eslint-plugin-jsx-a11y` aurait signalée ; il est
    // incompatible avec ESLint 10, donc le test tient ce rôle.
    // Accès direct au DOM assumé : on audite une propriété STRUCTURELLE
    // qu'aucune requête de Testing Library ne sait exprimer : l'absence d'un
    // motif, pas la présence d'un élément.
    // eslint-disable-next-line testing-library/no-node-access
    const clickable = document.querySelectorAll('div[onclick], span[onclick]');
    expect(clickable).toHaveLength(0);
  });

  it('groupe les options dans un ensemble nommé', () => {
    render(<App />);
    // `fieldset` + `legend` natifs : le nom du groupe est annoncé sans ARIA.
    expect(screen.getByRole('group', { name: 'Choisis ta race' })).toBeInTheDocument();
  });

  it('liste ce qui manque sur le récapitulatif et y renvoie en un geste', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));

    expect(screen.getByText(/Il te reste .* choix à faire/)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /Tu n’as pas encore choisi ta classe/ }),
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Choisis ta classe',
    );
  });

  it('efface les compétences de la classe quittée et l’annonce', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));
    await user.click(
      screen.getByRole('button', { name: /Tu n’as pas encore choisi ta classe/ }),
    );
    await user.click(screen.getByRole('radio', { name: /Roublard/ }));

    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));
    await user.click(screen.getByRole('button', { name: /compétences? à choisir/ }));
    await user.click(screen.getByRole('checkbox', { name: /Discrétion/ }));

    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));
    await user.click(
      screen.getByRole('button', { name: (name) => name.startsWith('Classe ·') }),
    );
    await user.click(screen.getByRole('radio', { name: /Clerc/ }));

    const notices = screen.getAllByRole('status');
    expect(notices.some((notice) => notice.textContent.includes('remis à zéro'))).toBe(
      true,
    );
  });

  it('retrouve le personnage après un rechargement', async () => {
    const user = userEvent.setup();
    const view = render(<App />);
    await user.click(screen.getByRole('radio', { name: /Humain/ }));
    await next(user);
    await user.click(screen.getByRole('radio', { name: /Barde/ }));
    // Sur mobile l'onglet est tué sans `beforeunload` : c'est `pagehide` qui
    // déclenche l'écriture immédiate, et c'est donc ce chemin qu'on teste.
    globalThis.dispatchEvent(new Event('pagehide'));
    view.unmount();

    render(<App />);
    // La reprise est synchrone : on retrouve l'écran quitté, pas le premier.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Choisis ta classe',
    );
    expect(screen.getByRole('radio', { name: /Barde/ })).toBeChecked();
  });

  it('affiche l’attribution SRD et la mention de non-affiliation', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));
    const main = within(document.body);
    expect(main.getByText(/System Reference Document/)).toBeInTheDocument();
    expect(main.getByText(/non affilié à Wizards of the Coast/)).toBeInTheDocument();
  });

  it('garde le premier personnage quand on en commence un second', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('radio', { name: /Nain/ }));
    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));
    await user.click(screen.getByRole('button', { name: /Tes personnages/ }));
    await user.click(screen.getByRole('button', { name: /Nouveau personnage/ }));

    // Le nouveau part d'une feuille blanche.
    expect(screen.getByRole('radio', { name: /Nain/ })).not.toBeChecked();

    // Et l'ancien est toujours là, rangé.
    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));
    await user.click(screen.getByRole('button', { name: /Tes personnages/ }));
    expect(screen.getAllByText(/Nain/).length).toBeGreaterThan(0);
  });

  it('permet de monter de niveau depuis la fiche', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('radio', { name: /Nain/ }));
    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));

    // Le retour le plus fréquent sur une fiche finie : après une séance, on
    // monte d'un niveau. Il doit se faire depuis la fiche, pas en refaisant
    // tout le parcours à l'envers.
    await user.click(screen.getByRole('button', { name: /Niveau · 1/ }));
    await user.click(screen.getByRole('button', { name: 'Monter d’un niveau' }));

    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
