# LOT 1 — Domaine & Données

## Objectif

Poser `src/domain/` (types + règles pures) et `src/data/` (contenu SRD 5.1 en
français) pour un personnage de **niveau 1 uniquement**. À la fin du lot :

- on peut décrire n'importe quel personnage SRD de niveau 1 par un objet JSON
  sérialisable (le « brouillon ») ;
- une seule fonction transforme ce brouillon en fiche calculée ;
- une seule fonction dit quelles décisions restent à prendre ;
- ajouter une race, une classe, un historique ou un sort = **ajouter une entrée
  de données**, jamais toucher au domaine ;
- zéro import React, zéro `window`, zéro `localStorage`, zéro `import` de
  `data/` depuis `domain/`.

Aucun composant, aucun reducer, aucune persistance : c'est le LOT 2 et le LOT 3.

---

## Arborescence des fichiers

### `src/domain/` — 15 fichiers, ~1 150 lignes

| Fichier | Contenu | ~lignes |
|---|---|---|
| `caracteristiques.ts` | 6 caractéristiques, `modificateur`, `Caracteristiques` | 60 |
| `competences.ts` | 18 compétences + caractéristique associée | 50 |
| `generation-caracteristiques.ts` | répartition de points, tableau standard, 4d6 garde-3 | 90 |
| `choix.ts` | `Choix` (forme auteur) et `Question` (forme résolue) | 90 |
| `race.ts` | `Race`, `SousRace`, `Trait` | 60 |
| `classe.ts` | `Classe`, `Voie`, `Incantation`, `DefenseSansArmure` | 110 |
| `historique.ts` | `Historique` | 40 |
| `equipement.ts` | `Arme`, `Armure`, `Objet`, `LigneObjet`, `OptionEquipement` | 80 |
| `sort.ts` | `Sort`, `EcoleDeMagie` | 50 |
| `alignement.ts` + `langue.ts` + `outil.ts` | tables simples | 50 |
| `catalogue.ts` | `Catalogue` + `trouverX(catalogue, id)` | 60 |
| `brouillon.ts` | `BrouillonPersonnage`, `brouillonVide()` | 60 |
| `questions.ts` | `questionsOuvertes(catalogue, brouillon)` | 130 |
| `fiche.ts` | `calculerFiche(catalogue, brouillon)` + calculs dérivés | 180 |
| `validation.ts` | `anomalies(catalogue, brouillon)` — jamais bloquant | 80 |

Tests à côté : `caracteristiques.test.ts`, `generation-caracteristiques.test.ts`,
`questions.test.ts`, `fiche.test.ts`, `validation.test.ts` (~10 fichiers).

### `src/data/` — 26 fichiers, ~4 250 lignes

```
src/data/
  attribution.ts            texte de licence SRD (EN verbatim + FR)         ~25 l
  competences.fr.ts         18 entrées                              ~2 Ko
  langues.fr.ts             16 entrées                              ~1 Ko
  alignements.fr.ts         9 entrées                               ~2 Ko
  outils.fr.ts              ~25 entrées                             ~2 Ko
  armes.fr.ts               37 armes SRD                            ~5 Ko
  armures.fr.ts             13 armures + bouclier                   ~2 Ko
  objets.fr.ts              paquetages et matériel divers (~40)     ~3 Ko
  ascendances-draconiques.fr.ts   10 entrées                        ~2 Ko
  styles-de-combat.fr.ts    6 entrées                               ~2 Ko
  races.fr.ts               9 races, 4 sous-races imbriquées        ~18 Ko
  classes/
    index.ts                assemble les 12                         ~20 l
    barbare.ts … magicien.ts   12 fichiers, ~150 l chacun           ~70 Ko
  historiques.fr.ts         acolyte (seul historique du SRD)        ~6 Ko
  sorts.fr.ts               ~85 sorts (25 tours + ~60 de niveau 1)  ~105 Ko
  index.ts                  `export const CATALOGUE: Catalogue`     ~30 l
  catalogue.test.ts         intégrité référentielle + unicité
```

`src/data/index.ts` n'importe de `domain/` que des **types** (`import type`).
C'est la seule direction autorisée : `data → domain`.

---

## Types clés (code TypeScript réel)

### Vocabulaire de règle : unions littérales dérivées de tableaux

Ces ensembles sont fermés par les règles et ne grossiront jamais. On les écrit
une fois, on en dérive le type : pas de cast, pas de métaprogrammation.

```ts
// src/domain/caracteristiques.ts
export const CARACTERISTIQUES = [
  'force', 'dexterite', 'constitution', 'intelligence', 'sagesse', 'charisme',
] as const;

export type CaracteristiqueId = (typeof CARACTERISTIQUES)[number];
export type Caracteristiques = Readonly<Record<CaracteristiqueId, number>>;

export function modificateur(valeur: number): number {
  return Math.floor((valeur - 10) / 2);
}
```

```ts
// src/domain/competences.ts
export const CARACTERISTIQUE_DE_COMPETENCE = {
  acrobaties: 'dexterite',   arcanes: 'intelligence',   athletisme: 'force',
  discretion: 'dexterite',   dressage: 'sagesse',       escamotage: 'dexterite',
  histoire: 'intelligence',  intimidation: 'charisme',  investigation: 'intelligence',
  medecine: 'sagesse',       nature: 'intelligence',    perception: 'sagesse',
  perspicacite: 'sagesse',   persuasion: 'charisme',    religion: 'intelligence',
  representation: 'charisme', supercherie: 'charisme',  survie: 'sagesse',
} as const satisfies Record<string, CaracteristiqueId>;

export type CompetenceId = keyof typeof CARACTERISTIQUE_DE_COMPETENCE;

export const TOUTES_LES_COMPETENCES = Object.keys(
  CARACTERISTIQUE_DE_COMPETENCE,
) as readonly CompetenceId[];
```

Idem pour `EcoleDeMagie` (8), `AlignementId` (9), `CategorieArmure`,
`CategorieArme`, `Taille`, `TypeDegats`.

Les identifiants de **contenu** (`RaceId`, `ClasseId`, `SortId`, `LangueId`,
`OutilId`, `HistoriqueId`, `ObjetId`, `ChoixId`…) sont de simples
`export type RaceId = string`. Voir « Identifiants » plus bas pour la
justification et le filet de sécurité.

### Le point structurant : `Choix` (forme auteur) vs `Question` (forme résolue)

Un « choix à faire par le joueur » existe sous **deux formes** :

- **`Choix`** — ce qu'on écrit dans `src/data/`. Compact, parfois implicite
  (« un tour de magie de la liste du magicien »), jamais dépendant de l'état.
- **`Question`** — ce que le domaine renvoie à l'état et à l'UI. Toujours plate,
  toujours la même forme, options déjà libellées et déjà filtrées.

Cette séparation est la clé du lot : elle permet à `data/` de rester bref, à
l'UI de n'avoir **qu'un seul composant de choix**, et au domaine d'absorber les
cas tordus (options dépendant de ce qui est déjà acquis) sans les faire remonter.

```ts
// src/domain/choix.ts
export type ChoixId = string;   // convention : 'source/sujet' → 'roublard/competences'

export type CategorieChoix =
  | 'competence' | 'langue' | 'outil' | 'equipement'
  | 'caracteristique' | 'sort' | 'expertise'
  | 'ascendance' | 'style-de-combat';

/** Forme commune : « choisis `nombre` valeurs parmi `parmi` ». */
export interface ChoixDe<
  C extends Exclude<CategorieChoix, 'caracteristique' | 'sort' | 'expertise'>,
  O extends string,
> {
  readonly id: ChoixId;
  readonly categorie: C;
  readonly libelle: string;        // « Choisis 2 compétences » — français, ton joueur
  readonly nombre: number;
  readonly parmi: readonly O[];
}

/** Demi-elfe : +1 à deux caractéristiques autres que le Charisme. */
export interface ChoixCaracteristique {
  readonly id: ChoixId;
  readonly categorie: 'caracteristique';
  readonly libelle: string;
  readonly nombre: number;
  readonly bonus: number;                             // +1 dans tout le SRD
  readonly parmi: readonly CaracteristiqueId[];
}

/** La liste des sorts n'est jamais recopiée : on référence une liste de classe. */
export interface ChoixSort {
  readonly id: ChoixId;
  readonly categorie: 'sort';
  readonly libelle: string;
  readonly nombre: number;
  readonly listeDe: ClasseId;                         // 'magicien' pour le haut-elfe
  readonly niveau: 0 | 1;
}

/** Roublard : 2 maîtrises parmi celles qu'il vient d'obtenir. Options calculées. */
export interface ChoixExpertise {
  readonly id: ChoixId;
  readonly categorie: 'expertise';
  readonly libelle: string;
  readonly nombre: number;
  readonly outilsAutorises: readonly OutilId[];       // ['outils-de-voleur']
}

export type Choix =
  | ChoixDe<'competence', CompetenceId>
  | ChoixDe<'langue', LangueId>
  | ChoixDe<'outil', OutilId>
  | ChoixDe<'equipement', OptionEquipementId>
  | ChoixDe<'ascendance', AscendanceId>
  | ChoixDe<'style-de-combat', StyleDeCombatId>
  | ChoixCaracteristique
  | ChoixSort
  | ChoixExpertise;

/** Réponses du joueur. `Record<string, string[]>` : sérialisable tel quel. */
export type Reponses = Readonly<Record<ChoixId, readonly string[]>>;
```

Forme résolue, unique, consommée par `state/` et `ui/` :

```ts
export interface OptionQuestion {
  readonly valeur: string;          // identifiant à stocker dans les réponses
  readonly libelle: string;         // « Acrobaties (Dex) », « une rapière »
  readonly aide: string | null;     // une phrase de vulgarisation, en français
  readonly dejaAcquise: boolean;    // obtenue par la race/l'historique → à désactiver
}

export interface Question {
  readonly id: ChoixId;
  readonly categorie: CategorieChoix;
  readonly source: string;          // « Roublard », « Haut-elfe » — affiché
  readonly libelle: string;
  readonly nombre: number;
  readonly options: readonly OptionQuestion[];
  readonly reponse: readonly string[];
  readonly complete: boolean;
}

export function questionsOuvertes(
  catalogue: Catalogue,
  brouillon: BrouillonPersonnage,
): readonly Question[];
```

Propriétés garanties par `questionsOuvertes` (et testées) :

1. **Ordre stable** : race → sous-race → classe → voie → historique, dans
   l'ordre de déclaration des `choix` dans les données.
2. **Options déjà acquises marquées**, jamais retirées (l'UI les grise et
   explique « déjà obtenue grâce à ton historique »).
3. **Réponses invalides ignorées** : une valeur qui n'est plus dans `parmi`
   (le joueur a changé de classe) n'apparaît pas dans `reponse` et n'est pas
   comptée. Rien n'explose, rien n'est effacé côté brouillon.
4. **Une seule fonction contient le `switch (choix.categorie)`** :
   `optionsDuChoix(catalogue, choix, acquis)`, 9 branches de 3 lignes.

### Le brouillon — frontière exacte domaine / état

Le domaine **ne stocke rien**. `state/` (LOT 2) détient un `BrouillonPersonnage`
et le passe en argument. Tout y est JSON pur : pas de `Map`, pas de `Set`, pas de
`Date`, pas d'instance de classe. `JSON.parse(JSON.stringify(b))` doit rendre un
objet identique — c'est ce qui fait marcher `localStorage` et l'import/export
sans une ligne de code de sérialisation.

```ts
// src/domain/brouillon.ts
export type MethodeCaracteristiques = 'repartition' | 'tableau-standard' | 'jets';

export interface TraitsPersonnels {
  readonly trait: string;
  readonly ideal: string;
  readonly lien: string;
  readonly defaut: string;
}

export interface BrouillonPersonnage {
  readonly nom: string;
  readonly raceId: RaceId | null;
  readonly sousRaceId: SousRaceId | null;
  readonly classeId: ClasseId | null;
  readonly historiqueId: HistoriqueId | null;
  readonly alignementId: AlignementId | null;
  readonly methode: MethodeCaracteristiques;
  /** Valeurs AVANT bonus raciaux. Toujours les 6 clés, 8 par défaut. */
  readonly caracteristiquesBrutes: Caracteristiques;
  /** Les 6 résultats de 4d6 garde-3, conservés pour survivre à un rechargement. */
  readonly jets: readonly number[] | null;
  readonly reponses: Reponses;
  readonly traitsPersonnels: TraitsPersonnels;
}

export function brouillonVide(): BrouillonPersonnage;
```

Ce qui n'est **pas** dans le brouillon parce que c'est **dérivé** : PV max
(au niveau 1 c'est toujours le maximum du dé de vie + mod. de Con, jamais un
jet), classe d'armure, bonus de maîtrise, caractéristiques finales, langues,
maîtrises, équipement obtenu, DD de sauvegarde des sorts. Si une valeur est
calculable, elle n'est pas stockée. Une seule source de vérité.

### Race, classe, historique — tout le mécanique en champs, le reste en texte

```ts
// src/domain/race.ts
export interface Trait { readonly nom: string; readonly description: string; }

export interface Maitrises {
  readonly armures: readonly CategorieArmure[];        // 'legere' | 'intermediaire' | 'lourde' | 'bouclier'
  readonly categoriesArmes: readonly CategorieArme[];  // 'courantes' | 'de-guerre'
  readonly armes: readonly ArmeId[];                   // maîtrises d'armes nommées (nain, elfe…)
  readonly outils: readonly OutilId[];
}

export interface Race {
  readonly id: RaceId;
  readonly nom: string;                                // « Demi-orc »
  readonly resume: string;                             // 2 phrases, vocabulaire de joueur
  readonly bonusCaracteristiques: Partial<Caracteristiques>;
  readonly taille: 'P' | 'M';
  readonly vitesse: number;                            // en mètres : 9 ou 7.5
  readonly visionDansLeNoir: number;                   // en mètres : 0 ou 18
  readonly langues: readonly LangueId[];
  readonly competences: readonly CompetenceId[];
  readonly maitrises: Maitrises;
  readonly resistances: readonly TypeDegats[];
  readonly traits: readonly Trait[];                   // affichés, jamais calculés
  readonly choix: readonly Choix[];
  readonly sousRaces: readonly SousRace[];             // imbriquées : la question « quelle
}                                                      // sous-race » se lit sur la race
```

```ts
// src/domain/classe.ts
export interface DefenseSansArmure {
  readonly base: number;                                    // 10 (barbare, moine), 13 (draconique)
  readonly ajouts: readonly CaracteristiqueId[];            // ['dexterite','constitution']
  readonly bouclierAutorise: boolean;                       // barbare oui, moine non
}

export type ModePreparation = 'connus' | 'prepares' | 'grimoire';

export interface Incantation {
  readonly caracteristique: CaracteristiqueId;
  readonly emplacementsNiveau1: number;                     // 2, 1 (occultiste), 0 (paladin, rôdeur)
  readonly modePreparation: ModePreparation;
  readonly rituels: boolean;
}

/** Sous-classe obtenue au niveau 1. Le SRD n'en propose qu'une par classe
 *  concernée (clerc, ensorceleur, occultiste) : elle s'applique d'office,
 *  ce n'est donc pas un `Choix`. */
export interface Voie {
  readonly id: VoieId;
  readonly nom: string;                                     // « Domaine de la Vie »
  readonly resume: string;
  readonly aptitudes: readonly Trait[];
  readonly maitrises: Maitrises | null;                     // clerc de la Vie : armures lourdes
  readonly sortsToujoursPrepares: readonly SortId[];
  readonly defenseSansArmure: DefenseSansArmure | null;     // ensorceleur draconique : 13 + Dex
  readonly pvBonusParNiveau: number;                        // 1 pour l'ensorceleur draconique
  readonly choix: readonly Choix[];                         // ascendance draconique
}

export interface Classe {
  readonly id: ClasseId;
  readonly nom: string;
  readonly resume: string;
  readonly deDeVie: 6 | 8 | 10 | 12;
  readonly sauvegardes: readonly [CaracteristiqueId, CaracteristiqueId];
  readonly maitrises: Maitrises;
  readonly defenseSansArmure: DefenseSansArmure | null;
  readonly aptitudes: readonly Trait[];
  readonly choix: readonly Choix[];
  readonly optionsEquipement: readonly OptionEquipement[];  // table locale, référencée par id
  readonly equipementFixe: readonly LigneObjet[];
  readonly incantation: Incantation | null;
  readonly voie: Voie | null;
}
```

```ts
// src/domain/sort.ts
export interface Sort {
  readonly id: SortId;
  readonly nom: string;
  readonly niveau: 0 | 1;
  readonly ecole: EcoleDeMagie;
  readonly tempsIncantation: string;   // « 1 action », « 1 action bonus »
  readonly portee: string;             // « 18 mètres », « Personnelle », « Contact »
  readonly composantes: {
    readonly verbale: boolean;
    readonly somatique: boolean;
    readonly materielle: string | null;   // description du composant, sinon null
  };
  readonly duree: string;              // « Instantanée », « Concentration, jusqu'à 1 minute »
  readonly concentration: boolean;
  readonly rituel: boolean;
  readonly description: string;        // traduction française, ~600 à 1 800 caractères
  readonly classes: readonly ClasseId[];   // seule source de vérité des listes de sorts
}
```

Les listes de sorts par classe ne sont **jamais recopiées** dans les classes :
`sortsDeLaClasse(sorts, classeId, niveau)` les dérive de `Sort.classes`. Ajouter
un sort à la liste du barde = modifier une ligne, dans un seul fichier.

### Le catalogue — comment `domain/` accède aux données sans les importer

```ts
// src/domain/catalogue.ts
export interface Catalogue {
  readonly races: readonly Race[];
  readonly classes: readonly Classe[];
  readonly historiques: readonly Historique[];
  readonly alignements: readonly Alignement[];
  readonly langues: readonly Langue[];
  readonly outils: readonly Outil[];
  readonly armes: readonly Arme[];
  readonly armures: readonly Armure[];
  readonly objets: readonly Objet[];
  readonly sorts: readonly Sort[];
  readonly ascendances: readonly AscendanceDraconique[];
  readonly stylesDeCombat: readonly StyleDeCombat[];
}

export function trouverRace(c: Catalogue, id: RaceId | null): Race | null;
export function trouverClasse(c: Catalogue, id: ClasseId | null): Classe | null;
// … un accesseur par table : la table est fixée par la fonction, on ne peut
//   pas chercher un identifiant de classe dans la liste des races.
```

Toute fonction de règle a la signature `f(catalogue, brouillon, …)`. Aucune ne
lit un module global. Les tests fabriquent des mini-catalogues de 2 entrées.

---

## Règles et formules

Toutes dans `src/domain/`, toutes pures, toutes testées.

**Caractéristiques**
- `modificateur(v) = Math.floor((v - 10) / 2)`
- Répartition de points : budget **27**, valeurs 8 à 15, coûts
  `{8:0, 9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9}`.
  `pointsRestants(caracs)` ; `repartitionValide` = restants ≥ 0 et toutes les
  valeurs dans [8, 15].
- Tableau standard : `[15, 14, 13, 12, 10, 8]`, chaque valeur affectée une fois.
- Jets : `lancerCaracteristiques(de: (faces: number) => number): number[]`
  → 6 fois « 4d6, on retire le plus petit ». Le générateur aléatoire est
  **injecté** (frontière réelle autorisée par la charte) : les tests passent un
  dé déterministe, sans `vi.mock`.
- Caractéristiques finales = brutes + bonus de race + bonus de sous-race +
  réponses du `ChoixCaracteristique`. Aucun plafond n'est atteignable au
  niveau 1 (15 + 2 + 1 = 18).

**Valeurs dérivées**
- Bonus de maîtrise : **+2** (constante `BONUS_MAITRISE_NIVEAU_1`, pas de table).
- PV max = `max(deDeVie)` + mod. Con + `voie.pvBonusParNiveau` +
  `sousRace.pvBonusParNiveau` (nain des collines : +1). Aucun jet au niveau 1.
- Initiative = mod. Dex.
- Vitesse = `sousRace.vitesse ?? race.vitesse`, en mètres.
- CA : on calcule **tous les candidats** et on garde le maximum, avec sa source.
  - sans armure : `defenseSansArmure.base + Σ modificateurs des ajouts`
  - avec armure : `armure.base + apportDex(armure, modDex)` où
    `apportDex` vaut `modDex` / `min(modDex, 2)` / `0` selon
    `armure.ajoutDex: 'complet' | 'plafonne-2' | 'aucun'`
  - `+2` si bouclier possédé et maîtrisé, et autorisé par la variante retenue
  - `+ styleDeCombat.bonusCAAvecArmure` (Défense du guerrier : +1, armure requise)
- Sauvegardes : mod. + BM si la caractéristique est dans `classe.sauvegardes`.
- Compétences : mod. de `CARACTERISTIQUE_DE_COMPETENCE[c]` + BM si maîtrisée
  + BM une seconde fois si expertise.
- Attaque : mod. For, ou mod. Dex si l'arme est à distance ou a la propriété
  finesse (dans ce cas, le meilleur des deux), + BM si maîtrisée.
  Dégâts : dé de l'arme + le même modificateur.
- DD de sauvegarde des sorts = `8 + BM + mod(carac d'incantation)`.
  Bonus d'attaque de sort = `BM + mod(carac d'incantation)`.
- Emplacements de niveau 1 = `incantation.emplacementsNiveau1`.
- Nombre de sorts préparables (`prepares` et `grimoire`) =
  `max(1, mod(carac) + 1)`. **La préparation quotidienne n'est pas une décision
  de création** : la fiche affiche le nombre et la liste de classe complète.
  Seuls `connus` (barde 4, ensorceleur 2, occultiste 2) et `grimoire`
  (magicien 6) donnent lieu à un choix à la création.

**Validation** — `anomalies(catalogue, brouillon): Anomalie[]`, où
`Anomalie = { code: string; message: string; etape: string }`. Jamais d'exception,
jamais de blocage : l'assistant reste linéaire et l'écran final récapitule ce qui
manque, conformément à la charte (§4).

---

## Stratégie de données

### Ouvert/Fermé : le mécanisme, concrètement

Un `switch` sur un identifiant de contenu (`case 'barbare':`) est interdit. Il
est remplacé, cas par cas, par un champ de données :

| Règle particulière | Champ qui la porte | Exemple SRD |
|---|---|---|
| CA sans armure | `Classe.defenseSansArmure` | barbare `10 + Dex + Con`, moine `10 + Dex + Sag` |
| CA sans armure (sous-classe) | `Voie.defenseSansArmure` | ensorceleur draconique `13 + Dex` |
| PV supplémentaires par niveau | `pvBonusParNiveau` | nain des collines +1, ensorceleur draconique +1 |
| Vitesse réduite | `Race.vitesse` | nain, halfelin, gnome : 7,50 m |
| Maîtrises supplémentaires | `Voie.maitrises` | clerc de la Vie : armures lourdes |
| Sorts toujours préparés | `Voie.sortsToujoursPrepares` | domaine de la Vie : bénédiction, soin des blessures |
| Compétence offerte | `Race.competences` | elfe : Perception ; demi-orc : Intimidation |
| Bonus de CA conditionnel | `StyleDeCombat.bonusCAAvecArmure` | guerrier, style Défense : +1 |
| Décisions à poser | `Race.choix` / `Classe.choix` / `Historique.choix` | toutes |

**Ce qui reste un `switch` — et pourquoi c'est légitime.** Le domaine branche
sur des *genres de règle*, dont l'ensemble est fermé par les règles du jeu et ne
grossit jamais quand on ajoute du contenu :
`choix.categorie` (9), `armure.ajoutDex` (3), `incantation.modePreparation` (3).
La ligne est nette : **brancher sur un genre de règle, oui ; brancher sur un
identifiant de contenu, jamais.**

Garde-fou testé : `catalogue.test.ts` lit les sources de `src/domain/` et
vérifie qu'aucun identifiant de race, classe, sous-classe, historique ou sort du
catalogue n'y apparaît. Le test échoue à la seconde où quelqu'un écrit
`if (classeId === 'barbare')`.

Ajouter une classe = créer `src/data/classes/nouvelle.ts` et l'ajouter à
`classes/index.ts`. Deux fichiers touchés, zéro dans `domain/`, zéro dans `ui/`.

### Identifiants

- **Fabrication** : minuscules, diacritiques supprimés (NFD), espaces et
  apostrophes remplacés par `-`. `'demi-orc'`, `'haut-elfe'`, `'athletisme'`,
  `'projectile-magique'`, `'cotte-de-mailles'`. Aucun accent dans un
  identifiant — seuls les champs `nom` portent l'orthographe française.
- **Unicité** : garantie par table, pas globalement. `'nain'` est à la fois une
  race et une langue : ce sont deux tables distinctes, aucun conflit.
- **Typage** : unions littérales pour le vocabulaire de règle
  (`CaracteristiqueId`, `CompetenceId`, `AlignementId`, `EcoleDeMagie`,
  `CategorieArmure`) — gratuit, sans cast, exhaustivité vérifiée par le
  compilateur. Simples alias `string` pour le contenu extensible.
  On **renonce aux types de marque** (`string & { __race: never }`) : ils
  imposeraient ~400 casts dans `src/data/` pour un bénéfice que 12 tests
  d'intégrité référentielle couvrent mieux (ils attrapent aussi les fautes de
  frappe dans les listes `parmi`, ce que le marquage ne fait pas).
- `ChoixId` : convention `'source/sujet'` → `'roublard/competences'`,
  `'roublard/expertise'`, `'guerrier/equipement-1'`, `'haut-elfe/tour-de-magie'`,
  `'demi-elfe/caracteristiques'`, `'acolyte/langues'`. Unicité globale testée.

### Volume et chargement sur mobile

Chiffres estimés (à confirmer par `vite build` à la fin du lot) :

| Bloc | Source TS | JS émis | gzip |
|---|---|---|---|
| Sorts (~85 entrées) | ~105 Ko | ~95 Ko | **~26 Ko** |
| Classes (12) | ~70 Ko | ~55 Ko | ~11 Ko |
| Races + tables + historique | ~52 Ko | ~40 Ko | ~8 Ko |
| Domaine (règles) | ~35 Ko | ~22 Ko | ~6 Ko |
| **Total LOT 1** | **~262 Ko** | **~212 Ko** | **~51 Ko** |
| + React 18 + ReactDOM | — | ~140 Ko | ~45 Ko |

**Le chiffre à retenir : ce n'est pas 200 sorts, c'est ~85** (25 tours de magie
et ~60 sorts de niveau 1 dans le SRD). L'ensemble tient sous **~100 Ko gzip**
tout compris, soit ~2 s sur une 3G lente à 400 kbit/s utiles.

**Décision : aucun découpage en LOT 1.** Le poids tient dans un budget de
150 Ko gzip pour le premier écran interactif. Découper maintenant, c'est ajouter
de l'asynchrone à `state/` et des états de chargement à l'UI pour économiser
26 Ko — de la sur-ingénierie au sens de la charte.

**Seuil de déclenchement écrit d'avance** : si à la fin du LOT 3 le premier
écran dépasse **150 Ko gzip**, on ajoute *un seul* `import('../data/sorts.fr')`
dynamique dans `state/`, pas ailleurs. Le gain est réel et mesurable : 6 des 12
classes n'ont aucun sort au niveau 1 (barbare, guerrier, moine, roublard,
paladin, rôdeur), soit ~50 % des personnages qui ne paieraient jamais les 26 Ko.
`src/data/` reste sans logique : le `import()` vit dans `state/`, `domain/`
n'apprend rien.

Ce qui plombe vraiment un budget mobile est déjà exclu : **aucune image, aucune
police téléchargée, aucune bibliothèque d'icônes**. Police système, CSS Modules.

### Droits et attribution

- Le SRD 5.1 est publié par Wizards of the Coast sous **CC BY 4.0**. La licence
  impose une mention exacte, et impose d'indiquer que l'œuvre a été modifiée.
- `src/data/attribution.ts` exporte deux constantes :
  - `ATTRIBUTION_SRD_EN` — le texte exigé par WotC, **verbatim, en anglais**
    (« This work includes material taken from the System Reference Document 5.1
    … licensed under the Creative Commons Attribution 4.0 International
    License… »). On ne le traduit pas : c'est la mention légale.
  - `ATTRIBUTION_SRD_FR` — traduction de courtoisie, affichée à côté, complétée
    par « Traduction française et adaptation réalisées pour ce projet ».
    C'est la mention « indicate if changes were made » exigée par CC BY.
  L'affichage dans l'interface est du LOT 3 ; la constante existe dès le LOT 1
  pour que rien ne soit oublié.
- Chaque fichier de `src/data/` dérivé du SRD porte en tête un commentaire de
  trois lignes renvoyant à `attribution.ts`.
- **La traduction est écrite par nous, depuis l'anglais du SRD.** On ne copie
  aucun mot de la traduction française commerciale de Wizards ni d'aucune
  traduction communautaire : elles sont protégées séparément et ne sont pas
  couvertes par la CC BY du SRD. Vocabulaire français usuel (« jet de
  sauvegarde », « bonus de maîtrise ») : termes techniques non appropriables,
  utilisés librement ; les *phrases* sont rédigées à neuf.
- Aucun contenu hors SRD : pas de sous-classes, races, historiques, dons ou
  sorts absents du SRD 5.1. Aucun logo, aucune illustration, aucune police, aucun
  élément d'habillage de D&D Beyond ni de Wizards.
- Revue de PR : toute entrée de `src/data/` doit pouvoir être pointée à une
  section du SRD 5.1. Si on ne sait pas dire où, l'entrée ne rentre pas.

---

## Tests prévus

Un test = un comportement, nommé en français. ~45 cas pour le lot.

**`caracteristiques.test.ts`**
- `it('donne un modificateur de -1 pour une valeur de 8')`
- `it('donne un modificateur de +4 pour une valeur de 18')`
- `it('donne un modificateur de 0 pour 10 comme pour 11')`

**`generation-caracteristiques.test.ts`**
- `it('coûte 27 points pour 15/15/15/8/8/8')`
- `it('refuse une répartition qui dépasse 27 points')`
- `it('refuse une valeur de 16 en répartition de points')`
- `it('facture 9 points le passage de 13 à 15')`
- `it('propose 15, 14, 13, 12, 10 et 8 dans le tableau standard')`
- `it('retire le plus petit des quatre dés lors d\'un jet 4d6')`
- `it('produit six valeurs comprises entre 3 et 18 avec un dé équitable')`
- `it('rend toujours 18 quand chaque dé sort sur 6')`

**`fiche.test.ts` — bonus raciaux et caractéristiques**
- `it('ajoute +2 en Constitution à un nain')`
- `it('ajoute +1 en Sagesse à un nain des collines, en plus du +2 de Constitution')`
- `it('ajoute +1 partout à un humain')`
- `it('applique le +1 aux deux caractéristiques choisies par un demi-elfe')`
- `it('ne propose pas le Charisme au demi-elfe qui répartit ses +1')`

**`fiche.test.ts` — valeurs dérivées**
- `it('donne un bonus de maîtrise de +2 au niveau 1')`
- `it('donne 12 points de vie à un guerrier avec 14 en Constitution')`
- `it('ajoute 1 point de vie à un nain des collines')`
- `it('ajoute 1 point de vie à un ensorceleur draconique')`
- `it('calcule une CA de 12 pour un magicien sans armure avec 14 en Dextérité')`
- `it('plafonne le bonus de Dextérité à +2 avec une armure intermédiaire')`
- `it('ignore le bonus de Dextérité avec une cotte de mailles')`
- `it('ajoute 2 à la CA quand le personnage porte un bouclier maîtrisé')`
- `it('retient la meilleure CA entre l\'armure portée et la défense sans armure')`
- `it('donne 13 de CA à un ensorceleur draconique sans armure avec 10 en Dextérité')`
- `it('donne une vitesse de 7,50 mètres à un halfelin')`
- `it('ajoute le bonus de maîtrise aux deux sauvegardes de la classe seulement')`
- `it('double le bonus de maîtrise sur une compétence prise en expertise')`
- `it('utilise la Dextérité pour une arme de finesse quand elle est meilleure')`
- `it('calcule un DD de sauvegarde de 13 pour un clerc avec 14 en Sagesse')`
- `it('donne 2 emplacements de sorts de niveau 1 à un magicien')`
- `it('donne 1 seul emplacement à un occultiste')`
- `it('ne donne aucun emplacement à un paladin de niveau 1')`
- `it('rend préparables mod. de Sagesse + 1 sorts pour un clerc, au minimum 1')`
- `it('ne renvoie aucun point de vie tant que la classe n\'est pas choisie')`

**`questions.test.ts`**
- `it('demande 4 compétences à un roublard')`
- `it('demande 2 compétences supplémentaires à un demi-elfe')`
- `it('marque comme déjà acquise une compétence donnée par l\'historique')`
- `it('ne propose à l\'expertise du roublard que les compétences qu\'il maîtrise')`
- `it('propose les tours de magie du magicien à un haut-elfe')`
- `it('propose les six styles de combat à un guerrier et à personne d\'autre')`
- `it('propose les dix ascendances draconiques à un drakéide')`
- `it('ignore une réponse qui n\'est plus dans la liste après changement de classe')`
- `it('marque la question comme complète quand le compte attendu est atteint')`
- `it('ne pose aucune question de sort à un barbare')`

**`validation.test.ts`**
- `it('signale l\'absence de race sans lever d\'exception')`
- `it('signale une répartition de points incomplète')`
- `it('ne signale rien pour un personnage entièrement rempli')`

**`brouillon.test.ts`**
- `it('produit un brouillon identique après passage par JSON')`

**`catalogue.test.ts` (données)**
- `it('n\'a aucun identifiant en double dans une même table')`
- `it('n\'a aucun identifiant de choix en double dans tout le catalogue')`
- `it('ne référence que des compétences, langues, outils et objets existants')`
- `it('ne référence que des sorts existants dans les listes de classe')`
- `it('contient les 12 classes et les 9 races du SRD')`
- `it('n\'écrit aucun identifiant avec un accent ou une majuscule')`
- `it('donne à chaque classe deux jets de sauvegarde et un dé de vie')`
- `it('donne à chaque sort une description française non vide')`
- `it('n\'écrit aucun identifiant de contenu dans src/domain/')`

---

## Hors périmètre

Explicitement **non traité** dans ce lot, et non traité du tout dans le projet
sauf mention contraire :

1. **Multiclassage** — aucun champ, aucune règle.
2. **Niveaux 2 et au-delà** — pas de table de progression, pas de PX, pas de
   montée de niveau, pas d'aptitudes de niveau ≥ 2.
3. **Sous-classes obtenues après le niveau 1** — archétype martial (guerrier 3),
   archétype de roublard (3), cercle druidique (2), tradition monastique (3),
   serment (3), archétype de rôdeur (3), voie primitive (3), collège de barde (3),
   tradition arcanique (2). Seules les trois voies de niveau 1 du SRD sont
   modélisées (Domaine de la Vie, Lignage draconique, Le Fiélon).
4. **Dons (feats)** et variante humaine.
5. **Sorts de niveau 2 et plus**, et magie de pacte au-delà du niveau 1.
6. **Préparation quotidienne des sorts** — c'est une décision de jeu, pas de
   création ; la fiche affiche le nombre préparable et la liste de classe.
7. **Homebrew** — aucun mécanisme d'ajout de contenu par l'utilisateur.
8. **Combat, suivi en jeu** — PV courants, repos, conditions, initiative jouée,
   inspiration, points d'héroïsme.
9. **Objets magiques**, achat d'équipement, or de départ alternatif
   (on prend le paquetage de classe), encombrement, pièces au détail.
10. **Familiers, compagnons animaux, invocations** — *Trouver un familier* reste
    un sort affichable, sans fiche de créature.
11. **Monstres, PNJ, compendium, règles du MJ.**
12. **Toute autre langue que le français**, toute autre source que le SRD 5.1.
13. **Images, portraits, jetons.**

---

## Risques et décisions ouvertes

**1. Le SRD 5.1 ne contient qu'un seul historique : l'Acolyte.** C'est le risque
principal du lot. Un créateur de personnage avec un seul historique est pauvre,
mais la charte dit « Aucun contenu hors SRD » (§9).
*Recommandation :* livrer l'Acolyte seul en LOT 1, et **arbitrer** entre trois
options avant le LOT 3 : (a) rester à un historique ; (b) ajouter un historique
générique « à composer » construit uniquement avec les règles génériques
d'historique du SRD (2 compétences, 2 outils ou langues, 15 po, traits saisis
librement) — techniquement dans le SRD, mais c'est nous qui l'assemblons ;
(c) écrire 5 à 6 historiques originaux, ce qui sort du SRD et demande de modifier
la charte. **Je recommande (b)**, avec une mention claire dans l'interface.

**2. Nom du projet.** « D&D Beyond Franché » évoque directement D&D Beyond,
service de Wizards of the Coast. La CC BY couvre le contenu du SRD, pas les
marques. Le nom du dépôt n'engage pas grand-chose, mais un nom public identique
est un risque de marque réel. À arbitrer avant toute publication.

**3. Abandon des types de marque pour les identifiants de contenu.** Choix assumé
(ergonomie contre 400 casts), compensé par les tests d'intégrité référentielle.
Si l'équipe préfère la sécurité au compilateur, la bascule coûte une demi-journée
et se fait sans toucher aux règles.

**4. Unités.** Décision : **mètres** partout (9 m, 7,50 m, 18 m de vision dans le
noir, 1,50 m par case), stockés en nombre décimal. C'est l'usage français. Risque
mineur : les tables anglophones que consulteront certains joueurs sont en pieds.
Alternative rejetée : stocker en pieds et convertir à l'affichage (une conversion
de plus, aucun gain).

**5. Ordre des questions et changement rétroactif.** Si le joueur change de
classe après avoir choisi ses compétences, ses réponses devenues invalides sont
ignorées mais **conservées** dans le brouillon — un retour en arrière les
restaure. C'est volontaire (charte §4 : « progression linéaire, sans blocage »),
mais cela signifie que `brouillon.reponses` peut contenir des entrées mortes.
Le seul nettoyage prévu est à l'export JSON. À confirmer au LOT 2.

**6. Volume de traduction.** ~85 sorts à traduire, soit environ 90 000 caractères
de texte français rédigé à la main, plus les traits raciaux et les aptitudes de
classe : c'est le poste de travail le plus lourd du lot, très loin devant le code.
Prévoir de le découper en commits par groupes de 10 sorts, chacun laissant
`npm run verify` vert. Risque : traduction bâclée ou trop proche d'une traduction
existante. Garde-fou : relecture croisée obligatoire sur la description de chaque
sort.

**7. Le style de combat « Défense » (+1 CA si armure portée).** La CA dépend donc
de l'équipement effectivement porté, que le domaine déduit de l'équipement de
départ choisi. Si le joueur choisit une option sans armure, la CA change. C'est
correct au regard des règles, mais surprenant à l'écran : à expliquer en LOT 3
(« +1 dès que tu portes une armure »).
