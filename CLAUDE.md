# CLAUDE.md · Aventurine

**Aventurine** est un créateur de personnage D&D 5e, **entièrement en français**. Site web
statique, sans backend, **pensé pour le téléphone d'abord**.

> Ce fichier est la source de vérité pour tout agent (humain ou IA) qui
> travaille sur ce dépôt. Lis-le en entier avant d'écrire une ligne de code.

---

## 1. Périmètre

**Dans le périmètre :** **plusieurs personnages** rangés sur l'appareil, avec
création **du niveau 1 au niveau 20**
pas-à-pas (assistant), fiche consultable, sauvegarde locale, import/export
JSON, impression. Caractéristiques par **répartition de points ou tableau
standard**. Le niveau pilote le bonus de maîtrise, les points de vie, les dés
de vie, les emplacements de sorts et les paliers d'amélioration, un choix
entre monter ses caractéristiques et prendre un don.

**Hors périmètre (YAGNI, ne pas anticiper) :** comptes utilisateurs, backend,
base de données, multijoueur, gestion de campagne, compendium complet,
boutique, multiclassage, homebrew, mobile natif, thème sombre,
annulation/rétablissement, routage.

**Reporté, pas abandonné** (à rouvrir quand la v1 tourne) : jets de dés 4d6
garde-3, prose longue des sorts.

Si une fonctionnalité n'est pas listée « dans le périmètre », **elle ne
s'écrit pas**. Pas de « hook d'extension au cas où », pas d'abstraction
spéculative, pas de couche de plugins.

---

## 2. Stack

| Sujet       | Choix                           | Raison                             |
| ----------- | ------------------------------- | ---------------------------------- |
| Build       | Vite                            | rapide, zéro config                |
| Langage     | TypeScript `strict`             | erreurs à la compilation           |
| UI          | React 18 + fonctions/hooks      | standard, bien connu               |
| Style       | CSS Modules + variables CSS     | pas de runtime, pas de dépendance  |
| Cible       | mobile d'abord, 360 px de large | usage réel : au téléphone, à table |
| État        | React Context + `useReducer`    | suffisant, pas de Redux/Zustand    |
| Tests       | Vitest + Testing Library        | même moteur que Vite               |
| Routage     | aucun (assistant à étapes)      | YAGNI                              |
| Persistance | `localStorage`                  | pas de backend                     |

**Aucune nouvelle dépendance sans justification écrite dans la PR.** Une
dépendance = du poids, des failles, une mise à jour. Si 30 lignes suffisent,
on écrit les 30 lignes.

**Jamais `--legacy-peer-deps` ni `--force`.** Un conflit de pair est une
information : soit on tranche entre les deux paquets, soit on attend. Le
contourner déplace la panne dans la CI, où elle coûte plus cher. La
vérification qui compte est `npm ci` sur un `node_modules` supprimé.

---

## 3. Principes non négociables

### KISS : la solution la plus simple qui marche

- Une fonction fait une chose et tient à l'écran (< 40 lignes).
- Pas de généricité tant qu'il n'y a pas **trois** cas réels.
- Pas de métaprogrammation, pas de `any`, pas de types conditionnels
  acrobatiques.
- Un nom clair vaut mieux qu'un commentaire.

### YAGNI : on n'écrit que ce qui sert aujourd'hui

- Pas de paramètre « pour plus tard », pas de champ inutilisé, pas de
  `TODO: quand on aura…`.
- Pas d'interface à une seule implémentation, sauf frontière réelle
  (persistance, aléatoire, horloge).
- Supprimer du code mort est une amélioration, pas une perte.

### XP : boucles courtes et retours rapides

- **Test d'abord** sur toute la logique métier (règles, calculs, validation).
- Petits commits, chacun laissant l'appli verte.
- Refactoring continu : on améliore le code qu'on traverse, sans changer son
  comportement.
- Simplicité avant élégance ; on livre une tranche verticale utilisable, puis
  on l'étoffe.

### SOLID, appliqué avec mesure

- **S** : un module = une raison de changer. Les règles D&D ne connaissent pas
  React ; les composants ne calculent pas de règles.
- **O** : les données ouvrent l'extension. Ajouter une race = ajouter une
  entrée de données, pas un `switch`.
- **L** : les types se substituent sans surprise ; pas de sous-type qui lève
  « non supporté ».
- **I** : props et interfaces minces. Un composant reçoit ce qu'il affiche,
  rien de plus.
- **D** : le domaine ne dépend de rien. L'UI et le stockage dépendent du
  domaine, jamais l'inverse.

> SOLID ne justifie **jamais** une usine à gaz. En conflit, **KISS gagne**.

---

## 4. Mobile-first et design

Le téléphone n'est pas une adaptation : **c'est la cible principale**. Le
bureau est l'élargissement du mobile, jamais l'inverse.

### Règles de mise en page

- On écrit le CSS pour **360 px de large**, puis on élargit avec
  `@media (min-width: …)`. Aucune `max-width` en media query.
- **Une colonne** sur téléphone. Pas de tableau à défilement horizontal :
  une liste de cartes empilées.
- Zones tactiles **44 × 44 px minimum**, espacées d'au moins 8 px.
- Les actions principales (Suivant / Précédent) sont **en bas de l'écran**,
  atteignables au pouce, toujours visibles.
- Texte : 16 px minimum pour les champs (sinon iOS zoome tout seul).
- Rien d'essentiel au survol : le doigt ne survole pas.
- Pas de défilement horizontal de la page. Jamais.

### Design simple et compréhensible

- **Une décision par écran.** Un choix à faire, énoncé en titre clair.
- Vocabulaire de joueur, pas de jargon technique : « Ta race », pas
  « Sélection de l'espèce ». Tutoiement, ton chaleureux.
- Chaque terme de règle a une explication courte en français, sur place.
- Toujours visible : où j'en suis (étape n sur N), ce que ça change sur ma
  fiche, comment revenir en arrière.
- Progression **linéaire**, sans blocage : on peut avancer avec des choix
  incomplets, l'écran final récapitule ce qui manque.
- Palette sobre, forte lisibilité, 2 couleurs d'accent maximum. Pas
  d'animation décorative, pas de parallaxe, pas de dégradé gratuit.
- Aucune icône seule sans libellé.

> Test d'acceptation d'un écran : quelqu'un qui n'a **jamais joué à D&D**
> comprend ce qu'on lui demande, sur un téléphone, sans faire défiler pour
> trouver le bouton. Si ce n'est pas le cas, l'écran est à refaire.

---

## 5. Architecture

```
src/
  domain/      règles et types D&D, TypeScript pur, ZÉRO import React
  data/        contenu SRD 5.1 en français (races, classes, historiques…)
  state/       reducer de l'assistant + persistance
  ui/          composants React (présentation)
  App.tsx
```

**Règle de dépendance (vérifiée par le lint, jamais enfreinte) :**

```
ui  →  state  →  domain
ui  →  data                (lecture de contenu uniquement)
data  →  domain            (types uniquement)
domain  →  rien
```

- `domain/` n'importe **rien** : ni `ui/`, ni `state/`, ni `data/`, ni React.
  Pas même un `import type` depuis React.
- `data/` ne contient que des données typées par `domain/`, aucune logique.
- `ui/` peut lire du contenu dans `data/` (libellés, glossaire), jamais une
  règle. Faire transiter du texte par un faux hook pour « respecter la flèche »
  est un contournement, pas une conformité.
- Un calcul de règle dans un composant est un bug de conception.
- Aucun fichier baril à la racine de `src/` ni d'une couche : c'est le seul
  chemin par lequel une couche peut en atteindre une autre sans que le lint le
  voie. Un module d'agrégation _à l'intérieur_ d'une couche est autorisé.

---

## 6. Conventions

- **Français partout dans l'interface** : libellés, messages, erreurs.
- **Anglais dans le code, sans exception** : variables, fonctions, types, hooks,
  variables CSS, noms de fichiers et de dossiers, messages de commit.
  `abilityModifier`, `useRaceChoice`, `--color-text`.
  Seule exception : les identifiants de contenu D&D restent en français
  (`'demi-orc'`, `'roublard'`) : ce sont des données, pas du code.
- **Le domaine ne rédige jamais de phrase.** Une raison structurée
  (`{ kind: 'not-enough-points', required: 3, remaining: 2 }`) remonte du domaine ;
  la phrase française se compose dans `ui/format/`. La prose de contenu (noms,
  descriptions) vit dans `data/`, en français.
- Nommage : `PascalCase` composants et types, `camelCase` le reste,
  `SCREAMING_SNAKE` constantes.
- Fichiers : un composant par fichier, nom du fichier = nom du composant.
- Pas de `export default` sauf composants React.
- Pas de commentaire qui paraphrase le code ; commenter le _pourquoi_.

---

## 7. Tests

- Toute règle de `domain/` a un test. Pas d'exception.
- Tests de composants : comportement visible (rôles, libellés), pas de détail
  d'implémentation, pas de snapshot.
- Un test = un comportement, nommé en français :
  `it('ajoute +2 en Force à un nain des collines')`.
- Un bug corrigé commence par un test qui échoue.

---

## 8. Accessibilité et qualité

- HTML sémantique, navigation clavier complète, `aria-*` là où c'est utile.
- Testé au doigt sur un écran de 360 px avant d'être considéré comme fini.
- Contraste AA minimum ; l'information ne passe jamais par la couleur seule.
- `npm run verify` (types + lint + tests) doit passer avant tout commit.

---

## 9. Sources et droits

Contenu dérivé du **SRD 5.1**, publié par Wizards of the Coast sous licence
**CC BY 4.0**, traduit en français pour ce projet, traduction écrite à neuf
depuis l'anglais, jamais reprise d'une traduction commerciale ou communautaire,
qui sont protégées séparément.

Le produit s'appelle **Aventurine** : aucun nom de marque tierce dans le nom du
produit. « D&D 5e » n'est employé que pour **décrire** la compatibilité.
Attribution SRD obligatoire dans l'interface, et mention **« non affilié à
Wizards of the Coast »**. Aucun logo, illustration, police ou élément
d'habillage n'est copié.

Aucun contenu hors SRD, à **trois** exceptions près, assumées et signalées dans
l'interface.

1. **Historiques.** Le SRD 5.1 n'en publie qu'un seul, l'Acolyte, ce qui rend
   un créateur de personnage inutilisable. Les autres, Soldat, Criminel,
   Ermite, Noble, appartiennent au *Player's Handbook* et ne sont pas
   ouverts : **on ne les recopie pas**. On écrit à la place un jeu
   d'historiques **originaux**, montés sur les règles génériques d'historique
   du SRD : deux compétences, deux outils ou langues, un équipement de départ,
   une aptitude et des amorces de personnalité. Les noms sont des métiers
   ordinaires, la prose est écrite pour ce projet, et aucune aptitude ne
   reprend celles du PHB. Tout ce qui n'est pas l'Acolyte porte
   `assembledFromGenericRules: true`, et l'écran de choix le dit au joueur.
   Trois tests d'intégrité vérifient que chaque entrée respecte la forme
   générique du SRD.

2. **Dons.** Le SRD 5.1 n'en publie qu'un, le Lutteur, et présente les dons
   comme une règle optionnelle. Les autres appartiennent au *Player's
   Handbook* : **on ne les recopie pas**. `data/feats.ts` reprend le Lutteur
   tel quel (`fromSrd: true`) et ajoute des dons **originaux**, écrits ici,
   sur la même forme courte : un titre, une phrase, trois repères, une règle.
   Aucun ne reprend un don du PHB.

3. **Origines personnalisées** : le joueur place lui-même les bonus de
   caractéristique de son peuple (+2 et +1) au lieu de les recevoir imposés.
   Le SRD 5.1 les fixe par race ; la règle optionnelle qui les libère est
   postérieure, et les révisions de 2024 en ont fait le comportement par
   défaut. C'est la pratique de la quasi-totalité des tables, et une
   **mécanique**, pas du texte : rien n'est recopié, les libellés sont écrits
   pour ce projet. Concrètement, `abilityBonuses` reste vide et chaque entrée
   déclare un créneau `ability` par valeur à placer, sauf l'humain, dont les
   six +1 ne laissent rien à choisir. Le registre des caractéristiques du
   domaine interdit d'empiler deux bonus sur un même score.

Règle de revue : toute entrée de `data/` doit pouvoir être pointée à une
section du SRD 5.1. Si on ne sait pas dire où, l'entrée ne rentre pas.

---

## 10. Revue : questions à se poser avant de proposer du code

1. Puis-je supprimer quelque chose ? (KISS)
2. Est-ce que ça sert **maintenant** ? (YAGNI)
3. La règle de dépendance est-elle respectée ? (SOLID)
4. Est-ce testé ? (XP)
5. L'interface est-elle en français, accessible et utilisable au pouce ?
6. Est-ce compréhensible par quelqu'un qui découvre D&D ?

Une réponse « non » se corrige avant de proposer, pas après.

---

## 11. Arbitrage des plans

`docs/plans/00-arbitrage.md` tranche les conflits entre les cinq lots et fait
autorité sur les plans individuels. Le lire avant d'implémenter.
