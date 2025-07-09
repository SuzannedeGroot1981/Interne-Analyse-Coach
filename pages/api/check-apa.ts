import type { NextApiRequest, NextApiResponse } from "next";
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
  
  const { markdown } = req.body as { markdown: string };

  if (!key) {
    return res.status(500).json({
      issues: ["API configuratie ontbreekt. Check Environment Variables."]
    });
  }

  if (!markdown || typeof markdown !== 'string') {
    return res.status(400).json({
      issues: ["Geen tekst ontvangen voor APA controle."]
    });
  }

  try {
    const system = `
Je bent APA-specialist voor Hogeschool Leiden studenten Management in de Zorg.
Controleer uitsluitend bronvermeldingen en citaten volgens APA 7e editie.

**Specifieke controle voor HBO-niveau:**
- Correcte in-text citaties: (Auteur, jaar) of (Auteur, jaar, p. X)
- Juiste interpunctie en spaties in citaten
- Consistente schrijfwijze van auteursnamen  
- Correct gebruik van & vs. en bij meerdere auteurs
- Juiste formatting van directe citaten met paginanummers
- Aanwezigheid van paginanummers bij directe citaten (verplicht)
- Nederlandse vs. Engelse citeerconventies (consistent toepassen)

**Feedback format:**
- Geef concrete bullet-list met fouten
- Vermeld regelnummer/locatie waar mogelijk
- Geef correcte versie als voorbeeld
- Return 'OK' alleen als alles volledig correct is

**Focus uitsluitend op APA-technische aspecten, geen inhoudelijke feedback.**`;

    const body = {
      contents: [{ parts: [{ text: system + "\n\n" + markdown }] }],
      generationConfig: { 
        temperature: 0.4,
        maxOutputTokens: 300
      }
    };

    const g = await fetch(GEMINI + "?key=" + key, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!g.ok) {
      const errorText = await g.text();
      console.error('Gemini API error:', g.status, errorText);
      
      if (g.status === 429) {
        return res.json({
          issues: ["API quota bereikt. Probeer het later opnieuw."]
        });
      }
      
      throw new Error(`Gemini API call failed: ${g.status}`);
    }

    const response = await g.json();
    const txt = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse de response met expliciete type annotations
    const issues = txt.startsWith("OK") || txt.toLowerCase().includes("geen fouten") || txt.toLowerCase().includes("correct")
      ? [] 
      : txt.split(/\n+/)
          .map((s: string) => s.replace(/^[-•*]\s*/, "").trim())
          .filter((s: string) => s.length > 5); // Filter zeer korte regels

    console.log('✅ APA check voltooid:', {
      textLength: markdown.length,
      issuesFound: issues.length
    });

    res.json({ issues });

  } catch (error) {
    console.error('❌ APA check error:', error);
    
    res.json({
      issues: ["Er is een fout opgetreden bij de APA controle. Probeer het opnieuw."]
    });
  }
}