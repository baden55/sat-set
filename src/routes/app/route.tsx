import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  BookOpenCheck,
  ExternalLink,
  FileSpreadsheet,
  FolderDown,
  GraduationCap,
  History,
  KeyRound,
  ListChecks,
  Loader2,
  LogOut,
  Menu,
  Wrench,
  Users,
} from "lucide-react";

import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useIsSuperadmin } from "@/lib/use-profile";
import { useSession } from "@/lib/use-session";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({
  ssr: false,
  component: AppLayout,
});

const menus = [
  { to: "/app/data-guru", label: "Data Guru", icon: GraduationCap },
  { to: "/app/perangkat-ajar", label: "Perangkat Ajar", icon: FileSpreadsheet },
  { to: "/app/rpm", label: "RPM", icon: BookOpenCheck },
  { to: "/app/buat-soal", label: "Buat Soal", icon: ListChecks },
  { to: "/app/riwayat", label: "Riwayat", icon: History },
  { to: "/app/ganti-password", label: "Ganti Password", icon: KeyRound },
] as const;

const externalMenus = [
  { href: "https://lynk.id/baden", label: "Tools", icon: Wrench },
  {
    href: "https://drive.google.com/drive/folders/19cV1D7SNmrDvrPNuZMN2CIJosl0HLJhZ?usp=sharing",
    label: "Download Template",
    icon: FolderDown,
  },
] as const;

function AppLayout() {
  const { session, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = useIsSuperadmin(session?.user.id).data;

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  useEffect(() => setOpen(false), [pathname]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const items = isAdmin
    ? [...menus, { to: "/app/admin", label: "Kelola Akun", icon: Users } as const]
    : menus;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <BrandLogo className="size-10" />
            <div>
              <p className="text-brand text-base leading-tight font-extrabold">Guru Satset</p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                Satu Aplikasi Untuk Semua Kebutuhan Guru
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={signOut} className="hidden sm:inline-flex">
              <LogOut className="size-4" /> Keluar
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Buka menu"
            >
              <Menu className="size-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6">
        <aside
          className={cn(
            "w-full shrink-0 lg:block lg:w-60",
            open ? "block" : "hidden",
            "absolute inset-x-4 top-[72px] z-20 rounded-2xl border border-border bg-card p-3 shadow-soft lg:static lg:inset-auto lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none",
          )}
        >
          <nav className="flex flex-col gap-1">
            {items.map((m) => (
              <Link
                key={m.to}
                to={m.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === m.to
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary",
                )}
              >
                <m.icon className="size-4" />
                {m.label}
              </Link>
            ))}
            {externalMenus.map((m) => (
              <a
                key={m.href}
                href={m.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <m.icon className="size-4" />
                <span className="flex-1">{m.label}</span>
                <ExternalLink className="size-3.5 text-muted-foreground" />
              </a>
            ))}
            <Button variant="outline" size="sm" onClick={signOut} className="mt-2 sm:hidden">
              <LogOut className="size-4" /> Keluar
            </Button>
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        Copyright@2026 - Kang Baden
      </footer>
    </div>
  );
}