import { useRouter } from "next/router";
import { useState } from "react";
import Head from 'next/head'
import { saveProject, loadProject } from "../utils/storage";

export default function Evidence() {
  const { query: { id } } = useRouter();
  const [interFiles, setInterFiles] = useState<File[]>([]);
  const [surveyFile, setSurveyFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function summarize() {
    if (interFiles.length === 0 && !surveyFile) {
      setError('Upload minimaal één bestand om een samenvatting te genereren.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const fd = new FormData();
      interFiles.forEach(f => fd.append("interviews", f));
      if (surveyFile) fd.append("survey", surveyFile);

      const res = await fetch("/api/summarize-evidence", {
        method: "POST",
        body: fd
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Samenvatting mislukt');
      }

      const json = await res.json();
      setSummary(json);

      // Sla resultaat op in project
      if (id) {
        const currentProject = loadProject(id as string) || {};
        saveProject(id as string, { 
          ...currentProject, 
          evidence: json,
          updatedAt: new Date().toISOString()
        });
      }

      console.log('✅ Evidence samenvatting voltooid:', {
        interviewFiles: interFiles.length,
        hasSurvey: !!surveyFile,
        summaryLength: json.summary?.length || 0
      });

    } catch (error) {
      console.error('❌ Evidence samenvatting fout:', error);
      setError(error instanceof Error ? error.message : 'Onbekende fout bij samenvatting');
    } finally {
      setIsProcessing(false);
    }
  }

  const handleInterviewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setInterFiles(Array.from(files));
      setError(null);
    }
  };

  const handleSurveyFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSurveyFile(file);
    setError(null);
  };

  const clearFiles = () => {
    setInterFiles([]);
    setSurveyFile(null);
    setSummary(null);
    setError(null);
  };

  // Veilige navigatie - controleer of project ID bestaat
  const handleBack = () => {
    if (id) {
      window.location.href = `/sources?id=${id}`;
    } else {
      window.location.href = '/';
    }
  };

  const handleContinue = () => {
    if (id) {
      window.location.href = `/start?id=${id}`;
    } else {
      window.location.href = '/';
    }
  };

  return (
    <>
      <Head>
        <title>Interview & Enquête Materiaal - Interne Analyse Coach</title>
        <meta name="description" content="Upload en analyseer interview transcripten en enquête resultaten" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
        {/* Minimale header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <button 
                onClick={handleBack}
                className="inline-flex items-center text-purple-600 hover:text-purple-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Terug naar bronnen
              </button>

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
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center">
                  <span className="mr-3">🎤</span>
                  Interview & Enquête Materiaal
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Upload je interview-transcripten en enquête-resultaten om een AI-gestuurde samenvatting 
                  te genereren die je kunt gebruiken in je interne analyse.
                </p>
              </div>

              {/* Upload sectie */}
              <div className="space-y-6 mb-8">
                {/* Interview bestanden */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <label className="block text-lg font-semibold text-blue-800 mb-3">
                    🎙️ 1. Upload interview-transcripten
                  </label>
                  <p className="text-blue-700 text-sm mb-4">
                    Upload één of meerdere bestanden met interview-transcripten (PDF, DOCX, of TXT)
                  </p>
                  <input 
                    type="file" 
                    accept=".pdf,.docx,.txt" 
                    multiple
                    onChange={handleInterviewFiles}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer"
                  />
                  {interFiles.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-blue-800 mb-2">
                        Geselecteerde bestanden ({interFiles.length}):
                      </p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {interFiles.map((file, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <span>📄</span>
                            <span>{file.name}</span>
                            <span className="text-blue-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Enquête bestand */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <label className="block text-lg font-semibold text-green-800 mb-3">
                    📊 2. Upload enquête-resultaat
                  </label>
                  <p className="text-green-700 text-sm mb-4">
                    Upload een CSV-bestand met enquête-resultaten of andere kwantitatieve data
                  </p>
                  <input 
                    type="file" 
                    accept=".csv"
                    onChange={handleSurveyFile}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer"
                  />
                  {surveyFile && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-green-800 mb-2">
                        Geselecteerd bestand:
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-green-700">
                        <span>📈</span>
                        <span>{surveyFile.name}</span>
                        <span className="text-green-500">({(surveyFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-700 font-medium">Fout bij verwerken</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              )}

              {/* Actie knoppen */}
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={clearFiles}
                  disabled={interFiles.length === 0 && !surveyFile}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  🗑️ Bestanden wissen
                </button>

                <button 
                  onClick={summarize} 
                  disabled={isProcessing || (interFiles.length === 0 && !surveyFile)}
                  className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    isProcessing
                      ? 'bg-purple-100 text-purple-700 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                      <span>Samenvatting genereren...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>🤖</span>
                      <span>Genereer AI samenvatting</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Samenvatting resultaat */}
              {summary && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">📋</span>
                    AI Samenvatting
                  </h3>
                  
                  {/* JSON preview voor debugging */}
                  <div className="bg-white border rounded-lg p-4 mb-4">
                    <details className="cursor-pointer">
                      <summary className="text-sm font-medium text-gray-700 mb-2">
                        🔍 Technische details (klik om uit te klappen)
                      </summary>
                      <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-gray-50 p-3 rounded border overflow-auto max-h-40">
                        {JSON.stringify(summary, null, 2)}
                      </pre>
                    </details>
                  </div>

                  {/* Gestructureerde weergave */}
                  {summary.summary && (
                    <div className="prose max-w-none">
                      <div className="bg-white rounded-lg p-4 border">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">📝 Hoofdbevindingen</h4>
                        <div className="text-gray-700 whitespace-pre-wrap">
                          {summary.summary}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Kopieer knop */}
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => {
                        const textToCopy = summary.summary || JSON.stringify(summary, null, 2);
                        navigator.clipboard.writeText(textToCopy);
                        alert('Samenvatting gekopieerd naar clipboard!');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <span>📋</span>
                      <span>Kopieer naar clipboard</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Instructies */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                  <span className="mr-2">💡</span>
                  Tips voor beste resultaten
                </h3>
                <div className="text-yellow-700 space-y-2 text-sm">
                  <p><strong>Interview-transcripten:</strong> Zorg voor duidelijke, uitgetypte transcripten. Vermeld de functie/rol van geïnterviewden.</p>
                  <p><strong>Enquête-data:</strong> CSV-bestanden met duidelijke kolomnamen werken het beste. Voeg eventueel een header-rij toe.</p>
                  <p><strong>Bestandsgrootte:</strong> Houd bestanden onder de 5MB voor optimale verwerking.</p>
                  <p><strong>Privacy:</strong> Zorg ervoor dat gevoelige persoonlijke informatie is geanonimiseerd.</p>
                </div>
              </div>

              {/* Navigatie */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <span>←</span>
                  <span>Terug naar bronnen</span>
                </button>

                <button 
                  onClick={handleContinue}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>Verder → Feitelijke situatie</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Project ID display */}
              {id && (
                <div className="mt-6 text-center">
                  <div className="text-xs text-gray-400">
                    Project ID: {(id as string).slice(0, 8)}...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}