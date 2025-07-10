// Lokale APA validator voor client-side gebruik
// Detecteert de meest voorkomende APA-fouten zonder externe API's

export interface APAIssue {
  type: 'citation' | 'reference' | 'format' | 'style'
  severity: 'error' | 'warning' | 'suggestion'
  message: string
  line?: number
  suggestion?: string
}

export interface APAValidationResult {
  isValid: boolean
  issues: APAIssue[]
  summary: {
    totalIssues: number
    errors: number
    warnings: number
    suggestions: number
  }
}

// Regex patterns voor APA-elementen
const APA_PATTERNS = {
  // In-text citaties
  inTextCitation: /\([A-Za-z][^)]*,\s*\d{4}[a-z]?(?:,\s*p\.\s*\d+)?\)/g,
  
  // Directe citaten (moeten paginanummer hebben)
  directQuote: /"[^"]{20,}"/g,
  
  // Auteur-jaar patronen
  authorYear: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\((\d{4}[a-z]?)\)/g,
  
  // Referentielijst items
  reference: /^[A-Z][a-z]+,\s*[A-Z]\.(?:\s*[A-Z]\.)*\s*\(\d{4}[a-z]?\)\./gm,
  
  // DOI/URL patronen
  doi: /doi:\s*10\.\d+\/[^\s]+/gi,
  url: /Retrieved\s+from\s+https?:\/\/[^\s]+/gi,
  
  // Veelvoorkomende fouten
  ampersand: /\s+&\s+/g, // & in plaats van 'en'
  etAl: /et\s+al\.?/gi,
  pageNumbers: /p\.\s*\d+/g,
  pageRanges: /pp\.\s*\d+-\d+/g
}

// Nederlandse APA-specifieke patronen
const DUTCH_APA_PATTERNS = {
  dutchAnd: /\s+en\s+(?=[A-Z][a-z]+\s*\(\d{4}\))/g, // 'en' in citaties
  dutchMonths: /(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)/gi
}

export function validateAPA(text: string): APAValidationResult {
  const issues: APAIssue[] = []
  const lines = text.split('\n')
  
  // 1. Controleer in-text citaties
  checkInTextCitations(text, lines, issues)
  
  // 2. Controleer directe citaten
  checkDirectQuotes(text, lines, issues)
  
  // 3. Controleer auteur-jaar format
  checkAuthorYearFormat(text, lines, issues)
  
  // 4. Controleer referentielijst
  checkReferenceList(text, lines, issues)
  
  // 5. Controleer Nederlandse APA-conventies
  checkDutchConventions(text, lines, issues)
  
  // 6. Controleer algemene formatting
  checkGeneralFormatting(text, lines, issues)
  
  // Bereken samenvatting
  const summary = {
    totalIssues: issues.length,
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    suggestions: issues.filter(i => i.severity === 'suggestion').length
  }
  
  return {
    isValid: summary.errors === 0,
    issues,
    summary
  }
}

function checkInTextCitations(text: string, lines: string[], issues: APAIssue[]): void {
  // Zoek naar mogelijke citaties zonder juist format
  const possibleCitations = text.match(/\([^)]*\d{4}[^)]*\)/g) || []
  
  possibleCitations.forEach(citation => {
    const lineIndex = findLineIndex(text, citation, lines)
    
    // Check voor correcte format (Auteur, jaar)
    if (!citation.match(/\([A-Za-z][^,]*,\s*\d{4}[a-z]?\)/)) {
      issues.push({
        type: 'citation',
        severity: 'error',
        message: `Incorrecte citatie format: ${citation}`,
        line: lineIndex + 1,
        suggestion: 'Gebruik format: (Auteur, jaar) of (Auteur, jaar, p. X)'
      })
    }
    
    // Check voor ontbrekende spatie na komma
    if (citation.match(/\([^,]+,\d{4}\)/)) {
      issues.push({
        type: 'format',
        severity: 'warning',
        message: `Ontbrekende spatie na komma in citatie: ${citation}`,
        line: lineIndex + 1,
        suggestion: 'Voeg spatie toe na komma: (Auteur, jaar)'
      })
    }
  })
}

function checkDirectQuotes(text: string, lines: string[], issues: APAIssue[]): void {
  const quotes = text.match(APA_PATTERNS.directQuote) || []
  
  quotes.forEach(quote => {
    const lineIndex = findLineIndex(text, quote, lines)
    
    // Zoek naar paginanummer in de buurt van het citaat
    const quoteIndex = text.indexOf(quote)
    const surroundingText = text.substring(
      Math.max(0, quoteIndex - 100),
      Math.min(text.length, quoteIndex + quote.length + 100)
    )
    
    if (!surroundingText.match(/p\.\s*\d+/)) {
      issues.push({
        type: 'citation',
        severity: 'error',
        message: 'Directe citaten moeten een paginanummer bevatten',
        line: lineIndex + 1,
        suggestion: 'Voeg paginanummer toe: (Auteur, jaar, p. X)'
      })
    }
  })
}

function checkAuthorYearFormat(text: string, lines: string[], issues: APAIssue[]): void {
  // Check voor & in plaats van 'en' in Nederlandse teksten
  const ampersandMatches = text.match(APA_PATTERNS.ampersand) || []
  
  ampersandMatches.forEach(match => {
    const lineIndex = findLineIndex(text, match, lines)
    
    // Check of dit binnen een citatie is
    const matchIndex = text.indexOf(match)
    const beforeMatch = text.substring(Math.max(0, matchIndex - 50), matchIndex)
    const afterMatch = text.substring(matchIndex, Math.min(text.length, matchIndex + 50))
    
    if (beforeMatch.includes('(') && afterMatch.includes(')')) {
      issues.push({
        type: 'style',
        severity: 'warning',
        message: 'Gebruik "en" in plaats van "&" in Nederlandse APA-citaties',
        line: lineIndex + 1,
        suggestion: 'Vervang & door "en" in lopende tekst'
      })
    }
  })
}

function checkReferenceList(text: string, lines: string[], issues: APAIssue[]): void {
  // Zoek naar referentielijst sectie
  const referenceSection = text.match(/(?:referenties|literatuur|bronnen)[\s\S]*$/i)
  
  if (!referenceSection) {
    issues.push({
      type: 'reference',
      severity: 'warning',
      message: 'Geen referentielijst gevonden',
      suggestion: 'Voeg een referentielijst toe met alle geciteerde bronnen'
    })
    return
  }
  
  const refText = referenceSection[0]
  const refLines = refText.split('\n')
  
  // Check elke referentie
  refLines.forEach((line, index) => {
    if (line.trim() && !line.match(/^(referenties|literatuur|bronnen)/i)) {
      // Check voor basis APA format
      if (!line.match(/^[A-Z][a-z]+,\s*[A-Z]\..*\(\d{4}[a-z]?\)/)) {
        issues.push({
          type: 'reference',
          severity: 'error',
          message: `Incorrecte referentie format: ${line.substring(0, 50)}...`,
          line: lines.length - refLines.length + index + 1,
          suggestion: 'Gebruik format: Auteur, A. A. (jaar). Titel. Uitgever.'
        })
      }
    }
  })
}

function checkDutchConventions(text: string, lines: string[], issues: APAIssue[]): void {
  // Check voor Nederlandse maanden (moeten in het Engels)
  const dutchMonths = text.match(DUTCH_APA_PATTERNS.dutchMonths) || []
  
  dutchMonths.forEach(month => {
    const lineIndex = findLineIndex(text, month, lines)
    
    const englishMonth = translateDutchMonth(month)
    if (englishMonth) {
      issues.push({
        type: 'style',
        severity: 'suggestion',
        message: `Nederlandse maandnaam gevonden: ${month}`,
        line: lineIndex + 1,
        suggestion: `Gebruik Engelse maandnaam: ${englishMonth}`
      })
    }
  })
}

function checkGeneralFormatting(text: string, lines: string[], issues: APAIssue[]): void {
  // Check voor dubbele spaties
  const doubleSpaces = text.match(/\s{2,}/g) || []
  if (doubleSpaces.length > 0) {
    issues.push({
      type: 'format',
      severity: 'suggestion',
      message: `${doubleSpaces.length} gevallen van dubbele spaties gevonden`,
      suggestion: 'Gebruik enkele spaties tussen woorden'
    })
  }
  
  // Check voor et al. formatting
  const etAlMatches = text.match(APA_PATTERNS.etAl) || []
  etAlMatches.forEach(match => {
    if (match !== 'et al.') {
      const lineIndex = findLineIndex(text, match, lines)
      issues.push({
        type: 'format',
        severity: 'warning',
        message: `Incorrecte "et al." formatting: ${match}`,
        line: lineIndex + 1,
        suggestion: 'Gebruik "et al." (met punt)'
      })
    }
  })
}

function findLineIndex(text: string, searchText: string, lines: string[]): number {
  const index = text.indexOf(searchText)
  if (index === -1) return 0
  
  let currentIndex = 0
  for (let i = 0; i < lines.length; i++) {
    if (currentIndex + lines[i].length >= index) {
      return i
    }
    currentIndex += lines[i].length + 1 // +1 voor newline
  }
  return 0
}

function translateDutchMonth(dutchMonth: string): string | null {
  const translations: { [key: string]: string } = {
    'januari': 'January',
    'februari': 'February',
    'maart': 'March',
    'april': 'April',
    'mei': 'May',
    'juni': 'June',
    'juli': 'July',
    'augustus': 'August',
    'september': 'September',
    'oktober': 'October',
    'november': 'November',
    'december': 'December'
  }
  
  return translations[dutchMonth.toLowerCase()] || null
}

// Hulpfunctie voor snelle validatie
export function quickAPACheck(text: string): { hasIssues: boolean; issueCount: number } {
  const result = validateAPA(text)
  return {
    hasIssues: !result.isValid,
    issueCount: result.summary.totalIssues
  }
}

// Hulpfunctie voor het genereren van een samenvatting
export function generateAPASummary(result: APAValidationResult): string {
  if (result.isValid) {
    return "✅ Geen APA-problemen gevonden! Je bronvermeldingen en citaten lijken correct te zijn."
  }
  
  const { summary } = result
  let summaryText = `🔍 APA-controle resultaten:\n\n`
  
  if (summary.errors > 0) {
    summaryText += `❌ ${summary.errors} fout(en) gevonden die aangepast moeten worden\n`
  }
  
  if (summary.warnings > 0) {
    summaryText += `⚠️ ${summary.warnings} waarschuwing(en) voor verbetering\n`
  }
  
  if (summary.suggestions > 0) {
    summaryText += `💡 ${summary.suggestions} suggestie(s) voor optimalisatie\n`
  }
  
  summaryText += `\n📋 Controleer de details hieronder voor specifieke verbeterpunten.`
  
  return summaryText
}