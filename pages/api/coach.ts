import { NextApiRequest, NextApiResponse } from 'next'

/* ---- 1. Nieuwe SYSTEM_PROMPT -------------------- */
const SYSTEM_PROMPT = `
Je bent een ervaren docent & managementcoach in de zorg.
Je feedback betreft **uitsluitend de INTERNE analyse** (McKinsey 7S + financiële ratio's).
Laat externe factoren (SWOT-extern, PEST(EL), concurrentie, kansen of bedreigingen)
buiten beschouwing; verwijs er hoogstens naar met de opmerking
"Wordt behandeld in een latere externe analyse".

Stijl- en vormeisen
• Zakelijk, formeel Nederlands (u-vorm vermijden; "je" is toegestaan).  
• Begin altijd met een <compliment>.  
• Sluit af met 2-3 verbeterpunten in genummerde lijst.  
• Max. 250 woorden per S-element.  
• APA-hints: citeer theorie in de vorm (Auteur, jaar) en herinner de student
  aan een alfabetische bronnenlijst.

Structuur feedback (per S-element)
1. Compliment / sterkte
2. Kritische observatie (zwakte of gap)
3. Concrete verbetersuggestie(s)  
4. Indien passend 1 voorbeeldbron in APA-placeholder

Geen herhaling van studenttekst, geen externe analyse.
`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const { userPrompt, stepTitle, currentSituation, desiredSituation } = req.body

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

    // Construeer de volledige prompt
    let fullPrompt = SYSTEM_PROMPT + '\n\n'
    
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
        temperature: 0.6,
        maxOutputTokens: 400, // Beperkt tot ~250 woorden
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

    /* ---- 2. Na de fetch naar Gemini, vóór je res.json() terugstuurt -------------- */
    /* mini-filter: vang per ongeluk extern advies af */
    const forbidden = /extern|PEST|kansen|bedreigingen|concurrent|macro/i;
    if (forbidden.test(coachFeedback)) {
      coachFeedback =
        "**Let op:** De coach merkte externe analyse-termen op. "
        + "Die horen pas bij de volgende opdracht en zijn hier niet beoordeeld.\n\n"
        + coachFeedback.replace(forbidden, (m) => `~~${m}~~`);
    }

    console.log('✅ Coach feedback gegenereerd:', {
      feedbackLength: coachFeedback.length,
      stepTitle: stepTitle || 'Algemeen',
      success: true,
      filteredExternal: forbidden.test(data.candidates?.[0]?.content?.parts?.[0]?.text || '')
    })

    // Succesvol antwoord
    return res.status(200).json({
      success: true,
      feedback: coachFeedback,
      stepTitle: stepTitle || null,
      timestamp: new Date().toISOString(),
      wordCount: coachFeedback.split(/\s+/).length
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