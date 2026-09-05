# 06 — Créateur de contenu

> Note de conception. **Toutes les décisions sont prises** (§12 et §13) et la
> charte est à jour (§10) ; le code, lui, n'est pas écrit. Le premier travail à
> sortir est la règle de purge du §7, qui ne dépend d'aucune autre et protège
> déjà l'existant.

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

Un pack, un fichier. Un pack n'est **pas** une entrée : c'est un **supplément**,
qui porte autant de races, de classes, d'historiques et de sorts qu'on veut. Une
campagne qui apporte trois peuples, deux historiques et une poignée de sorts,
c'est un fichier, un nom, une date — et on l'installe ou on le retire d'un
bloc. C'est aussi ce qui rend le partage praticable : on envoie « Les Brumes de
Karn », pas onze fichiers.

```json
{
  "aventurine": 2,
  "pack": {
    "id": "karn",
    "name": "Les Brumes de Karn",
    "author": "Hugo",
    "description": "Trois peuples et une classe pour une campagne d'horreur gothique.",
    "updatedAt": "2026-09-04T10:12:00.000Z"
  },
  "races": [],
  "classes": [],
  "backgrounds": [],
  "spells": []
}
```

Les tableaux absents valent « rien de ce genre-là » : un pack de sorts seuls est
un fichier parfaitement normal.

### L'identifiant du pack est un préfixe, et il est obligatoire

Tout identifiant défini par le pack commence par `karn-` : `karn-brumeux`,
`karn-chasseur-de-brume`, `karn-appel-des-brumes`. La validation le vérifie,
elle ne le fabrique pas : ce qui est écrit dans le fichier est ce qui est
utilisé.

C'est ce qui empêche deux packs de se marcher dessus, et un pack d'écraser le
SRD. Ce n'est pas cosmétique : l'identifiant de créneau a la forme
`class:karn-chasseur-de-brume:skills`, il **porte** l'identifiant du parent.
Deux « chasseur de brume » venus de deux packs, et les réponses d'un personnage
basculent sur le mauvais contenu.

Le séparateur est un tiret et pas deux points, parce que le motif d'un créneau
est `^(?:race|class|background):[a-z0-9-]+:[a-z0-9-]+$` : un deux-points dans
l'identifiant casserait l'analyse. Même charset que le reste du contenu,
minuscules et tirets, ce qu'un test vérifie déjà.

### Les références sortent du pack, les définitions non

Une classe du pack peut référencer la liste de sorts du magicien
(`listFrom: 'magicien'`), l'objet `cotte-de-mailles`, la compétence
`discretion`. Elle ne peut pas **définir** un identifiant qu'elle ne possède
pas. Une règle, deux lignes de validation : toute clé définie commence par le
préfixe du pack ; toute référence pointe soit le SRD, soit le même pack.

---

## 3. Les versions — la question posée

Deux horloges seulement, et surtout pas trois.

| | Ce que c'est | Ce que ça permet |
| --- | --- | --- |
| `aventurine: 2` | La **version d'Aventurine** qui a écrit le fichier, grosse et déclarée à la main | Refuser proprement un fichier venu d'une version plus récente que la sienne |
| `pack.updatedAt` | **La date d'export**, et rien d'autre | Dire lequel est lequel : « Les Brumes de Karn, par Hugo — version du 4 septembre 2026 » |

**Pas de numéro de version du pack.** Un entier incrémenté à chaque export
paraît plus rigoureux qu'une date ; il ne l'est pas. Les deux se cassent
exactement dans le même cas — on édite le pack sur deux appareils, chacun
incrémente depuis sa copie, et on obtient deux « v4 » différentes. Sauf que la
date, quand elle se casse, dit encore quelque chose (« 4 septembre » contre
« 12 mars ») là où deux « v4 » n'apprennent rien. Elle s'affiche telle quelle,
sans qu'il faille traduire un compteur abstrait. Et c'est un champ au lieu de
deux.

Reste le défaut connu de la date : l'horloge d'un téléphone se règle à la main.
Il est neutralisé par la règle d'usage — **la date se montre, elle ne décide
jamais**. En cas de conflit à l'import, c'est le pack installé qui l'emporte par
défaut et le joueur qui tranche, quelles que soient les dates. Une date fausse
informe donc mal ; elle ne peut ni bloquer, ni écraser.

### Le premier nombre est la version d'Aventurine, pas un « format »

`aventurine: 2` se lit « écrit par Aventurine 2 ». Une **grosse version
déclarée à la main**, pas un compteur de publication : elle ne monte que quand
le projet change d'époque. **v1**, c'est le créateur de personnage, aujourd'hui
terminé. **v2**, c'est lui plus le créateur de contenu, races et classes écrites
en texte.

Mon objection initiale visait un numéro qui monte à chaque correction de CSS :
le refus « ce pack vient d'une version plus récente » se déclencherait alors sur
des fichiers parfaitement lisibles. Une version grossière l'écarte — elle ne
bouge pas plus souvent que le format lui-même.

Reste un écart théorique : une v3 qui ne changerait rien au format ferait
refuser ses fichiers par une v2. **Ici, ça ne peut pas arriver** : le site est
une page statique servie par GitHub Pages, tout le monde a toujours la dernière
version, il n'existe pas de « v2 dans la nature » pour lire un fichier de v3.
Cette décision tiendrait mal dans une application installée ; elle est juste
pour celle-ci.

Le bénéfice, lui, est immédiat : un seul nombre, qui veut dire quelque chose
pour un humain, et un message de refus qui nomme le produit au lieu d'un
« format 1 » qu'il faudrait expliquer.

`package.json` est passé de `0.0.0` à `1.0.0`, ce qui est
simplement vrai. Il passera à `2.0.0` le jour où le créateur sortira.

**Ce dont un personnage se souvient.** Le pack dont il dépend se **déduit** de
ses identifiants : `karn-chasseur-de-brume` dit « pack karn ». C'est le préfixe du
§2 qui offre ça, et c'est pour cette raison qu'aucune clé n'est à stocker. En
revanche le **nom lisible** et la **date** ne se déduisent de rien une fois le
pack parti : ils sont écrits dans le fichier du personnage comme un simple
repère d'affichage (« construit avec Les Brumes de Karn, version du 4 septembre
2026 »), jamais comme une clé de recherche ni comme une condition. Un repère qui vieillit n'induit personne en
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
  leur table (`steps`), sous-classes — les siennes, ou une greffée sur une
  classe existante par son champ `for` (§13.1) —, magie (caractéristique, rythme, mode de
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

### Pourquoi valider, alors que l'application produit elle-même le fichier

Objection légitime : si le joueur bricole son JSON à la main et le casse, c'est
son affaire. **C'est vrai, et ça ne change rien à la nécessité de valider**,
pour deux raisons qui n'ont rien à voir avec la politesse :

1. **Un fichier qu'on n'a pas produit ne doit pas pouvoir casser l'application.**
   `hitDie: "douze"`, `level: -3`, une chaîne de quarante mégaoctets, une clé
   `__proto__` : ce n'est pas de la courtoisie, c'est de la survie. Le projet a
   déjà tranché ce point pour un objet dix fois plus simple — `parseDraft`
   existe précisément parce que « les clés d'un JSON ne sont pas de confiance »,
   et son commentaire dit qu'une clé `__proto__` n'atteint jamais l'état.
2. **Le partage.** Le troisième usage annoncé en tête, c'est donner son pack à
   Le fichier qui arrive sur ton téléphone n'a pas été produit par **ton**
   application : version plus ancienne, main humaine, autre outil. « C'est son
   problème » ne tient plus quand le fichier est celui d'un autre et le plantage
   le tien.

En revanche, ton instinct est juste sur le **niveau de service** : on ne doit
rien à celui qui édite à la main. Pas de réparation, pas d'import partiel, pas
d'assistant de correction. Un refus, une phrase, on s'arrête :

> Ce fichier n'est pas un pack Aventurine valide.
> Classe « karn-chasseur-de-brume » : dé de vie manquant.

Ce qui coûte cher, ce sont les messages fins par champ — et ceux-là ne servent
que dans le **formulaire du créateur**, où l'on écrit. C'est la même fonction
qui les produit, donc c'est payé une fois.

### Une seule fonction, deux usages

Le formulaire du créateur et l'import d'un fichier vérifient **la même chose**.
Écrire deux vérifications, c'est garantir qu'elles divergeront.

Donc : une fonction par entité dans `domain/`, pure, qui prend `unknown` et rend
soit l'entité typée, soit une liste de raisons **structurées** — le français se
compose dans `ui/format/`, comme partout ailleurs.

Ordre de grandeur honnête : `parseDraft` fait 146 lignes pour un brouillon plat
et borné. Races, classes, sorts et historiques, avec leurs douze genres de
choix, c'est plutôt **500 à 700 lignes plus les tests**. Une dépendance de
schéma (zod, ~14 kio compressés) diviserait ce chiffre, au prix d'une
justification écrite en PR et d'un budget de 150 kio déjà bien entamé.

**Décision : à la main**, dans la continuité de `parseDraft`, parce que ces
fonctions servent deux fois et qu'elles sont le seul endroit où le contenu
importé entre dans l'application. Porte de sortie explicite : si la tranche
« classes » fait exploser le compte de lignes, zod avec sa justification écrite
reste ouvert — c'est une révision de décision, pas un échec.

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

**On ne purge que ce qu'on sait identifier entièrement.** Une réponse nomme deux
choses — le créneau où elle vit, et l'option qu'elle retient. Il suffit que
**l'une des deux** soit introuvable dans le catalogue pour qu'on n'y touche pas.

| Ce qu'on lit | Ce que ça veut dire | Ce qu'on fait |
| --- | --- | --- |
| Le parent du créneau et l'option sont **tous deux connus** (`class:roublard:skills` → `discretion`) | Le joueur a changé de classe, ou le niveau a refermé un palier | On retire, avec l'avis en français — comportement actuel, à garder |
| Le **parent** est introuvable (`class:karn-chasseur-de-brume:skills`) | La classe du pack est absente | On **ne touche à rien**. Les réponses dorment. |
| L'**option** est introuvable (`class:barde:subclass` → `karn-college-des-brumes`) | Une greffe du pack est absente, alors que la classe, elle, est du SRD | On **ne touche à rien** non plus. |

La troisième ligne est celle qu'une règle fondée sur le seul parent aurait
manquée, et c'est la greffe du §13.1 qui la révèle : une sous-classe venue d'un
pack se choisit dans un créneau qui appartient au barde du SRD. Le parent reste
donc parfaitement connu quand le pack s'en va, et la réponse serait effacée sans
que rien ne soit en cause.

Formulée ainsi, la règle est aussi plus simple à écrire qu'une distinction par
provenance : on ne cherche pas à savoir *pourquoi* un identifiant manque, on
constate qu'il manque et on s'abstient.

**État : les deux premières lignes sont écrites** (`isParentKnown` dans
`state/prune.ts`, quatre tests). La troisième attend la greffe de sous-classe :
tant qu'aucun pack n'en pose, aucune option ne peut manquer sous un parent
présent, et l'écrire aujourd'hui serait du code sans cas d'usage. Elle partira
avec la tranche « sous-classes » (§9), qui est la première à en poser.

Une réponse endormie ne coûte que quelques octets, elle est invisible, et elle
est bornée par le plafond de 64 créneaux déjà posé à l'entrée. Réimporter le
pack rouvre les créneaux, retrouve les réponses, et la fiche redevient
exactement ce qu'elle était. **Sans rien à ressaisir.**

Quatre tests fixent ça : la fiche survit à la disparition du pack, une
modification du personnage pendant l'absence ne l'ampute pas, le réimport rend
une fiche identique au bit près à celle d'avant, et une **sous-classe greffée**
sur une classe du SRD survit au même traitement.

Ce qui n'est **pas** en danger, vérifié aussi : la race, la classe et
l'historique du personnage sont de simples chaînes que rien ne purge, et les
bonus qu'une race accorde se recalculent à l'affichage — ils reviennent avec
elle, sans avoir été stockés.

### Trois conséquences de cette règle, qui demandent chacune une décision

**a. Les réponses endormies occupent le plafond d'entrée.** `parseDraft` ne
garde que les 64 premiers créneaux du dictionnaire, dans l'ordre d'insertion.
Un personnage de niveau 20 en ouvre 15 à 17 selon sa classe : la marge est
large, mais elle n'est pas infinie, et les réponses endormies étant les plus
anciennes, ce sont les **vivantes** qui sauteraient en cas de saturation. Trois
sorties : monter le plafond, exclure les endormies du compte, ou ne rien faire
et l'accepter comme un cas d'école. Je penche pour exclure les endormies : la
borne existe contre un fichier hostile, pas contre un joueur fidèle à son pack.

**b. Le pack peut revenir *différent*.** L'auteur a renommé un choix, retiré une
option, découpé une classe en deux. Le parent redevient connu, donc la purge
reprend son travail — légitimement cette fois. Mais trois avis d'affilée
« telle option n'est plus disponible » après un import, c'est illisible : il
faut un avis **de groupe**, posé par l'import et pas par la purge (« Les Brumes
de Karn, version du 12 octobre : 3 choix de Milo ne sont plus possibles »).

**c. Le même identifiant peut désigner autre chose plus tard.** Le préfixe
protège de la collision entre packs présents en même temps, pas de la
réutilisation dans le temps : supprimer « karn », puis créer un autre pack
appelé « karn » avec un autre « chasseur de brume », et les réponses endormies
se raccrochent à un contenu qui n'est pas le leur. Deux réponses possibles :
un suffixe opaque à la création (`karn-a7f3`), qui empoisonne tous les
identifiants pour un cas rare ; ou l'accepter, le joueur ayant réemployé son
propre nom. Je penche pour l'accepter, et pour afficher la date dans l'écran de
gestion afin que la surprise soit visible.

### Oublier, mais délibérément

Ne rien détruire en douce n'interdit pas de détruire sur demande. La
bibliothèque affiche, sous un personnage concerné : « attend du contenu absent
(Les Brumes de Karn) », avec « oublier ce contenu » qui purge pour de bon. Le
joueur décide ; l'application ne décide jamais à sa place.

### Ce que l'application dit, au lieu de faire semblant

Une fiche vide n'explique rien. Quand un identifiant reste sans contenu :

> **Il te manque du contenu.** Ce personnage utilise « karn-chasseur-de-brume »,
> du pack *Les Brumes de Karn* (4 septembre 2026). Importe-le pour retrouver
> ta fiche.

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
- même date → rien à faire, silence ;
- dates différentes → **le pack installé gagne par défaut**, parce qu'il
  contient peut-être des corrections que le fichier ignore, et sans jamais
  comparer les dates pour décider. On les montre (« ce personnage a été
  construit avec la version du 4 septembre, tu as celle du 12 octobre »), et on
  laisse le choix d'installer celle du fichier sous un autre identifiant de
  pack.

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
5. **Un écran de gestion** : ce qui est installé, à quelle date, **le
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
| 2 | **Sous-classes greffées** | Le homebrew le plus demandé, et **treize fois plus léger qu'une classe** : 0,9 kio et 10 champs contre 12 kio et 16. Amène les aptitudes par niveau et la troisième ligne de purge du §7. |
| 3 | **Races** | Ajoute les créneaux (caractéristique, ascendance, tour de magie, langue, compétence, outil) et les sous-races. |
| 4 | **Historiques** | Peu de champs, mais valide le cas « une entrée qui n'est pas du SRD » déjà assumé par la charte. |
| 5 | **Classes entières** | Dé de vie, sauvegardes, magie, équipement, paliers. Le gros morceau, en dernier, avec tout le reste éprouvé. |

La sous-classe est passée **avant** les races et les classes après mesure : un
collège de barde est le cas que les tables réclament en premier, et il ne coûte
qu'un treizième d'une classe. Attendre la tranche 5 pour l'offrir aurait été
livrer le créateur sans ce pour quoi on l'ouvre.

Avant la tranche 1, une brique indépendante et déjà promise par la charte :
**l'export et l'import du personnage**, qui n'existent nulle part dans
l'interface alors que `parseDraft` les attend depuis le début. C'est le même
mécanisme de fichier, sur un objet dix fois plus simple.

**Faite.** `personnage-<nom>.json` s'enregistre depuis la fiche et se rouvre
depuis la bibliothèque. Le fichier porte `aventurine: 1` et le brouillon nu ;
plus récent, il est refusé net. Ouvrir un fichier **ajoute** un personnage sans
jamais en remplacer un, et laisse la bibliothèque ouverte : on enchaîne les
fichiers d'une sauvegarde sans revenir sur ses pas. Ce que le fichier portait et
qu'on n'a pas su relire est compté, dit sur place, et ignoré — jamais réparé.

**Tranche 1 faite.** Un pack de sorts s'écrit dans l'application, s'enregistre
en `pack-<id>.json`, se rouvre pour être repris, s'installe, se réexporte et se
retire. `parsePack` juge des deux côtés — le formulaire y lit ce qui manque,
l'import ce qui refuse — et un pack portant des races ou des classes est refusé
plutôt que vidé en silence. Le brouillon du créateur vit sous sa propre clé,
comme décidé au §13.2.

Une chose est arrivée plus tôt que prévu : **la troisième ligne de la règle du
§7**, qu'on attendait avec les sous-classes greffées. Un sort de pack se choisit
dans le créneau du magicien du SRD : le créneau reste grand ouvert quand le pack
s'en va, et seule l'option manque. Sans elle, désinstaller un pack effaçait la
réponse. Elle est écrite (`isOptionKnown`), et une réponse endormie garde sa
place dans le créneau — sinon le joueur en choisissait une de plus, que le
retour du pack lui reprenait.

**Tranche 2 faite.** Une voie s'écrit dans le créateur — son nom, sa phrase,
ses trois repères, ses aptitudes niveau par niveau — et nomme la classe du SRD
à laquelle elle s'ajoute. `catalogueWithPacks` la verse dans les `subclasses`
de cette classe, et rien en aval ne change : le créneau qui la propose est
celui que la classe ouvrait déjà, et la voie du SRD reste à côté. Ce qu'une
sous-classe porte et que cette version ne sait pas encore écrire — maîtrises,
sorts toujours préparés, défense sans armure, points de vie, choix ouverts —
est **refusé** à l'import plutôt que tu, comme les races et les classes.

La marque de provenance descend maintenant jusqu'à la **ligne d'aptitude de la
fiche**, comme le §13.6 le demandait : chaque aptitude porte l'identifiant de
ce qui la donne (`SheetFeature.fromId`), donc « Voile » affiche « Les Brumes de
Karn » sous son nom là où « Expertise » n'affiche rien.

---

## 10. Ce que la charte devra dire

**Appliquées.** Les quatre modifications ci-dessous sont dans `CLAUDE.md` :

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

**§4 Mobile-first.** Une exception nommée, et une seule : « Le créateur de
contenu est le seul écran conçu **au clavier d'abord**. Écrire une classe au
pouce est un exercice ingrat ; l'assumer vaut mieux que le prétendre. Ce qui
reste mobile, parce qu'on le fait à table : consulter, importer, retirer un
pack. » Sans cette ligne, la règle de la charte serait enfreinte en silence.

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

## 12. Décisions

### Tranchées

| | Décision | Conséquence |
| --- | --- | --- |
| 1 | **Le préfixe est visible dans le fichier** et vérifié à l'import, jamais posé en douce | Rien de magique, et les références internes ne se réécrivent pas |
| 2 | **Un pack = un fichier = un supplément** : autant de races, classes, historiques et sorts qu'il veut | On envoie « Les Brumes de Karn », pas onze fichiers ; on l'installe et on le retire d'un bloc |
| 3 | **Réinstaller rend tout, sans rien ressaisir** — c'est une contrainte, pas une option | La purge ne juge que ce qu'elle voit (§7), et trois décisions techniques en découlent, ci-dessous |
| 4 | **Validation écrite à la main**, dans la continuité de `parseDraft` | Refus net et sans réparation ; zod reste une porte de sortie justifiable si la tranche « classes » déborde |
| 5 | **Le créateur est au clavier d'abord** | Exception nommée dans la charte (§10) ; consulter, importer et retirer restent au pouce |
| 6 | **Un personnage exporté emporte toujours ses packs** | Un fichier qui ne s'ouvre qu'à moitié est un piège qu'on découvre le jour où c'est grave |

### Les trois que la décision 3 fait apparaître

Détaillées au §7, tranchées ici. Ce sont des décisions techniques prises au
jugé : elles se corrigent en écrivant la règle de purge si le code dit le
contraire.

| | Décision | Pourquoi |
| --- | --- | --- |
| 7 | **Le plafond de 64 créneaux ne compte pas les réponses endormies** | La borne existe contre un fichier hostile, pas contre un joueur fidèle à son pack. Sans ça, ce sont les réponses vivantes qui sauteraient, les endormies étant les plus anciennes |
| 8 | **Un pack qui revient modifié pose un avis de groupe**, posé par l'import et non par la purge | Trois avis d'affilée « telle option n'est plus disponible » après un import, personne ne les lit |
| 9 | **Rien ne protège de la réutilisation d'un nom de pack dans le temps** | Un suffixe opaque (`karn-a7f3`) empoisonnerait tous les identifiants pour un cas rare ; la date affichée à l'écran de gestion rend la surprise visible |

Les neuf points du §13 sont tranchés à leur tour : **rien ne reste ouvert.**

---

## 13. Neuf points que la première liste ne posait pas

Par ordre d'importance. Les trois premiers engagent le format ou une règle de
fond : les trancher tard coûte cher.

### 1. Peut-on **modifier** une entrée du SRD ? — Non. Mais on peut y greffer.

**Tranché : pas de remplacement.** « Chez moi le guerrier a un d12 » se traite
en copiant et renommant — `karn-guerrier`, que les joueurs de la campagne
choisissent à la place. Remplacer casserait la règle du préfixe, demanderait une
sémantique de fusion champ par champ, et rendrait un personnage ambigu : son
`guerrier`, c'est celui du SRD ou celui du pack installé hier ? Une fusion
silencieuse ferait mentir toutes les fiches déjà imprimées.

**Mais « pas de remplacement » ne veut pas dire « pas d'ajout à une entrée
existante », et la nuance est capitale.** Le homebrew le plus courant n'invente
pas une classe : il ajoute une **sous-classe** à une classe qui existe. Or les
sous-classes vivent *dans* la classe (`CharacterClass.subclasses`), donc la
règle telle qu'écrite interdisait le cas le plus fréquent — il aurait fallu
republier un `karn-barde` entier pour ajouter un collège. Ce n'est pas un cas
limite, c'est le cas normal.

D'où la distinction à retenir : **on n'écrase aucun champ, mais on peut ajouter
à une liste.** Deux points de greffe, et deux seulement :

| Greffe | Comment | Coût |
| --- | --- | --- |
| Une **sous-classe** sur une classe existante | Elle nomme son parent (`"for": "barde"`) | Un champ, et l'appartenance se lit dans l'écran de choix |
| Un **sort** sur la liste d'une classe existante | Il se déclare `classes: ["magicien"]` | **Zéro** : le modèle le permet déjà |

Tout le reste — dé de vie, sauvegardes, aptitude ajoutée au niveau 3 — reste
interdit. La ligne est nette : ajouter un élément à une liste ne change rien à
ce qui existe ; modifier un champ, si.

**Trois précisions qui décident du coût de la greffe :**

- Une greffe vise **une classe du SRD**, jamais celle d'un autre pack : ce
  serait la dépendance croisée refusée au §13.3. Greffer sur une classe du
  **même** pack ne se pose pas — on l'écrit dans la classe, comme le SRD le
  fait.
- Elle se résout **au moment où l'on assemble le catalogue**, en versant la
  sous-classe dans le tableau `subclasses` de sa classe cible. `openChoices`,
  `buildSheet`, le parcours, l'impression : rien en aval ne change, ils voient
  une classe qui a une sous-classe de plus. C'est ce qui rend la greffe bon
  marché, et c'est aussi la raison de la tranche 2 du §9.
- Le créneau qui la propose existe déjà — `class:barde:subclass`, ouvert au
  niveau que la classe fixe. La sous-classe greffée n'est qu'une option de plus
  dedans, ce qui rend nécessaire la troisième ligne de purge du §7 : sans elle,
  la réponse serait effacée dès que le pack s'absente, le barde restant connu.

### 2. Le brouillon du créateur survit-il à un rechargement ?

Le §8 dit « le fichier **est** l'état ». C'est élégant, et **insuffisant** : un
onglet fermé au milieu de l'écriture d'une classe, et deux heures de travail
disparaissent. C'est exactement le reproche déjà fait à l'application il y a
deux jours, et corrigé depuis pour l'assistant.

**Tranché : le créateur enregistre son pack en cours comme l'assistant
enregistre un personnage**, sous sa propre clé. Le fichier reste la vérité qu'on
emporte ; le stockage local est le filet. « Exporter » devient un geste
délibéré, pas la seule façon de ne rien perdre.

### 3. Un pack peut-il dépendre d'un autre pack ?

Une classe de « Karn » qui référence un sort du pack « Brumes ». Ça paraît
inoffensif et ça introduit un **graphe de dépendances** : ordre d'installation,
retrait qui casse un tiers, versions croisées.

**Tranché : interdit**, et écrit dans le message de refus. Une référence
pointe le SRD ou le pack lui-même. Qui veut les deux les réunit en un seul
pack — c'est précisément ce que le pack-supplément permet.

À ne pas confondre avec les greffes du point 1 : une sous-classe qui nomme
`barde`, un sort qui nomme `magicien`, ce sont des références **vers le SRD**,
toujours présent. Aucune dépendance entre packs n'y est créée.

### 4. Un pack peut-il **masquer** du contenu du SRD ? — Non, et pas « pas encore »

**Tranché : non.** Qui ne veut pas d'un tieffelin dans sa campagne ne le
choisit pas. Le seul cas que le masquage servirait vraiment, c'est un meneur qui
veut l'**imposer** à ses joueurs — et la gestion de campagne est hors périmètre
par la charte, sur toute la ligne : pas de partie, pas de rôles, pas de meneur.
Ajouter un demi-mécanisme d'autorité dans un outil qui n'en a aucun serait
incohérent.

Ça ferme aussi une porte discrète : un pack qui masque est un pack qui **retire**
quelque chose au joueur, donc qui peut casser un personnage existant fait avec
du contenu du SRD. Tout le §7 repose sur l'inverse — un pack ajoute, et son
absence ne coûte que lui.

### 5. Quel poids maximum pour un pack ?

De quoi il s'agit : jusqu'où un fichier importé a le droit d'aller, et ce qui
se passe au-delà. Trois choses en dépendent — la place dans `localStorage`
(environ 5 Mio pour tout le site, personnages compris), le temps d'analyse d'un
gros fichier sur un téléphone, et la taille d'un personnage exporté, qui emporte
désormais ses packs.

**Mesuré sur le contenu du projet, sérialisé en JSON :**

| | Poids |
| --- | --- |
| **Tout le SRD** — 12 classes, 9 races, 320 sorts, historiques | **345 kio** |
| Les 12 classes | 148 kio, soit ~12 kio la classe |
| Les 320 sorts | 131 kio, soit ~0,4 kio le sort |
| Les 9 races | 19 kio, soit ~3 kio la race |

Un supplément de campagne réaliste — trois peuples, deux historiques, une classe
et quinze sorts — pèse donc **une trentaine de kio**. Même dix packs de la taille
du SRD entier tiendraient dans le quota.

**Ce qui change la décision : le plafond ne sert pas à border les auteurs, il
sert à arrêter l'absurde.** Un fichier de 50 Mio collé dans l'importeur fige le
téléphone à l'analyse, avant même qu'on parle de stockage.

**Tranché : un seul nombre, 1 Mio par pack** — trois fois tout le SRD — vérifié
sur le **texte brut, avant d'analyser quoi que ce soit**. Pas de plafond global :
c'est le travail du navigateur, et l'application sait déjà dire « le stockage
est plein » sans rien perdre. Les packs gardent leur propre clé, pour qu'un
échec d'écriture de leur côté ne touche jamais les personnages.

### 6. Où signale-t-on qu'un contenu n'est pas du SRD ?

La charte impose maintenant de le distinguer toujours. Reste à dire où et
comment.

**Tranché : le nom du pack sous le nom de l'entrée, sur la carte de choix.**

```
Dampyr
Les Brumes de Karn          ← le pack, en texte secondaire
Un peuple né d'une malédiction, qui vit la nuit.
Bonus     +2 Dextérité, +1 Charisme
Vision    18 m dans le noir
Taille    Moyenne
```

Pourquoi là plutôt qu'entre parenthèses derrière le nom (`Dampyr (Karn)`) :
le nom d'une entrée est ce qu'on lit en balayant une liste de neuf cartes au
pouce, et une parenthèse le rallonge au point de le faire passer à la ligne sur
360 px. Une seconde ligne se saute des yeux quand on ne la cherche pas, et se
trouve immédiatement quand on la cherche.

Pourquoi **pas en faible opacité**, malgré l'intention juste : l'opacité fait
baisser le contraste sans qu'on sache de combien, elle dépend du fond, et la
charte impose AA partout. Le projet a déjà les deux jetons qu'il faut, mesurés :
`--color-text-muted` (7,03:1) et `--color-text-subtle` (5,01:1). C'est le même
effet visuel — un texte qui recule — mais lisible au soleil et vérifiable.

Le repère n'est pas réservé à la carte : il suit l'entrée partout où elle est
nommée, y compris sur la ligne d'aptitude de la fiche. Et sur la **fiche
imprimée** — celle qu'on tend au meneur, qui a le plus besoin de savoir que la
classe n'est pas dans le livre — une ligne s'ajoute au bandeau d'attribution
existant : « Contient du contenu maison : Les Brumes de Karn, 4 septembre
2026 ».

### 7. Que porte un pack en plus de son nom ?

De quoi il s'agit : ce qui est écrit dans le fichier **à côté** du contenu, et
qui ne sert qu'à savoir ce qu'on tient. Aujourd'hui le pack porte trois champs
techniques — `id`, `name`, `updatedAt`. La question est de savoir s'il en faut
d'autres.

Le cas concret : tu retrouves `pack.json` dans tes téléchargements six mois plus
tard, ou quelqu'un t'envoie le sien. Le nom seul (« Karn ») ne dit ni ce qu'il y
a dedans, ni qui l'a écrit.

**Tranché : deux champs facultatifs, `description` et `author`.** Ils ne
dorment pas dans le fichier : l'écran de gestion et la fenêtre de confirmation
d'import les affichent, avec la date en guise de version — « **Les Brumes de
Karn**, par Hugo, version du 4 septembre 2026. Trois peuples et une classe pour
une campagne d'horreur gothique. » Sans eux, cette fenêtre ne peut montrer qu'un
décompte.

**Pas de champ `licence`.** Personne ne le remplit sérieusement, et son
existence donnerait un faux sentiment de couverture juridique là où la charte
est déjà claire : ce qu'un joueur écrit le regarde, l'application ne distribue
rien.

### 8. Dans quel ordre s'affichent races et classes quand des packs en ajoutent ?

À neuf races la question ne se pose pas ; à trois packs installés, si.

**Tranché : le SRD d'abord dans son ordre actuel, puis chaque pack dans l'ordre
où il a été installé**, ses entrées dans l'ordre du fichier. Deux propriétés
qui comptent plus que l'élégance : rien ne bouge quand on installe un pack de
plus, et le contenu qu'on connaît reste là où on l'a toujours trouvé.

Pas de titres de groupe : la décision 6 met déjà la provenance sur chaque carte,
et des intertitres pousseraient les cartes vers le bas d'un écran de 360 px
pour redire ce qui est écrit dessus. Un tri alphabétique par nom de pack est
écarté pour la même raison qu'un tri alphabétique des races : il réordonne la
liste sous les doigts d'un joueur qui vient d'installer « Ashkar ».

### 9. Que fait-on d'un fichier écrit par une autre version du format ?

**Tranché, et au plus simple : on écrit le refus, pas la migration.** Un fichier
`aventurine: 3` sur une Aventurine 2 est refusé d'une phrase honnête (« ce pack
vient d'une version plus récente d'Aventurine »). Un fichier d'une version
*antérieure*, il n'en existe aucun : les packs naissent avec la v2. Écrire un
convertisseur aujourd'hui, ce serait du code pour un cas qui n'existe pas,
exactement ce que la charte appelle un « hook au cas où ».

Le jour où la 3 change vraiment le format, la conversion s'écrit à ce
moment-là, à un seul endroit, avec son test. Le champ `aventurine` suffit à
rendre ce jour-là possible : c'est lui, et lui seul, qu'il faut poser
maintenant.
