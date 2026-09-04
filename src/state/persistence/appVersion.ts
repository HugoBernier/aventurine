/**
 * La version d'Aventurine, grosse et déclarée à la main : elle ne monte que
 * quand le projet change d'époque, pas à chaque correction. Elle doit suivre le
 * majeur de `package.json`, ce qu'un test vérifie.
 *
 * 1 : le créateur de personnage. 2 : plus le créateur de contenu.
 *
 * Elle voyage en tête de chaque fichier écrit par l'application. C'est le seul
 * moyen qu'a une version future de refuser proprement ce qu'elle ne sait pas
 * lire — et ce refus est tout ce qu'on écrit aujourd'hui : une conversion
 * s'écrira le jour où un format changera vraiment, pas avant.
 */
export const APP_MAJOR_VERSION = 2;
