import { NextApiRequest, NextApiResponse } from 'next'
import { allow } from '../../utils/rateLimit'
import { loadProject } from '../../utils/storage'

/* ---- 1. Nieuwe SYSTEM_PROMPT met evidence integratie -------------------- */
const SYSTEM_PROMPT = `
Je bent de **Interne Analyse Coach** – een virtuele begeleider voor tweedejaars HBO-studenten 
van de duale opleiding Management in de Zorg aan Hogeschool Leiden.

**Rol en expertise:**
- Ervaren docent/coach met expertise in zorgmanagement, organisatiekunde en bedrijfseconomie
- Feedback betreft **uitsluitend de INTERNE analyse** volgens McKinsey 7S-model + financiële ratio's
- Externe factoren (SWOT-extern, PEST(EL), concurrentie) NIET betrekken - verwijs naar "latere externe analyse opdracht"

**Communicatiestijl:**
- Constructief, zakelijk en actief
- Begin ALTIJD met positieve observatie over wat goed gaat
- Eindig met 2-3 concrete verbetervoorstellen
- Gebruik Hogeschool Leiden schrijfstijl en APA-richtlijnen
- Temperatuur 0.4 voor conservatieve, betrouwbare feedback

**7S-Model focus:**
- Analyseer elk S-element afzonderlijk (Strategy, Structure, Systems, Shared Values, Skills, Style, Staff)
- Leg verbanden tussen S-elementen bij gevorderde studenten ("Goed"-criteria niveau)
- Verwacht logische ordening: genummerde hoofdstukken, inleiding, conclusie
- Eindproduct ± 6 pagina's organisatieniveau analyse

**Financiële paragraaf vereisten:**
- Herken en bespreek kernbegrippen: rentabiliteit, liquiditeit, solvabiliteit
- Leg uit wat cijfers betekenen voor interne sterktes/zwaktes
- Verbind financiële gezondheid aan andere 7S-elementen

**Interview/Enquête controle:**
- Controleer of interview/enquête resultaten aantoonbaar zijn verwerkt
- Vraag door als evidence ontbreekt of onduidelijk geciteerd is
- Verwacht expliciete verwijzingen naar onderzoeksresultaten

Gebruik onderstaande interview- en enquêtebevinding (indien aanwezig) 
als feitelijk bewijs. Controleer of de student het bewijs citeert; 
ontbreekt een verwijzing, voeg een verbeterpunt toe.

**Feedback structuur (verplicht):**
1. Positieve observatie/compliment over wat goed gaat
2. Kritische analyse van zwakke punten of ontbrekende elementen  
3. 2-3 concrete verbetervoorstellen (genummerde lijst)
4. APA-hint indien relevant: (Auteur, jaar) citaties + alfabetische bronnenlijst
5. Max. 250 woorden per S-element

**Verboden:**
- Herhaling van studenttekst
- Externe analyse elementen
- GPT-"hallucinations" - alleen verwijzen naar studenttekst of algemeen aanvaarde theorie
- U-vorm (gebruik "je" voor directe aanspreek)
`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting check
  const k = req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "anon";
  if (!allow(String(k))) {
    return res.status(429).json({ message: "Te veel aanvragen, probeer in 1 minuut opnieuw." });
  }

  // Alleen POST requests toestaan
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  try {
    // Check of API key beschikbaar is
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return res.status(500).json({ 
        error: 'API configuratie ontbreekt. Check Environment Variables.',
        hint: 'Voeg GEMINI_API_KEY toe aan je environment variables'
      })
    }

    // Parse request body
    const { userPrompt, stepTitle, currentSituation, desiredSituation, projectId } = req.body

    // Input validatie
    if (!userPrompt || typeof userPrompt !== 'string') {
      return res.status(400).json({ 
        error: 'userPrompt is vereist en moet een string zijn' 
      })
    }

    if (userPrompt.length > 5000) {
      return res.status(400).json({ 
        error: 'userPrompt mag maximaal 5000 karakters bevatten' 
      })
    }

    /* ---- 2. Verzamel evidence data vóór de Gemini-call -------------- */
    let ev = "";
    let project = null;
    
    if (projectId) {
      project = loadProject(projectId);
      if (project && project.evidence && stepTitle) {
        // Map step title naar evidence key
        const evidenceKeyMap: { [key: string]: string } = {
          'Strategy': 'Strategy',
          'Structure': 'Structure', 
          'Systems': 'Systems',
          'Shared Values': 'Shared Values',
          'Skills': 'Skills',
          'Style': 'Style',
          'Staff': 'Staff',
          'Financiën': 'Financiën'
        };
        
        const evidenceKey = evidenceKeyMap[stepTitle];
        if (evidenceKey && project.evidence[evidenceKey]) {
          ev = project.evidence[evidenceKey];
          console.log('📋 Evidence gevonden voor', stepTitle, ':', ev.substring(0, 100) + '...');
        }
      }
    }

    const userText = currentSituation || "";

    // Construeer de volledige prompt met evidence
    let fullPrompt = SYSTEM_PROMPT;
    
    // Voeg evidence toe aan system prompt als beschikbaar
    if (ev) {
      fullPrompt += `\n\nInterview/Survey Insight:\n«${ev}»\n\n`;
    }
    
    fullPrompt += '\n\n';
    
    if (stepTitle) {
      fullPrompt += `7S-Element: ${stepTitle}\n\n`
    }
    
    if (currentSituation) {
      fullPrompt += `Huidige situatie:\n${currentSituation}\n\n`
    }
    
    if (desiredSituation) {
      fullPrompt += `Gewenste situatie:\n${desiredSituation}\n\n`
    }
    
    fullPrompt += `Vraag van de gebruiker:\n${userPrompt}`

    console.log('🤖 Coach API aangeroepen:', {
      stepTitle: stepTitle || 'Geen stap',
      promptLength: fullPrompt.length,
      hasEvidence: !!ev,
      evidenceLength: ev.length,
      timestamp: new Date().toISOString()
    })

    // Gemini API aanroep
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: fullPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1000,
        topP: 0.8,
        topK: 40
      }
    }

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      
      // Parse error response for better error handling
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: { message: errorText } }
      }
      
      // Specifieke error handling voor quota problemen
      if (response.status === 429 || 
          (errorData.error && (
            errorData.error.message?.includes('quota') ||
            errorData.error.message?.includes('exceeded') ||
            errorData.error.status === 'RESOURCE_EXHAUSTED'
          ))) {
        return res.status(429).json({
          error: 'API quota bereikt. Probeer het later opnieuw.',
          details: 'Dagelijkse API quota overschreden. Quota reset na 24 uur.',
          quotaInfo: {
            resetTime: '24 uur',
            upgradeUrl: 'https://makersuite.google.com/app/apikey',
            currentPlan: 'Free tier'
          }
        })
      }
      
      if (response.status === 400) {
        return res.status(400).json({
          error: 'Ongeldige aanvraag naar Gemini API.',
          details: errorData.error?.message || errorText
        })
      }
      
      throw new Error(`Gemini API call failed: ${response.status} ${errorData.error?.message || errorText}`)
    }

    const data = await response.json()
    
    // Extract de response tekst
    let coachFeedback = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!coachFeedback) {
      console.error('No feedback received from Gemini API:', data)
      return res.status(500).json({
        error: '