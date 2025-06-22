import Head from 'next/head'
import Link from 'next/link'

export default function Improve() {
  return (
    <>
      <Head>
        <title>Verbeter Bestaand Concept - Interne Analyse Coach</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-12">
              <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Terug naar hoofdmenu
              </Link>
              
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Verbeter een bestaand concept
              </h1>
              <p className="text-xl text-blue-700">
                Upload je bestaande analyse en krijg AI-gedreven verbetervoorstellen
              </p>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Functionaliteit in ontwikkeling
                </h2>
                <p className="text-gray-600 mb-8">
                  Deze pagina wordt binnenkort uitgebreid met upload functionaliteit en AI-analyse voor conceptverbetering.
                </p>
                
                <Link href="/">
                  <button className="btn-secondary py-3 px-6 rounded-lg">
                    Terug naar hoofdmenu
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}