import { NextApiRequest, NextApiResponse } from 'next/server'
import { calculateAllRatios, type FinancialData, type RatioAnalysis } from '../../lib/ratios'

const SYSTEM_PROMPT = `Je bent een financieel coach in de zorg. Leg in ≤120 woorden uit:
wat betekent [ratio-naam] en hoe beoordeel je waarde X binnen de zorgsector?
Gebruik eenvoudige taal en één concreet voorbeeld.`

interface RatioExplanation {
  ratio: string
  waarde: string
  uitleg: string
}

interface FinAnalysisResponse {
  success: boolean
  ratios: RatioAnalysis
  explanations: RatioExplanation[]
  summary: {
    overallHealth: 'healthy' | 'warning' | 'critical'
    keyInsights: string[]
  }
}

// Specifieke prompt functie voor elke ratio
function promptForRatio(ratioType: string, value: number): string {
  switch (ratioType) {
    case "rentabiliteit":
      return `Je bent financieel adviseur in de zorg.
Leg in max 120 woorden uit wat rentabiliteit betekent en hoe waarde ${value.toFixed(2)}%
wordt beoordeeld voor een zorginstelling. Gebruik één concreet voorbeeld (bijv. investering
in medische apparatuur).`

    case "liquiditeit":
      return `Je bent financieel adviseur in de zorg.
Leg in max 120 woorden uit wat liquiditeit betekent en hoe waarde ${value.toFixed(2)}
wordt beoordeeld voor een zorginstelling. Gebruik één concreet voorbeeld (bijv. betaling
van leveranciers of salarissen).`

    case "solvabiliteit":
      return `Je bent financieel adviseur in de zorg.
Leg in max 120 woorden uit wat solvabiliteit betekent en hoe waarde ${value.toFixed(2)}%
wordt beoordeeld voor een zorginstelling. Gebruik één concreet voorbeeld (bijv. financiering
van nieuwe zorglocatie of uitbreiding).`

    default:
      return `Je bent financieel adviseur in de zorg.
Leg in max 120 woorden uit wat deze financiële ratio betekent en hoe waarde ${value.toFixed(2)}
wordt beoordeeld voor een zorginstelling.`
  }
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

    // Parse request body - verwacht financiële data uit parser
    const { metrics } = req.body as { metrics: FinancialData }

    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({
        error: 'Financiële metrics zijn vereist',
        hint: 'Gebruik eerst /api/parse-fin om financiële data te verwerken'
      })
    }

    console.log('💰 Financiële analyse gestart:', {
      hasOmzet: metrics.omzet !== null,
      hasNettowinst: metrics.nettowinst !== null,
      hasEigenVermogen: metrics.eigenVermogen !== null,
      hasVlottendeActiva: metrics.vlottendeActiva !== null,
      hasKortlopendeSchulden: metrics.kortlopendeSchulden !== null,
      hasTotaalActiva: metrics.totaalActiva !== null
    })

    // Bereken alle ratio's
    const ratioAnalysis = calculateAllRatios(metrics)

    // Genereer AI uitleg voor elke beschikbare ratio
    const explanations: RatioExplanation[] = []

    // Definieer ratio mapping voor de loop
    const ratioMappings = [
      { key: 'rentabiliteit', ratio: ratioAnalysis.rentabiliteit },
      { key: 'liquiditeit', ratio: ratioAnalysis.liquiditeit },
      { key: 'solvabiliteit', ratio: ratioAnalysis.solvabiliteit }
    ]

    // Loop over ratio's en genereer uitleg
    for (const { key, ratio } of ratioMappings) {
      if (ratio.value !== null) {
        try {
          console.log(`🤖 Genereer uitleg voor ${key}:`, ratio.value)

          // Gebruik specifieke prompt functie
          const promptText = promptForRatio(key, ratio.value)

          // Gemini API aanroep
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`
          
          const requestBody = {
            contents: [
              {
                parts: [
                  {
                    text: promptText
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.6, // Verhoogd van 0.4 naar 0.6 voor betere uitleg
              maxOutputTokens: 200,
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
            console.error(`Gemini API error for ${key}:`, response.status, errorText)
            throw new Error(`Gemini API call failed: ${response.status}`)
          }

          const data = await response.json()
          const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text

          if (!explanation) {
            throw new Error('Geen uitleg ontvangen van Gemini API')
          }

          // Format waarde voor weergave
          let formattedValue: string
          if (key === 'rentabiliteit' || key === 'solvabiliteit') {
            formattedValue = `${ratio.value}%`
          } else {
            formattedValue = ratio.value.toString()
          }

          explanations.push({
            ratio: ratio.name,
            waarde: formattedValue,
            uitleg: explanation.trim()
          })

          console.log(`✅ Uitleg gegenereerd voor ${key}`)

        } catch (error) {
          console.error(`❌ Fout bij genereren uitleg voor ${key}:`, error)
          
          // Fallback uitleg bij API fout
          const fallbackExplanations: { [key: string]: string } = {
            'rentabiliteit': `Rentabiliteit van ${ratio.value}% toont hoe efficiënt je organisatie het eigen vermogen inzet. Voor zorgorganisaties is 5-15% gezond. Een lagere waarde kan duiden op inefficiëntie, een hogere waarde op mogelijk te weinig investeringen in zorgkwaliteit. Bijvoorbeeld: bij 8% rentabiliteit genereert elke €100 eigen vermogen €8 winst per jaar.`,
            'liquiditeit': `Liquiditeit van ${ratio.value} geeft aan of je organisatie kortlopende verplichtingen kan nakomen. Een waarde tussen 1,0-3,0 is gezond voor zorgorganisaties. Te laag betekent liquiditeitsproblemen, te hoog kan inefficiënt gebruik van middelen betekenen. Bijvoorbeeld: bij 1,5 heb je €1,50 aan vlottende activa voor elke €1 aan kortlopende schulden.`,
            'solvabiliteit': `Solvabiliteit van ${ratio.value}% toont de financiële stabiliteit. Voor zorgorganisaties is 20-60% eigen vermogen gezond. Dit geeft aan hoeveel van de organisatie echt 'van jezelf' is versus gefinancierd door schulden. Bijvoorbeeld: bij 35% solvabiliteit is €35 van elke €100 activa gefinancierd met eigen vermogen.`
          }

          // Format waarde voor fallback
          let formattedValue: string
          if (key === 'rentabiliteit' || key === 'solvabiliteit') {
            formattedValue = `${ratio.value}%`
          } else {
            formattedValue = ratio.value.toString()
          }

          explanations.push({
            ratio: ratio.name,
            waarde: formattedValue,
            uitleg: fallbackExplanations[key] || `Deze ratio heeft een waarde van ${formattedValue}. Raadpleeg een financieel adviseur voor een gedetailleerde analyse van deze waarde binnen de zorgsector.`
          })
        }
      } else {
        // Ratio niet beschikbaar
        explanations.push({
          ratio: ratio.name,
          waarde: 'Niet beschikbaar',
          uitleg: 'Onvoldoende financiële data om deze ratio te berekenen. Zorg ervoor dat alle benodigde gegevens beschikbaar zijn in je financiële administratie.'
        })
      }
    }

    // Bepaal overall health status
    let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy'
    const { summary } = ratioAnalysis

    if (summary.totalRatios === 0) {
      overallHealth = 'critical'
    } else if (summary.warningRatios > summary.healthyRatios) {
      overallHealth = 'warning'
    } else if (summary.warningRatios > 0) {
      overallHealth = 'warning'
    }

    // Genereer key insights
    const keyInsights: string[] = []
    
    if (summary.totalRatios === 0) {
      keyInsights.push('Onvoldoende financiële data voor complete analyse')
    } else {
      if (summary.healthyRatios > 0) {
        keyInsights.push(`${summary.healthyRatios} van ${summary.totalRatios} ratio's zijn gezond`)
      }
      if (summary.warningRatios > 0) {
        keyInsights.push(`${summary.warningRatios} ratio's vereisen aandacht`)
      }
      if (summary.totalRatios === 3) {
        keyInsights.push('Complete financiële analyse beschikbaar')
      }
    }

    // Bereid response voor
    const result: FinAnalysisResponse = {
      success: true,
      ratios: ratioAnalysis,
      explanations,
      summary: {
        overallHealth,
        keyInsights
      }
    }

    console.log('✅ Financiële analyse voltooid:', {
      totalRatios: summary.totalRatios,
      healthyRatios: summary.healthyRatios,
      warningRatios: summary.warningRatios,
      explanationsGenerated: explanations.length,
      overallHealth
    })

    return res.status(200).json(result)

  } catch (error) {
    console.error('❌ Fin-analysis API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
    
    return res.status(500).json({
      success: false,
      error: 'Er is een fout opgetreden bij de financiële analyse',
      details: errorMessage,
      timestamp: new Date().toISOString()
    })
  }
}