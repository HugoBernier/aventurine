/**
 * Enregistrer un texte sur l'appareil du joueur.
 *
 * Un lien `download` fabriqué à la volée plutôt qu'une bibliothèque : c'est le
 * mécanisme du navigateur, il ne pèse rien, et sur téléphone il ouvre la feuille
 * de partage habituelle — celle où l'on choisit ses fichiers ou son nuage.
 */
export function saveFile(fileName: string, text: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  // Sans ça, le contenu reste en mémoire tant que l'onglet vit.
  URL.revokeObjectURL(url);
}
