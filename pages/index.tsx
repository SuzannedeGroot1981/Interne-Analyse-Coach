import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>Interne Analyse Coach</title>
        <meta name="description" content="AI-gestuurde tool voor interne analyses en conceptverbetering" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-8">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            
            <h1 className="text-6xl font-bold text-gray-800 mb-6">
              Interne Analyse Coach
            </h1>
            
            <p className="text-xl text-primary font-medium mb-8 max-w-2xl mx-auto">
              Gebruik AI om diepgaande interne analyses uit te voeren en bestaande concepten te verbeteren met professionele inzichten.
            </p>
          </div>

          {/* Main Action Buttons */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Begin nieuwe analyse */}
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Nieuwe Interne Analyse
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Start een volledig nieuwe analyse van je organisatie, processen of strategieën met AI-ondersteuning.
                  </p>
                </div>
                
                <Link href="/start">
                  <button className="btn-primary w-full py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105">
                    Begin met een nieuwe interne analyse
                  </button>
                </Link>
              </div>

              {/* Verbeter bestaand concept */}
              <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Verbeter Bestaand Concept
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Upload je bestaande analyse of concept en laat AI helpen bij het identificeren van verbeterpunten en optimalisaties.
                  </p>
                </div>
                
                <Link href="/improve">
                  <button className="btn-secondary w-full py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105">
                    Verbeter een bestaand concept
                  </button>
                </Link>
              </div>

            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20 max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
              Wat kan de Interne Analyse Coach voor je doen?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">AI-Gedreven Analyse</h4>
                <p className="text-gray-600 text-sm">
                  Gebruik geavanceerde AI om diepgaande inzichten te krijgen in je organisatie en processen.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Gestructureerde Aanpak</h4>
                <p className="text-gray-600 text-sm">
                  Volg een bewezen methodologie voor effectieve interne analyses en verbeteringen.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Praktische Resultaten</h4>
                <p className="text-gray-600 text-sm">
                  Krijg concrete aanbevelingen en actiepunten die direct toepasbaar zijn in je organisatie.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-16">
            <p className="text-gray-500 text-sm">
              Powered by AI • Interne Analyse Coach • Professionele Organisatie-ontwikkeling
            </p>
          </div>
        </div>
      </div>
    </>
  )
}