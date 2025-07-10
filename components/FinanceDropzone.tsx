'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'
import FinancialAnalysis from './FinancialAnalysis'

interface FinanceData {
  fileName: string
  data: any[]
  headers: string[]
  summary: {
    totalRows: number
    totalColumns: number
    fileSize: string
  }
  metrics?: any // Toegevoegd voor parsed financial metrics
}

interface FinanceDropzoneProps {
  onDataLoaded: (data: FinanceData) => void
  className?: string
}

export default function FinanceDropzone({ onDataLoaded, className = '' }: FinanceDropzoneProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedData, setUploadedData] = useState<FinanceData | null>(null)
  const [parsedFinanceData, setParsedFinanceData] = useState<any>(null)
  const [isParsingFinance, setIsParsingFinance] = useState(false)

  // Verwerk CSV bestand
  const processCSV = (file: File): Promise<FinanceData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())
          
          if (lines.length === 0) {
            reject(new Error('CSV bestand is leeg'))
            return
          }

          // Parse CSV (eenvoudige implementatie)
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
            const row: any = {}
            headers.forEach((header, index) => {
              row[header] = values[index] || ''
            })
            return row
          })

          const financeData: FinanceData = {
            fileName: file.name,
            data,
            headers,
            summary: {
              totalRows: data.length,
              totalColumns: headers.length,
              fileSize: formatFileSize(file.size)
            }
          }

          resolve(financeData)
        } catch (error) {
          reject(new Error('Fout bij het verwerken van CSV bestand'))
        }
      }

      reader.onerror = () => reject(new Error('Fout bij het lezen van het bestand'))
      reader.readAsText(file, 'UTF-8')
    })
  }

  // Verwerk Excel bestand
  const processExcel = (file: File): Promise<FinanceData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: 'array' })
          
          // Gebruik het eerste werkblad
          const firstSheetName = workbook.SheetNames[0]
          if (!firstSheetName) {
            reject(new Error('Geen werkbladen gevonden in Excel bestand'))
            return
          }

          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          if (jsonData.length === 0) {
            reject(new Error('Excel werkblad is leeg'))
            return
          }

          // Extract headers en data
          const headers = (jsonData[0] as any[]).map(h => String(h || '').trim())
          const rows = jsonData.slice(1).map((row: any) => {
            const rowData: any = {}
            headers.forEach((header, index) => {
              rowData[header] = String((row as any[])[index] || '').trim()
            })
            return rowData
          })

          const financeData: FinanceData = {
            fileName: file.name,
            data: rows,
            headers,
            summary: {
              totalRows: rows.length,
              totalColumns: headers.length,
              fileSize: formatFileSize(file.size)
            }
          }

          resolve(financeData)
        } catch (error) {
          reject(new Error('Fout bij het verwerken van Excel bestand'))
        }
      }

      reader.onerror = () => reject(new Error('Fout bij het lezen van het bestand'))
      reader.readAsArrayBuffer(file)
    })
  }

  // Verwerk PDF bestand
  const processPDF = (file: File): Promise<FinanceData> => {
    return new Promise((resolve) => {
      const documentData: FinanceData = {
        fileName: file.name,
        data: [],
        headers: ['PDF Document'],
        summary: {
          totalRows: 0,
          totalColumns: 1,
          fileSize: formatFileSize(file.size)
        }
      }
      resolve(documentData)
    })
  }

  // Verwerk Image bestand
  const processImage = (file: File): Promise<FinanceData> => {
    return new Promise((resolve) => {
      const documentData: FinanceData = {
        fileName: file.name,
        data: [],
        headers: ['Image Document'],
        summary: {
          totalRows: 0,
          totalColumns: 1,
          fileSize: formatFileSize(file.size)
        }
      }
      resolve(documentData)
    })
  }

  // Parse financiële data via API
  const parseFinancialData = async (financeData: FinanceData) => {
    setIsParsingFinance(true)
    try {
      console.log('💰 Start financiële data parsing...', {
        fileName: financeData.fileName,
        rows: financeData.summary.totalRows
      })

      // Bepaal het bestandstype en bereid data voor
      let requestData
      const fileExtension = financeData.fileName.toLowerCase().split('.').pop()
      
      if (fileExtension === 'pdf' || fileExtension === 'jpg' || fileExtension === 'jpeg') {
        // Voor PDF en afbeeldingen: stuur het originele bestand
        requestData = {
          fileName: financeData.fileName,
          fileType: fileExtension === 'pdf' ? 'application/pdf' : 'image/jpeg',
          isImageOrPDF: true,
          note: 'Bestand vereist AI-analyse voor financiële gegevens extractie'
        }
      } else {
        // Voor CSV/Excel: converteer data naar base64 zoals voorheen
        const dataString = JSON.stringify(financeData.data)
        const base64Data = btoa(dataString)
        requestData = {
          fileData: base64Data,
          fileName: financeData.fileName,
          fileType: financeData.fileName.endsWith('.csv') ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      }

      const response = await fetch('/api/parse-fin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Parsing mislukt')
      }

      const parsedData = await response.json()
      setParsedFinanceData(parsedData)

      console.log('✅ Financiële data parsing voltooid:', {
        metricsFound: Object.keys(parsedData.metrics).filter(k => parsedData.metrics[k] !== null).length,
        totalMetrics: Object.keys(parsedData.metrics).length
      })

    } catch (error) {
      console.error('❌ Fout bij financiële parsing:', error)
      setError(error instanceof Error ? error.message : 'Onbekende fout bij parsing')
    } finally {
      setIsParsingFinance(false)
    }
  }

  // Format bestandsgrootte
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Handle bestand drop/upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsProcessing(true)
    setError(null)
    setParsedFinanceData(null)

    try {
      let financeData: FinanceData

      if (file.name.toLowerCase().endsWith('.csv')) {
        financeData = await processCSV(file)
      } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        financeData = await processExcel(file)
      } else if (file.name.toLowerCase().endsWith('.pdf')) {
        financeData = await processPDF(file)
      } else if (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg')) {
        financeData = await processImage(file)
      } else {
        throw new Error('Niet ondersteund bestandsformaat')
      }

      setUploadedData(financeData)
      onDataLoaded(financeData)
      
      // Automatisch financiële data parsing starten
      await parseFinancialData(financeData)
      
      console.log('💰 Financiële data geladen:', {
        fileName: financeData.fileName,
        rows: financeData.summary.totalRows,
        columns: financeData.summary.totalColumns
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
      setError(errorMessage)
      console.error('❌ Fout bij verwerken financieel bestand:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [onDataLoaded])

  // Configureer dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isProcessing
  })

  // Verwijder geüploade data
  const clearData = () => {
    setUploadedData(null)
    setParsedFinanceData(null)
    setError(null)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragActive && !isDragReject
            ? 'border-green-500 bg-green-50'
            : isDragReject
            ? 'border-red-500 bg-red-50'
            : uploadedData
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            uploadedData ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            {isProcessing || isParsingFinance ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            ) : uploadedData ? (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          {/* Text */}
          <div>
            {isProcessing ? (
              <div>
                <p className="text-lg font-medium text-blue-600">
                  Bestand wordt verwerkt...
                </p>
                <p className="text-sm text-gray-500">
                  Even geduld, we analyseren je financiële data
                </p>
              </div>
            ) : isParsingFinance ? (
              <div>
                <p className="text-lg font-medium text-purple-600">
                  Financiële data wordt geanalyseerd...
                </p>
                <p className="text-sm text-gray-500">
                  AI extraheert automatisch de belangrijkste financiële metrics
                </p>
              </div>
            ) : uploadedData ? (
              <div>
                <p className="text-lg font-medium text-green-600">
                  ✅ {uploadedData.fileName}
                </p>
                <p className="text-sm text-gray-500">
                  {uploadedData.summary.totalRows} rijen • {uploadedData.summary.totalColumns} kolommen • {uploadedData.summary.fileSize}
                </p>
                {parsedFinanceData && (
                  <p className="text-sm text-purple-600 mt-1">
                    🤖 Financiële metrics geëxtraheerd en klaar voor analyse
                  </p>
                )}
              </div>
            ) : isDragActive ? (
              <div>
                <p className="text-lg font-medium text-green-600">
                  📊 Drop je financiële bestand hier
                </p>
                <p className="text-sm text-gray-500">
                  CSV, Excel, PDF en JPG bestanden worden ondersteund
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-700">
                  💰 Upload Financiële Data
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Sleep een CSV, Excel, PDF of JPG bestand hierheen, of klik om te selecteren
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Ondersteunde formaten: .csv, .xlsx, .xls, .pdf, .jpg, .jpeg (max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Upload button (alleen tonen als er geen data is) */}
          {!uploadedData && !isProcessing && (
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📁 Selecteer Bestand
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 font-medium">Fout bij uploaden</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Data preview */}
      {uploadedData && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="mr-2">📊</span>
              Financiële Data Preview
            </h3>
            <button
              onClick={clearData}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              🗑️ Verwijderen
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{uploadedData.summary.totalRows}</div>
              <div className="text-sm text-gray-600">Rijen</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{uploadedData.summary.totalColumns}</div>
              <div className="text-sm text-gray-600">Kolommen</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-800">{uploadedData.summary.fileSize}</div>
              <div className="text-sm text-gray-600">Bestandsgrootte</div>
            </div>
          </div>

          {/* Headers */}
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Kolommen:</h4>
            <div className="flex flex-wrap gap-2">
              {uploadedData.headers.map((header, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {header || `Kolom ${index + 1}`}
                </span>
              ))}
            </div>
          </div>

          {/* Data preview (eerste 3 rijen) */}
          {uploadedData.data.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Eerste {Math.min(3, uploadedData.data.length)} rijen:
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      {uploadedData.headers.map((header, index) => (
                        <th key={index} className="px-2 py-1 text-left font-medium text-gray-700 border-b">
                          {header || `Kolom ${index + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedData.data.slice(0, 3).map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b">
                        {uploadedData.headers.map((header, colIndex) => (
                          <td key={colIndex} className="px-2 py-1 text-gray-600">
                            {String(row[header] || '').substring(0, 20)}
                            {String(row[header] || '').length > 20 ? '...' : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {uploadedData.data.length > 3 && (
                <p className="text-xs text-gray-500 mt-2">
                  ... en nog {uploadedData.data.length - 3} rijen
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Financiële Analyse Component */}
      {parsedFinanceData && (
        <FinancialAnalysis 
          financialData={parsedFinanceData}
          className="mt-6"
        />
      )}
    </div>
  )
}