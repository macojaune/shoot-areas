import "~/styles/globals.css"

import { Poppins } from "next/font/google"

import { TRPCReactProvider } from "~/trpc/react"

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-sans",
  subsets: ["latin"],
})

export const metadata = {
  title: "ShootAreas",
  description: "Trouve le lieu de ton prochain shooting photo ou vidéo.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={`font-sans ${poppins.className}`}>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  )
}
