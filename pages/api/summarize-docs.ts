import type { NextApiRequest, NextApiResponse } from "next";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import Papa from "papaparse";
import { allow } from '../../utils/rateLimit';

const GEMINI = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent`;
const key = process.env.GEMINI_API_KEY;

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
    const { element, docs } = req.body as { element: string; docs: Array<{name: string, type: string, data: string}> };

    if (!element || !docs || !Array.isArray(docs)) {
      return res.status(400).json({
        error: 'Element en docs array zijn vereist'
      });
    }

    console.log('📄 Start document samenvatting:', {
      element,
      docsCount: docs.length,
      docNames: docs.map(d => d.name)
    });

    let fullText = "";

    // Verwerk elk document
    for (const doc of docs) {
      try {
        console.log('📄 Verwerk document:', doc.name, doc.type);
        
        // Extract base64 data
        const base64Data = doc.data.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        if (doc.type === "application/pdf") {
          const pdfResult = await pdfParse(buffer);
          fullText += `\n=== DOCUMENT: ${doc.name} ===\n${pdfResult.text}\n`;
        } else if (doc.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
          const docxResult = await mammoth.extractRawText({ buffer });
          fullText += `\n=== DOCUMENT: ${doc.name} ===\n${docxResult.value}\n`;
        } else if (doc.type === "text/csv") {
          const csvText = buffer.toString('utf-8');
          const csv = Papa.parse(csvText, { header: true });
          fullText += `\n=== CSV: ${doc.name} ===\n${JSON.stringify(csv.data.slice(0, 10), null, 2)}\n`; // Eerste 10 rijen
        } else {
          // Behandel als tekst bestand
          fullText += `\n=== DOCUMENT: ${doc.name} ===\n${buffer.toString('utf-8')}\n`;
        }
      } catch (docError) {
        console.error(`❌ Fout bij verwerken ${doc.name}:`, docError);
        fullText += `\n=== DOCUMENT: ${doc.name} ===\n[Fout bij verwerken: ${docError instanceof Error ? docError.message : 'Onbekende fout'}]\n`;
      }
    }

    if (!fullText.trim()) {
      return res.status(400).json({
        error: 'Geen bruikbare tekst gevonden in de documenten'
      });
    }

    // Genereer samenvatting via Gemini
    const prompt = `
Je bent onderzoeksmethodoloog. Maak een beknopte samenvatting van de documenten 
voor het 7S-element "${element}". Focus op de belangrijkste bevindingen en 
concrete feiten. Max 150 woorden. Gebruik bullet points waar mogelijk.

DOCUMENTEN:
${fullText}`;

    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        temperature: 0.4,
        maxOutputTokens: 300
      }
    };

    console.log('🤖 Start Gemini API call voor document samenvatting...', {
      element,
      textLength: fullText.length
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
    const summary = response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!summary) {
      throw new Error('Geen samenvatting ontvangen van Gemini API');
    }

    console.log('✅ Document samenvatting voltooid:', {
      element,
      summaryLength: summary.length
    });

    res.json({ summary: summary.trim() });

  } catch (error) {
    console.error('❌ Summarize docs error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
    
    res.status(500).json({
      error: 'Er is een fout opgetreden bij het samenvatten van de documenten',
      details: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
}