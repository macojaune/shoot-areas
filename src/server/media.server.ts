import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { z } from "zod"
import { getOptionalAuth } from "./auth.server"
import { imageUploadSchema } from "./media"

const contentTypes = {
  "image/avif": "avif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const

const configurationSchema = z.object({
  accountId: z.string().regex(/^[a-f0-9]{32}$/),
  accessKeyId: z.string().trim().min(1),
  secretAccessKey: z.string().trim().min(1),
  bucket: z.string().regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/),
  publicUrl: z.url().refine((value) => {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash
  }),
  environment: z.enum(["dev", "prod"]),
})

function r2Configuration() {
  // NODE_ENV is also "production" in a built DEV deployment: never infer this.
  if (process.env.R2_ENVIRONMENT !== "dev" && process.env.R2_ENVIRONMENT !== "prod") {
    throw new Error("L'envoi d'images n'est pas encore configuré correctement.")
  }
  const result = configurationSchema.safeParse({
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicUrl: process.env.R2_PUBLIC_URL?.replace(/\/+$/, ""),
    environment: process.env.R2_ENVIRONMENT,
  })
  if (!result.success) throw new Error("L'envoi d'images n'est pas encore configuré correctement.")
  return result.data
}

export async function createImageUploadHandler(input: unknown) {
  const { isAuthenticated, userId } = await getOptionalAuth()
  if (!isAuthenticated || !userId) {
    throw new Error("Connexion requise pour envoyer une image.")
  }

  const data = imageUploadSchema.parse(input)
  const r2 = r2Configuration()
  const extension = contentTypes[data.contentType]
  const key = `${r2.environment}/spots/${userId}/${crypto.randomUUID()}.${extension}`
  const client = new S3Client({
    region: "auto",
    forcePathStyle: true,
    // The browser supplies the body later; do not sign a checksum of an empty body.
    requestChecksumCalculation: "WHEN_REQUIRED",
    endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2.accessKeyId,
      secretAccessKey: r2.secretAccessKey,
    },
  })
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: key,
      ContentType: data.contentType,
      // Bind the actual PUT length to the validated declaration (max 10 MiB).
      ContentLength: data.size,
    }),
    { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) }
  )

  return { uploadUrl, publicUrl: `${r2.publicUrl}/${key}` }
}
