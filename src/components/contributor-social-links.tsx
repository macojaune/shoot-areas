import { AtSign, Camera, Globe2, Music2, UsersRound } from "lucide-react"
import type { SocialLink, SocialPlatform } from "~/server/contributor"

const socialPresentation: Record<
  SocialPlatform,
  { label: string; Icon: typeof Camera }
> = {
  instagram: { label: "Instagram", Icon: Camera },
  tiktok: { label: "TikTok", Icon: Music2 },
  x: { label: "X", Icon: AtSign },
  facebook: { label: "Facebook", Icon: UsersRound },
  website: { label: "Site web", Icon: Globe2 },
}

export function ContributorSocialLinks({
  links,
  className = "",
}: {
  links: SocialLink[]
  className?: string
}) {
  if (links.length === 0) return null

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} aria-label="Réseaux sociaux">
      {links.map((link) => {
        const { label, Icon } = socialPresentation[link.platform]

        return (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            title={label}
            aria-label={label}
            className="inline-flex size-10 items-center justify-center border border-line bg-surface text-ink transition hover:bg-sun focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun"
          >
            <Icon className="size-4" aria-hidden="true" />
          </a>
        )
      })}
    </div>
  )
}
