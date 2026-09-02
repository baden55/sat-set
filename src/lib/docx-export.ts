import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageOrientation,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

import { parseMarkdown, safeFileName, type Block } from "./md-blocks";

/** A4 portrait, margin 2 cm => 11906 - 2*1134 = 9638 twip. */
const WIDTH_PORTRAIT = 9638;
/** A4 landscape, margin 2 cm => 16838 - 2*1134 = 14570 twip. */
const WIDTH_LANDSCAPE = 14570;

function runs(text: string, font: string, half: number, bold = false): TextRun[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p) => {
    const m = /^\*\*(.+)\*\*$/.exec(p);
    return new TextRun({
      text: (m ? m[1]! : p).replace(/\*/g, ""),
      bold: bold || Boolean(m),
      font,
      size: half,
    });
  });
}

function cell(text: string, font: string, half: number, header: boolean, width: number) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "444444" };
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: border, bottom: border, left: border, right: border },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    ...(header ? { shading: { fill: "DBEAFE", type: ShadingType.CLEAR, color: "auto" } } : {}),
    children: [
      new Paragraph({
        alignment: header ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: runs(text, font, half, header),
        spacing: { before: 20, after: 20 },
      }),
    ],
  });
}

/** Lebar kolom proporsional terhadap panjang isi, dengan batas minimum. */
function columnWidths(head: string[], rows: string[][], cols: number, total: number) {
  const weights = Array.from({ length: cols }, (_, i) => {
    const lens = [head[i] ?? "", ...rows.map((r) => r[i] ?? "")].map((s) => s.length);
    const avg = lens.reduce((a, b) => a + b, 0) / Math.max(lens.length, 1);
    return Math.min(Math.max(avg, 6), 40);
  });
  const sum = weights.reduce((a, b) => a + b, 0);
  const widths = weights.map((w) => Math.max(Math.floor((w / sum) * total), 700));
  const diff = total - widths.reduce((a, b) => a + b, 0);
  widths[widths.length - 1] = widths[widths.length - 1]! + diff;
  return widths;
}

function blocksToChildren(blocks: Block[], font: string, half: number, contentWidth: number) {
  const children: (Paragraph | Table)[] = [];
  for (const b of blocks) {
    if (b.type === "heading") {
      children.push(
        new Paragraph({
          heading:
            b.level <= 1
              ? HeadingLevel.HEADING_1
              : b.level === 2
                ? HeadingLevel.HEADING_2
                : HeadingLevel.HEADING_3,
          alignment: b.level <= 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 200, after: 120 },
          keepNext: true,
          keepLines: true,
          children: runs(b.text, font, half + (b.level <= 1 ? 8 : b.level === 2 ? 4 : 2), true),
        }),
      );
    } else if (b.type === "paragraph") {
      children.push(
        new Paragraph({ spacing: { after: 80 }, children: runs(b.text, font, half) }),
      );
    } else if (b.type === "bullet") {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: runs(b.text, font, half),
        }),
      );
    } else if (b.type === "hr") {
      children.push(
        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 1 } },
          children: [],
        }),
      );
    } else {
      const cols = Math.max(b.head.length, ...b.rows.map((r) => r.length), 1);
      const widths = columnWidths(b.head, b.rows, cols, contentWidth);
      const tableHalf = cols >= 8 ? Math.max(half - 4, 14) : cols >= 5 ? Math.max(half - 2, 16) : half;
      const norm = (r: string[]) => Array.from({ length: cols }, (_, i) => r[i] ?? "");
      children.push(
        new Table({
          width: { size: contentWidth, type: WidthType.DXA },
          columnWidths: widths,
          layout: TableLayoutType.FIXED,
          rows: [
            new TableRow({
              tableHeader: true,
              cantSplit: true,
              children: norm(b.head).map((c, i) => cell(c, font, tableHalf, true, widths[i]!)),
            }),
            ...b.rows.map(
              (r) =>
                new TableRow({
                  cantSplit: true,
                  children: norm(r).map((c, i) => cell(c, font, tableHalf, false, widths[i]!)),
                }),
            ),
          ],
        }),
      );
      children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    }
  }
  if (!children.length) children.push(new Paragraph({ children: [] }));
  return children;
}

export async function downloadDocx(
  markdown: string,
  title: string,
  font = "Times New Roman",
  size = "12 pt",
) {
  const pt = Number.parseFloat(size.replace(/[^\d.]/g, "")) || 12;
  const half = Math.round(pt * 2);
  const blocks = parseMarkdown(markdown);
  const maxCols = blocks.reduce(
    (m, b) => (b.type === "table" ? Math.max(m, b.head.length) : m),
    0,
  );
  const landscape = maxCols >= 6;
  const contentWidth = landscape ? WIDTH_LANDSCAPE : WIDTH_PORTRAIT;
  const doc = new Document({
    styles: { default: { document: { run: { font, size: half } } } },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
              ...(landscape ? { orientation: PageOrientation.LANDSCAPE } : {}),
            },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children: blocksToChildren(blocks, font, half, contentWidth),
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeFileName(title)}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
