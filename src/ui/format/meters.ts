/**
 * Les vitesses de D&D en mètres tombent sur des demis : 1,50, 7,50, 10,50.
 * `toLocaleString` écrit « 7,5 », les données écrivent « 7,50 ». Deux écritures
 * de la même distance à deux endroits de l'écran se lisent comme deux valeurs.
 */
export function formatMeters(value: number): string {
  return Number.isSafeInteger(value) ? String(value) : value.toFixed(2).replace('.', ',');
}
