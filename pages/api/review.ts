import { NextApiRequest, NextApiResponse } from 'next'

const SYSTEM_PROMPT = `Je bent een ervaren academische reviewer en schrijfcoach. 
Analyseer de gegeven tekst en geef feedback in de volgende structuur:

STERKE PUNTEN (opsomming):
- [punt 1]
- [punt 2]
- etc.

ZWAKKE PUNTEN (opsomming):
- [punt 1] 
- [punt 2]
- etc.

APA-ISSUES (opsomming):
- [issue 1]
- [issue 2]
- etc.

Wees specifiek, constructief en professioneel. Focus op inhoud, structuur, argumentatie, bronvermelding en academische schrijfstijl.`

const FIX_PROMPT = `Je bent een professionele tekstredacteur. Herschrijf de volgende tekst om het genoemde zwakke punt te verbeteren. 
Behoud de oorspronkelijke betekenis en stijl, maar verbeter de kwaliteit, duidelijkheid en academische waarde.

ZWAKKE PUNT OM TE VERBETEREN:
[WEAKNESS]

ORIGINELE TEKST:
[ORIGINAL_TEXT]

Geef alleen de verbeterde versie terug, zonder extra uitleg.`

interface ReviewResponse {
  success: boolean
  sterke_punten: string[]
  zwakke_punten: string[]
  apa_issues: string[]
  overall_feedback: string
  fixed_text?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Alleen POST requests toestaan
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
        error: 'API configuratie ontbreekt. Check Environment Variables.',
        hint: 'Voeg GEMINI_API_KEY toe aan je environment variables'
      })
    }

    // Parse request body
    const { text, fileName, fileType, fixWeakness } = req.body

    // Input validatie
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        error: 'Tekst is vereist en moet een string zijn' 
      })
    }

    if (text.length > 50000) {
      return res.status(400).json({ 
        error: 'Tekst mag maximaal 50.000 karakters bevatten' 
      })
    }

    // Check of dit een fix request is
    if (fixWeakness) {
      return await handleFixRequest(apiKey, text, fixWeakness, res)
    }

    // Normale review request
    return await handleReviewRequest(apiKey, text, fileName, fileType, res)

  } catch (error) {
    console.error('Review API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
    
    return res.status(500).json({
      success: false,
      error: 'Er is een fout opgetreden bij het reviewen van het document',
      details: errorMessage,
      timestamp: new Date().toISOString()
    })
  }
}

// Handle normale review request
async function handleReviewRequest(
  apiKey: string, 
  text: string, 
  fileName: string, 
  fileType: string, 
  res: NextApiResponse
) {
  console.log('📝 Document review gestart:', {
    fileName: fileName || 'Onbekend',
    fileType: fileType || 'Onbekend',
    textLength: text.length,
    wordCount: text.split(/\s+/).length
  })

  // Construeer de volledige prompt
  const fullPrompt = `${SYSTEM_PROMPT}

DOCUMENT INFORMATIE:
- Bestandsnaam: ${fileName || 'Onbekend'}
- Type: ${fileType || 'Onbekend'}
- Woordenaantal: ${text.split(/\s+/).length}

TE REVIEWEN TEKST:
${text}

Geef je feedback volgens de gevraagde structuur.`

  try {
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
        temperature: 0.7,
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
      throw new Error(`Gemini API call failed: ${response.status}`)
    }

    const data = await response.json()
    const reviewText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!reviewText) {
      throw new Error('Geen review ontvangen van Gemini API')
    }

    console.log('✅ Review gegenereerd:', {
      reviewLength: reviewText.length,
      fileName: fileName || 'Onbekend'
    })

    // Parse de review response
    const parsedReview = parseReviewResponse(reviewText)

    return res.status(200).json({
      success: true,
      ...parsedReview,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Fout bij document review:', error)
    throw error
  }
}

// Handle fix request
async function handleFixRequest(
  apiKey: string,
  originalText: string,
  weakness: string,
  res: NextApiResponse
) {
  console.log('🔧 Fix request gestart:', {
    textLength: originalText.length,
    weaknessLength: weakness.length
  })

  // Construeer fix prompt
  const fixPrompt = FIX_PROMPT
    .replace('[WEAKNESS]', weakness)
    .replace('[ORIGINAL_TEXT]', originalText.length > 3000 ? originalText.substring(0, 3000) + '...' : originalText)

  try {
    // Gemini API aanroep voor fix
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: fixPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1500,
        topP: 0.9,
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
      console.error('Gemini API error for fix:', response.status, errorText)
      throw new Error(`Gemini API call failed: ${response.status}`)
    }

    const data = await response.json()
    const fixedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!fixedText) {
      throw new Error('Geen fix ontvangen van Gemini API')
    }

    console.log('✅ Fix gegenereerd:', {
      originalLength: originalText.length,
      fixedLength: fixedText.length
    })

    return res.status(200).json({
      success: true,
      fixed_text: fixedText.trim(),
      original_weakness: weakness,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Fout bij fix generatie:', error)
    throw error
  }
}

// Parse de review response van Gemini
function parseReviewResponse(reviewText: string): Omit<ReviewResponse, 'success'> {
  const result = {
    sterke_punten: [] as string[],
    zwakke_punten: [] as string[],
    apa_issues: [] as string[],
    overall_feedback: ''
  }

  try {
    // Split de tekst in secties
    const sections = reviewText.split(/(?=STERKE PUNTEN|ZWAKKE PUNTEN|APA-ISSUES)/i)
    
    sections.forEach(section => {
      const trimmedSection = section.trim()
      
      if (trimmedSection.match(/^STERKE PUNTEN/i)) {
        result.sterke_punten = extractBulletPoints(trimmedSection)
      } else if (trimmedSection.match(/^ZWAKKE PUNTEN/i)) {
        result.zwakke_punten = extractBulletPoints(trimmedSection)
      } else if (trimmedSection.match(/^APA-ISSUES/i)) {
        result.apa_issues = extractBulletPoints(trimmedSection)
      } else if (trimmedSection.length > 50 && !trimmedSection.match(/^(STERKE|ZWAKKE|APA)/i)) {
        // Dit is waarschijnlijk overall feedback
        result.overall_feedback = trimmedSection
      }
    })

    // Als er geen duidelijke structuur is, probeer alternatieve parsing
    if (result.sterke_punten.length === 0 && result.zwakke_punten.length === 0) {
      result.overall_feedback = reviewText
      
      // Probeer alsnog bullet points te vinden
      const allBulletPoints = extractBulletPoints(reviewText)
      if (allBulletPoints.length > 0) {
        // Verdeel over sterke en zwakke punten
        const midPoint = Math.ceil(allBulletPoints.length / 2)
        result.sterke_punten = allBulletPoints.slice(0, midPoint)
        result.zwakke_punten = allBulletPoints.slice(midPoint)
      }
    }

  } catch (error) {
    console.error('Error parsing review response:', error)
    result.overall_feedback = reviewText
  }

  return result
}

// Extract bullet points uit een tekst sectie
function extractBulletPoints(text: string): string[] {
  const lines = text.split('\n')
  const bulletPoints: string[] = []

  lines.forEach(line => {
    const trimmedLine = line.trim()
    
    // Check voor verschillende bullet point formaten
    if (trimmedLine.match(/^[-•*]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
      const cleanedPoint = trimmedLine.replace(/^[-•*]\s+/, '').replace(/^\d+\.\s+/, '').trim()
      if (cleanedPoint.length > 5) { // Filter zeer korte punten
        bulletPoints.push(cleanedPoint)
      }
    }
  })

  return bulletPoints
}