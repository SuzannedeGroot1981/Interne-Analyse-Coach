# 🏢 Interne Analyse Coach

> **AI-gestuurde tool voor interne analyses en conceptverbetering**
>
> **Gemaakt voor Hogeschool Leiden**

Een professionele Next.js applicatie die organisaties helpt bij het uitvoeren van diepgaande interne analyses en het verbeteren van bestaande concepten met behulp van AI-ondersteuning.

## ✨ Features

### 🎯 **Core Functionaliteiten**
- 🆕 **Nieuwe Interne Analyse**: Start een volledig nieuwe analyse van je organisatie
- 🔄 **Verbeter Bestaand Concept**: Upload en verbeter bestaande analyses
- 💾 **Supabase Database**: Veilige opslag van projecten en voortgang
- 👤 **Anonieme Gebruikers**: Geen registratie vereist, localStorage tracking

### 🛠️ **Technische Stack**
- ⚡ **Next.js 15**: Modern React framework
- 🎨 **Tailwind CSS**: Utility-first styling
- 🗄️ **Supabase**: Backend-as-a-Service database
- 📱 **Responsive Design**: Werkt op alle apparaten
- 🔒 **TypeScript**: Type-safe development

## 🚀 Quick Start

### Stap 1: 📥 Clone & Install
```bash
git clone <repository-url>
cd interne-analyse-coach
npm install
```

### Stap 2: 🔧 Environment Setup
```bash
# Kopieer environment template
cp .env.local.example .env.local

# Edit .env.local en voeg je Supabase credentials toe:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Stap 3: 🗄️ Database Setup
1. **Maak een Supabase project** op [supabase.com](https://supabase.com)
2. **Run de migratie** in de Supabase SQL editor:
   ```sql
   -- Kopieer de inhoud van supabase/migrations/create_projects_table.sql
   ```
3. **Controleer de tabel** in de Supabase dashboard

### Stap 4: 🎉 Start Development
```bash
npm run dev
# Open http://localhost:3000
```

## 📊 Database Schema

### Projects Tabel
```sql
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow text NOT NULL,                    -- 'start' of 'improve'
  data jsonb NOT NULL DEFAULT '{}',      -- Project data en voortgang
  updated_at timestamptz DEFAULT now()
);
```

**Security:**
- ✅ **Row Level Security (RLS)** enabled
- 🌐 **Public access** voor alle operaties (anonieme gebruikers)
- 📈 **Indexes** voor optimale performance

## 🔧 API Usage

### Supabase Client
```typescript
import { supabase, projectsApi, getAnonymousUserId } from '@/lib/supabaseClient'

// Anonieme gebruiker-id verkrijgen
const userId = getAnonymousUserId() // Gebruikt localStorage 'iac_user'

// Project operaties
const projects = await projectsApi.getAll()
const project = await projectsApi.create('start', { title: 'Nieuwe Analyse' })
const updated = await projectsApi.update(id, 'start', { progress: 50 })
```

### Anonymous User System
- 🔑 **Automatische ID generatie**: `iac_${timestamp}_${random}`
- 💾 **localStorage persistence**: Key = `iac_user`
- 🔄 **Cross-session tracking**: Gebruikers behouden hun projecten
- 🛡️ **Privacy-friendly**: Geen persoonlijke data vereist

## 🎨 Design System

### Kleuren
```css
:root {
  --primary-color: #005b4f;    /* Hogeschool Leiden groen */
  --secondary-color: #f3f4f6;  /* Light background */
  --text-color: #1f2937;       /* Dark text */
}
```

### Components
- 📱 **Responsive layouts** met container/max-width
- 🎯 **Consistent styling** met Tailwind utilities
- ♿ **Accessibility** met proper ARIA labels
- 🔄 **Loading states** en error handling

## 📁 Project Structure

```
├── 📄 pages/
│   ├── index.tsx           # Hoofdpagina met navigatie
│   ├── start.tsx           # Nieuwe analyse flow
│   └── improve.tsx         # Verbeter concept flow
├── 🛠️ lib/
│   └── supabaseClient.ts   # Database client & API
├── 🗄️ supabase/
│   └── migrations/         # Database schema
├── 🎨 styles/
│   └── globals.css         # Global styling
└── ⚙️ Configuration files
```

## 🚀 Deployment

### Vercel (Aanbevolen)
```bash
# Deploy naar Vercel
npm install -g vercel
vercel --prod

# Environment variables instellen in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Netlify
```bash
# Build voor productie
npm run build

# Deploy naar Netlify
# Vergeet niet environment variables in te stellen!
```

## 🔒 Security & Privacy

### Data Protection
- ✅ **Anonieme gebruikers**: Geen persoonlijke data opslag
- ✅ **Client-side IDs**: localStorage voor tracking
- ✅ **Public database**: Transparante toegang
- ✅ **No authentication**: Geen wachtwoorden of emails

### Best Practices
- 🔐 **Environment variables** voor gevoelige data
- 🛡️ **Input validation** op alle forms
- 📊 **Error logging** zonder persoonlijke info
- 🔄 **Regular backups** via Supabase

## 🤝 Contributing

### Development Workflow
```bash
# Start development server
npm run dev

# Type checking
npm run lint

# Production build test
npm run build && npm start
```

### Code Standards
- 📝 **TypeScript** voor alle nieuwe code
- 🎨 **Tailwind CSS** voor styling
- 📱 **Mobile-first** responsive design
- ♿ **Accessibility** compliance

## 📚 Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs) - Framework reference
- [Supabase Docs](https://supabase.com/docs) - Database & API
- [Tailwind CSS](https://tailwindcss.com/docs) - Styling framework

### Support
- 🐛 **Bug Reports**: GitHub Issues
- 💡 **Feature Requests**: GitHub Discussions
- 📧 **Contact**: Hogeschool Leiden IT

---

## 🎓 Hogeschool Leiden

**🌐 Gemaakt voor professionele organisatie-ontwikkeling**  
**💚 Powered by Next.js, Supabase & Tailwind CSS**

---

*Interne Analyse Coach v1.0*  
*Last updated: December 2024*