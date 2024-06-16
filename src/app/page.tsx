import { getServerAuthSession } from "~/server/auth"
import { api } from "~/trpc/server"
import { Button } from "~/components/ui/button"
import { PlaceCard } from "~/components/place-card"
import PlaceList from "~/components/place-list"
import Link from "next/link"
import { SkeletonCard } from "~/components/ui/skeleton"

export default async function Home() {
  const session = await getServerAuthSession()
  //mock
  const randomPlaceP = await api.place.getRandom()
  const recentPlacesP = await api.place.getRecent()

  const [randomPlace, recentPlaces] = await Promise.all([
    randomPlaceP,
    recentPlacesP,
  ])
  return (
    <main className="flex min-h-screen flex-col text-l/support">
      <div className="container flex grow flex-col bg-l/bg lg:flex-row">
        <div className="order-2 flex flex-col justify-center border-b border-r border-l/support bg-l/primary p-8 lg:order-1 lg:min-h-0 lg:w-2/5 lg:gap-y-8 lg:px-20 lg:py-16">
          <h1 className="text-5xl font-medium tracking-tight lg:text-6xl lg:leading-[72pt]">
            Trouve le lieu de ton prochain shoot
          </h1>
          <p className="text-lg text-l/support">
            Des spots uniques pour tes photos et vidéos.
          </p>
          <div className="flex lg:flex-row lg:gap-x-6">
            <Button size="lg" variant="tertiary">
              Explorer
            </Button>
            <Link href="/nouveau-lieu" passHref>
              <Button size="lg" variant="secondary">
                Ajouter un lieu
              </Button>
            </Link>
          </div>
        </div>
        <div className="order-1 flex w-full flex-col items-center justify-center border-b border-l/support bg-l/secondary p-8 lg:order-2 lg:w-3/5 lg:px-20 lg:py-16">
          {randomPlace ? (
            <Link href={"/" + randomPlace?.slug}>
              <PlaceCard place={randomPlace} />
            </Link>
          ) : (
            <SkeletonCard size="hero" />
          )}
        </div>
      </div>
      <div className="container border-b border-l/support bg-l/bg px-6 py-12 lg:px-24 lg:py-20">
        <div className="mb-10 flex flex-col gap-2">
          <h2 className="text-l/support lg:text-5xl">Les plus récents</h2>
          <p className="font-mono text-xl text-l/support">
            Avec un peu de chance, l'herbe y est encore fraiche…
          </p>
        </div>
        <div className="grid grid-cols-4 gap-x-6">
          {recentPlaces?.length > 0
            ? recentPlaces.map((rp) => (
                <Link href={"/" + rp?.slug} key={rp.id}>
                  <PlaceCard size="sm" place={rp} />
                </Link>
              ))
            : Array(4)
                .fill({})
                .map((_, i) => <SkeletonCard key={i} size="sm" />)}
        </div>
      </div>
      <div className="container bg-l/bg lg:py-12">
        <div className="flex flex-col items-center justify-center lg:mb-10 lg:gap-2">
          <h2 className="text-center text-l/support lg:text-5xl">
            Explore les lieux les plus populaires
          </h2>
          <p className="text-center font-mono text-l/support lg:w-1/2 lg:text-xl">
            Les stars de la scène : plonge dans les lieux qui font flasher nos
            utilisateur·rices !
          </p>
        </div>
        <PlaceList />
      </div>
    </main>
  )
}
