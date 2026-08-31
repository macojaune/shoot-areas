import type { SocialPlatform } from "~/server/contributor"

export const socialPlatformOptions = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X" },
  { value: "facebook", label: "Facebook" },
  { value: "website", label: "Site web" },
] satisfies { value: SocialPlatform; label: string }[]
