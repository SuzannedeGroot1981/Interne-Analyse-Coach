import Head from 'next/head'
import Link from 'next/link'
import DocumentReviewStep from '../components/DocumentReviewStep'

export default function Improve() {
  return (
    <>
      <Head>
        <title>Document Feedback - Interne Analyse Coach</title>
        <meta name="description" content="Upload je interne analyse document voor AI-feedback" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Terug knop */}
              <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Terug naar hoofdpagina
              </Link>

              {/* Logo */}
              <div className="flex items-center space-x-2">
                <img
                  src="/images/Logo_HL_Donkergroen_RGB.png"
                  alt="Hogeschool Leiden"
                  className="h-6 w-auto opacity-60"
                />
                <span className="text-sm text-gray-500 hidden sm:block">
                  Interne Analyse Coach
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Document Review Component */}
          <DocumentReviewStep />
        </div>
      </div>
    </>
  )
}