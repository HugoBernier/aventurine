import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import unicorn from 'eslint-plugin-unicorn';
import sonarjs from 'eslint-plugin-sonarjs';
import regexp from 'eslint-plugin-regexp';
import vitest from '@vitest/eslint-plugin';
import testingLibrary from 'eslint-plugin-testing-library';
import prettier from 'eslint-config-prettier';

const REACT = ['react', 'react/*', 'react-dom', 'react-dom/*'];
const UI = ['**/ui', '**/ui/**'];
const STATE = ['**/state', '**/state/**'];
const DATA = ['**/data', '**/data/**'];

// `no-restricted-imports` ne voit QUE les imports statiques. Vérifié par une
// sonde à la mise en place : un `import('../ui/x')` dans src/domain/ passait
// sans un mot — or c'est précisément l'échappatoire qu'on emprunterait pour
// contourner la flèche. On ferme le trou avec un sélecteur de syntaxe, qui
// coûte cinq lignes et aucune dépendance.
function forbiddenDynamicImport(layerName, sourcePattern) {
  return {
    selector: `ImportExpression[source.value=${sourcePattern}]`,
    message: `Règle de dépendance (CLAUDE.md, « Architecture ») : src/${layerName}/ n'a pas le droit d'importer cela, même dynamiquement.`,
  };
}

function layer(layerName, forbidden, dynamicPattern) {
  return {
    files: [`src/${layerName}/**`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: forbidden,
              message: `Règle de dépendance (CLAUDE.md, « Architecture ») : src/${layerName}/ n'a pas le droit d'importer cela.`,
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        forbiddenDynamicImport(layerName, dynamicPattern),
      ],
    },
  };
}

// Un segment de chemin entier, pour ne pas attraper « src/domain/equipment ».
const DYN_REACT = String.raw`^react(-dom)?(\/|$)`;
const seg = (...names) => String.raw`(^|\/)(${names.join('|')})(\/|$)`;

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },

  js.configs.recommended,

  // Familles typées : elles voient les types, donc elles attrapent ce que
  // `tsc` ne signale pas (promesses ignorées, comparaisons impossibles,
  // `unknown` mal réduit). C'est le cœur du « lint au maximum ».
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  { files: ['**/*.js'], ...tseslint.configs.disableTypeChecked },

  unicorn.configs.recommended,
  sonarjs.configs.recommended,
  regexp.configs['flat/recommended'],

  { ...reactHooks.configs.flat.recommended, files: ['src/**/*.{ts,tsx}'] },
  // `eslint-plugin-jsx-a11y` est absent, et c'est un choix contraint : il
  // plafonne à ESLint 9 alors qu'`unicorn` exige ESLint 10.4 ou plus. Les deux
  // sont donc mutuellement exclusifs.
  //
  // On garde unicorn, parce que ce que la charte demande en accessibilité —
  // cibles de 44 px, contraste AA, navigation clavier, libellé sur chaque
  // cible — n'est presque pas analysable statiquement. Notre vrai analyseur
  // d'accessibilité, ce sont les tests : `getByRole` échoue sur un `div`
  // cliquable sans libellé, et src/tests/parcours.test.tsx balaie tous les
  // boutons pour vérifier qu'ils portent un nom accessible.
  // À rouvrir dès que jsx-a11y accepte ESLint 10.

  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // La charte interdit `any` et la métaprogrammation.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-param-reassign': ['error', { props: true }],

      // --- unicorn : on garde tout sauf ce qui se bat avec nos conventions ---
      // Le projet écrit délibérément `raceId: string | null` : `null` est une
      // valeur sérialisable en JSON, `undefined` ne l'est pas. Choix des plans.
      'unicorn/no-null': 'off',
      // « props », « ref », « e » sont l'idiome React ; les renommer nuit.
      'unicorn/prevent-abbreviations': 'off',
      // Un composant par fichier, nommé comme le composant (charte).
      'unicorn/filename-case': [
        'error',
        { cases: { camelCase: true, pascalCase: true, kebabCase: true } },
      ],
      // Renommer une variable courte mais claire n'évite aucun bug.
      'unicorn/name-replacements': 'off',
      // `getElementById` est plus rapide et plus clair que `querySelector('#x')`.
      'unicorn/prefer-query-selector': 'off',
      // `'x' in TABLE` est l'idiome correct d'une garde de type sur un objet.
      'unicorn/no-computed-property-existence-check': 'off',
      // Mise en forme pure : c'est le domaine de Prettier, pas du lint.
      'unicorn/single-line-block-comment-style': 'off',

      // Les identifiants de contenu sont des alias de `string` par décision
      // écrite (docs/plans/01-domaine-donnees.md, « Identifiants ») : les
      // typer par marque imposerait ~400 casts dans data/ pour un bénéfice
      // que les tests d'intégrité référentielle couvrent mieux. L'alias porte
      // l'intention entre cinq lots ; c'est sa raison d'être.
      'sonarjs/redundant-type-aliases': 'off',
    },
  },

  {
    files: ['**/*.test.{ts,tsx}'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      // Un test = un comportement, nommé en français (charte).
      'vitest/consistent-test-it': ['error', { fn: 'it' }],
      'vitest/no-disabled-tests': 'error',
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/expect-expect': 'error',
      'sonarjs/no-duplicate-string': 'off',
    },
  },
  {
    files: ['src/**/*.test.tsx'],
    ...testingLibrary.configs['flat/react'],
  },

  // Le domaine et l'état sont des contrats entre lots : leurs frontières
  // publiques sont annotées. Les composants, eux, rendent des éléments React
  // et l'annoter à chaque fois serait du bruit sans lecteur.
  {
    files: ['src/domain/**/*.ts', 'src/state/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: { '@typescript-eslint/explicit-module-boundary-types': 'error' },
  },

  layer(
    'domain',
    [...REACT, ...UI, ...STATE, ...DATA],
    `/${DYN_REACT}|${seg('ui', 'state', 'data')}/`,
  ),
  layer('data', [...REACT, ...UI, ...STATE], `/${DYN_REACT}|${seg('ui', 'state')}/`),
  layer(
    'state',
    ['react-dom', 'react-dom/*', ...UI],
    String.raw`/^react-dom(\/|$)|${seg('ui')}/`,
  ),

  prettier,
);
