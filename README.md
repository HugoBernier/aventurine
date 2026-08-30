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

Site statique sur GitHub Pages, publié par Actions depuis `main`, jamais sur un
build rouge. **Réglage manuel à faire une fois** : Settings → Pages → source
« GitHub Actions ».

Les actifs sont référencés en relatif (`base: './'` dans `vite.config.ts`), donc
le site s'ouvre aussi bien à la racine d'un domaine, sous un sous-chemin GitHub
Pages, ou depuis un dossier local. Renommer le dépôt ne demande aucune
modification de code. C'est l'absence de routage qui rend cela possible.

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

Le code est distribué séparément du contenu ; voir `LICENSE` pour le code.
