import { NextApiRequest, NextApiResponse } from 'next'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { allow } from '../../utils/rateLimit'

// Interface voor financiële data output
interface FinancialMetrics {
  omzet?: number | null
  nettowinst?: number | null
  eigenVermogen?: number | null
  vlottendeActiva?: number | null
  kortlopendeSchulden?: number | null
  totaalActiva?: number | null
  [key: string]: number | null | undefined
}

interface ParsedFinanceData {
  success: boolean
  fileName: string
  metrics: FinancialMetrics
  rawData: any[]
  summary: {
    totalRows: number
    totalColumns: number
    detectedColumns: string[]
    matchedFields: string[]
  }
  errors?: string[]
}

// Mapping van mogelijke kolomnamen naar onze standaard velden
const FIELD_MAPPINGS = {
  omzet: [
    'omzet', 'revenue', 'turnover', 'sales', 'verkoop', 'opbrengsten',
    'totale omzet', 'total revenue', 'netto omzet', 'bruto omzet'
  ],
  nettowinst: [
    'nettowinst', 'net profit', 'net income', 'winst', 'profit',
    'netto resultaat', 'resultaat', 'earnings', 'netto winst'
  ],
  eigenVermogen: [
    'eigen vermogen', 'equity', 'shareholders equity', 'eigendom',
    'eigen kapitaal', 'kapitaal', 'vermogen', 'equity capital'
  ],
  vlottendeActiva: [
    'vlottende activa', 'current assets', 'liquide middelen', 'vlottend',
    'current', 'kortlopende activa', 'liquidity', 'cash and equivalents'
  ],
  kortlopendeSchulden: [
    'kortlopende schulden', 'current liabilities', 'short term debt',
    'kortlopend', 'current debt', 'schulden kort', 'payables'
  ],
  totaalActiva: [
    'totaal activa', 'total assets', 'balanstotaal', 'activa totaal',
    'total', 'assets', 'bezittingen', 'activa'
  ]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting check
  const k = req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "anon";
  if (!allow(String(k))) {
    return res.status(429).json({ message: "Te veel aanvragen, probeer in 1 minuut opnieuw." });
  }

  // Alleen POST requests toestaan
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.',
      allowedMethods: ['POST']
    })
  }

  try {
    // Parse multipart form data
    const contentType = req.headers['content-type']
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({
        error: 'Content-Type moet multipart/form-data zijn voor bestand uploads'
      })
    }

    // Voor deze implementatie verwachten we dat de data al als JSON wordt verstuurd
    // In een echte implementatie zou je een library zoals 'formidable' gebruiken
    const { fileData, fileName, fileType } = req.body

    if (!fileData || !fileName) {
      return res.status(400).json({
        error: 'fileData en fileName zijn vereist'
      })
    }

    console.log('💰 Financieel bestand ontvangen voor parsing:', {
      fileName,
      fileType: fileType || 'unknown',
      dataLength: typeof fileData === 'string' ? fileData.length : 'not string'
    })

    let parsedData: any[] = []
    let headers: string[] = []

    // Parse bestand op basis van type
    if (fileName.toLowerCase().endsWith('.csv')) {
      // Parse CSV met Papa Parse
      const parseResult = Papa.parse(fileData, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header: string) => header.trim().toLowerCase()
      })

      if (parseResult.errors.length > 0) {
        console.warn('CSV parsing warnings:', parseResult.errors)
      }

      parsedData = parseResult.data
      headers = parseResult.meta.fields || []

    } else if (fileName.toLowerCase().endsWith('.xlsx') || fileName.toLowerCase().endsWith('.xls')) {
      // Parse Excel met XLSX
      try {
        // Converteer base64 naar buffer als nodig
        let buffer: Buffer
        if (typeof fileData === 'string') {
          // Assumeer base64 encoded data
          buffer = Buffer.from(fileData, 'base64')
        } else {
          buffer = Buffer.from(fileData)
        }

        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const firstSheetName = workbook.SheetNames[0]
        
        if (!firstSheetName) {
          throw new Error('Geen werkbladen gevonden in Excel bestand')
        }

        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: null
        })

        if (jsonData.length === 0) {
          throw new Error('Excel werkblad is leeg')
        }

        // Extract headers (eerste rij) en converteer naar lowercase
        headers = (jsonData[0] as any[]).map((h: any) => 
          String(h || '').trim().toLowerCase()
        )

        // Converteer data naar objecten
        parsedData = jsonData.slice(1).map((row: any) => {
          const rowData: any = {}
          headers.forEach((header, index) => {
            const value = (row as any[])[index]
            rowData[header] = value !== null && value !== undefined ? value : null
          })
          return rowData
        }).filter((row: any) => {
          // Filter lege rijen
          return Object.values(row).some(val => val !== null && val !== '')
        })

      } catch (excelError) {
        console.error('Excel parsing error:', excelError)
        throw new Error(`Fout bij het verwerken van Excel bestand: ${excelError instanceof Error ? excelError.message : 'Onbekende fout'}`)
      }

    } else {
      return res.status(400).json({
        error: 'Niet ondersteund bestandsformaat. Alleen CSV en Excel (.xlsx, .xls) worden ondersteund.'
      })
    }

    console.log('📊 Data parsing voltooid:', {
      totalRows: parsedData.length,
      totalColumns: headers.length,
      headers: headers.slice(0, 10) // Eerste 10 headers voor debugging
    })

    // Extract financiële metrics
    const metrics = extractFinancialMetrics(parsedData, headers)
    const matchedFields = Object.keys(metrics).filter(key => metrics[key] !== null)

    // Bereid response voor
    const result: ParsedFinanceData = {
      success: true,
      fileName,
      metrics,
      rawData: parsedData.slice(0, 100), // Limiteer tot eerste 100 rijen voor response size
      summary: {
        totalRows: parsedData.length,
        totalColumns: headers.length,
        detectedColumns: headers,
        matchedFields
      }
    }

    console.log('✅ Financiële metrics geëxtraheerd:', {
      fileName,
      matchedFields,
      metricsFound: matchedFields.length
    })

    return res.status(200).json(result)

  } catch (error) {
    console.error('❌ Parse-fin API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
    
    return res.status(500).json({
      success: false,
      error: 'Er is een fout opgetreden bij het verwerken van het financiële bestand',
      details: errorMessage,
      timestamp: new Date().toISOString()
    })
  }
}

// Functie om financiële metrics te extraheren uit de data
function extractFinancialMetrics(data: any[], headers: string[]): FinancialMetrics {
  const metrics: FinancialMetrics = {
    omzet: null,
    nettowinst: null,
    eigenVermogen: null,
    vlottendeActiva: null,
    kortlopendeSchulden: null,
    totaalActiva: null
  }

  // Voor elke metric, zoek de beste match in de headers
  Object.keys(FIELD_MAPPINGS).forEach(metricKey => {
    const possibleNames = FIELD_MAPPINGS[metricKey as keyof typeof FIELD_MAPPINGS]
    
    // Zoek de beste header match
    let bestMatch: string | null = null
    let bestScore = 0

    headers.forEach(header => {
      const headerLower = header.toLowerCase().trim()
      
      possibleNames.forEach(possibleName => {
        const nameLower = possibleName.toLowerCase()
        
        // Exacte match krijgt hoogste score
        if (headerLower === nameLower) {
          bestMatch = header
          bestScore = 100
        }
        // Gedeeltelijke match
        else if (bestScore < 50 && (
          headerLower.includes(nameLower) || 
          nameLower.includes(headerLower)
        )) {
          bestMatch = header
          bestScore = 50
        }
        // Woord match
        else if (bestScore < 25) {
          const headerWords = headerLower.split(/\s+/)
          const nameWords = nameLower.split(/\s+/)
          
          const commonWords = headerWords.filter(word => 
            nameWords.some(nameWord => 
              word.includes(nameWord) || nameWord.includes(word)
            )
          )
          
          if (commonWords.length > 0) {
            bestMatch = header
            bestScore = 25
          }
        }
      })
    })

    // Als we een match hebben, extract de waarde
    if (bestMatch) {
      const value = extractNumericValue(data, bestMatch)
      metrics[metricKey as keyof FinancialMetrics] = value
      
      console.log(`💰 Metric match: ${metricKey} -> ${bestMatch} = ${value}`)
    }
  })

  return metrics
}

// Functie om numerieke waarde te extraheren uit een kolom
function extractNumericValue(data: any[], columnName: string): number | null {
  if (data.length === 0) return null

  // Zoek naar numerieke waarden in de kolom
  const numericValues: number[] = []

  data.forEach(row => {
    const value = row[columnName]
    
    if (value !== null && value !== undefined) {
      let numValue: number | null = null

      if (typeof value === 'number') {
        numValue = value
      } else if (typeof value === 'string') {
        // Probeer string naar nummer te converteren
        // Verwijder currency symbolen, komma's, etc.
        const cleanValue = value
          .replace(/[€$£¥₹]/g, '') // Currency symbolen
          .replace(/[,\s]/g, '') // Komma's en spaties
          .replace(/[()]/g, '') // Haakjes (voor negatieve getallen)
          .trim()

        const parsed = parseFloat(cleanValue)
        if (!isNaN(parsed)) {
          // Check of originele waarde haakjes had (negatief getal)
          numValue = value.includes('(') && value.includes(')') ? -parsed : parsed
        }
      }

      if (numValue !== null && !isNaN(numValue)) {
        numericValues.push(numValue)
      }
    }
  })

  if (numericValues.length === 0) return null

  // Verschillende strategieën om de beste waarde te kiezen:
  
  // 1. Als er maar één waarde is, gebruik die
  if (numericValues.length === 1) {
    return numericValues[0]
  }

  // 2. Als er meerdere waarden zijn, neem de laatste (meest recente)
  // of de grootste absolute waarde als dat logischer lijkt
  const lastValue = numericValues[numericValues.length - 1]
  const maxAbsValue = numericValues.reduce((max, val) => 
    Math.abs(val) > Math.abs(max) ? val : max
  )

  // Gebruik de laatste waarde, tenzij er een veel grotere waarde is
  if (Math.abs(maxAbsValue) > Math.abs(lastValue) * 2) {
    return maxAbsValue
  }

  return lastValue
}

// Export configuratie voor Next.js API routes
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Verhoog limiet voor Excel bestanden
    },
  },
}