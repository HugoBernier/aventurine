// Contenu dérivé du SRD 5.1 (CC BY 4.0), traduction Aventurine.
import type { Alignment } from '../domain/content';

export const ALIGNMENT_ENTRIES: readonly Alignment[] = [
  {
    id: 'loyal-bon',
    name: 'Loyal bon',
    blurb: 'Tu aides les autres et tu tiens parole.',
  },
  {
    id: 'neutre-bon',
    name: 'Neutre bon',
    blurb: 'Tu fais le bien, sans t’encombrer de règles.',
  },
  {
    id: 'chaotique-bon',
    name: 'Chaotique bon',
    blurb: 'Tu suis ton cœur, quitte à désobéir.',
  },
  { id: 'loyal-neutre', name: 'Loyal neutre', blurb: 'L’ordre compte plus que le camp.' },
  {
    id: 'neutre',
    name: 'Neutre',
    blurb: 'Tu évites les extrêmes et tu prends ce qui vient.',
  },
  {
    id: 'chaotique-neutre',
    name: 'Chaotique neutre',
    blurb: 'Ta liberté avant tout le reste.',
  },
  {
    id: 'loyal-mauvais',
    name: 'Loyal mauvais',
    blurb: 'Tu prends ce que tu veux, dans les règles.',
  },
  {
    id: 'neutre-mauvais',
    name: 'Neutre mauvais',
    blurb: 'Tu prends ce que tu veux, sans t’en cacher.',
  },
  {
    id: 'chaotique-mauvais',
    name: 'Chaotique mauvais',
    blurb: 'Tu détruis pour le plaisir de détruire.',
  },
];
