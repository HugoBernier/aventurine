import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Avec globals: false, Testing Library ne peut pas enregistrer son nettoyage
// automatique (il cherche un afterEach global). On le fait à la main : sans
// ces lignes, les composants d'un test fuient dans le suivant et les échecs
// deviennent dépendants de l'ordre d'exécution.
afterEach(cleanup);
