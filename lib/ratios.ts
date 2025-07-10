// Financiële ratio calculator voor zorgsector analyse
export interface FinancialData {
  omzet?: number | null
  nettowinst?: number | null
  eigenVermogen?: number | null
  vlottendeActiva?: number | null
  kortlopendeSchulden?: number | null
  totaalActiva?: number | null
}

export interface FinancialRatio {
  name: string
  value: number | null
  formula: string
  description: string
  isHealthy: boolean | null
  benchmarkRange?: {
    min: number
    max: number
    ideal: number
  }
}

export interface RatioAnalysis {
  rentabiliteit: FinancialRatio
  liquiditeit: FinancialRatio
  solvabiliteit: FinancialRatio
  summary: {
    totalRatios: number
    healthyRatios: number
    warningRatios: number
    criticalRatios: number
  }
}

// Benchmark waarden voor de zorgsector
const HEALTHCARE_BENCHMARKS = {
  rentabiliteit: {
    min: 0.05,    // 5% minimum voor gezonde zorgorganisatie
    max: 0.15,    // 15% maximum (hoger kan verdacht zijn in zorg)
    ideal: 0.08   // 8% ideaal voor zorgsector
  },
  liquiditeit: {
    min: 1.0,     // Minimaal 1.0 voor liquiditeit
    max: 3.0,     // Boven 3.0 kan inefficiënt zijn
    ideal: 1.5    // 1.5 is ideaal voor zorgorganisaties
  },
  solvabiliteit: {
    min: 0.20,    // 20% minimum eigen vermogen
    max: 0.60,    // 60% maximum (hoger kan inefficiënt zijn)
    ideal: 0.35   // 35% ideaal voor zorgsector
  }
}

/**
 * Bereken rentabiliteit (Return on Equity)
 * Formule: nettowinst / eigenVermogen
 */
export function calculateRentabiliteit(nettowinst: number | null | undefined, eigenVermogen: number | null | undefined): FinancialRatio {
  const ratio: FinancialRatio = {
    name: 'Rentabiliteit (ROE)',
    value: null,
    formula: 'Nettowinst ÷ Eigen Vermogen',
    description: 'Meet hoe efficiënt het eigen vermogen wordt ingezet om winst te genereren',
    isHealthy: null,
    benchmarkRange: HEALTHCARE_BENCHMARKS.rentabiliteit
  }

  // Valideer input - behandel undefined als null
  const validNettowinst = nettowinst ?? null
  const validEigenVermogen = eigenVermogen ?? null
  
  if (validNettowinst === null || validEigenVermogen === null || validEigenVermogen === 0) {
    return ratio
  }

  // Bereken ratio
  const value = validNettowinst / validEigenVermogen
  ratio.value = Math.round(value * 10000) / 100 // Rond af op 2 decimalen als percentage

  // Beoordeel gezondheid
  const benchmark = HEALTHCARE_BENCHMARKS.rentabiliteit
  if (value >= benchmark.min && value <= benchmark.max) {
    ratio.isHealthy = true
  } else {
    ratio.isHealthy = false
  }

  return ratio
}

/**
 * Bereken liquiditeit (Current Ratio)
 * Formule: vlottendeActiva / kortlopendeSchulden
 */
export function calculateLiquiditeit(vlottendeActiva: number | null | undefined, kortlopendeSchulden: number | null | undefined): FinancialRatio {
  const ratio: FinancialRatio = {
    name: 'Liquiditeit (Current Ratio)',
    value: null,
    formula: 'Vlottende Activa ÷ Kortlopende Schulden',
    description: 'Meet het vermogen om kortlopende verplichtingen te voldoen',
    isHealthy: null,
    benchmarkRange: HEALTHCARE_BENCHMARKS.liquiditeit
  }

  // Valideer input - behandel undefined als null
  const validVlottendeActiva = vlottendeActiva ?? null
  const validKortlopendeSchulden = kortlopendeSchulden ?? null
  
  if (validVlottendeActiva === null || validKortlopendeSchulden === null || validKortlopendeSchulden === 0) {
    return ratio
  }

  // Bereken ratio
  const value = validVlottendeActiva / validKortlopendeSchulden
  ratio.value = Math.round(value * 100) / 100 // Rond af op 2 decimalen

  // Beoordeel gezondheid
  const benchmark = HEALTHCARE_BENCHMARKS.liquiditeit
  if (value >= benchmark.min && value <= benchmark.max) {
    ratio.isHealthy = true
  } else {
    ratio.isHealthy = false
  }

  return ratio
}

/**
 * Bereken solvabiliteit (Equity Ratio)
 * Formule: eigenVermogen / totaalActiva
 */
export function calculateSolvabiliteit(eigenVermogen: number | null | undefined, totaalActiva: number | null | undefined): FinancialRatio {
  const ratio: FinancialRatio = {
    name: 'Solvabiliteit (Equity Ratio)',
    value: null,
    formula: 'Eigen Vermogen ÷ Totaal Activa',
    description: 'Meet de financiële stabiliteit en het aandeel eigen vermogen',
    isHealthy: null,
    benchmarkRange: HEALTHCARE_BENCHMARKS.solvabiliteit
  }

  // Valideer input - behandel undefined als null
  const validEigenVermogen = eigenVermogen ?? null
  const validTotaalActiva = totaalActiva ?? null
  
  if (validEigenVermogen === null || validTotaalActiva === null || validTotaalActiva === 0) {
    return ratio
  }

  // Bereken ratio
  const value = validEigenVermogen / validTotaalActiva
  ratio.value = Math.round(value * 10000) / 100 // Rond af op 2 decimalen als percentage

  // Beoordeel gezondheid
  const benchmark = HEALTHCARE_BENCHMARKS.solvabiliteit
  if (value >= benchmark.min && value <= benchmark.max) {
    ratio.isHealthy = true
  } else {
    ratio.isHealthy = false
  }

  return ratio
}

/**
 * Bereken alle financiële ratio's en geef een complete analyse
 */
export function calculateAllRatios(data: FinancialData): RatioAnalysis {
  const rentabiliteit = calculateRentabiliteit(data.nettowinst, data.eigenVermogen)
  const liquiditeit = calculateLiquiditeit(data.vlottendeActiva, data.kortlopendeSchulden)
  const solvabiliteit = calculateSolvabiliteit(data.eigenVermogen, data.totaalActiva)

  // Bereken summary statistieken
  const ratios = [rentabiliteit, liquiditeit, solvabiliteit]
  const validRatios = ratios.filter(r => r.value !== null)
  const healthyRatios = validRatios.filter(r => r.isHealthy === true)
  const warningRatios = validRatios.filter(r => r.isHealthy === false)

  return {
    rentabiliteit,
    liquiditeit,
    solvabiliteit,
    summary: {
      totalRatios: validRatios.length,
      healthyRatios: healthyRatios.length,
      warningRatios: warningRatios.length,
      criticalRatios: 0 // Voor toekomstige uitbreiding
    }
  }
}

/**
 * Format ratio waarde voor weergave
 */
export function formatRatioValue(ratio: FinancialRatio): string {
  if (ratio.value === null) {
    return 'Niet beschikbaar'
  }

  // Rentabiliteit en solvabiliteit als percentage
  if (ratio.name.includes('Rentabiliteit') || ratio.name.includes('Solvabiliteit')) {
    return `${ratio.value}%`
  }

  // Liquiditeit als decimaal getal
  return ratio.value.toString()
}

/**
 * Krijg kleur voor ratio status
 */
export function getRatioStatusColor(ratio: FinancialRatio): string {
  if (ratio.value === null) {
    return 'gray'
  }

  if (ratio.isHealthy === true) {
    return 'green'
  } else if (ratio.isHealthy === false) {
    return 'red'
  }

  return 'yellow'
}

/**
 * Krijg status tekst voor ratio
 */
export function getRatioStatusText(ratio: FinancialRatio): string {
  if (ratio.value === null) {
    return 'Onvoldoende data'
  }

  if (ratio.isHealthy === true) {
    return 'Gezond'
  } else if (ratio.isHealthy === false) {
    return 'Aandacht vereist'
  }

  return 'Onbekend'
}