import { ExternalLink, ImageOff } from "lucide-react"
import { cn } from "~/lib/utils"

type SocialPlatform = "instagram" | "tiktok" | "x"

type SocialMedia = {
  platform: SocialPlatform
  embedUrl: string
}

type SpotMediaProps = {
  url: string
  alt: string
  className?: string
  variant?: "card" | "embed"
}

export function SpotMedia({
  url,
  alt,
  className,
  variant = "card",
}: SpotMediaProps) {
  const socialMedia = getSocialMedia(url)
  if (socialMedia && variant === "embed") {
    return <SocialEmbed media={socialMedia} url={url} />
  }

  if (socialMedia || isSocialUrl(url)) {
    return <SocialFallback media={socialMedia} url={url} className={className} />
  }

  return <img src={url} alt={alt} className={className} loading="lazy" />
}

function getSocialMedia(url: string): SocialMedia | null {
  let parsedUrl: URL

  try {
    parsedUrl = new URL(url)
  } catch {
    return null
  }

  const host = parsedUrl.hostname.replace(/^www\./, "").toLowerCase()
  const segments = parsedUrl.pathname.split("/").filter(Boolean)

  if (host === "instagram.com") {
    const [type, postId] = segments
    if (postId && ["p", "reel", "tv"].includes(type ?? "")) {
      return {
        platform: "instagram",
        embedUrl: `https://www.instagram.com/${type}/${postId}/embed/captioned/`,
      }
    }
  }

  if (host === "tiktok.com") {
    const videoIndex = segments.indexOf("video")
    const videoId = videoIndex >= 0 ? segments[videoIndex + 1] : undefined
    if (videoId && /^\d+$/.test(videoId)) {
      return {
        platform: "tiktok",
        embedUrl: `https://www.tiktok.com/player/v1/${videoId}?music_info=0&description=0`,
      }
    }
  }

  if (host === "x.com" || host === "twitter.com" || host === "mobile.twitter.com") {
    const statusIndex = segments.indexOf("status")
    const postId = statusIndex >= 0 ? segments[statusIndex + 1] : undefined
    if (postId && /^\d+$/.test(postId)) {
      return {
        platform: "x",
        embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${postId}&dnt=true`,
      }
    }
  }

  return null
}

export function isSocialUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase()
    return [
      "instagram.com",
      "tiktok.com",
      "vm.tiktok.com",
      "vt.tiktok.com",
      "x.com",
      "twitter.com",
      "mobile.twitter.com",
    ].includes(host)
  } catch {
    return false
  }
}

function SocialEmbed({ media, url }: { media: SocialMedia; url: string }) {
  const minHeight = {
    instagram: "min-h-[540px]",
    tiktok: "min-h-[560px]",
    x: "min-h-[360px]",
  }[media.platform]

  return (
    <div className="bg-surface">
      <iframe
        src={media.embedUrl}
        title={`Publication ${platformLabel(media.platform)}`}
        className={cn("w-full border-0", minHeight)}
        loading="lazy"
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
      />
      <SocialLink platform={media.platform} url={url} />
    </div>
  )
}

function SocialFallback({
  media,
  url,
  className,
}: {
  media: SocialMedia | null
  url: string
  className?: string
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "flex min-h-40 flex-col justify-between bg-ink p-5 text-paper transition-colors hover:bg-lagoon",
        className
      )}
    >
      <ImageOff className="h-7 w-7" aria-hidden="true" />
      <span className="flex items-center justify-between gap-3 font-semibold">
        <span>
          {media
            ? `Voir le post ${platformLabel(media.platform)}`
            : "Ouvrir le média"}
        </span>
        <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
      </span>
    </a>
  )
}

function SocialLink({ platform, url }: { platform: SocialPlatform; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm font-bold text-clay hover:text-ink"
    >
      Ouvrir le post {platformLabel(platform)}
      <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
    </a>
  )
}

function platformLabel(platform: SocialPlatform) {
  return {
    instagram: "Instagram",
    tiktok: "TikTok",
    x: "X",
  }[platform]
}
