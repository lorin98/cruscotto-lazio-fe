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

/** Blob da un data URL (base64 o testo codificato per URL): l'immagine di un grafico si salva con salvaFile. */
export function blobDaDataUrl(dataUrl: string): Blob {
  const virgola = dataUrl.indexOf(',');
  const intestazione = dataUrl.slice('data:'.length, virgola);
  const corpo = dataUrl.slice(virgola + 1);
  const tipo = intestazione.split(';')[0] || 'application/octet-stream';
  if (!intestazione.endsWith(';base64')) return new Blob([decodeURIComponent(corpo)], { type: tipo });
  const binario = atob(corpo);
  return new Blob([Uint8Array.from(binario, (c) => c.charCodeAt(0))], { type: tipo });
}
