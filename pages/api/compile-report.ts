import type { NextApiRequest, NextApiResponse } from "next";
import { marked } from "marked";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Alleen POST" });

  const { title = "Interne Analyse", data, feedback = {} } = req.body as any;

  const volgorde = [
    "Strategy",
    "Structure",
    "Systems",
    "Shared Values",
    "Skills",
    "Style",
    "Staff",
  ];

  let md = `# ${title}\n\n`;
  volgorde.forEach((s) => {
    if (data?.[s]) {
      md += `## ${s}\n\n${data[s]}\n\n`;
      if (feedback[s]) md += `> **Coach-feedback**\n\n${feedback[s]}\n\n`;
    }
  });
  if (data?.Financiën) md += `## Financiën\n\n${data.Financiën}\n\n`;

  // Fix: Return the markdown directly since this API returns markdown, not HTML
  res.json({ markdown: md });
}