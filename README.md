# Aventurine

Créateur de personnage **D&D 5e**, entièrement en français, pensé pour le
téléphone. Site statique, sans compte et sans backend : tout reste sur ton
appareil.

> Le site est compilé avec des chemins **relatifs** : il fonctionne à
> n'importe quelle adresse, et renommer le dépôt ne casse rien.

## Démarrer

```sh
nvm use        # version exacte, lue dans .nvmrc
npm ci         # installation reproductible
npm run dev    # ouvre le serveur de développement
```

## Commandes

| Commande | Ce qu'elle fait |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | compile le site dans `dist/` |
| `npm run typecheck` | vérifie les types |
| `npm run lint` | ESLint puis Prettier, en lecture seule |
| `npm run format` | applique Prettier |
| `npm run test` | tests + seuils de couverture du domaine |
| `npm run test:watch` | tests en continu, sans couverture |
| **`npm run verify`** | **types + lint + tests — à lancer avant tout commit** |

## Architecture

```
src/
  domain/   règles et types D&D — TypeScript pur, ne dépend de RIEN
  data/     contenu SRD 5.1 traduit en français, typé par domain/
  state/    parcours de l'assistant, cascade, persistance
  ui/       composants React
```

Sens autorisé : `ui → state`, `ui → domain`, `ui → data`, `state → domain`,
`data → domain`, et `domain → rien`. **La règle est vérifiée par le lint** :
neuf sondes l'exercent dans les deux sens, y compris les imports dynamiques.

Le reste de la charte est dans [`CLAUDE.md`](CLAUDE.md), et les arbitrages entre
lots dans [`docs/plans/00-arbitrage.md`](docs/plans/00-arbitrage.md).

## Trois règles qu'aucun outil ne vérifie

1. **Pas de fichier baril** à la racine de `src/` ni d'une couche : c'est le
   seul chemin par lequel une couche peut en atteindre une autre sans que le
   lint le voie. Un module d'agrégation *à l'intérieur* d'une couche est permis.
2. **Aucune URL commençant par `/`** dans le code. Le site est publié sous un
   sous-chemin : un actif s'importe, une URL construite part de
   `import.meta.env.BASE_URL`.
3. **Ne pas « corriger »** `viewport-fit=cover` ni `color-scheme: light` dans
   `index.html`. Les deux sont commentés sur place : leur absence ne se voit
   qu'en production, jamais sur un poste de développement.

## Budget de performance

| Poste | Budget | Mesuré |
|---|---|---|
| Chunk d'entrée (gzip) | ≤ 110 kio | ~93 kio |
| CSS total (gzip) | ≤ 15 kio | ~3 kio |
| Polices web | 0 octet | 0 |

La CI échoue si un budget est dépassé.

## Publication

Site statique sur Vercel, servi **à la racine d'un domaine**. `vercel.json`
réécrit toute adresse inconnue vers `index.html` : c'est ce qui permet de
recharger une route profonde sans 404.

Les actifs sont référencés en absolu (`base: '/'` dans `vite.config.ts`), parce
que le site a des routes : servi depuis `/contenu/barbare`, un chemin relatif
résoudrait vers `/contenu/assets/…` et rendrait une page blanche.

Conséquence : `dist/index.html` ne s'ouvre plus depuis un dossier local. Utiliser
`npm run preview`, qui le sert à la racine.

GitHub Pages a été abandonné : sur un sous-chemin il imposait de recoder le nom
du dépôt dans la base, et son seul moyen de servir une route profonde — un
`404.html` copié sur `index.html` — répond avec un code HTTP 404.

## Commits

`<type>(<portée>): <verbe à l'impératif>` — types : `feat`, `fix`, `refactor`,
`test`, `docs`, `chore`, `perf`. Portée = la couche. Un commit laisse `verify`
vert.

## Sources et droits

Contenu dérivé du **SRD 5.1** publié par Wizards of the Coast sous licence
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), traduit en français
pour ce projet — traduction écrite à neuf depuis l'anglais.

**Aventurine n'est affilié ni à Wizards of the Coast, ni à D&D Beyond.** La
mention « D&D 5e » ne sert qu'à décrire la compatibilité.

Le **code** est sous licence MIT (voir [`LICENSE`](LICENSE)). Le **contenu de
jeu** reste sous CC BY 4.0 : ce sont deux licences distinctes sur deux choses
distinctes.

> This work includes material taken from the System Reference Document 5.1
> (“SRD 5.1”) by Wizards of the Coast LLC, available at
> <https://dnd.wizards.com/resources/systems-reference-document>. The SRD 5.1
> is licensed under the Creative Commons Attribution 4.0 International License,
> available at <https://creativecommons.org/licenses/by/4.0/legalcode>.
