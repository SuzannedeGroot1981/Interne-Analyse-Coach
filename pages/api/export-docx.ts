import type { NextApiRequest, NextApiResponse } from "next";
import htmlToDocx from "html-to-docx";
import { marked } from "marked";
import { promises as fs } from "fs";
import path from "path";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Alleen POST is toegestaan" });
  }

  const { data, feedback = {}, apaResults = {}, title = "InterneAnalyse" } = req.body as {
    data: Record<string, string>;
    feedback?: Record<string, string>;
    apaResults?: Record<string, string>;
    title?: string;
  };

  /* ---------------- Markdown samenstellen ---------------- */
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
      if (apaResults[s]) md += `> **APA Check Resultaten**\n\n${apaResults[s]}\n\n`;
    }
  });
  if (data?.Financiën) md += `## Financiën\n\n${data.Financiën}\n\n`;
  if (feedback?.Financiën) md += `> **Coach-feedback**\n\n${feedback.Financiën}\n\n`;
  if (apaResults?.Financiën) md += `> **APA Check Resultaten**\n\n${apaResults.Financiën}\n\n`;

  // Fix: await the marked.parse() call since it returns a Promise<string>
  const html = await marked.parse(md);

  /* ---------------- HL-logo in header -------------------- */
  const logoPath = path.resolve("./public/images/Logo_HL_Donkergroen_RGB.png");
  let headerHtml = "";
  try {
    const buf = await fs.readFile(logoPath);
    headerHtml = `<img src="data:image/png;base64,${buf.toString(
      "base64"
    )}" height="35"/>`;
  } catch {
    // logo niet gevonden → geen header
  }

  /* ------------ Word-document maken ------------- */
  const options: any = {
    header:      true,
    footer:      true,
    pageNumber:  true,
    headerHtml,
  };

  // cast naar 'any' zodat TypeScript niet meer klaagt
  const docxBuffer = await htmlToDocx(html, null, options as any);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${title.replaceAll(" ", "_")}.docx`
  );
  res.send(docxBuffer);
}