import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FieldSelect } from "@/components/FieldSelect";
import { KELAS_FASE, MATA_PELAJARAN } from "@/lib/constants";

export const Route = createFileRoute("/dropdown-test")({ ssr: false, component: T });

function T() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  return (
    <div className="space-y-4 p-4">
      <FieldSelect label="Kelas" value={a} onChange={setA} options={KELAS_FASE} />
      <FieldSelect label="Mapel" value={b} onChange={setB} options={MATA_PELAJARAN} />
      <p data-testid="val">{a}|{b}</p>
    </div>
  );
}
