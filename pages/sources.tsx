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
      
      // Initialize with simplified default values for new project
      setRows(Object.fromEntries(S_ROWS.map(r => [r.key, { docs: [], summary: "" }])));
      setIsLoading(false);
      return;
    }
    
    setActualProjectId(finalProjectId);
    
    const p = loadProject(finalProjectId);
    if (p) {
      setRows(p.sources ?? Object.fromEntries(S_ROWS.map(r => [r.key, { docs: [], summary: "" }])));
      setOrgName(p.meta?.orgName || "");
    } else {
      // Initialize with simplified default values if project not found
      setRows(Object.fromEntries(S_ROWS.map(r => [r.key, { docs: [], summary: "" }])));
    }
    setIsLoading(false);
  }, [id]);

  // Auto-save organisatienaam
  useEffect(() => {
    if (actualProjectId && !isLoading) {
      const currentProject = loadProject(actualProjectId) || {};
      saveProject(actualProjectId, {
        ...currentProject,
        meta: { ...(currentProject.meta || {}), orgName }
      });
    }
  }, [orgName, actualProjectId, isLoading]);

  // Auto-save rows
  useEffect(() => {
    if (actualProjectId && !isLoading) {
      const currentProject = loadProject(actualProjectId) || {};
      saveProject(actualProjectId, {
        ...currentProject,
        sources: rows
      });
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

  // Bereken voortgang op basis van beschikbare documenten
  const rowsWithContent = Object.values(rows).filter((row: any) => 
    (row.docs && row.docs.length > 0)
  ).length;
  const progressPercentage = (rowsWithContent / S_ROWS.length) * 100;

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
                    {rowsWithContent} van {S_ROWS.length} onderdelen met documenten
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    {Math.round(progressPercentage)}% documenten geüpload
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
                  Opdracht: Document Upload & AI Samenvatting
                </h3>
                <div className="text-blue-700 space-y-2">
                  <p>
                    <strong>Doel:</strong> Upload relevante documenten per 7S-onderdeel en laat AI automatisch samenvattingen genereren.
                  </p>
                  <p>
                    <strong>Workflow:</strong> Upload documenten → Klik "Samenvat" → AI genereert kernpunten → Gebruik in je analyse.
                  </p>
                  <p>
                    <strong>Focus:</strong> Verzamel <em>interne</em> organisatiedocumenten. Externe factoren komen in een latere opdracht.
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-6">
                Upload documenten per 7S-onderdeel en laat AI automatisch samenvattingen genereren. 
                Deze samenvattingen worden gebruikt als basis voor je interne analyse.
              </p>

              {/* Bronnen Tabel */}
              <div className="overflow-x-auto mb-6">
                <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-4 text-left font-semibold text-gray-700 border-b">Onderdeel</th>
                      <th className="p-4 text-left font-semibold text-gray-700 border-b">Benodigde gegevens</th>
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
                  Tips voor document upload & samenvatting
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
                    <h4 className="font-medium text-gray-800 mb-2">📊 Documenten Upload</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• Upload meerdere documenten per onderdeel</li>
                      <li>• Ondersteunde formaten: PDF, DOCX, CSV, TXT</li>
                      <li>• Klik "Samenvat" voor AI-samenvatting</li>
                      <li>• Samenvattingen worden gebruikt in de analyse</li>
                      <li>• Max 5MB per bestand aanbevolen</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">🔧 Workflow Tips</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• Begin met beschikbare documenten</li>
                      <li>• Upload per 7S-onderdeel afzonderlijk</li>
                      <li>• Gebruik samenvattingen als basis voor analyse</li>
                      <li>• Je kunt later terugkeren om aan te vullen</li>
                      <li>• Focus op interne organisatie-aspecten</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Let op:</strong> Focus op <em>interne</em> documenten en factoren. Externe analyse (concurrentie, markt, PEST) komt in een latere opdracht.
                  </p>
                </div>
              </div>

              {/* Continue Button */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Je kunt ook zonder documenten verder gaan en later aanvullen
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