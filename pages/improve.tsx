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
          <div className="max-w-2xl mx-auto">
            
            {/* Content */}
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Verbeter Bestaand Concept
              </h1>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-yellow-800 mb-2">
                  🚧 Deze pagina komt binnenkort
                </h2>
                <p className="text-yellow-700">
                  We ontwikkelen momenteel een geavanceerde upload- en analysefunctie. 
                  Binnenkort kun je hier je bestaande concepten uploaden en AI-gedreven verbetervoorstellen ontvangen.
                </p>
              </div>
              
              <Link href="/">
                <button className="btn-secondary py-3 px-6 rounded-lg inline-flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Terug naar hoofdmenu</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}