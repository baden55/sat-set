import { useQuery, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Generation = {
  id: string;
  jenis: string;
  judul: string;
  konten: string;
  created_at: string;
};

export async function saveGeneration(
  userId: string | undefined,
  jenis: string,
  judul: string,
  konten: string,
) {
  if (!userId || !konten.trim()) return;
  await supabase.from("generations").insert({ user_id: userId, jenis, judul, konten });
}

export function useHistory(userId?: string) {
  return useQuery({
    queryKey: ["generations", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("generations")
        .select("id, jenis, judul, konten, created_at")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Generation[];
    },
  });
}

export function useInvalidateHistory() {
  const qc = useQueryClient();
  return (userId?: string) => qc.invalidateQueries({ queryKey: ["generations", userId] });
}
