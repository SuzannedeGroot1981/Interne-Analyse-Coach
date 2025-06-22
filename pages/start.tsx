import Head from 'next/head'
import Link from 'next/link'

export default function Start() {
  return (
    <>
      <Head>
        <title>Nieuwe Interne Analyse - Interne Analyse Coach</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            
            {/* Content */}
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Nieuwe Interne Analyse
              </h1>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-yellow-800 mb-2">
                  🚧 Deze pagina komt binnenkort
                </h2>
                <p className="text-yellow-700">
                  We werken hard aan een uitgebreide workflow voor nieuwe interne analyses. 
                  Binnenkort kun je hier stap voor stap een complete organisatie-analyse uitvoeren.
                </p>
              </div>
              
              <Link href="/">
                <button className="btn-primary py-3 px-6 rounded-lg inline-flex items-center space-x-2">
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