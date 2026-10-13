import { describe, expect, test } from "bun:test"
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { migrate } from "drizzle-orm/libsql/migrator"
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { communeSearchInputSchema, normalizeCommuneName } from "../src/lib/communes"
import { fetchOfficialCommunes } from "../src/server/commune-provider"

const abymes = {
  code: "97101", nom: "Les Abymes", codeDepartement: "971",
  centre: { type: "Point", coordinates: [-61.4967, 16.2678] },
}

function mockRequest(handler: (url: URL, init: RequestInit | undefined) => Response | Promise<Response>) {
  return ((url: URL, init?: RequestInit) => Promise.resolve(handler(url, init))) as typeof fetch
}

describe("commune search", () => {
  test("validates territory, minimum query and upper bounds", () => {
    expect(communeSearchInputSchema.safeParse({ territory: "https://attacker.example", query: "abc" }).success).toBe(false)
    expect(communeSearchInputSchema.safeParse({ territory: "France", query: " " }).success).toBe(false)
    expect(communeSearchInputSchema.safeParse({ territory: "France", query: "a".repeat(101) }).success).toBe(false)
    expect(communeSearchInputSchema.parse({ territory: "Guadeloupe", query: " Abymes " }).query).toBe("Abymes")
  })

  test("searches only the official endpoint, restricts department and converts GeoJSON order", async () => {
    const result = await fetchOfficialCommunes({ territory: "Guadeloupe", query: "Abymes" }, mockRequest((url, init) => {
      expect(url.origin).toBe("https://geo.api.gouv.fr")
      expect(url.searchParams.get("codeDepartement")).toBe("971")
      expect(url.searchParams.get("limit")).toBe("8")
      expect(init?.redirect).toBe("error")
      expect(init?.signal).toBeDefined()
      return Response.json([abymes])
    }))
    expect(result).toEqual([{
      code: "97101", name: "Les Abymes", departmentCode: "971", latitude: 16.2678, longitude: -61.4967,
    }])
  })

  test("keeps same-name communes from a different territory out of results", async () => {
    const result = await fetchOfficialCommunes({ territory: "Martinique", query: "Abymes" }, mockRequest(() => Response.json([abymes])))
    expect(result).toEqual([])
  })

  test("France searches metropolitan France, including Corsica", async () => {
    const result = await fetchOfficialCommunes({ territory: "France", query: "Ajaccio" }, mockRequest((url) => {
      expect(url.searchParams.get("zone")).toBe("metro")
      expect(url.searchParams.has("codeDepartement")).toBe(false)
      return Response.json([{ ...abymes, code: "2A004", nom: "Ajaccio", codeDepartement: "2A" }, abymes])
    }))
    expect(result.map((row) => row.code)).toEqual(["2A004"])
  })

  test("supports the French overseas department and collectivity codes", async () => {
    for (const [territory, department] of [
      ["Martinique", "972"], ["Guyane française", "973"], ["La Réunion", "974"],
      ["Mayotte", "976"], ["Saint-Barthélemy", "977"], ["Saint-Martin", "978"],
    ] as const) {
      await fetchOfficialCommunes({ territory, query: "Saint" }, mockRequest((url) => {
        expect(url.searchParams.get("codeDepartement")).toBe(department)
        return Response.json([])
      }))
    }
  })

  test("manual territory does not contact the provider", async () => {
    let contacted = false
    expect(await fetchOfficialCommunes({ territory: "Autre", query: "Roseau" }, mockRequest(() => {
      contacted = true
      return Response.json([])
    }))).toEqual([])
    expect(contacted).toBe(false)
  })

  test("provider errors and malformed coordinates cannot be presented as valid results", async () => {
    for (const response of [
      new Response("Unavailable", { status: 503 }),
      Response.json([{ ...abymes, centre: { type: "Point", coordinates: [-61, 190] } }]),
      Response.json([{ ...abymes, centre: null }]),
      Response.json(Array.from({ length: 9 }, () => abymes)),
      new Response("bad json"),
      new Response("[]", { headers: { "content-length": "33000" } }),
    ]) {
      await expect(fetchOfficialCommunes({ territory: "Guadeloupe", query: "Abymes" }, mockRequest(() => response))).rejects.toThrow()
    }
    await expect(fetchOfficialCommunes({ territory: "Guadeloupe", query: "Abymes" }, mockRequest(() => {
      throw new DOMException("Timeout", "TimeoutError")
    }))).rejects.toThrow()
  })

  test("cached lookup normalization preserves names while matching accents", () => {
    expect(normalizeCommuneName("  Saint-François  ")).toBe("saint-francois")
  })
})

test("commune migration preserves existing places and is idempotent through the migrator", async () => {
  const folder = await mkdtemp(join(tmpdir(), "shootareas-communes-test-"))
  const migrationsFolder = join(folder, "migrations")
  const client = createClient({ url: `file:${join(folder, "test.db")}` })
  const database = drizzle(client)
  try {
    await cp(new URL("../drizzle/", import.meta.url), migrationsFolder, { recursive: true })
    const journalPath = join(migrationsFolder, "meta/_journal.json")
    const journal = JSON.parse(await readFile(journalPath, "utf8"))
    const oldJournal = { ...journal, entries: journal.entries.filter((entry: { idx: number }) => entry.idx < 4) }
    await writeFile(journalPath, JSON.stringify(oldJournal))
    await migrate(database, { migrationsFolder })
    await client.execute({
      sql: "INSERT INTO places (id, title, slug, description, country, city, created_by_clerk_id, latitude, longitude) VALUES (41, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: ["Fixture migration", "fixture-migration", "Fictional data used only for migration preservation", "Guadeloupe", "Les Abymes", "fixture-user", 16.24, -61.52],
    })
    const before = await client.execute("SELECT * FROM places WHERE id = 41")
    await writeFile(journalPath, JSON.stringify(journal))
    await migrate(database, { migrationsFolder })
    await migrate(database, { migrationsFolder })
    expect((await client.execute("SELECT * FROM places WHERE id = 41")).rows).toEqual(before.rows)
    expect((await client.execute("SELECT count(*) AS total FROM communes")).rows[0]?.total).toBe(0)
    expect((await client.execute("SELECT count(*) AS total FROM __drizzle_migrations")).rows[0]?.total).toBe(journal.entries.length)
  } finally {
    client.close()
    await rm(folder, { recursive: true, force: true })
  }
})

test("authenticated cache persists centres, updates without duplication and falls back during outages", async () => {
  const folder = await mkdtemp(join(tmpdir(), "shootareas-commune-cache-"))
  try {
    const child = Bun.spawn([process.execPath, "run", "tests/fixtures/commune-cache-check.ts"], {
      cwd: new URL("../", import.meta.url).pathname,
      env: {
        ...process.env,
        DATABASE_URL: `file:${join(folder, "test.db")}`,
        TURSO_TOKEN: "",
        TURSO_AUTH_TOKEN: "",
      },
      stdout: "pipe",
      stderr: "pipe",
    })
    const error = await new Response(child.stderr).text()
    expect(await child.exited, error).toBe(0)
  } finally {
    await rm(folder, { recursive: true, force: true })
  }
})
