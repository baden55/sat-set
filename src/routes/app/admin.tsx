import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { FieldSelect } from "@/components/FieldSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createUser, createUsersBulk, deleteUser, listUsers } from "@/lib/admin.functions";

type BulkRow = { nama_guru: string; nip: string; role: "guru" | "superadmin"; password: string };

function pick(row: Record<string, unknown>, keys: string[]) {
  for (const k of Object.keys(row)) {
    const norm = k.toLowerCase().trim();
    if (keys.some((c) => norm === c || norm.includes(c))) return String(row[k] ?? "").trim();
  }
  return "";
}


export const Route = createFileRoute("/app/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Kelola Akun — Guru Satset" },
      { name: "description", content: "SuperAdmin membuat dan menghapus akun guru." },
      { property: "og:title", content: "Kelola Akun — Guru Satset" },
      { property: "og:description", content: "Manajemen akun pengguna Guru Satset." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["users"], queryFn: () => listUsers() });
  const [form, setForm] = useState({ nip: "", password: "", nama_guru: "", role: "Guru" });

  const create = useMutation({
    mutationFn: () =>
      createUser({
        data: {
          nip: form.nip,
          password: form.password,
          nama_guru: form.nama_guru,
          role: form.role === "SuperAdmin" ? "superadmin" : "guru",
        },
      }),
    onSuccess: () => {
      toast.success("Akun berhasil dibuat");
      setForm({ nip: "", password: "", nama_guru: "", role: "Guru" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPickFile(file: File) {
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) throw new Error("Sheet kosong");
      const sheet = wb.Sheets[sheetName];
      if (!sheet) throw new Error("Sheet kosong");
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const rows: BulkRow[] = json
        .map((r) => {
          const role = pick(r, ["peran", "role"]).toLowerCase();
          return {
            nama_guru: pick(r, ["nama"]),
            nip: pick(r, ["nip", "username"]).replace(/\D/g, ""),
            role: role.includes("super") || role.includes("admin") ? "superadmin" : "guru",
            password: pick(r, ["password", "sandi"]),
          } satisfies BulkRow;
        })
        .filter((r) => r.nip || r.password);
      if (!rows.length) throw new Error("Tidak ada data valid pada file");
      setBulkRows(rows);
      setFileName(file.name);
      toast.success(`${rows.length} baris terbaca dari Excel`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal membaca file Excel");
    }
  }

  async function downloadTemplate() {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet([
      { nama: "Budi Santoso", nip: "19800101", peran: "guru", password: "Rahasia123" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Akun");
    XLSX.writeFile(wb, "template-akun-massal.xlsx");
  }

  const invalidRows = bulkRows.filter(
    (r) => !/^\d{8,}$/.test(r.nip) || (r.password?.length ?? 0) < 6,
  );

  const bulk = useMutation({
    mutationFn: () =>
      createUsersBulk({ data: { rows: bulkRows.filter((r) => !invalidRows.includes(r)) } }),
    onSuccess: (res) => {
      toast.success(`${res.success} dari ${res.total} akun berhasil dibuat`);
      if (res.failed.length) {
        toast.error(
          `Gagal: ${res.failed.map((f) => `${f.nip} (${f.error ?? "error"})`).join(", ")}`,
        );
      }
      setBulkRows([]);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => deleteUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Akun dihapus");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  return (
    <div>
      <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
        <ShieldCheck className="size-6 text-primary" /> Kelola Akun
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Buat dan hapus akun pengguna. Username berupa NIP atau minimal 8 angka.
      </p>

      <Card className="mt-6 border-border/70 shadow-soft">
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nip">Username (NIP / min. 8 angka)</Label>
            <Input
              id="nip"
              inputMode="numeric"
              value={form.nip}
              onChange={(e) => setForm((s) => ({ ...s, nip: e.target.value.replace(/\D/g, "") }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd">Password</Label>
            <Input
              id="pwd"
              type="text"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nama">Nama Guru</Label>
            <Input
              id="nama"
              value={form.nama_guru}
              maxLength={120}
              onChange={(e) => setForm((s) => ({ ...s, nama_guru: e.target.value }))}
            />
          </div>
          <FieldSelect
            label="Peran"
            value={form.role}
            onChange={(v) => setForm((s) => ({ ...s, role: v }))}
            options={["Guru", "SuperAdmin"]}
          />
          <div className="sm:col-span-2">
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              Buat Akun
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4 border-border/70 shadow-soft">
        <CardContent className="p-2 sm:p-4">
          {users.isLoading ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Memuat daftar akun…
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username / NIP</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Sekolah</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(users.data ?? []).map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nip}</TableCell>
                      <TableCell>{u.nama_guru || "-"}</TableCell>
                      <TableCell>{u.nama_sekolah || "-"}</TableCell>
                      <TableCell className="capitalize">{u.role}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => remove.mutate(u.id)}
                          disabled={remove.isPending}
                        >
                          <Trash2 className="size-4" /> Hapus
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
