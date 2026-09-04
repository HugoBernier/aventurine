# 06 — Créateur de contenu

> Note de réflexion, pas un plan d'exécution. Rien n'est écrit tant que les
> décisions du §12 ne sont pas tranchées.

Un écran où l'on fabrique ses races, ses classes et ses sorts. Il produit un
fichier JSON qu'on garde sur son ordinateur, qu'on rouvre pour modifier, et
qu'on importe dans l'assistant pour jouer avec.

Trois usages, dans cet ordre d'importance :

1. écrire un contenu qui n'est pas dans le SRD ;
2. le corriger six mois plus tard sans repartir de zéro ;
3. le donner à quelqu'un d'autre.

---

## 1. Le point de départ : ajouter du contenu est déjà facile

Mesuré sur le dépôt tel qu'il est aujourd'hui, pas à vue de nez :

- **Une race entière tient en 24 lignes** et compile du premier coup contre les
  types du domaine. Rien d'autre à toucher que le tableau qui la contient.
- **Aucun identifiant de contenu n'est écrit en dur hors de `data/`** : la
  recherche de `'nain'`, `'barde'`, `'magicien'` et consorts dans `domain/` et
  `ui/` ne rend rien. Le « O » de SOLID tient réellement.
- **Le catalogue est injecté, jamais importé par le domaine.** Toutes les
  fonctions prennent `catalogue` en paramètre. Fabriquer un catalogue enrichi
  et le passer au fournisseur est donc une ligne, pas une refonte.
- **Un identifiant inconnu ne casse rien** : la fiche d'un personnage dont la
  classe a disparu rend `maxHitPoints: null` et zéro aptitude, sans lever ;
  `pruneChoices` retire les réponses des créneaux fermés, avec un avis.
- Une classe pèse de 137 à 215 lignes, tout compris : aptitudes par niveau,
  sous-classes, équipement de départ, choix.

**Conclusion : la difficulté n'est pas dans le modèle de données.** Elle est
dans les trois choses qu'un fichier apporte et qu'un module TypeScript n'a
pas : il n'est **pas de confiance**, il a une **identité** qui peut entrer en
collision, et il a une **vie** — des versions, des mises à jour, des retraits.

---

## 2. Le fichier

Un pack, un fichier. Lisible, indenté, modifiable à la main par qui veut.

```json
{
  "aventurine": 1,
  "pack": {
    "id": "maison",
    "name": "Mes ajouts",
    "version": 3,
    "updatedAt": "2026-09-04T10:12:00.000Z"
  },
  "races": [],
  "classes": [],
  "spells": []
}
```

### L'identifiant du pack est un préfixe, et il est obligatoire

Tout identifiant défini par le pack commence par `maison-` :
`maison-artificier`, `maison-flechette-magique`. La validation le vérifie, elle
ne le fabrique pas : ce qui est écrit dans le fichier est ce qui est utilisé.

C'est ce qui empêche deux packs de se marcher dessus, et un pack d'écraser le
SRD. Ce n'est pas cosmétique : l'identifiant de créneau a la forme
`class:artificier:skills`, il **porte** l'identifiant du parent. Deux
« artificier » différents, et les réponses d'un personnage basculent sur le
mauvais contenu.

Le séparateur est un tiret et pas deux points, parce que le motif d'un créneau
est `^(?:race|class|background):[a-z0-9-]+:[a-z0-9-]+$` : un deux-points dans
l'identifiant casserait l'analyse. Même charset que le reste du contenu,
minuscules et tirets, ce qu'un test vérifie déjà.

### Les références sortent du pack, les définitions non

Une classe maison peut référencer la liste de sorts du magicien
(`listFrom: 'magicien'`), l'objet `cotte-de-mailles`, la compétence
`discretion`. Elle ne peut pas **définir** un identifiant qu'elle ne possède
pas. Une règle, deux lignes de validation : toute clé définie commence par le
préfixe du pack ; toute référence pointe soit le SRD, soit le même pack.

---

## 3. Les versions — la question posée

Il en faut **deux**, et elles ne servent pas à la même chose.

| | Ce que c'est | Ce que ça permet |
| --- | --- | --- |
| `aventurine: 1` | La version du **format** | Refuser proprement un fichier d'une version qu'on ne sait pas lire, plus tard migrer |
| `pack.version` | La version du **contenu**, entier monté à chaque export | Savoir quel fichier est le plus récent, et le dire : « tu importes la v3, la v5 est déjà installée » |

`updatedAt` est un confort d'affichage, pas une clé de comparaison : l'horloge
d'un téléphone se règle à la main.

**Ce dont un personnage se souvient.** Le pack dont il dépend se **déduit** de
ses identifiants : `maison-artificier` dit « pack maison ». C'est le préfixe du
§2 qui offre ça, et c'est pour cette raison qu'aucune clé n'est à stocker. En
revanche le **nom lisible** et la **version** ne se déduisent de rien une fois le
pack parti : ils sont écrits dans le fichier du personnage comme un simple
repère d'affichage (« construit avec Mes ajouts v3 »), jamais comme une clé de
recherche ni comme une condition. Un repère qui vieillit n'induit personne en
erreur ; une clé qui vieillit, si.

---

## 4. Ce qu'on peut créer : exactement ce que le SRD est

Le modèle ne calcule presque rien à partir des aptitudes : leur texte est de la
prose, affichée telle quelle. Ce qui agit sur la fiche, ce sont des **crochets
déclaratifs**, et ils sont dénombrables :

- **Race** : bonus de caractéristique, taille, vitesse, vision dans le noir,
  langues, compétences, maîtrises, résistances, aptitudes, sous-races, et les
  choix ouverts au joueur (aujourd'hui : caractéristique, ascendance, tour de
  magie, langue, compétence, outil).
- **Classe** : dé de vie, sauvegardes, maîtrises, aptitudes par niveau avec
  leur table (`steps`), sous-classes, magie (caractéristique, rythme, mode de
  préparation, rituel), défense sans armure, points de vie de sous-classe,
  équipement de départ, paliers d'amélioration, et les choix (compétence,
  équipement, sous-classe, sorts, tours de magie, style de combat, expertise).
- **Sort** : niveau, école, temps d'incantation, portée, composantes, durée,
  concentration, rituel, résumé, classes qui y ont droit.

**La barre à tenir, et le test d'acceptation qui va avec** : le créateur doit
pouvoir reproduire une classe du SRD **champ pour champ**. Un test fait passer
les douze classes par le format du pack et compare le résultat à l'original :
si le Guerrier ne survit pas à l'aller-retour, il manque un crochet.

Ce qu'on ne pourra pas faire : une aptitude qui **calcule** quelque chose que le
domaine ne sait pas déjà calculer. « À chaque coup critique, récupère 1d6 » sera
du texte, comme « Second souffle » l'est aujourd'hui. C'est la même limite que
pour le contenu SRD : elle est donc tenable, et il faut le dire clairement dans
le créateur plutôt que de le laisser découvrir.

---

## 5. Où vit le créateur

La charte dit « routage : aucun ». Un `/creator` est une route, donc un routeur,
donc une dépendance ou un bricolage maison, **plus** une configuration de
serveur pour que le rechargement d'une sous-page ne rende pas un 404 sur GitHub
Pages.

L'application a déjà trois vues dans son état — assistant, fiche, bibliothèque —
sauvegardées depuis hier. **Une quatrième vue coûte une ligne et zéro
dépendance.** Si l'adresse partageable devient un besoin réel, `location.hash`
(`#createur`) est dix lignes et reste sans routeur. À rouvrir seulement à ce
moment-là.

---

## 6. Une seule validation, écrite une fois

Le formulaire du créateur et l'import d'un fichier vérifient **la même chose**.
Écrire deux vérifications, c'est garantir qu'elles divergeront.

Donc : une fonction par entité dans `domain/`, pure, qui prend `unknown` et rend
soit l'entité typée, soit une liste de raisons **structurées** — le français se
compose dans `ui/format/`, comme partout ailleurs.

Ordre de grandeur honnête : `parseDraft` fait 146 lignes pour un brouillon plat
et borné. Races, classes, sorts et historiques, avec leurs douze genres de
choix, c'est plutôt **500 à 700 lignes plus les tests**. Une dépendance de
schéma (zod, ~14 kio compressés) diviserait ce chiffre, au prix d'une
justification écrite en PR et d'un budget de 150 kio déjà bien entamé. Mon avis :
à la main, parce que ces fonctions servent deux fois et qu'elles sont le seul
endroit où le contenu maison entre dans l'application.

**L'incomplet est permis dans le créateur, refusé à l'import.** C'est déjà la
philosophie de l'assistant : on avance avec des trous, un écran récapitule ce
qui manque. Le fichier d'un pack inachevé se sauvegarde donc, mais l'assistant
ne l'accepte que valide.

---

## 7. Rien ne se détruit à cause d'un contenu absent

C'est **la** contrainte du lot, et elle prime sur le reste. Un pack peut
disparaître pour dix raisons qui n'ont rien à voir avec une intention du
joueur : quota du navigateur, nettoyage des données du site, un personnage
importé sur un autre téléphone, un mode privé. Le personnage, lui, survit.

### Ce qui détruirait les données aujourd'hui

Vérifié sur le code actuel, pas supposé :

- `parseDraft` **ne touche pas** aux réponses d'un contenu inconnu : il ne
  vérifie que la *forme* de l'identifiant de créneau, pas son existence. Charger
  un personnage sans son pack ne perd donc rien.
- `pruneChoices`, en revanche, **efface** toute réponse dont le créneau n'est
  plus ouvert — et sans la classe, aucun de ses créneaux ne l'est. Elle ne
  tourne qu'à la modification du brouillon, jamais au chargement. Autrement dit :
  la fiche s'affiche vide, et **la première chose qu'on touche efface tout.**

C'est le pire des comportements : silencieux, différé, et déclenché par un geste
anodin.

### La règle à écrire

La purge ne juge que ce qu'elle voit. Un créneau se ferme pour deux raisons très
différentes, et le code n'en distingue qu'une :

| Le parent du créneau | Ce que ça veut dire | Ce qu'on fait |
| --- | --- | --- |
| **Connu du catalogue** (`roublard`) mais le créneau n'est plus ouvert | Le joueur a changé de classe, ou le niveau a refermé un palier | On retire, avec l'avis en français — comportement actuel, à garder |
| **Inconnu du catalogue** (`maison-artificier`) | Le contenu est absent, peut-être temporairement | On **ne touche à rien**. Les réponses dorment. |

Une réponse endormie ne coûte que quelques octets, elle est invisible, et elle
est bornée par le plafond de 64 créneaux déjà posé à l'entrée. Réimporter le
pack rouvre les créneaux, retrouve les réponses, et la fiche redevient
exactement ce qu'elle était. **Sans rien à ressaisir.**

Trois tests fixent ça : la fiche survit à la disparition du pack, une
modification du personnage pendant l'absence ne l'ampute pas, et le
réimport rend une fiche identique au bit près à celle d'avant.

### Ce que l'application dit, au lieu de faire semblant

Une fiche vide n'explique rien. Quand un identifiant reste sans contenu :

> **Il te manque du contenu.** Ce personnage utilise « maison-artificier »,
> du pack *Mes ajouts* (v3). Importe-le pour retrouver ta fiche.

Avec le bouton d'import juste dessous. C'est du même ordre que les avis de
cascade existants : structuré dans le domaine, rédigé dans `ui/format/`.

### Le fichier du personnage se suffit à lui-même

Le scénario « je perds mes packs mais pas mes personnages » ne se règle pas
seulement en ne détruisant rien : encore faut-il pouvoir **récupérer le pack**.
Trois chemins, et il les faut tous les trois :

1. **Le personnage exporté emporte une copie des packs dont il dépend.** Un
   fichier de personnage s'ouvre alors n'importe où, sur un téléphone neuf,
   sans rien d'autre. Le coût est dérisoire : une classe pèse quelques kio.
2. **Un pack installé se réexporte depuis l'écran de gestion.** Si la copie
   perdue est celle de l'ordinateur, le téléphone la rend.
3. **L'import d'un personnage propose d'installer les packs qu'il porte**, sans
   jamais l'imposer.

Politique en cas de conflit de version, à l'import d'un personnage :

- pack absent → proposer de l'installer, c'est le cas courant ;
- même version → rien à faire, silence ;
- versions différentes → **la version installée gagne par défaut**, parce
  qu'elle contient peut-être des corrections que le fichier ignore. On le dit
  (« ce personnage a été construit avec la v3, tu as la v5 »), et on laisse le
  choix d'installer celle du fichier sous un autre identifiant de pack.

Jamais d'écrasement silencieux dans un sens ou dans l'autre.

---

## 8. Ce qu'on attend d'un créateur, et qu'on oublie

Par ordre de valeur, d'après ce que ces outils ratent d'habitude :

1. **Partir d'une copie.** « Nouvelle classe à partir du Guerrier » : le plus
   utile de la liste, et gratuit puisque le contenu SRD a exactement la même
   forme que le contenu maison.
2. **L'aperçu.** Voir sa race telle qu'elle apparaîtra dans l'assistant — la
   carte, ses trois repères — et sur la fiche. Sinon on écrit à l'aveugle.
3. **Ce qui manque, listé**, comme le récapitulatif de l'assistant.
4. **L'aller-retour fidèle.** Le fichier **est** l'état : le créateur est une
   vue dessus, pas un second brouillon qui pourrait diverger. Ouvrir un fichier
   reconstruit le formulaire à l'identique, sinon le format perd de
   l'information.
5. **Un écran de gestion** : ce qui est installé, en quelle version, **le
   réexporter**, le retirer. Réexporter n'est pas un luxe : c'est le seul
   chemin de retour quand la copie perdue est celle de l'ordinateur.
6. **Rien d'autre.** Pas de compte, pas de nuage, pas de galerie en ligne : le
   fichier va sur l'ordinateur du joueur et en revient.

---

## 9. Découpage, du plus sûr au plus lourd

Chaque tranche est utilisable seule et laisse l'application verte.

| | Ce que ça ouvre | Difficulté |
| --- | --- | --- |
| 1 | **Sorts** | Plat, sans créneau de choix, référence seulement des classes. Le banc d'essai du format et de l'import. |
| 2 | **Races** | Ajoute les créneaux (caractéristique, langue, compétence, outil) et les sous-races. |
| 3 | **Historiques** | Peu de champs, mais valide le cas « une entrée qui n'est pas du SRD » déjà assumé par la charte. |
| 4 | **Classes** | Aptitudes par niveau, tables, sous-classes, magie, équipement. Le gros morceau, à faire en dernier avec tout le reste éprouvé. |

Avant la tranche 1, une brique indépendante et déjà promise par la charte :
**l'export et l'import du personnage**, qui n'existent nulle part dans
l'interface alors que `parseDraft` les attend depuis le début. C'est le même
mécanisme de fichier, sur un objet dix fois plus simple.

---

## 10. Ce que la charte devra dire

Trois modifications, à appliquer quand la décision est prise :

**§1 Périmètre.** Retirer `homebrew` de la liste hors périmètre, et ajouter au
périmètre : « un **créateur de contenu** : races, classes, historiques et sorts
écrits par le joueur, enregistrés en JSON sur son appareil, réimportables pour
modification. »

**§9 Sources et droits.** Ajouter : « Le contenu **importé** n'est pas du
contenu de `data/` : la règle de revue ne s'y applique pas. L'interface le
distingue toujours de ce qui vient du SRD, et l'attribution SRD ne le couvre
pas. Ce qu'un joueur écrit ou importe le regarde ; l'application ne le
distribue pas. »

**§5 Architecture.** Ajouter la validation d'entrée à `domain/` : « Le contenu
importé traverse `domain/`, jamais l'inverse : une entité venue d'un fichier
n'existe qu'après avoir été validée par une fonction pure du domaine. »

---

## 11. Ce que ça coûte, en gros

- Export/import du personnage : une demi-journée, dans le périmètre actuel.
  Une demi-journée de plus pour qu'il emporte ses packs et sache les proposer
  (§7), à faire dès que les packs existent.
- La règle de purge du §7 : une demi-journée, tests compris. Elle est
  indépendante du reste et pourrait même être écrite avant le créateur.
- Tranche « sorts » : un à deux jours, dont la moitié en validation et tests.
- Tranches « races » et « historiques » : deux à trois jours.
- Tranche « classes » : le double, avec l'aperçu et l'aller-retour des douze
  classes du SRD comme test d'acceptation.

---

## 12. Décisions à prendre avant d'écrire une ligne

1. **Le préfixe obligatoire** : `maison-artificier` visible dans le fichier, ou
   préfixe posé à l'import ? (Je recommande visible : rien de magique, et les
   références internes ne se réécrivent pas.)
2. **Un pack ou plusieurs ?** Un fichier = un pack, ou un fichier qui contient
   tout ce qu'on a fait ? (Je recommande un pack par fichier, versionné à part.)
3. ~~Réinstaller un pack ressuscite-t-il les réponses ?~~ **Tranché : oui, et
   c'est une contrainte, pas une option** (§7). La purge ne juge que ce qu'elle
   voit, le personnage exporté emporte ses packs, et un pack installé se
   réexporte.
4. **La validation à la main ou avec un schéma ?** 500 à 700 lignes contre
   14 kio de dépendance.
5. **Le créateur sur téléphone ?** La charte dit mobile d'abord ; écrire une
   classe au pouce est un exercice ingrat. Une décision par écran, comme
   l'assistant, ou un écran assumé « plus confortable au clavier » ?
6. **Un personnage exporté emporte-t-il TOUJOURS ses packs** (fichier autonome,
   quelques kio de plus), ou seulement sur demande ? Je recommande toujours :
   un fichier qui ne s'ouvre qu'à moitié est un piège qu'on découvre le jour où
   c'est grave.
