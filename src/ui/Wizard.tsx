import { Suspense, lazy, useState } from 'react';
import type { ReactNode } from 'react';
import {
  useCharacterSheet,
  useChoiceSlot,
  useNotices,
  useStorageStatus,
  useView,
  useWizard,
} from '../state/hooks';
import type { Screen, StepId } from '../state/types';
import { loadPackDraft } from '../state/persistence/creatorStorage';
import type { PackDraft } from '../domain/packDraft';
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
import { PacksScreen } from './screens/PacksScreen';
import { PersonalityScreen } from './screens/PersonalityScreen';
import { SelectionScreen } from './screens/SelectionScreen';
import { SummaryScreen } from './screens/SummaryScreen';

/**
 * Le créateur se charge à la demande, et lui seul.
 *
 * C'est l'écran qu'on ouvre chez soi, au clavier, une fois — pas celui qu'on
 * consulte à table, au pouce, cent fois. Le faire télécharger à qui joue
 * revenait à lui faire payer un outil qu'il n'ouvrira pas ce soir-là : dix kio
 * gzip, soit près d'un dixième de l'application. Le budget de poids de la CI
 * est posé exactement pour rendre cet arbitrage visible.
 */
const CreatorScreen = lazy(async () => {
  const module = await import('./screens/CreatorScreen');
  return { default: module.CreatorScreen };
});

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
  // Ni la fiche ni la liste ne sont des étapes, mais recharger le téléphone
  // doit rouvrir celle qu'on regardait : la vue vit donc dans l'état, avec le
  // reste de ce qu'on sauvegarde.
  const { view, setView } = useView();
  // Le pack en cours d'écriture est relu une fois, au démarrage : c'est le
  // filet du créateur, et il vit sous sa propre clé.
  const [packDraft, setPackDraft] = useState<PackDraft>(loadPackDraft);

  if (view === 'packs') {
    return (
      <AppShell
        screenKey="packs"
        title="Tes packs"
        lead="Le contenu écrit à la main, le tien ou celui qu’on t’a donné."
        header={
          <ProgressBanner
            stepLabel="Tes packs"
            stepIndex={1}
            stepCount={1}
            screenIndex={1}
            screenCount={1}
            onBack={() => {
              setView('summary');
            }}
            onOpenSummary={() => {
              setView('summary');
            }}
          />
        }
        actions={
          <ActionBar
            primary={{
              label: 'Revenir à l’assistant',
              onClick: () => {
                setView('wizard');
              },
            }}
          />
        }
      >
        <PacksScreen
          onCreate={() => {
            setView('creator');
          }}
        />
      </AppShell>
    );
  }

  if (view === 'creator') {
    return (
      <AppShell
        screenKey="creator"
        title="Écrire un pack"
        lead="Ton contenu à toi, gardé sur cet appareil et enregistrable en fichier."
        header={
          <ProgressBanner
            stepLabel="Écrire un pack"
            stepIndex={1}
            stepCount={1}
            screenIndex={1}
            screenCount={1}
            onBack={() => {
              setView('packs');
            }}
            onOpenSummary={() => {
              setView('summary');
            }}
          />
        }
        actions={
          <ActionBar
            primary={{
              label: 'Revenir à tes packs',
              onClick: () => {
                setView('packs');
              },
            }}
          />
        }
      >
        <Suspense fallback={<p>On ouvre le créateur…</p>}>
          <CreatorScreen draft={packDraft} onChange={setPackDraft} />
        </Suspense>
      </AppShell>
    );
  }

  if (view === 'library') {
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
              setView('wizard');
            }}
            onOpenSummary={() => {
              setView('summary');
            }}
          />
        }
        actions={
          <ActionBar
            primary={{
              label: 'Revenir à l’assistant',
              onClick: () => {
                setView('wizard');
              },
            }}
          />
        }
      >
        <LibraryScreen />
      </AppShell>
    );
  }

  if (view === 'summary') {
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
              setView('wizard');
            }}
            onOpenSummary={() => {
              setView('wizard');
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
                setView('wizard');
              },
            }}
          />
        }
      >
        <SummaryScreen
          onOpenLibrary={() => {
            setView('library');
          }}
          onOpenPacks={() => {
            setView('packs');
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
            setView('summary');
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
                  setView('summary');
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
