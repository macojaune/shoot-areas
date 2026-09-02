function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return null
  }
}

export async function resolveMediaPreview(url: string) {
  const host = hostname(url)

  try {
    if (host === "tiktok.com" || host === "vm.tiktok.com" || host === "vt.tiktok.com") {
      const response = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(4_000) }
      )
      if (!response.ok) return null
      const data = (await response.json()) as { thumbnail_url?: string }
      return data.thumbnail_url ?? null
    }

    if (host === "instagram.com" && process.env.META_APP_ACCESS_TOKEN) {
      const response = await fetch(
        `https://graph.facebook.com/v23.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${encodeURIComponent(process.env.META_APP_ACCESS_TOKEN)}`,
        { signal: AbortSignal.timeout(4_000) }
      )
      if (!response.ok) return null
      const data = (await response.json()) as { thumbnail_url?: string }
      return data.thumbnail_url ?? null
    }
  } catch {
    // An unavailable social provider must never prevent publication.
  }

  return null
}
