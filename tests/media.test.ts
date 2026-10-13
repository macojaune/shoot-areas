import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import { createHash, createHmac } from "node:crypto"

let viewerId: string | null = "user_fixture_alice"
let authenticated = true
let authUnavailable = false
const clerkAuth = mock(async () => {
  if (authUnavailable) throw new Error("Fixture auth unavailable")
  return { isAuthenticated: authenticated, userId: viewerId }
})
mock.module("@clerk/tanstack-react-start/server", () => ({ auth: clerkAuth }))

const { createImageUploadHandler } = await import("../src/server/media.server")
const fixtureConfiguration = {
  R2_ACCOUNT_ID: "0123456789abcdef0123456789abcdef",
  R2_ACCESS_KEY_ID: "fixture-access-key",
  R2_SECRET_ACCESS_KEY: "fixture-secret-key-only-for-tests",
  R2_BUCKET: "shootareas-fixture",
  R2_PUBLIC_URL: "https://images.example.test/",
  R2_ENVIRONMENT: "dev",
  VITE_CLERK_PUBLISHABLE_KEY: `pk_test_${"fixture".repeat(4)}`,
  CLERK_SECRET_KEY: `sk_test_${"fixture".repeat(4)}`,
  NODE_ENV: "production",
}
const previousEnvironment = Object.fromEntries(Object.keys(fixtureConfiguration).map((key) => [key, process.env[key]]))
const input = { fileName: "fixture.png", contentType: "image/png", size: 2048 }

beforeEach(() => {
  Object.assign(process.env, fixtureConfiguration)
  viewerId = "user_fixture_alice"
  authenticated = true
  authUnavailable = false
})

afterEach(() => {
  for (const [key, value] of Object.entries(previousEnvironment)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

// Independently verify the generated AWS SigV4 URL against the PUT headers.
// The signer itself is real; only credentials and identity are test fixtures.
function signatureMatches(uploadUrl: string, contentType: string, length: number) {
  const url = new URL(uploadUrl)
  const query = url.searchParams
  const encode = (value: string) => encodeURIComponent(value).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
  const canonicalQuery = [...query.entries()]
    .filter(([key]) => key !== "X-Amz-Signature")
    .map(([key, value]) => [encode(key), encode(value)] as const)
    .sort(([ak, av], [bk, bv]) => ak === bk ? av < bv ? -1 : av === bv ? 0 : 1 : ak < bk ? -1 : 1)
    .map(([key, value]) => `${key}=${value}`).join("&")
  const signedHeaders = query.get("X-Amz-SignedHeaders")!
  const headers: Record<string, string> = { host: url.host, "content-type": contentType, "content-length": String(length) }
  const canonicalHeaders = signedHeaders.split(";").map((name) => `${name}:${headers[name]}\n`).join("")
  const canonicalRequest = ["PUT", url.pathname, canonicalQuery, canonicalHeaders, signedHeaders, "UNSIGNED-PAYLOAD"].join("\n")
  const credential = query.get("X-Amz-Credential")!.split("/")
  const scope = credential.slice(1).join("/")
  const toSign = ["AWS4-HMAC-SHA256", query.get("X-Amz-Date"), scope, createHash("sha256").update(canonicalRequest).digest("hex")].join("\n")
  let signingKey = Buffer.from(`AWS4${fixtureConfiguration.R2_SECRET_ACCESS_KEY}`)
  for (const part of credential.slice(1)) signingKey = createHmac("sha256", signingKey).update(part).digest()
  return createHmac("sha256", signingKey).update(toSign).digest("hex") === query.get("X-Amz-Signature")
}

describe("R2 upload authorization", () => {
  test("requires a complete authenticated server session", async () => {
    viewerId = null
    await expect(createImageUploadHandler(input)).rejects.toThrow("Connexion requise")
    viewerId = "user_pending"
    authenticated = false
    await expect(createImageUploadHandler(input)).rejects.toThrow("Connexion requise")
    authenticated = true
    delete process.env.CLERK_SECRET_KEY
    await expect(createImageUploadHandler(input)).rejects.toThrow("Connexion requise")
  })

  test("an authentication failure never grants a signed upload", async () => {
    authUnavailable = true
    await expect(createImageUploadHandler(input)).rejects.toThrow("Fixture auth unavailable")
  })

  test.each([undefined, "", "production", "staging", "DEV", "prod/", "../prod"])(
    "rejects absent or invalid environment %s without using NODE_ENV",
    async (environment) => {
      if (environment === undefined) delete process.env.R2_ENVIRONMENT
      else process.env.R2_ENVIRONMENT = environment
      await expect(createImageUploadHandler(input)).rejects.toThrow("L'envoi d'images n'est pas encore configuré correctement.")
    }
  )

  test.each(["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_PUBLIC_URL"])(
    "refuses an incomplete R2 configuration: %s", async (key) => {
      delete process.env[key]
      await expect(createImageUploadHandler(input)).rejects.toThrow("pas encore configuré")
    }
  )

  test.each(["http://images.example", "https://user:password@images.example", "https://images.example?key=secret", "javascript:alert(1)"])(
    "rejects unsafe public URL configuration: %s", async (publicUrl) => {
      process.env.R2_PUBLIC_URL = publicUrl
      await expect(createImageUploadHandler(input)).rejects.toThrow("pas encore configuré")
    }
  )

  test.each(["dev", "prod"])("builds %s URLs only from server environment and session", async (environment) => {
    process.env.R2_ENVIRONMENT = environment
    const result = await createImageUploadHandler({
      ...input, fileName: "../../overwrite.jpg", environment: environment === "dev" ? "prod" : "dev",
      userId: "user_fixture_victim", key: "prod/overwrite.png", prefix: "prod/", bucket: "victim-bucket",
    })
    const upload = new URL(result.uploadUrl)
    const image = new URL(result.publicUrl)
    expect(upload.hostname).toBe(`${fixtureConfiguration.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`)
    expect(upload.pathname).toMatch(new RegExp(`^/shootareas-fixture/${environment}/spots/user_fixture_alice/[a-f0-9-]{36}\\.png$`))
    expect(image.pathname).toBe(upload.pathname.replace("/shootareas-fixture", ""))
    expect(image.origin).toBe("https://images.example.test")
    expect(result.publicUrl).not.toContain("overwrite")
    expect(result.publicUrl).not.toContain("victim")
    expect(JSON.stringify(result)).not.toContain(fixtureConfiguration.R2_SECRET_ACCESS_KEY)
    const second = await createImageUploadHandler(input)
    expect(second.publicUrl).not.toBe(result.publicUrl)
    viewerId = "user_fixture_bob"
    expect((await createImageUploadHandler(input)).publicUrl).toContain(`/${environment}/spots/user_fixture_bob/`)
  })

  test("the signed PUT enforces MIME type, exact length and a five-minute expiration", async () => {
    const { uploadUrl } = await createImageUploadHandler(input)
    const url = new URL(uploadUrl)
    expect(url.searchParams.get("X-Amz-Expires")).toBe("300")
    expect(url.searchParams.get("X-Amz-SignedHeaders")?.split(";")).toEqual(["content-length", "content-type", "host"])
    expect(signatureMatches(uploadUrl, "image/png", 2048)).toBe(true)
    expect(signatureMatches(uploadUrl, "image/jpeg", 2048)).toBe(false)
    expect(signatureMatches(uploadUrl, "image/png", 2049)).toBe(false)
    const moved = new URL(uploadUrl)
    moved.pathname = moved.pathname.replace("/dev/", "/prod/")
    expect(signatureMatches(moved.href, "image/png", 2048)).toBe(false)
    expect([...url.searchParams.keys()].some((key) => key.startsWith("x-amz-checksum"))).toBe(false)
  })

  test.each([
    { ...input, contentType: "image/svg+xml" }, { ...input, contentType: "text/html" },
    { ...input, size: 0 }, { ...input, size: -1 }, { ...input, size: 10 * 1024 * 1024 + 1 },
    { ...input, size: 1.5 }, { ...input, size: "2048" }, { ...input, fileName: "" },
  ])("rejects unsupported or invalid upload declarations", async (invalid) => {
    await expect(createImageUploadHandler(invalid)).rejects.toThrow()
  })

  test.each([["image/avif", "avif"], ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"]])(
    "accepts %s at the 10 MiB limit", async (contentType, extension) => {
      const result = await createImageUploadHandler({ ...input, contentType, size: 10 * 1024 * 1024 })
      expect(result.publicUrl.endsWith(`.${extension}`)).toBe(true)
      expect(signatureMatches(result.uploadUrl, contentType, 10 * 1024 * 1024)).toBe(true)
    }
  )
})
