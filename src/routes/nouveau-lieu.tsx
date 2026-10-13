import { createFileRoute } from "@tanstack/react-router"
import { PlaceForm } from "~/components/place-form"
import { requireUser } from "~/server/auth"
import { getCurrentContributorProfile } from "~/server/contributor"
import { listCategories, listPlaces } from "~/server/places"

export const Route = createFileRoute("/nouveau-lieu")({
  beforeLoad: async ({ location }) =>
    await requireUser({ data: { returnTo: location.href } }),
  loader: async () => {
    const [categories, contributorProfile, places] = await Promise.all([
      listCategories(),
      getCurrentContributorProfile(),
      listPlaces({ data: {} }),
    ])
    const existingPlaces = places.map(({ id, title, slug, city, country, latitude, longitude }) => ({
      id, title, slug, city, country, latitude, longitude,
    }))
    return { categories, contributorProfile, existingPlaces }
  },
  component: NewPlacePage,
})

function NewPlacePage() {
  const { categories, contributorProfile, existingPlaces } = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8 max-w-3xl space-y-3">
        <h1 className="display-title text-5xl">Ajouter un spot</h1>
        <p className="text-lg leading-8 text-muted">
          Le plus important est de donner les infos qu'on ne trouve pas en regardant
          seulement une carte : accès, lumière, affluence, contraintes et crédits
          des images.
        </p>
      </div>
      <PlaceForm categories={categories} contributorProfile={contributorProfile} existingPlaces={existingPlaces} />
    </main>
  )
}
