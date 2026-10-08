// salva-file.ts — salva un Blob come file scaricato dal browser (effetto sul DOM: sta in ui/, non in lib/).
export function salvaFile(dati: Blob, nomeFile: string): void {
  const url = URL.createObjectURL(dati);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeFile;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
}
