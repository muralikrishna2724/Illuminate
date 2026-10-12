import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * Renders simple tables to a PDF (A4; landscape when there are many columns),
 * with wrapped cells, the header repeated on every page and page numbers.
 * Uses the built-in Helvetica, so characters it can't draw are replaced.
 */

export interface PdfTableSection {
  heading?: string;
  header: string[];
  rows: Array<Array<string | number | null | undefined>>;
}

export interface PdfTableDocument {
  title: string;
  subtitle?: string;
  sections: PdfTableSection[];
}

const MARGIN = 36;
const CELL_PAD_X = 4;
const CELL_PAD_Y = 3;
const INK = rgb(0.13, 0.13, 0.13);
const MUTED = rgb(0.32, 0.36, 0.4);
const RULE = rgb(0.8, 0.84, 0.9);
const HEADER_FILL = rgb(0.93, 0.95, 0.98);

/** Keeps only characters Helvetica (WinAnsi) can encode. */
function safeText(font: PDFFont, value: string): string {
  let out = "";
  for (const ch of value.replace(/₹/g, "Rs. ").replace(/\s+/g, " ")) {
    try {
      font.encodeText(ch);
      out += ch;
    } catch {
      out += "?";
    }
  }
  return out.trim();
}

function wrap(font: PDFFont, size: number, text: string, width: number): string[] {
  if (!text) return [""];
  const lines: string[] = [];
  let line = "";
  const push = (word: string) => {
    // Break words longer than the column.
    let w = word;
    while (font.widthOfTextAtSize(w, size) > width && w.length > 1) {
      let cut = w.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(w.slice(0, cut), size) > width) cut--;
      lines.push(w.slice(0, cut));
      w = w.slice(cut);
    }
    return w;
  };
  for (const word of text.split(" ")) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = push(word);
    }
  }
  lines.push(line);
  return lines;
}

/** Column widths from content length, within the page width. */
function columnWidths(font: PDFFont, size: number, header: string[], rows: string[][], total: number): number[] {
  const natural = header.map((h, c) => {
    const longest = Math.max(
      font.widthOfTextAtSize(h, size),
      ...rows.slice(0, 500).map((r) => font.widthOfTextAtSize(r[c] ?? "", size)),
    );
    return Math.min(longest + CELL_PAD_X * 2, total * 0.45);
  });
  const sum = natural.reduce((a, b) => a + b, 0);
  if (sum <= total) {
    // Give the spare width to the widest columns.
    const spare = total - sum;
    return natural.map((w) => w + (spare * w) / sum);
  }
  const min = Math.min(60, total / header.length);
  const scaled = natural.map((w) => Math.max(min, (w * total) / sum));
  const scaledSum = scaled.reduce((a, b) => a + b, 0);
  return scaled.map((w) => (w * total) / scaledSum);
}

export async function renderTablePdf(doc: PdfTableDocument): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(doc.title);
  pdf.setProducer("INNOVENTRA admin");
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const maxColumns = Math.max(...doc.sections.map((s) => s.header.length), 1);
  const landscape = maxColumns > 6;
  const [pageW, pageH] = landscape ? [841.89, 595.28] : [595.28, 841.89];
  const size = maxColumns > 14 ? 6.5 : maxColumns > 8 ? 8 : 10;
  const lineH = size * 1.25;
  const usable = pageW - MARGIN * 2;

  const pages: PDFPage[] = [];
  let page!: PDFPage;
  let y = 0;
  const newPage = () => {
    page = pdf.addPage([pageW, pageH]);
    pages.push(page);
    y = pageH - MARGIN;
  };
  newPage();

  page.drawText(safeText(bold, doc.title), { x: MARGIN, y: y - 16, size: 16, font: bold, color: INK });
  y -= 24;
  if (doc.subtitle) {
    page.drawText(safeText(font, doc.subtitle), { x: MARGIN, y: y - 10, size: 9.5, font, color: MUTED });
    y -= 18;
  }
  y -= 6;

  for (const section of doc.sections) {
    const header = section.header.map((h) => safeText(bold, h));
    const rows = section.rows.map((r) => header.map((_, c) => safeText(font, r[c] == null ? "" : String(r[c]))));
    const widths = columnWidths(font, size, header, rows, usable);

    const drawRow = (cells: string[], f: PDFFont, fill?: ReturnType<typeof rgb>) => {
      const wrapped = cells.map((cell, c) => wrap(f, size, cell, (widths[c] ?? 0) - CELL_PAD_X * 2));
      const height = Math.max(...wrapped.map((l) => l.length)) * lineH + CELL_PAD_Y * 2;
      if (fill) page.drawRectangle({ x: MARGIN, y: y - height, width: usable, height, color: fill });
      let x = MARGIN;
      wrapped.forEach((lines, c) => {
        lines.forEach((line, i) => {
          page.drawText(line, { x: x + CELL_PAD_X, y: y - CELL_PAD_Y - (i + 1) * lineH + size * 0.25, size, font: f, color: INK });
        });
        x += widths[c] ?? 0;
      });
      y -= height;
      page.drawLine({ start: { x: MARGIN, y }, end: { x: MARGIN + usable, y }, thickness: 0.6, color: RULE });
      return height;
    };
    const rowHeight = (cells: string[], f: PDFFont) =>
      Math.max(...cells.map((cell, c) => wrap(f, size, cell, (widths[c] ?? 0) - CELL_PAD_X * 2).length)) * lineH + CELL_PAD_Y * 2;

    const headingH = section.heading ? 26 : 0;
    // Keep a heading with its header and first row.
    if (y - headingH - rowHeight(header, bold) - (rows[0] ? rowHeight(rows[0], font) : 0) < MARGIN + 20) newPage();
    if (section.heading) {
      page.drawText(safeText(bold, section.heading), { x: MARGIN, y: y - 16, size: 12.5, font: bold, color: INK });
      y -= headingH;
    }
    drawRow(header, bold, HEADER_FILL);
    if (rows.length === 0) {
      page.drawText("No entries.", { x: MARGIN + CELL_PAD_X, y: y - lineH, size, font, color: MUTED });
      y -= lineH + 6;
    }
    for (const row of rows) {
      if (y - rowHeight(row, font) < MARGIN + 20) {
        newPage();
        drawRow(header, bold, HEADER_FILL);
      }
      drawRow(row, font);
    }
    y -= 18;
  }

  pages.forEach((p, i) => {
    const label = `${i + 1} / ${pages.length}`;
    p.drawText(label, { x: pageW - MARGIN - font.widthOfTextAtSize(label, 8), y: MARGIN / 2, size: 8, font, color: MUTED });
    p.drawText(safeText(font, doc.title), { x: MARGIN, y: MARGIN / 2, size: 8, font, color: MUTED });
  });

  return pdf.save();
}
