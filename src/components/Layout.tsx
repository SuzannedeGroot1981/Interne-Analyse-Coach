import Link from 'next/link'
import Image from 'next/image'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            {/* HL Logo */}
            <div className="flex-shrink-0">
              <Image 
                src="/images/Logo_HL_Donkergroen_RGB.png" 
                alt="Hogeschool Leiden Logo" 
                width={40}
                height={30}
                className="h-8 w-auto"
              />
            </div>
            
            {/* Title */}
            <div>
              <Link href="/">
                <h1 className="text-xl font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer">
                  Interne-Analyse-Coach
                </h1>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>© 2024 Hogeschool Leiden • Interne-Analyse-Coach</p>
          </div>
        </div>
      </footer>
    </div>
  )
}