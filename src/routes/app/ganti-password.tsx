import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/app/ganti-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ganti Password — Guru Satset" },
      {
        name: "description",
        content: "Ubah password akun Guru Satset Anda dengan aman melalui verifikasi password lama.",
      },
      { property: "og:title", content: "Ganti Password — Guru Satset" },
      { property: "og:description", content: "Kelola keamanan akun Guru Satset Anda." },
    ],
  }),
  component: GantiPasswordPage,
});

function GantiPasswordPage() {
  const { session } = useSession();
  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const email = session?.user.email;
    if (!email) {
      toast.error("Sesi tidak ditemukan. Silakan masuk kembali.");
      return;
    }
    if (baru.length < 6) {
      toast.error("Password baru minimal 6 karakter.");
      return;
    }
    if (baru !== konfirmasi) {
      toast.error("Password baru dan konfirmasi password tidak sama.");
      return;
    }
    if (baru === lama) {
      toast.error("Password baru harus berbeda dengan password lama.");
      return;
    }
    setLoading(true);
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: lama,
    });
    if (verifyError) {
      setLoading(false);
      toast.error("Password lama salah.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: baru });
    setLoading(false);
    if (error) {
      toast.error(error.message || "Gagal mengganti password.");
      return;
    }
    setLama("");
    setBaru("");
    setKonfirmasi("");
    toast.success("Password berhasil diganti. Gunakan password baru saat login berikutnya.");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Ganti Password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Verifikasi password lama Anda, lalu tentukan password baru.
      </p>

      <Card className="mt-6 max-w-lg border-border/70 shadow-soft">
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lama">Password Lama</Label>
              <Input
                id="lama"
                type="password"
                value={lama}
                onChange={(e) => setLama(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baru">Password Baru</Label>
              <Input
                id="baru"
                type="password"
                value={baru}
                onChange={(e) => setBaru(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="konfirmasi">Konfirmasi Password Baru</Label>
              <Input
                id="konfirmasi"
                type="password"
                value={konfirmasi}
                onChange={(e) => setKonfirmasi(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              Ganti Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
