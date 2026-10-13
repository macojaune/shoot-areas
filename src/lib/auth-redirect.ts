const redirectOrigin = "https://shootareas.invalid"

/** Only accept local destinations, excluding authentication pages to avoid loops. */
export function getSafeAuthRedirect(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  ) {
    return "/"
  }

  try {
    const url = new URL(value, redirectOrigin)
    const pathname = decodeURIComponent(url.pathname)
    if (
      url.origin !== redirectOrigin ||
      pathname.startsWith("//") ||
      /[\\\u0000-\u0020\u007f]/.test(pathname) ||
      /^\/sign-(?:in|up)(?:\/|$)/i.test(pathname)
    ) {
      return "/"
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return "/"
  }
}

export function validateAuthSearch(
  search: Record<string, unknown>
): { redirect_url?: string } {
  return search.redirect_url === undefined
    ? {}
    : { redirect_url: getSafeAuthRedirect(search.redirect_url) }
}
