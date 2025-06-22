import { NextApiRequest, NextApiResponse } from 'next'
import { Document, Paragraph, TextRun, Header, Footer, PageNumber, AlignmentType, HeadingLevel } from 'docx'
import { loadProject } from '../../utils/storage'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.',
      allowedMethods: ['POST']
    })
  }

  try {
    const { projectId, projectData } = req.body

    // Haal project data op uit localStorage (via hidden textarea) of gebruik meegegeven data
    let data = projectData
    if (!data && projectId) {
      const project = loadProject(projectId)
      if (!project) {
        return res.status(404).json({ error: 'Project niet gevonden' })
      }
      data = project.data
    }

    if (!data) {
      return res.status(400).json({ error: 'Geen project data beschikbaar' })
    }

    console.log('📄 Start DOCX export...', {
      projectId: projectId || 'direct',
      hasWizardData: !!data.wizardData,
      flow: data.flow
    })

    // Converteer markdown naar Word document
    const doc = await createWordDocument(data)

    // Genereer DOCX buffer
    const { Packer } = await import('docx')
    const buffer = await Packer.toBuffer(doc)

    // Genereer bestandsnaam met timestamp
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-')
    const fileName = `InterneAnalyse_${timestamp}.docx`

    console.log('✅ DOCX export voltooid:', {
      fileName,
      bufferSize: `${(buffer.length / 1024).toFixed(1)}KB`
    })

    // Stuur als download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Content-Length', buffer.length)
    
    return res.send(buffer)

  } catch (error) {
    console.error('❌ DOCX export error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Onbekende fout'
    
    return res.status(500).json({
      error: 'Er is een fout opgetreden bij het exporteren naar Word',
      details: errorMessage,
      timestamp: new Date().toISOString()
    })
  }
}

// Maak Word document van project data
async function createWordDocument(data: any): Promise<Document> {
  const sections = []

  // Header met HL logo (placeholder - in productie zou je het echte logo gebruiken)
  const header = new Header({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: "HOGESCHOOL LEIDEN",
            bold: true,
            size: 20,
            color: "005b4f"
          }),
          new TextRun({
            text: " • Interne Analyse Coach",
            size: 18,
            color: "666666"
          })
        ],
        alignment: AlignmentType.CENTER
      })
    ]
  })

  // Footer met paginanummering
  const footer = new Footer({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: "Pagina ",
            size: 18
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 18
          }),
          new TextRun({
            text: " • Gegenereerd op " + new Date().toLocaleDateString('nl-NL'),
            size: 18,
            color: "666666"
          })
        ],
        alignment: AlignmentType.CENTER
      })
    ]
  })

  // Document inhoud
  const children: Paragraph[] = []

  // Titel pagina
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "INTERNE ANALYSE RAPPORT",
          bold: true,
          size: 32,
          color: "005b4f"
        })
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  )

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.flow === 'start' ? 'Nieuwe Interne Analyse' : 'Verbeter Bestaand Concept',
          size: 24,
          color: "333333"
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 }
    })
  )

  // Project informatie
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Project Informatie",
          bold: true,
          size: 20,
          color: "005b4f"
        })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 }
    })
  )

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Aangemaakt: ${new Date(data.createdAt || Date.now()).toLocaleDateString('nl-NL')}\n`,
          size: 20
        }),
        new TextRun({
          text: `Laatst bijgewerkt: ${new Date(data.updatedAt || Date.now()).toLocaleDateString('nl-NL')}\n`,
          size: 20
        }),
        new TextRun({
          text: `Type analyse: ${data.flow === 'start' ? 'Nieuwe analyse' : 'Conceptverbetering'}`,
          size: 20
        })
      ],
      spacing: { after: 400 }
    })
  )

  // 7S + Financiën analyse
  if (data.wizardData) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "7S-Model + Financiële Analyse",
            bold: true,
            size: 20,
            color: "005b4f"
          })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 600, after: 200 }
      })
    )

    // Definieer de 8 stappen
    const steps = [
      { id: 'strategy', title: 'Strategy - Strategie & Richting', icon: '🎯' },
      { id: 'structure', title: 'Structure - Organisatiestructuur', icon: '🏗️' },
      { id: 'systems', title: 'Systems - Systemen & Processen', icon: '⚙️' },
      { id: 'shared-values', title: 'Shared Values - Gedeelde Waarden', icon: '💎' },
      { id: 'skills', title: 'Skills - Vaardigheden & Competenties', icon: '🎓' },
      { id: 'style', title: 'Style - Leiderschapsstijl', icon: '👑' },
      { id: 'staff', title: 'Staff - Personeel & Mensen', icon: '👥' },
      { id: 'finances', title: 'Financiën - Financiële Situatie', icon: '💰' }
    ]

    // Voor elke stap
    steps.forEach(step => {
      const stepData = data.wizardData[step.id]
      if (stepData && (stepData.current || stepData.desired)) {
        // Stap titel
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${step.icon} ${step.title}`,
                bold: true,
                size: 18,
                color: "333333"
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 }
          })
        )

        // Huidige situatie
        if (stepData.current) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Huidige Situatie:",
                  bold: true,
                  size: 16,
                  color: "666666"
                })
              ],
              spacing: { before: 200, after: 100 }
            })
          )

          // Split tekst in paragrafen
          const currentParagraphs = stepData.current.split('\n\n').filter((p: string) => p.trim())
          currentParagraphs.forEach((paragraph: string) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: paragraph.trim(),
                    size: 20
                  })
                ],
                spacing: { after: 120 }
              })
            )
          })
        }

        // Gewenste situatie
        if (stepData.desired) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Gewenste Situatie:",
                  bold: true,
                  size: 16,
                  color: "666666"
                })
              ],
              spacing: { before: 200, after: 100 }
            })
          )

          const desiredParagraphs = stepData.desired.split('\n\n').filter((p: string) => p.trim())
          desiredParagraphs.forEach((paragraph: string) => {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: paragraph.trim(),
                    size: 20
                  })
                ],
                spacing: { after: 120 }
              })
            )
          })
        }

        // Coach feedback
        if (stepData.feedback) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "🤖 Coach Feedback:",
                  bold: true,
                  size: 16,
                  color: "0066cc"
                })
              ],
              spacing: { before: 200, after: 100 }
            })
          )

          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: stepData.feedback,
                  size: 20,
                  italics: true,
                  color: "0066cc"
                })
              ],
              spacing: { after: 200 }
            })
          )
        }

        // Financiële data (alleen voor financiën stap)
        if (step.id === 'finances' && stepData.financeData) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "📊 Financiële Data:",
                  bold: true,
                  size: 16,
                  color: "666666"
                })
              ],
              spacing: { before: 200, after: 100 }
            })
          )

          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `Bestand: ${stepData.financeData.fileName}\n`,
                  size: 20
                }),
                new TextRun({
                  text: `Rijen: ${stepData.financeData.summary.totalRows} • `,
                  size: 20
                }),
                new TextRun({
                  text: `Kolommen: ${stepData.financeData.summary.totalColumns}`,
                  size: 20
                })
              ],
              spacing: { after: 200 }
            })
          )
        }

        // Voltooid status
        if (stepData.completed) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "✅ Status: Voltooid",
                  bold: true,
                  size: 16,
                  color: "00aa00"
                })
              ],
              spacing: { after: 300 }
            })
          )
        }
      }
    })
  }

  // Samenvatting
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Samenvatting & Vervolgstappen",
          bold: true,
          size: 20,
          color: "005b4f"
        })
      ],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 600, after: 200 }
    })
  )

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Dit rapport bevat een systematische analyse volgens de 7S-methodologie aangevuld met financiële aspecten. ",
          size: 20
        }),
        new TextRun({
          text: "De analyse biedt inzicht in de huidige situatie en gewenste toekomst van de organisatie.\n\n",
          size: 20
        }),
        new TextRun({
          text: "Aanbevolen vervolgstappen:\n",
          bold: true,
          size: 20
        }),
        new TextRun({
          text: "• Prioriteer de belangrijkste verbeterpunten\n",
          size: 20
        }),
        new TextRun({
          text: "• Ontwikkel concrete actieplannen\n",
          size: 20
        }),
        new TextRun({
          text: "• Stel meetbare doelstellingen op\n",
          size: 20
        }),
        new TextRun({
          text: "• Plan regelmatige evaluatiemomenten",
          size: 20
        })
      ],
      spacing: { after: 400 }
    })
  )

  // Footer informatie
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "---\n",
          size: 16,
          color: "cccccc"
        }),
        new TextRun({
          text: "Dit rapport is gegenereerd door de Interne Analyse Coach van Hogeschool Leiden.\n",
          size: 16,
          color: "666666",
          italics: true
        }),
        new TextRun({
          text: `Gegenereerd op: ${new Date().toLocaleString('nl-NL')}`,
          size: 16,
          color: "666666",
          italics: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 600 }
    })
  )

  // Maak document
  return new Document({
    creator: "Interne Analyse Coach - Hogeschool Leiden",
    title: "Interne Analyse Rapport",
    description: "Systematische organisatie-analyse volgens 7S-model",
    sections: [
      {
        headers: {
          default: header
        },
        footers: {
          default: footer
        },
        children: children
      }
    ]
  })
}