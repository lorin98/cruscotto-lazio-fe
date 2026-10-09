// nome-file.ts — nome di un file scaricato dal titolo di cio' che contiene: minuscole, lettere accentate senza accento,
// trattini al posto del resto ("Domande SIGC (RF012)" -> "domande-sigc-rf012.png"). Puro.
export function nomeFile(titolo: string, estensione: string): string {
  const base = titolo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'cruscotto'}.${estensione}`;
}
