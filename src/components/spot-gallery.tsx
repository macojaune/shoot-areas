import { ExternalLink, ImageOff, X } from "lucide-react"
import * as React from "react"
import { isSocialUrl } from "~/components/spot-media"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import type { SpotImage } from "~/server/places"

export function SpotGallery({ images, title }: { images: SpotImage[]; title: string }) {
  const [selectedImage, setSelectedImage] = React.useState<SpotImage | null>(null)

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {images.map((image) => (
          <GalleryTile key={image.id} image={image} title={title} onOpen={setSelectedImage} />
        ))}
      </div>
      {selectedImage ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/85 p-5"
          role="dialog"
          aria-modal="true"
          aria-label={`Agrandissement de ${selectedImage.caption || title}`}
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="grid max-h-full w-full max-w-5xl gap-3 overflow-auto bg-surface p-4 md:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <p className="min-w-0 truncate font-bold">{selectedImage.caption || title}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fermer l’aperçu"
                onClick={() => setSelectedImage(null)}
              >
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>
            <img
              src={selectedImage.previewUrl || selectedImage.externalUrl}
              alt={selectedImage.caption || title}
              className="max-h-[70vh] w-full object-contain"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-muted">Par {selectedImage.creditName}</span>
              <a
                href={selectedImage.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-bold text-clay hover:text-ink"
              >
                Voir l’original
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function GalleryTile({
  image,
  title,
  onOpen,
}: {
  image: SpotImage
  title: string
  onOpen: (image: SpotImage) => void
}) {
  const hasPreview = Boolean(image.previewUrl || !isSocialUrl(image.externalUrl))

  if (!hasPreview) {
    return (
      <Card className="flex aspect-[4/3] flex-col justify-between p-4">
        <ImageOff className="size-6 text-muted" aria-hidden="true" />
        <div className="grid gap-2">
          <p className="text-sm font-bold">Publication externe</p>
          <a
            href={image.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-clay hover:text-ink"
          >
            Ouvrir le post
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </div>
      </Card>
    )
  }

  return (
    <button
      type="button"
      className="group relative aspect-[4/3] overflow-hidden border border-line bg-paper text-left outline-none focus-visible:ring-2 focus-visible:ring-sun"
      onClick={() => onOpen(image)}
    >
      <img
        src={image.previewUrl || image.externalUrl}
        alt={image.caption || title}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <span className="absolute inset-x-0 bottom-0 bg-ink/85 px-3 py-2 text-sm font-bold text-paper opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {image.caption || `Voir l’image de ${image.creditName}`}
      </span>
    </button>
  )
}
