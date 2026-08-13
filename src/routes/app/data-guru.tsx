import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/use-profile";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/app/data-guru")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Data Guru — Guru Satset" },
      { name: "description", content: "Kelola identitas sekolah, guru, dan kepala sekolah." },
      { property: "og:title", content: "Data Guru — Guru Satset" },
      { property: "og:description", content: "Kelola identitas sekolah dan guru di Guru Satset." },
    ],
  }),
  component: DataGuruPage,
});

const FIELDS = [
  { key: "nama_sekolah", label: "Nama Sekolah" },
  { key: "alamat_sekolah", label: "Alamat Sekolah" },
  { key: "nama_guru", label: "Nama Guru" },
  { key: "nip_guru", label: "NIP Guru" },
  { key: "nama_kepala_sekolah", label: "Nama Kepala Sekolah" },
  { key: "nip_kepala_sekolah", label: "NIP Kepala Sekolah" },
] as const;

type FormState = Record<(typeof FIELDS)[number]["key"], string>;

const EMPTY: FormState = {
  nama_sekolah: "",
  alamat_sekolah: "",
  nama_guru: "",
  nip_guru: "",
  nama_kepala_sekolah: "",
  nip_kepala_sekolah: "",
};

function DataGuruPage() {
  const { session } = useSession();
  const userId = session?.user.id;
  const { data: profile, isLoading } = useProfile(userId);
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        nama_sekolah: profile.nama_sekolah ?? "",
        alamat_sekolah: profile.alamat_sekolah ?? "",
        nama_guru: profile.nama_guru ?? "",
        nip_guru: profile.nip_guru ?? "",
        nama_kepala_sekolah: profile.nama_kepala_sekolah ?? "",
        nip_kepala_sekolah: profile.nip_kepala_sekolah ?? "",
      });
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(form)
      .eq("id", userId);
    setSaving(false);
    if (error) {
      toast.error("Gagal menyimpan data: " + error.message);
      return;
    }
    toast.success("Data guru tersimpan");
    queryClient.invalidateQueries({ queryKey: ["profile", userId] });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Data Guru</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Data ini otomatis digunakan pada seluruh prompt AI di menu lainnya.
      </p>

      <Card className="mt-6 border-border/70 shadow-soft">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Memuat data…
            </div>
          ) : (
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={f.key}>{f.label}</Label>
                  <Input
                    id={f.key}
                    value={form[f.key]}
                    maxLength={200}
                    onChange={(e) => setForm((s) => ({ ...s, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Simpan Data
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
