import { createFileRoute } from "@tanstack/react-router"
import { PlaceForm } from "~/components/place-form"
import { requireUser } from "~/server/auth"
import { listCategories } from "~/server/places"

export const Route = createFileRoute("/nouveau-lieu")({
  beforeLoad: async () => await requireUser(),
  loader: async () => {
    const categories = await listCategories()
    return { categories }
  },
  component: NewPlacePage,
})

function NewPlacePage() {
  const { categories } = Route.useLoaderData()

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
      <PlaceForm categories={categories} />
    </main>
  )
}
