import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PeatSense',
  description: 'Geospatial land cover classification platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="h-full">
        {children}
      </body>
    </html>
  )
}