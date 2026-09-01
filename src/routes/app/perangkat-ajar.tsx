import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { FieldSelect } from "@/components/FieldSelect";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BERKAS_PERANGKAT, KELAS_FASE, MATA_PELAJARAN, SISTEM_SEKOLAH } from "@/lib/constants";
import { fileToAttachment, generateAI, type Attachment } from "@/lib/attachments";
import { saveGeneration, useInvalidateHistory } from "@/lib/history";
import { promptPerangkatAjar } from "@/lib/prompts";
import {
  deleteUserFile,
  downloadUserFile,
  uploadUserFile,
  useUserFiles,
} from "@/lib/user-files";
import { useProfile } from "@/lib/use-profile";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/app/perangkat-ajar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Perangkat Ajar AI — Guru Satset" },
      {
        name: "description",
        content: "Generate Analisis CP, TP, ATP, Prota, Prosem, Minggu & Hari Efektif, dan KKTP.",
      },
      { property: "og:title", content: "Perangkat Ajar AI — Guru Satset" },
      { property: "og:description", content: "Perangkat ajar lengkap Kurikulum Merdeka dengan AI." },
    ],
  }),
  component: PerangkatAjarPage,
});

function PerangkatAjarPage() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const [form, setForm] = useState({
    kelasFase: "",
    mapel: "",
    jpMinggu: "",
    jpTahun: "",
    sistemSekolah: "",
  });
  const [hasil, setHasil] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const invalidateHistory = useInvalidateHistory();
  const userId = session?.user.id;
  const { data: saved, refetch } = useUserFiles(userId, BERKAS_PERANGKAT);

  async function onPick(label: string, file: File | null) {
    if (!file || !userId) return;
    setBusyLabel(label);
    try {
      await uploadUserFile(userId, label, file);
      await refetch();
      toast.success(`${label} tersimpan di akun Anda`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengunggah file");
    } finally {
      setBusyLabel(null);
    }
  }

  async function onDelete(label: string, path: string) {
    setBusyLabel(label);
    try {
      await deleteUserFile(path);
      await refetch();
      toast.success(`${label} dihapus`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus file");
    } finally {
      setBusyLabel(null);
    }
  }


  async function generate() {
    if (!profile?.nama_guru) {
      toast.error("Lengkapi Data Guru terlebih dahulu.");
      return;
    }
    if (!form.kelasFase || !form.mapel) {
      toast.error("Kelas/Fase dan Mata Pelajaran wajib dipilih.");
      return;
    }
    setLoading(true);
    setHasil("");
    try {
      const attachments: Attachment[] = [];
      for (const label of BERKAS_PERANGKAT) {
        const stored = saved?.[label];
        if (!stored) continue;
        try {
          attachments.push(await fileToAttachment(await downloadUserFile(stored), label));
        } catch {
          /* lewati file yang gagal dibaca */
        }
      }
      const token = session?.access_token ?? "";
      const teks = await generateAI(
        token,
        promptPerangkatAjar(profile, form),
        attachments,
        setHasil,
      );
      await saveGeneration(
        userId,
        "Perangkat Ajar",
        `Perangkat Ajar ${form.mapel} ${form.kelasFase}`.trim(),
        teks,
      );
      invalidateHistory(userId);
      toast.success("Perangkat ajar berhasil dibuat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Perangkat Ajar</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Analisis CP, TP, ATP, Prota, Prosem, Minggu Efektif, Hari Efektif, dan KKTP dalam sekali
        proses.
      </p>

      <Card className="mt-6 border-border/70 shadow-soft">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <FieldSelect
            label="Kelas / Fase"
            value={form.kelasFase}
            onChange={(v) => setForm((s) => ({ ...s, kelasFase: v }))}
            options={KELAS_FASE}
          />
          <FieldSelect
            label="Mata Pelajaran"
            value={form.mapel}
            onChange={(v) => setForm((s) => ({ ...s, mapel: v }))}
            options={MATA_PELAJARAN}
          />
          <div className="space-y-2">
            <Label htmlFor="jpm">Jumlah JP per Minggu</Label>
            <Input
              id="jpm"
              value={form.jpMinggu}
              onChange={(e) => setForm((s) => ({ ...s, jpMinggu: e.target.value }))}
              placeholder="contoh: 4 JP"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jpt">Total JP per Tahun</Label>
            <Input
              id="jpt"
              value={form.jpTahun}
              onChange={(e) => setForm((s) => ({ ...s, jpTahun: e.target.value }))}
              placeholder="contoh: 144 JP"
            />
          </div>
          <FieldSelect
            label="Sistem Sekolah"
            value={form.sistemSekolah}
            onChange={(v) => setForm((s) => ({ ...s, sistemSekolah: v }))}
            options={SISTEM_SEKOLAH}
          />
        </CardContent>
      </Card>

      <Card className="mt-4 border-border/70 shadow-soft">
        <CardContent className="p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Upload className="size-4 text-primary" /> Lampiran Format & Dokumen (opsional)
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Unggah PDF, Word, atau Excel agar hasil AI mengikuti format sekolah Anda.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {BERKAS_PERANGKAT.map((label) => (
              <div key={label} className="space-y-2">
                <Label className="text-xs">{label}</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
                  onChange={(e) =>
                    setFiles((s) => ({ ...s, [label]: e.target.files?.[0] ?? null }))
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button className="mt-4" size="lg" onClick={generate} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Generate Perangkat Ajar
      </Button>

      <GeneratorPanel hasil={hasil} loading={loading} filename="Perangkat-Ajar" />
    </div>
  );
}
