# Arbitrage des plans — revue de lots

Les cinq lots ont planifié en parallèle. Ce document tranche les conflits et fait
autorité sur les plans individuels. **En cas de désaccord entre un plan de lot et
ce fichier, ce fichier gagne.**

---

## A. Conflits entre lots (à corriger dans les plans)

### A1. Trois définitions incompatibles du brouillon

| Lot | Nom                              | Forme des choix                                                                              |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | `BrouillonPersonnage` (français) | `reponses: Record<ChoixId, string[]>`                                                        |
| 2   | `CharacterDraft` (anglais)       | `choices: Record<ChoiceSlotId, string[]>`                                                    |
| 4   | `CharacterDraft` (anglais)       | `skillChoices[]`, `languageChoices[]`, `toolChoices[]`, `featureChoices{}`, `spellChoices{}` |

**Tranché : la forme du lot 2 gagne.** Un seul dictionnaire `choices`, clé =
identifiant de créneau. La forme du lot 4 (un tableau par catégorie) casse
l'uniformité que les lots 1 et 2 ont tous les deux identifiée comme la décision
structurante : elle rend l'invalidation en cascade impossible à écrire sans un
`switch` par catégorie, et oblige à toucher le type à chaque nouvelle sorte de
choix (violation directe d'Ouvert/Fermé).

`CharacterDraft` est **défini dans `src/domain/draft.ts`** et importé par `state/`,
`data/` et les tests. Une seule déclaration dans tout le dépôt.

### A2. Langue du code — la charte a été violée par deux lots sur quatre

Lots 1 et 3 ont écrit le domaine et les hooks en français (`modificateur`,
`trouverRace`, `useChoixRace`, `--c-texte`). Lots 2 et 4 en anglais. Mélanger est
le pire résultat possible.

**Tranché : anglais dans le code, sans exception** (charte §6, déjà écrite avant
les plans). `abilityModifier`, `findRace`, `useRaceChoice`, `--color-text`.
Restent en français : les chaînes affichées, les identifiants de contenu
(`'demi-orc'`, `'roublard'`), et les noms de tests.

Le point 6 de la charte est clarifié pour couper court : cela vaut aussi pour les
noms de hooks, de variables CSS, de fichiers et de dossiers.

### A3. Identifiant de créneau de choix

| Lot | Convention                         |
| --- | ---------------------------------- |
| 1   | `'roublard/competences'`           |
| 2   | `'class:roublard:skills'`          |
| 4   | `'style-de-combat'` (aucun parent) |

**Tranché : `source:parentId:subject`** → `class:roublard:skills`,
`race:haut-elfe:cantrip`, `background:acolyte:languages`.

C'est l'exigence la mieux argumentée de toute la revue : parce que l'identifiant
porte la décision parente, changer de classe ferme mécaniquement tous les créneaux
de l'ancienne et la purge devient gratuite — **zéro ligne de code par catégorie**.
La forme du lot 4 rendrait la cascade impossible.

### A4. Un seul type de créneau, un seul type d'option

Trois noms pour la même chose : `Question`/`OptionQuestion` (lot 1),
`ChoiceSlot`/`ChoiceOption` (lot 2), `OptionChoix`/`OptionMultiple` (lot 3).

**Tranché** : `ChoiceSlot` / `ChoiceOption`, définis dans `src/domain/choice.ts`,
produits par `openChoices(draft, catalogue)`.

Deux corrections de fond aux propositions initiales :

1. **La réponse ne vit pas dans le créneau.** Le lot 1 mettait `reponse` et
   `complete` dans sa `Question` : ce serait une seconde source de vérité à côté de
   `draft.choices`. Le créneau décrit ce qui est demandé ; le brouillon détient ce
   qui a été répondu.
2. **`ChoiceOption` porte les trois repères comparables** exigés par le lot 3 —
   c'est la meilleure idée d'ergonomie de la revue et aucun autre lot ne l'avait
   prévue. Type figé à un triplet, pas un tableau libre : c'est ce qui garantit la
   comparaison verticale sur 360 px.

```ts
// src/domain/choice.ts
export type ChoiceSlotId = string; // 'class:roublard:skills'
export type ChoiceSource = 'race' | 'class' | 'background';
export type ChoiceKind =
  | 'skill'
  | 'language'
  | 'tool'
  | 'cantrip'
  | 'spell'
  | 'ability'
  | 'equipment'
  | 'ancestry'
  | 'fighting-style'
  | 'expertise';

export type UnavailableReason =
  | { readonly kind: 'already-granted'; readonly source: ChoiceSource }
  | { readonly kind: 'slot-full' };

export interface ChoiceOption {
  readonly id: string;
  readonly label: string; // « Discrétion »
  readonly blurb: string; // une phrase, vocabulaire de joueur
  readonly facts: readonly [string, string, string]; // repères ALIGNÉS
  readonly details: readonly { title: string; body: string }[];
  readonly unavailable: UnavailableReason | null;
}

export interface ChoiceSlot {
  readonly id: ChoiceSlotId;
  readonly source: ChoiceSource;
  readonly kind: ChoiceKind;
  readonly title: string; // « Choisis 2 compétences de roublard »
  readonly help: string;
  readonly pick: number;
  readonly options: readonly ChoiceOption[];
}
```

### A5. Où s'écrit le français — le lot 2 et le lot 3 se contredisent frontalement

Lot 2 : « les messages sont écrits en français **dans `domain/`** ».
Lot 3 : « le lot 2 dit _pourquoi_ c'est bloqué, le lot 3 écrit la phrase ».

**Tranché, avec une ligne nette :**

- **Prose de contenu** (nom de race, description de sort, phrase d'usage d'une
  compétence) → `data/`, en français. C'est du contenu, pas de la logique.
- **Phrase qui dépend de valeurs d'exécution** (« Il te reste 2 points, monter la
  Force en coûte 3 ») → composée dans `ui/format/`, à partir d'une **raison
  structurée** rendue par le domaine.

Le domaine ne concatène jamais de phrase. Il rend `{ kind: 'not-enough-points',
required: 3, remaining: 2 }`. Le lot 3 a raison sur le principe, le lot 2 a raison
sur le fait qu'il ne faut pas de couche de traduction : il n'y en a pas, il y a
juste un formateur français, dans la couche qui affiche.

### A6. `ui → data` est autorisé

Le lot 3 a inventé un hook `useGlossaire` dont le seul rôle était de faire
transiter du texte par `state/` pour ne pas enfreindre la règle de dépendance —
et a lui-même qualifié ce hook d'artificiel. Il avait raison de le signaler.

**Tranché : la règle devient**

```
ui → state → domain
ui → data          (lecture de contenu uniquement)
data → domain      (types uniquement)
domain → rien
```

Ce qui compte vraiment est préservé : `domain/` ne dépend de rien, `data/` ne
contient aucune logique. Un composant qui lit une définition de glossaire dans
`data/` n'enfreint aucun principe ; un faux hook, si. Le lot 5 encode cette forme
exacte dans sa règle de lint.

### A7. Le lot 4 s'appuie sur un système de design que le lot 3 refuse d'écrire

Lot 4 : « Réutilisés tels quels : `Button`, `Card`, `Chip`, `Callout`, `Stack` ».
Lot 3 : « Pas de composant générique `Bouton` exporté […] Trois cas identiques
feront un composant ; pas avant. »

**Tranché : le lot 3 a raison** (YAGNI), et c'est lui qui possède `src/ui/`. Le lot
4 se limite à l'inventaire réel du lot 3 (`AppShell`, `ActionBar`, `ChoiceGroup`,
`Explainer`, `TextField`, `Notice`) et déclare ses propres `StatTile` et `DataRow`
dans `ui/sheet/`. Le lot 4 renumérote au passage : **UI = lot 3, état = lot 2**
(il les a intervertis dans tout son plan).

### A8. Frontière lot 3 / lot 4 sur l'écran final

Les deux plans décrivent l'écran de fiche. **Tranché :** le lot 3 possède le cadre,
les jetons, les composants et les écrans 0 à 9 ; le lot 4 possède le récapitulatif,
la fiche, l'impression et l'import/export. Le lot 3 retire l'écran 10 de son plan.

### A9. Parcours canonique — une seule liste

Lot 2 annonçait 8 étapes, lot 3 en montrait 9 à 11, lot 4 écrivait « étape 8 sur 8 ».

**Tranché — 8 étapes, dans cet ordre :**

| #   | Étape                    | Écrans                                                |
| --- | ------------------------ | ----------------------------------------------------- |
| 1   | Ta race                  | race, sous-race _(si applicable)_, créneaux de race   |
| 2   | Ta classe                | classe, créneaux de classe hors compétences           |
| 3   | Tes caractéristiques     | méthode, répartition                                  |
| 4   | Ton historique           | historique, créneaux d'historique                     |
| 5   | Ce que tu sais faire     | créneaux de compétences, langues, outils              |
| 6   | Tes sorts                | tours de magie, sorts _(classes lanceuses seulement)_ |
| 7   | Ton équipement           | options de départ                                     |
| 8   | Ton identité             | nom, alignement, personnalité                         |
| —   | Récapitulatif puis fiche | hors numérotation d'étape                             |

**Changement de fond par rapport au plan du lot 2** : les créneaux de compétences
sont regroupés à l'étape 5, **après** l'historique, au lieu d'être accrochés
derrière la classe. Conséquence directe : l'historique a déjà donné ses compétences
fixes quand le joueur choisit les siennes, donc le cas « Perception en double »
devient inatteignable en marche avant. On ne supprime pas le mécanisme de
disponibilité (un retour en arrière peut toujours le déclencher), mais on cesse de
le faire vivre au joueur à chaque partie.

L'affichage reste « Étape 3 sur 8 » ; la barre fine mesure les écrans.

### A10. `index.html` — le lot 5 casse deux exigences du lot 3

Le lot 3 a démontré deux prérequis, le lot 5 a écrit un `index.html` qui les
contredit tous les deux.

| Point          | Lot 3                                | Lot 5        | Tranché                                                                                                                                                                                              |
| -------------- | ------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `viewport`     | `viewport-fit=cover` **obligatoire** | absent       | **Lot 3.** Sans lui `env(safe-area-inset-*)` vaut `0px` : le problème est invisible en développement, et les boutons passent sous la barre d'accueil de l'iPhone en production.                      |
| `color-scheme` | `light` seul                         | `light dark` | **Lot 3.** Annoncer `dark` sans thème sombre fait inverser les contrôles natifs par le système et détruit les contrastes vérifiés du lot 3. On annonce `light` tant qu'il n'y a pas de thème sombre. |

`index.html` appartient au lot 5, mais ces deux attributs sont dictés par le
lot 3. Ils sont commentés dans le fichier pour que personne ne les « nettoie ».

### A11. Interdiction des fichiers barils — trop large telle quelle

Le lot 5 interdit « aucun fichier `index.ts` de ré-export dans `src/` », pour
empêcher qu'un baril ouvre un chemin de `domain/` vers `ui/` que le motif de lint
ne verrait pas. Le raisonnement est juste, la formulation est trop large : le
lot 1 a besoin de `src/data/classes/index.ts` (assemblage des 12 classes) et d'un
module qui compose le `Catalogue`.

**Tranché — la règle devient :**

- Interdit : tout baril **à la racine de `src/`** ou **à la racine d'une couche**
  (`src/index.ts`, `src/domain/index.ts`, `src/ui/index.ts`…). C'est là, et là
  seulement, que naît le chemin détourné entre couches.
- Autorisé : un module d'agrégation **à l'intérieur** d'une couche, qui compose
  du contenu et ne ré-exporte pas d'autres couches. `src/data/classes/index.ts`
  et `src/data/catalogue.ts` sont légitimes.

### A12. Références à la charte

Le lot 5 cite la charte par numéro de ligne (« §139 », « §41 », « §165 »). Ces
numéros ne correspondent à rien et deviendront faux à la première modification.
**Citer les sections par leur nom** (« Principes non négociables », « Tests »).

### A13. Ce que le lot 5 apporte et qui s'impose aux autres

Trois décisions du lot 5 contraignent les autres lots et sont retenues telles
quelles :

1. **Les données SRD sont des modules TypeScript importés, jamais des fichiers
   récupérés par `fetch`.** Conséquence directe du sous-chemin GitHub Pages : une
   URL absolue écrite à la main casse en production. Contrainte pour le lot 1.
2. **Aucune URL commençant par `/` dans le code.** Un actif s'importe ; une URL
   construite part de `import.meta.env.BASE_URL`.
3. **Un test d'intégration qui monte `<App />` et parcourt tout l'assistant est
   obligatoire.** C'est la compensation explicite du renoncement à Playwright, et
   il couvre la persistance `localStorage` d'un rechargement à l'autre. Il est à
   la charge conjointe des lots 2 et 3.

Est également retenue, sans réserve, l'analyse du lot 5 sur la couverture de
tests : un seuil **uniquement sur `src/domain/`**, aucun ailleurs. L'argument
— « un seuil global apprend à tromper la mesure » — est le bon.

### A14. Versions de dépendances à vérifier à l'installation

Le lot 5 propose un jeu de versions majeures récentes (Vite 8, Vitest 4,
ESLint 10, `@vitejs/plugin-react` 6). Elles sont plausibles mais n'ont pas été
installées. **À vérifier réellement à l'étape 2 de la mise en place**, pas à
recopier de confiance : si une majeure ne s'installe pas ou casse, on descend
d'une version et on le note. Le plan a raison sur un point qui compte plus que
les numéros : `package-lock.json` versionné et `npm ci` partout.

### A15. L'expertise doit être différée en fin d'étape 5 — le lot 2 a raison

Le lot 2 a relevé une erreur bloquante dans §A9 : j'y laissais les créneaux
`expertise` accrochés à l'ancre de classe, en étape 2.

**Il a raison, et c'est bloquant.** Les options d'une expertise sont les
compétences que le personnage **possède déjà**. Placée en étape 2, avant que le
joueur ait choisi la moindre compétence, la liste serait vide : le roublard est
cassé dès le premier parcours.

**Tranché :** `expertise` est différée comme `skill`/`language`/`tool`, et placée
**en dernier dans l'étape 5**, après tous les choix de maîtrises.

Conséquence pour le lot 1 : `openChoices` doit calculer les options d'un créneau
d'expertise à partir des compétences effectivement acquises par le brouillon
courant, **dotations fixes comprises** (race, historique), pas seulement des
compétences choisies.

### A16. `useAbilities()` doit exposer des lignes dérivées — le lot 3 a raison

Le lot 3 a relevé que `useAbilities()`, tel que le lot 2 le publie, expose
`input` et `pointsLeft` mais ni `canIncrease`, ni `increaseCost`, ni la raison
d'un blocage. L'écran de répartition devrait alors connaître la table de coûts
d'achat de points pour décider si `+` est actif.

**Il a raison, et c'est bloquant** : ce serait un calcul de règle dans un
composant, c'est-à-dire un bug de conception au sens de la charte.

**Tranché :** `useAbilities()` rend en plus `rows: readonly AbilityRow[]`, dans
la forme proposée par le lot 3 — `score`, `racialBonus`, `bonusSource`, `total`,
`modifier`, `canIncrease`, `canDecrease`, `increaseCost`, et un `blockedBy`
**structuré** (`not-enough-points` / `max-score` / `min-score`), jamais rédigé.

Cette forme est volontairement identique à `UnavailableReason` (§A4) : trois
mécanismes de blocage identiques valent mieux que deux plus une exception.

### A17. Objection du lot 3 sur `Issue.message` — déjà résolue

Le lot 3 signale que le lot 2 conserve `Issue.message: string` rédigé en
français dans `domain/`, en contradiction avec §A5. **Le grief portait sur la
version 1 du plan du lot 2** ; sa version 2 a corrigé le point : `Issue` porte
désormais un `IssueReason` structuré et `ui/format/issue.ts` compose la phrase.
Rien à trancher, la cohérence est faite.

### A18. Nom du produit — tranché

« Aventurine » reprenait le nom d'un service de Wizards of the Coast, ce
que la licence CC BY du SRD ne couvre pas (elle porte sur le contenu, pas sur les
marques).

**Le produit s'appelle « Aventurine ».** C'est un mot français existant — un
quartz — qui contient « aventure », ne reprend aucune marque et se retient.

- Le **dépôt GitHub peut être renommé librement** : voir §A29, le site est
  compilé en chemins relatifs et ne dépend plus de son adresse.
- Le nom affiché, le `<title>`, le README, l'écran d'accueil et le pied de fiche
  disent « Aventurine ».
- La référence « D&D 5e » reste employée pour **décrire** la compatibilité, ce
  qui est un usage licite ; elle est toujours accompagnée de la mention « non
  affilié à Wizards of the Coast ».
- Fichier exporté et clé de stockage : `ddbf` devient `aventurine`
  (`aventurine:draft:v1`, format `aventurine.personnage`,
  `fiche-alric-guerrier.json` inchangé). Aucune migration : rien n'est publié.

### A19. Trois objections du lot 1 — deux acceptées, une rejetée

**Acceptée — `fullText` n'est pas déclaré.** Voir l'amendement de §B2 ci-dessous.
Un champ que rien ne remplit et que rien ne lit est du code mort ; l'argument
« l'ajout sera purement additif » vaut dans les deux sens, et joue donc contre le
fait de l'écrire maintenant. Le lot 1 avait raison de le contester tout en
l'écrivant, plutôt que de trancher seul.

**Acceptée — les intitulés de repères vivent dans `ui/format/`.** Le lot 1
observe que `facts` vaut `['…', '—', '—']` pour quatre `kind` sur dix, et
surtout que le type ne porte aucun intitulé de colonne alors que l'alignement
vertical du lot 3 en dépend. Sa résolution est retenue telle quelle, sans
toucher au type : une table `ChoiceKind → [intitulé, intitulé, intitulé]` dans
`ui/format/`, et l'UI ne rend la bande de repères que pour les `kind` où elle
informe (race, sous-race, classe, historique, équipement, sorts). Pour
`skill`, `language`, `tool` et `ability`, on affiche la seule information utile
en ligne simple.

**Rejetée — `slot-full` reste un blocage explicite.** Le lot 1 propose qu'un
groupe plafonné remplace la sélection la plus ancienne quand on coche au-delà du
maximum, au lieu de désactiver les options restantes.

Le remplacement silencieux est **imprévisible** : le joueur coche une troisième
compétence et une autre disparaît, sans qu'il sache laquelle ni pourquoi. Le
lot 3 a déjà conçu le cas correctement — options désactivées **plus** un message
qui dit quoi faire (« Tu as tes 2 compétences. Décoche-en une pour en changer »)
— et son argument tient : un appui sans effet fait croire à un bug, un appui
refusé avec une raison affichée ne le fait pas. Le coût est une tape
supplémentaire pour changer d'avis ; le bénéfice est qu'on ne perd jamais un
choix sans l'avoir demandé.

Deux garde-fous, sans lesquels le rejet ne tient pas : le message accompagne
**toujours** l'état plein (jamais des cases grises muettes), et pour `pick === 1`
le groupe reste un bouton radio, où le remplacement est naturel et attendu.

### A20. Duplication assumée de la liste des compétences

Le lot 1 signale que « `data → domain`, types uniquement » interdit à `data/`
d'importer la constante `SKILL_ABILITY` : les 18 identifiants de compétence
existent donc dans les deux couches — une fois comme règle (quelle
caractéristique gouverne quoi), une fois comme contenu (nom français, phrase
d'usage).

**C'est acceptable et ça reste ainsi.** L'alternative — autoriser `data/` à
importer des valeurs et non plus seulement des types — rouvrirait exactement la
porte que §A11 vient de fermer, pour économiser dix-huit lignes. La duplication
est verrouillée par un test d'égalité des deux ensembles ; c'est le bon échange.

### A21. La frontière d'erreur React appartient au lot 3

Le lot 5 relève, à juste titre, qu'en écartant Sentry il a désigné le vrai besoin
— « une frontière d'erreur React affichant un message en français et un bouton
Recharger » — sans que personne ne l'attribue à un lot. Une responsabilité que
tout le monde mentionne et que personne ne porte est une responsabilité qui
tombe.

**Tranché : elle appartient au lot 3**, dans `src/ui/shell/`, au même titre que
`AppShell`. C'est un composant de présentation, elle utilise le composant
`Notice` existant, et elle n'a besoin d'aucune règle ni d'aucun état.

Portée volontairement minimale, conforme au refus de Sentry : elle enveloppe
l'application, affiche un message en français et un bouton « Recharger », et
**ne remonte rien à personne**. Elle n'essaie pas de sauver le brouillon en
cours : `state/` écrit déjà dans `localStorage` à chaque changement, donc un
rechargement reprend là où on en était. Une tentative de sauvegarde depuis un
état déjà cassé ferait plus de mal que de bien.

### A22. Le cadre d'écran coupe l'impression — bug entre lots, trouvé par le lot 4

`AppShell` (lot 3) est une grille `height: 100dvh; overflow: hidden`, ce qui est
la bonne solution à l'écran et **coupe l'impression à la première page**. Aucun
des deux lots ne pouvait le voir seul : le lot 3 n'imprime pas, le lot 4 ne
possède pas le cadre. C'est le seul défaut de conception croisé de toute la
revue, et il n'aurait été découvert qu'à la première impression réelle.

**Tranché :**

- `AppShell` pose `data-print="frame"` sur sa racine ;
- `ProgressBanner` et `ActionBar` posent `data-print="hide"` ;
- la **première** règle de `print.css` remet le cadre à plat :
  `[data-print="frame"] { display: block; height: auto; overflow: visible; }`.

Les attributs sont ciblés parce que les classes CSS Modules sont hachées au build
et qu'une feuille globale ne peut pas les atteindre. La liste de vérification
manuelle du lot 4 teste ce point **en premier**.

### A23. `MissingChoice` porte une cible, pas un identifiant de créneau

Le lot 4 relève que `{ kind, remaining, slotId }` ne sait pas exprimer un manque
de **champ** — le nom absent, les caractéristiques non réparties — qui ne
correspond à aucun créneau.

**Il a raison, et il retourne correctement l'argument de §A16 contre ma propre
rédaction** : trois mécanismes identiques valent mieux que deux plus une
exception. `MissingChoice` porte donc `target: IssueTarget`, exactement le type
déjà défini pour `Issue` : `{ kind: 'slot', slotId }` ou
`{ kind: 'field', field }`.

### A24. `validateDraft` enveloppe `listMissingChoices`

Le lot 4 signale un doublon réel dans mon arbitrage : `validateDraft` (lots 1 et 2) produit des `Issue` de sévérité `incomplete`, et `listMissingChoices`
(lot 4) calcule la même chose. Deux fonctions, une seule vérité — celle qui
divergera un jour.

**Tranché :** `listMissingChoices` est la source unique. `validateDraft`
construit sa branche `incomplete` en enveloppant son résultat (même `target`,
`severity: 'incomplete'`) et n'écrit elle-même que la branche `invalid`.
Une source, deux vues.

### A25. Bornes à l'entrée du dictionnaire de créneaux

Le lot 4 chiffre honnêtement ce que la forme retenue en §A1 coûte à l'import :
`Record<string, string[]>` a des **clés non bornées**, là où des tableaux par
catégorie l'étaient par construction. C'est le seul point où sa proposition
initiale était plus sûre.

**Le coût est accepté et compensé**, pour une dizaine de lignes dans le
validateur : au plus 64 clés ; clé conforme à
`^(race|class|background):[a-z0-9-]+:[a-z-]+$`, sinon avertissement et clé
ignorée ; au plus 12 valeurs par créneau. Le bénéfice — une invalidation en
cascade sans une ligne par catégorie — reste très supérieur.

Corollaire noté par le lot 4 et retenu : les identifiants de contenu deviennent
un **contrat public**, puisqu'ils apparaissent dans les clés des fichiers
exportés. Renommer `'roublard'` invaliderait les fichiers déjà enregistrés. D'où
la règle : un créneau inconnu à l'import est un **avertissement**, jamais une
erreur, et le joueur est renvoyé à l'écran concerné.

### A26. React 19, pas 18 — amendement de la charte

La charte fixait React 18. Le lot 5 l'a signalé deux fois comme un risque :
React 18 n'a plus bougé depuis 18.3.1 et l'écosystème est passé à 19.

Vérifié à l'installation : `@testing-library/react@16` accepte
`^18.0.0 || ^19.0.0`, l'API `createRoot` est identique, et **aucun plan
n'utilise quoi que ce soit de spécifique à une version**.

**Tranché : React 19.** Le lot 5 avait raison de dire qu'on ne change pas la
pile pendant que quatre lots planifient dessus — mais l'inverse est vrai aussi :
le seul moment où ce choix est gratuit est celui où zéro ligne de produit est
écrite, c'est-à-dire maintenant. Démarrer un projet neuf sur une majeure en
maintenance est une dette qu'on prend les yeux ouverts. La charte est amendée.

### A27. `no-restricted-imports` ne voit pas les imports dynamiques — vérifié, faux

Le lot 5 avait écrit : « ESLint 9 a étendu la règle aux `import()` à littéral de
chaîne ; **à confirmer par un test réel**, pas à supposer. » Il a eu raison de
refuser de le supposer : **la sonde a échoué**. Un `import('../ui/x')` placé
dans `src/domain/` passait le lint sans un mot.

C'est le pire cas possible pour un garde-fou : le trou se trouve exactement là
où quelqu'un irait chercher une échappatoire.

**Corrigé** : une règle `no-restricted-syntax` par couche, avec un sélecteur
`ImportExpression[source.value=/…/]`. Cinq lignes, aucune dépendance. Les
motifs raisonnent sur des **segments de chemin entiers**, pour ne pas attraper
`src/domain/equipment` en croyant y voir la couche `data`.

Neuf sondes couvrent désormais la règle, et elles vérifient les deux sens :
que l'interdit échoue **et** que l'autorisé passe — `ui → data`,
`state → react`, et l'`import()` dynamique de `data/` depuis `state/`, qui est
précisément le levier de découpage prévu au-delà de 150 ko gzip. Un garde-fou
qu'on n'a jamais vu se taire est un garde-fou qu'on finira par contourner.

### A28. Rigueur maximale — le critère n'est pas le nombre de règles

Demande explicite de l'utilisateur : TypeScript et le lint poussés au maximum.
Cela renverse l'arbitrage du lot 5, qui avait retenu un jeu minimal et écarté
les familles typées.

**Le critère retenu n'est pas « le plus de règles possible » mais : est-ce que
cette règle attrape une classe de bugs, ou impose-t-elle un goût ?** Une
configuration maximale qu'on finit par désactiver en bloc est une dette pire
qu'une configuration modeste. Chaque règle écartée l'est nommément, avec sa
raison, dans `eslint.config.js`.

**Activé — familles typées.** `strictTypeChecked` et `stylisticTypeChecked` de
typescript-eslint, qui voient les types et attrapent donc ce que `tsc` ne
signale pas : promesses ignorées, comparaisons impossibles, `unknown` mal
réduit, `any` qui se propage. C'est l'essentiel du gain. S'y ajoutent
`no-unnecessary-condition`, `switch-exhaustiveness-check`, `sonarjs`
(complexité cognitive, branches dupliquées), `regexp`, `unicorn`,
`jsx-a11y` en mode strict — l'accessibilité est une exigence de la charte —
`react-hooks`, `vitest` et `testing-library`.

Le lot 5 avait écarté `recommendedTypeChecked` en craignant un facteur 3 à 5
sur la durée du lint. **Mesuré : `verify` prend 10 s, dont 4 s de lint typé.**
Sa crainte était raisonnable, les chiffres ne la confirment pas à cette
échelle. Le seuil de la charte reste 30 s ; c'est lui qu'on surveille quand le
code grossira, pas le nombre de règles.

**Activé — TypeScript.** Toutes les options de rigueur : `strict`,
`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`,
`noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals`,
`noUnusedParameters`, `allowUnreachableCode: false`, `erasableSyntaxOnly`.

Deux notes. `exactOptionalPropertyTypes` : le lot 5 l'avait écarté en pensant
que le brouillon serait un objet partiellement rempli. La forme finalement
retenue en §A1 n'utilise **pas** de propriétés optionnelles mais `T | null`,
choisi pour la stabilité JSON — l'option est donc gratuite ici. Sa crainte
portait sur une conception qui n'a pas été retenue.
`erasableSyntaxOnly` interdit `enum`, `namespace` et les propriétés de
constructeur : cela sert directement la charte, qui proscrit la
métaprogrammation.

**Écarté — cinq règles, nommément.**

| Écartée | Raison |
|---|---|
| `noPropertyAccessFromIndexSignature` | Vite type les CSS Modules en `Record<string, string>` : la règle imposerait `styles['page']` partout sans attraper un seul bug. Seule option de rigueur TypeScript refusée. |
| `unicorn/name-replacements` | Renommer `dir` en `directory` n'évite aucun bug. |
| `unicorn/prevent-abbreviations` | `props`, `ref`, `e` sont l'idiome React ; les allonger nuit à la lecture. |
| `unicorn/prefer-query-selector` | `getElementById` est plus rapide et plus clair que `querySelector('#x')`. |
| `unicorn/no-null` | Les plans écrivent délibérément `raceId: string \| null` : `null` se sérialise en JSON, `undefined` disparaît. |

`explicit-module-boundary-types` est **portée** plutôt qu'écartée : exigée sur
`domain/` et `state/`, qui sont des contrats entre lots ; muette sur les
composants, dont le type de retour est toujours le même et n'apprend rien.

### A29. Le site ne dépend plus de son adresse

§A18 laissait `base: '/D-DBeyondFranche/'` codé en dur, au prix d'un commentaire
de six lignes expliquant pourquoi la base ne correspondait pas au nom du
produit — et d'un renommage de dépôt qui aurait cassé la production.

**Tranché : `base: './'`, des chemins relatifs.**

Ce n'est possible que grâce au périmètre : la charte exclut le routage, il n'y
a donc qu'une seule page, et des liens relatifs suffisent. Le lot 5 avait
raison de craindre le piège du sous-chemin ; la bonne réponse n'était pas de
figer l'adresse mais de cesser d'en dépendre.

Ce que cela supprime : le commentaire d'avertissement, la note « le dépôt
s'appelle encore… » du README, et toute une classe de pannes — page blanche
après un renommage, après un déplacement d'hébergement, ou en ouvrant `dist/`
depuis un dossier local.

Vérifié en servant le paquet compilé depuis `/un/sous/chemin/quelconque/` :
index, JS et CSS répondent 200.

**Condition de réouverture, écrite d'avance** : le jour où un routeur
apparaîtrait — ce que la charte exclut aujourd'hui — les chemins relatifs
casseraient sur une URL profonde, et il faudrait revenir à une base explicite.

### A30. `jsx-a11y` retiré — incompatibilité irréductible, trouvée par la CI

§A28 activait `eslint-plugin-jsx-a11y` en mode strict. **La première exécution
de la CI a échoué** sur `npm ci`, et la cause est structurelle :

| Greffon | Exige d'ESLint |
|---|---|
| `eslint-plugin-unicorn@74` | **≥ 10.4** |
| `eslint-plugin-jsx-a11y@6.10.2` | **≤ 9** |

Les deux sont **mutuellement exclusifs**. Aucune configuration ne les
réconcilie ; seul un `--legacy-peer-deps` le masque.

**Tranché : on garde `unicorn`, on retire `jsx-a11y`.** Sur ce dépôt, unicorn a
attrapé de vrais défauts — un `sort` mutant, un `reduce` sans valeur initiale
qui aurait levé sur un tableau vide, deux fonctions au-delà du seuil de
complexité. `jsx-a11y`, lui, ne couvre presque rien de ce que la charte demande
en accessibilité : cibles de 44 px, contraste AA, navigation clavier, aucune
icône sans libellé — rien de tout cela n'est analysable statiquement. C'est
exactement l'argument que le lot 5 avait avancé et que §A28 avait écarté ;
l'incompatibilité lui donne raison.

**Compensation, écrite et testée** : trois tests reprennent ce que le greffon
aurait signalé — chaque bouton porte un nom accessible, chaque champ porte une
étiquette, et aucun `div` ou `span` ne porte de gestionnaire de clic. À rouvrir
dès que `jsx-a11y` accepte ESLint 10.

### A31. La leçon : « ça marche chez moi » est entré par un drapeau non consigné

`jsx-a11y` avait été installé avec `--legacy-peer-deps` pour contourner le
conflit de pair. Le drapeau n'a été écrit nulle part : `package-lock.json` a
gardé une résolution que `npm ci` refuse, et l'écart n'est apparu qu'en CI.

C'est précisément ce que le lot 5 voulait empêcher en exigeant que la CI lance
**exactement** ce que lance le développeur.

**Règle ajoutée :** aucune dépendance ne s'installe avec `--legacy-peer-deps`
ni `--force`. Un conflit de pair est une information, pas un obstacle à
contourner : soit on choisit entre les deux greffons, soit on attend. Et la
vérification qui compte n'est pas `npm install` mais **`npm ci` sur un
`node_modules` supprimé** — c'est la seule qui reproduise la CI.

---

## B. Décisions de périmètre (réduction assumée)

### B1. Deux méthodes de caractéristiques, pas trois

Le lot 1 prévoyait répartition de points, tableau standard **et** 4d6 garde-3.

**Tranché : répartition de points + tableau standard. Les jets de dés sortent de
la v1.** Ils coûtent un écran de plus (lancer, relancer, affecter), un état non
dérivable à persister (`rolled`), une frontière d'aléatoire injectée dans le
domaine, et l'action `SET_ROLLED_SCORES` — pour une méthode que la moitié des
tables n'utilise pas. C'est exactement ce que YAGNI vise. Premier candidat à
l'ajout après la v1 ; l'ajout sera purement additif.

Disparaissent donc : `AbilityInput.rolled`, `SET_ROLLED_SCORES`, la frontière
`random` du domaine, la méthode `'dice'`.

### B2. Descriptions de sorts : courtes en v1

Le lot 1 a chiffré honnêtement le vrai coût du projet : ~90 000 caractères de
traduction française à écrire à la main, très loin devant le code. C'est le
risque n° 1 de la livraison.

**Tranché :** la v1 livre pour chaque sort toutes les données mécaniques (niveau,
école, temps d'incantation, portée, composantes, durée, concentration, rituel,
classes) et un **résumé d'effet de 1 à 3 phrases en français**. La prose longue
est un enrichissement ultérieur, purement additif : un champ, aucune structure à
changer. Le champ `description` devient donc `summary: string`, obligatoire.

**Amendement (§A19) : le champ `fullText` n'est pas déclaré.** La rédaction
initiale prévoyait `fullText: string | null`, à `null` pour les 85 sorts. Le
lot 1 a fait remarquer que c'est un champ mort, et que la charte l'interdit noir
sur blanc (« pas de champ inutilisé, pas de `TODO: quand on aura…` »). Il a
raison : on le déclarera le jour où un sort le remplit, ce qui reste une ligne.
Conséquence pour le lot 3 : les cartes de sort n'ont **aucun** dépliant en v1,
et le `<details>` réapparaîtra avec le champ. Conséquence pour le poids : la
charge de données v1 tombe très en dessous du budget, ce qui confirme qu'aucun
découpage n'est nécessaire.

### B3. Historique « personnalisé » — la charte est amendée

Le SRD 5.1 ne contient qu'un seul historique (Acolyte). Un créateur de personnage
avec un seul historique est inutilisable. Le lot 1 a bien posé le problème et
recommandé l'option (b).

**Tranché : option (b) retenue.** On ajoute un historique « Personnalisé » construit
uniquement sur les règles génériques d'historique du SRD (2 compétences au choix,
2 outils ou langues, un paquetage, traits/idéal/lien/défaut saisis librement).
C'est de l'assemblage de règles SRD, pas du contenu inventé. L'interface l'annonce
explicitement. La charte §9 est amendée en ce sens.

### B4. Pas de confirmation avant un changement destructeur

Le lot 2 proposait `describeImpact` + une boîte de confirmation. Le lot 3 n'a
aucun composant de dialogue et refuse (à raison) la feuille glissante et ses
pièges de focus.

**Tranché : `describeImpact` sort de la v1.** Le dispositif du lot 2 est déjà
suffisant : l'avis a posteriori (« tes compétences de roublard ont été remises à
zéro ») plus un retour arrière à un doigt. Ajouter un modal pour éviter une
annulation d'un geste est un mauvais échange.

### B5. Confirmé sans changement

- Impression par `window.print()` + `@media print`, **jsPDF et html2canvas
  refusés** — l'argumentation du lot 4 est solide (PDF vectoriel gratuit contre
  200 Ko et un moteur de mise en page réécrit).
- Fiche en page unique à défilement, onglets rejetés — l'argument « les onglets
  cassent l'impression et la recherche dans la page » est décisif.
- Aide contextuelle par `<details>` natif, feuille glissante rejetée.
- Groupes de choix en `fieldset`/`radio` natifs, aucun `role="radiogroup"` fait main.
- Barre d'actions en **rangée de grille** sur `100dvh`, pas en `position: fixed`.
- Validateur d'import écrit à la main plutôt que zod/valibot.
- Pas de thème sombre en v1, avec `color-scheme: light` déclaré.
- Pas d'annulation/rétablissement, pas de brouillons multiples, pas de routeur.
- Aucun découpage dynamique des données en v1, seuil de déclenchement écrit
  d'avance (150 Ko gzip).

---

## C. Points ouverts, remontés à l'utilisateur

1. **Nom du projet : tranché, voir §A18.** Le produit s'appelle « Aventurine ».
2. **Jets de dés (B1)** et **prose longue des sorts (B2)** : reportés, pas
   abandonnés. À rouvrir quand la v1 tourne.
