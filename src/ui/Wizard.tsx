import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  useCharacterSheet,
  useChoiceSlot,
  useNotices,
  useStorageStatus,
  useWizard,
} from '../state/hooks';
import type { Screen, StepId } from '../state/types';
import { Notice } from './components/Notice';
import { ProgressBanner } from './components/ProgressBanner';
import { ActionBar } from './components/ActionBar';
import { AppShell } from './shell/AppShell';
import { formatNotice } from './format/notice';
import { formatSheetSummary } from './format/sheetSummary';
import { AbilityAssignScreen } from './screens/AbilityAssignScreen';
import { AbilityMethodScreen } from './screens/AbilityMethodScreen';
import { AlignmentScreen } from './screens/AlignmentScreen';
import { ChoiceSlotScreen } from './screens/ChoiceSlotScreen';
import { LevelScreen } from './screens/LevelScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { NameScreen } from './screens/NameScreen';
import { PersonalityScreen } from './screens/PersonalityScreen';
import { SelectionScreen } from './screens/SelectionScreen';
import { SummaryScreen } from './screens/SummaryScreen';

const STEP_LABELS: Record<StepId, string> = {
  race: 'Ta race',
  class: 'Ta classe',
  abilities: 'Tes caractéristiques',
  advancement: 'Ta progression',
  background: 'Ton historique',
  proficiencies: 'Ce que tu sais faire',
  spells: 'Tes sorts',
  equipment: 'Ton équipement',
  identity: 'Ton identité',
};

const ANCHOR_TITLES: Record<string, { readonly title: string; readonly lead: string }> = {
  race: {
    title: 'Choisis ta race',
    lead: 'Le peuple d’où tu viens. Ça change tes scores et te donne des capacités.',
  },
  subrace: {
    title: 'Choisis ta branche',
    lead: 'Une lignée à l’intérieur de ton peuple, avec ses propres bonus.',
  },
  class: {
    title: 'Choisis ta classe',
    lead: 'Ton métier d’aventurier : comment tu te bats, ce que tu sais faire.',
  },
  level: {
    title: 'À quel niveau joues-tu ?',
    lead: 'Le niveau 1 pour une nouvelle table. Sinon, monte jusqu’au tien.',
  },
  'ability-method': {
    title: 'Comment veux-tu tes scores ?',
    lead: 'Deux façons de fixer tes six caractéristiques.',
  },
  'ability-assign': {
    title: 'Répartis tes caractéristiques',
    lead: 'Six chiffres qui décrivent ton personnage.',
  },
  background: {
    title: 'Choisis ton historique',
    lead: 'Ce que tu faisais avant de partir à l’aventure.',
  },
  name: {
    title: 'Comment t’appelles-tu ?',
    lead: 'Tu peux avancer sans, et revenir plus tard.',
  },
  alignment: {
    title: 'Choisis ton alignement',
    lead: 'Ta boussole morale, en deux mots.',
  },
  personality: {
    title: 'Qui es-tu vraiment ?',
    lead: 'Quatre phrases qui servent à jouer, pas à calculer.',
  },
};

function ScreenBody({ screen }: { readonly screen: Screen }): ReactNode {
  if (screen.kind === 'choice') {
    return <ChoiceSlotScreen slotId={screen.slotId} />;
  }
  switch (screen.anchor) {
    case 'race':
    case 'subrace':
    case 'class':
    case 'background': {
      return <SelectionScreen kind={screen.anchor} />;
    }
    case 'level': {
      return <LevelScreen />;
    }
    case 'ability-method': {
      return <AbilityMethodScreen />;
    }
    case 'ability-assign': {
      return <AbilityAssignScreen />;
    }
    case 'name': {
      return <NameScreen />;
    }
    case 'alignment': {
      return <AlignmentScreen />;
    }
    case 'personality': {
      return <PersonalityScreen />;
    }
    case 'summary': {
      return <SummaryScreen />;
    }
  }
}

export function Wizard(): ReactNode {
  const { screen, progress, canGoBack, canGoNext, goNext, goBack } = useWizard();
  // Le titre d'un écran de créneau EST sa question, « Où mettre ton +2 ? »,
  // et non le générique « Un choix à faire », identique sur vingt écrans.
  const slotView = useChoiceSlot(screen.kind === 'choice' ? screen.slotId : null);
  const { notices, dismiss } = useNotices();
  const storage = useStorageStatus();
  const sheet = useCharacterSheet();
  // Le récapitulatif n'est pas une étape : il s'ouvre par « Ma fiche » et se
  // referme. C'est de l'état d'affichage, il reste donc dans l'interface.
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  if (isLibraryOpen) {
    return (
      <AppShell
        screenKey="library"
        title="Tes personnages"
        lead="Passe de l’un à l’autre, ou commence-en un nouveau."
        header={
          <ProgressBanner
            stepLabel="Tes personnages"
            stepIndex={1}
            stepCount={1}
            screenIndex={1}
            screenCount={1}
            onBack={() => {
              setIsLibraryOpen(false);
            }}
            onOpenSummary={() => {
              setIsLibraryOpen(false);
              setIsSummaryOpen(true);
            }}
          />
        }
        actions={
          <ActionBar
            primary={{
              label: 'Revenir à l’assistant',
              onClick: () => {
                setIsLibraryOpen(false);
              },
            }}
          />
        }
      >
        <LibraryScreen
          onLeave={() => {
            setIsLibraryOpen(false);
          }}
        />
      </AppShell>
    );
  }

  if (isSummaryOpen) {
    return (
      <AppShell
        screenKey="summary"
        title="Presque prêt !"
        header={
          <ProgressBanner
            stepLabel="Récapitulatif"
            stepIndex={progress?.stepCount ?? 8}
            stepCount={progress?.stepCount ?? 8}
            screenIndex={progress?.screenCount ?? 1}
            screenCount={progress?.screenCount ?? 1}
            onBack={() => {
              setIsSummaryOpen(false);
            }}
            onOpenSummary={() => {
              setIsSummaryOpen(false);
            }}
          />
        }
        actions={
          // Une seule action : « ‹ Continuer » à côté faisait exactement la même
          // chose sous un autre nom, ce qui donne à croire qu'elles diffèrent.
          <ActionBar
            primary={{
              label: 'Revenir à l’assistant',
              onClick: () => {
                setIsSummaryOpen(false);
              },
            }}
          />
        }
      >
        <SummaryScreen
          onNavigate={() => {
            setIsSummaryOpen(false);
          }}
          onOpenLibrary={() => {
            setIsSummaryOpen(false);
            setIsLibraryOpen(true);
          }}
        />
      </AppShell>
    );
  }

  const { title, lead } =
    screen.kind === 'anchor'
      ? (ANCHOR_TITLES[screen.anchor] ?? { title: 'Ton personnage', lead: '' })
      : { title: slotView?.slot.title ?? 'Un choix à faire', lead: '' };

  return (
    <AppShell
      screenKey={screen.id}
      title={title}
      lead={lead === '' ? undefined : lead}
      header={
        <ProgressBanner
          stepLabel={progress === null ? '' : STEP_LABELS[progress.step]}
          stepIndex={progress?.stepIndex ?? 1}
          stepCount={progress?.stepCount ?? 8}
          screenIndex={progress?.screenIndex ?? 1}
          screenCount={progress?.screenCount ?? 1}
          onBack={canGoBack ? goBack : undefined}
          onOpenSummary={() => {
            setIsSummaryOpen(true);
          }}
        />
      }
      actions={
        <ActionBar
          back={canGoBack ? { label: '‹ Précédent', onClick: goBack } : undefined}
          primary={{
            label: canGoNext ? 'Suivant ›' : 'Voir ma fiche',
            onClick: canGoNext
              ? goNext
              : () => {
                  setIsSummaryOpen(true);
                },
          }}
          effect={formatSheetSummary(sheet)}
        />
      }
    >
      {storage !== 'ok' && (
        <Notice tone="reminder">
          Ta progression ne sera pas conservée si tu fermes cet onglet.
        </Notice>
      )}
      {notices.map((notice) => (
        <Notice
          key={notice.id}
          tone="reminder"
          live
          onDismiss={() => {
            dismiss(notice.id);
          }}
        >
          {formatNotice(notice.reason)}
        </Notice>
      ))}
      <ScreenBody screen={screen} />
    </AppShell>
  );
}
