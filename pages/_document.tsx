import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <link
            rel="preload"
            href="https://cdn.plaid.com/link/assets/fonts/Inconsolata-Regular.ttf"
            as="font"
            crossOrigin="anonymous"
          />
          <link
            rel="preload"
            href="https://cdn.plaid.com/link/assets/fonts/Inconsolata-Regular.woff2"
            as="font"
            crossOrigin="anonymous"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
