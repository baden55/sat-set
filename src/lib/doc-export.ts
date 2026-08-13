function mdToHtml(md: string): string {
  const lines = md.replace(/\r/g, "").split("\n");
  const out: string[] = [];
  let tableRows: string[][] = [];

  const inline = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

  const flushTable = () => {
    if (!tableRows.length) return;
    const [head, ...rest] = tableRows;
    out.push(
      `<table><thead><tr>${head!.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>` +
        rest
          .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
          .join("") +
        `</tbody></table>`,
    );
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
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = Math.min(h[1]!.length + 1, 6);
      out.push(`<h${level}>${inline(h[2]!)}</h${level}>`);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      out.push(`<p style="margin-left:18px">• ${inline(line.replace(/^\s*[-*]\s+/, ""))}</p>`);
      continue;
    }
    out.push(`<p>${inline(line)}</p>`);
  }
  flushTable();
  return out.join("\n");
}

function wrapHtml(title: string, body: string, font = "Times New Roman", size = "12pt") {
  return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${title}</title>
<style>
@page { size: A4; margin: 2cm; }
body { font-family: '${font}', serif; font-size: ${size}; color: #000; }
h2,h3,h4 { font-family: '${font}', serif; }
table { border-collapse: collapse; width: 100%; margin: 8px 0; }
th, td { border: 1px solid #333; padding: 6px; vertical-align: top; font-size: ${size}; }
th { background: #dbeafe; }
</style></head><body>${body}</body></html>`;
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function renderMarkdown(md: string) {
  return mdToHtml(md);
}

export function downloadWord(md: string, filename: string, font?: string, size?: string) {
  const html = wrapHtml(filename, mdToHtml(md), font, size);
  download(new Blob(["\ufeff", html], { type: "application/msword" }), `${filename}.doc`);
}

export function downloadPdf(md: string, filename: string, font?: string, size?: string) {
  const html = wrapHtml(filename, mdToHtml(md), font, size);
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}