import { api } from "~/trpc/server"
import PlacePhotoGrid from "~/components/place-photogrid"
import React, { type FC, type ReactElement, Suspense } from "react"

import { Button } from "~/components/ui/button"
import { Badge } from "~/components/ui/badge"
import { twMerge } from "tailwind-merge"

const MarkBlock: FC<{
  content?: ReactElement | string
  header?: string
  footer?: string
  className?: string
  textClass?: string
}> = ({ content, header, footer, className, textClass }) => {
  return (
    <div
      className={twMerge(
        "flex flex-col justify-between rounded-sm border border-l/support p-4",
        className
      )}
    >
      {header ? (
        <span className={twMerge("text-l/tertiary", textClass)}>{header}</span>
      ) : null}
      <h3 className="mb-2 text-5xl">{content}</h3>
      {footer ? (
        <span className={twMerge("text-l/tertiary", textClass)}>{footer}</span>
      ) : null}
    </div>
  )
}
export default async function PlacePage({
  params,
}: {
  params: { placeSlug: string }
}) {
  const place = await api.place.bySlug({ slug: params.placeSlug })
  //create a 10 images array
  const images = Array.from({ length: 6 }, (_, i) => ({
    url: `https://picsum.photos/${i % 2 === 0 ? i * 100 : 200}/${i % 2 !== 0 ? i * 100 : 400}`,
    name: `Image ${i}`,
  }))
  return (
    <div className="container px-4 py-8 lg:py-16">
      <Suspense fallback={<div>Loading...</div>}>
        <div className="flex flex-row gap-x-4">
          <Badge size="md" variant="secondary">
            {place?.country}
          </Badge>
        </div>
        <div className="flex flex-row items-center gap-4 lg:justify-between">
          <h1 className="text-4xl font-medium tracking-tight text-l/support lg:mb-2 lg:text-5xl">
            {place?.title}
            <small className="line-clamp-1 text-right text-lg font-normal text-l/support/50 lg:text-left">
              <span className="hidden lg:inline">, </span>
              {place?.city}
            </small>
          </h1>
          <a
            href={`https://waze.com/ul?ll=${place?.position?.[0]},${place?.position?.[1]}&navigate=yes`}
            target="_blank"
            className="hidden lg:flex"
          >
            <Button size="lg" variant="tertiary">
              Y aller
            </Button>
          </a>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex grow flex-col gap-y-3">
            <div className="flex flex-row gap-x-2">
              {place?.categories?.map(({ category }) => (
                <Badge size="lg" variant="outline" key={category.id}>
                  {category.title}
                </Badge>
              ))}
            </div>
            <div className="my-4 grid grow grid-cols-2 gap-4 lg:grid-cols-4">
              <MarkBlock
                content={
                  <>
                    {place?.mark}
                    <small className="text-2xl">/5</small>
                  </>
                }
                header="Nos éclaireur·euses l'ont noté"
              />
              {place?.isPublic ? (
                <MarkBlock
                  content={<span className="text-3xl">Lieu public</span>}
                  footer="Vous pourrez y croiser d'autres humain·es"
                />
              ) : null}
              <MarkBlock
                content={
                  <>
                    {place?.accessibility}
                    <small className="text-2xl">/5</small>
                  </>
                }
                header="Accessibilité"
              />
              <MarkBlock
                content={
                  <>
                    {place?.traffic}
                    <small className="text-2xl">/5</small>
                  </>
                }
                header="Niveau d'affluence"
              />
            </div>
          </div>
          <div className="w-full lg:w-3/12">
            <PlacePhotoGrid images={images} />
          </div>
        </div>
        <a
          href={`https://waze.com/ul?ll=${place?.position?.[0]},${place?.position?.[1]}&navigate=yes`}
          target="_blank"
          className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
        >
          <Button size="lg" variant="secondary" className="w-full">
            Y aller
          </Button>
        </a>
      </Suspense>
    </div>
  )
}
