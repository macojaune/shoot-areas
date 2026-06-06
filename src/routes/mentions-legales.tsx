import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales | Shootareas" },
      {
        name: "description",
        content: "Informations légales et règles de publication de Shootareas.",
      },
    ],
  }),
  component: LegalNoticePage,
})

function LegalNoticePage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 md:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase text-muted">Informations</p>
        <h1 className="display-title mt-4 text-5xl md:text-6xl">Mentions légales</h1>
        <p className="mt-5 text-lg leading-8 text-muted">
          Les informations essentielles pour comprendre qui porte Shootareas et
          comment les contenus communautaires sont publiés.
        </p>
      </div>

      <div className="mt-12 grid gap-10 border-t border-line pt-10 md:grid-cols-2">
        <LegalSection title="Édition">
          Shootareas est un projet personnel édité par{" "}
          <a
            className="font-semibold underline decoration-clay underline-offset-4"
            href="https://marvinl.com"
          >
            MarvinL.com
          </a>
          .
        </LegalSection>
        <LegalSection title="Contact">
          Pour toute demande liée au site, à un contenu ou à vos données, utilisez
          les coordonnées publiées sur MarvinL.com.
        </LegalSection>
        <LegalSection title="Contenus publiés">
          Les descriptions, images et crédits sont fournis par leurs auteur·ices.
          Les personnes qui contribuent doivent disposer des droits nécessaires
          pour publier les contenus et les liens associés.
        </LegalSection>
        <LegalSection title="Responsabilité">
          Shootareas aide à préparer un repérage, mais ne remplace pas une
          vérification sur place. L'accès, les horaires, la sécurité et les
          autorisations peuvent évoluer sans préavis.
        </LegalSection>
      </div>
    </main>
  )
}

function LegalSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="section-title text-3xl">{title}</h2>
      <p className="mt-4 leading-7 text-muted">{children}</p>
    </section>
  )
}
