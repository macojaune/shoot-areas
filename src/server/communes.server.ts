import { and, eq, sql } from "drizzle-orm"
import { normalizeCommuneName, type CommuneSearchInput, type CommuneSearchResult } from "~/lib/communes"
import { db } from "./db/client"
import { communes } from "./db/schema"
import { COMMUNE_RESULT_LIMIT, fetchOfficialCommunes } from "./commune-provider"
import { getOptionalAuth } from "./auth.server"

const recentSearches = new Map<string, { expiresAt: number; result: CommuneSearchResult }>()
const userRequests = new Map<string, { expiresAt: number; count: number }>()

export async function searchCommunesForUser(input: CommuneSearchInput): Promise<CommuneSearchResult> {
  const { isAuthenticated, userId } = await getOptionalAuth()
  if (!isAuthenticated || !userId) throw new Error("Connecte-toi pour rechercher une commune.")
  if (input.territory === "Autre") return { communes: [], cached: false }

  const now = Date.now()
  for (const [key, entry] of userRequests) {
    if (entry.expiresAt <= now) userRequests.delete(key)
  }
  const requests = userRequests.get(userId) ?? { expiresAt: now + 60_000, count: 0 }
  if (requests.count >= 30 || (!userRequests.has(userId) && userRequests.size >= 5_000)) {
    throw new Error("Trop de recherches. Réessaie dans une minute ou saisis la commune manuellement.")
  }
  requests.count += 1
  userRequests.set(userId, requests)

  const query = normalizeCommuneName(input.query)
  const cacheKey = `${input.territory}:${query}`
  const previous = recentSearches.get(cacheKey)
  if (previous && previous.expiresAt > now) return previous.result

  let results
  try {
    results = await fetchOfficialCommunes(input)
  } catch {
    // A provider outage must not prevent manual entry. Already known communes
    // remain usable, but are explicitly identified as cached by the UI.
    const rows = await db.select().from(communes)
      .where(and(
        eq(communes.territory, input.territory),
        sql`instr(${communes.normalizedName}, ${query}) > 0`
      ))
      .orderBy(communes.name)
      .limit(COMMUNE_RESULT_LIMIT)
    if (rows.length === 0) {
      throw new Error("La recherche de communes est indisponible. Tu peux saisir la commune manuellement.")
    }
    return { communes: rows, cached: true }
  }

  if (results.length > 0) {
    await db.insert(communes).values(results.map((commune) => ({
      ...commune,
      territory: input.territory,
      normalizedName: normalizeCommuneName(commune.name),
    }))).onConflictDoUpdate({
      target: communes.code,
      set: {
        name: sql`excluded.name`,
        normalizedName: sql`excluded.normalized_name`,
        territory: sql`excluded.territory`,
        departmentCode: sql`excluded.department_code`,
        latitude: sql`excluded.latitude`,
        longitude: sql`excluded.longitude`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    })
  }
  const result = { communes: results, cached: false }
  if (recentSearches.size >= 200) recentSearches.delete(recentSearches.keys().next().value!)
  recentSearches.set(cacheKey, { expiresAt: now + 3_600_000, result })
  return result
}
