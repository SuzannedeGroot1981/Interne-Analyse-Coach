import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { loadProject, saveProject } from "../utils/storage";
import { useRouter } from "next/router";
import { nextLink, prevLink } from "../utils/nav";

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

export default function Sources() {
  const { query: { id } } = useRouter();
  const [rows, setRows] = useState<Record<string, { bron: string, status: string }>>({});
  const [projectMeta, setProjectMeta] = useState<{ orgName?: string, level?: string }>({});
  const [isLoading, setIsLoading] = useState(true);

  /* load & autosave */
  useEffect(() => {
    if (!id) return;
    
    const p = loadProject(id as string);
    if (p) {
      setProjectMeta(p.meta || {});
      setRows(p.sources ?? Object.fromEntries(S_ROWS.map(r => [r.key, { bron: "", status: "Nog verzamelen" }])));
    } else {
      // Initialize with default values if project not found
      setRows(Object.fromEntries(S_ROWS.map(r => [r.key, { bron: "", status: "Nog verzamelen" }])));
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    if (id && !isLoading) {
      const currentProject = loadProject(id as string) || {};
      saveProject(id as string, { ...currentProject, sources: rows });
    }
  }, [rows, id, isLoading]);

  function handle(rowKey: string, field: "bron" | "status", val: string) {
    setRows(r => ({ ...r, [rowKey]: { ...r[rowKey], [field]: val } }));
  }

  function handleBack() {
    window.location.href = prevLink("orientatie");
  }

  function handleContinue() {
    if (id) {
      window.location.href = nextLink(id as string, "start");
    }
  }

  // Bereken voortgang
  const completedRows = Object.values(rows).filter(row => row.status === "Klaar").length;
  const progressPercentage = (completedRows / S_ROWS.length) * 100;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Project laden...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Terug knop */}
          <div className="mb-6">
            <button 
              onClick={handleBack}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Terug naar oriëntatie
            </button>
          </div>

          {/* Main Content */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                      <span className="mr-3">📚</span>
                      Bronneninventarisatie
                    </h2>
                    {projectMeta.orgName && (
                      <p className="text-gray-600">
                        <strong>{projectMeta.orgName}</strong> • {projectMeta.level}
                      </p>
                    )}
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
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                <p className="text-gray-600">
                  Inventariseer welke bronnen en documenten je beschikbaar hebt voor elk onderdeel van de 7S-analyse. 
                  Dit helpt je om gericht informatie te verzamelen en lacunes te identificeren.
                </p>
              </div>

              {/* Bronnen Tabel */}
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-4 text-left font-semibold text-gray-700 border-b">Onderdeel</th>
                      <th className="p-4 text-left font-semibold text-gray-700 border-b">Benodigde gegevens</th>
                      <th className="p-4 text-left font-semibold text-gray-700 border-b">Mijn bronnen</th>
                      <th className="p-4 text-left font-semibold text-gray-700 border-b">Status</th>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tips sectie */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                  <span className="mr-2">💡</span>
                  Tips voor bronneninventarisatie
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                  <div>
                    <h4 className="font-medium mb-2">📄 Documentbronnen</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• Beleidsdocumenten en strategische plannen</li>
                      <li>• Organogrammen en functieomschrijvingen</li>
                      <li>• Procesbeschrijvingen en werkwijzen</li>
                      <li>• Financiële rapportages en budgetten</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">👥 Menselijke bronnen</h4>
                    <ul className="space-y-1 text-xs">
                      <li>• Interviews met sleutelpersonen</li>
                      <li>• Teambijeenkomsten en workshops</li>
                      <li>• Medewerkerstevredenheidsonderzoeken</li>
                      <li>• Observaties van werkprocessen</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Je kunt ook met incomplete bronnen verder gaan en later aanvullen
                </div>
                <button 
                  onClick={handleContinue}
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center space-x-2"
                >
                  <span>Verder → Feitelijke situatie</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Progress indicator */}
              <div className="mt-6 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Oriëntatie</span>
                  <div className="w-8 h-0.5 bg-green-500"></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span>Stap 2 van 3</span>
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