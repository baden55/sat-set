import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, FileText, History, Loader2, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadPdf, renderMarkdown } from "@/lib/doc-export";
import { downloadDocx } from "@/lib/docx-export";
import { useHistory, type Generation } from "@/lib/history";
import { splitDocuments } from "@/lib/md-blocks";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/app/riwayat")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Riwayat Generate — Guru Satset" },
      {
        name: "description",
        content: "Lihat, buka kembali, dan unduh seluruh hasil generate AI milik akun Anda.",
      },
      { property: "og:title", content: "Riwayat Generate — Guru Satset" },
      { property: "og:description", content: "Semua hasil perangkat ajar Anda tersimpan rapi." },
    ],
  }),
  component: RiwayatPage,
});

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

function RiwayatPage() {
  const { session } = useSession();
  const { data, isLoading } = useHistory(session?.user.id);
  const [aktif, setAktif] = useState<Generation | null>(null);
  const docs = useMemo(
    () => (aktif ? splitDocuments(aktif.konten, aktif.judul) : []),
    [aktif],
  );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Riwayat</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Seluruh hasil generate milik akun Anda, tersimpan otomatis dan tetap tersedia setelah login
        kembali.
      </p>

      <Card className="mt-6 border-border/70 shadow-soft">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Memuat riwayat…
            </div>
          ) : !data?.length ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
              <History className="size-6 text-primary" />
              Belum ada riwayat. Hasil generate Anda akan otomatis tersimpan di sini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60">
                  <tr>
                    <th className="p-3 text-left font-semibold">Judul</th>
                    <th className="p-3 text-left font-semibold">Jenis</th>
                    <th className="p-3 text-left font-semibold">Waktu</th>
                    <th className="p-3 text-left font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((g) => (
                    <tr key={g.id} className="border-t border-border align-middle">
                      <td className="p-3 font-medium">{g.judul}</td>
                      <td className="p-3 text-muted-foreground">{g.jenis}</td>
                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                        {fmt(g.created_at)}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setAktif(g)}>
                            <Eye className="size-4" /> Lihat
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => downloadDocx(g.konten, g.judul)}
                          >
                            <FileText className="size-4" /> Word
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadPdf(g.konten, g.judul)}
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
          )}
        </CardContent>
      </Card>

      <Dialog open={!!aktif} onOpenChange={(o) => !o && setAktif(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-auto">
          <DialogHeader>
            <DialogTitle>{aktif?.judul}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {docs.map((d) => (
              <div key={d.title}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {d.title}
                  </p>
                  <Button size="sm" onClick={() => downloadDocx(d.markdown, d.title)}>
                    <FileText className="size-4" /> Word
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadPdf(d.markdown, d.title)}
                  >
                    <Printer className="size-4" /> PDF
                  </Button>
                </div>
                <div
                  className="doc-preview rounded-lg border border-border bg-card p-4 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(d.markdown) }}
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
