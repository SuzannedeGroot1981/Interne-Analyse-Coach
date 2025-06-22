import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { saveProject, loadProject } from "../utils/storage";

const S_ELEMENTS = [
  "Strategy",
  "Structure",
  "Systems",
  "Shared Values",
  "Skills",
  "Style",
  "Staff",
] as const;

export default function ImprovePage() {
  // ───────────────────────────── state & load ─────────────────────────────
  const projectId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("id") ?? "improve-demo"
      : "improve-demo";

  const [fields, setFields] = useState<Record<string, string>>(
    () =>
      loadProject(projectId)?.data ?? // al opgeslagen?
      Object.fromEntries(S_ELEMENTS.map((s) => [s, ""]))
  );

  // ─────────────────────────── autosave per wijziging ─────────────────────
  useEffect(() => {
    saveProject(projectId, { flow: "improve", data: fields });
  }, [fields, projectId]);

  // ──────────────────────────── helpers ───────────────────────────────────
  function handleChange(key: string, value: string) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function askCoach() {
    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tekst: fields, stapId: "improve" }),
    });
    const { answer } = await res.json();
    alert(answer); // eenvoudig: popup; later kun je dit mooier tonen
  }

  // ─────────────────────────────── UI ─────────────────────────────────────
  return (
    <Layout>
      <h2 className="text-xl font-semibold mb-4">
        Verbeter een bestaand concept
      </h2>

      {S_ELEMENTS.map((s) => (
        <div key={s} className="mb-6">
          <label className="font-medium block mb-2">{s}</label>
          <textarea
            value={fields[s]}
            onChange={(e) => handleChange(s, e.target.value)}
            placeholder={`Plak hier je huidige uitwerking voor '${s}'`}
            className="w-full h-32 border rounded p-3"
          />
        </div>
      ))}

      <button
        onClick={askCoach}
        className="btn-primary mt-4"
      >
        Vraag coach-feedback
      </button>

      <a
        href="/"
        className="inline-block mt-6 text-primary underline"
      >
        ← Terug naar start
      </a>
    </Layout>
  );
}