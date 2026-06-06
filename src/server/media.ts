import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { auth } from "@clerk/tanstack-react-start/server"
import { createServerFn } from "@tanstack/react-start"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { z } from "zod"

const contentTypes = {
  "image/avif": "avif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const

const imageUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.enum(["image/avif", "image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(10 * 1024 * 1024),
})

type R2Configuration = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicUrl: string
}

function r2Configuration() {
  const configuration = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicUrl: process.env.R2_PUBLIC_URL?.replace(/\/$/, ""),
  }

  if (Object.values(configuration).some((value) => !value)) {
    throw new Error("L'envoi d'images n'est pas encore configuré.")
  }

  return configuration as R2Configuration
}

export const createImageUpload = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => imageUploadSchema.parse(input))
  .handler(async ({ data }) => {
    const { isAuthenticated, userId } = await auth()
    if (!isAuthenticated || !userId) {
      throw new Error("Connexion requise pour envoyer une image.")
    }

    const r2 = r2Configuration()
    const extension = contentTypes[data.contentType]
    const key = `spots/${userId}/${crypto.randomUUID()}.${extension}`
    const client = new S3Client({
      region: "auto",
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
      }),
      { expiresIn: 300 }
    )

    return {
      uploadUrl,
      publicUrl: `${r2.publicUrl}/${key}`,
    }
  })
