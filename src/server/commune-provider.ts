import { z } from "zod"
import { communeDepartments, type Commune, type CommuneSearchInput } from "~/lib/communes"

export const COMMUNE_RESULT_LIMIT = 8

const officialCommuneSchema = z.object({
  code: z.string().regex(/^[0-9A-Z]{5}$/),
  nom: z.string().min(1).max(200),
  codeDepartement: z.string().regex(/^[0-9A-Z]{2,3}$/),
  centre: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([
      z.number().finite().min(-180).max(180),
      z.number().finite().min(-90).max(90),
    ]),
  }),
})

export async function fetchOfficialCommunes(
  input: CommuneSearchInput,
  request: typeof fetch = fetch
): Promise<Commune[]> {
  if (input.territory === "Autre") return []

  const department = communeDepartments[input.territory]
  const url = new URL("https://geo.api.gouv.fr/communes")
  url.searchParams.set("nom", input.query)
  url.searchParams.set("fields", "nom,code,centre,codeDepartement")
  url.searchParams.set("limit", String(COMMUNE_RESULT_LIMIT))
  url.searchParams.set("boost", "population")
  if (department) url.searchParams.set("codeDepartement", department)
  else url.searchParams.set("zone", "metro")

  const response = await request(url, {
    signal: AbortSignal.timeout(5_000),
    headers: { Accept: "application/json" },
    redirect: "error",
  })
  if (!response.ok) throw new Error("Le service des communes est indisponible.")

  // The provider limit is fixed; cap the payload as well before JSON parsing.
  if (Number(response.headers.get("content-length")) > 32_768) {
    throw new Error("La réponse du service des communes est invalide.")
  }
  const body = await response.text()
  if (body.length > 32_768) throw new Error("La réponse du service des communes est invalide.")
  const rows = z.array(officialCommuneSchema).max(COMMUNE_RESULT_LIMIT).parse(JSON.parse(body))

  return rows
    .filter((row) => department ? row.codeDepartement === department : row.codeDepartement.length === 2)
    .map((row) => ({
      code: row.code,
      name: row.nom,
      departmentCode: row.codeDepartement,
      // GeoJSON is longitude first; Leaflet is latitude first.
      latitude: row.centre.coordinates[1],
      longitude: row.centre.coordinates[0],
    }))
}
