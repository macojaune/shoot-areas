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
          Les informations essentielles pour comprendre qui porte Shootareas,
          où le service est hébergé et comment les contenus communautaires sont
          publiés.
        </p>
        <p className="mt-3 text-sm text-muted">Dernière mise à jour : 31 août 2026.</p>
      </div>

      <div className="mt-12 grid gap-10 border-t border-line pt-10 md:grid-cols-2">
        <LegalSection title="Édition">
          Shootareas est un projet édité par <strong>MarvinL.com</strong>,
          développeur indépendant établi en Guadeloupe, France.
          <br />
          Directeur de la publication : Marvin L.
        </LegalSection>
        <LegalSection title="Contact">
          Pour toute demande liée au site, à un contenu ou à vos données,
          écrivez à{" "}
          <a
            className="font-semibold underline decoration-clay underline-offset-4"
            href="mailto:contact@marvinl.com"
          >
            contact@marvinl.com
          </a>
          .
        </LegalSection>
        <LegalSection title="Hébergement">
          Le site est hébergé par <strong>Hetzner Online GmbH</strong>, société
          immatriculée au registre du commerce d'Ansbach sous le numéro HRB 6089.
          <br />
          Industriestr. 25, 91710 Gunzenhausen, Allemagne.
          <br />
          Téléphone : +49 (0)9831 505-0.
        </LegalSection>
        <LegalSection title="Données personnelles">
          Les données nécessaires au compte et aux contributions sont traitées
          pour faire fonctionner le service et publier les informations choisies
          par les membres. Pour demander l'accès, la rectification ou la
          suppression de vos données, contactez{" "}
          <a
            className="font-semibold underline decoration-clay underline-offset-4"
            href="mailto:contact@marvinl.com"
          >
            contact@marvinl.com
          </a>
          .
        </LegalSection>
        <LegalSection title="Contenus publiés">
          Les descriptions, images et crédits sont fournis par leurs auteur·ices.
          Les personnes qui contribuent doivent disposer des droits nécessaires
          pour publier les contenus et les liens associés. Un contenu illicite,
          inexact ou portant atteinte à un droit peut être signalé à l'adresse de
          contact ci-dessus.
        </LegalSection>
        <LegalSection title="Propriété intellectuelle">
          L'identité visuelle, les textes éditoriaux et le code propre à
          Shootareas sont protégés par le droit applicable. Les contenus ajoutés
          par la communauté, les marques et les contenus de services tiers restent
          la propriété de leurs titulaires respectifs.
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
