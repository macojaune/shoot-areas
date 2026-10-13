import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"

export const imageUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.enum(["image/avif", "image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(10 * 1024 * 1024),
})

export type ImageUploadInput = z.infer<typeof imageUploadSchema>

export const createImageUpload = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => imageUploadSchema.parse(input))
  .handler(async ({ data }) => {
    const { createImageUploadHandler } = await import("./media.server")
    return createImageUploadHandler(data)
  })
