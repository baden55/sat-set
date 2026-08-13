import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { streamText } from "ai";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Attachment = { name: string; mediaType?: string; dataUrl?: string; text?: string };

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace("Bearer ", "");
        if (!token) return new Response("Unauthorized", { status: 401 });

        const supabase = createClient(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          { auth: { persistSession: false } },
        );
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData.user) return new Response("Unauthorized", { status: 401 });

        const body = (await request.json()) as { prompt?: string; attachments?: Attachment[] };
        const prompt = (body.prompt ?? "").trim();
        if (!prompt) return new Response("Prompt kosong", { status: 400 });

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("AI belum dikonfigurasi", { status: 500 });

        const gateway = createLovableAiGatewayProvider(apiKey);

        const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
        for (const att of body.attachments ?? []) {
          if (att.dataUrl) {
            content.push({
              type: "file",
              data: att.dataUrl,
              mediaType: att.mediaType || "application/pdf",
              filename: att.name,
            });
          } else if (att.text) {
            content.push({
              type: "text",
              text: `\n\n=== LAMPIRAN: ${att.name} ===\n${att.text.slice(0, 40000)}`,
            });
          }
        }

        const result = streamText({
          model: gateway("google/gemini-3.6-flash"),
          system:
            "Anda adalah asisten guru profesional Indonesia. Jawab dalam Bahasa Indonesia baku, gunakan Markdown rapi dengan tabel, judul, dan subjudul yang jelas dan siap disalin ke Microsoft Word.",
          messages: [{ role: "user", content: content as never }],
          onError: ({ error }) => console.error("AI error", error),
        });

        return result.toTextStreamResponse();
      },
    },
  },
});