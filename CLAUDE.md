# CLAUDE.md — D&D Beyond Franché

Créateur de personnage D&D 5e, **entièrement en français**. Site web
statique, sans backend, **pensé pour le téléphone d'abord**.

> Ce fichier est la source de vérité pour tout agent (humain ou IA) qui
> travaille sur ce dépôt. Lis-le en entier avant d'écrire une ligne de code.

---

## 1. Périmètre

**Dans le périmètre :** création de personnage pas-à-pas (assistant), fiche de
personnage consultable, sauvegarde locale, import/export JSON, impression.

**Hors périmètre (YAGNI — ne pas anticiper) :** comptes utilisateurs, backend,
base de données, multijoueur, gestion de campagne, compendium complet,
boutique, montée de niveau au-delà du niveau 1, homebrew, mobile natif.

Si une fonctionnalité n'est pas listée « dans le périmètre », **elle ne
s'écrit pas**. Pas de « hook d'extension au cas où », pas d'abstraction
spéculative, pas de couche de plugins.

---

## 2. Stack

| Sujet | Choix | Raison |
|---|---|---|
| Build | Vite | rapide, zéro config |
| Langage | TypeScript `strict` | erreurs à la compilation |
| UI | React 18 + fonctions/hooks | standard, bien connu |
| Style | CSS Modules + variables CSS | pas de runtime, pas de dépendance |
| Cible | mobile d'abord, 360 px de large | usage réel : au téléphone, à table |
| État | React Context + `useReducer` | suffisant, pas de Redux/Zustand |
| Tests | Vitest + Testing Library | même moteur que Vite |
| Routage | aucun (assistant à étapes) | YAGNI |
| Persistance | `localStorage` | pas de backend |

**Aucune nouvelle dépendance sans justification écrite dans la PR.** Une
dépendance = du poids, des failles, une mise à jour. Si 30 lignes suffisent,
on écrit les 30 lignes.

---

## 3. Principes non négociables

### KISS — la solution la plus simple qui marche
- Une fonction fait une chose et tient à l'écran (< 40 lignes).
- Pas de généricité tant qu'il n'y a pas **trois** cas réels.
- Pas de métaprogrammation, pas de `any`, pas de types conditionnels
  acrobatiques.
- Un nom clair vaut mieux qu'un commentaire.

### YAGNI — on n'écrit que ce qui sert aujourd'hui
- Pas de paramètre « pour plus tard », pas de champ inutilisé, pas de
  `TODO: quand on aura…`.
- Pas d'interface à une seule implémentation, sauf frontière réelle
  (persistance, aléatoire, horloge).
- Supprimer du code mort est une amélioration, pas une perte.

### XP — boucles courtes et retours rapides
- **Test d'abord** sur toute la logique métier (règles, calculs, validation).
- Petits commits, chacun laissant l'appli verte.
- Refactoring continu : on améliore le code qu'on traverse, sans changer son
  comportement.
- Simplicité avant élégance ; on livre une tranche verticale utilisable, puis
  on l'étoffe.

### SOLID — appliqué avec mesure
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
  domain/      règles et types D&D — TypeScript pur, ZÉRO import React
  data/        contenu SRD 5.1 en français (races, classes, historiques…)
  state/       reducer de l'assistant + persistance
  ui/          composants React (présentation)
  App.tsx
```

**Règle de dépendance (à sens unique, jamais enfreinte) :**

```
ui  →  state  →  domain  ←  data
```

- `domain/` n'importe **rien** de `ui/`, `state/` ni de React.
- `data/` ne contient que des données typées par `domain/`, aucune logique.
- Un calcul de règle dans un composant est un bug de conception.

---

## 6. Conventions

- **Français partout dans l'interface** : libellés, messages, erreurs.
- **Anglais dans le code** : noms de variables, fonctions, types, commits.
  Exception : les identifiants de contenu D&D restent en français
  (`'demi-orc'`, `'roublard'`).
- Nommage : `PascalCase` composants et types, `camelCase` le reste,
  `SCREAMING_SNAKE` constantes.
- Fichiers : un composant par fichier, nom du fichier = nom du composant.
- Pas de `export default` sauf composants React.
- Pas de commentaire qui paraphrase le code ; commenter le *pourquoi*.

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
**CC BY 4.0**, traduit en français pour ce projet. Attribution obligatoire
dans l'interface. Aucun contenu hors SRD. Projet non affilié à Wizards of the
Coast ni à D&D Beyond ; aucun élément de marque ou visuel n'est copié.

---

## 10. Revue — questions à se poser avant de proposer du code

1. Puis-je supprimer quelque chose ? (KISS)
2. Est-ce que ça sert **maintenant** ? (YAGNI)
3. La règle de dépendance est-elle respectée ? (SOLID)
4. Est-ce testé ? (XP)
5. L'interface est-elle en français, accessible et utilisable au pouce ?
6. Est-ce compréhensible par quelqu'un qui découvre D&D ?

Une réponse « non » se corrige avant de proposer, pas après.
