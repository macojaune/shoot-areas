import { z } from "zod"

export const territories = [
  "Guadeloupe",
  "Martinique",
  "Guyane française",
  "La Réunion",
  "Mayotte",
  "Saint-Barthélemy",
  "Saint-Martin",
  "France",
  "Autre",
] as const

export const communeSearchInputSchema = z.object({
  territory: z.enum(territories),
  query: z.string().trim().min(2).max(100),
})

export type CommuneSearchInput = z.infer<typeof communeSearchInputSchema>
export type Commune = {
  code: string
  name: string
  departmentCode: string
  latitude: number
  longitude: number
}
export type CommuneSearchResult = {
  communes: Commune[]
  cached: boolean
}

export function normalizeCommuneName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

export const communeDepartments: Record<string, string> = {
  Guadeloupe: "971",
  Martinique: "972",
  "Guyane française": "973",
  "La Réunion": "974",
  Mayotte: "976",
  "Saint-Barthélemy": "977",
  "Saint-Martin": "978",
}
