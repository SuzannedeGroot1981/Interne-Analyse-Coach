import { NextApiRequest, NextApiResponse } from 'next'

const SYSTEM_PROMPT = `Je bent een ervaren docent & managementcoach in de zorg.
Begin elk antwoord met een compliment; eindig met 2-3 concrete verbeterpunten.
Controleer of het 7S-element volledig is. Max 250 woorden.`

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
      
      // Specifieke error handling
      if (response.status === 429) {
        return res.status(429).json({
          error: 'API quota bereikt. Probeer het later opnieuw.',
          details: 'Rate limit exceeded'
        })
      }
      
      if (response.status === 400) {
        return res.status(400).json({
          error: 'Ongeldige aanvraag naar Gemini API.',
          details: errorText
        })
      }
      
      throw new Error(`Gemini API call failed: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    
    // Extract de response tekst
    const coachFeedback = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!coachFeedback) {
      console.error('No feedback received from Gemini API:', data)
      return res.status(500).json({
        error: 'Geen feedback ontvangen van de AI coach',
        details: 'Empty response from Gemini API'
      })
    }

    console.log('✅ Coach feedback gegenereerd:', {
      feedbackLength: coachFeedback.length,
      stepTitle: stepTitle || 'Algemeen',
      success: true
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
    
    return res.status(500).json({
      error: 'Er is een fout opgetreden bij het genereren van coach feedback',
      details: errorMessage,
      timestamp: new Date().toISOString()
    })
  }
}