import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "~/components/ui/button"

export const Route = createFileRoute("/a-propos")({
  head: () => ({
    meta: [
      { title: "À propos | Shootareas" },
      {
        name: "description",
        content:
          "Pourquoi Shootareas partage les bons spots pour photos, vidéos et tournages.",
      },
    ],
  }),
  component: AboutPage,
})

function AboutPage() {
  return (
    <main>
      <section className="border-b border-line bg-sun">
        <div className="mx-auto max-w-5xl px-5 py-14 md:py-20">
          <p className="text-sm font-bold uppercase text-muted">À propos</p>
          <h1 className="display-title mt-4 max-w-4xl text-5xl md:text-7xl">
            Les bons repérages méritent de circuler.
          </h1>
          <p className="mt-6 max-w-3xl text-lg font-medium leading-8 md:text-xl">
            Shootareas rassemble les spots qui font gagner du temps avant un
            shooting, un tournage ou une sortie créative.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-12 md:grid-cols-2 md:py-16">
        <div>
          <h2 className="section-title text-3xl">Le principe</h2>
          <p className="mt-4 leading-7 text-muted">
            Une belle image ne dit pas toujours s'il faut marcher vingt minutes,
            arriver avant le soleil, éviter le dimanche ou laisser le trépied à
            la maison. Ici, les infos terrain comptent autant que le rendu.
          </p>
        </div>
        <div>
          <h2 className="section-title text-3xl">La communauté</h2>
          <p className="mt-4 leading-7 text-muted">
            Chaque spot ajouté peut créditer les créatif·ves qui l'ont repéré,
            avec leurs images et leurs liens. Le but est simple : mieux préparer
            ses sorties, puis rendre le prochain repérage plus facile.
          </p>
        </div>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center">
          <p className="max-w-2xl text-lg font-medium leading-7">
            Tu connais un spot qui mérite d'être préparé correctement ?
          </p>
          <Button asChild size="lg">
            <Link to="/nouveau-lieu">Ajouter un spot</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
