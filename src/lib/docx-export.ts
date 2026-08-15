import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

import { parseMarkdown, safeFileName, type Block } from "./md-blocks";

const CONTENT_WIDTH = 9360;

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
  const border = { style: BorderStyle.SINGLE, size: 4, color: "666666" };
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: border, bottom: border, left: border, right: border },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    ...(header ? { shading: { fill: "DBEAFE", type: ShadingType.CLEAR, color: "auto" } } : {}),
    children: [
      new Paragraph({
        children: runs(text, font, half, header),
        spacing: { before: 20, after: 20 },
      }),
    ],
  });
}

function blocksToChildren(blocks: Block[], font: string, half: number) {
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
      const w = Math.floor(CONTENT_WIDTH / cols);
      const widths = Array.from({ length: cols }, (_, i) =>
        i === cols - 1 ? CONTENT_WIDTH - w * (cols - 1) : w,
      );
      const norm = (r: string[]) => Array.from({ length: cols }, (_, i) => r[i] ?? "");
      children.push(
        new Table({
          width: { size: CONTENT_WIDTH, type: WidthType.DXA },
          columnWidths: widths,
          rows: [
            new TableRow({
              tableHeader: true,
              children: norm(b.head).map((c, i) => cell(c, font, half, true, widths[i]!)),
            }),
            ...b.rows.map(
              (r) =>
                new TableRow({
                  children: norm(r).map((c, i) => cell(c, font, half, false, widths[i]!)),
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
  const doc = new Document({
    styles: { default: { document: { run: { font, size: half } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children: blocksToChildren(parseMarkdown(markdown), font, half),
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
