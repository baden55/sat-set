import { sanitizeAiOutput } from "./sanitize-ai";

export type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string }
  | { type: "hr" }
  | { type: "table"; head: string[]; rows: string[][] };

export function parseMarkdown(src: string): Block[] {
  const md = sanitizeAiOutput(src);
  const lines = md.replace(/\r/g, "").split("\n");
  const out: Block[] = [];
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (!tableRows.length) return;
    const [head, ...rest] = tableRows;
    out.push({ type: "table", head: head!, rows: rest });
    tableRows = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue;
      tableRows.push(cells);
      continue;
    }
    flushTable();
    if (!line.trim()) continue;
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      out.push({ type: "hr" });
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      out.push({ type: "heading", level: h[1]!.length, text: h[2]!.trim() });
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      out.push({ type: "bullet", text: line.replace(/^\s*[-*]\s+/, "") });
      continue;
    }
    out.push({ type: "paragraph", text: line.trim() });
  }
  flushTable();
  return out;
}

export type DocSection = { title: string; markdown: string };

/** Memecah output AI menjadi beberapa dokumen berdasarkan judul tertinggi. */
export function splitDocuments(src: string, fallbackTitle: string): DocSection[] {
  const md = sanitizeAiOutput(src);
  const lines = md.replace(/\r/g, "").split("\n");
  const headings: { idx: number; level: number; text: string }[] = [];
  let inTable = false;
  lines.forEach((line, idx) => {
    if (/^\s*\|.*\|\s*$/.test(line)) {
      inTable = true;
      return;
    }
    if (!line.trim()) inTable = false;
    if (inTable) return;
    const h = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    if (h && h[2]!.trim()) headings.push({ idx, level: h[1]!.length, text: h[2]!.trim() });
  });

  if (!headings.length) return [{ title: fallbackTitle, markdown: md }];
  const top = Math.min(...headings.map((h) => h.level));
  const tops = headings.filter((h) => h.level === top);
  if (tops.length < 2) return [{ title: cleanTitle(tops[0]?.text ?? fallbackTitle), markdown: md }];

  const docs: DocSection[] = [];
  tops.forEach((h, i) => {
    const end = i + 1 < tops.length ? tops[i + 1]!.idx : lines.length;
    const body = lines.slice(h.idx, end).join("\n").trim();
    if (body) docs.push({ title: cleanTitle(h.text), markdown: body });
  });
  return docs.length ? docs : [{ title: fallbackTitle, markdown: md }];
}

export function cleanTitle(raw: string) {
  return raw
    .replace(/\*\*/g, "")
    .replace(/^\d+[.)]\s*/, "")
    .replace(/[:.]\s*$/, "")
    .trim();
}

export function safeFileName(title: string) {
  return (
    title
      .replace(/[\\/:*?"<>|]/g, "-")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 90) || "Dokumen"
  );
}
