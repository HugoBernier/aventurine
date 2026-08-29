# Lot 5 — Outillage, Qualité & Livraison

## Objectif

Poser le socle technique sur lequel les quatre autres lots écrivent le produit :
un projet qui démarre, un jeu de garde-fous qui **échouent vraiment**, une
commande unique (`npm run verify`), une CI qui la lance, et un site publié.

Contrainte de ce lot : **chaque outil doit gagner sa place**. Un fichier de
configuration que personne ne comprend est une dette. On préfère 15 lignes lues
par tout le monde à un préréglage de 200 lignes que personne n'ouvre.

Ce que ce lot ne fait pas : aucune règle D&D, aucun composant, aucune donnée SRD.

---

## Squelette et configuration

Arborescence cible à la fin de ce lot :

```
.editorconfig
.gitignore
.nvmrc
.prettierignore
.prettierrc.json
eslint.config.js
index.html
package.json
tsconfig.json
vite.config.ts
README.md
.github/workflows/ci.yml
src/
  main.tsx
  App.tsx
  domain/    (vide, un module témoin)
  data/      (vide, un module témoin)
  state/     (vide, un module témoin)
  ui/        (vide, un composant témoin)
  test/setup.ts
```

### `package.json`

```json
{
  "name": "dd-beyond-franche",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "engines": { "node": ">=22.22.2" },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0 && prettier --check .",
    "format": "prettier --write .",
    "test": "vitest run --coverage",
    "test:watch": "vitest",
    "verify": "npm run typecheck && npm run lint && npm run test"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^7.0.1",
    "@testing-library/react": "^16.3.3",
    "@testing-library/user-event": "^14.6.6",
    "@types/node": "^22.20.1",
    "@types/react": "^18.3.31",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react": "^6.1.1",
    "@vitest/coverage-v8": "^4.1.11",
    "eslint": "^10.9.1",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-react-hooks": "^7.1.1",
    "jsdom": "^30.0.1",
    "prettier": "^3.9.6",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.68.0",
    "vite": "^8.2.2",
    "vitest": "^4.1.11"
  }
}
```

Points de vigilance sur ces versions (vérifiés au registre npm) :

- `@vitejs/plugin-react@6` exige `vite@^8` : les deux vont ensemble.
- `@testing-library/react@16` déclare `@testing-library/dom` en **peer** :
  il doit être installé explicitement, sinon l'installation est incomplète.
- `jsdom@30` exige Node `^22.22.2 || ^24.15.0 || >=26` : d'où le `.nvmrc` exact.
- `typescript` en **tilde** (`~5.9.3`) : une mineure TypeScript peut introduire
  de nouvelles erreurs. La montée de version se fait volontairement, en un commit.
- **TypeScript reste en 5.9**, pas 7.x : `typescript-eslint@8` déclare
  `typescript >=4.8.4 <6.1.0`. Passer à TypeScript 7 aujourd'hui, c'est perdre
  le lint TypeScript. Le gain (vitesse de `tsc`) ne paie pas cette perte.
- **React 18** parce que la charte (§2) le dit. Voir « Risques ».

Paquets volontairement **non installés** : `eslint-plugin-import` (voir plus bas),
`eslint-plugin-jsx-a11y`, `eslint-plugin-react-refresh`, `globals`,
`npm-run-all`, `husky`, `lint-staged`, `commitlint`.

### `tsconfig.json`

Un seul fichier. `create-vite` en génère trois (`tsconfig.json`,
`tsconfig.app.json`, `tsconfig.node.json`) via des références de projet, pour
isoler les types Node du code applicatif. Arbitrage assumé : **deux fichiers de
plus que personne n'ouvre**, contre le risque qu'un composant écrive
`process.env`. Pour une application de quatre dossiers, un fichier gagne ; le
risque se traite en revue et se voit à l'exécution.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "types": ["node"],

    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,

    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "vite.config.ts"]
}
```

Au-delà de `strict`, coût et bénéfice, honnêtement :

| Option | Bénéfice réel ici | Coût réel | Verdict |
|---|---|---|---|
| `noUncheckedIndexedAccess` | Le domaine est une application de **tables** (races, classes, historiques indexés par identifiant). `RACES['nain']` devient `Race \| undefined` : le type dit enfin la vérité sur une clé absente ou mal orthographiée. | Bruit sur `tableau[i]` dans les boucles ; tentation du `!`. | **Activé.** La parade est un accesseur `findRace(id): Race \| undefined` écrit une fois, plus `@typescript-eslint/no-non-null-assertion` en erreur pour interdire le contournement au `!`. |
| `exactOptionalPropertyTypes` | Distingue « propriété absente » de « propriété à `undefined` ». | L'état du personnage en cours est **par nature** partiellement rempli, et « effacer un choix » s'écrit naturellement `{ ...p, subrace: undefined }`. Cette option transforme cette ligne banale en gymnastique (`delete`, `Omit`, types auxiliaires). | **Non activé.** Zéro bug évité ici, friction quotidienne garantie. À reconsidérer seulement si le lot 2 modélise les choix en `T \| null` obligatoire — alors l'option devient gratuite. |
| `noFallthroughCasesInSwitch` | Le reducer de l'assistant est un `switch`. Un `break` oublié y est un bug silencieux. | Nul. | **Activé.** |
| `noImplicitReturns` | Attrape la fonction qui retourne une valeur sur un chemin et rien sur un autre. | Quasi nul. | **Activé.** |
| `verbatimModuleSyntax` | Force `import type` explicite. Vite transpile fichier par fichier : l'ambiguïté « ce symbole est-il un type ? » disparaît. C'est aussi le défaut des modèles Vite : personne n'est surpris. | Il faut écrire `import type`. | **Activé.** |
| `noUnusedLocals` / `noUnusedParameters` | Code mort. | **Doublon** de `@typescript-eslint/no-unused-vars`, qui fait la même chose en mieux (motif `^_` configurable). Deux outils qui crient la même chose, c'est un outil de trop. | **Non activé.** `tsc` s'occupe des types, ESLint du code mort. |
| `noPropertyAccessFromIndexSignature` | Marginal. | Bruyant. | **Non activé.** |
| `noImplicitOverride` | Zéro classe dans ce projet. | — | **Non activé (YAGNI).** |
| `skipLibCheck` | Évite des erreurs non corrigeables dans les `.d.ts` tiers. | Masque de vraies erreurs de types tiers. | **Activé** — c'est le compromis standard et le seul tenable. |

**Pas d'alias de chemin** (`@/`). Quatre dossiers plats : les imports relatifs
restent courts. Un alias coûterait une configuration en double (tsconfig +
vite) et compliquerait la règle de dépendance ci-dessous.

### `vite.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Le site est publié sous https://<compte>.github.io/D-DBeyondFranche/.
// On garde la même base en dev : un bug de sous-chemin se voit tout de suite,
// pas seulement après déploiement.
export default defineConfig({
  base: '/D-DBeyondFranche/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/domain/**'],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
    },
  },
});
```

- `globals: false` : les tests importent `describe`, `it`, `expect` depuis
  `vitest`. Rien d'ambiant, rien à déclarer dans `tsconfig`.
- `css: false` : les tests ne compilent pas le CSS. Plus rapide, et cela empêche
  d'affirmer quoi que ce soit sur une classe CSS (on teste des rôles et des
  libellés, charte §7).
- Le bloc `test` vit dans `vite.config.ts` : un fichier de configuration, pas deux.

### `src/test/setup.ts`

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Avec globals: false, Testing Library ne peut pas enregistrer son nettoyage
// automatique (il cherche un afterEach global). On le fait à la main.
afterEach(cleanup);
```

Piège classique : sans ces trois lignes, les composants d'un test fuient dans le
suivant et les échecs deviennent dépendants de l'ordre.

### `index.html`

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta
      name="description"
      content="Crée ton personnage de D&D 5e en français, depuis ton téléphone."
    />
    <title>Créateur de personnage D&D — en français</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- `lang="fr"` : obligatoire, sinon les lecteurs d'écran prononcent le français
  avec la phonétique anglaise.
- **Pas** de `maximum-scale=1` ni de `user-scalable=no` : bloquer le zoom est une
  régression d'accessibilité, y compris sur un site pensé pour le pouce.

---

## Application de la règle de dépendance

La charte (§5) fixe : `ui → state → domain ← data`, « à sens unique, jamais
enfreinte ». Une convention non vérifiée est une convention morte. Il faut que
`npm run verify` **rougisse**.

### Traduction en interdictions

Seuls les sens *remontants* sont interdits. Les sens descendants (`ui → data`,
`state → data`) vont vers le noyau stable et ne violent pas la flèche.

| Dossier | N'a pas le droit d'importer | Pourquoi |
|---|---|---|
| `src/domain/` | `react`, `react-dom`, `ui`, `state`, `data` | Le domaine ne dépend de **rien** (charte §139). |
| `src/data/` | `react`, `react-dom`, `ui`, `state` | Données typées par `domain`, aucune logique. |
| `src/state/` | `react-dom`, `ui` | `state` a le droit à React (Context, `useReducer`), pas au DOM ni aux composants. |
| `src/ui/` | — | Tout ce qui est en dessous lui est permis. |

### Les trois options, comparées

| Solution | Dépendances ajoutées | Échoue en CI | Retour dans l'éditeur | Lignes de config | Précision |
|---|---|---|---|---|---|
| `no-restricted-imports` (règle **du cœur** d'ESLint) | **0** | oui | oui, pendant la frappe | ~20 | motifs sur la chaîne d'import |
| `import/no-restricted-paths` (`eslint-plugin-import`) | 1 greffon + un résolveur TypeScript, ~15 paquets transitifs | oui | oui | ~20, plus les réglages de résolution | chemins **résolus**, sans faux positif |
| Script maison (~25 lignes de Node + regex) | 0 | oui | **non** | ~25 dans un fichier à part | regex, à maintenir |

### Décision : `no-restricted-imports`, la règle du cœur d'ESLint

Pourquoi elle gagne :

1. **Zéro dépendance.** `eslint-plugin-import` apporte une quinzaine de paquets
   et un résolveur à configurer, pour arbitrer quatre dossiers plats. Hors de
   proportion (charte §40 : pas de dépendance sans justification).
2. **Retour immédiat.** L'erreur apparaît sous le curseur, pas trois minutes plus
   tard en CI. C'est exactement la boucle courte que demande XP.
3. **Elle échoue vraiment.** Sévérité `error`, donc `npm run lint` sort en code
   non nul, donc `verify` s'arrête, donc la CI est rouge.
4. **Elle se lit.** Vingt lignes déclaratives dans `eslint.config.js`, à côté du
   reste. Pas un outil de plus à découvrir.

Le script maison est rejeté pour une raison précise : il refait, en moins bien et
sans intégration éditeur, ce qu'ESLint fait déjà — et il faudrait le tester
lui-même.

### Ce que cette solution ne voit pas (et ce qu'on en fait)

- **Fichiers barils.** Un `src/index.ts` qui ré-exporte tout permettrait à
  `domain` d'atteindre `ui` via `'..'`. Parade : **aucun fichier `index.ts` de
  ré-export dans `src/`**, point. Convention à inscrire dans le README.
- **Sous-dossier homonyme.** Un `src/domain/ui/` déclencherait un faux positif.
  On n'en crée pas.
- **Import dynamique.** ESLint 9 a étendu la règle aux `import()` à littéral de
  chaîne ; à **confirmer par un test réel** à l'étape 4 de la mise en place.
- **Renommage de dossier.** Renommer `src/state/` en `src/store/` sans toucher à
  `eslint.config.js` désactive la règle en silence. La liste des dossiers et la
  liste des motifs sont dans les mêmes vingt lignes : un renommage qui ne les
  touche pas est une erreur de revue. Risque résiduel accepté.

L'import **de type** est traité comme les autres : `import type { ReactNode }
from 'react'` dans `domain/` est refusé. C'est voulu — le domaine ne doit même
pas connaître le nom d'un type de React. C'est aussi pourquoi on garde la règle
du cœur plutôt que sa variante `@typescript-eslint/no-restricted-imports`, dont
l'intérêt est justement d'**autoriser** les imports de type.

---

## Lint et format

### `eslint.config.js` (configuration plate)

```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

const REACT = ['react', 'react/*', 'react-dom', 'react-dom/*'];
const UI = ['**/ui', '**/ui/**'];
const STATE = ['**/state', '**/state/**'];
const DATA = ['**/data', '**/data/**'];

/** Règle de dépendance de CLAUDE.md §5 : ui → state → domain ← data. */
function layer(dir, forbidden) {
  return {
    files: [`src/${dir}/**`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: forbidden,
              message: `Règle de dépendance (CLAUDE.md §5) : src/${dir}/ n'a pas le droit d'importer cela. Sens autorisé : ui → state → domain ← data.`,
            },
          ],
        },
      ],
    },
  };
}

export default tseslint.config(
  { ignores: ['dist/', 'coverage/'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  { ...reactHooks.configs.flat.recommended, files: ['src/**/*.{ts,tsx}'] },

  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  layer('domain', [...REACT, ...UI, ...STATE, ...DATA]),
  layer('data', [...REACT, ...UI, ...STATE]),
  layer('state', ['react-dom', 'react-dom/*', ...UI]),

  prettier,
);
```

**Cinq règles ajoutées à la main**, pas quarante :

- `no-explicit-any` **relevé de `warn` à `error`** : la charte l'interdit (§51).
  `ban-ts-comment`, déjà en erreur dans `recommended`, ferme la porte des
  `@ts-ignore`.
- `no-non-null-assertion` : sans elle, `noUncheckedIndexedAccess` se contourne au
  `!` et ne sert plus à rien. Les deux vont ensemble.
- `no-unused-vars` avec échappatoire `^_` : le code mort est une régression.
- `no-console` : pas de `console.log` oublié sur un site publié.
- `eqeqeq` (sauf `null`) : `== null` reste pratique, le reste est un piège.

**Règles et familles désactivées, et pourquoi :**

1. **Toutes les règles de mise en forme**, via `eslint-config-prettier` placé en
   dernier. Une seule autorité sur le format : Prettier. Discuter d'un point-virgule
   en revue est du temps perdu.
2. `no-undef` — désactivée par la surcouche de `typescript-eslint`. TypeScript le
   fait déjà, et la garder obligerait à installer le paquet `globals` pour
   déclarer `document`, `window`, `localStorage`. Une dépendance évitée.
3. `noUnusedLocals` / `noUnusedParameters` côté TypeScript : voir le tableau
   tsconfig, on ne veut pas deux diagnostics pour le même problème.
4. **Toute la famille `recommendedTypeChecked`.** Elle exige `projectService`,
   multiplie la durée du lint par trois à cinq, et **répète en grande partie ce
   que `tsc --noEmit` vient de dire**. La seule règle qui manquerait vraiment est
   `no-floating-promises` ; or ce projet n'a ni réseau ni base de données, et
   `localStorage` est synchrone. Le jour où une promesse apparaît vraiment, on
   réévalue — pas avant.
5. `eslint-plugin-jsx-a11y` : **pas installé**, malgré l'exigence d'accessibilité
   de la charte (§8). Raison honnête : ce que la charte demande (HTML sémantique,
   navigation clavier, contraste AA, cibles de 44 px) n'est presque pas
   analysable statiquement. En revanche, **Testing Library l'est** : un test qui
   fait `getByRole('button', { name: 'Suivant' })` échoue si on a mis un `div`
   cliquable sans libellé. L'analyseur d'accessibilité de ce projet, ce sont les
   tests. À revoir si une régression d'accessibilité passe réellement.
6. `eslint-plugin-react-refresh` : confort de développement, aucune correction de
   bug. Pas sa place.

**Piège à connaître :** en configuration plate, ESLint n'inspecte par défaut que
`.js`/`.mjs`/`.cjs`. C'est le bloc `files: ['**/*.{ts,tsx}']` qui fait entrer le
TypeScript dans le champ. Sans lui, `eslint .` affiche « aucun problème » en
n'ayant rien lu. À vérifier à l'étape 3 en cassant volontairement un fichier.

`eslint.config.js` est en JavaScript, pas en TypeScript : une configuration
ESLint en `.ts` réclame `jiti`. Une dépendance pour typer vingt lignes, non.

### Prettier

`.prettierrc.json` — uniquement ce qui s'écarte des défauts :

```json
{
  "singleQuote": true,
  "printWidth": 90
}
```

`printWidth: 90` parce que le JSX porte des libellés français longs
(« Choisis ton historique ») et qu'à 80 colonnes chaque attribut part à la ligne :
illisible. `singleQuote` par habitude d'écosystème, et pour réduire le bruit de
diff quand on édite une chaîne.

`.prettierignore` :

```
dist/
coverage/
package-lock.json
```

Prettier lit `.editorconfig` par défaut : les deux fichiers doivent rester
cohérents (indentation 2, fins de ligne LF). Ils le sont.

`prettier --check` est intégré au script `lint`, pas ajouté comme quatrième étape
de `verify` : la charte dit « types + lint + tests », et le format **est** une
affaire de lint. `npm run format` corrige.

---

## Tests

### Où vivent les tests : **à côté du code**

`src/domain/abilities.ts` et `src/domain/abilities.test.ts`, dans le même dossier.

Pourquoi, plutôt qu'un dossier `tests/` parallèle :

- Le test est la documentation exécutable du module ; à un fichier de distance,
  on l'ouvre. Dans un arbre parallèle, on l'oublie. « Test d'abord » (charte §63)
  ne survit pas à une arborescence en double.
- Renommer ou déplacer un module ne laisse pas un orphelin.
- Zéro configuration : le motif par défaut de Vitest les trouve.

Coût accepté : les fichiers de test vivent dans `src/`. Ils ne partent pas dans le
paquet livré (rien ne les importe, donc rien ne les inclut) et les motifs
d'exclusion par défaut de la couverture les ignorent.

Seule exception : `src/test/setup.ts`, qui n'est pas un test mais de
l'infrastructure.

### Conventions

- Nom du test **en français**, un test = un comportement :
  `it('ajoute +2 en Force à un nain des collines')` (charte §165).
- Composants : on interroge par rôle et par libellé, jamais par classe CSS,
  jamais d'instantané.
- Un bug corrigé commence par un test rouge.

### Tester vite les règles pures du domaine

Le domaine est du TypeScript pur, sans DOM, sans horloge, sans aléatoire (les
frontières sont injectées, charte §57-59). Donc :

- **Aucun simulacre nulle part dans `domain/`.** Une fonction pure prend des
  données et rend des données. Si un test de domaine réclame un simulacre, c'est
  la conception qui est fausse.
- **Tables de cas avec `it.each`** pour les matrices de règles (bonus raciaux,
  modificateurs de caractéristique, maîtrises) : une ligne de données par cas,
  un nom français par ligne. On couvre vingt cas sans écrire vingt tests.
- **`npm run test:watch`** en permanence : Vitest ne rejoue que les fichiers
  touchés par la modification. C'est la boucle de retour réelle.

Levier de vitesse gardé **en réserve, pas appliqué** : tout tourne aujourd'hui en
`jsdom`, ce qui fait payer l'initialisation du DOM à chaque fichier de test de
domaine qui n'en a pas besoin. Déclencheur chiffré : **si `npm run test` dépasse
15 s**, on bascule `environment: 'node'` par défaut et on annote les tests de
composants d'un `// @vitest-environment jsdom`. Optimiser avant la mesure serait
exactement l'excès de configuration qu'on refuse.

### Couverture : mesurée, mais un seul seuil, et il est étroit

**Contre les seuils, honnêtement :** un pourcentage global est un indicateur de
substitution. Il passe au vert en testant des accesseurs. Quand il bloque, la
réaction n'est pas d'écrire un bon test mais d'écrire *n'importe quel* test. Un
seuil global apprend à tromper la mesure.

**Ce que la charte demande est plus fort et plus précis :** « Toute règle de
`domain/` a un test. Pas d'exception. » (§161)

D'où la décision :

- Seuil **uniquement sur `src/domain/**`** : 90 % lignes / fonctions /
  instructions, 85 % branches. Ce n'est pas un indicateur de substitution, c'est
  la règle de la charte rendue mécanique, sur du code pur et intégralement
  testable, sans excuse possible.
- **Aucun seuil** sur `ui/`, `state/`, `data/`. Un pourcentage sur des composants
  pousse à tester du rendu plutôt que du comportement. Ces couches se jugent en
  revue, pas au chiffre.
- La couverture reste consultable ailleurs : elle sert de **carte de ce qui n'est
  pas testé**, pas de note.

`npm run test` lance donc toujours `--coverage`, pour que ce que la CI exécute
soit exactement ce que le développeur exécute. Le mode veille (`test:watch`) est
sans couverture, pour rester instantané.

---

## `npm run verify`

```
npm run typecheck && npm run lint && npm run test
```

**Ordre :** le plus rapide et le plus précis d'abord.

1. `tsc --noEmit` — une erreur de type rend le lint bruyant et les tests
   insignifiants ; inutile d'aller plus loin.
2. `eslint . --max-warnings 0` puis `prettier --check .` — dont la règle de
   dépendance.
3. `vitest run --coverage`.

**En cas d'échec :** la chaîne `&&` s'arrête à la première étape rouge et sort en
code non nul. On ne cherche pas à tout collecter : avec une boucle de trente
secondes, on corrige et on relance. `--max-warnings 0` fait qu'un avertissement
est un échec — sinon les avertissements s'accumulent et ne veulent plus rien dire.

**Durée cible sur ce projet :**

| Étape | Cible locale |
|---|---|
| `typecheck` | < 5 s |
| `lint` | < 8 s |
| `test` | < 15 s |
| **Total** | **< 30 s** |
| Tâche CI complète, `npm ci` compris | < 2 min |

Règle : **si `verify` dépasse 60 s en local, c'est un défaut à corriger**, au même
titre qu'un test rouge. Un garde-fou lent finit contourné.

`npm-run-all` et l'exécution en parallèle sont rejetés : une dépendance de plus,
des sorties entremêlées, pour gagner dix secondes sur trente.

---

## CI (GitHub Actions)

**Un seul fichier**, `.github/workflows/ci.yml`, deux tâches. Deux fichiers
séparés ne pourraient pas exprimer « ne déployer que si `verify` est vert » sans
passer par `workflow_run`, plus fragile.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm

      - run: npm ci

      - run: npm run verify

      - run: npm run build

      - name: Budget de poids
        run: |
          entry_budget=112640   # 110 kio, chunk d'entrée
          total_budget=204800   # 200 kio, tout le JS
          css_budget=15360      # 15 kio

          gz() { gzip -9 -c "$1" | wc -c; }
          sum() {
            t=0
            for f in $1; do [ -e "$f" ] || continue; s=$(gz "$f"); \
              printf '%9d  %s\n' "$s" "$f"; t=$((t + s)); done
            echo "$t"
          }

          js_total=$(sum "dist/assets/*.js" | tail -1)
          css_total=$(sum "dist/assets/*.css" | tail -1)
          entry=$(gz "$(ls dist/assets/index-*.js | head -1)")

          echo "entrée=$entry  js=$js_total  css=$css_total (octets gzip)"
          fail=0
          [ "$entry"     -le "$entry_budget" ] || { echo "::error::chunk d'entrée hors budget"; fail=1; }
          [ "$js_total"  -le "$total_budget" ] || { echo "::error::JS total hors budget"; fail=1; }
          [ "$css_total" -le "$css_budget"   ] || { echo "::error::CSS hors budget"; fail=1; }
          exit $fail

      - uses: actions/upload-pages-artifact@v5
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
        with:
          path: dist

  deploy:
    name: deploy
    needs: verify
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

Décisions :

- **`npm run verify` et rien d'autre** comme porte de qualité : ce que la CI
  lance est exactement ce que le développeur lance. « Vert chez moi » et « vert en
  CI » redeviennent la même phrase.
- **`npm run build` en plus de `verify`** : `verify` ne compile pas le paquet.
  Sans cette étape, une régression de build (un import d'actif cassé) ne se
  découvrirait qu'après fusion. Le build sert aussi à mesurer le budget.
- **`cache: npm` + `npm ci`** : installation reproductible depuis
  `package-lock.json`, dépendances mises en cache.
- **`node-version-file: .nvmrc`** : une seule source de vérité pour la version de
  Node, partagée entre le poste et la CI.
- **Pas de matrice de versions Node.** L'artefact livré est un paquet statique,
  compilé une fois. Node est ici un **outil de compilation**, pas un environnement
  d'exécution que l'on livre : aucun utilisateur n'exécute Node. Une matrice
  triplerait la durée de la CI pour tester une variable que personne ne subit. La
  variable qui compte pour l'utilisateur, c'est le **navigateur**, et une matrice
  Node n'en dit rien.
- **`concurrency` avec annulation** : trois poussées d'affilée sur une branche
  n'occupent pas trois exécutions.
- **`permissions` minimales au niveau du fichier**, élargies seulement dans la
  tâche `deploy`.
- **`actions/configure-pages` volontairement absent** : son intérêt est de
  détecter un générateur de site et d'injecter un chemin de base. On fixe `base`
  nous-mêmes ; une action de moins.

---

## Livraison

Site statique sur **GitHub Pages**, publié par Actions (tâche `deploy`
ci-dessus), depuis `main` uniquement, et jamais sur un build rouge.

URL : `https://<compte>.github.io/D-DBeyondFranche/`.

**Prérequis manuel, à faire une fois** : dans Settings → Pages du dépôt, choisir
« GitHub Actions » comme source. Sans cela, la tâche `deploy` échoue avec un
message obscur. À noter dans le README.

### Le piège du sous-chemin, et comment on l'évite

Le site n'est pas à la racine d'un domaine mais sous `/D-DBeyondFranche/`.

1. **La base.** Sans `base: '/D-DBeyondFranche/'`, `index.html` demande
   `/assets/index-abc.js` : 404, page blanche, aucune erreur explicite. La base
   est fixée **sans condition**, dev compris : le serveur de développement sert
   alors lui aussi sous ce chemin, et un bug de base se voit à la première
   minute au lieu du premier déploiement.
2. **Le vrai piège, c'est le chemin absolu écrit à la main.** Vite réécrit
   `index.html` et les actifs qu'il voit passer, mais **pas** une chaîne
   `'/logo.svg'` dans du JSX, ni `fetch('/data/races.json')`, ni
   `url(/polices/x.woff2)` dans un CSS. Tout cela fonctionne en local à la racine
   et casse en production sous le sous-chemin. Règle, à inscrire dans le README :
   - **jamais d'URL commençant par `/` dans le code** ;
   - un actif s'**importe** (`import logo from './logo.svg'`), et le compilateur
     s'occupe du chemin ;
   - si une URL doit être construite, elle part de `import.meta.env.BASE_URL` ;
   - les données SRD sont des **modules TypeScript importés**, jamais des fichiers
     récupérés par `fetch` : pas d'URL, donc pas de piège. Cela contraint le lot 1
     et c'est voulu.
3. **404 au rechargement.** Le piège habituel des sites statiques (rafraîchir sur
   `/etape/3` renvoie un 404) **n'existe pas ici** : la charte exclut le routage
   (§37), l'assistant garde son étape en mémoire et dans `localStorage`. On
   n'ajoute donc **pas** l'astuce du `404.html` copie de `index.html`. YAGNI, et
   c'est un cas où le périmètre nous économise une rustine.
4. **`.nojekyll` inutile** avec le déploiement par artefact : Jekyll ne tourne
   pas. Vite émet `assets/`, pas `_assets/`. Un fichier de moins.
5. **Cache.** GitHub Pages fixe ses propres en-têtes ; on ne les contrôle pas.
   Les actifs portent un condensat dans leur nom (immuables), `index.html` est
   revalidé fréquemment. Rien à faire, mais bon à savoir avant de chasser un
   « pourquoi je vois l'ancienne version » : c'est une purge de cache, pas un bug.

---

## Budget de performance mobile

Cible : téléphone d'entrée de gamme, réseau lent. Profil de mesure : préréglage
mobile de Lighthouse (Slow 4G, processeur bridé ×4).

### Poids (compressé gzip, mesuré sur `dist/`)

| Poste | Budget | Comment on le mesure |
|---|---|---|
| Chunk d'entrée (JS exécuté au premier écran) | **≤ 110 kio** | `dist/assets/index-*.js`, étape « Budget de poids » de la CI |
| Total JS émis | **≤ 200 kio** | somme de `dist/assets/*.js` |
| CSS total | **≤ 15 kio** | somme de `dist/assets/*.css` |
| Données SRD embarquées | **≤ 120 kio**, dont ≤ 40 kio dans le chunk d'entrée | comptées dans les deux lignes ci-dessus |
| Polices web | **0 octet** | on n'en charge aucune : pile de polices système |
| Chaque image | **≤ 30 kio**, SVG de préférence | revue |
| **Total transféré au premier chargement** | **≤ 250 kio** | onglet Réseau, cache vidé |

Repères pour comprendre ces chiffres : `react` + `react-dom` en 18.3 pèsent à eux
seuls environ **45 kio gzip**. C'est un coût fixe imposé par la charte (§32). Il
reste donc de l'ordre de 65 kio pour le code applicatif et les données du premier
écran. C'est confortable si les sorts ne sont pas chargés d'emblée.

### Temps

| Mesure | Budget |
|---|---|
| Premier affichage de contenu (FCP) | ≤ 1,8 s |
| Plus grand élément affiché (LCP) | ≤ 2,5 s |
| **Premier écran utilisable** : le titre, le premier choix et le bouton « Suivant » visibles **et** cliquables | **≤ 2,5 s** |
| Temps de blocage total (TBT) | ≤ 200 ms |
| Décalage de mise en page (CLS) | ≤ 0,1 |
| Défilement horizontal à 360 px | **0** (charte §101) |

### Comment on mesure

1. **À chaque build** : `vite build` affiche le poids gzip par fichier. C'est le
   chiffre du quotidien.
2. **À chaque CI** : l'étape « Budget de poids » recalcule et **échoue** si un
   budget est dépassé. Six lignes de shell, aucune dépendance. Un avertissement
   que personne ne lit n'est pas un budget.
3. **Avant chaque publication** : un passage Lighthouse manuel en préréglage
   mobile, chiffres reportés dans la description de la PR. Rejeté : `lhci` dans la
   CI — une dépendance lourde et des mesures instables sur des exécuteurs
   partagés, donc des builds rouges qui ne veulent rien dire. Une mesure à laquelle
   on ne croit pas est pire que pas de mesure.
4. **Avant de considérer un écran fini** : test au doigt sur un vrai téléphone à
   360 px (charte §173).

### Quand on dépasse, dans cet ordre

1. Identifier ce qui a grossi : `npx vite-bundle-visualizer` (ponctuel, non
   installé dans le projet).
2. **Si ce sont les données** : sortir la liste des sorts du chunk d'entrée par un
   `import()` dynamique, déclenché seulement quand le joueur choisit une classe de
   lanceur de sorts. C'est le levier le plus rentable et il est prévu.
3. **Si c'est une dépendance** : la supprimer. La charte est explicite : si trente
   lignes suffisent, on écrit les trente lignes (§41).
4. **Si c'est le code applicatif** : simplifier, ou retirer une fonctionnalité.
   Le budget est une contrainte, pas une suggestion.
5. **En dernier recours seulement**, relever le budget — avec une justification
   écrite dans la PR, exactement comme pour l'ajout d'une dépendance.

Les chiffres ci-dessus sont des cibles. À l'étape 9 de la mise en place, on fixe
les seuils de la CI sur la **première mesure réelle + 20 %**, puis on ne les fait
que descendre.

---

## Hygiène de dépôt

### `.gitignore`

Le fichier existant est presque complet. Ajouts :

```
node_modules/
dist/
coverage/
*.local
.DS_Store
.vite/

# ajouts
*.log
npm-debug.log*
.idea/
.vscode/
```

**`package-lock.json` est versionné** — `npm ci` en dépend, en local comme en CI.
Le mentionner explicitement évite qu'un jour quelqu'un l'ajoute à cette liste.

### `.editorconfig`

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

Justification : c'est le seul réglage qui s'applique dans tous les éditeurs sans
greffon, et il couvre les fichiers que Prettier ne formate pas (`.nvmrc`,
`.gitignore`). `charset` et `end_of_line` ne sont pas cosmétiques dans un projet
français : accents et fins de ligne mixtes produisent des diffs illisibles.
Valeurs alignées sur les défauts de Prettier pour que les deux ne se contredisent
jamais.

### `.nvmrc`

```
22.22.2
```

Version **exacte**, pas `22`. Raison concrète : `jsdom@30` exige
`^22.22.2 || ^24.15.0 || >=26`. Une version exacte fait de « ça marche chez moi »
et « ça marche en CI » la même affirmation, puisque `actions/setup-node` lit ce
fichier. Coût assumé : la montée de version est manuelle — et c'est bien, elle se
fait dans son propre commit, en connaissance de cause.

### `README.md` (contenu attendu, en français, ~80 lignes maximum)

À écrire en dernier, une fois que tout fonctionne. Il contient :

1. Le titre, une phrase de description, et une capture d'écran **en format
   téléphone** (pas un large aperçu bureau : le README doit dire la cible).
2. L'URL du site publié.
3. Démarrage en trois commandes : `nvm use`, `npm ci`, `npm run dev`.
4. Le tableau des scripts npm, une ligne chacun, avec `verify` mis en avant comme
   la commande à lancer avant tout commit.
5. L'architecture en cinq lignes : les quatre dossiers, la règle de dépendance
   `ui → state → domain ← data`, le fait qu'elle est **vérifiée par le lint**, et
   un renvoi à `CLAUDE.md` pour le reste. Le README ne recopie pas la charte.
6. Les deux règles de survie qui ne sont écrites nulle part ailleurs : aucun
   fichier baril `index.ts` dans `src/`, aucune URL commençant par `/`.
7. Le budget de performance chiffré et la façon de le mesurer.
8. La convention de messages de commit (ci-dessous).
9. Attribution SRD 5.1, Wizards of the Coast, CC BY 4.0, et la mention « projet
   non affilié » — obligation de la charte §9, à ne pas oublier.
10. La licence du code, distincte de celle du contenu.
11. Le rappel du réglage manuel « Settings → Pages → source : GitHub Actions ».

### Messages de commit

**Conventional Commits, sous-ensemble restreint, en anglais** (charte §148) :

```
<type>(<portée>): <verbe à l'impératif, ≤ 72 caractères>
```

- Types autorisés : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`.
  Sept, pas quinze.
- Portée facultative = la couche : `domain`, `data`, `state`, `ui`, `build`, `ci`.
- Exemples : `feat(domain): apply racial ability bonuses`,
  `fix(ui): keep the Next button reachable at 360px`,
  `test(domain): cover hill dwarf constitution bonus`.
- Un commit laisse `verify` vert (charte §64).

**Non outillé** : ni `commitlint`, ni crochet Git. Honnêtement, cela en fait une
règle molle. C'est acceptable ici pour deux raisons : on ne génère aucun
changelog automatique (pas de Changesets), donc la convention achète de la
lisibilité, pas de l'automatisation ; et avec la fusion par écrasement, le titre
de la PR est ce qui reste dans l'historique — or un titre de PR se relit en
revue. Le jour où l'historique devient illisible, on en reparlera avec des
preuves.

---

## Ordre de mise en place

Chaque étape se termine par un dépôt dans un état utilisable et une porte verte.

1. **`.nvmrc`, `.editorconfig`, complément du `.gitignore`.**
   `chore: pin toolchain and editor settings`
2. **`package.json`, `npm install`, `tsconfig.json`, `vite.config.ts`,
   `index.html`, `src/main.tsx`, `src/App.tsx`** affichant un écran « Bonjour »
   lisible à 360 px. Critère de sortie : `npm run dev` montre quelque chose sur
   un vrai téléphone via le réseau local.
3. **`eslint.config.js` (sans les couches), `.prettierrc.json`,
   `.prettierignore`.** Critère de sortie : `npm run lint` est vert **et** on a
   vérifié qu'il rougit en introduisant un `any` — sinon le lint ne lit peut-être
   même pas les fichiers `.ts`.
4. **Les quatre dossiers de couche** avec un module témoin chacun, puis les
   blocs `layer(...)` dans ESLint. **Puis on écrit volontairement une violation**
   (`import type { ReactNode } from 'react'` dans `src/domain/`), on vérifie que
   `npm run lint` échoue, on vérifie aussi le cas `import()` dynamique, et on
   retire. Un garde-fou qu'on n'a jamais vu échouer est un garde-fou auquel
   personne ne croit.
5. **Vitest** : bloc `test` de `vite.config.ts`, `src/test/setup.ts`, un test de
   domaine et un test de composant. Critère de sortie : `npm run test` vert, le
   test de composant interroge par rôle.
6. **Script `verify`** : on le lance, on **chronomètre**, on note la durée dans
   le README. Si elle dépasse 30 s dès maintenant, on corrige avant d'avancer.
7. **`.github/workflows/ci.yml`, tâche `verify` seule.** On pousse une branche
   avec une erreur volontaire pour la voir rouge, puis on corrige.
8. **Tâche `deploy` + réglage Pages + `base`.** Critère de sortie : le site
   s'ouvre sur un vrai téléphone à son URL réelle, sans 404 d'actif.
9. **Étape « Budget de poids »**, seuils calés sur la première mesure réelle
   + 20 %.
10. **`README.md`.**

La logique de cet ordre : d'abord quelque chose qui tourne, ensuite les
garde-fous, jamais l'inverse. On ne protège pas du code qui n'existe pas.

---

## Hors périmètre (et pourquoi)

- **Docker.** La chaîne d'outils est `node` + `npm ci`, et `.nvmrc` fige la
  version. Docker ajouterait une image à maintenir, un cache de couches à
  déboguer et quelques centaines de mégaoctets, pour isoler… `vite build`. Rien
  à isoler.
- **Storybook.** C'est une seconde application, avec sa compilation, sa
  configuration et ses dépendances, dont l'objet est de regarder des composants
  **hors contexte**. Or l'unité de valeur de ce projet est l'**écran** (« une
  décision par écran », charte §104), jugé à 360 px dans l'application réelle.
  Une galerie de composants encouragerait à fabriquer des briques que personne
  n'assemble : de la spéculation, donc du YAGNI. `npm run dev` ouvert sur un
  téléphone est le vrai aperçu.
- **Playwright / tests de bout en bout.** C'est **le seul renoncement qui coûte
  vraiment quelque chose**, alors traitons-le honnêtement. Ce qu'ils
  attraperaient et que nos tests n'attrapent pas : le parcours complet de
  l'assistant, la persistance `localStorage` d'un rechargement à l'autre, la
  feuille de style d'impression, la mise en page réelle à 360 px, les
  particularités de Safari iOS. Les deux premiers points sont couverts, presque
  entièrement, par **un test d'intégration en jsdom qui monte `<App />` et
  parcourt tout l'assistant** — jsdom fournit `localStorage`, et c'est zéro
  dépendance. Restent les points **physiques** (mise en page, impression, doigt),
  que Playwright ne couvre pas non plus sans comparaison d'images, technique
  connue pour sa fragilité. Face à cela, le coût est réel : ~300 Mo de
  navigateurs, une à trois minutes de CI, et une catégorie d'échecs instables qui
  détruit la confiance dans la porte de qualité — et une porte à laquelle on ne
  croit plus, on la contourne. **Décision : reporté, avec un déclencheur
  explicite** — on installe Playwright la première fois qu'un bug atteint le site
  publié alors qu'un test d'intégration jsdom aurait pu le voir. Décision fondée
  sur des preuves, pas sur un dogme. En attendant, le test d'intégration de
  l'étape 5 est **obligatoire**, il porte l'essentiel de la valeur.
- **Husky / lint-staged.** Un crochet Git ralentit chaque commit — c'est-à-dire
  exactement ce que la charte demande de multiplier (« petits commits », §64) —
  se contourne d'un `--no-verify`, donc n'est pas une porte, et casse dans
  certains clients graphiques. La porte, c'est la CI ; l'habitude, c'est
  `npm run verify` avant de pousser.
- **Changesets.** Outil de publication de paquets versionnés. On publie un site,
  sans version et sans consommateur. Valeur nulle.
- **Sentry.** Un script tiers d'environ 25 kio gzip sur une page dont le budget
  d'entrée est de 110 kio, qui enverrait des données de joueurs (noms de
  personnages) à un tiers, pour une application sans backend et sans astreinte.
  Le besoin réel est une frontière d'erreur React affichant un message en
  français et un bouton « Recharger ». Elle relève du lot UI.

---

## Risques

1. **La règle de dépendance se contourne par un fichier baril.** Un
   `src/index.ts` de ré-export ouvrirait un chemin de `domain` vers `ui` que le
   motif ne voit pas. Parade : interdiction des barils, inscrite au README.
   Détection : revue. Risque résiduel accepté.
2. **Le renommage silencieux.** Renommer `src/state/` sans toucher à
   `eslint.config.js` désactive la règle sans aucune erreur. Parade : la liste
   des dossiers et les motifs tiennent dans les mêmes vingt lignes. Si cela se
   produit une fois, on ajoute cinq lignes comparant `ls src/` aux clés de la
   config. Pas avant.
3. **Les budgets de perf du jour 0 sont des estimations.** Parade : les recaler
   sur la première mesure réelle (étape 9), puis ne les faire que descendre. Toute
   remontée exige une justification écrite.
4. **React 18 est en maintenance.** La charte le fixe (§32) ; l'écosystème le
   supporte encore (Testing Library 16 accepte 18 et 19), mais les outils neufs
   visent React 19 par défaut. Le coût de migration est faible (l'API `createRoot`
   ne change pas). C'est une décision de charte, pas de ce lot : à rouvrir à la
   première mise à jour bloquée, en modifiant la charte d'abord.
5. **TypeScript figé en 5.9** parce que `typescript-eslint` déclare
   `typescript <6.1.0`. On reste une majeure derrière. Aucun de nos fichiers
   n'utilise de fonctionnalité de TypeScript 6 ou 7 : la migration sera une
   montée de version, pas une réécriture. À revoir quand `typescript-eslint`
   supportera la version native.
6. **`noUncheckedIndexedAccess` peut pousser au `!`**, ce qui serait pire que le
   problème d'origine. Parade déjà en place :
   `@typescript-eslint/no-non-null-assertion` en erreur, plus des accesseurs
   explicites (`findRace(id): Race | undefined`) dans le lot 1. À surveiller dès
   les premières tables de données.
7. **CI verte ≠ site qui marche.** Sans tests de bout en bout, la mise en page
   réelle, l'impression et le toucher ne sont pas vérifiés automatiquement.
   Parade : le test d'intégration `<App />`, plus le passage manuel obligatoire
   sur un vrai téléphone avant publication. C'est le risque assumé du point
   « hors périmètre ».
8. **Le réglage Pages est hors dépôt.** Si « Settings → Pages → source » n'est
   pas sur « GitHub Actions », `deploy` échoue avec un message peu clair. Noté au
   README, à faire une fois.
9. **Vite 8, Vitest 4, ESLint 10 sont des majeures récentes.** Des écarts d'API
   sont possibles (noms exacts des options de couverture, forme exportée par
   `eslint-plugin-react-hooks`). Parade : les vérifier à l'étape correspondante,
   contre la documentation de la version installée. Le verrou (`package-lock.json`)
   et `npm ci` garantissent qu'une fois posé, l'ensemble ne bougera pas tout seul.
