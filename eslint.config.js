import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

const REACT = ['react', 'react/*', 'react-dom', 'react-dom/*'];
const UI = ['**/ui', '**/ui/**'];
const STATE = ['**/state', '**/state/**'];
const DATA = ['**/data', '**/data/**'];

// Règle de dépendance — CLAUDE.md, section « Architecture », amendée par
// docs/plans/00-arbitrage.md §A6 :
//   ui → state, domain, data | state → domain | data → domain | domain → rien
// Il n'y a volontairement pas de layer('ui', …) : aucune couche n'est au-dessus
// de ui/, donc il n'y a rien à lui interdire. `ui → data` est autorisé et voulu.
// `no-restricted-imports` ne voit QUE les imports statiques. Vérifié par une
// sonde à la mise en place : un `import('../ui/x')` dans src/domain/ passait
// sans un mot — or c'est précisément l'échappatoire qu'on emprunterait pour
// contourner la flèche. On ferme le trou avec un sélecteur de syntaxe, qui
// coûte cinq lignes et aucune dépendance.
function forbiddenDynamicImport(dir, sourcePattern) {
  return {
    selector: `ImportExpression[source.value=${sourcePattern}]`,
    message: `Règle de dépendance (CLAUDE.md, section « Architecture ») : src/${dir}/ n'a pas le droit d'importer cela, même dynamiquement.`,
  };
}

function layer(dir, forbidden, dynamicPattern) {
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
      'no-restricted-syntax': ['error', forbiddenDynamicImport(dir, dynamicPattern)],
    },
  };
}

// Un segment de chemin entier, pour ne pas attraper « src/domain/equipment ».
const DYN_REACT = String.raw`^react(-dom)?(\/|$)`;
const seg = (...names) => String.raw`(^|\/)(${names.join('|')})(\/|$)`;

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
