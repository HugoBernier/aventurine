import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Base ABSOLUE, parce que le site a maintenant des routes.
  //
  // §A29 avait posé `base: './'` en s'appuyant sur « le site n'a aucun
  // routage », et prévenait qu'un routeur imposerait d'y revenir. C'est le
  // moment. Servi depuis `/contenu/barbare`, un chemin relatif `./assets/…`
  // résout vers `/contenu/assets/…` et rend une page blanche.
  //
  // Ce que ça coûte : le site doit être servi à la RACINE d'un domaine, et
  // `dist/index.html` ne s'ouvre plus depuis un dossier local (`npm run
  // preview` le sert correctement). Ce que ça évite : le hack `404.html` de
  // GitHub Pages, qui sert l'application avec un code HTTP 404.
  base: '/',
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
