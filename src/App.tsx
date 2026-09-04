import type { ReactNode } from 'react';
import { CATALOGUE } from './data/catalogue';
import { PacksProvider, usePacks } from './state/PacksProvider';
import { WizardProvider } from './state/WizardProvider';
import { Wizard } from './ui/Wizard';

/**
 * Les packs installés se posent sur le SRD avant que l'assistant ne voie quoi
 * que ce soit : pour lui, il n'y a qu'un catalogue.
 */
function WithPacks(): ReactNode {
  const { catalogue } = usePacks();
  return (
    <WizardProvider catalogue={catalogue}>
      <Wizard />
    </WizardProvider>
  );
}

export default function App(): ReactNode {
  return (
    <PacksProvider base={CATALOGUE}>
      <WithPacks />
    </PacksProvider>
  );
}
