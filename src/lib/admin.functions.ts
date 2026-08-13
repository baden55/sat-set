import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { nipToEmail } from "@/lib/nip";

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "superadmin",
    });
    if (!isAdmin) throw new Error("Akses ditolak");

    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, nip, nama_guru, nama_sekolah, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: roles } = await context.supabase.from("user_roles").select("user_id, role");
    return (data ?? []).map((p) => ({
      ...p,
      role: roles?.find((r) => r.user_id === p.id)?.role ?? "guru",
    }));
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        nip: z.string().regex(/^\d{8,}$/, "Username/NIP minimal 8 angka"),
        password: z.string().min(6, "Password minimal 6 karakter"),
        nama_guru: z.string().trim().max(120).default(""),
        role: z.enum(["guru", "superadmin"]).default("guru"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "superadmin",
    });
    if (!isAdmin) throw new Error("Akses ditolak");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: nipToEmail(data.nip),
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "Gagal membuat akun");

    await supabaseAdmin
      .from("profiles")
      .insert({ id: created.user.id, nip: data.nip, nama_guru: data.nama_guru });
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: data.role });
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "superadmin",
    });
    if (!isAdmin) throw new Error("Akses ditolak");
    if (data.userId === context.userId) throw new Error("Tidak dapat menghapus akun sendiri");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bootstrapSuperadmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "superadmin");
  if ((count ?? 0) > 0) return { created: false };

  const nip = "19800101";
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: nipToEmail(nip),
    password: "SuperAdmin2026!",
    email_confirm: true,
  });
  if (error || !created.user) throw new Error(error?.message ?? "Gagal membuat superadmin");
  await supabaseAdmin
    .from("profiles")
    .insert({ id: created.user.id, nip, nama_guru: "Super Admin" });
  await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "superadmin" });
  return { created: true };
});