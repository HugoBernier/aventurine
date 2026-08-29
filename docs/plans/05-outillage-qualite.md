# Lot 5 — Outillage, Qualité & Livraison

## Objectif

Poser le socle technique sur lequel les quatre autres lots écrivent le produit :
un projet qui démarre, un jeu de garde-fous qui **échouent vraiment**, une
commande unique (`npm run verify`), une CI qui la lance, et un site publié.

Contrainte de ce lot : **chaque outil doit gagner sa place**. Un fichier de
configuration que personne ne comprend est une dette. On préfère vingt lignes
lues par tout le monde à un préréglage de deux cents lignes que personne
n'ouvre.

Ce que ce lot ne fait pas : aucune règle D&D, aucun composant, aucune donnée SRD.

Le produit s'appelle **Aventurine** (arbitrage §A18). Le dépôt GitHub, lui,
garde son nom `D-DBeyondFranche` : ce point a une conséquence directe et piégeuse
sur la configuration de publication, traitée en section « Livraison ».

Ce plan est subordonné à `docs/plans/00-arbitrage.md`, qui fait autorité.

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
  domain/    (un module témoin)
  data/      (un module témoin)
  state/     (un module témoin)
  ui/        (un composant témoin)
  test/setup.ts
```

### `package.json`

```json
{
  "name": "aventurine",
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

> **Ces numéros de version sont une proposition, pas un acquis** (arbitrage §A14).
> Ils ont été relevés au registre npm, mais **rien n'a été installé**. À l'étape 2
> de la mise en place, on installe pour de vrai, on lance `npm run dev`, et si une
> majeure ne s'installe pas ou casse quelque chose, **on descend d'une version et
> on le note ici, dans ce fichier**. Ne pas recopier de confiance. Ce qui compte
> plus que les numéros : `package-lock.json` versionné et `npm ci` partout, ce qui
> fige l'ensemble dès la première installation réussie.

Contraintes de compatibilité relevées, à revérifier à l'installation :

- `@vitejs/plugin-react@6` déclare `vite: ^8.0.0` : les deux montent ensemble ou
  redescendent ensemble.
- `@testing-library/react@16` déclare `@testing-library/dom` en **peer** : il doit
  figurer explicitement dans les devDependencies, sinon l'installation est
  incomplète et l'erreur est obscure.
- `jsdom@30` déclare `node: ^22.22.2 || ^24.15.0 || >=26` : d'où le `.nvmrc`
  exact plus bas.
- `typescript` en **tilde** (`~5.9.3`) : une mineure TypeScript peut introduire de
  nouvelles erreurs de type. La montée se fait volontairement, dans son commit.
- **TypeScript reste en 5.9, pas 7.x** : `typescript-eslint@8` déclare
  `typescript >=4.8.4 <6.1.0`. Passer à TypeScript 7 aujourd'hui, c'est perdre le
  lint TypeScript — donc perdre la règle de dépendance. Le gain de vitesse de
  compilation ne paie pas cette perte.
- **React 18** parce que la charte, section « Stack », le fixe. Voir « Risques ».

Paquets volontairement **non installés** : `eslint-plugin-import`,
`eslint-plugin-jsx-a11y`, `eslint-plugin-react-refresh`, `globals`,
`npm-run-all`, `husky`, `lint-staged`, `commitlint`. Chacun est justifié plus bas.

### `tsconfig.json`

Un seul fichier. `create-vite` en génère trois (`tsconfig.json`,
`tsconfig.app.json`, `tsconfig.node.json`) reliés par des références de projet,
pour isoler les types Node du code applicatif. Arbitrage assumé : **deux fichiers
de plus que personne n'ouvre**, contre le risque qu'un composant écrive
`process.env`. Pour une application de quatre dossiers, le fichier unique gagne ;
le risque se traite en revue et se voit à l'exécution.

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
| `noUncheckedIndexedAccess` | Le domaine est une application de **tables** : races, classes, historiques, créneaux de choix indexés par identifiant (`'class:roublard:skills'`, arbitrage §A3). `CLASSES['roublard']` devient `Class \| undefined` : le type dit enfin la vérité sur une clé absente ou mal orthographiée, et une faute de frappe dans un identifiant de contenu français cesse d'être un `undefined` silencieux à l'exécution. | Bruit sur `tableau[i]` dans les boucles ; tentation du `!`. | **Activé.** La parade est un accesseur écrit une fois (`findClass(id): Class \| undefined`), plus `@typescript-eslint/no-non-null-assertion` en erreur pour fermer l'échappatoire du `!`. |
| `exactOptionalPropertyTypes` | Distingue « propriété absente » de « propriété présente valant `undefined` ». | Le `CharacterDraft` (arbitrage §A1) est **par nature** un objet partiellement rempli, et « effacer un choix » s'écrit naturellement `{ ...draft, subrace: undefined }`. Cette option transforme cette ligne banale en gymnastique (`delete`, `Omit`, types auxiliaires). | **Non activé.** Zéro bug évité ici, friction quotidienne garantie sur la structure centrale de trois lots. À reconsidérer seulement si le lot 2 modélise un jour les choix en `T \| null` obligatoire — l'option deviendrait alors gratuite. |
| `noFallthroughCasesInSwitch` | Le reducer de l'assistant est un `switch` sur les actions. Un `break` oublié y est un bug silencieux. | Nul. | **Activé.** |
| `noImplicitReturns` | Attrape la fonction qui rend une valeur sur un chemin et rien sur un autre. | Quasi nul. | **Activé.** |
| `verbatimModuleSyntax` | Force `import type` explicite. Vite transpile fichier par fichier : l'ambiguïté « ce symbole est-il un type ? » disparaît. C'est aussi le défaut des modèles Vite : personne n'est surpris. | Il faut écrire `import type`. | **Activé.** |
| `noUnusedLocals` / `noUnusedParameters` | Code mort. | **Doublon** de `@typescript-eslint/no-unused-vars`, qui fait la même chose en mieux (motif `^_` configurable). Deux outils qui crient la même chose, c'est un outil de trop. | **Non activé.** `tsc` s'occupe des types, ESLint du code mort. |
| `noPropertyAccessFromIndexSignature` | Marginal. | Bruyant. | **Non activé.** |
| `noImplicitOverride` | Zéro classe dans ce projet. | — | **Non activé (YAGNI).** |
| `skipLibCheck` | Évite des erreurs non corrigeables dans les `.d.ts` tiers. | Masque de vraies erreurs de types tiers. | **Activé** — c'est le compromis standard et le seul tenable. |

**Pas d'alias de chemin** (`@/`). Quatre dossiers plats : les imports relatifs
restent courts. Un alias coûterait une configuration en double (tsconfig + Vite)
et compliquerait la règle de dépendance ci-dessous, qui raisonne sur des motifs
de chemin.

### `vite.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// ATTENTION — ne pas « corriger » cette base en la croyant obsolète.
// Le produit s'appelle Aventurine, mais le dépôt GitHub s'appelle toujours
// D-DBeyondFranche et le site est publié sur
// https://<compte>.github.io/D-DBeyondFranche/. Renommer le dépôt casserait
// l'URL de publication (arbitrage §A18). C'est le seul endroit du code où
// l'ancien nom subsiste, et c'est volontaire.
const REPOSITORY_PATH = '/D-DBeyondFranche/';

export default defineConfig({
  // Base fixée aussi en développement : un bug de sous-chemin se voit alors
  // à la première minute, pas au premier déploiement.
  base: REPOSITORY_PATH,
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
  d'affirmer quoi que ce soit sur une classe CSS — on teste des rôles et des
  libellés (charte, section « Tests »).
- Le bloc `test` vit dans `vite.config.ts` : un fichier de configuration, pas deux.
- Les noms exacts des options de couverture sont à confirmer contre la
  documentation de la version réellement installée (étape 5).

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
suivant et les échecs deviennent dépendants de l'ordre d'exécution. Cela compte
d'autant plus que le test d'intégration `<App />` (arbitrage §A13) monte
l'application entière.

### `index.html`

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />

    <!-- viewport-fit=cover est OBLIGATOIRE et dicté par le lot 3 (arbitrage
         §A10). Sans lui, env(safe-area-inset-*) vaut 0px : la barre d'actions
         passe sous la barre d'accueil de l'iPhone EN PRODUCTION, alors que
         tout paraît normal en développement. Ne pas retirer.
         Pas de maximum-scale ni de user-scalable=no : bloquer le zoom est une
         régression d'accessibilité, y compris sur un site pensé pour le pouce. -->
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

    <!-- « light » SEUL, dicté par le lot 3 (arbitrage §A10). Annoncer « dark »
         sans thème sombre fait inverser les contrôles natifs par le système et
         détruit les ratios de contraste AA calculés un par un par le lot 3.
         Le thème sombre est hors périmètre v1 (charte, section « Périmètre »).
         À rouvrir seulement le jour où un thème sombre existe vraiment. -->
    <meta name="color-scheme" content="light" />

    <meta
      name="description"
      content="Aventurine : crée ton personnage de D&D 5e en français, depuis ton téléphone. Non affilié à Wizards of the Coast."
    />
    <title>Aventurine — créateur de personnage D&D 5e en français</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`lang="fr"` est obligatoire : sans lui, les lecteurs d'écran prononcent le
français avec la phonétique anglaise.

Les deux commentaires ci-dessus ne sont pas décoratifs. `viewport-fit` et
`color-scheme` sont exactement le genre d'attributs qu'un passage de « nettoyage »
supprime en toute bonne foi, et dont l'absence ne se voit pas sur un poste de
développement. Le commentaire est la seule protection possible : aucun lint ne
vérifie le contenu de `index.html`.

---

## Application de la règle de dépendance

La charte (section « Architecture ») fixe désormais, après amendement
(arbitrage §A6) :

```
ui     → state, domain, data      (data en lecture de contenu uniquement)
state  → domain                    (React autorisé, react-dom non)
data   → domain                    (types uniquement)
domain → rien
```

Une convention non vérifiée est une convention morte. Il faut que
`npm run verify` **rougisse**.

### `ui → data` est autorisé et voulu

Ce n'est pas une tolérance, c'est la forme correcte de la règle. Le lot 3 avait
d'abord inventé un hook `useGlossaire` dont l'unique fonction était de faire
transiter du texte de `data/` vers `ui/` en passant par `state/`, pour ne pas
enfreindre une flèche — et l'avait lui-même qualifié d'artificiel. L'arbitrage a
tranché en amendant la règle plutôt qu'en gardant le contournement, et il a
raison : un composant qui lit un libellé de glossaire dans `data/` n'enfreint
aucun principe ; un faux hook, si.

Ce que la règle protège vraiment est intact : **`domain/` ne dépend de rien** et
**`data/` ne contient aucune logique**. Tout le reste est de la plomberie qu'il
ne faut pas sacraliser.

### Traduction en interdictions

Seuls les sens *remontants* sont interdits. Les sens descendants vont vers le
noyau stable et ne violent rien.

| Dossier | N'a pas le droit d'importer | Pourquoi |
|---|---|---|
| `src/domain/` | `react`, `react-dom`, `ui`, `state`, `data` | Le domaine ne dépend de **rien**, pas même d'un `import type` depuis React (charte, section « Architecture »). |
| `src/data/` | `react`, `react-dom`, `ui`, `state` | Contenu typé par `domain/`, aucune logique. |
| `src/state/` | `react-dom`, `ui` | `state/` a droit à React (Context, `useReducer`), pas au DOM ni aux composants. |
| `src/ui/` | **rien** | `ui → state`, `ui → domain` et `ui → data` sont tous **autorisés et voulus**. Il n'y a aucune couche au-dessus de `ui/`, donc aucun sens remontant à interdire : il n'y a **pas** de `layer('ui', …)` dans la configuration. |

Ce que le lint ne peut pas dire, et qui reste une affaire de revue : « un calcul
de règle dans un composant est un bug de conception ». `ui/` a le droit
d'*importer* `domain/` ; il n'a pas le droit de *refaire* ce que `domain/` calcule.
L'arbitrage §A16 en donne le cas d'école : un écran qui décide lui-même si `+`
est actif en connaissant la table de coûts d'achat de points. Aucun outil ne
détecte cela ; seule la revue le voit.

### Les trois options, comparées

| Solution | Dépendances ajoutées | Échoue en CI | Retour dans l'éditeur | Lignes de config | Précision |
|---|---|---|---|---|---|
| `no-restricted-imports` (règle **du cœur** d'ESLint) | **0** | oui | oui, pendant la frappe | ~20 | motifs sur la chaîne d'import |
| `import/no-restricted-paths` (`eslint-plugin-import`) | 1 greffon + un résolveur TypeScript, ~15 paquets transitifs | oui | oui | ~20, plus les réglages de résolution | chemins **résolus**, sans faux positif |
| Script maison (~25 lignes de Node + regex) | 0 | oui | **non** | ~25 dans un fichier à part | regex, à maintenir |

### Décision : `no-restricted-imports`, la règle du cœur d'ESLint

1. **Zéro dépendance.** `eslint-plugin-import` apporte une quinzaine de paquets
   transitifs et un résolveur à configurer, pour arbitrer **quatre dossiers
   plats**. Hors de proportion, et la charte est explicite (section « Stack ») :
   pas de dépendance sans justification.
2. **Retour immédiat.** L'erreur apparaît sous le curseur, pas trois minutes plus
   tard en CI. C'est exactement la boucle courte que demande XP.
3. **Elle échoue vraiment.** Sévérité `error`, donc `npm run lint` sort en code
   non nul, donc `verify` s'arrête, donc la CI est rouge.
4. **Elle se lit.** Vingt lignes déclaratives dans `eslint.config.js`, à côté du
   reste. Pas un outil de plus à découvrir.

Le script maison est rejeté pour une raison précise : il refait, moins bien et
sans intégration éditeur, ce qu'ESLint fait déjà — et il faudrait le tester
lui-même.

### Fichiers barils : interdiction ciblée, pas générale

Un baril ouvre un chemin entre couches que le motif de lint ne voit pas : si
`src/index.ts` ré-exporte `ui/` et `domain/`, un module de `domain/` peut
atteindre `ui/` en important `'..'`. Le motif `**/ui/**` ne s'applique pas à la
chaîne `'..'` : la règle est muette.

Mais l'interdiction générale « aucun `index.ts` de ré-export dans `src/` » était
trop large (arbitrage §A11) : le lot 1 a besoin de `src/data/classes/index.ts`
pour assembler ses douze classes, et de `src/data/catalogue.ts` pour composer le
catalogue. Forme retenue :

- **Interdit** : tout baril **à la racine de `src/`** ou **à la racine d'une
  couche** — `src/index.ts`, `src/domain/index.ts`, `src/data/index.ts`,
  `src/state/index.ts`, `src/ui/index.ts`. C'est là, et là seulement, que naît le
  chemin détourné entre couches.
- **Autorisé** : un module d'agrégation **à l'intérieur** d'une couche, qui compose
  du contenu et ne ré-exporte aucune autre couche. `src/data/classes/index.ts`,
  `src/data/races/index.ts`, `src/data/catalogue.ts` sont légitimes et attendus.

Cette règle n'est pas outillée : elle tient en une ligne du README et en une
question de revue. La sanctuariser vaudrait un greffon de plus, ce qui reviendrait
à payer le prix qu'on vient de refuser.

### Ce que cette solution ne voit pas, et ce qu'on en fait

- **Sous-dossier homonyme.** Un `src/domain/ui/` déclencherait un faux positif.
  On n'en crée pas.
- **Import dynamique.** ESLint 9 a étendu la règle aux `import()` à littéral de
  chaîne ; à **confirmer par un essai réel** à l'étape 4, pas à supposer.
- **Renommage de dossier.** Renommer `src/state/` en `src/store/` sans toucher à
  `eslint.config.js` désactive la règle en silence. La liste des dossiers et
  celle des motifs tiennent dans les mêmes vingt lignes : un renommage qui ne les
  touche pas est une erreur de revue. Risque résiduel accepté ; si cela arrive
  une fois, on ajoute cinq lignes comparant `ls src/` aux clés de la config —
  pas avant.

L'import **de type** est traité comme les autres : `import type { ReactNode } from
'react'` dans `domain/` est refusé, conformément à la charte qui dit « pas même un
`import type` ». C'est aussi pourquoi on garde la règle du cœur plutôt que sa
variante `@typescript-eslint/no-restricted-imports`, dont l'intérêt est justement
d'**autoriser** les imports de type.

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

// Règle de dépendance, charte section « Architecture », amendée par
// docs/plans/00-arbitrage.md §A6 :
//   ui → state, domain, data | state → domain | data → domain | domain → rien
// Il n'y a pas de layer('ui', …) : aucune couche n'est au-dessus de ui/,
// donc il n'y a rien à lui interdire.
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
              message: `Règle de dépendance (CLAUDE.md, section « Architecture ») : src/${dir}/ n'a pas le droit d'importer cela.`,
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

- `no-explicit-any` **relevé de `warn` à `error`** : la charte l'interdit (section
  « Principes non négociables », KISS). `ban-ts-comment`, déjà en erreur dans
  `recommended`, ferme la porte des `@ts-ignore`.
- `no-non-null-assertion` : sans elle, `noUncheckedIndexedAccess` se contourne au
  `!` et ne sert plus à rien. Les deux vont ensemble ou pas du tout.
- `no-unused-vars` avec échappatoire `^_` : le code mort est une régression
  (charte, YAGNI).
- `no-console` : pas de `console.log` oublié sur un site publié.
- `eqeqeq` sauf `null` : `== null` reste pratique, le reste est un piège.

**Règles et familles désactivées, et pourquoi :**

1. **Toutes les règles de mise en forme**, via `eslint-config-prettier` placé en
   dernier. Une seule autorité sur le format : Prettier. Discuter d'un
   point-virgule en revue est du temps perdu.
2. `no-undef` — désactivée par la surcouche de `typescript-eslint`. TypeScript le
   fait déjà, et la garder obligerait à installer le paquet `globals` pour
   déclarer `document`, `window`, `localStorage`. Une dépendance évitée.
3. `noUnusedLocals` / `noUnusedParameters` côté TypeScript : voir le tableau
   tsconfig. On ne veut pas deux diagnostics pour le même problème.
4. **Toute la famille `recommendedTypeChecked`.** Elle exige `projectService`,
   multiplie la durée du lint par trois à cinq, et **répète en grande partie ce
   que `tsc --noEmit` vient de dire**. La seule règle qui manquerait vraiment est
   `no-floating-promises` ; or ce projet n'a ni réseau ni base de données, et
   `localStorage` est synchrone. Le jour où une promesse apparaît vraiment, on
   réévalue — pas avant.
5. `eslint-plugin-jsx-a11y` : **pas installé**, malgré l'exigence
   d'accessibilité de la charte (section « Accessibilité et qualité »). Raison
   honnête : ce que la charte demande — HTML sémantique, navigation clavier,
   contraste AA, cibles de 44 px — n'est presque pas analysable statiquement. En
   revanche, **Testing Library l'est** : un test qui fait
   `getByRole('button', { name: 'Suivant' })` échoue si on a mis un `div`
   cliquable sans libellé. L'analyseur d'accessibilité de ce projet, ce sont les
   tests. À revoir si une régression d'accessibilité passe réellement.
6. `eslint-plugin-react-refresh` : confort de développement, aucune correction de
   bug. Pas sa place.

**Piège à connaître :** en configuration plate, ESLint n'inspecte par défaut que
`.js`/`.mjs`/`.cjs`. C'est le bloc `files: ['**/*.{ts,tsx}']` qui fait entrer le
TypeScript dans le champ. Sans lui, `eslint .` affiche « aucun problème » en
n'ayant rien lu. À vérifier à l'étape 3 en cassant volontairement un fichier.

`eslint.config.js` est en JavaScript, pas en TypeScript : une configuration ESLint
en `.ts` réclame `jiti`. Une dépendance pour typer vingt lignes, non.

### Prettier

`.prettierrc.json` — uniquement ce qui s'écarte des défauts :

```json
{
  "singleQuote": true,
  "printWidth": 90
}
```

`printWidth: 90` parce que le JSX porte des libellés français longs
(« Choisis 2 compétences de roublard ») et qu'à 80 colonnes chaque attribut part à
la ligne : illisible. `singleQuote` par habitude d'écosystème, et pour réduire le
bruit de diff quand on édite une chaîne.

`.prettierignore` :

```
dist/
coverage/
package-lock.json
```

Prettier lit `.editorconfig` par défaut : les deux fichiers doivent rester
cohérents (indentation 2, fins de ligne LF). Ils le sont.

`prettier --check` est intégré au script `lint`, pas ajouté en quatrième étape de
`verify` : la charte dit « types + lint + tests », et le format **est** une
affaire de lint. `npm run format` corrige.

---

## Tests

### Où vivent les tests : **à côté du code**

`src/domain/abilities.ts` et `src/domain/abilities.test.ts`, dans le même dossier.

Pourquoi, plutôt qu'un arbre `tests/` parallèle :

- Le test est la documentation exécutable du module ; à un fichier de distance, on
  l'ouvre. Dans un arbre parallèle, on l'oublie. « Test d'abord » (charte, XP) ne
  survit pas à une arborescence en double.
- Renommer ou déplacer un module ne laisse pas d'orphelin.
- Zéro configuration : le motif par défaut de Vitest les trouve.

Coût accepté : les fichiers de test vivent dans `src/`. Ils ne partent pas dans le
paquet livré — rien ne les importe, donc rien ne les inclut — et les motifs
d'exclusion par défaut de la couverture les ignorent.

Seule exception : `src/test/setup.ts`, qui n'est pas un test mais de
l'infrastructure.

### Conventions

- Nom du test **en français**, un test = un comportement :
  `it('ajoute +2 en Force à un nain des collines')` (charte, section « Tests »).
  C'est la seule exception à « anglais dans le code » avec les identifiants de
  contenu (arbitrage §A2).
- Composants : on interroge par rôle et par libellé, jamais par classe CSS, jamais
  d'instantané.
- Un bug corrigé commence par un test rouge.

### Le test d'intégration `<App />` est une exigence, pas une option

L'arbitrage §A13 a promu au rang de contrainte la compensation que ce lot
proposait pour le renoncement à Playwright : **un test qui monte `<App />` et
parcourt les huit étapes de l'assistant**, y compris un rechargement pour vérifier
la persistance `localStorage`. Il est à la charge conjointe des lots 2 et 3.

Ce que le lot 5 doit lui fournir, et qu'il fournit : jsdom, `user-event`, le
nettoyage entre tests, et un `verify` assez rapide pour qu'on le lance vraiment.
Ce test sera le plus lent de la suite ; c'est le seul cas où l'on acceptera qu'un
test dépasse la seconde.

### Tester vite les règles pures du domaine

Le domaine est du TypeScript pur, sans DOM, sans horloge, sans aléatoire — la
frontière `random` a d'ailleurs disparu avec les jets de dés (arbitrage §B1).
Donc :

- **Aucun simulacre nulle part dans `domain/`.** Une fonction pure prend des
  données et rend des données. Si un test de domaine réclame un simulacre, c'est
  la conception qui est fausse.
- **Tables de cas avec `it.each`** pour les matrices de règles : bonus raciaux,
  modificateurs de caractéristique, ouverture de créneaux, disponibilité d'une
  option. Une ligne de données par cas, un nom français par ligne. On couvre vingt
  cas sans écrire vingt tests. C'est exactement la forme qui convient à
  `openChoices` (arbitrage §A4) et aux `rows` de `useAbilities` (§A16), dont la
  sortie est structurée et comparable.
- **`npm run test:watch`** en permanence : Vitest ne rejoue que les fichiers
  touchés. C'est la boucle de retour réelle.

Levier de vitesse gardé **en réserve, pas appliqué** : tout tourne aujourd'hui en
`jsdom`, ce qui fait payer l'initialisation du DOM à chaque fichier de test de
domaine qui n'en a pas besoin. Déclencheur chiffré : **si `npm run test` dépasse
15 s**, on bascule `environment: 'node'` par défaut et on annote les tests de
composants d'un `// @vitest-environment jsdom`. Optimiser avant la mesure serait
exactement l'excès de configuration qu'on refuse.

### Couverture : mesurée, mais un seul seuil, et il est étroit

**Contre les seuils, honnêtement :** un pourcentage global est un indicateur de
substitution. Il passe au vert en testant des accesseurs. Quand il bloque, la
réaction n'est pas d'écrire un bon test mais d'écrire *n'importe quel* test. **Un
seuil global apprend à tromper la mesure.**

**Ce que la charte demande est plus fort et plus précis :** « Toute règle de
`domain/` a un test. Pas d'exception. » (section « Tests »).

D'où la décision, retenue telle quelle par l'arbitrage :

- Seuil **uniquement sur `src/domain/**`** : 90 % lignes, fonctions et
  instructions, 85 % branches. Ce n'est pas un indicateur de substitution, c'est
  la règle de la charte rendue mécanique, sur du code pur et intégralement
  testable, sans excuse possible.
- **Aucun seuil** sur `ui/`, `state/`, `data/`. Un pourcentage sur des composants
  pousse à tester du rendu plutôt que du comportement. Ces couches se jugent en
  revue. `data/` en particulier : couvrir des tables de contenu à 90 % ne
  signifierait rigoureusement rien.
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

**Un seul fichier**, `.github/workflows/ci.yml`, deux tâches. Deux fichiers séparés
ne pourraient pas exprimer « ne déployer que si `verify` est vert » sans passer par
`workflow_run`, plus fragile.

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
            for f in $1; do
              [ -e "$f" ] || continue
              s=$(gz "$f"); printf '%9d  %s\n' "$s" "$f" >&2; t=$((t + s))
            done
            echo "$t"
          }

          js_total=$(sum "dist/assets/*.js")
          css_total=$(sum "dist/assets/*.css")
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

- **`npm run verify` et rien d'autre** comme porte de qualité : ce que la CI lance
  est exactement ce que le développeur lance. « Vert chez moi » et « vert en CI »
  redeviennent la même phrase.
- **`npm run build` en plus de `verify`** : `verify` ne compile pas le paquet. Sans
  cette étape, une régression de compilation (un import d'actif cassé) ne se
  découvrirait qu'après fusion. Le build sert aussi à mesurer le budget.
- **`cache: npm` + `npm ci`** : installation reproductible depuis
  `package-lock.json`.
- **`node-version-file: .nvmrc`** : une seule source de vérité pour la version de
  Node, partagée entre le poste et la CI.
- **Pas de matrice de versions Node.** L'artefact livré est un paquet statique,
  compilé une fois. Node est ici un **outil de compilation**, pas un environnement
  d'exécution livré : aucun utilisateur n'exécute Node. Une matrice triplerait la
  durée de la CI pour tester une variable que personne ne subit. La variable qui
  compte pour l'utilisateur, c'est le **navigateur**, et une matrice Node n'en dit
  rien.
- **`concurrency` avec annulation** : trois poussées d'affilée n'occupent pas trois
  exécutions.
- **`permissions` minimales au niveau du fichier**, élargies seulement dans la
  tâche `deploy`.
- **`actions/configure-pages` volontairement absent** : son intérêt est de détecter
  un générateur de site et d'injecter un chemin de base. On fixe `base` nous-mêmes ;
  une action de moins.
- Les numéros de version des actions sont à confirmer au moment de l'écriture du
  fichier, comme les dépendances npm.

---

## Livraison

Site statique sur **GitHub Pages**, publié par Actions (tâche `deploy` ci-dessus),
depuis `main` uniquement, et jamais sur un build rouge.

URL : `https://<compte>.github.io/D-DBeyondFranche/`.

**Prérequis manuel, à faire une fois** : dans Settings → Pages du dépôt, choisir
« GitHub Actions » comme source. Sans cela, la tâche `deploy` échoue avec un
message obscur. À noter dans le README.

### Le nom du dépôt survit au renommage du produit

Le produit s'appelle Aventurine ; le dépôt s'appelle toujours `D-DBeyondFranche`
et il le restera, parce que le renommer changerait l'URL publiée (arbitrage §A18).

Conséquence à assumer : **`base: '/D-DBeyondFranche/'` est le seul endroit du code
où l'ancien nom subsiste, et c'est volontaire.** C'est précisément le genre de
détail qu'un contributeur « corrige » en toute bonne foi, six mois plus tard, en
croyant nettoyer un reste — et le site se met à répondre en page blanche. D'où le
commentaire de six lignes en tête de `vite.config.ts`, plus la mention explicite
dans le README. Le seul autre garde-fou possible serait un test qui vérifie la
base ; il ne testerait qu'une constante, ce qui n'apprend rien.

### Le piège du sous-chemin, et comment on l'évite

Le site n'est pas à la racine d'un domaine mais sous `/D-DBeyondFranche/`.

1. **La base.** Sans `base`, `index.html` demande `/assets/index-abc.js` : 404, page
   blanche, aucune erreur explicite. La base est fixée **sans condition**, dev
   compris : le serveur de développement sert alors lui aussi sous ce chemin, et un
   bug de base se voit à la première minute au lieu du premier déploiement.
2. **Le vrai piège, c'est le chemin absolu écrit à la main.** Vite réécrit
   `index.html` et les actifs qu'il voit passer, mais **pas** une chaîne
   `'/logo.svg'` dans du JSX, ni `fetch('/data/spells.json')`, ni
   `url(/fonts/x.woff2)` dans un CSS. Tout cela fonctionne en local à la racine et
   casse en production. Deux règles, promues contraintes de projet par l'arbitrage
   §A13 :
   - **aucune URL commençant par `/` dans le code** ; un actif s'**importe**
     (`import logo from './logo.svg'`), et le compilateur s'occupe du chemin ; si
     une URL doit être construite, elle part de `import.meta.env.BASE_URL` ;
   - **les données SRD sont des modules TypeScript importés, jamais des fichiers
     récupérés par `fetch`** : pas d'URL, donc pas de piège. Cela contraint le
     lot 1, c'est voulu, et cela se marie bien avec §B2 qui allège fortement la
     charge de données.
3. **404 au rechargement.** Le piège habituel des sites statiques — rafraîchir sur
   `/etape/3` renvoie un 404 — **n'existe pas ici** : la charte exclut le routage,
   l'assistant garde son étape en mémoire et dans `localStorage`. On n'ajoute donc
   **pas** l'astuce du `404.html` copie de `index.html`. YAGNI, et c'est un cas où
   la réduction de périmètre nous économise une rustine.
4. **`.nojekyll` inutile** avec le déploiement par artefact : Jekyll ne tourne pas,
   et Vite émet `assets/`, pas `_assets/`. Un fichier de moins.
5. **Cache.** GitHub Pages fixe ses propres en-têtes ; on ne les contrôle pas. Les
   actifs portent un condensat dans leur nom (immuables), `index.html` est revalidé
   fréquemment. Rien à faire, mais bon à savoir avant de chasser un « pourquoi je
   vois l'ancienne version » : c'est une purge de cache, pas un bug.

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
| Données SRD embarquées | **≤ 120 kio** | comptées dans les deux lignes ci-dessus |
| Polices web | **0 octet** | on n'en charge aucune : pile de polices système |
| Chaque image | **≤ 30 kio**, SVG de préférence | revue |
| **Total transféré au premier chargement** | **≤ 250 kio** | onglet Réseau, cache vidé |

Repères pour comprendre ces chiffres : `react` + `react-dom` en 18.3 pèsent à eux
seuls de l'ordre de **45 kio gzip**. C'est un coût fixe imposé par la charte
(section « Stack »). Il reste donc environ 65 kio pour le code applicatif et les
données du premier écran.

Cohérence avec l'arbitrage : §B2 (résumés de sorts de une à trois phrases plutôt
que la prose longue) et §B5 (« aucun découpage dynamique des données en v1, seuil
de déclenchement écrit d'avance à 150 kio gzip ») confirment que la charge de
données v1 passe très en dessous du budget. Le découpage reste donc le **levier de
secours**, pas la conception initiale.

### Temps

| Mesure | Budget |
|---|---|
| Premier affichage de contenu (FCP) | ≤ 1,8 s |
| Plus grand élément affiché (LCP) | ≤ 2,5 s |
| **Premier écran utilisable** : le titre, le premier choix et le bouton « Suivant » visibles **et** cliquables | **≤ 2,5 s** |
| Temps de blocage total (TBT) | ≤ 200 ms |
| Décalage de mise en page (CLS) | ≤ 0,1 |
| Défilement horizontal à 360 px | **0** (charte, section « Mobile-first et design ») |

### Comment on mesure

1. **À chaque build** : `vite build` affiche le poids gzip par fichier. C'est le
   chiffre du quotidien.
2. **À chaque CI** : l'étape « Budget de poids » recalcule et **échoue** si un
   budget est dépassé. Une dizaine de lignes de shell, aucune dépendance. Un
   avertissement que personne ne lit n'est pas un budget.
3. **Avant chaque publication** : un passage Lighthouse manuel en préréglage
   mobile, chiffres reportés dans la description de la PR. Rejeté : `lhci` dans la
   CI — une dépendance lourde et des mesures instables sur des exécuteurs partagés,
   donc des builds rouges qui ne veulent rien dire. Une mesure à laquelle on ne
   croit pas est pire que pas de mesure.
4. **Avant de considérer un écran fini** : test au doigt sur un vrai téléphone à
   360 px, `viewport-fit=cover` inclus — c'est le seul moyen de vérifier que la
   barre d'actions ne passe pas sous la barre d'accueil.

### Quand on dépasse, dans cet ordre

1. Identifier ce qui a grossi : `npx vite-bundle-visualizer` (ponctuel, non
   installé dans le projet).
2. **Si ce sont les données** : sortir la liste des sorts du chunk d'entrée par un
   `import()` dynamique, déclenché quand le joueur choisit une classe lanceuse de
   sorts. Levier prévu, seuil de déclenchement déjà écrit (§B5 : 150 kio gzip).
3. **Si c'est une dépendance** : la supprimer. La charte est explicite : si trente
   lignes suffisent, on écrit les trente lignes.
4. **Si c'est le code applicatif** : simplifier, ou retirer une fonctionnalité. Le
   budget est une contrainte, pas une suggestion.
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

C'est le seul réglage qui s'applique dans tous les éditeurs sans greffon, et il
couvre les fichiers que Prettier ne formate pas (`.nvmrc`, `.gitignore`). `charset`
et `end_of_line` ne sont pas cosmétiques dans un projet dont tout le contenu est
français : accents mal encodés et fins de ligne mixtes produisent des diffs
illisibles. Valeurs alignées sur les défauts de Prettier pour que les deux ne se
contredisent jamais.

### `.nvmrc`

```
22.22.2
```

Version **exacte**, pas `22`. Raison concrète : `jsdom@30` exige
`^22.22.2 || ^24.15.0 || >=26`. Une version exacte fait de « ça marche chez moi »
et « ça marche en CI » la même affirmation, puisque `actions/setup-node` lit ce
fichier. Coût assumé : la montée est manuelle — et c'est bien, elle se fait dans
son propre commit, en connaissance de cause. À confirmer à l'étape 2 : si
l'installation impose une version plus haute, c'est celle-là qui est écrite ici.

### `README.md` (contenu attendu, en français, 80 lignes maximum)

À écrire en dernier, une fois que tout fonctionne. Il contient :

1. Le titre « **Aventurine** », une phrase de description, et une capture d'écran
   **en format téléphone** — pas un large aperçu bureau : le README doit dire la
   cible.
2. L'URL du site publié, avec la note d'une ligne : **le dépôt s'appelle
   `D-DBeyondFranche`, le produit s'appelle Aventurine, et c'est normal**.
3. Démarrage en trois commandes : `nvm use`, `npm ci`, `npm run dev`.
4. Le tableau des scripts npm, une ligne chacun, avec `verify` mis en avant comme
   la commande à lancer avant tout commit.
5. L'architecture en cinq lignes : les quatre dossiers, la règle de dépendance
   `ui → state/domain/data`, `state → domain`, `data → domain`, `domain → rien`, le
   fait qu'elle est **vérifiée par le lint**, et un renvoi à `CLAUDE.md` et à
   `docs/plans/00-arbitrage.md` pour le reste. Le README ne recopie pas la charte.
6. Les trois règles de survie qui ne sont écrites nulle part ailleurs et qu'aucun
   outil ne vérifie : pas de baril à la racine de `src/` ni d'une couche ; aucune
   URL commençant par `/` ; ne pas toucher à `base` ni aux deux `meta` commentées
   de `index.html`.
7. Le budget de performance chiffré et la façon de le mesurer.
8. La convention de messages de commit (ci-dessous).
9. Attribution SRD 5.1, Wizards of the Coast, CC BY 4.0, et la mention **« non
   affilié à Wizards of the Coast ni à D&D Beyond »** — obligation de la charte,
   section « Sources et droits ».
10. La licence du code, distincte de celle du contenu.
11. Le rappel du réglage manuel « Settings → Pages → source : GitHub Actions ».

### Messages de commit

**Conventional Commits, sous-ensemble restreint, en anglais** (charte, section
« Conventions ») :

```
<type>(<portée>): <verbe à l'impératif, ≤ 72 caractères>
```

- Types autorisés : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`.
  Sept, pas quinze.
- Portée facultative = la couche : `domain`, `data`, `state`, `ui`, `build`, `ci`.
- Exemples : `feat(domain): apply racial ability bonuses`,
  `fix(ui): keep the Next button above the home indicator`,
  `test(domain): cover hill dwarf constitution bonus`.
- Un commit laisse `verify` vert (charte, XP).

**Non outillé** : ni `commitlint`, ni crochet Git. Honnêtement, cela en fait une
règle molle. C'est acceptable ici pour deux raisons : on ne génère aucun changelog
automatique (pas de Changesets), donc la convention achète de la lisibilité et non
de l'automatisation ; et avec la fusion par écrasement, le titre de la PR est ce
qui reste dans l'historique — or un titre de PR se relit en revue. Le jour où
l'historique devient illisible, on en reparlera avec des preuves.

---

## Ordre de mise en place

Chaque étape se termine par un dépôt utilisable et une porte verte.

1. **`.nvmrc`, `.editorconfig`, complément du `.gitignore`.**
   `chore: pin toolchain and editor settings`
2. **`package.json`, installation réelle, `tsconfig.json`, `vite.config.ts`,
   `index.html`, `src/main.tsx`, `src/App.tsx`** affichant un écran « Bonjour »
   lisible à 360 px.
   **C'est ici qu'on vérifie les versions** (arbitrage §A14) : on installe, on
   lance `npm run dev`, `npm run build` et `npm run typecheck`. Si Vite 8,
   Vitest 4, ESLint 10 ou `@vitejs/plugin-react` 6 ne s'installent pas ou cassent
   quelque chose, **on descend d'une version et on corrige ce plan**. Les numéros
   écrits plus haut sont une hypothèse relevée au registre, pas un résultat.
   Critère de sortie : la page s'affiche sur un vrai téléphone via le réseau local,
   et `package-lock.json` est commité.
3. **`eslint.config.js` (sans les couches), `.prettierrc.json`,
   `.prettierignore`.** Critère de sortie : `npm run lint` est vert **et** on a
   vérifié qu'il rougit en introduisant un `any` — sinon le lint ne lit peut-être
   même pas les fichiers `.ts`.
4. **Les quatre dossiers de couche** avec un module témoin chacun, puis les blocs
   `layer(...)`. **Puis on écrit volontairement une violation** —
   `import type { ReactNode } from 'react'` dans `src/domain/` — on vérifie que
   `npm run lint` échoue, on vérifie aussi le cas de l'`import()` dynamique, puis
   on retire. On vérifie au passage que `src/ui/` peut importer `src/data/` **sans
   erreur** : c'est autorisé et voulu, une règle trop zélée serait un bug de
   configuration.
   Un garde-fou qu'on n'a jamais vu échouer est un garde-fou auquel personne ne
   croit ; un garde-fou qu'on n'a jamais vu se taire est un garde-fou qu'on va
   contourner.
5. **Vitest** : bloc `test`, `src/test/setup.ts`, un test de domaine et un test de
   composant. Critère de sortie : `npm run test` vert, le test de composant
   interroge par rôle.
6. **Script `verify`** : on le lance, on **chronomètre**, on note la durée dans le
   README. Si elle dépasse 30 s dès maintenant, on corrige avant d'avancer.
7. **`.github/workflows/ci.yml`, tâche `verify` seule.** On pousse une branche avec
   une erreur volontaire pour la voir rouge, puis on corrige.
8. **Tâche `deploy` + réglage Pages + vérification de `base`.** Critère de sortie :
   le site s'ouvre sur un vrai téléphone à son URL réelle, sans 404 d'actif, et la
   zone sûre est respectée en bas d'écran.
9. **Étape « Budget de poids »**, seuils calés sur la première mesure réelle + 20 %.
10. **`README.md`.**

Logique de cet ordre : d'abord quelque chose qui tourne, ensuite les garde-fous,
jamais l'inverse. On ne protège pas du code qui n'existe pas.

---

## Hors périmètre (et pourquoi)

- **Docker.** La chaîne d'outils est `node` + `npm ci`, et `.nvmrc` fige la version.
  Docker ajouterait une image à maintenir, un cache de couches à déboguer et
  quelques centaines de mégaoctets, pour isoler… `vite build`. Rien à isoler.
- **Storybook.** C'est une seconde application, avec sa compilation, sa
  configuration et ses dépendances, dont l'objet est de regarder des composants
  **hors contexte**. Or l'unité de valeur de ce projet est l'**écran** — « une
  décision par écran », charte section « Mobile-first et design » — jugé à 360 px
  dans l'application réelle. Une galerie de composants encouragerait à fabriquer
  des briques que personne n'assemble : de la spéculation, donc du YAGNI.
  L'arbitrage §A7 va dans le même sens en refusant un système de composants
  génériques. `npm run dev` ouvert sur un téléphone est le vrai aperçu.
- **Playwright / tests de bout en bout.** C'est **le seul renoncement qui coûte
  vraiment quelque chose**, alors traitons-le honnêtement. Ce qu'ils attraperaient
  et que nos tests n'attrapent pas : le parcours complet des huit étapes, la
  persistance `localStorage` d'un rechargement à l'autre, la feuille de style
  d'impression, la mise en page réelle à 360 px, la zone sûre iOS, les
  particularités de Safari. Les deux premiers points sont couverts, presque
  entièrement, par **le test d'intégration jsdom qui monte `<App />` et parcourt
  tout l'assistant** — jsdom fournit `localStorage`, et c'est zéro dépendance ;
  l'arbitrage §A13 en a fait une exigence contraignante pour les lots 2 et 3.
  Restent les points **physiques** (mise en page, impression, doigt, zone sûre),
  que Playwright ne couvre pas non plus sans comparaison d'images, technique connue
  pour sa fragilité. Face à cela, le coût est réel : environ 300 Mo de navigateurs,
  une à trois minutes de CI, et une catégorie d'échecs instables qui érode la
  confiance dans la porte de qualité — et une porte à laquelle on ne croit plus, on
  la contourne. **Décision : reporté, avec un déclencheur explicite** — on installe
  Playwright la première fois qu'un bug atteint le site publié alors qu'un test
  d'intégration jsdom aurait pu le voir. Décision fondée sur des preuves, pas sur un
  dogme.
- **Husky / lint-staged.** Un crochet Git ralentit chaque commit — c'est-à-dire
  exactement ce que la charte demande de multiplier (« petits commits », XP) —, se
  contourne d'un `--no-verify`, donc n'est pas une porte, et casse dans certains
  clients graphiques. La porte, c'est la CI ; l'habitude, c'est `npm run verify`
  avant de pousser.
- **Changesets.** Outil de publication de paquets versionnés. On publie un site,
  sans version et sans consommateur. Valeur nulle.
- **Sentry.** Un script tiers d'environ 25 kio gzip sur une page dont le budget
  d'entrée est de 110 kio, qui enverrait des données de joueurs (noms de
  personnages) à un tiers, pour une application sans backend et sans astreinte. Le
  besoin réel est une frontière d'erreur React affichant un message en français et
  un bouton « Recharger ». Elle relève du lot 3.

---

## Risques

1. **Les versions majeures ne sont pas vérifiées.** Vite 8, Vitest 4, ESLint 10,
   `@vitejs/plugin-react` 6, `eslint-plugin-react-hooks` 7 (dont le nom exact de la
   configuration plate, `configs.flat.recommended`) : tout cela est relevé au
   registre, rien n'est installé. Parade : l'étape 2 est explicitement une étape de
   **vérification**, avec consigne de descendre d'une version et de corriger ce
   plan en cas d'échec. `package-lock.json` versionné fige ensuite l'ensemble.
2. **Le nom du dépôt et le nom du produit divergent.** `base: '/D-DBeyondFranche/'`
   pour « Aventurine » est incohérent en apparence et correct en fait. Parade :
   commentaire en tête de `vite.config.ts`, note dans le README. Aucun outil ne
   protège cette ligne ; c'est un risque humain, traité par un commentaire.
   Symétriquement, `viewport-fit=cover` et `color-scheme: light` sont exposés au
   même « nettoyage » et protégés de la même façon.
3. **La règle de dépendance se contourne par un baril de racine.** Parade :
   interdiction ciblée (racine de `src/` et racine de couche), inscrite au README,
   vérifiée en revue. Non outillée : le sanctuariser coûterait le greffon qu'on
   vient de refuser. Risque résiduel accepté.
4. **Le renommage silencieux d'un dossier de couche** désactive la règle sans
   erreur. Parade : dossiers et motifs dans les mêmes vingt lignes. Si cela arrive,
   cinq lignes comparant `ls src/` aux clés de la config. Pas avant.
5. **Les budgets du jour 0 sont des estimations.** Parade : les recaler sur la
   première mesure réelle (étape 9), puis ne les faire que descendre. Toute remontée
   exige une justification écrite dans la PR.
6. **React 18 est en maintenance** alors que l'écosystème est passé à React 19. La
   charte le fixe et l'arbitrage confirme : **changer la pile pendant que quatre
   lots planifient dessus est le pire moment**. Le coût de migration est faible
   (`createRoot` ne change pas), et Testing Library 16 accepte les deux. À rouvrir
   à la première mise à jour bloquée, en modifiant la charte d'abord.
7. **TypeScript figé en 5.9** parce que `typescript-eslint` déclare
   `typescript <6.1.0`. On reste une majeure derrière. Aucun de nos fichiers
   n'utilise de fonctionnalité de TypeScript 6 ou 7 : ce sera une montée de version,
   pas une réécriture. À revoir quand `typescript-eslint` supportera la version
   native.
8. **`noUncheckedIndexedAccess` peut pousser au `!`**, ce qui serait pire que le
   problème d'origine. Parade en place : `no-non-null-assertion` en erreur, plus
   des accesseurs explicites côté lot 1. À surveiller dès les premières tables de
   données, c'est-à-dire très tôt.
9. **CI verte ≠ site qui marche.** Sans tests de bout en bout, la mise en page
   réelle, l'impression, la zone sûre et le toucher ne sont pas vérifiés
   automatiquement. Parade : le test d'intégration `<App />` (exigence §A13), plus
   le passage manuel obligatoire sur un vrai téléphone avant publication. C'est le
   risque assumé du renoncement à Playwright.
10. **Le réglage Pages est hors dépôt.** Si « Settings → Pages → source » n'est pas
    sur « GitHub Actions », `deploy` échoue avec un message peu clair. Noté au
    README, à faire une fois.
