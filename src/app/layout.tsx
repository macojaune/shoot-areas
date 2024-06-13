import "~/styles/globals.css"

import { Poppins } from "next/font/google"

import { TRPCReactProvider } from "~/trpc/react"
import Link from "next/link"
import { Button } from "~/components/ui/button"
import { getServerAuthSession } from "~/server/auth"
import LogoutButton from "~/components/logout-button"
import Menu from "~/components/header-menu"
import Footer from "~/components/footer"

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
export const viewport = "width=device-width, initial-scale=1"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerAuthSession()
  return (
    <html lang="fr">
      <body className={`font-sans ${poppins.className}`}>
        <TRPCReactProvider>
          <div className="lg:items-between container flex w-full flex-row justify-center border-b border-l/support bg-white text-l/support">
            <Link
              href="/"
              className="ml-0 p-4 text-center text-3xl font-black text-l/support lg:ml-16 lg:p-5 lg:text-left"
            >
              ShootAreas
            </Link>
            <div className="hidden lg:ml-auto lg:flex lg:flex-row">
              <Menu session={session} />
              {session ? (
                <Link href="/nouveau-lieu" passHref>
                  <Button
                    size="lg"
                    className="h-full border-b-0 border-r-0 border-t-0 text-2xl"
                  >
                    Ajouter un lieu
                  </Button>
                </Link>
              ) : (
                <Link href="/connexion" passHref>
                  <Button
                    size="lg"
                    className="h-full border-b-0 border-r-0 border-t-0 text-2xl"
                  >
                    Connexion
                  </Button>
                </Link>
              )}
            </div>
          </div>
          {children}
          <Footer />
        </TRPCReactProvider>
      </body>
    </html>
  )
}
