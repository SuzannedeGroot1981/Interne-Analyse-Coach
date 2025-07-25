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
        error: 'Geen feedback ontvangen van de AI coach',
        details: 'Empty response from Gemini API'
      })
    }

    /* ---- 3. Na het antwoord: korte scan voor evidence citatie -------------- */
    if (ev && userText && !coachFeedback.toLowerCase().includes("interview") && !coachFeedback.toLowerCase().includes("enquête")) {
      // Check of student het evidence citeert in hun tekst
      const hasInterviewRef = userText.toLowerCase().includes("interview") || 
                             userText.toLowerCase().includes("gesprek") ||
                             userText.toLowerCase().includes("gesproken");
      const hasSurveyRef = userText.toLowerCase().includes("enquête") || 
                          userText.toLowerCase().includes("onderzoek") ||
                          userText.toLowerCase().includes("vragenlijst");
      
      if (!hasInterviewRef && !hasSurveyRef) {
        coachFeedback = "**Let op:** Noem expliciet het interview/enquête-bewijs in je tekst. Je hebt waardevolle data beschikbaar die je analyse kan versterken.\n\n" + coachFeedback;
      }
    }

    /* ---- 4. Mini-filter: vang per ongeluk extern advies af -------------- */
    const forbidden = /extern|PEST|kansen|bedreigingen|concurrent|macro/i;
    if (forbidden.test(coachFeedback)) {
      coachFeedback =
        "**Let op:** De coach merkte externe analyse-termen op. "
        + "Die horen pas bij de volgende opdracht en zijn hier niet beoordeeld.\n\n"
        + coachFeedback.replace(forbidden, (match: string) => `~~${match}~~`);
    }

    console.log('✅ Coach feedback gegenereerd:', {
      feedbackLength: coachFeedback.length,
      stepTitle: stepTitle || 'Algemeen',
      success: true,
      hasEvidence: !!ev,
      filteredExternal: forbidden.test(data.candidates?.[0]?.content?.parts?.[0]?.text || ''),
      evidenceWarningAdded: ev && userText && !userText.toLowerCase().includes("interview") && !userText.toLowerCase().includes("enquête")
    })

    // Succesvol antwoord
    return res.status(200).json({
      success: true,
      feedback: coachFeedback,
      stepTitle: stepTitle || null,
      timestamp: new Date().toISOString(),
      wordCount: coachFeedback.split(/\s+/).length,
      evidenceUsed: !!ev
    })

  } catch (error) {
    console.error('Coach API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check if this is a quota-related error
    const isQuotaError = errorMessage.includes('quota') || 
                        errorMessage.includes('429') || 
                        errorMessage.includes('RESOURCE_EXHAUSTED') ||
                        errorMessage.includes('exceeded')
    
    return res.status(isQuotaError ? 429 : 500).json({
      error: isQuotaError 
        ? 'API quota bereikt. Probeer het later opnieuw.'
        : 'Er is een fout opgetreden bij het genereren van coach feedback',
      details: errorMessage,
      timestamp: new Date().toISOString(),
      ...(isQuotaError && {
        quotaInfo: {
          resetTime: '24 uur',
          upgradeUrl: 'https://makersuite.google.com/app/apikey',
          suggestion: 'Upgrade naar betaald plan voor hogere limieten'
        }
      })
    })
  }
}