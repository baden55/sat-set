export type Attachment = { name: string; mediaType?: string; dataUrl?: string; text?: string };

import { sanitizeAiOutput } from "./sanitize-ai";

async function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function fileToAttachment(file: File, label?: string): Promise<Attachment> {
  const name = label ? `${label} — ${file.name}` : file.name;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "pdf") {
    return { name, mediaType: "application/pdf", dataUrl: await toDataUrl(file) };
  }
  if (ext === "docx" || ext === "doc") {
    try {
      const mammoth = await import("mammoth/mammoth.browser.js");
      const buf = await file.arrayBuffer();
      const res = await mammoth.extractRawText({ arrayBuffer: buf });
      return { name, text: res.value };
    } catch {
      return { name, text: "(Isi dokumen tidak dapat dibaca otomatis)" };
    }
  }
  if (["xlsx", "xls", "csv"].includes(ext)) {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const text = wb.SheetNames.map(
      (sheet) => `--- ${sheet} ---\n${XLSX.utils.sheet_to_csv(wb.Sheets[sheet]!)}`,
    ).join("\n\n");
    return { name, text };
  }
  if (file.type.startsWith("image/")) {
    return { name, mediaType: file.type, dataUrl: await toDataUrl(file) };
  }
  return { name, text: await file.text() };
}

export async function generateAI(
  token: string,
  prompt: string,
  attachments: Attachment[],
  onChunk: (text: string) => void,
) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ prompt, attachments }),
  });
  if (!res.ok || !res.body) {
    throw new Error((await res.text()) || "Gagal menghubungi AI");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onChunk(sanitizeAiOutput(full));
  }
  return sanitizeAiOutput(full);
}