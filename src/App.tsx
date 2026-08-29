import styles from './App.module.css';

export default function App() {
  return (
    <div className={styles.page}>
      <main className={styles.intro}>
        <h1 className={styles.title}>Aventurine</h1>
        <p className={styles.lead}>
          Crée ton personnage de D&amp;D 5e en français, depuis ton téléphone.
        </p>
        <p className={styles.attribution}>
          Contenu dérivé du SRD 5.1 © Wizards of the Coast, licence CC BY 4.0. Aventurine
          n’est pas affilié à Wizards of the Coast ni à D&amp;D Beyond.
        </p>
      </main>
    </div>
  );
}
