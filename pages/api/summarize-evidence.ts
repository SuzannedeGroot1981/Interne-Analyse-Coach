import type { NextApiRequest, NextApiResponse } from "next";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import Papa from "papaparse";
import { Readable } from "stream";
import { Buffer } from "buffer";
import { allow } from '../../utils/rateLimit';

const GEMINI = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`;
const key = process.env.GEMINI_API_KEY;

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting check
  const k = req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "anon";
  if (!allow(String(k))) {
    return res.status(429).json({ message: "Te veel aanvragen, probeer in 1 minuut opnieuw." });
  }

  if (req.method !== "POST") return res.status(405).end();

  if (!key) {
    return res.status(500).json({ 
      error: 'API configuratie ontbreekt. Check Environment Variables.',
      hint: 'Voeg GEMINI_API_KEY toe aan je environment variables'
    });
  }

  try {
    /* ---------- bestanden uitlezen ---------- */
    const files = (req as any).files || (await streamToFiles(req));
    let fullText = "";

    console.log('📁 Bestanden ontvangen:', {
      interviews: files.interviews?.length || 0,
      survey: !!files.survey
    });

    if (files.interviews) {
      for (const f of files.interviews) {
        console.log('📄 Verwerk interview bestand:', f.filename, f.mimetype);
        
        if (f.mimetype === "application/pdf") {
          const pdfResult = await pdfParse(f.buffer);
          fullText += `\n=== INTERVIEW: ${f.filename} ===\n${pdfResult.text}\n`;
        } else if (f.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          const docxResult = await mammoth.extractRawText({ buffer: f.buffer });
          fullText += `\n=== INTERVIEW: ${f.filename} ===\n${docxResult.value}\n`;
        } else {
          // Behandel als tekst bestand
          fullText += `\n=== INTERVIEW: ${f.filename} ===\n${f.buffer.toString()}\n`;
        }
      }
    }

    if (files.survey?.buffer) {
      console.log('📊 Verwerk enquête bestand:', files.survey.filename);
      const csv = Papa.parse(files.survey.buffer.toString(), { header: true });
      fullText += `\n=== ENQUÊTE DATA ===\n${JSON.stringify(csv.data, null, 2)}\n`;
    }

    if (!fullText.trim()) {
      return res.status(400).json({
        error: 'Geen bruikbare data gevonden in de geüploade bestanden'
      });
    }

    /* ---------- samenvatting via Gemini ---------- */
    const prompt = `
Je bent onderzoeksmethodoloog. Maak een kernsamenvatting uit de transcript- 
en enquêtedata. Orden per 7S-element; max 80 woorden per element; 
noem percentage of citaat als bewijs. 
Return als JSON: { "Strategy": "...", "Structure": "...", "Systems": "...", "Shared Values": "...", "Skills": "...", "Style": "...", "Staff": "...", "Financiën": "..." }

Focus op INTERNE factoren alleen. Externe analyse komt later.

DATA:
${fullText}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.4, // Aangepast naar 0.4 voor consistente analyse
        maxOutputTokens: 1000
      }
    };

    console.log('🤖 Start Gemini API call voor samenvatting...', {
      textLength: fullText.length,
      wordCount: fullText.split(/\s+/).length
    });

    const g = await fetch(GEMINI + "?key=" + key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!g.ok) {
      const errorText = await g.text();
      console.error('Gemini API error:', g.status, errorText);
      
      if (g.status === 429) {
        return res.status(429).json({
          error: 'API quota bereikt. Probeer het later opnieuw.',
          details: 'Dagelijkse API quota overschreden'
        });
      }
      
      throw new Error(`Gemini API call failed: ${g.status}`);
    }

    const response = await g.json();
    const summaryText = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summaryText) {
      throw new Error('Geen samenvatting ontvangen van Gemini API');
    }

    // Probeer JSON te parsen, anders return als tekst
    let summary;
    try {
      summary = JSON.parse(summaryText);
    } catch {
      // Als JSON parsing faalt, return als gestructureerde tekst
      summary = {
        summary: summaryText,
        note: "Samenvatting kon niet als JSON worden geparsed"
      };
    }

    console.log('✅ Evidence samenvatting voltooid:', {
      summaryType: typeof summary,
      hasStructuredData: typeof summary === 'object' && summary !== null
    });

    res.json(summary);

  } catch (error) {
    console.error('❌ Summarize evidence error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    
    res.status(500).json({
      error: 'Er is een fout opgetreden bij het samenvatten van de evidence',
      details: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}

/* helper om FormData uit stream te halen */
async function streamToFiles(req: NextApiRequest) {
  const busboy = require("busboy");
  const bb = busboy({ headers: req.headers });
  const out: any = {};
  
  return new Promise<any>((resolve, reject) => {
    bb.on("file", (name: string, stream: any, info: any) => {
      const chunks: any[] = [];
      stream.on("data", (c: any) => chunks.push(c));
      stream.on("end", () => { 
        out[name] = out[name] || []; 
        out[name].push({ 
          ...info, 
          buffer: Buffer.concat(chunks),
          filename: info.filename || 'unknown'
        }); 
      });
    });
    
    bb.on("close", () => resolve(out));
    bb.on("error", reject);
    
    req.pipe(bb);
  });
}