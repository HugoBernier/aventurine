import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// ATTENTION — ne pas « corriger » cette base en la croyant obsolete.
// Le produit s'appelle Aventurine, mais le depot GitHub s'appelle toujours
// D-DBeyondFranche et le site est publie sur
// https://<compte>.github.io/D-DBeyondFranche/. Renommer le depot casserait
// l'URL de publication (docs/plans/00-arbitrage.md, §A18). C'est le seul
// endroit du code ou l'ancien nom subsiste, et c'est volontaire.
const REPOSITORY_PATH = '/D-DBeyondFranche/';

export default defineConfig({
  // Base fixee aussi en developpement : un bug de sous-chemin se voit alors
  // des la premiere minute, pas au premier deploiement.
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
