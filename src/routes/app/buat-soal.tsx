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
import {
  FONT_LIST,
  FONT_SIZE,
  JENIS_ASESMEN,
  JENJANG,
  KELAS_FASE,
  MATA_PELAJARAN,
} from "@/lib/constants";
import { generateAI } from "@/lib/attachments";
import { promptSoal } from "@/lib/prompts";
import { useProfile } from "@/lib/use-profile";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/app/buat-soal")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Buat Soal & Kisi-Kisi — Guru Satset" },
      {
        name: "description",
        content: "Buat kisi-kisi dan soal asesmen lengkap dengan kunci jawaban dan penskoran.",
      },
      { property: "og:title", content: "Buat Soal — Guru Satset" },
      { property: "og:description", content: "Kisi-kisi dan soal asesmen otomatis dengan AI." },
    ],
  }),
  component: BuatSoalPage,
});

function BuatSoalPage() {
  const { session } = useSession();
  const { data: profile } = useProfile(session?.user.id);
  const [form, setForm] = useState({
    jenjang: "",
    mapel: "",
    kelasFase: "",
    jenisAsesmen: "",
    tanggal: "",
    font: "Times New Roman",
    ukuranFont: "12 pt",
    tp: "",
    pg: 15,
    isian: 5,
    esai: 5,
  });
  const [hasil, setHasil] = useState("");
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!profile?.nama_guru) {
      toast.error("Lengkapi Data Guru terlebih dahulu.");
      return;
    }
    if (!form.mapel || !form.kelasFase || !form.tp.trim()) {
      toast.error("Mata Pelajaran, Kelas/Fase, dan Tujuan Pembelajaran wajib diisi.");
      return;
    }
    setLoading(true);
    setHasil("");
    try {
      await generateAI(session?.access_token ?? "", promptSoal(profile, form), [], setHasil);
      toast.success("Kisi-kisi dan soal berhasil dibuat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  const num = (k: "pg" | "isian" | "esai", label: string) => (
    <div className="space-y-2" key={k}>
      <Label htmlFor={k}>{label}</Label>
      <Input
        id={k}
        type="number"
        min={0}
        max={50}
        value={form[k]}
        onChange={(e) => setForm((s) => ({ ...s, [k]: Number(e.target.value) }))}
      />
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Buat Soal</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Kisi-kisi dan naskah soal dengan kunci jawaban serta pedoman penskoran.
      </p>

      <Card className="mt-6 border-border/70 shadow-soft">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <FieldSelect
            label="Jenjang"
            value={form.jenjang}
            onChange={(v) => setForm((s) => ({ ...s, jenjang: v }))}
            options={JENJANG}
          />
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
            label="Jenis Asesmen"
            value={form.jenisAsesmen}
            onChange={(v) => setForm((s) => ({ ...s, jenisAsesmen: v }))}
            options={JENIS_ASESMEN}
          />
          <div className="space-y-2">
            <Label htmlFor="tgl">Tanggal Ulangan</Label>
            <Input
              id="tgl"
              type="date"
              value={form.tanggal}
              onChange={(e) => setForm((s) => ({ ...s, tanggal: e.target.value }))}
            />
          </div>
          <FieldSelect
            label="Jenis Huruf"
            value={form.font}
            onChange={(v) => setForm((s) => ({ ...s, font: v }))}
            options={FONT_LIST}
          />
          <FieldSelect
            label="Ukuran Huruf"
            value={form.ukuranFont}
            onChange={(v) => setForm((s) => ({ ...s, ukuranFont: v }))}
            options={FONT_SIZE}
          />
          {num("pg", "Jumlah Pilihan Ganda")}
          {num("isian", "Jumlah Isian Singkat")}
          {num("esai", "Jumlah Uraian/Esai")}
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tp">Tujuan Pembelajaran</Label>
            <Textarea
              id="tp"
              rows={5}
              value={form.tp}
              onChange={(e) => setForm((s) => ({ ...s, tp: e.target.value }))}
              placeholder="Tuliskan TP yang menjadi acuan soal…"
            />
          </div>
        </CardContent>
      </Card>

      <Button className="mt-4" size="lg" onClick={generate} disabled={loading}>
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Generate Kisi-Kisi & Soal
      </Button>

      <GeneratorPanel
        hasil={hasil}
        loading={loading}
        filename="Kisi-Kisi-dan-Soal"
        font={form.font}
        size={form.ukuranFont}
      />
    </div>
  );
}
