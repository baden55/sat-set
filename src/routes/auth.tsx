import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapSuperadmin } from "@/lib/admin.functions";
import { nipToEmail } from "@/lib/nip";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — Guru Satset" },
      {
        name: "description",
        content: "Masuk ke Guru Satset dengan NIP dan password untuk mengakses perangkat ajar AI.",
      },
      { property: "og:title", content: "Masuk — Guru Satset" },
      { property: "og:description", content: "Satu aplikasi untuk semua kebutuhan guru." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bootstrapSuperadmin().catch(() => undefined);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app/data-guru" });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{8,}$/.test(nip)) {
      toast.error("Username/NIP harus berupa angka minimal 8 digit");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: nipToEmail(nip),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("Login gagal. Periksa NIP dan password Anda.");
      return;
    }
    toast.success("Selamat datang di Guru Satset");
    navigate({ to: "/app/data-guru" });
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="bg-brand absolute inset-0 opacity-10" />
      <Card className="relative w-full max-w-md border-border/70 shadow-soft">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <BrandLogo className="size-24" />
            <h1 className="text-brand mt-4 text-3xl font-extrabold tracking-tight">Guru Satset</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Satu Aplikasi Untuk Semua Kebutuhan Guru
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nip">Username (NIP / minimal 8 angka)</Label>
              <Input
                id="nip"
                inputMode="numeric"
                value={nip}
                onChange={(e) => setNip(e.target.value.replace(/\D/g, ""))}
                placeholder="contoh: 19800101"
                maxLength={30}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
              Masuk
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Akun dibuat oleh SuperAdmin. Hubungi admin sekolah bila belum memiliki akun.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}