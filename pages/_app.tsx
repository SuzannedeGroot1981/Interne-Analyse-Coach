import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  
  // Don't wrap home page in Layout to avoid double header
  if (router.pathname === '/') {
    return <Component {...pageProps} />
  }
  
  // Use Layout for all other pages
  const Layout = require('../components/Layout').default
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}