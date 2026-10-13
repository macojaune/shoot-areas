// Isolated process: auth and fetch doubles never affect other tests.
import { mock } from "bun:test"
import assert from "node:assert/strict"
import { migrate } from "drizzle-orm/libsql/migrator"

let userId: string | null = null
mock.module("../../src/server/auth.server", () => ({
  getOptionalAuth: async () => ({ isAuthenticated: Boolean(userId), userId }),
}))

let requests = 0
let available = true
let latitude = 16.2678
globalThis.fetch = (async () => {
  requests += 1
  if (!available) throw new Error("Simulated provider outage")
  return Response.json([{
    code: "97101", nom: "Les Abymes", codeDepartement: "971",
    centre: { type: "Point", coordinates: [-61.4967, latitude] },
  }]) as Response
}) as typeof fetch

const { db } = await import("../../src/server/db/client")
const { communes } = await import("../../src/server/db/schema")
const { searchCommunesForUser } = await import("../../src/server/communes.server")
await migrate(db, { migrationsFolder: "drizzle" })
const input = { territory: "Guadeloupe", query: "Abymes" } as const

await assert.rejects(searchCommunesForUser(input), /Connecte-toi/)
assert.equal(requests, 0)
assert.equal((await db.select().from(communes)).length, 0)

userId = "fixture-contributor"
const first = await searchCommunesForUser(input)
assert.equal(first.communes[0]?.latitude, 16.2678)
assert.equal(first.cached, false)
assert.equal((await db.select().from(communes)).length, 1)
assert.equal(requests, 1)
await searchCommunesForUser(input)
assert.equal(requests, 1, "same query uses memory cache")

latitude = 16.268
await searchCommunesForUser({ ...input, query: "Les Abymes" })
assert.equal((await db.select().from(communes)).length, 1, "INSEE primary key prevents duplicates")
assert.equal((await db.select().from(communes))[0]?.latitude, 16.268, "official centre can refresh")

available = false
const fallback = await searchCommunesForUser({ ...input, query: "ab" })
assert.equal(fallback.cached, true)
assert.equal(fallback.communes[0]?.name, "Les Abymes")
await assert.rejects(searchCommunesForUser({ ...input, query: "unknown" }), /indisponible/)

// 5 previous authenticated lookups and 25 further cached lookups use the quota.
for (let i = 0; i < 25; i++) await searchCommunesForUser(input)
await assert.rejects(searchCommunesForUser(input), /Trop de recherches/)
userId = "fixture-second-contributor"
await searchCommunesForUser(input)
userId = null
await assert.rejects(searchCommunesForUser(input), /Connecte-toi/)
