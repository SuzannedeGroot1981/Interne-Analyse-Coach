'use client'

import DocumentDropzone from './DocumentDropzone'

interface DocumentReviewStepProps {
  className?: string
}

export default function DocumentReviewStep({ className = '' }: DocumentReviewStepProps) {
  const handleDocumentLoaded = (documentData: any) => {
    console.log('📄 Document geladen in review stap:', {
      fileName: documentData.fileName,
      wordCount: documentData.wordCount,
      fileType: documentData.fileType
    })
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center justify-center">
          <span className="mr-3">📝</span>
          Document Review & Verbetering
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload je bestaande document (DOCX of Markdown) en krijg gedetailleerde AI-feedback met sterke punten, 
          zwakke punten en APA-stijl issues. Voor elk zwak punt kun je automatisch een verbetervoorstel laten genereren.
        </p>
      </div>

      {/* Instructies */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Hoe werkt het?
        </h3>
        <div className="space-y-2 text-blue-700">
          <p className="flex items-start">
            <span className="mr-2 mt-1">1️⃣</span>
            <span><strong>Upload</strong> je document (.docx of .md bestand)</span>
          </p>
          <p className="flex items-start">
            <span className="mr-2 mt-1">2️⃣</span>
            <span><strong>Review</strong> krijg automatische AI-analyse van je tekst</span>
          </p>
          <p className="flex items-start">
            <span className="mr-2 mt-1">3️⃣</span>
            <span><strong>Verbeter</strong> klik op "Pas fix toe" voor elk zwak punt</span>
          </p>
          <p className="flex items-start">
            <span className="mr-2 mt-1">4️⃣</span>
            <span><strong>Implementeer</strong> de AI-verbetervoorstellen in je document</span>
          </p>
        </div>
      </div>

      {/* Document Dropzone Component */}
      <DocumentDropzone 
        onDocumentLoaded={handleDocumentLoaded}
        className="mt-6"
      />

      {/* Tips sectie */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Tips voor de beste resultaten
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">📄 Document kwaliteit</h4>
            <ul className="space-y-1">
              <li>• Upload complete documenten (niet fragmenten)</li>
              <li>• Zorg voor duidelijke structuur met headers</li>
              <li>• Minimaal 500 woorden voor beste analyse</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">🎯 Review focus</h4>
            <ul className="space-y-1">
              <li>• AI controleert inhoud, structuur en stijl</li>
              <li>• Speciale aandacht voor APA-richtlijnen</li>
              <li>• Constructieve verbetervoorstellen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}