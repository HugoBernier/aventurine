import type { ReactNode } from 'react';
import { packOf } from '../../domain/pack';
import { usePacks } from '../../state/PacksProvider';
import styles from './Provenance.module.css';

export interface ProvenanceProps {
  readonly id: string;
}

/**
 * D'où vient cette entrée, quand elle ne vient pas du SRD. Rien pour le SRD :
 * c'est le fond de la carte, l'annoncer partout serait du bruit.
 *
 * La charte impose de distinguer TOUJOURS le contenu importé de ce que
 * l'attribution SRD couvre. Le repère suit donc l'entrée partout où elle est
 * nommée, sous son nom plutôt qu'entre parenthèses derrière : sur 360 px, une
 * parenthèse pousse le nom à la ligne, et c'est le nom qu'on balaie du regard.
 */
export function Provenance({ id }: ProvenanceProps): ReactNode {
  const { packs } = usePacks();
  const pack = packOf(id, packs);
  return pack === null ? null : <span className={styles.source}>{pack.info.name}</span>;
}
