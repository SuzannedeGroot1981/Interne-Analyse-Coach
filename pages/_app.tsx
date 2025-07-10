import type { AppProps } from 'next/app'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  // Check if this is the home page
  const isHomePage = Component.name === 'Home'
  
  // Don't wrap home page in Layout to avoid double header
  if (isHomePage) {
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