"use client"
import type { Place } from "~/server/db/schemas"
import { useMemo } from "react"
import { Card, CardFooter, CardHeader } from "~/app/components/ui/card"
import { cn } from "~/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Button } from "~/app/components/ui/button"

export const PlaceCard: React.FC<{
  place: Place
  size?: "sm" | "hero" | "default"
}> = ({ size = "default" }) => {
  const sizes = useMemo(() => {
    switch (size) {
      case "sm":
        return { width: 294, height: 126 }
      case "hero":
        return { width: 424, height: 424 }
      default:
        return { layout: "responsive", width: 400, height: 400 }
    }
  }, [size])

  return (
    <Card
      className={cn(size === "sm" && "border-l/support border shadow-none")}
    >
      <CardHeader className="p-0">
        <Image
          src={`https://picsum.photos/${sizes?.width ?? "400"}/${sizes?.height ?? "400"}`}
          {...sizes}
          alt="Maison de la mangrove"
        />
      </CardHeader>
      <CardFooter
        className={cn(
          "border-l/support flex flex-row justify-between",
          size === "sm" && "p-5"
        )}
      >
        <div className="flex flex-col justify-between">
          <p
            className={cn(
              size === "hero" && "text-2xl",
              size === "sm" && "text-base"
            )}
          >
            Maison de la mangrove
          </p>
          <p
            className={cn(
              "font-mono",
              size === "hero" && "text-base",
              size === "sm" && "text-xs"
            )}
          >
            Les Abymes, Guadeloupe
          </p>
        </div>
        <Link href="" passHref>
          <Button size="lg">Voir</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
