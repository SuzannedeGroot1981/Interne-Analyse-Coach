import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="nl">
      <Head>
        {/* Hogeschool Leiden Gantari lettertype */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Gantari:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" 
          rel="stylesheet" 
        />
        {/* Google Material Icons - Sharp style volgens HL huisstijl */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@24,600,0,-25" 
          rel="stylesheet" 
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}