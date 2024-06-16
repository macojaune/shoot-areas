"use client"
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group"
import { Button } from "~/components/ui/button"
import { PlaceCard } from "~/components/place-card"
import { useMemo, useState } from "react"
import { api } from "~/trpc/react"
import { type Category, PlaceWithAll } from "~/server/db/schemas"
import { SkeletonCard } from "~/components/ui/skeleton"
import Link from "next/link"

const PlaceList: React.FC<{}> = () => {
  const [category, setCategory] = useState("trending")

  const { data: categories, refetch } = api.category.all.useQuery({})
  const { data: placesByCategory, isLoading } = api.place.byCategory.useQuery({
    slug: category,
  })
  console.log("placesByCategory", placesByCategory)
  return (
    <div className="">
      <ToggleGroup
        type="single"
        className="lg:my-16"
        value={category}
        onValueChange={(val) => setCategory(val)}
      >
        {categories?.map((cat) => {
          return (
            <ToggleGroupItem
              key={cat.slug}
              variant="outline"
              size="lg"
              value={cat.slug}
              defaultChecked={cat.slug === category}
              pill
            >
              {cat.title}
            </ToggleGroupItem>
          )
        })}
        {/*  todo send to search page*/}
        {categories && categories?.length > 1 && (
          <Button variant="outline" pill className="h-auto px-6 py-3 text-xl">
            Autre
          </Button>
        )}
      </ToggleGroup>
      <div className="grid grid-cols-3 gap-6">
        {placesByCategory && placesByCategory?.length > 0
          ? placesByCategory?.map(({ place, city, country }) => (
              <Link href={"/" + place?.slug} key={place.id}>
                <PlaceCard place={{ ...place, city, country }} />
              </Link>
            ))
          : Array(12)
              .fill({})
              .map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  )
}
export default PlaceList
