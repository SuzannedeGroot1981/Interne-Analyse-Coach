import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>Interne Analyse Coach - Hogeschool Leiden</title>
        <meta name="description" content="AI-gestuurde feedback op je interne analyse concept" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-8">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            
            <h1 className="text-6xl font-bold text-gray-800 mb-6">
              Interne Analyse Coach
            </h1>
            
            <p className="text-xl text-primary font-medium mb-8 max-w-2xl mx-auto">
              Upload je interne analyse concept en krijg professionele AI-feedback volgens het 7S-model
            </p>

            <p className="text-gray-600 mb-12 max-w-3xl mx-auto">
              Speciaal ontwikkeld voor HBO-studenten Management in de Zorg aan Hogeschool Leiden. 
              Krijg constructieve feedback op je interne organisatie-analyse met focus op sterke punten, 
              verbeterpunten en APA-richtlijnen.
            </p>
          </div>

          {/* Main Action - Concept Check */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  Upload je Concept voor Feedback
                </h2>
                <p className="text-gray-600 mb-6">
                  Upload je interne analyse document en krijg gedetailleerde AI-feedback op inhoud, 
                  structuur, 7S-model toepassing en APA-richtlijnen.
                </p>
              </div>
              
              <Link href="/improve">
                <button className="btn-secondary w-full py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105">
                  📄 Upload Document voor Feedback
                </button>
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20 max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
              Wat krijg je van de Interne Analyse Coach?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Sterke Punten Identificatie</h4>
                <p className="text-gray-600 text-sm">
                  Herkenning van wat je al goed doet in je analyse volgens het 7S-model en HBO-standaarden.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Concrete Verbeterpunten</h4>
                <p className="text-gray-600 text-sm">
                  Specifieke suggesties voor verbetering van inhoud, structuur en academische kwaliteit.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">APA-Richtlijnen Check</h4>
                <p className="text-gray-600 text-sm">
                  Automatische controle van bronvermeldingen en citaties volgens Hogeschool Leiden standaarden.
                </p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8">
              <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                <span className="mr-3">🎓</span>
                Voor HBO Management in de Zorg Studenten
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-blue-700">
                <div>
                  <h4 className="font-semibold mb-2">📋 Wat wordt geanalyseerd:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• 7S-Model toepassing (Strategy, Structure, Systems, etc.)</li>
                    <li>• Interne organisatie-analyse focus</li>
                    <li>• Academische schrijfstijl en structuur</li>
                    <li>• APA 7e editie bronvermelding</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📄 Ondersteunde formaten:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Word documenten (.docx)</li>
                    <li>• Markdown bestanden (.md)</li>
                    <li>• Maximaal 10MB bestandsgrootte</li>
                    <li>• Nederlandse en Engelse teksten</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-16">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <img
                src="/images/Logo_HL_Donkergroen_RGB.png"
                alt="Hogeschool Leiden"
                className="h-8 w-auto opacity-60"
              />
              <span className="text-gray-500">×</span>
              <span className="text-gray-600 font-medium">AI-Powered Feedback</span>
            </div>
            <p className="text-gray-500 text-sm">
              Ontwikkeld voor Hogeschool Leiden • Management in de Zorg • Professionele Organisatie-ontwikkeling
            </p>
          </div>
        </div>
      </div>
    </>
  )
}