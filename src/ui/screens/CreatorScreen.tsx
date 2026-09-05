import { useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import {
  allIds,
  emptyBackgroundDraft,
  emptyClassDraft,
  emptyRaceDraft,
  emptySpellDraft,
  emptySubclassDraft,
  packDraftFile,
  parsePackDraft,
  slug,
  uniqueId,
} from '../../domain/packDraft';
import type {
  BackgroundDraft,
  ClassDraft,
  PackDraft,
  RaceDraft,
  SpellDraft,
  SubclassDraft,
} from '../../domain/packDraft';
import { findClass } from '../../domain/catalogue';
import type { Catalogue } from '../../domain/catalogue';
import { parsePack } from '../../domain/parsePack';
import { useCatalogue } from '../../state/hooks';
import { usePacks } from '../../state/PacksProvider';
import { savePackDraft } from '../../state/persistence/creatorStorage';
import { packDraftFileText } from '../../state/persistence/packFile';
import { Explainer } from '../components/Explainer';
import { Notice } from '../components/Notice';
import { TextField } from '../components/TextField';
import { formatPackIssue } from '../format/pack';
import { counted } from '../format/plural';
import { formatSchool } from '../format/spellSchool';
import { saveFile } from '../saveFile';
import { BackgroundForm } from './BackgroundForm';
import { ClassForm } from './ClassForm';
import { RaceForm } from './RaceForm';
import { SpellForm } from './SpellForm';
import { SubclassForm } from './SubclassForm';
import styles from './CreatorScreen.module.css';

const LEVEL_LABEL = (level: number): string =>
  level === 0 ? 'Tour de magie' : `Niveau ${String(level)}`;

/** Le nom de la classe visée, ou l'aveu qu'aucune ne l'est encore. */
function formatClassName(catalogue: Catalogue, classId: string): string {
  return findClass(catalogue, classId)?.name ?? 'Classe à choisir';
}

export interface CreatorScreenProps {
  readonly draft: PackDraft;
  readonly onChange: (draft: PackDraft) => void;
}

/**
 * Écrire un pack. Le brouillon vit sur l'appareil, sous sa propre clé : un
 * onglet fermé au milieu d'un sort ne coûte rien.
 *
 * Deux sorties, et les mots comptent : « ajouter à mes packs » range le pack
 * DANS CE NAVIGATEUR, où il devient jouable sans rien écrire sur le disque ;
 * « enregistrer un fichier » en produit un vrai, celui qu'on donne et qu'on
 * garde. Confondre les deux, c'est croire son travail sauvegardé alors qu'un
 * nettoyage du site l'emporterait.
 */
export function CreatorScreen({ draft, onChange }: CreatorScreenProps): ReactNode {
  const catalogue = useCatalogue();
  const [editing, setEditing] = useState<SpellDraft | null>(null);
  const [editingVoie, setEditingVoie] = useState<SubclassDraft | null>(null);
  const [editingRace, setEditingRace] = useState<RaceDraft | null>(null);
  const [editingBackground, setEditingBackground] = useState<BackgroundDraft | null>(
    null,
  );
  const [editingClass, setEditingClass] = useState<ClassDraft | null>(null);
  // Ne compte que les fois où l'identifiant est PROPOSÉ depuis le nom. Le
  // champ ne se remonte qu'alors : le keyer sur l'identifiant lui-même le
  // démontait à chaque lettre qu'on y tapait, et le clavier se refermait.
  const [installed, setInstalled] = useState<string | null>(null);
  const { install } = usePacks();
  const fileInput = useRef<HTMLInputElement>(null);

  const update = (parts: Partial<PackDraft>): void => {
    const next = { ...draft, ...parts };
    onChange(next);
    savePackDraft(next);
  };

  const packId = draft.id === '' ? 'pack' : draft.id;

  /**
   * Une entrée neuve reçoit ici son identifiant, unique dans le pack : le
   * formulaire ne connaît que lui-même, et deux peuples du même nom se
   * seraient donné le même — un pack refusé pour une raison que personne
   * n'aurait comprise.
   */
  const named = <T extends { readonly id: string; readonly name: string }>(
    entry: T,
  ): T => ({ ...entry, id: uniqueId(packId, entry.name, allIds(draft)) });

  if (editingClass !== null) {
    return (
      <ClassForm
        entry={editingClass}
        onSave={(written) => {
          // Une entrée neuve n'a pas encore d'identifiant : c'est ce qui la
          // distingue d'une modification, et non son nom — deux entrées peuvent
          // très bien porter le même.
          const isKnown = written.id !== '';
          update({
            classes: isKnown
              ? draft.classes.map((item) => (item.id === written.id ? written : item))
              : [...draft.classes, named(written)],
          });
          setEditingClass(null);
        }}
        onCancel={() => {
          setEditingClass(null);
        }}
      />
    );
  }

  if (editingBackground !== null) {
    return (
      <BackgroundForm
        background={editingBackground}
        onSave={(background) => {
          const isKnown = background.id !== '';
          update({
            backgrounds: isKnown
              ? draft.backgrounds.map((entry) =>
                  entry.id === background.id ? background : entry,
                )
              : [...draft.backgrounds, named(background)],
          });
          setEditingBackground(null);
        }}
        onCancel={() => {
          setEditingBackground(null);
        }}
      />
    );
  }

  if (editingRace !== null) {
    return (
      <RaceForm
        race={editingRace}
        packId={packId}
        onSave={(race) => {
          const isKnown = race.id !== '';
          update({
            races: isKnown
              ? draft.races.map((entry) => (entry.id === race.id ? race : entry))
              : [...draft.races, named(race)],
          });
          setEditingRace(null);
        }}
        onCancel={() => {
          setEditingRace(null);
        }}
      />
    );
  }

  if (editingVoie !== null) {
    return (
      <SubclassForm
        subclass={editingVoie}
        ownClasses={draft.classes.filter((entry) => entry.name !== '')}
        onSave={(subclass) => {
          const isKnown = subclass.id !== '';
          update({
            subclasses: isKnown
              ? draft.subclasses.map((entry) =>
                  entry.id === subclass.id ? subclass : entry,
                )
              : [...draft.subclasses, named(subclass)],
          });
          setEditingVoie(null);
        }}
        onCancel={() => {
          setEditingVoie(null);
        }}
      />
    );
  }

  if (editing !== null) {
    return (
      <SpellForm
        spell={editing}
        onSave={(spell) => {
          const isKnown = spell.id !== '';
          update({
            spells: isKnown
              ? draft.spells.map((entry) => (entry.id === spell.id ? spell : entry))
              : [...draft.spells, named(spell)],
          });
          setEditing(null);
        }}
        onCancel={() => {
          setEditing(null);
        }}
      />
    );
  }

  // Le même juge que l'import : ce qui manque ici est exactement ce qui ferait
  // refuser le fichier là-bas.
  const parsed = parsePack(packDraftFile(draft, new Date().toISOString()), catalogue);
  const missing = parsed.kind === 'invalid' ? parsed.issues : [];
  // Un pack sans rien dedans s'installerait sans rien apporter : le bouton
  // attend qu'il y ait quelque chose à jouer.
  const isEmpty =
    draft.spells.length === 0 &&
    draft.subclasses.length === 0 &&
    draft.races.length === 0 &&
    draft.backgrounds.length === 0 &&
    draft.classes.length === 0;

  const openFile = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (fileInput.current !== null) {
      fileInput.current.value = '';
    }
    if (file === undefined) return;
    const text = await file.text();
    try {
      // Relire POUR ÉCRIRE : un pack inachevé se rouvre, il ne se refuse pas.
      update(parsePackDraft(JSON.parse(text)));
    } catch {
      update(draft);
    }
  };

  return (
    <>
      <Explainer label="Comment ça marche ?">
        Tu écris ton contenu ici, puis tu l’enregistres dans un fichier. Ce fichier
        s’installe sur cet appareil ou sur un autre, et se donne à qui tu veux. Ton
        travail est gardé au fur et à mesure : tu peux fermer et revenir.
      </Explainer>

      <div className={styles.fields}>
        <TextField
          label="Le nom de ton pack"
          defaultValue={draft.name}
          maxLength={60}
          placeholder="Les Brumes de Karn"
          onCommit={(name) => {
            // L'identifiant se propose depuis le nom, une seule fois : il
            // préfixe tout ce que le pack définit, et le changer ensuite
            // couperait les fiches de leur contenu.
            // L'identifiant se fabrique une fois, depuis le nom, et ne bouge
            // plus : c'est lui que portent les fiches des personnages, et le
            // changer les couperait de ton contenu. Personne n'a à le taper.
            update(draft.id === '' ? { name, id: slug(name).slice(0, 24) } : { name });
          }}
        />
        <TextField
          label="Ton nom"
          defaultValue={draft.author}
          maxLength={60}
          hint="Facultatif. Il s’affiche à qui installe ton pack."
          onCommit={(author) => {
            update({ author });
          }}
        />
        <TextField
          label="Ce qu’il y a dedans"
          defaultValue={draft.description}
          maxLength={600}
          multiline
          hint="Facultatif. Une phrase, pour t’y retrouver dans six mois."
          onCommit={(description) => {
            update({ description });
          }}
        />
      </div>

      <h2 className={styles.heading}>Tes sorts</h2>
      {draft.spells.length === 0 ? (
        <p className={styles.empty}>Tu n’as pas encore écrit de sort.</p>
      ) : (
        <ul className={styles.list}>
          {draft.spells.map((spell) => (
            <li className={styles.item} key={spell.id}>
              <span className={styles.name}>
                {spell.name === '' ? 'Sans nom' : spell.name}
              </span>
              <p className={styles.facts}>
                {LEVEL_LABEL(spell.level)} · {formatSchool(spell.school)}
              </p>
              <span className={styles.actions}>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    setEditing(spell);
                  }}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    update({
                      spells: draft.spells.filter((entry) => entry.id !== spell.id),
                    });
                  }}
                >
                  Retirer
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className={styles.add}
        onClick={() => {
          setEditing(emptySpellDraft());
        }}
      >
        + Écrire un sort
      </button>

      <h2 className={styles.heading}>Tes classes</h2>
      {draft.classes.length === 0 ? (
        <p className={styles.empty}>Tu n’as pas encore écrit de classe.</p>
      ) : (
        <ul className={styles.list}>
          {draft.classes.map((entry) => (
            <li className={styles.item} key={entry.id}>
              <span className={styles.name}>
                {entry.name === '' ? 'Sans nom' : entry.name}
              </span>
              <p className={styles.facts}>
                d{entry.hitDie} ·{' '}
                {counted(entry.features.length, 'aptitude', 'aptitudes')}
              </p>
              <span className={styles.actions}>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    setEditingClass(entry);
                  }}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    update({
                      classes: draft.classes.filter((item) => item.id !== entry.id),
                    });
                  }}
                >
                  Retirer
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className={styles.add}
        onClick={() => {
          setEditingClass(emptyClassDraft());
        }}
      >
        + Écrire une classe
      </button>

      <h2 className={styles.heading}>Tes voies</h2>
      <p className={styles.hint}>
        Une voie s’ajoute à une classe qui existe — un collège de barde, un domaine de
        clerc. Elle ne change rien à cette classe : elle lui donne un choix de plus.
      </p>
      {draft.subclasses.length === 0 ? (
        <p className={styles.empty}>Tu n’as pas encore écrit de voie.</p>
      ) : (
        <ul className={styles.list}>
          {draft.subclasses.map((subclass) => (
            <li className={styles.item} key={subclass.id}>
              <span className={styles.name}>
                {subclass.name === '' ? 'Sans nom' : subclass.name}
              </span>
              <p className={styles.facts}>
                {formatClassName(catalogue, subclass.forClassId)} ·{' '}
                {counted(subclass.features.length, 'aptitude', 'aptitudes')}
              </p>
              <span className={styles.actions}>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    setEditingVoie(subclass);
                  }}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    update({
                      subclasses: draft.subclasses.filter(
                        (entry) => entry.id !== subclass.id,
                      ),
                    });
                  }}
                >
                  Retirer
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className={styles.add}
        onClick={() => {
          setEditingVoie(emptySubclassDraft());
        }}
      >
        + Écrire une voie
      </button>

      <h2 className={styles.heading}>Tes peuples</h2>
      {draft.races.length === 0 ? (
        <p className={styles.empty}>Tu n’as pas encore écrit de peuple.</p>
      ) : (
        <ul className={styles.list}>
          {draft.races.map((race) => (
            <li className={styles.item} key={race.id}>
              <span className={styles.name}>
                {race.name === '' ? 'Sans nom' : race.name}
              </span>
              <p className={styles.facts}>
                {counted(race.features.length, 'aptitude', 'aptitudes')}
                {race.subraces.length > 0 &&
                  ` · ${counted(race.subraces.length, 'branche', 'branches')}`}
              </p>
              <span className={styles.actions}>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    setEditingRace(race);
                  }}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    update({
                      races: draft.races.filter((entry) => entry.id !== race.id),
                    });
                  }}
                >
                  Retirer
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className={styles.add}
        onClick={() => {
          setEditingRace(emptyRaceDraft());
        }}
      >
        + Écrire un peuple
      </button>

      <h2 className={styles.heading}>Tes historiques</h2>
      <p className={styles.hint}>
        Ce que ton personnage faisait avant de partir. C’est l’entrée la plus indépendante
        : elle ne nomme ni classe ni peuple.
      </p>
      {draft.backgrounds.length === 0 ? (
        <p className={styles.empty}>Tu n’as pas encore écrit d’historique.</p>
      ) : (
        <ul className={styles.list}>
          {draft.backgrounds.map((background) => (
            <li className={styles.item} key={background.id}>
              <span className={styles.name}>
                {background.name === '' ? 'Sans nom' : background.name}
              </span>
              <p className={styles.facts}>
                {counted(background.skills.length, 'compétence', 'compétences')} ·{' '}
                {String(background.goldPieces)} po
              </p>
              <span className={styles.actions}>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    setEditingBackground(background);
                  }}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    update({
                      backgrounds: draft.backgrounds.filter(
                        (entry) => entry.id !== background.id,
                      ),
                    });
                  }}
                >
                  Retirer
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        className={styles.add}
        onClick={() => {
          setEditingBackground(emptyBackgroundDraft());
        }}
      >
        + Écrire un historique
      </button>

      {missing.length > 0 && (
        <Notice tone="reminder">
          Ce qu’il reste à faire avant que ce pack puisse s’installer :
          <ul className={styles.missing}>
            {missing.map((issue) => (
              <li key={formatPackIssue(issue)}>{formatPackIssue(issue)}</li>
            ))}
          </ul>
        </Notice>
      )}

      <h2 className={styles.heading}>Quand tu as fini</h2>

      <button
        type="button"
        className={styles.add}
        disabled={parsed.kind !== 'ok' || isEmpty}
        onClick={() => {
          if (parsed.kind !== 'ok') return;
          // Le pack ET le fichier qui l'écrit : c'est ce fichier qu'on rendra
          // à l'auteur, et qu'on rouvrira ici pour modifier.
          install(parsed.pack, packDraftFileText(draft, new Date().toISOString()));
          setInstalled(parsed.pack.info.name);
        }}
      >
        Ajouter à mes packs, dans ce navigateur
      </button>
      <p className={styles.hint}>
        Le pack devient jouable tout de suite, sur ce téléphone ou cet ordinateur, et rien
        n’est écrit sur ton disque. Il repart si tu effaces les données du site :
        enregistre aussi le fichier si tu veux le garder ou le donner.
      </p>

      {installed !== null && (
        <Notice
          tone="reminder"
          live
          onDismiss={() => {
            setInstalled(null);
          }}
        >
          {installed} est dans tes packs. Tu le retrouves à l’écran précédent, et son
          contenu apparaît maintenant dans l’assistant.
        </Notice>
      )}

      <button
        type="button"
        className={styles.add}
        onClick={() => {
          const text = packDraftFileText(draft, new Date().toISOString());
          const name = draft.id === '' ? 'sans-nom' : draft.id;
          saveFile(`pack-${name}.json`, text, 'application/json');
        }}
      >
        Enregistrer un fichier sur l’appareil
      </button>
      <p className={styles.hint}>
        Un vrai fichier, dans tes téléchargements : c’est lui qu’on donne, qu’on garde, et
        qu’on rouvre ici pour reprendre. Un pack inachevé s’enregistre aussi.
      </p>

      <label className={styles.open}>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className={styles.file}
          onChange={(event) => {
            void openFile(event);
          }}
        />
        <span className={styles.openLabel}>Ouvrir un fichier pour le reprendre</span>
      </label>
    </>
  );
}
