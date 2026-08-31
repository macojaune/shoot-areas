import { useClerk, useUser } from "@clerk/tanstack-react-start"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useServerFn } from "@tanstack/react-start"
import { usePostHog } from "@posthog/react"
import { Bookmark, Camera, Heart, Pencil, Plus, Star, Trash2 } from "lucide-react"
import * as React from "react"
import { socialPlatformOptions } from "~/lib/social-links"
import { PlaceCard } from "~/components/place-card"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Textarea } from "~/components/ui/textarea"
import { requireUser } from "~/server/auth"
import {
  getCurrentContributorProfile,
  type SocialLink,
  updateCurrentContributorProfile,
} from "~/server/contributor"
import { getProfileDashboard } from "~/server/places"

type SocialLinkDraft = SocialLink & { id: string }

let socialLinkId = 0

function toSocialLinkDraft(link: SocialLink): SocialLinkDraft {
  socialLinkId += 1
  return { ...link, id: `social-link-${socialLinkId}` }
}

export const Route = createFileRoute("/profil")({
  beforeLoad: async () => await requireUser(),
  loader: async () => {
    const [profile, dashboard] = await Promise.all([
      getCurrentContributorProfile(),
      getProfileDashboard(),
    ])
    return { profile, dashboard }
  },
  component: ProfilePage,
})

function ProfilePage() {
  const { profile, dashboard } = Route.useLoaderData()
  const { user } = useUser()
  const { openUserProfile } = useClerk()
  const posthog = usePostHog()
  const updateProfile = useServerFn(updateCurrentContributorProfile)
  const [bio, setBio] = React.useState(profile.bio)
  const [socialLinks, setSocialLinks] = React.useState<SocialLinkDraft[]>(() =>
    profile.socialLinks.map(toSocialLinkDraft)
  )
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  )
  const [message, setMessage] = React.useState("")

  function updateSocialLink(index: number, patch: Partial<SocialLink>) {
    setSocialLinks((current) =>
      current.map((link, linkIndex) =>
        linkIndex === index ? { ...link, ...patch } : link
      )
    )
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("saving")
    setMessage("")

    try {
      const nextProfile = await updateProfile({
        data: {
          bio,
          socialLinks: socialLinks.map(({ platform, url }) => ({ platform, url })),
        },
      })
      setBio(nextProfile.bio)
      setSocialLinks(nextProfile.socialLinks.map(toSocialLinkDraft))
      setStatus("saved")
      setMessage("Profil de contribution enregistré.")
      posthog.capture("contributor_profile_updated", {
        social_link_count: nextProfile.socialLinks.length,
        has_bio: Boolean(nextProfile.bio),
      })
    } catch (error) {
      posthog.captureException(error)
      setStatus("error")
      setMessage(
        error instanceof Error ? error.message : "Le profil n'a pas pu être enregistré."
      )
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 lg:py-12">
      <section className="grid gap-6 border-b border-line pb-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="flex min-w-0 flex-wrap items-center gap-5">
          <button
            type="button"
            aria-label="Modifier mon compte Clerk"
            title="Modifier mon compte"
            onClick={() => openUserProfile()}
            className="group relative shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sun"
          >
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt=""
                className="size-20 rounded-full border border-line object-cover shadow-[5px_5px_0_#171717]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="flex size-20 items-center justify-center rounded-full border border-line bg-sun text-2xl font-bold shadow-[5px_5px_0_#171717]">
                {profile.creditName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="absolute -right-1 -bottom-1 grid size-8 place-items-center border border-line bg-sun">
              <Pencil className="size-4" aria-hidden="true" />
            </span>
          </button>
          <div className="min-w-0">
            <p className="font-bold text-muted">Mon espace de repérage</p>
            <h1 className="display-title truncate text-5xl md:text-6xl">
              {profile.creditName}
            </h1>
            <p className="mt-2 text-muted">Tes spots, tes favoris et ton profil public.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/eclaireurs/$userId" params={{ userId: profile.userId }}>
              Voir mon profil
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/nouveau-lieu">
              <Plus className="size-4" aria-hidden="true" />
              Ajouter un spot
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 py-8 md:grid-cols-3" aria-label="Mes statistiques">
        <Stat label="Spots publiés" value={dashboard.stats.spotCount} icon={Camera} />
        <Stat label="Favoris" value={dashboard.stats.favoriteCount} icon={Heart} />
        <Stat label="Avis publiés" value={dashboard.stats.reviewCount} icon={Star} />
      </section>

      <section className="grid gap-10 border-t border-line py-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid content-start gap-10">
          <SpotCollection
            title="Mes spots"
            description="Les repérages que tu as ajoutés à Shootareas."
            spots={dashboard.spots}
            emptyIcon={Camera}
            emptyTitle="Ton premier repérage manque encore à l’appel."
            action={{ to: "/nouveau-lieu", label: "Ajouter un spot" }}
          />
          <SpotCollection
            title="Mes favoris"
            description="Les spots à garder sous le coude pour une prochaine sortie."
            spots={dashboard.favorites}
            emptyIcon={Bookmark}
            emptyTitle="Aucun spot enregistré pour le moment."
            action={{ to: "/", label: "Explorer les spots" }}
          />
        </div>

        <Card className="h-fit p-5">
          <form className="grid gap-5" onSubmit={saveProfile}>
            <div>
              <p className="font-bold text-muted">Profil public</p>
              <h2 className="section-title mt-2 text-3xl">Présente ton regard</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Ton nom et ta photo restent gérés par ton compte. Ici, ajoute ce que
                les autres spoteur·euses peuvent suivre.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="profile-bio">Quelques mots sur tes repérages</Label>
              <Textarea
                id="profile-bio"
                value={bio}
                maxLength={320}
                placeholder="Ce que tu aimes chercher, filmer ou photographier..."
                onChange={(event) => setBio(event.target.value)}
              />
              <p className="text-right text-xs font-semibold text-muted">{bio.length}/320</p>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <Label>Réseaux et portfolio</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={socialLinks.length >= 5}
                  onClick={() =>
                    setSocialLinks((current) => [
                      ...current,
                      toSocialLinkDraft({ platform: "instagram", url: "" }),
                    ])
                  }
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Lien
                </Button>
              </div>

              {socialLinks.length > 0 ? (
                <div className="grid gap-3">
                  {socialLinks.map((link, index) => (
                    <div key={link.id} className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_auto]">
                      <select
                        aria-label={`Réseau ${index + 1}`}
                        value={link.platform}
                        className="h-12 border border-line bg-surface px-3 text-base outline-none focus:ring-2 focus:ring-sun"
                        onChange={(event) =>
                          updateSocialLink(index, {
                            platform: event.target.value as SocialLink["platform"],
                          })
                        }
                      >
                        {socialPlatformOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Input
                        aria-label={`Lien ${index + 1}`}
                        type="url"
                        value={link.url}
                        placeholder="https://..."
                        onChange={(event) => updateSocialLink(index, { url: event.target.value })}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        title="Retirer ce lien"
                        aria-label="Retirer ce lien"
                        onClick={() =>
                          setSocialLinks((current) =>
                            current.filter((_, linkIndex) => linkIndex !== index)
                          )
                        }
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted">
                  Ajoute Instagram, TikTok, X, Facebook ou ton portfolio.
                </p>
              )}
            </div>

            <p
              className={`min-h-5 text-sm font-semibold ${
                status === "error"
                  ? "text-clay"
                  : status === "saved"
                    ? "text-lagoon"
                    : "text-muted"
              }`}
              aria-live="polite"
            >
              {message}
            </p>
            <Button type="submit" disabled={status === "saving"}>
              {status === "saving" ? "Enregistrement..." : "Enregistrer le profil"}
            </Button>
          </form>
        </Card>
      </section>
    </main>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof Camera
}) {
  return (
    <Card className="flex items-start justify-between gap-4 p-5">
      <div>
        <p className="font-bold text-muted">{label}</p>
        <p className="section-title mt-3 text-5xl tabular-nums">{value}</p>
      </div>
      <Icon className="size-5 text-clay" aria-hidden="true" />
    </Card>
  )
}

function SpotCollection({
  title,
  description,
  spots,
  emptyIcon: EmptyIcon,
  emptyTitle,
  action,
}: {
  title: string
  description: string
  spots: Awaited<ReturnType<typeof getProfileDashboard>>["spots"]
  emptyIcon: typeof Camera
  emptyTitle: string
  action: { to: "/" | "/nouveau-lieu"; label: string }
}) {
  return (
    <section>
      <div className="mb-6">
        <h2 className="section-title text-4xl">{title}</h2>
        <p className="mt-2 text-muted">{description}</p>
      </div>
      {spots.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {spots.map((spot) => (
            <PlaceCard key={spot.id} place={spot} />
          ))}
        </div>
      ) : (
        <div className="grid justify-items-start gap-3 border border-dashed border-line bg-surface p-6 text-muted">
          <EmptyIcon className="size-8" aria-hidden="true" />
          <p>{emptyTitle}</p>
          <Button asChild variant="outline">
            <Link to={action.to}>{action.label}</Link>
          </Button>
        </div>
      )}
    </section>
  )
}
