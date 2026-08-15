import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "user-templates";

export type StoredFile = { label: string; name: string; path: string; updated_at: string };

export function slugLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
}

export async function listUserFiles(userId: string, labels: readonly string[]) {
  const out: Record<string, StoredFile> = {};
  await Promise.all(
    labels.map(async (label) => {
      const folder = `${userId}/${slugLabel(label)}`;
      const { data } = await supabase.storage
        .from(BUCKET)
        .list(folder, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      const latest = data?.filter((f) => f.name !== ".emptyFolderPlaceholder")[0];
      if (latest) {
        out[label] = {
          label,
          name: latest.name.replace(/^\d+-/, ""),
          path: `${folder}/${latest.name}`,
          updated_at: latest.updated_at ?? latest.created_at ?? "",
        };
      }
    }),
  );
  return out;
}

export function useUserFiles(userId: string | undefined, labels: readonly string[]) {
  return useQuery({
    queryKey: ["user-files", userId, labels.join(",")],
    enabled: !!userId,
    queryFn: () => listUserFiles(userId!, labels),
  });
}

export async function uploadUserFile(userId: string, label: string, file: File) {
  const path = `${userId}/${slugLabel(label)}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function deleteUserFile(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export async function downloadUserFile(f: StoredFile) {
  const { data, error } = await supabase.storage.from(BUCKET).download(f.path);
  if (error || !data) throw new Error(error?.message ?? "Gagal mengambil file tersimpan");
  return new File([data], f.name, { type: data.type });
}
