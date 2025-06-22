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
    const ratioPromises: Promise<void>[] = []

    // Helper functie voor Gemini API calls
    const generateExplanation = async (ratioName: string, ratioValue: number | null, ratioFormula: string) => {
      if (ratioValue === null) {
        explanations.push({
          ratio: ratioName,
          waarde: 'Niet beschikbaar',
          uitleg: 'Onvoldoende financiële data om deze ratio te berekenen. Zorg ervoor dat alle benodigde gegevens beschikbaar zijn in je financiële administratie.'
        })
        return
      }

      try {
        // Bepaal waarde formatting
        let formattedValue: string
        if (ratioName.includes('Rentabiliteit') || ratioName.includes('Solvabiliteit')) {
          formattedValue = `${ratioValue}%`
        } else {
          formattedValue = ratioValue.toString()
        }

        // Construeer prompt voor deze specifieke ratio
        const prompt = SYSTEM_PROMPT
          .replace('[ratio-naam]', ratioName)
          .replace('waarde X', `waarde ${formattedValue}`) + 
          `\n\nRatio: ${ratioName}\nWaarde: ${formattedValue}\nFormule: ${ratioFormula}\n\nGeef een heldere uitleg over wat deze ratio betekent voor een zorgorganisatie.`

        console.log(`🤖 Genereer uitleg voor ${ratioName}:`, formattedValue)

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
            temperature: 0.7,
            maxOutputTokens: 200, // Beperkt tot ~120 woorden
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
          console.error(`Gemini API error for ${ratioName}:`, response.status, errorText)
          throw new Error(`Gemini API call failed: ${response.status}`)
        }

        const data = await response.json()
        const explanation = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!explanation) {
          throw new Error('Geen uitleg ontvangen van Gemini API')
        }

        explanations.push({
          ratio: ratioName,
          waarde: formattedValue,
          uitleg: explanation.trim()
        })

        console.log(`✅ Uitleg gegenereerd voor ${ratioName}`)

      } catch (error) {
        console.error(`❌ Fout bij genereren uitleg voor ${ratioName}:`, error)
        
        // Fallback uitleg bij API fout
        const fallbackExplanations: { [key: string]: string } = {
          'Rentabiliteit (ROE)': `Rentabiliteit van ${formattedValue} toont hoe efficiënt je organisatie het eigen vermogen inzet. Voor zorgorganisaties is 5-15% gezond. Een lagere waarde kan duiden op inefficiëntie, een hogere waarde op mogelijk te weinig investeringen in zorgkwaliteit.`,
          'Liquiditeit (Current Ratio)': `Liquiditeit van ${formattedValue} geeft aan of je organisatie kortlopende verplichtingen kan nakomen. Een waarde tussen 1,0-3,0 is gezond voor zorgorganisaties. Te laag betekent liquiditeitsproblemen, te hoog kan inefficiënt gebruik van middelen betekenen.`,
          'Solvabiliteit (Equity Ratio)': `Solvabiliteit van ${formattedValue} toont de financiële stabiliteit. Voor zorgorganisaties is 20-60% eigen vermogen gezond. Dit geeft aan hoeveel van de organisatie echt 'van jezelf' is versus gefinancierd door schulden.`
        }

        explanations.push({
          ratio: ratioName,
          waarde: formattedValue,
          uitleg: fallbackExplanations[ratioName] || `Deze ratio heeft een waarde van ${formattedValue}. Raadpleeg een financieel adviseur voor een gedetailleerde analyse van deze waarde binnen de zorgsector.`
        })
      }
    }

    // Start alle API calls parallel
    if (ratioAnalysis.rentabiliteit.value !== null) {
      ratioPromises.push(generateExplanation(
        ratioAnalysis.rentabiliteit.name,
        ratioAnalysis.rentabiliteit.value,
        ratioAnalysis.rentabiliteit.formula
      ))
    }

    if (ratioAnalysis.liquiditeit.value !== null) {
      ratioPromises.push(generateExplanation(
        ratioAnalysis.liquiditeit.name,
        ratioAnalysis.liquiditeit.value,
        ratioAnalysis.liquiditeit.formula
      ))
    }

    if (ratioAnalysis.solvabiliteit.value !== null) {
      ratioPromises.push(generateExplanation(
        ratioAnalysis.solvabiliteit.name,
        ratioAnalysis.solvabiliteit.value,
        ratioAnalysis.solvabiliteit.formula
      ))
    }

    // Wacht tot alle uitleg gegenereerd is
    await Promise.all(ratioPromises)

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