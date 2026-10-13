export function isClerkPublishableKeyConfigured(key: string | undefined) {
  return /^pk_(test|live)_[A-Za-z0-9_-]{20,}$/.test(key ?? "")
}

export function isClerkConfigured(
  publishableKey: string | undefined,
  secretKey: string | undefined
) {
  return (
    isClerkPublishableKeyConfigured(publishableKey) &&
    /^sk_(test|live)_[A-Za-z0-9_-]{20,}$/.test(secretKey ?? "")
  )
}

export function isClerkClientConfigured() {
  return isClerkPublishableKeyConfigured(
    import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  )
}
