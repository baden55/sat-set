import { Download, FileText, Loader2, Printer, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { downloadPdf, downloadWord, renderMarkdown } from "@/lib/doc-export";

type Props = {
  hasil: string;
  loading: boolean;
  filename: string;
  font?: string;
  size?: string;
};

export function GeneratorPanel({ hasil, loading, filename, font, size }: Props) {
  if (!hasil && !loading) return null;

  return (
    <Card className="mt-6 border-border/70 shadow-soft">
      <CardContent className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="size-4 text-primary" /> Hasil AI
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!hasil || loading}
              onClick={() => downloadWord(hasil, filename, font, size)}
            >
              <Download className="size-4" /> Word (.doc)
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!hasil || loading}
              onClick={() => downloadPdf(hasil, filename, font, size)}
            >
              <Printer className="size-4" /> PDF
            </Button>
          </div>
        </div>

        {loading && !hasil ? (
          <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> AI sedang menyusun dokumen…
          </div>
        ) : (
          <div
            className="doc-preview max-h-[70vh] overflow-auto rounded-lg border border-border bg-card p-5 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(hasil) }}
          />
        )}
        {loading && hasil ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Menulis…
          </p>
        ) : null}
        {!loading && hasil ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="size-3" /> Dokumen dapat diunduh lalu diedit di Microsoft Word.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}