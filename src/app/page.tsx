import Link from "next/link"
import { getServerAuthSession } from "~/server/auth"
import { api } from "~/trpc/server"
import { Button } from "~/app/components/ui/button"
import { PlaceCard } from "~/app/components/place-card"
import PlaceList from "./components/place-list"

export default async function Home() {
  const session = await getServerAuthSession()
  //mock
  const randomPlace = { id: 5 }
  const recentPlaces = await api.place.getRecent()
  const categories = await api.category.all({})

  return (
    <main className="text-l/support flex min-h-screen flex-col">
      <div className="items-between text-l/support border-l/support container flex w-full flex-row border-b bg-white">
        <Link
          href="/"
          className="text-l/support text-3xl font-black lg:ml-16 lg:p-5"
        >
          ShootAreas
        </Link>
        <div className="ml-auto flex lg:flex-row">
          <nav className="lg:py-5"></nav>
          <Link href="" passHref>
            <Button
              size="lg"
              className="h-full border-b-0 border-r-0 border-t-0 text-2xl"
            >
              Connexion
            </Button>
          </Link>
        </div>
      </div>
      <div className="bg-l/bg container flex grow flex-col lg:flex-row">
        <div className="bg-l/primary border-l/support flex flex-col justify-center border-b border-r lg:w-2/5 lg:gap-y-8 lg:px-20 lg:py-16">
          <h1 className="text-5xl font-medium tracking-tight lg:text-6xl lg:leading-[72pt]">
            Trouve le lieu de ton prochain shoot
          </h1>
          <p className="text-l/support text-lg">
            Des spots uniques pour tes photos et vidéos.
          </p>
          <div className="flex lg:flex-row lg:gap-x-6">
            <Button size="lg" variant="tertiary">
              Explorer
            </Button>
            <Button size="lg" variant="secondary">
              Ajouter un lieu
            </Button>
          </div>
        </div>
        <div className="bg-l/secondary border-l/support flex w-full flex-col items-center justify-center border-b lg:w-3/5 lg:px-20 lg:py-16">
          <PlaceCard place={randomPlace} />
        </div>
      </div>
      <div className="bg-l/bg border-l/support container border-b px-6 py-12 lg:px-24 lg:py-20">
        <div className="mb-10 flex flex-col gap-2">
          <h2 className="text-l/support lg:text-5xl">Les plus récents</h2>
          <p className="text-l/support font-mono text-xl">
            Avec un peu de chance, l'herbe y est encore fraiche…
          </p>
        </div>
        <div className=" grid grid-cols-4 gap-x-6">
          {recentPlaces.map((rp) => (
            <PlaceCard size="sm" place={rp} key={rp.id} />
          ))}
        </div>
      </div>
      <div className="border-l/support bg-l/bg container border-b lg:py-12">
        <div className="flex flex-col items-center justify-center lg:mb-10 lg:gap-2">
          <h2 className="text-l/support text-center lg:text-5xl">
            Explore les lieux les plus populaires
          </h2>
          <p className="text-l/support text-center font-mono lg:w-1/2 lg:text-xl">
            Les stars de la scène : plonge dans les lieux qui font flasher nos
            utilisateur·ices !
          </p>
        </div>
        <PlaceList categories={categories} />
      </div>
    </main>
  )
}
