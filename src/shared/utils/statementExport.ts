import { jsPDF } from "jspdf";

/** Comparte un archivo via el share sheet nativo si esta disponible
 * (asi WhatsApp/etc. lo reciben como adjunto real, no como link); si no,
 * cae a una descarga normal. */
async function shareOrDownloadFile(file: File, downloadName: string) {
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string }) => Promise<void>;
  };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: file.name });
      return;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = downloadName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Arma un PDF simple (titulo + lineas de texto, con salto de pagina
 * automatico) a partir de las mismas lineas que ya se usan para compartir
 * como texto plano. */
export async function exportStatementPdf(title: string, lines: string[], filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, marginX, y);
  y += 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  for (const line of lines) {
    if (y > pageHeight - 48) {
      doc.addPage();
      y = 56;
    }
    if (line === "") {
      y += 10;
      continue;
    }
    doc.text(line, marginX, y);
    y += 16;
  }

  const blob = doc.output("blob");
  await shareOrDownloadFile(new File([blob], filename, { type: "application/pdf" }), filename);
}

/** Dibuja el mismo contenido como una imagen tipo "recibo" (fondo oscuro
 * consistente con el tema de la app) y la descarga/comparte como PNG. */
export async function exportStatementImage(title: string, lines: string[], filename: string) {
  const width = 720;
  const paddingX = 32;
  const lineHeight = 22;
  const emptyLineHeight = 12;
  const headerHeight = 92;
  const contentHeight = lines.reduce((h, l) => h + (l === "" ? emptyLineHeight : lineHeight), 0);
  const height = headerHeight + contentHeight + 32;

  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);

  ctx.fillStyle = "#12101f";
  ctx.fillRect(0, 0, width, height);

  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, "#5ff2ff");
  grad.addColorStop(0.55, "#00c8ff");
  grad.addColorStop(1, "#ff33d6");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, 6);

  ctx.fillStyle = "#f4f5fa";
  ctx.font = "600 22px system-ui, -apple-system, sans-serif";
  ctx.fillText(title, paddingX, 48);

  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(paddingX, 66);
  ctx.lineTo(width - paddingX, 66);
  ctx.stroke();

  let y = headerHeight;
  ctx.font = "13px system-ui, -apple-system, sans-serif";
  for (const line of lines) {
    if (line === "") {
      y += emptyLineHeight;
      continue;
    }
    const indented = line.startsWith("   ");
    ctx.fillStyle = indented ? "#a7abc4" : "#f0f1f7";
    ctx.fillText(line.trim(), paddingX + (indented ? 16 : 0), y);
    y += lineHeight;
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return;
  await shareOrDownloadFile(new File([blob], filename, { type: "image/png" }), filename);
}
