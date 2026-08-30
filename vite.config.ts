import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Chemins RELATIFS plutôt qu'une base codée en dur.
  //
  // Le site n'a aucun routage — c'est une décision de la charte — donc il n'y
  // a qu'une seule page, et des liens relatifs suffisent. Conséquence : le
  // site fonctionne à n'importe quelle adresse (racine de domaine, sous-chemin
  // GitHub Pages, dossier local), et renommer le dépôt ne casse plus rien.
  //
  // C'est le périmètre réduit qui rend ce choix possible. Le jour où un
  // routeur apparaîtrait, il faudrait revenir à une base explicite.
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    css: false,
    coverage: {
      provider: 'v8',
      include: ['src/domain/**'],
      // Jeux d'essai : du matériel de test, pas du code livré.
      exclude: ['src/domain/fixtures/**'],
      thresholds: { lines: 90, functions: 90, statements: 90, branches: 85 },
    },
  },
});
