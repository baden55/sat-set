import { useMemo, useState } from "react";
import { CheckCircle2, FileText, Loader2, Printer, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { downloadPdf, renderMarkdown } from "@/lib/doc-export";
import { downloadDocx } from "@/lib/docx-export";
import { splitDocuments } from "@/lib/md-blocks";

type Props = {
  hasil: string;
  loading: boolean;
  filename: string;
  font?: string;
  size?: string;
};

export function GeneratorPanel({ hasil, loading, filename, font, size }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const docs = useMemo(
    () => (hasil ? splitDocuments(hasil, filename.replace(/-/g, " ")) : []),
    [hasil, filename],
  );

  if (!hasil && !loading) return null;

  async function unduh(title: string, markdown: string) {
    setBusy(title);
    try {
      await downloadDocx(markdown, title, font, size);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="mt-6 border-border/70 shadow-soft">
      <CardContent className="p-5">
        <h3 className="mb-4 flex items-center gap-2 text-base font-semibold">
          <Sparkles className="size-4 text-primary" /> Hasil AI
        </h3>

        {loading && !hasil ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> AI sedang menyusun dokumen…
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60">
                  <tr>
                    <th className="p-3 text-left font-semibold">Dokumen</th>
                    <th className="p-3 text-left font-semibold">Status</th>
                    <th className="p-3 text-left font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.title} className="border-t border-border align-middle">
                      <td className="p-3 font-medium">{d.title}</td>
                      <td className="p-3">
                        {loading ? (
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Loader2 className="size-3.5 animate-spin" /> Sedang dibuat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-primary">
                            <CheckCircle2 className="size-3.5" /> Berhasil dibuat
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            disabled={loading || busy === d.title}
                            onClick={() => unduh(d.title, d.markdown)}
                          >
                            {busy === d.title ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <FileText className="size-4" />
                            )}
                            Download Word
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={loading}
                            onClick={() => downloadPdf(d.markdown, d.title, font, size)}
                          >
                            <Printer className="size-4" /> PDF
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-5">
              {docs.map((d) => (
                <div key={d.title}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Preview — {d.title}
                  </p>
                  <div
                    className="doc-preview max-h-[70vh] overflow-auto rounded-lg border border-border bg-card p-5 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(d.markdown) }}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {loading && hasil ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Menulis…
          </p>
        ) : null}
        {!loading && hasil ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="size-3" /> Setiap dokumen diunduh sebagai file Word (.docx)
            terpisah dan dapat diedit di Microsoft Word.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
