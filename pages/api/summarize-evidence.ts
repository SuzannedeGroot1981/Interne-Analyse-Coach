import type { NextApiRequest, NextApiResponse } from 'next'
import { allow } from '../../utils/rateLimit'
import mammoth from 'mammoth'
import Papa from 'papaparse'

interface SummarizeResponse {
  success: boolean
  summary: string
  interviewCount: number
  surveyRows?: number
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting check
  const k = req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "anon";
  if (!allow(String(k))) {
    return res.status(429).json({ message: "Te veel aanvragen, probeer in 1 minuut opnieuw." });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.',
      allowedMethods: ['POST']
    })
  }

  try {
    // Check of Gemini API key beschikbaar is
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment variables')
      return res.status(500).json({ 
        error: 'API configuratie ontbreikt. Check Environment Variables.',
        hint: 'Voeg GEMINI_API_KEY toe aan je environment variables'
      })
    }

    // Parse multipart form data (simplified approach)
    // In een echte implementatie zou je een library zoals 'formidable' gebruiken
    const contentType = req.headers['content-type']
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({
        error: 'Content-Type moet multipart/form-data zijn voor bestand uploads'
      })
    }

    // Voor deze implementatie simuleren we de file processing
    // In productie zou je de bestanden daadwerkelijk parsen
    console.log('🎤 Evidence summarize API aangeroepen')

    // Simuleer interview en survey data processing
    let interviewTexts: string[] = []
    let surveyData: any[] = []

    // Mock data voor demonstratie (in productie zou je echte bestanden verwerken)
    const mockInterviewText = `
Interview 1 - Manager:
"Onze organisatie heeft sterke punten in teamwork en innovatie. We zien echter uitdagingen in communicatie tussen afdelingen en hebben behoefte aan duidelijkere processen."

Interview 2 - Medewerker:
"De werksfeer is over het algemeen goed, maar er is onduidelijkheid over rollen en verantwoordelijkheden. Training en ontwikkeling kunnen beter."

Interview 3 - Teamleider:
"Financieel staan we er redelijk voor, maar we missen strategische focus. De organisatiestructuur kan efficiënter."
    `

    const mockSurveyData = [
      { vraag: 'Tevredenheid werk', score: 7.2 },
      { vraag: 'Communicatie', score: 6.1 },
      { vraag: 'Leiderschap', score: 6.8 },
      { vraag: 'Ontwikkeling', score: 5.9 }
    ]

    interviewTexts.push(mockInterviewText)
    surveyData = mockSurveyData

    // Bereid data voor AI samenvatting
    let combinedText = ''
    
    if (interviewTexts.length > 0) {
      combinedText += `INTERVIEW DATA:\n${interviewTexts.join('\n\n')}\n\n`
    }
    
    if (surveyData.length > 0) {
      combinedText += `ENQUÊTE RESULTATEN:\n${JSON.stringify(surveyData, null, 2)}\n\n`
    }

    if (!combinedText.trim()) {
      return res.status(400).json({
        error: 'Geen data gevonden om samen te vatten'
      })
    }

    // AI prompt voor samenvatting
    const prompt = `
Je bent een organisatie-analist. Maak een gestructureerde samenvatting van de volgende interview- en enquêtedata voor een interne organisatie-analyse volgens het 7S-model.

Focus op:
- Belangrijkste bevindingen per 7S-element (Strategy, Structure, Systems, Shared Values, Skills, Style, Staff)
- Financiële aspecten indien genoemd
- Sterke punten en verbeterpunten
- Concrete citaten en cijfers waar relevant

Geef een heldere, professionele samenvatting van maximaal 500 woorden.

DATA:
${combinedText}

Maak een samenvatting die bruikbaar is voor de interne analyse:
`

    console.log('🤖 Start AI samenvatting generatie...', {
      interviewCount: interviewTexts.length,
      surveyRows: surveyData.length,
      textLength: combinedText.length
    })

    // Gemini API aanroep
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.6, // Creatieve samenvatting
        maxOutputTokens: 800,
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
      
      if (response.status === 429) {
        return res.status(429).json({
          error: 'API quota bereikt. Probeer het later opnieuw.',
          details: 'Dagelijkse API quota overschreden'
        })
      }
      
      throw new Error(`Gemini API call failed: ${response.status}`)
    }

    const data = await response.json()
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!summary) {
      throw new Error('Geen samenvatting ontvangen van Gemini API')
    }

    console.log('✅ Evidence samenvatting voltooid:', {
      summaryLength: summary.length,
      interviewCount: interviewTexts.length,
      surveyRows: surveyData.length
    })

    // Succesvol antwoord
    const result: SummarizeResponse = {
      success: true,
      summary: summary.trim(),
      interviewCount: interviewTexts.length,
      surveyRows: surveyData.length
    }

    return res.status(200).json(result)

  } catch (error) {
    console.error('❌ Summarize evidence API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
    
    return res.status(500).json({
      success: false,
      error: 'Er is een fout opgetreden bij het samenvatten van de evidence',
      details: errorMessage,
      timestamp: new Date().toISOString()
    })
  }
}

// Export configuratie voor Next.js API routes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Verhoog limiet voor bestanden
    },
  },
}