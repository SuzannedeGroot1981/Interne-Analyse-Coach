import Head from 'next/head'
import Link from 'next/link'

export default function Start() {
  return (
    <>
      <Head>
        <title>Nieuwe Interne Analyse - Interne Analyse Coach</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-12">
              <Link href="/" className="inline-flex items-center text-primary hover:text-green-800 mb-6">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Terug naar hoofdmenu
              </Link>
              
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Begin met een nieuwe interne analyse
              </h1>
              <p className="text-xl text-primary">
                Laten we stap voor stap een grondige analyse van je organisatie uitvoeren
              </p>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Deze pagina komt binnenkort
                </h2>
                <p className="text-gray-600 mb-8">
                  We werken hard aan deze functionaliteit. Binnenkort kun je hier een complete workflow starten voor nieuwe interne analyses.
                </p>
                
                <Link href="/">
                  <button className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors">
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