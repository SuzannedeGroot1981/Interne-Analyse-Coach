'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import mammoth from 'mammoth'

interface DocumentData {
  fileName: string
  content: string
  fileType: 'docx' | 'md'
  wordCount: number
  characterCount: number
}

interface ReviewResult {
  success: boolean
  sterke_punten: string[]
  zwakke_punten: string[]
  apa_issues: string[]
  overall_feedback: string
}

interface WeaknessCard {
  id: string
  weakness: string
  isFixing: boolean
  fixedText?: string
}

interface DocumentDropzoneProps {
  onDocumentLoaded?: (data: DocumentData) => void
  className?: string
}

export default function DocumentDropzone({ onDocumentLoaded, className = '' }: DocumentDropzoneProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedDocument, setUploadedDocument] = useState<DocumentData | null>(null)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [isReviewing, setIsReviewing] = useState(false)
  const [weaknessCards, setWeaknessCards] = useState<WeaknessCard[]>([])

  // Verwerk DOCX bestand
  const processDocx = (file: File): Promise<DocumentData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const result = await mammoth.extractRawText({ arrayBuffer })
          
          const content = result.value.trim()
          if (!content) {
            reject(new Error('DOCX bestand bevat geen tekst'))
            return
          }

          const documentData: DocumentData = {
            fileName: file.name,
            content,
            fileType: 'docx',
            wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
            characterCount: content.length
          }

          resolve(documentData)
        } catch (error) {
          reject(new Error('Fout bij het verwerken van DOCX bestand'))
        }
      }

      reader.onerror = () => reject(new Error('Fout bij het lezen van het bestand'))
      reader.readAsArrayBuffer(file)
    })
  }

  // Verwerk Markdown bestand
  const processMarkdown = (file: File): Promise<DocumentData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = (e.target?.result as string).trim()
          
          if (!content) {
            reject(new Error('Markdown bestand is leeg'))
            return
          }

          const documentData: DocumentData = {
            fileName: file.name,
            content,
            fileType: 'md',
            wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
            characterCount: content.length
          }

          resolve(documentData)
        } catch (error) {
          reject(new Error('Fout bij het verwerken van Markdown bestand'))
        }
      }

      reader.onerror = () => reject(new Error('Fout bij het lezen van het bestand'))
      reader.readAsText(file, 'UTF-8')
    })
  }

  // Start document review
  const startReview = async () => {
    if (!uploadedDocument) return

    setIsReviewing(true)
    setError(null)
    setReviewResult(null)
    setWeaknessCards([])

    try {
      console.log('📝 Start document review...', {
        fileName: uploadedDocument.fileName,
        wordCount: uploadedDocument.wordCount
      })

      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: uploadedDocument.content,
          fileName: uploadedDocument.fileName,
          fileType: uploadedDocument.fileType
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Review mislukt')
      }

      const result: ReviewResult = await response.json()
      setReviewResult(result)

      // Maak weakness cards
      const cards: WeaknessCard[] = result.zwakke_punten.map((weakness, index) => ({
        id: `weakness_${index}`,
        weakness,
        isFixing: false
      }))
      setWeaknessCards(cards)

      console.log('✅ Document review voltooid:', {
        sterkePunten: result.sterke_punten.length,
        zwakkePunten: result.zwakke_punten.length,
        apaIssues: result.apa_issues.length
      })

    } catch (error) {
      console.error('❌ Fout bij document review:', error)
      setError(error instanceof Error ? error.message : 'Onbekende fout bij review')
    } finally {
      setIsReviewing(false)
    }
  }

  // Pas fix toe voor specifieke zwakte
  const applyFix = async (cardId: string, weakness: string) => {
    setWeaknessCards(prev => 
      prev.map(card => 
        card.id === cardId ? { ...card, isFixing: true } : card
      )
    )

    try {
      console.log('🔧 Start fix voor zwakte:', weakness.substring(0, 50) + '...')

      const response = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: uploadedDocument?.content,
          fileName: uploadedDocument?.fileName,
          fileType: uploadedDocument?.fileType,
          fixWeakness: weakness // Speciale parameter voor fix mode
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fix mislukt')
      }

      const result = await response.json()
      const fixedText = result.fixed_text || result.response

      setWeaknessCards(prev => 
        prev.map(card => 
          card.id === cardId 
            ? { ...card, isFixing: false, fixedText } 
            : card
        )
      )

      console.log('✅ Fix toegepast voor zwakte')

    } catch (error) {
      console.error('❌ Fout bij toepassen fix:', error)
      setWeaknessCards(prev => 
        prev.map(card => 
          card.id === cardId ? { ...card, isFixing: false } : card
        )
      )
      setError(error instanceof Error ? error.message : 'Onbekende fout bij fix')
    }
  }

  // Handle bestand drop/upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsProcessing(true)
    setError(null)
    setReviewResult(null)
    setWeaknessCards([])

    try {
      let documentData: DocumentData

      if (file.name.toLowerCase().endsWith('.docx')) {
        documentData = await processDocx(file)
      } else if (file.name.toLowerCase().endsWith('.md')) {
        documentData = await processMarkdown(file)
      } else {
        throw new Error('Niet ondersteund bestandsformaat')
      }

      setUploadedDocument(documentData)
      if (onDocumentLoaded) {
        onDocumentLoaded(documentData)
      }
      
      console.log('📄 Document geladen:', {
        fileName: documentData.fileName,
        fileType: documentData.fileType,
        wordCount: documentData.wordCount
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
      setError(errorMessage)
      console.error('❌ Fout bij verwerken document:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [onDocumentLoaded])

  // Configureer dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/markdown': ['.md']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isProcessing
  })

  // Verwijder geüploade data
  const clearData = () => {
    setUploadedDocument(null)
    setReviewResult(null)
    setWeaknessCards([])
    setError(null)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragActive && !isDragReject
            ? 'border-blue-500 bg-blue-50'
            : isDragReject
            ? 'border-red-500 bg-red-50'
            : uploadedDocument
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            uploadedDocument ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            {isProcessing ? (
              <span className="material-symbols-sharp text-blue-600 hl-icon-lg animate-spin">progress_activity</span>
            ) : uploadedDocument ? (
              <span className="material-symbols-sharp text-green-600 hl-icon-lg">check_circle</span>
            ) : (
              <span className="material-symbols-sharp text-gray-400 hl-icon-lg">description</span>
            )}
          </div>

          {/* Text */}
          <div>
            {isProcessing ? (
              <div>
                <p className="text-lg font-medium text-blue-600">
                  Document wordt verwerkt...
                </p>
                <p className="text-sm text-gray-500">
                  Even geduld, we lezen je document
                </p>
              </div>
            ) : uploadedDocument ? (
              <div>
                <p className="text-lg font-medium text-green-600">
                  ✅ {uploadedDocument.fileName}
                </p>
                <p className="text-sm text-gray-500">
                  {uploadedDocument.wordCount} woorden • {uploadedDocument.characterCount} karakters • {uploadedDocument.fileType.toUpperCase()}
                </p>
              </div>
            ) : isDragActive ? (
              <div>
                <p className="text-lg font-medium text-blue-600">
                  <span className="material-symbols-sharp hl-icon-md mr-2">file_upload</span>
                  Drop je document hier
                </p>
                <p className="text-sm text-gray-500">
                  DOCX of Markdown bestanden worden ondersteund
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-700">
                  <span className="material-symbols-sharp hl-icon-md mr-2">upload</span>
                  Upload Document voor Review
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Sleep een DOCX of Markdown bestand hierheen, of klik om te selecteren
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Ondersteunde formaten: .docx, .md (max 10MB)
                </p>
              </div>
            )}
          </div>

          {/* Upload button (alleen tonen als er geen data is) */}
          {!uploadedDocument && !isProcessing && (
            <button
              type="button"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="material-symbols-sharp hl-icon-sm mr-2">folder_open</span>
              Selecteer Document
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="material-symbols-sharp text-red-500 hl-icon-md">error</span>
            <span className="text-red-700 font-medium">Fout bij verwerken</span>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Document preview en review knop */}
      {uploadedDocument && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <span className="material-symbols-sharp hl-icon-primary hl-icon-md mr-2">description</span>
              Document Preview
            </h3>
            <div className="flex items-center space-x-3">
              {!reviewResult && (
                <button
                  onClick={startReview}
                  disabled={isReviewing}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isReviewing
                      ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isReviewing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Reviewen...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="material-symbols-sharp hl-icon-white hl-icon-sm">psychology</span>
                      <span>Start AI Review</span>
                    </div>
                  )}
                </button>
              )}
              <button
                onClick={clearData}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                <span className="material-symbols-sharp hl-icon-sm mr-1">delete</span>
                Verwijderen
              </button>
            </div>
          </div>

          {/* Document stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{uploadedDocument.wordCount}</div>
              <div className="text-sm text-gray-600">Woorden</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-800">{uploadedDocument.characterCount}</div>
              <div className="text-sm text-gray-600">Karakters</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-800">{uploadedDocument.fileType.toUpperCase()}</div>
              <div className="text-sm text-gray-600">Bestandstype</div>
            </div>
          </div>

          {/* Content preview */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Inhoud Preview:</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {uploadedDocument.content.length > 500 
                  ? `${uploadedDocument.content.substring(0, 500)}...` 
                  : uploadedDocument.content
                }
              </p>
            </div>
            {uploadedDocument.content.length > 500 && (
              <p className="text-xs text-gray-500 mt-2">
                Eerste 500 karakters getoond. Volledige inhoud wordt gebruikt voor review.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Review resultaten */}
      {reviewResult && (
        <div className="space-y-6">
          {/* Sterke punten */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
              <span className="material-symbols-sharp text-green-600 hl-icon-md mr-2">check_circle</span>
              Sterke Punten
            </h3>
            <ul className="space-y-2">
              {reviewResult.sterke_punten.map((punt, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span className="text-green-700">{punt}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Zwakke punten met fix knoppen */}
          {weaknessCards.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-orange-800 flex items-center">
                <span className="material-symbols-sharp text-orange-600 hl-icon-md mr-2">warning</span>
                Zwakke Punten & Verbeterpunten
              </h3>
              {weaknessCards.map((card) => (
                <div key={card.id} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-orange-700 flex-1">{card.weakness}</p>
                    <button
                      onClick={() => applyFix(card.id, card.weakness)}
                      disabled={card.isFixing}
                      className={`ml-4 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        card.isFixing
                          ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {card.isFixing ? (
                        <div className="flex items-center space-x-1">
                          <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                          <span>Fixing...</span>
                        </div>
                      ) : (
                        <span className="flex items-center space-x-1">
                          <span className="material-symbols-sharp hl-icon-sm">build</span>
                          <span>Pas fix toe</span>
                        </span>
                      )}
                    </button>
                  </div>
                  
                  {/* Fixed text display */}
                  {card.fixedText && (
                    <div className="mt-3 p-3 bg-white border border-green-200 rounded-lg">
                      <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                        <span className="material-symbols-sharp text-green-600 hl-icon-sm mr-1">auto_fix_high</span>
                        AI Verbetervoorstel:
                      </h5>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{card.fixedText}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* APA issues */}
          {reviewResult.apa_issues.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center">
                <span className="material-symbols-sharp text-red-600 hl-icon-md mr-2">menu_book</span>
                APA Stijl Issues
              </h3>
              <ul className="space-y-2">
                {reviewResult.apa_issues.map((issue, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span className="text-red-700">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Overall feedback */}
          {reviewResult.overall_feedback && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                <span className="material-symbols-sharp text-blue-600 hl-icon-md mr-2">psychology</span>
                Overall AI Feedback
              </h3>
              <p className="text-blue-700 whitespace-pre-wrap">{reviewResult.overall_feedback}</p>
            </div>
          )}

          {/* Nieuwe review knop */}
          <div className="text-center">
            <button
              onClick={() => {
                setReviewResult(null)
                setWeaknessCards([])
                setError(null)
              }}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-sharp hl-icon-white hl-icon-sm mr-2">refresh</span>
              Nieuwe Review Starten
            </button>
          </div>
        </div>
      )}
    </div>
  )
}