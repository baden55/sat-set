import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpenCheck, FileSpreadsheet, GraduationCap, ListChecks, Sparkles } from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Guru Satset — Satu Aplikasi Untuk Semua Kebutuhan Guru" },
      {
        name: "description",
        content:
          "Guru Satset membantu guru menyusun perangkat ajar, RPM, dan soal asesmen secara otomatis dengan AI.",
      },
      { property: "og:title", content: "Guru Satset" },
      {
        property: "og:description",
        content: "Perangkat ajar, RPM, dan soal asesmen dalam hitungan menit dengan bantuan AI.",
      },
    ],
  }),
  component: Index,
});

const fitur = [
  { icon: GraduationCap, title: "Data Guru", desc: "Identitas sekolah, guru, dan kepala sekolah." },
  {
    icon: FileSpreadsheet,
    title: "Perangkat Ajar",
    desc: "Analisis CP, TP, ATP, Prota, Prosem, Minggu & Hari Efektif, KKTP.",
  },
  { icon: BookOpenCheck, title: "RPM", desc: "Rencana Pembelajaran Mendalam lengkap dengan LKPD." },
  { icon: ListChecks, title: "Buat Soal", desc: "Kisi-kisi dan soal sumatif beserta kunci jawaban." },
];

function Index() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-3">
          <BrandLogo className="size-11" />
          <div>
            <p className="text-brand text-lg leading-tight font-extrabold">Guru Satset</p>
            <p className="text-[11px] text-muted-foreground">
              Satu Aplikasi Untuk Semua Kebutuhan Guru
            </p>
          </div>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Masuk</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20">
        <section className="relative overflow-hidden rounded-3xl border border-border/70 p-8 shadow-soft sm:p-14">
          <div className="bg-brand absolute inset-0 opacity-10" />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
              <Sparkles className="size-3 text-primary" /> Terintegrasi AI
            </span>
            <h1 className="mt-5 text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">
              Semua administrasi guru, selesai <span className="text-brand">satset</span>.
            </h1>
            <p className="mt-4 text-base text-muted-foreground">
              Susun perangkat ajar, Rencana Pembelajaran Mendalam, dan soal asesmen sesuai Kurikulum
              Merdeka — lengkap, rapi, siap diunduh ke Word maupun PDF.
            </p>
            <Button asChild size="lg" className="mt-7">
              <Link to="/auth">Mulai Sekarang</Link>
            </Button>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fitur.map((f) => (
            <Card key={f.title} className="border-border/70 shadow-soft">
              <CardContent className="p-5">
                <div className="bg-brand flex size-10 items-center justify-center rounded-xl">
                  <f.icon className="size-5 text-primary-foreground" />
                </div>
                <h2 className="mt-4 font-semibold">{f.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Copyright@2026 - Kang Baden
      </footer>
    </div>
  );
}
