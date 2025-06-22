import { useState } from "react";
import Layout from "../components/Layout";
import { v4 as uuid } from "uuid";
import { saveProject } from "../utils/storage";

export default function Orientatie() {
  const [orgName, setOrgName] = useState("");
  const [level, setLevel] = useState("");
  const levels = ["Gehele organisatie", "Divisie", "Team"];

  function handleContinue() {
    const id = uuid();
    saveProject(id, { flow: "new", meta: { orgName, level } });
    window.location.href = `/sources?id=${id}`;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="container mx-auto px-4 py-8">
          {/* Terug knop */}
          <div className="mb-6">
            <button 
              onClick={() => window.history.back()}
              className="inline-flex items-center text-primary hover:text-green-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Terug naar hoofdmenu
            </button>
          </div>

          {/* Main Content */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Oriëntatie & Afbakening
                </h2>
                <p className="text-gray-600">
                  Definieer de scope en context van je interne analyse
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Organisatienaam */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Organisatienaam
                  </label>
                  <input 
                    value={orgName} 
                    onChange={e => setOrgName(e.target.value)}
                    placeholder="Bijv. Ziekenhuis Leiden, Afdeling Cardiologie, Team ICT..."
                    className="border border-gray-300 rounded-lg w-full p-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Geef de naam van de organisatie, afdeling of eenheid die je wilt analyseren
                  </p>
                </div>

                {/* Analyseniveau */}
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    Analyseniveau
                  </label>
                  <select 
                    value={level} 
                    onChange={e => setLevel(e.target.value)}
                    className="border border-gray-300 rounded-lg w-full p-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  >
                    <option value="">— Kies het niveau van analyse —</option>
                    {levels.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Bepaal op welk organisatieniveau je de analyse wilt uitvoeren
                  </p>
                </div>

                {/* Uitleg over niveaus */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">💡 Analyseniveaus uitgelegd</h4>
                  <div className="text-sm text-blue-700 space-y-2">
                    <p><strong>Gehele organisatie:</strong> Complete organisatie-analyse inclusief alle afdelingen en processen</p>
                    <p><strong>Divisie:</strong> Focus op een specifieke divisie, business unit of grote afdeling</p>
                    <p><strong>Team:</strong> Gedetailleerde analyse van een specifiek team of werkgroep</p>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="mt-8">
                <button 
                  disabled={!orgName || !level} 
                  onClick={handleContinue}
                  className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    orgName && level
                      ? 'bg-primary text-white hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {orgName && level ? (
                    <span className="flex items-center justify-center space-x-2">
                      <span>Verder → Bronneninventarisatie</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  ) : (
                    'Vul beide velden in om verder te gaan'
                  )}
                </button>
              </div>

              {/* Progress indicator */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span>Stap 1 van 3</span>
                  <div className="w-8 h-0.5 bg-gray-300"></div>
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span>Bronnen</span>
                  <div className="w-8 h-0.5 bg-gray-300"></div>
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span>Analyse</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}