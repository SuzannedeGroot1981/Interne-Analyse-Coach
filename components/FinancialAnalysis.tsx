'use client'

import { useState } from 'react'
import { formatRatioValue, getRatioStatusColor, getRatioStatusText, type RatioAnalysis } from '../lib/ratios'

interface RatioExplanation {
  ratio: string
  waarde: string
  uitleg: string
}

interface FinancialAnalysisProps {
  financialData: any // Data uit parse-fin API
  className?: string
}

interface AnalysisResult {
  success: boolean
  ratios: RatioAnalysis
  explanations: RatioExplanation[]
  summary: {
    overallHealth: 'healthy' | 'warning' | 'critical'
    keyInsights: string[]
  }
}

export default function FinancialAnalysis({ financialData, className = '' }: FinancialAnalysisProps) {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Start financiële analyse
  const startAnalysis = async () => {
    if (!financialData?.metrics) {
      setError('Geen financiële data beschikbaar voor analyse')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      console.log('🔍 Start financiële analyse...', {
        fileName: financialData.fileName,
        metricsAvailable: Object.keys(financialData.metrics).length
      })

      const response = await fetch('/api/fin-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: financialData.metrics
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analyse mislukt')
      }

      const result: AnalysisResult = await response.json()
      setAnalysisResult(result)

      console.log('✅ Financiële analyse voltooid:', {
        totalRatios: result.ratios.summary.totalRatios,
        explanations: result.explanations.length,
        overallHealth: result.summary.overallHealth
      })

    } catch (error) {
      console.error('❌ Fout bij financiële analyse:', error)
      setError(error instanceof Error ? error.message : 'Onbekende fout bij analyse')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Helper functie voor status kleuren
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'green'
      case 'warning': return 'yellow'
      case 'critical': return 'red'
      default: return 'gray'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header met start knop */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="mr-3">📊</span>
              Financiële Ratio Analyse
            </h3>
            <p className="text-gray-600 mt-1">
              AI-gedreven analyse van je financiële gezondheid in de zorgsector
            </p>
          </div>
          
          {!analysisResult && (
            <button
              onClick={startAnalysis}
              disabled={isAnalyzing || !financialData?.metrics}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                isAnalyzing
                  ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
              }`}
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span>Analyseren...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>🤖</span>
                  <span>Start AI Analyse</span>
                </div>
              )}
            </button>
          )}
        </div>

        {/* Data preview */}
        {financialData && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              Beschikbare Data: {financialData.fileName}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {Object.entries(financialData.metrics).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className={`font-medium ${value !== null ? 'text-green-600' : 'text-gray-400'}`}>
                    {value !== null ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 font-medium">Analyse Fout</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-3 text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Probeer opnieuw
          </button>
        </div>
      )}

      {/* Analyse resultaten */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Overall summary */}
          <div className={`rounded-lg border-2 p-6 ${
            analysisResult.summary.overallHealth === 'healthy' 
              ? 'border-green-200 bg-green-50' 
              : analysisResult.summary.overallHealth === 'warning'
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Financiële Gezondheid Overzicht
              </h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                analysisResult.summary.overallHealth === 'healthy'
                  ? 'bg-green-100 text-green-800'
                  : analysisResult.summary.overallHealth === 'warning'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {analysisResult.summary.overallHealth === 'healthy' ? '✅ Gezond' :
                 analysisResult.summary.overallHealth === 'warning' ? '⚠️ Aandacht' : '🚨 Kritiek'}
              </span>
            </div>
            
            <div className="space-y-2">
              {analysisResult.summary.keyInsights.map((insight, index) => (
                <p key={index} className="text-gray-700 flex items-center">
                  <span className="mr-2">•</span>
                  {insight}
                </p>
              ))}
            </div>
          </div>

          {/* Ratio kaarten */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analysisResult.explanations.map((explanation, index) => {
              // Vind de bijbehorende ratio data
              const ratioKey = explanation.ratio.includes('Rentabiliteit') ? 'rentabiliteit' :
                              explanation.ratio.includes('Liquiditeit') ? 'liquiditeit' : 'solvabiliteit'
              const ratioData = analysisResult.ratios[ratioKey as keyof RatioAnalysis]
              
              if (typeof ratioData === 'object' && 'name' in ratioData) {
                const statusColor = getRatioStatusColor(ratioData)
                const statusText = getRatioStatusText(ratioData)

                return (
                  <div key={index} className={`bg-white rounded-xl shadow-lg border-l-4 p-6 ${
                    statusColor === 'green' ? 'border-green-500' :
                    statusColor === 'red' ? 'border-red-500' : 'border-yellow-500'
                  }`}>
                    {/* Ratio header */}
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-bold text-gray-800">
                        {explanation.ratio}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColor === 'green' ? 'bg-green-100 text-green-800' :
                        statusColor === 'red' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {statusText}
                      </span>
                    </div>

                    {/* Waarde display */}
                    <div className="mb-4">
                      <div className={`text-3xl font-bold mb-1 ${
                        statusColor === 'green' ? 'text-green-600' :
                        statusColor === 'red' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {explanation.waarde}
                      </div>
                      <div className="text-sm text-gray-500">
                        {ratioData.formula}
                      </div>
                    </div>

                    {/* AI uitleg */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <span className="mr-2">🤖</span>
                        AI Coach Uitleg
                      </h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {explanation.uitleg}
                      </p>
                    </div>

                    {/* Benchmark info */}
                    {ratioData.benchmarkRange && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="text-xs font-semibold text-gray-500 mb-2">
                          ZORGSECTOR BENCHMARK
                        </h5>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Min: {ratioData.benchmarkRange.min * (ratioData.name.includes('Liquiditeit') ? 1 : 100)}{ratioData.name.includes('Liquiditeit') ? '' : '%'}</span>
                          <span>Ideaal: {ratioData.benchmarkRange.ideal * (ratioData.name.includes('Liquiditeit') ? 1 : 100)}{ratioData.name.includes('Liquiditeit') ? '' : '%'}</span>
                          <span>Max: {ratioData.benchmarkRange.max * (ratioData.name.includes('Liquiditeit') ? 1 : 100)}{ratioData.name.includes('Liquiditeit') ? '' : '%'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
              return null
            })}
          </div>

          {/* Nieuwe analyse knop */}
          <div className="text-center">
            <button
              onClick={() => {
                setAnalysisResult(null)
                setError(null)
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🔄 Nieuwe Analyse Starten
            </button>
          </div>
        </div>
      )}
    </div>
  )
}