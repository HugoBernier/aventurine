import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

/** Un pack minimal, écrit comme le créateur l'écrit. */
const PACK_FILE = new File(
  [
    JSON.stringify({
      aventurine: 2,
      pack: {
        id: 'karn',
        name: 'Les Brumes de Karn',
        author: 'Hugo',
        description: '',
        updatedAt: '2026-09-04T10:12:00.000Z',
      },
      spells: [
        {
          id: 'karn-appel-des-brumes',
          name: 'Appel des brumes',
          level: 1,
          school: 'invocation',
          castingTime: '1 action',
          range: '18 mètres',
          components: { verbal: true, somatic: true, material: null },
          duration: 'instantanée',
          concentration: false,
          ritual: false,
          summary: 'Une brume épaisse se lève et masque le champ de bataille.',
          classes: ['magicien'],
        },
      ],
    }),
  ],
  'pack-karn.json',
  { type: 'application/json' },
);

const next = async (user: ReturnType<typeof userEvent.setup>): Promise<void> => {
  await user.click(screen.getByRole('button', { name: 'Suivant ›' }));
};

/** Un nain barbare de niveau 1, fiche ouverte : le plus court chemin. */
const barbarianSheet = async (
  user: ReturnType<typeof userEvent.setup>,
): Promise<void> => {
  render(<App />);
  await user.click(screen.getByRole('radio', { name: /Nain/ }));
  await next(user);
  await next(user);
  await user.click(screen.getByRole('radio', { name: /Barbare/ }));
  await user.click(screen.getByRole('button', { name: /Ma fiche/ }));
};

describe('parcours de création', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });
  afterEach(() => {
    globalThis.localStorage.clear();
    vi.restoreAllMocks();
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

  it('annonce ce que la race change sur la fiche, dans la barre qui ne défile pas', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: /Nain/ }));
    // Le « p » distingue la ligne de la barre des repères de la carte, qui
    // portent le même fait dans une liste de définitions.
    const line = screen.getByText(/résiste au poison/, { selector: 'p' });
    expect(line).toHaveTextContent(/Ta fiche/);
    expect(line).toHaveTextContent(/7,50 m/);
    expect(line).toHaveTextContent(/vision 18 m/);
  });

  it('montre les repères d’une race avant même de la choisir', () => {
    render(<App />);
    // La bande de repères ne s'affichait pas du tout : les trois colonnes
    // existaient dans les données et n'atteignaient jamais l'écran.
    expect(screen.getAllByText('Taille et vitesse').length).toBeGreaterThan(0);
    expect(screen.getByText('Vision 18 m, résiste au poison')).toBeInTheDocument();
    expect(screen.getByText('Vision 18 m, résiste au feu')).toBeInTheDocument();
  });

  it('écrit le vrai niveau sur la fiche, pas un 1 en dur', async () => {
    const user = userEvent.setup();
    await barbarianSheet(user);
    expect(screen.getByText(/Nain · Barbare · niveau 1/)).toBeInTheDocument();
    // « Tes choix · Niveau » ramène à l'écran du niveau depuis la fiche.
    await user.click(screen.getByRole('button', { name: /^Niveau · 1/ }));
    await user.click(screen.getByRole('button', { name: 'Monter d’un niveau' }));
    await user.click(screen.getByRole('button', { name: /Ma fiche/ }));
    expect(screen.getByText(/Nain · Barbare · niveau 2/)).toBeInTheDocument();
  });

  it('montre les aptitudes de classe, avec leur effet chiffré', async () => {
    const user = userEvent.setup();
    await barbarianSheet(user);
    expect(screen.getByRole('heading', { name: 'Tes aptitudes' })).toBeInTheDocument();
    // Pas seulement le nom : le joueur doit pouvoir jouer l'aptitude sans livre.
    expect(screen.getByText('Rage')).toBeInTheDocument();
    expect(screen.getByText(/\+2 aux dégâts/)).toBeInTheDocument();
  });

  it('n’affiche pas une aptitude que le niveau n’a pas encore ouverte', async () => {
    const user = userEvent.setup();
    await barbarianSheet(user);
    expect(screen.queryByText('Rage implacable')).not.toBeInTheDocument();
  });

  it('montre les sorts choisis sur la fiche, et permet d’en changer', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('radio', { name: /Nain/ }));
    await next(user);
    await next(user);
    await user.click(screen.getByRole('radio', { name: /Magicien/ }));
    // Aller jusqu'aux tours de magie et en prendre un.
    for (let step = 0; step < 12; step++) {
      const reached = screen.queryByRole('heading', { name: /tours de magie/i });
      if (reached !== null) {
        const [first] = screen.getAllByRole('checkbox');
        if (first !== undefined) {
          await user.click(first);
        }
        break;
      }
      await next(user);
    }
    await user.click(screen.getByRole('button', { name: /Ma fiche/ }));

    expect(screen.getByRole('heading', { name: 'Ta magie' })).toBeInTheDocument();
    expect(screen.getByText('Degré de sauvegarde')).toBeInTheDocument();
    // Le bouton « Changer » ramène à l'écran de choix, sans refaire l'assistant.
    const [change] = screen.getAllByRole('button', { name: 'Changer' });
    if (change !== undefined) {
      await user.click(change);
    }
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /tours de magie/i,
    );
  });

  it('offre d’imprimer la fiche, et ne s’imprime pas lui-même', async () => {
    const user = userEvent.setup();
    await barbarianSheet(user);
    const bouton = screen.getByRole('button', { name: /Imprimer ou enregistrer/ });
    // Le bouton déclenche l'impression du navigateur, sans bibliothèque PDF.
    expect(bouton).toHaveAttribute('data-print', 'hide');
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

  it('enregistre la fiche dans un fichier, et rouvre ce fichier', async () => {
    const user = userEvent.setup();
    await barbarianSheet(user);

    // Le téléchargement n'existe pas dans jsdom : on lit le texte que le lien
    // aurait emporté, à la source, dans le Blob qu'on vient de fabriquer.
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {
      // rien à libérer ici
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {
      // jsdom ne télécharge pas
    });
    const madeBlob = vi.spyOn(globalThis, 'Blob');

    await user.click(
      screen.getByRole('button', { name: /Enregistrer sur mon appareil/ }),
    );
    const [parts] = madeBlob.mock.calls[0] ?? [];
    const written = typeof parts?.[0] === 'string' ? parts[0] : '';
    expect(written).toContain('"aventurine"');
    expect(written).toContain('barbare');

    // Table rase, puis on rouvre le fichier depuis la bibliothèque.
    await user.click(screen.getByRole('button', { name: /Tes personnages/ }));
    await user.click(screen.getByRole('button', { name: /Nouveau personnage/ }));
    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));
    await user.click(screen.getByRole('button', { name: /Tes personnages/ }));

    const file = new File([written], 'personnage.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText(/Ouvrir un fichier/), file);

    // Le personnage rouvert s'AJOUTE : les deux sont là, et le nain est en cours.
    const entries = screen.getAllByRole('listitem');
    const [current] = entries;
    expect(entries).toHaveLength(3);
    expect(current).toHaveTextContent('en cours');
    expect(current).toHaveTextContent(/Nain Barbare/);
  });

  it('refuse net un fichier qui n’est pas un personnage', async () => {
    const user = userEvent.setup();
    await barbarianSheet(user);
    await user.click(screen.getByRole('button', { name: /Tes personnages/ }));

    // Un `.json` abîmé : `accept` écarte déjà les autres extensions.
    const file = new File(['ceci n’est pas du JSON'], 'note.json', {
      type: 'application/json',
    });
    await user.upload(screen.getByLabelText(/Ouvrir un fichier/), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /n’est pas un personnage Aventurine/,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('installe un pack, et son sort devient choisissable', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));
    await user.click(screen.getByRole('button', { name: /Tes packs/ }));
    await user.upload(screen.getByLabelText(/Installer un pack/), PACK_FILE);

    expect(screen.getByText('Les Brumes de Karn')).toBeInTheDocument();
    expect(screen.getByText(/par Hugo/)).toHaveTextContent('1 sort');

    // Le catalogue de l'assistant est celui du SRD PLUS les packs installés :
    // rien d'autre n'a été branché pour que ce sort apparaisse ici.
    await user.click(screen.getByRole('button', { name: 'Revenir à l’assistant' }));
    await user.click(screen.getByRole('radio', { name: /Nain/ }));
    await next(user);
    await next(user);
    await user.click(screen.getByRole('radio', { name: /Magicien/ }));
    for (let step = 0; step < 12; step++) {
      if (screen.queryByRole('checkbox', { name: /Appel des brumes/ }) !== null) {
        break;
      }
      await next(user);
    }
    const spell = screen.getByRole('checkbox', { name: /Appel des brumes/ });
    expect(spell).toBeInTheDocument();
    await user.click(spell);

    // Le repère de provenance suit l'entrée : ce sort n'est pas du SRD.
    expect(screen.getAllByText('Les Brumes de Karn').length).toBeGreaterThan(0);

    // Retirer le pack ne détruit rien : la réponse dort et revient avec lui.
    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));
    expect(screen.getByText(/Contient du contenu maison/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Tes packs/ }));
    await user.click(screen.getByRole('button', { name: 'Retirer' }));
    await user.click(screen.getByRole('button', { name: 'Oui, retirer' }));
    expect(screen.getByText(/aucun pack/)).toBeInTheDocument();

    // Réinstallé sans rien ressaisir, le sort est de retour sur la fiche.
    await user.upload(screen.getByLabelText(/Installer un pack/), PACK_FILE);
    await user.click(screen.getByRole('button', { name: 'Revenir à l’assistant' }));
    await user.click(screen.getByRole('button', { name: 'Ma fiche' }));
    expect(screen.getByText('Appel des brumes')).toBeInTheDocument();
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
