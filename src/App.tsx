import type { ReactNode } from 'react';
import { CATALOGUE } from './data/catalogue';
import { WizardProvider } from './state/WizardProvider';
import { Wizard } from './ui/Wizard';

export default function App(): ReactNode {
  return (
    <WizardProvider catalogue={CATALOGUE}>
      <Wizard />
    </WizardProvider>
  );
}
