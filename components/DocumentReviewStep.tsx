'use client'

// Dit component is nu geïntegreerd in de hoofdpagina
// Behouden voor backwards compatibility, maar niet meer gebruikt

export default function DocumentReviewStep() {
  return (
    <div className="text-center p-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Document Review is verplaatst
      </h2>
      <p className="text-gray-600 mb-4">
        De document review functionaliteit is nu geïntegreerd in het hoofdmenu.
      </p>
      <button
        onClick={() => window.location.href = '/'}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Ga naar hoofdmenu
      </button>
    </div>
  )
}