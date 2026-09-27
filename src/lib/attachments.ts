import { sanitizeAiOutput } from "./sanitize-ai";

export type Attachment = { name: string; mediaType?: string; dataUrl?: string; text?: string };

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

const CACHE_PREFIX = "gs-ai-cache:";
const CACHE_MAX = 30;
const inflight = new Map<string, Promise<string>>();
const shownThisSession = new Set<string>();

async function hashRequest(prompt: string, attachments: Attachment[]) {
  const raw = JSON.stringify([
    prompt,
    attachments.map((a) => [a.name, a.mediaType ?? "", a.dataUrl ?? "", a.text ?? ""]),
  ]);
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readCache(key: string): string | null {
  try {
    return localStorage.getItem(CACHE_PREFIX + key);
  } catch {
    return null;
  }
}

function writeCache(key: string, value: string) {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_PREFIX));
    if (keys.length >= CACHE_MAX) {
      keys.slice(0, keys.length - CACHE_MAX + 1).forEach((k) => localStorage.removeItem(k));
    }
    localStorage.setItem(CACHE_PREFIX + key, value);
  } catch {
    /* storage penuh — abaikan cache */
  }
}

async function requestAI(
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
  const hasil = sanitizeAiOutput(full);
  if (!hasil.trim()) {
    throw new Error(
      "AI tidak mengirimkan hasil. Kemungkinan kuota/kredit AI habis. Silakan isi ulang kredit lalu coba lagi.",
    );
  }
  return hasil;
}

/**
 * Generate dengan cache: input & lampiran identik memakai hasil tersimpan
 * (tanpa kredit AI), dan klik ganda saat proses berjalan tidak membuat request baru.
 */
export async function generateAI(
  token: string,
  prompt: string,
  attachments: Attachment[],
  onChunk: (text: string) => void,
) {
  const key = await hashRequest(prompt, attachments);
  // Klik Generate ulang pada input yang sama di sesi ini = minta hasil baru.
  const cached = shownThisSession.has(key) ? null : readCache(key);
  shownThisSession.add(key);
  if (cached && cached.trim()) {
    onChunk(cached);
    return cached;
  }
  const running = inflight.get(key);
  if (running) {
    const r = await running;
    onChunk(r);
    return r;
  }
  const p = requestAI(token, prompt, attachments, onChunk)
    .then((hasil) => {
      writeCache(key, hasil);
      return hasil;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}