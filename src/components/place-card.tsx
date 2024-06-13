"use client"
import type { Place } from "~/server/db/schemas"
import { useMemo } from "react"
import { Card, CardFooter, CardHeader } from "~/components/ui/card"
import { cn } from "~/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Button } from "~/components/ui/button"

export const PlaceCard: React.FC<{
  place: Place
  size?: "sm" | "hero" | "default"
}> = ({ place, size = "default" }) => {
  const sizes = useMemo(() => {
    switch (size) {
      case "sm":
        return { width: 294, height: 126 }
      case "hero":
        return { width: 424, height: 424 }
      default:
        return { width: 400, height: 400 }
    }
  }, [size])

  return (
    <Card
      className={cn(size === "sm" && "border border-l/support shadow-none")}
    >
      <CardHeader className="relative p-0">
        <Image
          src={`https://picsum.photos/${sizes?.width ?? "400"}/${sizes?.height ?? "400"}`}
          {...sizes}
          alt={place.title}
          className="h-full w-full object-cover"
        />
      </CardHeader>
      <CardFooter
        className={cn(
          "flex flex-row justify-between gap-x-4 border-l/support lg:px-6",
          size === "sm" && "p-5"
        )}
      >
        <div className="flex flex-col justify-between">
          <h3
            className={cn(
              size === "hero" && "text-2xl",
              size === "sm" && "text-base",
              "font-bold text-l/support"
            )}
          >
            {place.title}
          </h3>
          <p
            className={cn(
              "font-mono",
              size === "hero" && "text-base",
              size === "sm" && "text-xs"
            )}
          >
            {place.city}, {place.country}
          </p>
        </div>
        <Link href={place.slug} passHref>
          <Button size={size === "sm" ? "sm" : "lg"}>Voir</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
