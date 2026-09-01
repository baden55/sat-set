import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { FieldSelect } from "@/components/FieldSelect";
import { GeneratorPanel } from "@/components/GeneratorPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KELAS_FASE, MATA_PELAJARAN, PENDEKATAN, SEMESTER } from "@/lib/constants";
import { generateAI } from "@/lib/attachments";
import { saveGeneration, useInvalidateHistory } from "@/lib/history";
import { promptRPM } from "@/lib/prompts";
import { useProfile } from "@/lib/use-profile";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/app/rpm")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "RPM — Rencana Pembelajaran Mendalam | Guru Satset" },
      {
        name: "description",
        content: "Susun Rencana Pembelajaran Mendalam lengkap dengan asesmen, rubrik, dan LKPD.",
      },
      { property: "og:title", content: "RPM — Guru Satset" },
      { property: "og:description", content: "Rencana Pembelajaran Mendalam otomatis dengan AI." },
    ],
  }),
  component: RpmPage,
});

function RpmPage() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const invalidateHistory = useInvalidateHistory();
  const [form, setForm] = useState({
    tanggal: "",
    mapel: "",
    kelasFase: "",
    semester: "",
    alokasiWaktu: "",
    pendekatan: "",
    materiPokok: "",
    cp: "",
    tp: "",
  });
  const [hasil, setHasil] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!profile?.nama_guru) {
      toast.error("Lengkapi Data Guru terlebih dahulu.");
      return;
    }
    if (!form.mapel || !form.kelasFase || !form.materiPokok) {
      toast.error("Mata Pelajaran, Kelas/Fase, dan Materi Pokok wajib diisi.");
      return;
    }
    setLoading(true);
    setHasil("");
    try {
      const teks = await generateAI(
        session?.access_token ?? "",
        promptRPM(profile, form),
        [],
        setHasil,
      );
      await saveGeneration(
        session?.user.id,
        "RPM",
        `RPM ${form.mapel} — ${form.materiPokok}`.trim(),
        typeof teks === "string" ? teks : "",
      );
      invalidateHistory(session?.user.id);
      toast.success("RPM berhasil dibuat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Rencana Pembelajaran Mendalam</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        RPM lengkap: dimensi profil lulusan, praktik pedagogis, asesmen, rubrik, dan LKPD.
      </p>

      <Card className="mt-6 border-border/70 shadow-soft">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <FieldSelect
            label="Mata Pelajaran"
            value={form.mapel}
            onChange={(v) => setForm((s) => ({ ...s, mapel: v }))}
            options={MATA_PELAJARAN}
          />
          <FieldSelect
            label="Kelas / Fase"
            value={form.kelasFase}
            onChange={(v) => setForm((s) => ({ ...s, kelasFase: v }))}
            options={KELAS_FASE}
          />
          <FieldSelect
            label="Semester"
            value={form.semester}
            onChange={(v) => setForm((s) => ({ ...s, semester: v }))}
            options={SEMESTER}
          />
          <FieldSelect
            label="Pendekatan Pembelajaran"
            value={form.pendekatan}
            onChange={(v) => setForm((s) => ({ ...s, pendekatan: v }))}
            options={PENDEKATAN}
          />
          <div className="space-y-2">
            <Label htmlFor="tanggal">Hari / Tanggal</Label>
            <Input
              id="tanggal"
              type="date"
              value={form.tanggal}
              onChange={(e) => setForm((s) => ({ ...s, tanggal: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alokasi">Alokasi Waktu</Label>
            <Input
              id="alokasi"
              value={form.alokasiWaktu}
              onChange={(e) => setForm((s) => ({ ...s, alokasiWaktu: e.target.value }))}
              placeholder="contoh: 2 x 35 menit"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="materi">Materi Pokok</Label>
            <Input
              id="materi"
              value={form.materiPokok}
              onChange={(e) => setForm((s) => ({ ...s, materiPokok: e.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cp">Capaian Pembelajaran</Label>
            <Textarea
              id="cp"
              rows={4}
              value={form.cp}
              onChange={(e) => setForm((s) => ({ ...s, cp: e.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tp">Tujuan Pembelajaran</Label>
            <Textarea
              id="tp"
              rows={4}
              value={form.tp}
              onChange={(e) => setForm((s) => ({ ...s, tp: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Button className="mt-4" size="lg" onClick={generate} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Generate RPM
      </Button>

      <GeneratorPanel hasil={hasil} loading={loading} filename="RPM" />
    </div>
  );
}
