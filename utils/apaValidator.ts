// Lokale APA validator voor Hogeschool Leiden
// Detecteert de meest voorkomende APA-fouten client-side

export interface APAResult {
  score: number // 0-100
  totalIssues: number
  criticalIssues: string[]
  warningIssues: string[]
  suggestions: string[]
  passedChecks: string[]
}

export interface APACheck {
  name: string
  description: string
  check: (text: string) => boolean
  severity: 'critical' | 'warning'
  suggestion: string
}

// APA checks voor Nederlandse academische teksten
const APA_CHECKS: APACheck[] = [
  // Kritieke checks
  {
    name: 'Bronvermelding aanwezig',
    description: 'Tekst bevat bronvermeldingen in APA-formaat',
    check: (text: string) => {
      const citationPatterns = [
        /\([A-Za-z]+,?\s+\d{4}\)/g, // (Auteur, 2024)
        /\([A-Za-z]+\s+&\s+[A-Za-z]+,?\s+\d{4}\)/g, // (Auteur & Auteur, 2024)
        /\([A-Za-z]+\s+et\s+al\.,?\s+\d{4}\)/g, // (Auteur et al., 2024)
      ]
      return citationPatterns.some(pattern => pattern.test(text))
    },
    severity: 'critical',
    suggestion: 'Voeg bronvermeldingen toe in het formaat (Auteur, jaar) of (Auteur & Auteur, jaar)'
  },
  {
    name: 'Correcte haakjes in citaten',
    description: 'Citaten gebruiken ronde haakjes, niet vierkante',
    check: (text: string) => {
      const squareBrackets = /\[[A-Za-z]+,?\s+\d{4}\]/g
      return !squareBrackets.test(text)
    },
    severity: 'critical',
    suggestion: 'Gebruik ronde haakjes () voor citaten, niet vierkante haakjes []'
  },
  {
    name: 'Jaar in citaat',
    description: 'Citaten bevatten een jaartal',
    check: (text: string) => {
      const citations = text.match(/\([^)]+\)/g) || []
      if (citations.length === 0) return true // Geen citaten gevonden
      
      const citationsWithYear = citations.filter(citation => 
        /\d{4}/.test(citation)
      )
      return citationsWithYear.length >= citations.length * 0.8 // 80% moet jaar hebben
    },
    severity: 'critical',
    suggestion: 'Zorg dat alle citaten een jaartal bevatten: (Auteur, 2024)'
  },
  {
    name: 'Spatie na komma in citaat',
    description: 'Correcte spatiëring in citaten',
    check: (text: string) => {
      const badSpacing = /\([A-Za-z]+,\d{4}\)/g // Geen spatie na komma
      return !badSpacing.test(text)
    },
    severity: 'warning',
    suggestion: 'Voeg een spatie toe na de komma in citaten: (Auteur, 2024) niet (Auteur,2024)'
  },
  {
    name: 'Ampersand in citaat',
    description: 'Gebruik & in plaats van "en" in citaten',
    check: (text: string) => {
      const dutchAnd = /\([A-Za-z]+\s+en\s+[A-Za-z]+,?\s+\d{4}\)/g
      return !dutchAnd.test(text)
    },
    severity: 'warning',
    suggestion: 'Gebruik & in plaats van "en" in citaten: (Jansen & Pietersen, 2024)'
  },
  {
    name: 'Et al. formatting',
    description: 'Correcte formatting van et al.',
    check: (text: string) => {
      const incorrectEtAl = /\([A-Za-z]+\s+et\s+al[^.,]/g // et al zonder punt
      return !incorrectEtAl.test(text)
    },
    severity: 'warning',
    suggestion: 'Gebruik "et al." met punt: (Jansen et al., 2024)'
  },
  {
    name: 'Paginanummer bij directe citaten',
    description: 'Directe citaten hebben paginanummers',
    check: (text: string) => {
      const directQuotes = text.match(/"[^"]{20,}"/g) || [] // Citaten van 20+ karakters
      if (directQuotes.length === 0) return true
      
      // Check of er paginanummers zijn in de buurt van citaten
      const pageNumbers = /p\.\s*\d+|pp\.\s*\d+-\d+/g
      return pageNumbers.test(text) || directQuotes.length < 2
    },
    severity: 'critical',
    suggestion: 'Voeg paginanummers toe bij directe citaten: (Auteur, 2024, p. 15)'
  },
  {
    name: 'Hoofdletters in titels',
    description: 'Correcte hoofdlettergebruik in referenties',
    check: (text: string) => {
      // Check voor veelvoorkomende titel-patronen
      const titlePatterns = /[A-Z][a-z]+\s+[A-Z][a-z]+\s+[A-Z][a-z]+/g
      const matches = text.match(titlePatterns) || []
      return matches.length < 5 // Niet te veel hoofdletters
    },
    severity: 'warning',
    suggestion: 'Gebruik sentence case voor titels in referenties (alleen eerste woord met hoofdletter)'
  },
  {
    name: 'Geen URL in tekst',
    description: 'URLs staan in referentielijst, niet in lopende tekst',
    check: (text: string) => {
      const urls = /https?:\/\/[^\s]+/g
      return !urls.test(text)
    },
    severity: 'warning',
    suggestion: 'Plaats URLs in de referentielijst, niet in de lopende tekst'
  },
  {
    name: 'Consistente citaatstijl',
    description: 'Consistente gebruik van citaatstijl door de tekst',
    check: (text: string) => {
      const authorYear = (text.match(/\([A-Za-z]+,?\s+\d{4}\)/g) || []).length
      const yearAuthor = (text.match(/\(\d{4},?\s+[A-Za-z]+\)/g) || []).length
      
      if (authorYear === 0 && yearAuthor === 0) return true
      return Math.abs(authorYear - yearAuthor) <= 1 // Maximaal 1 verschil
    },
    severity: 'warning',
    suggestion: 'Gebruik consistent (Auteur, jaar) formaat door de hele tekst'
  }
]

export function validateAPA(text: string): APAResult {
  if (!text || text.trim().length < 20) {
    return {
      score: 0,
      totalIssues: 1,
      criticalIssues: ['Tekst is te kort voor APA-analyse (minimaal 20 karakters)'],
      warningIssues: [],
      suggestions: ['Voeg meer tekst toe om een volledige APA-analyse uit te voeren'],
      passedChecks: []
    }
  }

  const results = APA_CHECKS.map(check => ({
    check,
    passed: check.check(text)
  }))

  const passedChecks = results
    .filter(r => r.passed)
    .map(r => r.check.name)

  const failedChecks = results.filter(r => !r.passed)
  
  const criticalIssues = failedChecks
    .filter(r => r.check.severity === 'critical')
    .map(r => r.check.description)

  const warningIssues = failedChecks
    .filter(r => r.check.severity === 'warning')
    .map(r => r.check.description)

  const suggestions = failedChecks.map(r => r.check.suggestion)

  const totalIssues = criticalIssues.length + warningIssues.length
  const totalChecks = APA_CHECKS.length
  const passedCount = passedChecks.length
  
  // Score berekening: kritieke fouten wegen zwaarder
  const criticalWeight = 0.7
  const warningWeight = 0.3
  const maxCritical = APA_CHECKS.filter(c => c.severity === 'critical').length
  const maxWarning = APA_CHECKS.filter(c => c.severity === 'warning').length
  
  const criticalScore = ((maxCritical - criticalIssues.length) / maxCritical) * criticalWeight
  const warningScore = ((maxWarning - warningIssues.length) / maxWarning) * warningWeight
  
  const score = Math.round((criticalScore + warningScore) * 100)

  return {
    score: Math.max(0, Math.min(100, score)),
    totalIssues,
    criticalIssues,
    warningIssues,
    suggestions,
    passedChecks
  }
}

export function formatAPAResults(result: APAResult): string {
  let output = `**APA Score: ${result.score}/100**\n\n`
  
  if (result.score >= 90) {
    output += `**Uitstekend!** Je APA-stijl is bijna perfect.\n\n`
  } else if (result.score >= 75) {
    output += `**Goed!** Je APA-stijl is grotendeels correct.\n\n`
  } else if (result.score >= 60) {
    output += `**Redelijk.** Er zijn enkele verbeterpunten voor je APA-stijl.\n\n`
  } else {
    output += `**Aandacht vereist.** Je APA-stijl heeft belangrijke verbeteringen nodig.\n\n`
  }

  if (result.criticalIssues.length > 0) {
    output += `**Kritieke Issues (${result.criticalIssues.length}):**\n`
    result.criticalIssues.forEach((issue, index) => {
      output += `${index + 1}. ${issue}\n`
    })
    output += '\n'
  }

  if (result.warningIssues.length > 0) {
    output += `**Waarschuwingen (${result.warningIssues.length}):**\n`
    result.warningIssues.forEach((issue, index) => {
      output += `${index + 1}. ${issue}\n`
    })
    output += '\n'
  }

  if (result.suggestions.length > 0) {
    output += `**Verbetervoorstellen:**\n`
    result.suggestions.slice(0, 3).forEach((suggestion, index) => {
      output += `${index + 1}. ${suggestion}\n`
    })
    output += '\n'
  }

  if (result.passedChecks.length > 0) {
    output += `**Correct uitgevoerd (${result.passedChecks.length}):**\n`
    result.passedChecks.slice(0, 3).forEach((check, index) => {
      output += `${index + 1}. ${check}\n`
    })
  }

  output += `\n**APA 7e editie richtlijnen voor Hogeschool Leiden**`

  return output
}

// Specifieke checks per 7S-onderdeel
export function getStepSpecificTips(stepId: string): string[] {
  const tips: { [key: string]: string[] } = {
    'strategy': [
      'Citeer strategische documenten en beleidsstukken',
      'Verwijs naar organisatietheorie en strategiemodellen',
      'Gebruik recente bronnen (< 5 jaar) voor strategische trends'
    ],
    'structure': [
      'Citeer organisatiekundige literatuur over structuren',
      'Verwijs naar organogrammen en functieomschrijvingen',
      'Gebruik bronnen over hiërarchie en rapportagelijnen'
    ],
    'systems': [
      'Citeer literatuur over processen en systemen',
      'Verwijs naar kwaliteitsmanagement en procesbeschrijvingen',
      'Gebruik bronnen over IT-systemen en digitalisering'
    ],
    'shared-values': [
      'Citeer literatuur over organisatiecultuur en waarden',
      'Verwijs naar onderzoek naar medewerkertevredenheid',
      'Gebruik bronnen over cultuurverandering'
    ],
    'skills': [
      'Citeer literatuur over competentiemanagement',
      'Verwijs naar opleidingsplannen en ontwikkeltrajecten',
      'Gebruik bronnen over kennismanagement'
    ],
    'style': [
      'Citeer literatuur over leiderschapsstijlen',
      'Verwijs naar managementtheorieën en -modellen',
      'Gebruik bronnen over leiderschapsontwikkeling'
    ],
    'staff': [
      'Citeer HR-literatuur en personeelsmanagement',
      'Verwijs naar medewerkersonderzoeken en -statistieken',
      'Gebruik bronnen over talent management'
    ],
    'finances': [
      'Citeer financiële literatuur en ratio-analyses',
      'Verwijs naar jaarverslagen en financiële rapportages',
      'Gebruik bronnen over financieel management in de zorg'
    ]
  }

  return tips[stepId] || [
    'Gebruik recente en betrouwbare bronnen',
    'Citeer volgens APA 7e editie richtlijnen',
    'Voeg paginanummers toe bij directe citaten'
  ]
}