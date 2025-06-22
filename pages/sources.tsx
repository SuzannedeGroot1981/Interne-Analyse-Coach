import { useEffect, useState } from "react";
import { setActive, getActive, saveProject, loadProject } from "../utils/storage";
import { useRouter } from "next/router";
import { nextLink, homeLink } from "../utils/nav";
import Head from 'next/head'
import { v4 as uuid } from "uuid";

const S_ROWS = [
  { key:"Strategy", label:"Strategy",    voorbeeld:"Strategisch plan, SWOT" },
  { key:"Structure", label:"Structure",  voorbeeld:"Organogram, RACI" },
  { key:"Systems",   label:"Systems",    voorbeeld:"Procesbeschrijving, ECD" },
  { key:"Shared Values", label:"Shared Values", voorbeeld:"Waardenposter, tevredenheids­onderzoek" },
  { key:"Skills",    label:"Skills",     voorbeeld:"Opleidings­matrix" },
  { key:"Style",     label:"Style",      voorbeeld:"Leiderschaps­sessie, MT-notulen" },
  { key:"Staff",     label:"Staff",      voorbeeld:"HR-dashboard, verzuim" },
  { key:"Financiën", label:"Financiën",  voorbeeld:"Balans, resultaatrekening" },
];

// Helper functie voor file naar base64 conversie
async function fileToB64(f: File) {
  const ab = await f.arrayBuffer();
  return {
    name: f.name,
    type: f.type || "text/plain",
    data: "data:" + (f.type || "") + ";base64," +
          btoa(String.fromCharCode(...new Uint8Array(ab)))
  };
}

function handleDocs(row: string, fileList: FileList | null, rows: Record<string, any>, handle: (rowKey: string, field: string, val: any) => void) {
  const files = Array.from(fileList || []);
  Promise.all(files.map(fileToB64)).then(list => {
    handle(row, "docs", list);
  });
}

async function summarize(row: string, rows: Record<string, any>, handle: (rowKey: string, field: string, val: any) => void) {
  const docs = rows[row]?.docs || [];
  if (!docs.length) return alert("Geen documenten geüpload.");
  
  try {
    const res = await fetch("/api/summarize-docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ element: row, docs })
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Samenvatting mislukt');
    }
    
    const { summary } = await res.json();
    handle(row, "summary", summary);
  } catch (error) {
    console.error('❌ Samenvatting fout:', error);
    alert(`Fout bij samenvatting: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
  }
}

export default function Sources() {
  const { query: { id } } = useRouter();
  const [rows, setRows] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [actualProjectId, setActualProjectId] = useState<string>('');
  const [orgName, setOrgName] = useState("");

  /* load & autosave */
  useEffect(() => {
    let finalProjectId = id as string;
    
    // Als er geen ID is, maak een nieuw project
    if (!finalProjectId) {
      finalProjectId = uuid();
      setActualProjectId(finalProjectId);
      
      // Initialize with default values for new project
      setRows(Object.fromEntries(S_ROWS.map(r => [r.key, { bron: "", status: "Nog verzamelen", survey: false, docs: [] }])));
      setIsLoading(false);
      return;
    }
    
    setActualProjectId(finalProjectId);
    
    const p = loadProject(finalProjectId);
    if (p) {
      setRows(p.sources ?? Object.fromEntries(S_ROWS.map(r => [r.key, { bron: "", status: "Nog verzamelen", survey: false, docs: [] }])));
      setOrgName(p.meta?.orgName || "");
    } else {
      // Initialize with default values if project not found
      setRows(Object.fromEntries(S_ROWS.map(r => [r.key, { bron: "", status: "Nog verzamelen", survey: false, docs: [] }])));
    }
    setIsLoading(false);
  }, [id]);

  // Auto-save organisatienaam
  useEffect(() => {
    if (actualProjectId && !isLoading) {
      const currentProject = loadProject(actualProjectId) || {};
      saveProject(actualProjectId, (p: any) => ({
        ...p,
        meta: { ...(p.meta || {}), orgName }
      }));
    }
  }, [orgName, actualProjectId, isLoading]);

  // Auto-save rows
  useEffect(() => {
    if (actualProjectId && !isLoading) {
      saveProject(actualProjectId, (p: any) => ({
        ...p,
        sources: rows
      }));
    }
  }, [rows, actualProjectId, isLoading]);

  function handle(rowKey: string, field: string, val: any) {
    setRows(o => ({ ...o, [rowKey]: { ...o[rowKey], [field]: val } }));
  }

  function handleBack() {
    window.location.href = homeLink();
  }

  function handleContinue() {
    if (actualProjectId) {
      window.location.href = `/evidence?id=${actualProjectId}`;
    }
  }

  // Bereken voortgang
  const completedRows = Object.values(rows).filter((row: any) => row.status === "Klaar").length;
  const progressPercentage = (completedRows / S_ROWS.length) * 100;

  if (isLoading) {
    return (
      <>
        <Head>
          <title>Bronneninventarisatie - Interne Analyse Coach</title>
          <meta name="description" content="AI-gestuurde tool voor interne analyses en conceptverbetering" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Project laden...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Bronneninventarisatie - Interne Analyse Coach</title>
        <meta name="description" content="AI-gestuurde tool voor interne analyses en conceptverbetering" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Minimale header met alleen terug knop */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Terug knop */}
              <button 
                onClick={handleBack}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Terug naar hoofdmenu
              </button>

              {/* Logo (klein) */}
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
          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                    <span className="mr-3">📚</span>
                    Bronneninventarisatie
                  </h2>
                  <p className="text-gray-600">
                    <strong>Organisatie-niveau analyse</strong> • 7S-Model + Financiën
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {completedRows} van {S_ROWS.length} bronnen klaar
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    {Math.round(progressPercentage)}% voltooid
                  </div>
                </div>
              </div>

              {/* Voortgangsbalk */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Organisatienaam veld */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏢 Organisatienaam
                </label>
                <input 
                  value={orgName} 
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Naam van de organisatie die je analyseert..."
                  className="border rounded w-full p-2 mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Instructies */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                  <span className="mr-2">🎯</span>
                  Opdracht: Interne Analyse op Organisatieniveau
                </h3>
                <div className="text-blue-700 space-y-2">
                  <p>
                    <strong>Doel:</strong> Maak een systematische interne analyse van een organisatie volgens het McKinsey 7S-model aangevuld met financiële aspecten.
                  </p>
                  <p>
                    <strong>Focus:</strong> Analyseer de <em>interne</em> factoren van de organisatie. Externe factoren (concurrentie, markt, PEST) komen in een latere opdracht aan bod.
                  </p>
                  <p>
                    <strong>Stap 1:</strong> Inventariseer hieronder welke bronnen en documenten je beschikbaar hebt voor elk onderdeel. Dit helpt je om gericht informatie te verzamelen.
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Inventariseer welke bronnen en documenten je beschikbaar hebt voor elk onderdeel van de 7S-analyse. 
                Je kunt ook met incomplete bronnen verder gaan en later aanvullen tijdens de analyse.
              </p>

              {/* Bronnen Tabel */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-4 text-left font-semibold text-gray-700 border-b">Onderdeel</th>
                      <th className="p-4 text-left font-semibold text-gray-700 border-b">Benodigde gegevens</th>
                      <th className="p-4 text-left font-semibold text-gray-700 border-b">Mijn bronnen</th>
                      <th className="p-4 text-left font-semibold text-gray-700 border-b">Status</th>
                      <th className="p-4 text-center font-semibold text-gray-700 border-b">Enquête gereed?</th>
                      <th className="p-4 text-center font-semibold text-gray-700 border-b">Documenten</th>
                    </tr>
                  </thead>
                  <tbody>
                    {S_ROWS.map((r, index) => (
                      <tr key={r.key} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                        <td className="p-4">
                          <div className="font-medium text-gray-800">{r.label}</div>
                          {r.key === 'Strategy' && <div className="text-xs text-gray-500">Strategie & Richting</div>}
                          {r.key === 'Structure' && <div className="text-xs text-gray-500">Organisatiestructuur</div>}
                          {r.key === 'Systems' && <div className="text-xs text-gray-500">Systemen & Processen</div>}
                          {r.key === 'Shared Values' && <div className="text-xs text-gray-500">Gedeelde Waarden</div>}
                          {r.key === 'Skills' && <div className="text-xs text-gray-500">Vaardigheden</div>}
                          {r.key === 'Style' && <div className="text-xs text-gray-500">Leiderschapsstijl</div>}
                          {r.key === 'Staff' && <div className="text-xs text-gray-500">Personeel & Mensen</div>}
                          {r.key === 'Financiën' && <div className="text-xs text-gray-500">Financiële Situatie</div>}
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-600">{r.voorbeeld}</div>
                        </td>
                        <td className="p-4">
                          <textarea
                            value={rows[r.key]?.bron || ""}
                            onChange={e => handle(r.key, "bron", e.target.value)}
                            placeholder="Beschrijf welke documenten, systemen of bronnen je hebt..."
                            className="border border-gray-300 rounded-lg p-2 w-full h-20 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                        </td>
                        <td className="p-4">
                          <select 
                            value={rows[r.key]?.status || "Nog verzamelen"}
                            onChange={e => handle(r.key, "status", e.target.value)}
                            className={`border rounded-lg p-2 text-sm font-medium ${
                              rows[r.key]?.status === "Klaar" 
                                ? 'border-green-300 bg-green-50 text-green-700' 
                                : 'border-gray-300 bg-white text-gray-700'
                            }`}
                          >
                            <option value="Nog verzamelen">Nog verzamelen</option>
                            <option value="Klaar">Klaar</option>
                          </select>
                        </td>
                        <td className="p-2 text-center">
                          <input 
                            type="checkbox"
                            checked={rows[r.key]?.survey || false}
                            onChange={e => handle(r.key, "survey", e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                        </td>
                        <td className="p-2">
                          <input 
                            type="file" 
                            multiple 
                            accept=".pdf,.docx,.csv,.txt"
                            onChange={e => handleDocs(r.key, e.target.files, rows, handle)}
                            className="text-xs"
                          />
                          {rows[r.key]?.docs?.length ? (
                            <div className="text-xs text-gray-600">
                              {rows[r.key].docs.length} bestand(en) –&nbsp;
                              <button 
                                className="underline"
                                onClick={() => summarize(r.key, rows, handle)}
                              >
                                Samenvat
                              </button>
                            </div>
                          ) : null}
                          {rows[r.key]?.summary && (
                            <div className="text-xs mt-1 bg-gray-50 p-2 border rounded">
                              <b>Samenvatting:</b><br/>{rows[r.key].summary}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tips sectie */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="mr-2">💡</span>
                  Tips voor bronneninventarisatie
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">📄 Documentbronnen</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• Beleidsdocumenten en strategische plannen</li>
                      <li>• Organogrammen en functieomschrijvingen</li>
                      <li>• Procesbeschrijvingen en werkwijzen</li>
                      <li>• Financiële rapportages en budgetten</li>
                      <li>• Jaarverslagen en managementrapportages</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">📊 Enquêtes</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• Medewerkerstevredenheidsonderzoeken</li>
                      <li>• Cultuur- en klimaatmetingen</li>
                      <li>• 360-graden feedback</li>
                      <li>• Klantentevredenheidsonderzoeken</li>
                      <li>• Competentie-assessments</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">🔧 Documenten Samenvatting</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• Upload documenten per 7S-onderdeel</li>
                      <li>• Klik "Samenvat" voor AI-samenvatting</li>
                      <li>• Gebruik samenvattingen in je analyse</li>
                      <li>• Ondersteunde formaten: PDF, DOCX, CSV, TXT</li>
                      <li>• Max 5MB per bestand aanbevolen</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Let op:</strong> Focus op <em>interne</em> bronnen en factoren. Externe analyse (concurrentie, markt, PEST) komt in een latere opdracht.
                  </p>
                </div>
              </div>

              {/* Continue Button */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Je kunt ook met incomplete bronnen verder gaan en later aanvullen
                </div>
                <button 
                  onClick={handleContinue}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>Verder → Bewijsmateriaal</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Project ID display */}
              <div className="mt-6 text-center">
                <div className="text-xs text-gray-400">
                  Project ID: {actualProjectId.slice(0, 8)}...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}